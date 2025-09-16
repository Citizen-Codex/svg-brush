/**
 * Backbone deformation engine for SVG brush drawing
 * Implements the core algorithm for deforming brush geometry along user-drawn paths
 */

import type { Point } from './PathMath.js';
import { pointsToSmoothPath } from './PathMath.js';
import { getBrush, type Brush } from './BrushDefinitions.js';

export interface DeformationOptions {
  /**
   * Multiplier for brush thickness relative to its base geometry.
   * 1 = original width, 2 = double thickness, 0.5 = half thickness.
   */
  strokeWidth?: number;
}

export interface ProjectionResult {
  /** Parameter t (0-1) along the backbone */
  parameter: number;
  /** Point on backbone corresponding to the projection */
  backbonePoint: Point;
  /** Offset from backbone in local coordinates */
  offset: Point;
}

/**
 * Project a brush point onto the straight backbone to find parameter and offset
 */
function projectPointToBackbone(brushPoint: Point): ProjectionResult {
  // All backbones are now straight, so use optimized calculation
  const backboneLength = 100;
  const t = Math.max(0, Math.min(1, brushPoint.x / backboneLength));
  const backbonePoint = { x: t * backboneLength, y: 0 };

  const offset = {
    x: brushPoint.x - backbonePoint.x, // Should be ~0 for good projections
    y: brushPoint.y - backbonePoint.y // Perpendicular offset
  };

  return {
    parameter: t,
    backbonePoint,
    offset
  };
}

/**
 * Get the total length of a path defined by points
 */
function getPathLength(points: Point[]): number {
  if (points.length < 2) return 0;

  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

/**
 * Get a point along the path at parameter t (0-1)
 */
function getPointAt(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const totalLength = getPathLength(points);
  const targetDistance = t * totalLength;

  let currentDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance + segmentLength >= targetDistance) {
      // Interpolate within this segment
      const segmentT = (targetDistance - currentDistance) / segmentLength;
      return {
        x: points[i - 1].x + dx * segmentT,
        y: points[i - 1].y + dy * segmentT
      };
    }

    currentDistance += segmentLength;
  }

  return points[points.length - 1];
}

function getDiffAtIndex(points: Point[], index: number): { dx: number, dy: number, length: number } {
  if (index === 0) index += 1;
  const dx = points[index].x - points[index - 1].x;
  const dy = points[index].y - points[index - 1].y;
  return { dx, dy, length: Math.sqrt(dx * dx + dy * dy) };
}


/**
 * Get the tangent vector at parameter t (0-1)
 */
function getTangentAt(points: Point[], t: number): Point {
  if (points.length < 2) return { x: 1, y: 0 };

  const totalLength = getPathLength(points);
  const targetDistance = t * totalLength;

  let currentDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const { dx, dy, length: l } = getDiffAtIndex(points, i);

    if (currentDistance + l >= targetDistance || i === points.length - 1) {
      const leftTangent = { x: dx / l, y: dy / l };
      if (i + 1 < (points.length - 1)) {

        const { dx: dxr, dy: dyr, length: lr } = getDiffAtIndex(points, i + 1);
        const rightTangent = { x: dxr / lr, y: dyr / lr };

        const merged = { x: (leftTangent.x + rightTangent.x) / 2, y: (leftTangent.y + rightTangent.y) / 2 };
        const mergedLength = Math.sqrt(merged.x * merged.x + merged.y * merged.y);
        return { x: merged.x / mergedLength, y: merged.y / mergedLength };
      }

      if (l > 0) {
        return leftTangent;
      }
    }

    currentDistance += l;
  }

  return { x: 1, y: 0 };
}

/**
 * Get the normal vector at parameter t (0-1)
 */
function getNormalAt(points: Point[], t: number): Point {
  const tangent = getTangentAt(points, t);
  // Rotate tangent 90 degrees counter-clockwise to get normal
  return { x: -tangent.y, y: tangent.x };
}

/**
 * Deform entire brush geometry along a user-drawn path using all brush points
 * This ensures every brush point is preserved and properly positioned
 */
function deformBrush(
  userPathPoints: Point[],
  brush: Brush,
  options?: DeformationOptions
): Point[][] {
  if (userPathPoints.length < 2) return [];
  const deformedShapes: Point[][] = [];
  const thickness = options?.strokeWidth ?? 1;

  for (const shape of brush.outline) {
    const deformedPoints: Point[] = [];
    // Process every single brush outline point
    for (const brushPoint of shape.points) {
      // Project the brush point onto the backbone to get its parameter t
      const projection = projectPointToBackbone(brushPoint);

      // Sample the user path at the corresponding parameter
      const pathPoint = getPointAt(userPathPoints, projection.parameter);
      const normal = getNormalAt(userPathPoints, projection.parameter);

      // Calculate the offset from the backbone
      // y-offset from horizontal backbone, scaled by thickness factor
      const offsetDistance = projection.offset.y * thickness;

      // Calculate the deformed position
      const deformedPoint: Point = {
        x: pathPoint.x + normal.x * offsetDistance,
        y: pathPoint.y + normal.y * offsetDistance
      };

      deformedPoints.push(deformedPoint);
    }
    deformedShapes.push(deformedPoints);
  }

  return deformedShapes;
}

/**
 * Create smooth deformed brush stroke using curves
 */
export function createBrushStroke(
  userPathPoints: Point[],
  brush: Brush | string,
  options?: DeformationOptions
): string {
  if (typeof brush === 'string') {
    brush = getBrush(brush);
  }

  const deformedShapes = deformBrush(userPathPoints, brush, options);

  let pathString = '';
  for (let i = 0; i < deformedShapes.length; i++) {
    const shapePoints = deformedShapes[i];
    pathString += pointsToSmoothPath(shapePoints);
    if (brush.outline[i].closed) {
      pathString += ' Z';
    }
  }
  return pathString;
}

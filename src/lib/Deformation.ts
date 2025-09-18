/**
 * Backbone deformation engine for SVG brush drawing
 * Implements the core algorithm for deforming brush geometry along user-drawn paths
 */

import type { Point } from './PathMath.js';
import type { BrushShape } from './BrushDefinitions.js';
import { pointsToSmoothPath, pointsToPath, pathToPoints } from './PathMath.js';
import { getBrush, type Brush, type FigmaBrushes } from './BrushDefinitions.js';

export interface DeformationOptions {
  /** A string with a brush name from a set of pre-existing brushes 
   * or a Brush object containing a custom brush definition.
   */
  brush: Brush | FigmaBrushes;

  /**
   * Multiplier for brush thickness relative to its base geometry.
   * 1 = original width, 2 = double thickness, 0.5 = half thickness.
   */
  strokeWidth?: number;

  /**
   * Simplification tolerance for path simplification [0-1], defaults to 0.3.
   * Higher values result in more simplified paths.
   */
  simplificationTolerance?: number;

  /**
   * Set to true to add points at user defined locations for the brush stroke.
   * This creates more precise strokes at sharp corners, but can result in
   * a large performance penalty. Only use this option if you need to.
   */
  brushAugmentation?: boolean;
}

export interface ProjectionResult {
  /** Parameter t (0-1) along the backbone */
  parameter: number;
  /** Offset from backbone in local coordinates */
  offset: Point;
}

const backboneLength = 100;
const PARAM_EPSILON = 0.01;

/**
 * Project a brush point onto the straight backbone to find parameter and offset
 */
function projectPointToBackbone(brushPoint: Point): ProjectionResult {
  // All backbones are now straight, so use optimized calculation
  const t = Math.max(0, Math.min(1, brushPoint.x / backboneLength));
  const backbonePoint = { x: t * backboneLength, y: 0 };

  const offset = {
    x: brushPoint.x - backbonePoint.x, // Should be ~0 for good projections
    y: brushPoint.y - backbonePoint.y // Perpendicular offset
  };

  return {
    parameter: t,
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

/**
 * Get the tangent vector at parameter t (0-1)
 */
function getTangentAt(points: Point[], t: number): Point {
  if (points.length < 2) return { x: 1, y: 0 };

  const totalLength = getPathLength(points);
  const targetDistance = t * totalLength;
  let currentDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const l = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance + l >= targetDistance || i === points.length - 1) {
      const leftTangent = { x: dx / l, y: dy / l };

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

function computeUserParameters(points: Point[]): number[] {
  if (points.length === 0) return [];

  const totalLength = getPathLength(points);
  if (totalLength === 0) return [0];

  const parameters: number[] = [0];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    accumulated += segmentLength;
    const parameter = Math.min(1, accumulated / totalLength) * backboneLength;
    parameters.push(parameter);
  }

  // Deduplicate parameters that are extremely close to each other.
  const unique: number[] = [];
  for (const parameter of parameters) {
    if (unique.length === 0 || Math.abs(parameter - unique[unique.length - 1]) > PARAM_EPSILON) {
      unique.push(parameter);
    }
  }

  if (unique[unique.length - 1] < backboneLength - PARAM_EPSILON) {
    unique.push(backboneLength);
  }

  return unique;
}

function lowerBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function upperBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] <= target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function interpolatePoint(prev: Point, curr: Point, prevParam: number, currParam: number, targetParam: number): Point {
  const denominator = currParam - prevParam;
  if (Math.abs(denominator) < PARAM_EPSILON) {
    return {
      x: (prev.x + curr.x) / 2,
      y: (prev.y + curr.y) / 2
    };
  }

  const ratio = (targetParam - prevParam) / denominator;
  const clampedRatio = Math.min(Math.max(ratio, 0), 1);

  return {
    x: prev.x + (curr.x - prev.x) * clampedRatio,
    y: prev.y + (curr.y - prev.y) * clampedRatio
  };
}

function augmentBrushShape(outline: BrushShape[], userPathPoints: Point[]): BrushShape[] {
  const userParameters = computeUserParameters(userPathPoints);
  if (userParameters.length <= 1) {
    return outline
  }

  const augmentedShapes: BrushShape[] = [];

  for (const shape of outline) {
    if (shape.points.length < 2) {
      augmentedShapes.push({
        closed: shape.closed,
        points: shape.points.map((point) => ({ ...point }))
      });
      continue;
    }

    const parameters = shape.points.map((point) => point.x);
    const augmentedPoints: Point[] = [{ ...shape.points[0] }];

    for (let i = 1; i < shape.points.length; i++) {
      const prev = shape.points[i - 1];
      const curr = shape.points[i];

      const prevParam = parameters[i - 1];
      const currParam = parameters[i];

      const minParam = Math.min(prevParam, currParam);
      const maxParam = Math.max(prevParam, currParam);

      const lower = minParam + PARAM_EPSILON;
      const upper = maxParam - PARAM_EPSILON;

      if (upper > lower) {
        const startIndex = lowerBound(userParameters, lower);
        const endIndex = upperBound(userParameters, upper);

        if (startIndex < endIndex) {
          if (currParam >= prevParam) {
            for (let index = startIndex; index < endIndex; index++) {
              const targetParam = userParameters[index];
              augmentedPoints.push(interpolatePoint(prev, curr, prevParam, currParam, targetParam));
            }
          } else {
            for (let index = endIndex - 1; index >= startIndex; index--) {
              const targetParam = userParameters[index];
              augmentedPoints.push(interpolatePoint(prev, curr, prevParam, currParam, targetParam));
            }
          }
        }
      }

      augmentedPoints.push({ ...curr });
    }

    augmentedShapes.push({
      closed: shape.closed,
      points: augmentedPoints
    });
  }

  return augmentedShapes;
}

/**
 * Deform entire brush geometry along a user-drawn path using all brush points
 * This ensures every brush point is preserved and properly positioned
 */
export function deformBrush(
  userPathPoints: Point[],
  brush: Brush,
  thickness: number = 1,
  brushAugmentation: boolean = false
): Point[][] {
  if (userPathPoints.length < 2) return [];
  const deformedShapes: Point[][] = [];

  const brushShape = brushAugmentation ? augmentBrushShape(brush.outline, userPathPoints) : brush.outline;

  for (const shape of brushShape) {
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
  pathOrPoints: Point[] | string,
  options?: DeformationOptions
): string {
  let brush: Brush;

  let points: Point[];

  if (typeof pathOrPoints === 'string') {
    const shapes = pathToPoints(pathOrPoints);
    points = shapes.map(shape => shape.points).flat();
  } else {
    points = pathOrPoints;
  }

  if (options?.brush) {
    if (typeof options.brush === 'string') {
      brush = getBrush(options.brush);
    } else {
      brush = options.brush;
    }
  } else {
    brush = getBrush('Figma Blockbuster');
  }

  const deformedShapes = deformBrush(points, brush, options?.strokeWidth, options?.brushAugmentation);

  let pathString = '';
  for (let i = 0; i < deformedShapes.length; i++) {
    const shapePoints = deformedShapes[i];

    if (options?.brushAugmentation) {
      pathString += pointsToPath(shapePoints, options?.simplificationTolerance);
    } else {
      pathString += pointsToSmoothPath(shapePoints, options?.simplificationTolerance);
    }

    if (brush.outline[i].closed) {
      pathString += ' Z';
    }
  }
  return pathString;
}

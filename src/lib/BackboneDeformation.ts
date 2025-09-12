/**
 * Backbone deformation engine for SVG brush drawing
 * Implements the core algorithm for deforming brush geometry along user-drawn paths
 */

import type { Point } from './PathMath.js';
import { PathMath } from './PathMath.js';
import type { BrushDefinition } from './BrushGeometry.js';

export interface ProjectionResult {
  /** Parameter t (0-1) along the backbone */
  parameter: number;
  /** Point on backbone corresponding to the projection */
  backbonePoint: Point;
  /** Offset from backbone in local coordinates */
  offset: Point;
}

export class BackboneDeformation {
  /**
   * Project a brush point onto the straight backbone to find parameter and offset
   */
  static projectPointToBackbone(brushPoint: Point): ProjectionResult {
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
  private static getPathLength(points: Point[]): number {
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
  private static getPointAt(points: Point[], t: number): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    if (t <= 0) return points[0];
    if (t >= 1) return points[points.length - 1];

    const totalLength = this.getPathLength(points);
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
  private static getTangentAt(points: Point[], t: number): Point {
    if (points.length < 2) return { x: 1, y: 0 };

    const totalLength = this.getPathLength(points);
    const targetDistance = t * totalLength;

    let currentDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (currentDistance + segmentLength >= targetDistance || i === points.length - 1) {
        // Normalize the tangent
        if (segmentLength > 0) {
          return { x: dx / segmentLength, y: dy / segmentLength };
        }
      }

      currentDistance += segmentLength;
    }

    return { x: 1, y: 0 };
  }

  /**
   * Get the normal vector at parameter t (0-1)
   */
  private static getNormalAt(points: Point[], t: number): Point {
    const tangent = this.getTangentAt(points, t);
    // Rotate tangent 90 degrees counter-clockwise to get normal
    return { x: -tangent.y, y: tangent.x };
  }

  /**
   * Deform entire brush geometry along a user-drawn path using all brush points
   * This ensures every brush point is preserved and properly positioned
   */
  static deformBrush(brush: BrushDefinition, userPathPoints: Point[]): Point[][] {
    if (userPathPoints.length < 2) return [];
    const deformedShapes: Point[][] = [];

    for (const shape of brush.outline) {
      const deformedPoints: Point[] = [];
      // Process every single brush outline point
      for (const brushPoint of shape.points) {
        // Project the brush point onto the backbone to get its parameter t
        const projection = this.projectPointToBackbone(brushPoint);

        // Sample the user path at the corresponding parameter
        const pathPoint = this.getPointAt(userPathPoints, projection.parameter);
        const normal = this.getNormalAt(userPathPoints, projection.parameter);

        // Calculate the offset from the backbone
        const offsetDistance = projection.offset.y; // y-offset from horizontal backbone

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
  static createSmoothDeformedStroke(brush: BrushDefinition, userPathPoints: Point[]): string {
    const deformedShapes = this.deformBrush(brush, userPathPoints);

    let pathString = '';
    for (let i = 0; i < deformedShapes.length; i++) {
      const shapePoints = deformedShapes[i];
      pathString += PathMath.pointsToSmoothSVGPath(shapePoints);
      if (brush.outline[i].closed) {
        pathString += ' Z';
      }
    }
    return pathString;
  }
}

/**
 * Core mathematical utilities for SVG path operations
 * Handles path analysis, tangent/normal calculations, and coordinate transformations
 */
import type { BrushShape } from './BrushGeometry.js';
import simplify from 'simplify-js';

export interface Point {
  x: number;
  y: number;
}

export class PathMath {
  /**
 * Create an SVG path string from an array of points
 */
  static pointsToSVGPath(points: Point[]): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }

  /**
   * Create a smooth SVG path string using quadratic bezier curves
   */
  static pointsToSmoothSVGPath(rawPoints: Point[], simplificationTolerance: number = 0.3): string {
    if (rawPoints.length === 0) return '';
    if (rawPoints.length === 1) return `M ${rawPoints[0].x} ${rawPoints[0].y}`;
    if (rawPoints.length === 2) {
      return `M ${rawPoints[0].x} ${rawPoints[0].y} L ${rawPoints[1].x} ${rawPoints[1].y}`;
    }
    const points = simplify(rawPoints, simplificationTolerance);

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = current.x;
      const controlY = current.y;
      const endX = (current.x + next.x) / 2;
      const endY = (current.y + next.y) / 2;

      path += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
    }

    // Add final point
    const lastPoint = points[points.length - 1];
    path += ` T ${lastPoint.x} ${lastPoint.y}`;

    return path;
  }

  static shapesToSmoothSVGPath(shapes: BrushShape[]): string {
    let pathString = '';

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      pathString += PathMath.pointsToSmoothSVGPath(shape.points);
      if (shape.closed) {
        pathString += ' Z';
      }
    }
    return pathString;
  }
}

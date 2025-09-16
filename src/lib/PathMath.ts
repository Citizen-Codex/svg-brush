/**
 * Core mathematical utilities for SVG path operations
 * Handles path analysis, tangent/normal calculations, and coordinate transformations
 */
import type { BrushShape } from './BrushDefinitions.js';
import simplify from 'simplify-js';
import svgParser from 'svg-path-parser';

const { parseSVG, makeAbsolute } = svgParser;

export interface Point {
  x: number;
  y: number;
}

/**
 * Create an SVG path string from an array of points
 */
export function pointsToPath(points: Point[]): string {
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
export function pointsToSmoothPath(rawPoints: Point[], simplificationTolerance: number = 0.3): string {
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

export function shapesToSmoothPath(shapes: BrushShape[]): string {
  let pathString = '';

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    pathString += pointsToSmoothPath(shape.points);
    if (shape.closed) {
      pathString += ' Z';
    }
  }
  return pathString;
}

/**
 * Convert SVG path string to outline points
 * This is a basic implementation that handles M, L, C, Q, Z commands
 */
export function pathToPoints(pathData: string, samples: number = 2): BrushShape[] {
  const shapes: BrushShape[] = [];
  let currentPoints: Point[] | null = null;

  const parsedCommands = parseSVG(pathData);
  const commands = makeAbsolute(parsedCommands);

  for (const command of commands) {
    if (command.code === 'M') {
      if (currentPoints) {
        shapes.push({ points: currentPoints, closed: false }); // Previous one was not closed by Z
      }
      currentPoints = [];
      currentPoints.push({ x: command.x, y: command.y });
    } else if (currentPoints) {
      switch (command.code) {
        case 'L':
        case 'H':
        case 'V':
          currentPoints.push({ x: command.x, y: command.y });
          break;
        case 'C': {
          const startPoint = { x: command.x0, y: command.y0 };
          const cp1 = { x: command.x1, y: command.y1 };
          const cp2 = { x: command.x2, y: command.y2 };
          const endPoint = { x: command.x, y: command.y };

          for (let t = 1; t <= samples; t++) {
            const u = t / samples;
            const point = sampleCubicBezier(startPoint, cp1, cp2, endPoint, u);
            currentPoints.push(point);
          }
          break;
        }
        case 'Q': {
          const startPoint = { x: command.x0, y: command.y0 };
          const cp = { x: command.x1, y: command.y1 };
          const endPoint = { x: command.x, y: command.y };

          for (let t = 1; t <= samples; t++) {
            const u = t / samples;
            const point = sampleQuadraticBezier(startPoint, cp, endPoint, u);
            currentPoints.push(point);
          }
          break;
        }
        case 'Z':
          if (currentPoints.length > 0) {
            if (command.x0 !== command.x || command.y0 !== command.y) {
              currentPoints.push({ x: command.x, y: command.y });
            }
            shapes.push({ points: currentPoints, closed: true });
            currentPoints = null;
          }
          break;
      }
    }
  }

  if (currentPoints) {
    shapes.push({ points: currentPoints, closed: false });
  }

  return shapes;
}

/**
 * Sample a point on a cubic bezier curve at parameter t (0-1)
 */
function sampleCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  };
}

/**
 * Sample a point on a quadratic bezier curve at parameter t (0-1)
 */
function sampleQuadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;

  return {
    x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
    y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
  };
}

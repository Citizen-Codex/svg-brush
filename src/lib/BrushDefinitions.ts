/**
 * Brush geometry system for SVG brush drawing
 * Defines brush shapes with their backbone and outline points
 */

import type { Point } from './PathMath.js';
import { shapesToSmoothPath, pointsToPath, pathToPoints } from './PathMath.js';
import figmaBrushes from './FigmaBrushes.js';

export interface BrushShape {
  points: Point[];
  closed: boolean;
}

export interface Brush {
  name: string;
  outline: BrushShape[];
  path: string;
}

export type FigmaBrushes = typeof figmaBrushes[number]['name'];

/**
 * As a matter of convention, brush backbones are assumed to be from (0,0) to (100,0)
 */

export function createPointsBrush(
  points: Point[],
  name: string = 'Points Brush'
): Brush {
  return {
    name,
    outline: [
      {
        points,
        closed: false
      }
    ],
    path: pointsToPath(points)
  };
}

export function createPathBrush(
  pathData: string,
  offset: number = 0,
  name: string = 'Path Brush'
): Brush {
  const shapes = pathToPoints(pathData);
  shapes.forEach((shape) => {
    shape.points = shape.points.map((point) => ({ x: point.x, y: point.y - offset }));
  });

  return {
    name,
    outline: shapes,
    path: shapesToSmoothPath(shapes)
  };
}

export function getBrush(name: string): Brush {
  const brushDetails = figmaBrushes.find((brush) => brush.name === name);
  if (!brushDetails) throw new Error(`Brush "${name}" not found`);
  return createPathBrush(brushDetails.path, brushDetails.offset, brushDetails.name);
}

export function getAllBrushes(): Brush[] {
  const width = 20;
  const halfWidth = width / 2;
  const segments = 32;

  const roundBrushPoints = [];
  const textureBrushPoints = [];
  const calligraphyBrushPoints = [
    { x: 0, y: -halfWidth * 0.3 }, // Thin start
    { x: 20, y: -halfWidth }, // Expand
    { x: 50, y: -halfWidth }, // Wide middle
    { x: 80, y: -halfWidth }, // Wide middle
    { x: 100, y: -halfWidth * 0.3 }, // Thin end
    { x: 100, y: halfWidth * 0.3 }, // Thin end (bottom)
    { x: 80, y: halfWidth }, // Wide middle (bottom)
    { x: 50, y: halfWidth }, // Wide middle (bottom)
    { x: 20, y: halfWidth }, // Expand (bottom)
    { x: 0, y: halfWidth * 0.3 } // Thin start (bottom)
  ];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    roundBrushPoints.push({
      x: 50 + (width / 2) * Math.cos(angle), // Center at backbone midpoint
      y: (width / 2) * Math.sin(angle)
    });
  }

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const angle = t * 2 * Math.PI;
    const noise = (Math.sin(angle * 6) + Math.cos(angle * 8)) * 0.2;
    const radius = width * (1 + noise);

    textureBrushPoints.push({
      x: 50 + radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    });
  }

  return [
    ...figmaBrushes.map((brush) =>
      createPathBrush(brush.path, brush.offset, brush.name)
    ),
    createPointsBrush(roundBrushPoints, 'Round Brush'),
    createPointsBrush(calligraphyBrushPoints, 'Calligraphy Brush'),
    createPointsBrush(textureBrushPoints, 'Texture Brush')
  ];
}

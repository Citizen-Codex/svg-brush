/**
 * Brush geometry system for SVG brush drawing
 * Defines brush shapes with their backbone and outline points
 */

import type { Point } from './PathMath.js';
import { PathMath } from './PathMath.js';
import figmaBrushes from './FigmaBrushes.js';
import svgParser from 'svg-path-parser';

const { parseSVG, makeAbsolute } = svgParser;

export interface BrushShape {
	points: Point[];
	closed: boolean;
}

export interface BrushDefinition {
	id: string;
	name: string;
	outline: BrushShape[];
	path: string;
}

/**
 * As a matter of convention, brush backbones are assumed to be from (0,0) to (100,0)
 */

/**
 * Predefined brush geometries
 */
export class BrushPresets {
	static createPointsBrush(
		points: Point[],
		id: string = 'points',
		name: string = 'Points Brush'
	): BrushDefinition {
		return {
			id,
			name,
			outline: [
				{
					points,
					closed: false
				}
			],
			path: PathMath.pointsToSVGPath(points)
		};
	}

	static createPathBrush(
		pathData: string,
		offset: number = 0,
		id: string = 'path',
		name: string = 'Path Brush'
	): BrushDefinition {
		const shapes = BrushGeometryUtils.svgPathToPoints(pathData);
		shapes.forEach((shape) => {
			shape.points = shape.points.map((point) => ({ x: point.x, y: point.y - offset }));
		});

		return {
			id,
			name,
			outline: shapes,
			path: PathMath.shapesToSmoothSVGPath(shapes)
		};
	}

	static getAllPresets(): BrushDefinition[] {
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
				this.createPathBrush(brush.path, brush.offset, brush.id, brush.name)
			),
			this.createPointsBrush(roundBrushPoints, 'round', 'Round Brush'),
			this.createPointsBrush(calligraphyBrushPoints, 'calligraphy', 'Calligraphy Brush'),
			this.createPointsBrush(textureBrushPoints, 'texture', 'Texture Brush')
		];
	}
}

/**
 * Utility functions for brush geometry manipulation
 */
export class BrushGeometryUtils {
	/**
	 * Get all outline points as a flat array (useful for deformation)
	 */
	static getOutlinePoints(brush: BrushDefinition): Point[] {
		return brush.outline.flatMap((s) => s.points);
	}

	/**
	 * Convert SVG path string to outline points
	 * This is a basic implementation that handles M, L, C, Q, Z commands
	 */
	static svgPathToPoints(pathData: string, samples: number = 2): BrushShape[] {
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
							const point = this.sampleCubicBezier(startPoint, cp1, cp2, endPoint, u);
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
							const point = this.sampleQuadraticBezier(startPoint, cp, endPoint, u);
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
	private static sampleCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
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
	private static sampleQuadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
		const u = 1 - t;
		const uu = u * u;
		const tt = t * t;

		return {
			x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
			y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
		};
	}
}

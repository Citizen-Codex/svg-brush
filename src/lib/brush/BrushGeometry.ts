/**
 * Brush geometry system for SVG brush drawing
 * Defines brush shapes with their backbone and outline points
 */

import type { Point } from '../math/PathMath.js';

export interface BrushBackbone {
	/** Points defining the central spine of the brush */
	points: Point[];
	/** Length of the backbone */
	length: number;
	/** Get point at parameter t (0-1) along backbone */
	getPointAt(t: number): Point;
	/** Get tangent at parameter t (0-1) along backbone */
	getTangentAt(t: number): Point;
	/** Get normal at parameter t (0-1) along backbone */
	getNormalAt(t: number): Point;
}

export interface BrushOutline {
	/** Points defining the brush outline */
	points: Point[];
	/** Whether the outline is closed */
	closed: boolean;
}

export interface BrushDefinition {
	id: string;
	name: string;
	backbone: BrushBackbone;
	outline: BrushOutline;
	/** Default width of the brush */
	defaultWidth: number;
	/** Metadata for the brush */
	metadata: {
		description?: string;
		category?: string;
		tags?: string[];
	};
}

/**
 * Creates a straight horizontal backbone from (0,0) to (length,0)
 */
export function createStraightBackbone(length: number = 100): BrushBackbone {
	const points = [
		{ x: 0, y: 0 },
		{ x: length, y: 0 }
	];

	return {
		points,
		length,

		getPointAt(t: number): Point {
			const clampedT = Math.max(0, Math.min(1, t));
			return { x: clampedT * length, y: 0 };
		},

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		getTangentAt(_t: number): Point {
			return { x: 1, y: 0 }; // Always horizontal for straight backbone
		},

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		getNormalAt(_t: number): Point {
			return { x: 0, y: 1 }; // Always vertical for straight backbone
		}
	};
}

/**
 * Creates a curved backbone from a series of control points
 */
export function createCurvedBackbone(controlPoints: Point[]): BrushBackbone {
	if (controlPoints.length < 2) {
		throw new Error('Backbone requires at least 2 control points');
	}

	// Calculate total length by summing segment lengths
	let totalLength = 0;
	for (let i = 1; i < controlPoints.length; i++) {
		const dx = controlPoints[i].x - controlPoints[i - 1].x;
		const dy = controlPoints[i].y - controlPoints[i - 1].y;
		totalLength += Math.sqrt(dx * dx + dy * dy);
	}

	return {
		points: controlPoints,
		length: totalLength,

		getPointAt(t: number): Point {
			const clampedT = Math.max(0, Math.min(1, t));

			if (clampedT === 0) return { ...controlPoints[0] };
			if (clampedT === 1) return { ...controlPoints[controlPoints.length - 1] };

			// Find the segment that contains parameter t
			const targetDistance = clampedT * totalLength;
			let currentDistance = 0;

			for (let i = 1; i < controlPoints.length; i++) {
				const p1 = controlPoints[i - 1];
				const p2 = controlPoints[i];
				const segmentLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

				if (currentDistance + segmentLength >= targetDistance) {
					// Interpolate within this segment
					const segmentT = (targetDistance - currentDistance) / segmentLength;
					return {
						x: p1.x + segmentT * (p2.x - p1.x),
						y: p1.y + segmentT * (p2.y - p1.y)
					};
				}

				currentDistance += segmentLength;
			}

			return { ...controlPoints[controlPoints.length - 1] };
		},

		getTangentAt(t: number): Point {
			const epsilon = 0.001;
			const p1 = this.getPointAt(Math.max(0, t - epsilon));
			const p2 = this.getPointAt(Math.min(1, t + epsilon));

			const tangent = {
				x: p2.x - p1.x,
				y: p2.y - p1.y
			};

			const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
			if (length > 0) {
				tangent.x /= length;
				tangent.y /= length;
			}

			return tangent;
		},

		getNormalAt(t: number): Point {
			const tangent = this.getTangentAt(t);
			return { x: -tangent.y, y: tangent.x };
		}
	};
}

/**
 * Predefined brush geometries
 */
export class BrushPresets {
	static roundBrush(width: number = 20): BrushDefinition {
		const backbone = createStraightBackbone(100);
		const outline: BrushOutline = {
			points: [],
			closed: true
		};

		// Create circular outline
		const segments = 32;
		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * 2 * Math.PI;
			outline.points.push({
				x: 50 + (width / 2) * Math.cos(angle), // Center at backbone midpoint
				y: (width / 2) * Math.sin(angle)
			});
		}

		return {
			id: 'round',
			name: 'Round Brush',
			backbone,
			outline,
			defaultWidth: width,
			metadata: {
				description: 'Classic round brush for general drawing',
				category: 'basic',
				tags: ['round', 'basic', 'drawing']
			}
		};
	}

	static flatBrush(width: number = 20, length: number = 100): BrushDefinition {
		const backbone = createStraightBackbone(length);
		const halfWidth = width / 2;

		const outline: BrushOutline = {
			points: [
				{ x: 0, y: -halfWidth }, // Top-left
				{ x: length, y: -halfWidth }, // Top-right
				{ x: length, y: halfWidth }, // Bottom-right
				{ x: 0, y: halfWidth } // Bottom-left
			],
			closed: true
		};

		return {
			id: 'flat',
			name: 'Flat Brush',
			backbone,
			outline,
			defaultWidth: width,
			metadata: {
				description: 'Rectangular brush for bold strokes and filling',
				category: 'basic',
				tags: ['flat', 'rectangle', 'bold']
			}
		};
	}

	static caliggraphyBrush(width: number = 30): BrushDefinition {
		const backbone = createStraightBackbone(100);
		const halfWidth = width / 2;

		const outline: BrushOutline = {
			points: [
				{ x: 0, y: -halfWidth * 0.3 }, // Thin start
				{ x: 20, y: -halfWidth }, // Expand
				{ x: 80, y: -halfWidth }, // Wide middle
				{ x: 100, y: -halfWidth * 0.3 }, // Thin end
				{ x: 100, y: halfWidth * 0.3 }, // Thin end (bottom)
				{ x: 80, y: halfWidth }, // Wide middle (bottom)
				{ x: 20, y: halfWidth }, // Expand (bottom)
				{ x: 0, y: halfWidth * 0.3 } // Thin start (bottom)
			],
			closed: true
		};

		return {
			id: 'calligraphy',
			name: 'Calligraphy Brush',
			backbone,
			outline,
			defaultWidth: width,
			metadata: {
				description: 'Tapered brush for expressive calligraphy and artistic strokes',
				category: 'artistic',
				tags: ['calligraphy', 'tapered', 'expressive']
			}
		};
	}

	static textureBrush(width: number = 25): BrushDefinition {
		const backbone = createStraightBackbone(100);
		const halfWidth = width / 2;
		const outline: BrushOutline = {
			points: [],
			closed: true
		};

		// Create rough, textured outline
		const segments = 24;
		for (let i = 0; i < segments; i++) {
			const t = i / segments;
			const angle = t * 2 * Math.PI;
			const noise = (Math.sin(angle * 6) + Math.cos(angle * 8)) * 0.2;
			const radius = halfWidth * (1 + noise);

			outline.points.push({
				x: 50 + radius * Math.cos(angle),
				y: radius * Math.sin(angle)
			});
		}

		return {
			id: 'texture',
			name: 'Texture Brush',
			backbone,
			outline,
			defaultWidth: width,
			metadata: {
				description: 'Rough textured brush for organic, natural strokes',
				category: 'artistic',
				tags: ['texture', 'rough', 'organic', 'natural']
			}
		};
	}

	static getAllPresets(): BrushDefinition[] {
		return [this.roundBrush(), this.flatBrush(), this.caliggraphyBrush(), this.textureBrush()];
	}
}

/**
 * Utility functions for brush geometry manipulation
 */
export class BrushGeometryUtils {
	/**
	 * Scale a brush definition by a given factor
	 */
	static scaleBrush(brush: BrushDefinition, scaleFactor: number): BrushDefinition {
		const scaledOutline: BrushOutline = {
			points: brush.outline.points.map((p) => ({
				x: p.x * scaleFactor,
				y: p.y * scaleFactor
			})),
			closed: brush.outline.closed
		};

		const scaledBackbone: BrushBackbone = {
			...brush.backbone,
			points: brush.backbone.points.map((p) => ({
				x: p.x * scaleFactor,
				y: p.y * scaleFactor
			})),
			length: brush.backbone.length * scaleFactor,
			getPointAt(t: number) {
				const originalPoint = brush.backbone.getPointAt(t);
				return {
					x: originalPoint.x * scaleFactor,
					y: originalPoint.y * scaleFactor
				};
			}
		};

		return {
			...brush,
			backbone: scaledBackbone,
			outline: scaledOutline,
			defaultWidth: brush.defaultWidth * scaleFactor
		};
	}

	/**
	 * Get all outline points as a flat array (useful for deformation)
	 */
	static getOutlinePoints(brush: BrushDefinition): Point[] {
		return [...brush.outline.points];
	}

	/**
	 * Get bounding box of brush outline
	 */
	static getBoundingBox(brush: BrushDefinition): {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
		width: number;
		height: number;
	} {
		if (brush.outline.points.length === 0) {
			return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
		}

		let minX = brush.outline.points[0].x;
		let minY = brush.outline.points[0].y;
		let maxX = brush.outline.points[0].x;
		let maxY = brush.outline.points[0].y;

		for (const point of brush.outline.points) {
			minX = Math.min(minX, point.x);
			minY = Math.min(minY, point.y);
			maxX = Math.max(maxX, point.x);
			maxY = Math.max(maxY, point.y);
		}

		return {
			minX,
			minY,
			maxX,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}
}

/**
 * Backbone deformation engine for SVG brush drawing
 * Implements the core algorithm for deforming brush geometry along user-drawn paths
 */

import type { Point, PathFrame } from '../math/PathMath.js';
import { PathMath } from '../math/PathMath.js';
import type { BrushDefinition } from '../brush/BrushGeometry.js';

export interface ProjectionResult {
	/** Parameter t (0-1) along the backbone */
	parameter: number;
	/** Point on backbone corresponding to the projection */
	backbonePoint: Point;
	/** Offset from backbone in local coordinates */
	offset: Point;
}

export interface DeformationOptions {
	/** Apply length compensation when user path length differs from backbone */
	lengthCompensation: boolean;
	/** Apply curvature-based scaling to brush width */
	curvatureScaling: boolean;
	/** Maximum curvature scale factor */
	maxCurvatureScale: number;
	/** Number of samples for backbone projection (higher = more accurate) */
	projectionSamples: number;
}

export const DEFAULT_DEFORMATION_OPTIONS: DeformationOptions = {
	lengthCompensation: true,
	curvatureScaling: true,
	maxCurvatureScale: 0.5,
	projectionSamples: 100
};

export class BackboneDeformation {
	/**
	 * Project a brush point onto its backbone to find parameter and offset
	 */
	static projectPointToBackbone(
		brushPoint: Point,
		brush: BrushDefinition,
		options: Partial<DeformationOptions> = {}
	): ProjectionResult {
		const opts = { ...DEFAULT_DEFORMATION_OPTIONS, ...options };

		// For straight backbone, use optimized calculation
		if (this.isSimpleStraightBackbone(brush)) {
			return this.projectToStraightBackbone(brushPoint, brush);
		}

		// For complex backbones, sample to find closest point
		let minDistance = Infinity;
		let bestProjection: ProjectionResult | null = null;

		for (let i = 0; i <= opts.projectionSamples; i++) {
			const t = i / opts.projectionSamples;
			const backbonePoint = brush.backbone.getPointAt(t);
			const distance = Math.sqrt(
				(brushPoint.x - backbonePoint.x) ** 2 + (brushPoint.y - backbonePoint.y) ** 2
			);

			if (distance < minDistance) {
				minDistance = distance;

				// Calculate local offset
				const backboneTangent = brush.backbone.getTangentAt(t);
				const backboneNormal = brush.backbone.getNormalAt(t);

				const toPoint = {
					x: brushPoint.x - backbonePoint.x,
					y: brushPoint.y - backbonePoint.y
				};

				const offset = {
					x: toPoint.x * backboneTangent.x + toPoint.y * backboneTangent.y, // Along backbone
					y: toPoint.x * backboneNormal.x + toPoint.y * backboneNormal.y // Perpendicular
				};

				bestProjection = {
					parameter: t,
					backbonePoint,
					offset
				};
			}
		}

		if (!bestProjection) {
			// Fallback to start of backbone
			return {
				parameter: 0,
				backbonePoint: brush.backbone.getPointAt(0),
				offset: { x: 0, y: 0 }
			};
		}

		return bestProjection;
	}

	/**
	 * Optimized projection for straight horizontal backbones
	 */
	private static projectToStraightBackbone(
		brushPoint: Point,
		brush: BrushDefinition
	): ProjectionResult {
		const backboneLength = brush.backbone.length;
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
	 * Check if brush has a simple straight horizontal backbone
	 */
	private static isSimpleStraightBackbone(brush: BrushDefinition): boolean {
		const points = brush.backbone.points;
		if (points.length !== 2) return false;

		// Check if it's horizontal from (0,0) to (length,0)
		return points[0].x === 0 && points[0].y === 0 && points[1].y === 0 && points[1].x > 0;
	}

	/**
	 * Deform a single brush point along a user-drawn path
	 */
	static deformPoint(
		brushPoint: Point,
		brush: BrushDefinition,
		userPath: SVGPathElement,
		options: Partial<DeformationOptions> = {}
	): Point {
		const opts = { ...DEFAULT_DEFORMATION_OPTIONS, ...options };

		// Project brush point onto backbone
		const projection = this.projectPointToBackbone(brushPoint, brush, options);

		// Get corresponding frame on user path
		const userFrame = PathMath.getFrameAt(userPath, projection.parameter);

		// Apply length compensation if enabled
		let compensatedOffset = projection.offset;
		if (opts.lengthCompensation) {
			const backboneLength = brush.backbone.length;
			const userPathLength = userPath.getTotalLength();
			const lengthRatio = userPathLength / backboneLength;

			compensatedOffset = {
				x: projection.offset.x * lengthRatio,
				y: projection.offset.y // Keep perpendicular offsets unchanged
			};
		}

		// Apply curvature scaling if enabled
		if (opts.curvatureScaling) {
			const curvature = PathMath.getCurvatureAt(userPath, projection.parameter);
			const curvatureScale = Math.max(opts.maxCurvatureScale, 1 / (1 + curvature * 2));

			compensatedOffset.y *= curvatureScale;
		}

		// Transform to world coordinates using user path frame
		return PathMath.localToWorldCoordinates(compensatedOffset, userFrame);
	}

	/**
	 * Deform entire brush geometry along a user-drawn path
	 */
	static deformBrush(
		brush: BrushDefinition,
		userPath: SVGPathElement,
		options: Partial<DeformationOptions> = {}
	): Point[] {
		const deformedPoints: Point[] = [];

		for (const brushPoint of brush.outline.points) {
			const deformedPoint = this.deformPoint(brushPoint, brush, userPath, options);
			deformedPoints.push(deformedPoint);
		}

		return deformedPoints;
	}

	/**
	 * Create deformed brush stroke as SVG path string
	 */
	static createDeformedStroke(
		brush: BrushDefinition,
		userPath: SVGPathElement,
		options: Partial<DeformationOptions> = {}
	): string {
		const deformedPoints = this.deformBrush(brush, userPath, options);

		if (deformedPoints.length === 0) return '';

		let pathString = `M ${deformedPoints[0].x} ${deformedPoints[0].y}`;

		for (let i = 1; i < deformedPoints.length; i++) {
			pathString += ` L ${deformedPoints[i].x} ${deformedPoints[i].y}`;
		}

		// Close path if brush outline is closed
		if (brush.outline.closed) {
			pathString += ' Z';
		}

		return pathString;
	}

	/**
	 * Create smooth deformed brush stroke using curves
	 */
	static createSmoothDeformedStroke(
		brush: BrushDefinition,
		userPath: SVGPathElement,
		options: Partial<DeformationOptions> = {}
	): string {
		const deformedPoints = this.deformBrush(brush, userPath, options);
		return PathMath.pointsToSmoothSVGPath(deformedPoints);
	}

	/**
	 * Batch deform multiple brushes along the same path (for performance)
	 */
	static deformMultipleBrushes(
		brushes: BrushDefinition[],
		userPath: SVGPathElement,
		options: Partial<DeformationOptions> = {}
	): { brush: BrushDefinition; deformedPoints: Point[]; pathString: string }[] {
		// Pre-calculate path frames for performance
		const frameCache = new Map<number, PathFrame>();
		const getSampledFrame = (t: number): PathFrame => {
			const roundedT = Math.round(t * 1000) / 1000; // Cache to 3 decimal places
			if (!frameCache.has(roundedT)) {
				frameCache.set(roundedT, PathMath.getFrameAt(userPath, roundedT));
			}
			return frameCache.get(roundedT)!;
		};

		return brushes.map((brush) => {
			const deformedPoints = brush.outline.points.map((brushPoint: Point) => {
				const projection = this.projectPointToBackbone(brushPoint, brush, options);
				const userFrame = getSampledFrame(projection.parameter);

				// Apply transformations (same logic as deformPoint)
				let compensatedOffset = projection.offset;

				if (options.lengthCompensation) {
					const lengthRatio = userPath.getTotalLength() / brush.backbone.length;
					compensatedOffset = {
						x: projection.offset.x * lengthRatio,
						y: projection.offset.y
					};
				}

				if (options.curvatureScaling) {
					const curvature = PathMath.getCurvatureAt(userPath, projection.parameter);
					const curvatureScale = Math.max(
						options.maxCurvatureScale || DEFAULT_DEFORMATION_OPTIONS.maxCurvatureScale,
						1 / (1 + curvature * 2)
					);
					compensatedOffset.y *= curvatureScale;
				}

				return PathMath.localToWorldCoordinates(compensatedOffset, userFrame);
			});

			const pathString = this.createDeformedStroke(brush, userPath, options);

			return {
				brush,
				deformedPoints,
				pathString
			};
		});
	}
}

/**
 * Core mathematical utilities for SVG path operations
 * Handles path analysis, tangent/normal calculations, and coordinate transformations
 */

export interface Point {
	x: number;
	y: number;
}

export interface PathFrame {
	point: Point;
	tangent: Point;
	normal: Point;
}

export class PathMath {
	/**
	 * Calculate the tangent vector at parameter t along an SVG path
	 */
	static getTangentAt(path: SVGPathElement, t: number): Point {
		const totalLength = path.getTotalLength();
		const epsilon = Math.min(0.001, 1 / totalLength);

		const t1 = Math.max(0, t - epsilon);
		const t2 = Math.min(1, t + epsilon);

		const p1 = path.getPointAtLength(t1 * totalLength);
		const p2 = path.getPointAtLength(t2 * totalLength);

		const tangent = {
			x: p2.x - p1.x,
			y: p2.y - p1.y
		};

		// Normalize
		const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
		if (length > 0) {
			tangent.x /= length;
			tangent.y /= length;
		}

		return tangent;
	}

	/**
	 * Calculate the normal vector (perpendicular to tangent) at parameter t
	 */
	static getNormalAt(path: SVGPathElement, t: number): Point {
		const tangent = this.getTangentAt(path, t);
		return { x: -tangent.y, y: tangent.x };
	}

	/**
	 * Get complete coordinate frame (point, tangent, normal) at parameter t
	 */
	static getFrameAt(path: SVGPathElement, t: number): PathFrame {
		const totalLength = path.getTotalLength();
		const point = path.getPointAtLength(t * totalLength);
		const tangent = this.getTangentAt(path, t);
		const normal = this.getNormalAt(path, t);

		return { point, tangent, normal };
	}

	/**
	 * Calculate curvature at parameter t (rate of direction change)
	 */
	static getCurvatureAt(path: SVGPathElement, t: number): number {
		const epsilon = 0.01;
		const t1 = Math.max(0, t - epsilon);
		const t2 = Math.min(1, t + epsilon);

		const tangent1 = this.getTangentAt(path, t1);
		const tangent2 = this.getTangentAt(path, t2);

		const angle1 = Math.atan2(tangent1.y, tangent1.x);
		const angle2 = Math.atan2(tangent2.y, tangent2.x);

		let deltaAngle = angle2 - angle1;

		// Handle angle wraparound
		if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
		if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

		return Math.abs(deltaAngle) / (2 * epsilon);
	}

	/**
	 * Find the closest point on a path to a given point
	 */
	static findClosestPointOnPath(
		path: SVGPathElement,
		targetPoint: Point,
		samples: number = 100
	): {
		t: number;
		point: Point;
		distance: number;
	} {
		const totalLength = path.getTotalLength();
		let minDistance = Infinity;
		let bestT = 0;
		let bestPoint = { x: 0, y: 0 };

		for (let i = 0; i <= samples; i++) {
			const t = i / samples;
			const point = path.getPointAtLength(t * totalLength);
			const distance = Math.sqrt((targetPoint.x - point.x) ** 2 + (targetPoint.y - point.y) ** 2);

			if (distance < minDistance) {
				minDistance = distance;
				bestT = t;
				bestPoint = point;
			}
		}

		return { t: bestT, point: bestPoint, distance: minDistance };
	}

	/**
	 * Convert a point from world coordinates to local path coordinates
	 */
	static worldToLocalCoordinates(worldPoint: Point, pathFrame: PathFrame): Point {
		const toPoint = {
			x: worldPoint.x - pathFrame.point.x,
			y: worldPoint.y - pathFrame.point.y
		};

		return {
			x: toPoint.x * pathFrame.tangent.x + toPoint.y * pathFrame.tangent.y, // Along path
			y: toPoint.x * pathFrame.normal.x + toPoint.y * pathFrame.normal.y // Perpendicular to path
		};
	}

	/**
	 * Convert a point from local path coordinates to world coordinates
	 */
	static localToWorldCoordinates(localPoint: Point, pathFrame: PathFrame): Point {
		return {
			x: pathFrame.point.x + localPoint.x * pathFrame.tangent.x + localPoint.y * pathFrame.normal.x,
			y: pathFrame.point.y + localPoint.x * pathFrame.tangent.y + localPoint.y * pathFrame.normal.y
		};
	}

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
	static pointsToSmoothSVGPath(points: Point[]): string {
		if (points.length === 0) return '';
		if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
		if (points.length === 2) {
			return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
		}

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
}

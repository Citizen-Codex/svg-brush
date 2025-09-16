<script lang="ts">
	import { type Point, type Brush, pointsToSmoothPath, createBrushStroke } from '$lib/index.js';

	interface Props {
		width?: number;
		height?: number;
		brush?: Brush | null;
		backgroundColor?: string;
		strokeWidth?: number;
		[key: string]: any;
	}

	let {
		width = 800,
		height = 600,
		brush,
		backgroundColor = '#ffffff',
		strokeWidth = 1,
		...rest
	}: Props = $props();

	let canvas: SVGSVGElement;
	let isDrawing = $state(false);
	let currentPath: Point[] = $state([]);
	let strokes: { pathStringDeformed: string; pathString: string; brush: Brush }[] = $state([]);
	let tempPathElement: SVGPathElement | null = $state(null);

	function handlePointerDown(event: PointerEvent) {
		if (!brush) return;

		const point = getPointFromEvent(event);
		isDrawing = true;
		currentPath = [point];

		(event.target as Element).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDrawing || !brush) return;

		const point = getPointFromEvent(event);
		currentPath = [...currentPath, point];

		if (currentPath.length >= 2) {
			updatePreviewStroke();
		}
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDrawing || !brush) return;

		isDrawing = false;
		(event.target as Element).releasePointerCapture(event.pointerId);

		if (currentPath.length >= 2) {
			finalizeStroke();
		}

		tempPathElement = null;
		currentPath = [];
	}

	function getPointFromEvent(event: PointerEvent): Point {
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function updatePreviewStroke() {
		if (!brush || currentPath.length < 2) return;

		const pathString = pointsToSmoothPath(currentPath);

		if (!tempPathElement) {
			tempPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		}

		tempPathElement.setAttribute('d', pathString);
	}

	function finalizeStroke() {
		if (!brush || currentPath.length < 2) return;
		const userPathString = pointsToSmoothPath(currentPath);

		try {
			const deformedPathString = createBrushStroke(currentPath, {
				brush,
				strokeWidth
			});

			strokes = [
				...strokes,
				{ pathString: userPathString, pathStringDeformed: deformedPathString, brush }
			];
			rest.onstrokeend?.(deformedPathString);
		} catch (error) {
			console.error('Error finalizing stroke:', error);
			strokes = [
				...strokes,
				{ pathString: userPathString, pathStringDeformed: userPathString, brush }
			];
		}
	}

	export function clearCanvas() {
		strokes = [];
	}

	export function undo() {
		if (strokes.length > 0) {
			strokes = strokes.slice(0, -1);
		}
	}
</script>

<svg
	bind:this={canvas}
	{width}
	{height}
	class="h-full w-full max-w-full cursor-crosshair rounded-2xl border border-black/10 bg-white text-black shadow-inner"
	style:background-color={backgroundColor}
	style:touch-action="none"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	xmlns="http://www.w3.org/2000/svg"
>
	<defs>
		<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
			<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000000" stroke-width="0.5" opacity="0.1" />
		</pattern>
	</defs>

	<rect width="100%" height="100%" fill="url(#grid)" />

	{#each strokes as stroke, i (i)}
		<path d={stroke.pathStringDeformed} fill="currentColor" class="text-black" opacity="0.82" />
	{/each}

	{#if isDrawing && currentPath.length >= 2}
		<path
			d={pointsToSmoothPath(currentPath)}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-dasharray="5,5"
			opacity="0.5"
			class="text-canvas-accent"
		/>
	{/if}
</svg>

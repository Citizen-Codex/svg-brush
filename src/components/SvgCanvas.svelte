<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BrushDefinition } from '$lib/brush/BrushGeometry.js';
	import {
		BackboneDeformation,
		type DeformationOptions
	} from '$lib/deformation/BackboneDeformation.js';
	import { PathMath, type Point } from '$lib/math/PathMath.js';

	// Props
	interface Props {
		width?: number;
		height?: number;
		brush?: BrushDefinition;
		deformationOptions?: Partial<DeformationOptions>;
		backgroundColor?: string;
		showGrid?: boolean;
	}

	let {
		width = 800,
		height = 600,
		brush,
		deformationOptions = {},
		backgroundColor = '#ffffff',
		showGrid = false
	}: Props = $props();

	// State
	let canvas: SVGSVGElement;
	let isDrawing = $state(false);
	let currentPath: Point[] = $state([]);
	let strokes: { pathStringDeformed: string; pathString: string; brush: BrushDefinition }[] =
		$state([]);
	let tempPathElement: SVGPathElement | null = $state(null);

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		strokeStart: { point: Point; brush: BrushDefinition };
		strokeUpdate: { path: Point[]; brush: BrushDefinition };
		strokeEnd: { pathString: string; brush: BrushDefinition };
	}>();

	// Drawing handlers
	function handlePointerDown(event: PointerEvent) {
		if (!brush) return;

		const point = getPointFromEvent(event);
		isDrawing = true;
		currentPath = [point];

		// Set pointer capture
		(event.target as Element).setPointerCapture(event.pointerId);

		dispatch('strokeStart', { point, brush });
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDrawing || !brush) return;

		const point = getPointFromEvent(event);
		currentPath = [...currentPath, point];

		// Update live preview if we have enough points
		if (currentPath.length >= 2) {
			updatePreviewStroke();
		}

		dispatch('strokeUpdate', { path: currentPath, brush });
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDrawing || !brush) return;

		isDrawing = false;

		// Release pointer capture
		(event.target as Element).releasePointerCapture(event.pointerId);

		// Finalize the stroke
		if (currentPath.length >= 2) {
			finalizeStroke();
		}

		// Clear preview
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

		// Create temporary SVG path for the user's drawing
		const pathString = PathMath.pointsToSmoothSVGPath(currentPath);

		// Create a temporary path element to use for deformation
		if (!tempPathElement) {
			tempPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		}

		tempPathElement.setAttribute('d', pathString);

		// This is a bit of a hack - we need the path to be in the DOM to calculate lengths
		// In a real implementation, you might want to use a more robust path calculation
		try {
			// For preview, we'll use the simple path without deformation
			// The deformation will be applied on finalization
		} catch (error) {
			console.warn('Error updating preview stroke:', error);
		}
	}

	function finalizeStroke() {
		if (!brush || currentPath.length < 2) return;

		try {
			// Create SVG path from user's drawing
			const userPathString = PathMath.pointsToSmoothSVGPath(currentPath);

			// Create temporary path element for deformation calculation
			const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			pathElement.setAttribute('d', userPathString);

			// Apply backbone deformation using path calculations
			// Note: Direct DOM manipulation needed for SVG path length calculations

			const deformedPathString = (() => {
				pathElement.style.visibility = 'hidden';
				// eslint-disable-next-line svelte/no-dom-manipulating
				canvas.appendChild(pathElement);
				try {
					return BackboneDeformation.createSmoothDeformedStroke(
						brush,
						pathElement,
						deformationOptions
					);
				} finally {
					canvas.removeChild(pathElement);
				}
			})();

			// Add to strokes
			strokes = [
				...strokes,
				{ pathString: userPathString, pathStringDeformed: deformedPathString, brush }
			];

			dispatch('strokeEnd', { pathString: deformedPathString, brush });
		} catch (error) {
			console.error('Error finalizing stroke:', error);

			// Fallback: just add the user path without deformation
			const fallbackPath = PathMath.pointsToSmoothSVGPath(currentPath);
			strokes = [...strokes, { pathString: fallbackPath, pathStringDeformed: fallbackPath, brush }];
		}
	}

	// Public methods
	export function clearCanvas() {
		strokes = [];
	}

	export function undo() {
		if (strokes.length > 0) {
			strokes = strokes.slice(0, -1);
		}
	}

	export function exportSVG(): string {
		const svgContent = canvas.outerHTML;
		return svgContent;
	}

	// Grid pattern
	let gridPattern: string = $state('');

	$effect(() => {
		if (showGrid) {
			gridPattern = `
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5" opacity="0.5"/>
          </pattern>
        </defs>
      `;
		} else {
			gridPattern = '';
		}
	});
</script>

<svg
	bind:this={canvas}
	{width}
	{height}
	style="background-color: {backgroundColor}; cursor: crosshair; touch-action: none;"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	xmlns="http://www.w3.org/2000/svg"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html gridPattern}

	<!-- Grid background -->
	{#if showGrid}
		<rect width="100%" height="100%" fill="url(#grid)" />
	{/if}

	<!-- Completed strokes -->
	{#each strokes as stroke, i (i)}
		<path d={stroke.pathStringDeformed} fill="currentColor" stroke="none" opacity="0.8" />
		<path d={stroke.pathString} fill="none" stroke="black" opacity="0.8" />
	{/each}

	<!-- Current stroke preview -->
	{#if isDrawing && currentPath.length >= 2}
		<path
			d={PathMath.pointsToSmoothSVGPath(currentPath)}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-dasharray="5,5"
			opacity="0.5"
		/>
	{/if}
</svg>

<style>
	svg {
		border: 1px solid #ccc;
		display: block;
	}

	path {
		color: #333;
	}
</style>

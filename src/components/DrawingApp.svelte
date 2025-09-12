<script lang="ts">
	import SvgCanvas from './SvgCanvas.svelte';
	import BrushSelector from './BrushSelector.svelte';
	import { BrushPresets, type BrushDefinition } from '$lib/BrushGeometry.js';
	import type { Point } from '$lib/PathMath.js';

	// Props
	interface Props {
		canvasWidth?: number;
		canvasHeight?: number;
		showToolbar?: boolean;
	}

	let { canvasWidth = 800, canvasHeight = 600, showToolbar = true }: Props = $props();

	// State
	let canvas: SvgCanvas;
	let selectedBrush = $state<BrushDefinition>(BrushPresets.roundBrush());
	let isDrawing = $state(false);
	let strokeCount = $state(0);
	let showGrid = $state(false);

	// Canvas background
	let canvasBackground = $state('#ffffff');

	// Drawing statistics
	let drawingStats = $state({
		totalStrokes: 0,
		lastStrokeLength: 0,
		averageStrokeLength: 0,
		drawingStartTime: 0
	});

	// Handlers
	function handleBrushChanged(event: CustomEvent<BrushDefinition>) {
		selectedBrush = event.detail;
	}

	function handleBrushScaleChanged(event: CustomEvent<{ brush: BrushDefinition; scale: number }>) {
		selectedBrush = event.detail.brush;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleStrokeStart(_event: CustomEvent<{ point: Point; brush: BrushDefinition }>) {
		isDrawing = true;
		if (drawingStats.totalStrokes === 0) {
			drawingStats.drawingStartTime = Date.now();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleStrokeUpdate(_event: CustomEvent<{ path: Point[]; brush: BrushDefinition }>) {
		// Could be used for real-time feedback or analytics
	}

	function handleStrokeEnd(event: CustomEvent<{ pathString: string; brush: BrushDefinition }>) {
		isDrawing = false;
		strokeCount++;

		// Update statistics
		drawingStats.totalStrokes++;
		// Note: We'd need to calculate actual path length from the path string for accurate stats
		drawingStats.lastStrokeLength = event.detail.pathString.length; // Simplified
		drawingStats.averageStrokeLength =
			(drawingStats.averageStrokeLength * (drawingStats.totalStrokes - 1) +
				drawingStats.lastStrokeLength) /
			drawingStats.totalStrokes;
	}

	function clearCanvas() {
		canvas?.clearCanvas();
		strokeCount = 0;
		drawingStats = {
			totalStrokes: 0,
			lastStrokeLength: 0,
			averageStrokeLength: 0,
			drawingStartTime: 0
		};
	}

	function undoStroke() {
		canvas?.undo();
		if (strokeCount > 0) {
			strokeCount--;
			drawingStats.totalStrokes = Math.max(0, drawingStats.totalStrokes - 1);
		}
	}

	function exportDrawing() {
		if (canvas) {
			const svgContent = canvas.exportSVG();
			const blob = new Blob([svgContent], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = `svg-brush-drawing-${Date.now()}.svg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	}
</script>

<div class="drawing-app">
	{#if showToolbar}
		<div class="toolbar">
			<div class="toolbar-section">
				<h2>SVG Brush Drawing</h2>
				<div class="stats">
					Strokes: {drawingStats.totalStrokes} |
					{#if isDrawing}
						<span class="drawing-indicator">Drawing...</span>
					{:else}
						Ready
					{/if}
				</div>
			</div>

			<div class="toolbar-section">
				<button onclick={clearCanvas} class="btn btn-danger">Clear All</button>
				<button onclick={undoStroke} class="btn btn-secondary" disabled={strokeCount === 0}>
					Undo
				</button>
				<button onclick={exportDrawing} class="btn btn-primary">Export SVG</button>
			</div>
		</div>
	{/if}

	<div class="main-content">
		<div class="sidebar">
			<BrushSelector
				{selectedBrush}
				on:brushChanged={handleBrushChanged}
				on:brushScaleChanged={handleBrushScaleChanged}
			/>
		</div>

		<div class="canvas-container">
			<SvgCanvas
				bind:this={canvas}
				width={canvasWidth}
				height={canvasHeight}
				brush={selectedBrush}
				backgroundColor={canvasBackground}
				{showGrid}
				on:strokeStart={handleStrokeStart}
				on:strokeUpdate={handleStrokeUpdate}
				on:strokeEnd={handleStrokeEnd}
			/>
		</div>
	</div>
</div>

<style>
	.drawing-app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f5f5f5;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: white;
		border-bottom: 1px solid #ddd;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.toolbar h2 {
		margin: 0;
		color: #333;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stats {
		font-size: 0.9rem;
		color: #666;
	}

	.drawing-indicator {
		color: #007bff;
		font-weight: 500;
	}

	.main-content {
		display: flex;
		flex: 1;
		gap: 1rem;
		padding: 1rem;
		overflow: hidden;
	}

	.sidebar {
		width: 350px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	.canvas-container {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		overflow: auto;
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.btn-primary {
		background: #007bff;
		color: white;
	}

	.btn-primary:hover {
		background: #0056b3;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background: #545b62;
	}

	.btn-secondary:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background: #c82333;
	}

	.btn-small {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.drawing-stats p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	/* Responsive design */
	@media (max-width: 1024px) {
		.main-content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			max-height: 300px;
		}

		.canvas-container {
			overflow: auto;
		}
	}

	@media (max-width: 768px) {
		.toolbar {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.toolbar-section {
			justify-content: center;
		}

		.sidebar {
			max-height: 250px;
		}
	}
</style>

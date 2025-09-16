<script lang="ts">
	import SvgCanvas from './SvgCanvas.svelte';
	import BrushSelector from './BrushSelector.svelte';
	import { type Brush } from '$lib/index.js';

	interface Props {
		canvasWidth?: number;
		canvasHeight?: number;
		showToolbar?: boolean;
	}

	let { canvasWidth = 800, canvasHeight = 600, showToolbar = true }: Props = $props();

	let canvas: SvgCanvas;
	let selectedBrush = $state<Brush | null>(null);
	let strokeCount = $state(0);
	let strokeWidth = $state(1);
	let canvasBackground = $state('#ffffff');

	let drawingStats = $state({
		totalStrokes: 0,
		lastStrokeLength: 0,
		averageStrokeLength: 0
	});

	const toolbarButtonBase =
		'rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-accent';
	const clearButtonClass = `${toolbarButtonBase} bg-black text-white hover:bg-black/80`;
	const undoButtonBase = `${toolbarButtonBase} border border-black bg-white text-black hover:bg-black hover:text-white`;

	function handleStrokeEnd(pathString: string) {
		strokeCount++;

		drawingStats.totalStrokes++;
		drawingStats.lastStrokeLength = pathString.length;
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
			averageStrokeLength: 0
		};
	}

	function undoStroke() {
		canvas?.undo();
		if (strokeCount > 0) {
			strokeCount--;
			drawingStats.totalStrokes = Math.max(0, drawingStats.totalStrokes - 1);
		}
	}
</script>

<div class="flex min-h-screen w-full flex-col bg-white">
	{#if showToolbar}
		<div
			class="flex flex-col gap-4 border-b border-black/10 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex flex-col gap-1">
				<h1 class="text-3xl font-bold text-black">SVG Brush Playground</h1>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<button type="button" class={clearButtonClass} onclick={clearCanvas}>Clear All</button>
				<button
					type="button"
					class={`${undoButtonBase} disabled:cursor-not-allowed disabled:bg-white disabled:text-black/40`}
					onclick={undoStroke}
					disabled={strokeCount === 0}
				>
					Undo
				</button>
			</div>
		</div>
	{/if}

	<div class="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
		<aside class="w-full max-w-full space-y-4 overflow-y-auto lg:w-96">
			<BrushSelector bind:selectedBrush bind:strokeWidth />
		</aside>

		<section
			class="flex flex-1 flex-col overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-lg backdrop-blur-sm"
		>
			<div class="flex flex-1 items-start justify-center overflow-auto">
				<SvgCanvas
					bind:this={canvas}
					width={canvasWidth}
					height={canvasHeight}
					brush={selectedBrush}
					backgroundColor={canvasBackground}
					{strokeWidth}
					onstrokeend={handleStrokeEnd}
				/>
			</div>
		</section>
	</div>
</div>

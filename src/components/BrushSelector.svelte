<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { BrushPresets, type BrushDefinition } from '$lib/BrushGeometry.js';
	import { PathMath } from '$lib/PathMath.js';

	// Props
	interface Props {
		selectedBrush?: BrushDefinition;
		showPreview?: boolean;
		previewSize?: number;
	}

	let {
		selectedBrush = BrushPresets.roundBrush(),
		showPreview = true,
		previewSize = 60
	}: Props = $props();

	// State
	let availableBrushes = $state(BrushPresets.getAllPresets());

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		brushChanged: BrushDefinition;
	}>();

	// Handlers
	function selectBrush(brush: BrushDefinition) {
		selectedBrush = brush;
		dispatch('brushChanged', brush);
	}

	// Generate preview SVG for a brush
	function generateBrushPreview(brush: BrushDefinition, size: number = previewSize): string {
		let pathString = '';
		for (const shape of brush.outline.shapes) {
			if (shape.points.length > 0) {
				pathString += PathMath.pointsToSVGPath(shape.points) + (shape.closed ? ' Z' : '');
			}
		}

		if (pathString === '') return '';

		return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(10, 30)">
          <path d="${pathString}" fill="#333" stroke="none" />
          <path d="M ${brush.backbone.points[0].x} ${brush.backbone.points[0].y} L ${brush.backbone.points[brush.backbone.points.length - 1].x} ${brush.backbone.points[brush.backbone.points.length - 1].y}" stroke="#666" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
        </g>
      </svg>
    `;
	}

	// Reactive preview updates

	let brushPreviews = $state(new Map<string, string>());

	$effect(() => {
		// Generate previews for all brushes
		const newPreviews = new Map();
		for (const brush of availableBrushes) {
			newPreviews.set(brush.id, generateBrushPreview(brush));
		}
		brushPreviews = newPreviews;
	});
</script>

<div class="brush-selector">
	<h3>Brush Selection</h3>

	<!-- Brush Grid -->
	<div class="brush-grid">
		{#each availableBrushes as brush (brush.id)}
			<button
				class="brush-option"
				class:selected={selectedBrush?.id === brush.id}
				onclick={() => selectBrush(brush)}
				title={brush.name}
			>
				{#if showPreview && brushPreviews.has(brush.id)}
					<div class="brush-preview">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html brushPreviews.get(brush.id)}
					</div>
				{/if}

				<div class="brush-info">
					<span class="brush-name">{brush.name}</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.brush-selector {
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #fafafa;
		max-width: 400px;
	}

	h3 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.brush-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.brush-option {
		padding: 0.5rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-height: 100px;
	}

	.brush-option:hover {
		border-color: #999;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.brush-option.selected {
		border-color: #007bff;
		background: #f0f8ff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.brush-preview {
		flex-shrink: 0;
	}

	.brush-info {
		text-align: center;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.brush-name {
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.brush-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.brush-option {
			min-height: 80px;
		}
	}
</style>

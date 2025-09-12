<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		BrushPresets,
		type BrushDefinition,
		BrushGeometryUtils
	} from '$lib/brush/BrushGeometry.js';
	import { PathMath } from '$lib/math/PathMath.js';

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
	let customBrushScale = $state(1.0);

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		brushChanged: BrushDefinition;
		brushScaleChanged: { brush: BrushDefinition; scale: number };
	}>();

	// Handlers
	function selectBrush(brush: BrushDefinition) {
		selectedBrush = brush;
		dispatch('brushChanged', brush);
	}

	function handleScaleChange() {
		if (selectedBrush && customBrushScale !== 1.0) {
			const scaledBrush = BrushGeometryUtils.scaleBrush(selectedBrush, customBrushScale);
			dispatch('brushScaleChanged', { brush: scaledBrush, scale: customBrushScale });
		}
	}

	// Generate preview SVG for a brush
	function generateBrushPreview(brush: BrushDefinition, size: number = previewSize): string {
		const bbox = BrushGeometryUtils.getBoundingBox(brush);
		const scale = Math.min(size / bbox.width, size / bbox.height) * 0.8; // 80% of available space

		const scaledBrush = BrushGeometryUtils.scaleBrush(brush, scale);
		const outlinePoints = BrushGeometryUtils.getOutlinePoints(scaledBrush);

		if (outlinePoints.length === 0) return '';

		const pathString = PathMath.pointsToSVGPath(outlinePoints) + (brush.outline.closed ? ' Z' : '');

		// Center the brush in the preview
		const scaledBbox = BrushGeometryUtils.getBoundingBox(scaledBrush);
		const offsetX = (size - scaledBbox.width) / 2 - scaledBbox.minX;
		const offsetY = (size - scaledBbox.height) / 2 - scaledBbox.minY;

		return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${offsetX}, ${offsetY})">
          <path d="${pathString}" fill="#333" stroke="none" />
          <path d="M ${scaledBrush.backbone.points[0].x} ${scaledBrush.backbone.points[0].y} L ${scaledBrush.backbone.points[scaledBrush.backbone.points.length - 1].x} ${scaledBrush.backbone.points[scaledBrush.backbone.points.length - 1].y}" stroke="#666" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
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
				title={brush.metadata.description}
			>
				{#if showPreview && brushPreviews.has(brush.id)}
					<div class="brush-preview">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html brushPreviews.get(brush.id)}
					</div>
				{/if}

				<div class="brush-info">
					<span class="brush-name">{brush.name}</span>
					<span class="brush-category">{brush.metadata.category}</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Brush Customization -->
	{#if selectedBrush}
		<div class="brush-customization">
			<h4>Customize {selectedBrush.name}</h4>

			<!-- Scale Control -->
			<div class="control-group">
				<label for="brush-scale">Scale:</label>
				<input
					id="brush-scale"
					type="range"
					min="0.5"
					max="3.0"
					step="0.1"
					bind:value={customBrushScale}
					onchange={handleScaleChange}
				/>
				<span class="value-display">{customBrushScale.toFixed(1)}x</span>
			</div>

			<!-- Brush Details -->
			<div class="brush-details">
				<p><strong>Category:</strong> {selectedBrush.metadata.category}</p>
				{#if selectedBrush.metadata.description}
					<p><strong>Description:</strong> {selectedBrush.metadata.description}</p>
				{/if}
				{#if selectedBrush.metadata.tags && selectedBrush.metadata.tags.length > 0}
					<p><strong>Tags:</strong> {selectedBrush.metadata.tags.join(', ')}</p>
				{/if}
				<p><strong>Default Width:</strong> {selectedBrush.defaultWidth}px</p>
				<p><strong>Backbone Length:</strong> {selectedBrush.backbone.length}px</p>
				<p><strong>Outline Points:</strong> {selectedBrush.outline.points.length}</p>
			</div>

			<!-- Selected Brush Preview (Larger) -->
			{#if showPreview}
				<div class="selected-preview">
					<h5>Preview</h5>
					<div class="large-preview">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html generateBrushPreview(selectedBrush, 120)}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.brush-selector {
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #fafafa;
		max-width: 400px;
	}

	h3,
	h4,
	h5 {
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

	.brush-category {
		font-size: 0.75rem;
		color: #666;
		text-transform: capitalize;
	}

	.brush-customization {
		border-top: 1px solid #ddd;
		padding-top: 1rem;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.control-group label {
		min-width: 60px;
		font-weight: 500;
	}

	.control-group input[type='range'] {
		flex-grow: 1;
	}

	.value-display {
		min-width: 40px;
		text-align: right;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.brush-details {
		background: white;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.brush-details p {
		margin: 0.5rem 0;
	}

	.selected-preview {
		text-align: center;
	}

	.large-preview {
		display: inline-block;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.5rem;
		background: white;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.brush-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.brush-option {
			min-height: 80px;
		}

		.control-group {
			flex-direction: column;
			align-items: stretch;
		}

		.value-display {
			text-align: center;
		}
	}
</style>

<script lang="ts">
	import { BrushPresets, type BrushDefinition } from '$lib/BrushGeometry.js';

	// Props
	interface Props {
		selectedBrush?: BrushDefinition;
		strokeWidth?: number; // Multiplier for brush thickness
	}

	let availableBrushes = $state(BrushPresets.getAllPresets());

	let { selectedBrush = $bindable(availableBrushes[0]), strokeWidth = $bindable(1) }: Props =
		$props();
</script>

<div class="brush-selector">
	<h3>Brush Selection</h3>

	<!-- Brush Grid -->
	<div class="brush-grid">
		{#each availableBrushes as brush (brush.id)}
			<button
				class="brush-option"
				class:selected={selectedBrush?.id === brush.id}
				onclick={() => (selectedBrush = brush)}
				title={brush.name}
			>
				<div class="brush-preview">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<svg width="100%" height="100%" viewBox="0 0 120 60">
						<g transform="translate(10, 30)">
							<path d={brush.path} fill="#333" stroke="none" />
							<path
								d="M 0 0 L 100 0"
								stroke="#666"
								stroke-width="1"
								stroke-dasharray="2,2"
								opacity="0.5"
							/>
						</g>
					</svg>
				</div>

				<div class="brush-info">
					<span class="brush-name">{brush.name}</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Stroke width control -->
	<div class="stroke-width-controls">
		<label for="strokeWidth" class="control-label">Stroke Width</label>
		<div class="control-row">
			<input id="strokeWidth" type="range" min="0.2" max="4" step="0.1" bind:value={strokeWidth} />
			<input
				type="number"
				min="0.1"
				max="10"
				step="0.1"
				bind:value={strokeWidth}
				class="number-input"
			/>
		</div>
		<div class="hint">1 = base width, 2 = double, 0.5 = half</div>
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

	.stroke-width-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px dashed #ddd;
	}

	.control-label {
		font-weight: 600;
		color: #333;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.number-input {
		width: 80px;
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
	}

	.hint {
		font-size: 0.8rem;
		color: #666;
	}
</style>

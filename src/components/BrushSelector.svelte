<script lang="ts">
	import { type Brush, getAllBrushes } from '$lib/index.js';

	interface Props {
		selectedBrush?: Brush | null;
		strokeWidth?: number;
	}

	const availableBrushes = $state(getAllBrushes());

	let { selectedBrush = $bindable(availableBrushes[0]), strokeWidth = $bindable(1) }: Props =
		$props();

	const brushButtonBase =
		'group relative flex w-full flex-col items-center gap-4 rounded-xl border border-black/10 bg-white px-5 py-5 text-left shadow-sm transition hover:border-black hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-accent';

	function chooseBrush(brush: Brush) {
		selectedBrush = brush;
	}
</script>

<section class="flex flex-col gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
	<header class="flex flex-col gap-1">
		<h3 class="text-lg font-semibold text-black">Brush Selection</h3>
		<p class="text-sm text-black/70">Preview and choose a brush, then adjust the stroke width.</p>
	</header>

	<div class="max-h-72 md:max-h-[50vh] space-y-4 overflow-y-auto pr-1 py-1">
		{#each availableBrushes as brush (brush.name)}
			{@const isSelected = selectedBrush?.name === brush.name}
			<button
				type="button"
				class={`${brushButtonBase} ${isSelected ? 'border-canvas-accent ring-2 ring-canvas-accent' : ''}`}
				onclick={() => chooseBrush(brush)}
				title={brush.name}
			>
				<div class="flex h-24 w-full items-center justify-center rounded-lg bg-white">
					<svg class="h-full w-full text-black" viewBox="0 0 100 16" aria-hidden="true">
						<g transform="translate(0, 8)">
							<path d={brush.path} fill="currentColor" stroke="none" />
							<path
								d="M 0 0 L 100 0"
								stroke="currentColor"
								class="text-black/30"
								stroke-width="1"
								stroke-dasharray="2,2"
								opacity="0.5"
							/>
						</g>
					</svg>
				</div>

				<div class="text-center">
					<span class="text-sm font-medium text-black">{brush.name}</span>
				</div>
			</button>
		{/each}
	</div>

	<div class="flex flex-col gap-3 border-t border-dashed border-black/20 pt-4">
		<label for="strokeWidth" class="text-sm font-semibold text-black">Stroke Width</label>

		<div class="flex items-center gap-3">
			<input
				id="strokeWidth"
				type="range"
				min="0.2"
				max="4"
				step="0.1"
				bind:value={strokeWidth}
				class="h-2 flex-1 cursor-pointer rounded-lg accent-canvas-accent"
			/>
			<input
				type="number"
				min="0.1"
				max="10"
				step="0.1"
				bind:value={strokeWidth}
				class="w-24 rounded-md border border-black/20 bg-white px-3 py-2 text-sm font-medium text-black focus:border-canvas-accent focus:outline-none focus:ring-2 focus:ring-canvas-accent/40"
			/>
		</div>

		<p class="text-xs text-black/70">1 = base width, 2 = double thickness, 0.5 = half.</p>
	</div>
</section>

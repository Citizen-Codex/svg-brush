<script lang="ts">
	import { createBrushStroke } from '../../lib/index.js';
	import { scaleLinear, line, extent } from 'd3';

	const margin = { top: 20, right: 20, bottom: 30, left: 40 };

	const width = 800;
	const height = 600;

	const data = [];

	for (let i = 0; i < 10; i++) {
		data.push({ x: i, y: Math.sin(i / 10) * 10 + Math.random() * 10 });
	}

	const xScale = scaleLinear()
		.domain(extent(data, (d) => d.x) as [number, number])
		.range([margin.left, width - margin.right]);

	const yScale = scaleLinear()
		.domain(extent(data, (d) => d.y) as [number, number])
		.range([height - margin.bottom, margin.top]);

	const lineGenerator = line<{ x: number; y: number }>()
		.x((d) => xScale(d.x))
		.y((d) => yScale(d.y));

	const lineD = lineGenerator(data);
</script>

<svg {width} {height}>
	<!-- x-axis -->
	<g transform="translate(0, {height - margin.bottom})">
		<path stroke="currentColor" d={`M${margin.left},0.5 H${width - margin.right}`} />
		{#each xScale.ticks(10) as tick, i (i)}
			<g class="tick" transform={`translate(${xScale(tick)},0)`}>
				<line stroke="currentColor" y2="6" />
				<text y="9" dy="0.71em" text-anchor="middle">{tick}</text>
			</g>
		{/each}
	</g>

	<!-- y-axis -->
	<g transform="translate({margin.left}, 0)">
		<path stroke="currentColor" d={`M0.5,${margin.top} V${height - margin.bottom}`} />
		{#each yScale.ticks(10) as tick, i (i)}
			<g class="tick" transform={`translate(0,${yScale(tick)})`}>
				<line stroke="currentColor" x1="-6" x2="0" />
				<text x="-9" dy="0.32em" text-anchor="end">{tick}</text>
			</g>
		{/each}
	</g>

	<g>
		<path
			d={createBrushStroke(lineD, {
				brush: 'Figma Epic',
				strokeWidth: 1,
				simplificationTolerance: 0.3
			})}
			fill="black"
		/>
		<path d={lineD} fill="none" stroke="black" stroke-width="1" />
	</g>
</svg>

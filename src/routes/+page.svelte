<script lang="ts">
	import DrawingApp from '../components/DrawingApp.svelte';
</script>

<svelte:head>
	<title>SVG Brush Playground - Vector brushes in the browser</title>
	<meta
		name="description"
		content="Interactive demo of SVG brush drawing with backbone deformation technique"
	/>
</svelte:head>

<main class="flex h-full w-full items-stretch">
	<DrawingApp canvasWidth={800} canvasHeight={600} showToolbar={true} />
</main>

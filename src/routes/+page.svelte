<script>
	import DrawingApp from '../components/DrawingApp.svelte';
</script>

<svelte:head>
	<title>SVG Brush Drawing - Backbone Deformation Demo</title>
	<meta
		name="description"
		content="Interactive demo of SVG brush drawing with backbone deformation technique"
	/>
</svelte:head>

<main>
	<DrawingApp canvasWidth={800} canvasHeight={600} showToolbar={true} showBrushSelector={true} />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	main {
		width: 100vw;
		height: 100vh;
	}
</style>

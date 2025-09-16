# SVG Brush Drawing Library

A TypeScript library for creating interactive SVG drawing applications with advanced **backbone deformation** brush techniques. Built as a SvelteKit package, this library provides mathematical utilities and Svelte components for implementing sophisticated brush-based drawing systems.

### Package Structure

```
src/
├── lib/
│   ├── index.ts              # Main exports
│   ├── PathMath.ts           # SVG path mathematics
│   ├── BrushGeometry.ts      # Brush definitions
│   ├── BackboneDeformation.ts # Deformation algorithms
│   └── FigmaBrushes.ts       # Figma brush definitions
├── components/               # Components for the demo page
│   ├── DrawingApp.svelte     # Complete drawing app
│   ├── SvgCanvas.svelte      # Drawing canvas
│   └── BrushSelector.svelte  # Brush selection UI
└── routes/
    └── +page.svelte          # Demo page
```

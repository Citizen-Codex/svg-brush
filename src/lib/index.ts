// SVG Brush Drawing Library
// Main entry point for the backbone deformation brush system

// Core mathematical utilities
export { PathMath, type Point, type PathFrame } from './PathMath.js';

// Brush geometry system
export {
	BrushPresets,
	BrushGeometryUtils,
	createStraightBackbone,
	type BrushDefinition,
	type BrushBackbone,
	type BrushOutline
} from './BrushGeometry.js';

// Deformation engine
export { BackboneDeformation, type ProjectionResult } from './BackboneDeformation.js';

// Svelte components (re-exported from components folder)
export { default as SvgCanvas } from '../components/SvgCanvas.svelte';
export { default as BrushSelector } from '../components/BrushSelector.svelte';
export { default as DrawingApp } from '../components/DrawingApp.svelte';

// SVG Brush Drawing Library
// Main entry point for the backbone deformation brush system

// Core mathematical utilities
export { PathMath, type Point, type PathFrame } from './math/PathMath.js';

// Brush geometry system
export {
	BrushPresets,
	BrushGeometryUtils,
	createStraightBackbone,
	createCurvedBackbone,
	type BrushDefinition,
	type BrushBackbone,
	type BrushOutline
} from './brush/BrushGeometry.js';

// Deformation engine
export {
	BackboneDeformation,
	DEFAULT_DEFORMATION_OPTIONS,
	type ProjectionResult,
	type DeformationOptions
} from './deformation/BackboneDeformation.js';

// Svelte components
export { default as SvgCanvas } from './components/SvgCanvas.svelte';
export { default as BrushSelector } from './components/BrushSelector.svelte';
export { default as DrawingApp } from './components/DrawingApp.svelte';

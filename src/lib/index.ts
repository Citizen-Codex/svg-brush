// SVG Brush Drawing Library
// Main entry point for the backbone deformation brush system

// Core mathematical utilities
export { PathMath, type Point } from './PathMath.js';

// Brush geometry system
export {
  BrushPresets,
  BrushGeometryUtils,
  type BrushDefinition,
} from './BrushGeometry.js';

// Deformation engine
export { BackboneDeformation, type ProjectionResult } from './BackboneDeformation.js';

export { default as figmaBrushes } from './FigmaBrushes.js';

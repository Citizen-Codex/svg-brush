// Brush definitions
export { type Brush, getBrush, getAllBrushes, createPathBrush, createPointsBrush } from './BrushDefinitions.js';

// Core path utilities
export { type Point, pointsToSmoothPath, pointsToPath, pathToPoints } from './PathMath.js';

// Main deformation function 
export { createBrushStroke, deformBrush } from './Deformation.js';

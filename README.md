# SVG Brush Drawing Library

A powerful Svelte library for creating interactive SVG drawing applications with advanced **backbone deformation** brush techniques. This library implements the sophisticated mathematical approach discussed in your conversation - allowing brush shapes to be intelligently deformed along user-drawn paths.

![SVG Brush Demo](demo-preview.png) *(Demo available at localhost:5173)*

## 🎨 Key Features

### Advanced Brush System
- **Backbone Deformation**: Revolutionary technique that deforms brush geometry along curved paths
- **Multiple Brush Types**: Round, Flat, Calligraphy, and Textured brushes
- **Real-time Drawing**: Smooth, responsive drawing with live preview
- **Customizable Brushes**: Scale, rotate, and modify brush properties

### Mathematical Precision  
- **Path Analysis**: Advanced tangent, normal, and curvature calculations
- **Length Compensation**: Automatic scaling for different path lengths
- **Curvature Scaling**: Dynamic brush width adjustment based on curve tightness
- **Optimized Projections**: Efficient algorithms for backbone-to-path mapping

### Developer Experience
- **TypeScript**: Full type safety and excellent IDE support
- **Modular Architecture**: Clean separation between math, geometry, and UI components
- **Svelte 5**: Built with the latest Svelte features (`$state`, `$effect`, etc.)
- **Export Functionality**: Save drawings as SVG files

## 🚀 Quick Start

### Installation

```bash
npm install svg-brush
```

### Basic Usage

```svelte
<script>
  import { DrawingApp } from 'svg-brush';
</script>

<DrawingApp 
  canvasWidth={800}
  canvasHeight={600}
  showToolbar={true}
  showBrushSelector={true}
/>
```

### Advanced Usage

```svelte
<script>
  import { 
    SvgCanvas, 
    BrushSelector, 
    BrushPresets,
    BackboneDeformation 
  } from 'svg-brush';
  
  let selectedBrush = BrushPresets.roundBrush(25);
  let deformationOptions = {
    lengthCompensation: true,
    curvatureScaling: true,
    maxCurvatureScale: 0.3,
    projectionSamples: 150
  };
</script>

<div class="drawing-interface">
  <BrushSelector bind:selectedBrush />
  <SvgCanvas 
    width={1000} 
    height={700}
    brush={selectedBrush}
    {deformationOptions}
    backgroundColor="#f8f9fa"
    showGrid={true}
  />
</div>
```

## 🧮 Core Concepts

### Backbone Deformation Algorithm

The library's main innovation is the **backbone deformation** technique:

1. **Brush Definition**: Each brush has a geometric outline and a central "backbone" (spine)
2. **Path Projection**: User drawing points are projected onto the brush backbone
3. **Frame Calculation**: Mathematical frames (position, tangent, normal) are computed along the user's path
4. **Deformation Mapping**: Brush points are transformed using the local coordinate system of the user's path

```typescript
// Example: Custom brush creation
import { createStraightBackbone, type BrushDefinition } from 'svg-brush';

const customBrush: BrushDefinition = {
  id: 'custom',
  name: 'My Brush',
  backbone: createStraightBackbone(100),
  outline: {
    points: [/* your brush outline points */],
    closed: true
  },
  defaultWidth: 20,
  metadata: { category: 'custom' }
};
```

### Mathematical Utilities

```typescript
import { PathMath, BackboneDeformation } from 'svg-brush';

// Analyze SVG paths
const tangent = PathMath.getTangentAt(svgPath, 0.5);
const curvature = PathMath.getCurvatureAt(svgPath, 0.5);

// Apply deformation
const deformedPoints = BackboneDeformation.deformBrush(
  brush, 
  userPath, 
  options
);
```

## 📦 API Reference

### Components

#### `DrawingApp`
Complete drawing application with toolbar and brush selection.

**Props:**
- `canvasWidth?: number` - Canvas width (default: 800)
- `canvasHeight?: number` - Canvas height (default: 600)  
- `showToolbar?: boolean` - Show toolbar (default: true)
- `showBrushSelector?: boolean` - Show brush selector (default: true)

#### `SvgCanvas`
Core drawing canvas component.

**Props:**
- `width?: number` - Canvas width
- `height?: number` - Canvas height
- `brush?: BrushDefinition` - Active brush
- `deformationOptions?: DeformationOptions` - Deformation settings
- `backgroundColor?: string` - Canvas background color
- `showGrid?: boolean` - Show grid overlay

**Events:**
- `strokeStart` - Drawing starts
- `strokeUpdate` - Drawing in progress
- `strokeEnd` - Drawing completed

#### `BrushSelector`
Brush selection and customization interface.

**Props:**
- `selectedBrush?: BrushDefinition` - Currently selected brush
- `showPreview?: boolean` - Show brush previews
- `previewSize?: number` - Preview size in pixels

### Core Classes

#### `BrushPresets`
Pre-defined brush geometries.

```typescript
BrushPresets.roundBrush(width?: number)
BrushPresets.flatBrush(width?: number, length?: number)  
BrushPresets.caliggraphyBrush(width?: number)
BrushPresets.textureBrush(width?: number)
BrushPresets.getAllPresets()
```

#### `BackboneDeformation`
Main deformation engine.

```typescript
BackboneDeformation.deformBrush(brush, userPath, options?)
BackboneDeformation.createDeformedStroke(brush, userPath, options?)
BackboneDeformation.projectPointToBackbone(point, brush, options?)
```

#### `PathMath`
SVG path mathematical utilities.

```typescript
PathMath.getTangentAt(path, t)
PathMath.getNormalAt(path, t) 
PathMath.getFrameAt(path, t)
PathMath.getCurvatureAt(path, t)
PathMath.pointsToSmoothSVGPath(points)
```

### Types

```typescript
interface BrushDefinition {
  id: string;
  name: string;
  backbone: BrushBackbone;
  outline: BrushOutline;
  defaultWidth: number;
  metadata: {
    description?: string;
    category?: string;
    tags?: string[];
  };
}

interface DeformationOptions {
  lengthCompensation: boolean;
  curvatureScaling: boolean;
  maxCurvatureScale: number;
  projectionSamples: number;
}

interface Point {
  x: number;
  y: number;
}
```

## 🛠️ Development

### Setup

```bash
git clone [repository]
cd svg-brush
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the interactive demo.

### Building

```bash
npm run build        # Build the library
npm run check        # TypeScript checks
npm run lint         # Linting and formatting
npm run format       # Auto-format code
```

### Testing the Library

The demo page showcases all features:

1. **Brush Selection**: Choose from 4 different brush types
2. **Interactive Drawing**: Draw curved paths and see backbone deformation in action
3. **Real-time Controls**: Adjust deformation settings live
4. **Export**: Save your artwork as SVG files

## 🎯 Use Cases

- **Digital Art Applications**: Professional drawing tools
- **Educational Software**: Teaching vector graphics and mathematical concepts  
- **Signature Collection**: Handwriting and signature capture
- **Design Tools**: Custom brush creation for graphic design
- **Interactive Demos**: Mathematical visualization of curve deformation

## 🧪 Advanced Examples

### Custom Brush Creation

```typescript
import { createCurvedBackbone, type BrushDefinition } from 'svg-brush';

// Create a brush with curved backbone
const curvedBrush: BrushDefinition = {
  id: 'wave',
  name: 'Wave Brush',
  backbone: createCurvedBackbone([
    { x: 0, y: 0 },
    { x: 50, y: 10 }, 
    { x: 100, y: -5 }
  ]),
  outline: {
    points: [/* wave-like outline */],
    closed: true
  },
  defaultWidth: 30,
  metadata: { category: 'artistic' }
};
```

### Performance Optimization

```typescript
// Batch process multiple brushes
const results = BackboneDeformation.deformMultipleBrushes(
  [brush1, brush2, brush3],
  userPath,
  { projectionSamples: 50 } // Lower samples for better performance
);
```

### Custom Deformation Settings

```typescript
const preciseSettings: DeformationOptions = {
  lengthCompensation: true,
  curvatureScaling: true,
  maxCurvatureScale: 0.2,     // Tighter curves
  projectionSamples: 200      // Higher precision
};

const performanceSettings: DeformationOptions = {
  lengthCompensation: false,
  curvatureScaling: false, 
  maxCurvatureScale: 1.0,
  projectionSamples: 50       // Faster processing
};
```

## 🤝 Contributing

Contributions are welcome! This library implements cutting-edge mathematical techniques and there's room for:

- **New Brush Types**: Additional preset brushes
- **Performance Optimizations**: WebGL acceleration, Web Workers
- **Advanced Deformation**: Non-linear backbone support, texture mapping
- **Export Formats**: PNG, PDF, other vector formats

## 📚 Mathematical Background

This library implements the **backbone deformation** technique discussed in advanced computer graphics literature. The core insight is that any brush stroke can be decomposed into:

1. A **backbone curve** (the central spine)
2. **Offset geometry** (points relative to the backbone)  
3. A **deformation mapping** that preserves the relative relationships

The mathematical foundation includes:
- **Frenet-Serret frames** for path coordinate systems
- **Arc-length parameterization** for uniform sampling
- **Curvature analysis** for adaptive deformation
- **Projection algorithms** for backbone mapping

## 📄 License

MIT License - feel free to use this in your projects!

## 🙋‍♂️ Support

- 📖 **Documentation**: Complete API reference above
- 💻 **Demo**: Interactive example at localhost:5173
- 🐛 **Issues**: Report bugs and request features
- 💡 **Discussions**: Share your creations and ask questions

---

Built with ❤️ using **Svelte 5**, **TypeScript**, and advanced mathematical algorithms.
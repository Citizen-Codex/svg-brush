# SVG Brush

A dead simple utility for creating vector based brush strokes in the browser. This package is the answer to an innocent little task: you have a brush stroke template that you want to morph into an arbitrary path. While the task description is small, the applications are vast. 

For ease of use, we have preloaded the library with all the default brushes that come with [Figma Draw](https://www.figma.com/draw/) but by all means BYOB. If you wanna experiement, here's a [playground](https://svg-brush-pink.vercel.app/) for ya.

Use it in dynamic data-viz

<img  height="300" alt="image" src="https://github.com/user-attachments/assets/862ef240-fe27-4e45-9783-9f90cf1bef49" />

or use it to make diagrams

<img height="450" alt="image" src="https://github.com/user-attachments/assets/574a17ef-9369-471a-ba7b-8165c03f57f9" />

or something else entirely!

## Usage

To install, do one of these or equivalent
```
pnpm i svg-brush
```
then use an array of points or an existing path string like this
```
import { createBrushStroke } from 'svg-brush'

const points = [{x: 0, y: 0}, {x: 20, y: 20}]

const brushPathForPoints = createBrushStroke(points)

const brushPathForPointsWithOptions = createBrushStroke(
    points,
    {
        brush: 'Figma Blockbuster'
        strokeWidth: 1,
        simplificationTolerance: 0.3,
        brushAugmentation: false 
    }
)

const path = 'M0,0 L20,20 Z'

const brushPathForPath = createBrushStroke(path)

const brushPathForPathWithOptions = createBrushStroke(
    path,
    {
        brush: 'Figma Blockbuster'
        strokeWidth: 1,
        simplificationTolerance: 0.3,
        brushAugmentation: false 
    }
)
```
Of course there's more to the story too. You can define custom brushes, use utilities for conversion between paths and point sets and access types. A lot of this api is likely to change in the future, so if you're interested, you're encouraged to look through the `lib` folder.

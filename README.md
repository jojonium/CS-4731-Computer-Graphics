# CS 4731: Computer Graphics

Coursework and projects for the undergraduate WPI computer science class CS
4731: Computer Graphics.

## Building

```
$ npm run build
```

The `npm run compile` script uses tsc to compile TypeScript in the `src/`
directory, and outputs it to the `build/` directory. `npm run bundle` uses
browserify to bundle this JavaScript and emits it in the `dist/` directory.
`npm run build` combines both of these into one script.

## Project 1

Project 1 is a simple program that displays WebGL polylines on an HTML canvas.
It has two basic modes:

### File mode

In this mode, the user can upload a text file containing the coordinates of the
polylines to draw.

  - The file may begin with one or more lines of comments followed by a line
	starting with an asterisk. Lines up to and including the asterisk line will
	be ignored.
  - The first line after the asterisk line can contain four numbers that define
	the left, top, right, and bottom extents of the figure in that order. If
	this line is omitted the program will use the physical bounds of the figure
	as its extents.
  - The next line must be the number of polylines in the figure
  - The rest of the file is the list of polylines. Each polyline starts with a
	line that indicates the nubmer of points in the polyline. Subsequent lines
	list the (x, y) pairs as space-separated numbers for each point.

### Draw mode

In this mode, the user can draw polylines on the canvas using their mouse. Each
time the user clicks on the canvas, the point clicked is added to a growing
polyline, up to 100 points. If the "b" key is held down while clicking, the
current point is not joined to the previous point, and instead starts a new
polyline.

In addition, the user can select the color to draw the polylines by pressing
the "c" key or using a color picker input on the page. Users can also draw
additional polylines on figures from uploaded files.

## Project 2

Project 2 parses a user-uploaded (PLY
file)[https://en.wikipedia.org/wiki/PLY_(file_format)] and displays it as a
wireframe mesh in a WebGL canvas. The mesh is scaled and centered so it fits
nicely in the viewport, and the user can rotate and translate it on any axis
using the controls on the page. The mesh can also be made to "pulse" by
translating each polygon along its normal vector.

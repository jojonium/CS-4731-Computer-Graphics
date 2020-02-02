/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 1
 */

import { setupWebGL } from "./lib/webgl-utils";
import { initShaders } from "./lib/initShaders";
import { createFileInput, getInput, parseFileText } from "./fileMode";
import vec4 from "./lib/tsm/vec4";
import mat4 from "./lib/tsm/mat4";
import { handleClick } from "./drawMode";

/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten<T>(arr: T[][]): T[] {
  return new Array<T>().concat(...arr);
}

/**
 * create a <canvas> element and add it to the #canvas-container
 * @return the created canvas
 */
const createCanvas = (): HTMLCanvasElement => {
  // remove any existing canvas
  document.getElementById("webgl")?.remove();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.id = "webgl";
  document.getElementById("canvas-container")?.appendChild(canvas);
  return canvas;
};

/**
 * resets the canvas size and WebGL viewport to default values, clears the
 * screen
 * @param canvas the canvas to clear
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 */
const clearCanvas = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram
): void => {
  // set default view port and canvas size
  canvas.width = 640;
  canvas.height = 480;
  const projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
  const projMatrix = mat4.orthographic(0, 640, 0, 480, -1.0, 1.0);
  gl.uniformMatrix4fv(
    projMatrixLoc,
    false,
    Float32Array.from(projMatrix.all())
  );
  gl.viewport(0, 0, 640, 480);

  // set clear color and clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
};

/**
 * sets canvas size and draws polylines
 * @param canvas the canvas element to draw on
 * @param gl the WebGL rendering context to draw on
 * @param program the WebGL program to use
 * @param polylines each element of this array is a polyline, made up of many
 * points expressed as vec4s
 * @param color the red, green, and blue components of the color to use for
 * drawing lines, each from 0-1
 * @param extents extents of the world as [left, top, right bottom]
 */
const drawPolylines = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  polylines: vec4[][],
  color = { r: 1, g: 1, b: 1 },
  extents: [number, number, number, number] = [0, 0.75, 1, 0]
): void => {
  // clear the drawing canvas and color it white
  clearCanvas(canvas, gl, program);
  const projMatrix = mat4.orthographic(
    extents[0],
    extents[2],
    extents[3],
    extents[1],
    -1.0,
    1.0
  );
  const projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
  gl.uniformMatrix4fv(
    projMatrixLoc,
    false,
    Float32Array.from(projMatrix.all())
  );
  const w = extents[2] - extents[0];
  const h = extents[1] - extents[3];
  if (w < h) {
    // image is taller than it is wide
    canvas.height = 480;
    canvas.width = (480 * w) / h;
  } else {
    // image is at least as wide as it is tall
    canvas.width = 640;
    canvas.height = (640 * h) / w;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // create new vertex buffer
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

  // pass vertex data to the buffer
  for (const vecs of polylines) {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      Float32Array.from(flatten(vecs.map(p => p.xyzw))),
      gl.STATIC_DRAW
    );
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    // pass color data to the buffer
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    const colorArray = new Array<[number, number, number, number]>(vecs.length);
    colorArray.fill([color.r, color.g, color.b, 1.0]);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      Float32Array.from(flatten(colorArray)),
      gl.STATIC_DRAW
    );
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vColor);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

    // draw the lines
    gl.drawArrays(gl.LINE_STRIP, 0, vecs.length);
  }
};

function main(): void {
  // create the <canvas> element
  const canvas = createCanvas();
  // create the file upload input
  const fileInput = createFileInput();

  // set up default variables
  const defaultColors = [
    { r: 0, g: 0, b: 0 }, // black
    { r: 1, g: 0, b: 0 }, // red
    { r: 0, g: 1, b: 0 }, // green
    { r: 0, g: 0, b: 1 } // blue
  ];
  let colorIndex = 0;
  let extents: [number, number, number, number] = [0, 0.75, 1, 0];
  let polylines: vec4[][] = [];
  let bDown = false;
  let justDrewFile = false;

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize viewport and line width
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.lineWidth(2);

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // clear the drawing canvas and color it white
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  clearCanvas(canvas, gl, program);

  // listen for various key presses that we care about
  document.addEventListener("keydown", (ev: KeyboardEvent) => {
    let m: HTMLElement | null;
    switch (ev.key) {
      case "f": // enter file mode
        polylines = [];
        extents = [0, 0.75, 1, 0];
        m = document.getElementById("mode");
        if (m !== null) m.innerText = "File Mode";
        clearCanvas(canvas, gl, program);
        break;
      case "d": // enter draw mode
        polylines = [];
        extents = [0, 0.75, 1, 0];
        m = document.getElementById("mode");
        if (m !== null) m.innerText = "Draw Mode";
        clearCanvas(canvas, gl, program);
        break;
      case "c": // toggle colors
        colorIndex = (colorIndex + 1) % defaultColors.length;
        drawPolylines(
          canvas,
          gl,
          program,
          polylines,
          defaultColors[colorIndex],
          extents
        );
        break;
      case "b": // track when B is held/released
        bDown = true;
        break;
    }
  });

  // listen for the B key being released
  document.addEventListener("keyup", (ev: KeyboardEvent) => {
    if (ev.key === "b") bDown = false;
  });

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    const m = document.getElementById("mode");
    if (m !== null) m.innerText = "File Mode";
    getInput(fileInput)
      .then(parseFileText)
      .then(args => {
        extents = args.extents;
        polylines = args.polylines;
        drawPolylines(
          canvas,
          gl,
          program,
          polylines,
          defaultColors[colorIndex],
          extents
        );
      })
      .catch(err => {
        console.error(err);
      });
    justDrewFile = true; // start a new line the next time the user clicks
  });

  // handle mouse clicks on the canvas
  canvas.addEventListener("mousedown", (ev: MouseEvent) => {
    const m = document.getElementById("mode");
    if (m !== null) m.innerText = "Draw Mode";
    // translate the click location to its relative position on the canvas
    const rect = canvas.getBoundingClientRect();
    let mx = (ev.clientX - rect.left) / canvas.width;
    let my = (canvas.height - (ev.clientY - rect.top)) / canvas.height;
    mx = mx * (extents[2] - extents[0]) + extents[0];
    my = my * (extents[1] - extents[3]) + extents[3];
    polylines = handleClick(mx, my, polylines, bDown || justDrewFile);
    drawPolylines(
      canvas,
      gl,
      program,
      polylines,
      defaultColors[colorIndex],
      extents
    );
    justDrewFile = false;
  });
}

window.onload = main;

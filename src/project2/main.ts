/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 */

import { createFileInput, getInput, parseFileText } from "./file";
import { initShaders } from "./lib/initShaders";
import mat4 from "./lib/tsm/mat4";
import vec4 from "./lib/tsm/vec4";
import { setupWebGL } from "./lib/webgl-utils";

/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten<T>(arr: T[][]): T[] {
  return new Array<T>().concat(...arr);
}

/**
 * converts a fractional color value to a 2-digit hex string
 * @param num a color value from 0 to 1
 */
const toHex = (num: number): string => {
  let out = Math.floor(num * 255)
    .toString(16)
    .slice(0, 2);
  if (out.length < 2) out = "0" + out;
  return out;
};

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
 * TODO remove
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

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(console.log)
      // TODO implement
      .catch((err: Error) => {
        console.error("Invalid file format:");
        console.error(err);
      });
  });
}

window.onload = main;

import { setupWebGL } from "./lib/webgl-utils";
import { initShaders } from "./lib/initShaders";
import { createFileInput, getInput, parseFileText } from "./fileMode";
import vec4 from "./lib/tsm/vec4";
import mat4 from "./lib/tsm/mat4";

/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten<T>(arr: T[][]): T[] {
  return new Array<T>().concat(...arr);
}

/**
 * create a <canvas> element and add it to the #container
 * @return the created canvas
 */
const createCanvas = (): HTMLCanvasElement => {
  // remove any existing canvas
  document.getElementById("webgl")?.remove();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.id = "webgl";
  document.getElementById("container")?.appendChild(canvas);
  return canvas;
};

/**
 * resets the canvas size and WebGL viewport to default values, then clears the
 * screen
 * @param canvas the canvas to clear
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param color the red, green, and blue components of the background color,
 * each from 0-1
 */
const clearCanvas = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  color: { r: number; g: number; b: number }
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
  gl.clearColor(color.r, color.g, color.b, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
};

/**
 * sets canvas size and draws polylines
 * @param canvas the canvas element to draw on
 * @param gl the WebGL rendering context to draw on
 * @param program the WebGL program to use
 * @param the extents of the world as [left, top, right bottom]
 * @param polylines each element of this array is a polyline, made up of many
 * points expressed as vec4s
 */
const drawPolylines = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  extents: [number, number, number, number],
  polylines: vec4[][]
): void => {
  // clear the drawing canvas and color it white
  clearCanvas(canvas, gl, program, { r: 1, g: 1, b: 1 });
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
  clearCanvas(canvas, gl, program, { r: 1, g: 1, b: 1 });

  document.addEventListener("keydown", (ev: KeyboardEvent) => {
    switch (ev.key) {
      case "f":
        // TODO switch to file mode
        break;
      case "d":
        // TODO switch to draw mode
        break;
    }
  });

  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(args => {
        drawPolylines(canvas, gl, program, args.extents, args.polylines);
      })
      .catch(err => {
        console.error(err);
      });
  });
}

window.onload = main;

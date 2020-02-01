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
 * sets canvas size and draws polylines
 * @param canvas the canvas element to draw on
 * @param gl the WebGL rendering context to draw on
 * @param program the WebGL program to use
 * @param the extents of the world as [left, top, right bottom]
 * @param polylines each element of this array is a polyline, made up of many
 * points expressed as vec2s
 */
const drawPolylines = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  extents: [number, number, number, number],
  polylines: vec4[][]
): void => {
  // set default view port and canvas size
  canvas.width = 640;
  canvas.height = 480;
  const projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
  let projMatrix = mat4.orthographic(0, 640, 0, 480, -1.0, 1.0);
  gl.uniformMatrix4fv(
    projMatrixLoc,
    false,
    Float32Array.from(projMatrix.all())
  );
  gl.viewport(0, 0, 640, 480);

  // set the view port based on extents
  console.log(extents);
  projMatrix = mat4.orthographic(
    extents[0],
    extents[2],
    extents[3],
    extents[1],
    -1.0,
    1.0
  );
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

  /*
  const ratio = (extents[2] - extents[0]) / (extents[1] - extents[3]);
  const w = canvas.width;
  const h = canvas.height;
  let newW = canvas.width;
  let newH = canvas.height;

  if (ratio > w / h) {
    gl.viewport(0, 0, w, w / ratio);
    newH = w / ratio;
    newW = w;
  } else if (ratio < w / h) {
    gl.viewport(0, 0, h * ratio, h);
    newH = h;
    newW = h * ratio;
  }
  canvas.height = newH;
  canvas.width = newW;
  */

  // set clear color as white and clear the canvas
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
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

    // draw the lines
    gl.drawArrays(gl.LINE_STRIP, 0, vecs.length);
  }
};

function main(): void {
  // create the <canvas> element
  const canvas = createCanvas();
  // create the file upload input
  const input = createFileInput();

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize viewport
  gl.viewport(0, 0, canvas.width, canvas.height);

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  input.addEventListener("change", () => {
    getInput(input)
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

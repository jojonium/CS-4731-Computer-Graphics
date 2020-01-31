import { setupWebGL } from "./lib/webgl-utils";
import { initShaders } from "./lib/initShaders";
import { createFileInput, getInput, parseFileText } from "./fileMode";
import vec4 from "./lib/tsm/vec4";

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
function createCanvas(): HTMLCanvasElement {
  // remove any existing canvas
  document.getElementById("webgl")?.remove();
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  canvas.id = "webgl";
  document.getElementById("container")?.appendChild(canvas);
  return canvas;
}

/**
 * sets canvas size and draws polylines
 * @param gl the WebGL rendering context to draw on
 * @param program the WebGL program to use
 * @param the extents of the world as [left, top, right bottom]
 * @param polylines each element of this array is a polyline, made up of many
 * points expressed as vec2s
 */
const drawPolylines = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  extents: [number, number, number, number],
  polylines: vec4[][]
): void => {
  // set the view port
  // TODO use viewport() and ortho() to correctly scale the canvas to the size
  // of the figure
  gl.viewport(0, 0, 640, 480);

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

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  input.addEventListener("change", () => {
    getInput(input)
      .then(parseFileText)
      .then(args => {
        drawPolylines(gl, program, args.extents, args.polylines);
      })
      .catch(err => {
        console.error(err);
      });
  });
}

window.onload = main;

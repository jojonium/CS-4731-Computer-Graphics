/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 */

import { createFileInput, getInput, parseFileText } from "./file";
import { initShaders } from "./lib/initShaders";
import mat4 from "./lib/tsm/mat4";
import vec3 from "./lib/tsm/vec3";
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
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 */
const render = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  polygons: vec3[][]
): void => {
  // set view port and canvas size
  canvas.width = 640;
  canvas.height = 480;
  gl.viewport(0, 0, 640, 480);

  // clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // set perspective transform
  const aspectRatio = 1;
  const fovY = 45;
  const projMatrix = mat4.perspective(fovY, aspectRatio, 0.01, 100);
  const projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
  gl.uniformMatrix4fv(
    projMatrixLoc,
    false,
    Float32Array.from(projMatrix.all())
  );

  const eyeVec = new vec3([0, 0, 2]);
  const lookVec = new vec3([0, 0, 0]);
  const upVec = new vec3([0, 1, 0]);
  const modelView = mat4.lookAt(eyeVec, lookVec, upVec);
  // TODO apply transforms to the model
  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(
    modelMatrixLoc,
    false,
    Float32Array.from(modelView.all())
  );

  // buffer the vertices
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  const vertices = flatten(polygons);
  console.log(vertices);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(vertices.map(vec => [vec.x, vec.y, vec.z, 1.0]))),
    gl.STATIC_DRAW
  );

  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // buffer colors
  const cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  const colors = vertices.map(() => [1.0, 1.0, 1.0, 1.0]);
  console.log(colors);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(colors)),
    gl.STATIC_DRAW
  );
  const vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

  for (let i = 0; i < vertices.length - 2; i += 3) {
    gl.drawArrays(gl.LINE_LOOP, i, 3);
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

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(polygons => render(canvas, gl, program, polygons))
      // TODO implement
      .catch((err: Error) => {
        console.error("Invalid file format:");
        console.error(err);
      });
  });
}

window.onload = main;

/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 */

import { createFileInput, Extents, getInput, parseFileText } from "./file";
import { initShaders } from "./lib/initShaders";
import mat4 from "./lib/tsm/mat4";
import vec3 from "./lib/tsm/vec3";
import { setupWebGL } from "./lib/webgl-utils";
import { pulse } from "./helpers";

type TransformOpts = {
  scale: number;
  translate: vec3;
  pulseDistance: number;
};

/**
 * global variable used to store the ID of the animation callback so it can be
 * cancelled later
 */
let CALLBACK_ID: number | undefined = undefined;

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
/*
const toHex = (num: number): string => {
  let out = Math.floor(num * 255)
    .toString(16)
    .slice(0, 2);
  if (out.length < 2) out = "0" + out;
  return out;
};
*/

/**
 * create a <canvas> element and add it to the #canvas-container
 * @return the created canvas
 */
const createCanvas = (): HTMLCanvasElement => {
  // remove any existing canvas
  document.getElementById("webgl")?.remove();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  canvas.id = "webgl";
  document.getElementById("canvas-container")?.appendChild(canvas);
  return canvas;
};

/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 * @param extents the max and min dimensions of the model
 * @param frameNum the number of this frame
 * @param topts transform options
 */
const render = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  polygons: vec3[][],
  extents: Extents,
  frameNum: number,
  topts: TransformOpts
): void => {
  // set view port and clear canvas
  gl.viewport(0, 0, canvas.width, canvas.height);
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
  let modelView = mat4.lookAt(eyeVec, lookVec, upVec);

  // transform the modelView matrix
  const scaleFactor =
    1 /
    Math.max(
      extents.maxX - extents.minX,
      extents.maxY - extents.minY,
      extents.maxZ - extents.minZ
    );
  modelView = modelView
    .scale(new vec3([scaleFactor, scaleFactor, scaleFactor]))
    .translate(
      new vec3([
        -0.5 * (extents.minX + extents.maxX),
        -0.5 * (extents.minY + extents.maxY),
        -0.5 * (extents.minZ + extents.maxZ)
      ])
    );

  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(
    modelMatrixLoc,
    false,
    Float32Array.from(modelView.all())
  );

  // apply transformations to the vertices
  const transformedPolygons = polygons.map(poly =>
    pulse(poly, topts.pulseDistance)
  );
  const vertices = flatten(transformedPolygons);

  // buffer the vertices
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
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

  // change transformation values for next frame
  topts.pulseDistance = -((Math.cos(frameNum / 10) + 1) * 0.05) / scaleFactor;

  CALLBACK_ID = requestAnimationFrame((timeStamp: DOMHighResTimeStamp) => {
    render(canvas, gl, program, polygons, extents, frameNum + 1, topts);
  });
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

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // set initial transformation options
  const initialOpts: TransformOpts = {
    scale: 1,
    translate: new vec3([0, 0, 0]),
    pulseDistance: 0
  };

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    // cancel any existing animation
    if (CALLBACK_ID !== undefined) cancelAnimationFrame(CALLBACK_ID);
    getInput(fileInput)
      .then(parseFileText)
      .then(obj =>
        render(canvas, gl, program, obj.polygons, obj.extents, 0, initialOpts)
      )
      .catch((err: Error) => {
        console.error("Invalid file format:");
        console.error(err);
      });
  });
}

window.onload = main;

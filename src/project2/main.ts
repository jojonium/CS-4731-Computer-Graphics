/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 *
 * Extra credit features:
 *   - You can roll the model in any of the six directional axes, rather than
 *     just positive x. 'R' and 'T' roll around the X axis, 'F' and 'G' roll
 *     around the Y axis, and 'H' and 'J' roll around the Z axis.
 *   - A color-picker for the color of the mesh's lines. It can be changed at
 *     any time, even while animating, and then canvas will update instantly
 *   - The mesh can translate or rotate in any number of directions at once.
 *   - Press 'N' to toggle drawing normal vectors for each face.
 */

import { createFileInput, getInput, parseFileText } from "./file";
import { createCanvas, createColorInput } from "./helpers";
import { initShaders } from "./lib/initShaders";
import { setupWebGL } from "./lib/webgl-utils";
import { initTransformOpts, render } from "./render";

/**
 * All global variables are stored in this object to make them accessible from
 * any module
 */
export const GLOBALS = {
  /**
   * global variable used to store the ID of the animation callback so it can be
   * cancelled later
   */
  callbackID: undefined as number | undefined
};

function main(): void {
  // create the <canvas> element
  const canvas = createCanvas();
  // create the file upload input
  const fileInput = createFileInput();
  // create input for line color picker
  const lineColorInput = createColorInput();

  // initialize line color as white
  let lineColor = [1.0, 1.0, 1.0, 1.0];

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  let transformOpts = initTransformOpts();

  const startDrawing = (): void => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);
    getInput(fileInput)
      .then(parseFileText)
      .then(obj =>
        render(
          canvas,
          gl,
          program,
          obj.polygons,
          obj.extents,
          transformOpts,
          lineColor
        )
      )
      .catch((err: Error) => {
        console.error(err);
      });
  };

  // deal with key presses
  document.addEventListener("keypress", (ev: KeyboardEvent) => {
    const key = ev.key.toLowerCase();
    switch (key) {
      case "x":
        transformOpts.shouldXTranslate =
          transformOpts.shouldXTranslate === 0 ? 1 : 0;
        break;
      case "c":
        transformOpts.shouldXTranslate =
          transformOpts.shouldXTranslate === 0 ? -1 : 0;
        break;
      case "y":
        transformOpts.shouldYTranslate =
          transformOpts.shouldYTranslate === 0 ? 1 : 0;
        break;
      case "u":
        transformOpts.shouldYTranslate =
          transformOpts.shouldYTranslate === 0 ? -1 : 0;
        break;
      case "z":
        transformOpts.shouldZTranslate =
          transformOpts.shouldZTranslate === 0 ? 1 : 0;
        break;
      case "a":
        transformOpts.shouldZTranslate =
          transformOpts.shouldZTranslate === 0 ? -1 : 0;
        break;
      case "r":
        transformOpts.shouldXRoll = transformOpts.shouldXRoll === 0 ? 1 : 0;
        break;
      case "t":
        transformOpts.shouldXRoll = transformOpts.shouldXRoll === 0 ? -1 : 0;
        break;
      case "f":
        transformOpts.shouldYRoll = transformOpts.shouldYRoll === 0 ? 1 : 0;
        break;
      case "g":
        transformOpts.shouldYRoll = transformOpts.shouldYRoll === 0 ? -1 : 0;
        break;
      case "h":
        transformOpts.shouldZRoll = transformOpts.shouldZRoll === 0 ? 1 : 0;
        break;
      case "j":
        transformOpts.shouldZRoll = transformOpts.shouldZRoll === 0 ? -1 : 0;
        break;
      case "b":
        transformOpts.shouldPulse = !transformOpts.shouldPulse;
        break;
      case "n":
        transformOpts.drawNormals = !transformOpts.drawNormals;
        break;
    }
  });

  lineColorInput.addEventListener("change", () => {
    lineColor = [
      parseInt(lineColorInput.value.slice(1, 3), 16) / 255,
      parseInt(lineColorInput.value.slice(3, 5), 16) / 255,
      parseInt(lineColorInput.value.slice(5, 7), 16) / 255,
      1.0
    ];
    startDrawing();
  });

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    transformOpts = initTransformOpts();
    startDrawing();
  });
}

window.onload = main;

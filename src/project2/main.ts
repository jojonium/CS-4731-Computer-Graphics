/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 *
 * Extra credit features:
 *   - You can roll the model in any of the six directional axes, rather than
 *     just positive x. 'R' and 'T' roll around the X axis, 'F' and 'G' roll
 *     around the Y axis, and 'H' and 'J' roll around the Z axis.
 */

import { createFileInput, getInput, parseFileText } from "./file";
import { createCanvas } from "./helpers";
import { initShaders } from "./lib/initShaders";
import { setupWebGL } from "./lib/webgl-utils";
import { render, initTransformOpts } from "./render";

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
    }
  });

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);
    transformOpts = initTransformOpts();
    getInput(fileInput)
      .then(parseFileText)
      .then(obj =>
        render(canvas, gl, program, obj.polygons, obj.extents, transformOpts)
      )
      .catch((err: Error) => {
        console.error(err);
      });
  });
}

window.onload = main;

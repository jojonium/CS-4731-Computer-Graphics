/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 2
 */

import { createFileInput, getInput, parseFileText } from "./file";
import { createCanvas } from "./helpers";
import { initShaders } from "./lib/initShaders";
import vec3 from "./lib/tsm/vec3";
import { setupWebGL } from "./lib/webgl-utils";
import { render, TransformOpts } from "./render";

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

  // set initial transformation options
  const initialOpts: TransformOpts = {
    scale: 1,
    translate: new vec3([0, 0, 0]),
    pulseDistance: 0
  };

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);
    getInput(fileInput)
      .then(parseFileText)
      .then(obj =>
        render(canvas, gl, program, obj.polygons, obj.extents, 0, initialOpts)
      )
      .catch((err: Error) => {
        console.error(err);
      });
  });
}

window.onload = main;

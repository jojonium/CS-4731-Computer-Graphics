/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 1
 */

import { createCanvas } from "./helpers";
import { initShaders } from "./lib/initShaders";
import { setupWebGL } from "./lib/webgl-utils";
import { render } from "./render";
import { parseFileText, createFileInput, getInput } from "./file";
import { MobileElement } from "./MobileElement";
import { getCube, getSphere } from "./models";

export type Extents = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
};

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
  // create file input
  const fileInput = createFileInput();

  // create the mobile
  const mobile = new MobileElement(getSphere(), [1, 0, 0, 1]);

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(obj => {
        // TODO add object to the mobile
      });
  });

  const startDrawing = (): void => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);

    // get donut mesh from the server
    render(canvas, gl, program, mobile);
  };

  startDrawing();
}

window.onload = main;

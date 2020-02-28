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
  const mobile = new MobileElement(getSphere(), [0.05, 0.06, 0.04, 1]);
  mobile.nextRotDir = 1;
  // level 1
  const a1 = new MobileElement(getCube(), [1, 0.13, 0.43, 1]);
  a1.nextRotDir = -1;
  const a2 = new MobileElement(getSphere(), [0.98, 1, 0.07, 1]);
  const a3 = new MobileElement(getCube(), [0.25, 0.92, 0.83, 1]);
  mobile.addChild(a1);
  mobile.addChild(a2);
  mobile.addChild(a3);
  // level 2
  const b1 = new MobileElement(getSphere(), [0.32, 0.28, 0.61, 1]);
  b1.nextRotDir = 1;
  const b2 = new MobileElement(getCube(), [0.35, 0.76, 0.76, 1]);
  const b3 = new MobileElement(getCube(), [0.75, 0.87, 0.52, 1]);
  b3.nextRotDir = 1;
  a1.addChild(b1);
  a1.addChild(b2);
  a3.addChild(b3);
  // level 3
  const c1 = new MobileElement(getSphere(), [0.49, 0.87, 0.39, 1]);
  const c2 = new MobileElement(getSphere(), [0.89, 0.71, 0.02, 1]);
  const c3 = new MobileElement(getSphere(), [0.03, 0.3, 0.38, 1]);
  const c4 = new MobileElement(getCube(), [0.41, 0.92, 0.82, 1]);
  b1.addChild(c1);
  b3.addChild(c2);
  b3.addChild(c3);
  b3.addChild(c4);

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);
  gl.cullFace(gl.BACK);
  gl.enable(gl.DEPTH_TEST);

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(obj => {
        obj;
        // TODO add object to the mobile
      });
  });

  const startDrawing = (): void => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);

    // start rendering
    render(canvas, gl, program, mobile);
  };

  startDrawing();
}

window.onload = main;

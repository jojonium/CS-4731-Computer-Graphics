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
  const blueCube = new MobileElement(getCube(), [0, 0, 1, 1]);
  const greenSphere = new MobileElement(getSphere(), [0, 1, 0, 1]);
  const redSphere1 = new MobileElement(getSphere(), [0.5, 0, 0, 1]);
  const redSphere2 = new MobileElement(getSphere(), [0.6, 0, 0, 1]);
  const redSphere3 = new MobileElement(getSphere(), [0.7, 0, 0, 1]);
  const redSphere4 = new MobileElement(getSphere(), [0.9, 0, 0, 1]);
  const blueSphere = new MobileElement(getSphere(), [0, 0, 1, 1]);
  const blueCube2 = new MobileElement(getCube(), [0, 0, 1, 1]);
  const blueCube3 = new MobileElement(getCube(), [0, 0, 1, 1]);
  const anotherCube = new MobileElement(getCube(), [0, 1, 1, 1]);
  blueCube.rotDir = 1;
  mobile.addChild(blueCube);
  mobile.addChild(greenSphere);
  mobile.addChild(redSphere4);
  blueCube.addChild(redSphere1);
  redSphere1.addChild(redSphere2);
  redSphere1.addChild(blueSphere);
  redSphere2.addChild(redSphere3);
  greenSphere.addChild(blueCube2);
  greenSphere.addChild(blueCube3);
  greenSphere.addChild(anotherCube);

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

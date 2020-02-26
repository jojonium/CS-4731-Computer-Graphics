/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 1
 */

import { createCanvas } from "./helpers";
import { initShaders } from "./lib/initShaders";
import { setupWebGL } from "./lib/webgl-utils";
import { initTransformOpts, render } from "./render";
import { parseFileText, createFileInput, getInput } from "./file";
import vec3 from "./lib/tsm/vec3";

export type Extents = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
};

export type MobileElement = {
  polygons: vec3[][];
  extents: Extents;
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
  callbackID: undefined as number | undefined,
  mobile: {
    layer1: new Array<MobileElement>()
  }
};

function main(): void {
  // create the <canvas> element
  const canvas = createCanvas();
  // create file input
  const fileInput = createFileInput();

  // initialize line color as white
  const lineColor = [1.0, 1.0, 1.0, 1.0];

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  const transformOpts = initTransformOpts();

  const startDrawing = (): void => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);

    // get donut mesh from the server
    render(canvas, gl, program, GLOBALS.mobile, transformOpts, lineColor);
  };

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then((me: MobileElement) => {
        // add object to the mobile
        GLOBALS.mobile.layer1.push(me);
      });
  });

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

  startDrawing();
}

window.onload = main;

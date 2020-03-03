/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 1
 *
 * Extra credit features:
 *   - Each element of the mobile can have any number of children, to an
 *     arbitrary depth. The program will scale the viewport so the whole mobile
 *     still fits in it.
 *   - The entire mobile is automatically balanced so that objects in it never
 *     overlap. Horizontal bars extend far enough to accomodate all child
 *     elements below them
 *   - You can add any 3D model to the mobile by uploading to the file selector
 *     input. This model will be given a random color, scaled to the same size
 *     as the other elements, and added somewhere on the mobile. I have
 *     included all the ply files from Project 2 as well as a donut and sphere
 *     model I created in the dist/files directory
 */

import { createCanvas } from "./helpers";
import { initShaders } from "./lib/initShaders";
import { setupWebGL } from "./lib/webgl-utils";
import { render } from "./render";
import { parseFileText, createFileInput, getInput } from "./file";
import { MobileElement } from "./MobileElement";
import { getCube, getSphere } from "./models";
import vec4 from "./lib/tsm/vec4";

export type Extents = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
};

export const defaultExtents = (): Extents => {
  return {
    minX: 0,
    minY: 0,
    minZ: 0,
    maxX: 1,
    maxY: 1,
    maxZ: 1
  };
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
  const mobile = new MobileElement(getCube(), new vec4([0.0, 0.0, 1.0, 1]));
  //mobile.nextRotDir = 1;
  mobile.nextRotSpeed = Math.PI / 360;
  // level 1
  const a1 = new MobileElement(getCube(), new vec4([1, 0.0, 0.0, 1]));
  //a1.nextRotDir = -1;
  const a2 = new MobileElement(getSphere(), new vec4([0.98, 1, 0.07, 1]));
  const a3 = new MobileElement(getCube(), new vec4([0.25, 0.92, 0.83, 1]));
  mobile.addChild(a1);
  mobile.addChild(a2);
  mobile.addChild(a3);
  // level 2
  const b1 = new MobileElement(getSphere(), new vec4([0.32, 0.28, 0.61, 1]));
  //b1.nextRotDir = 1;
  b1.nextRotSpeed = Math.PI / 180;
  const b2 = new MobileElement(getCube(), new vec4([0.35, 0.76, 0.76, 1]));
  const b3 = new MobileElement(getCube(), new vec4([0.75, 0.87, 0.52, 1]));
  //b3.nextRotDir = 1;
  b3.nextRotSpeed = Math.PI / 180;
  a1.addChild(b1);
  a1.addChild(b2);
  a3.addChild(b3);
  // level 3
  const c1 = new MobileElement(getSphere(), new vec4([0.49, 0.87, 0.39, 1]));
  const c2 = new MobileElement(getSphere(), new vec4([0.89, 0.71, 0.02, 1]));
  const c3 = new MobileElement(getSphere(), new vec4([0.03, 0.3, 0.38, 1]));
  const c4 = new MobileElement(getCube(), new vec4([0.41, 0.92, 0.82, 1]));
  b1.addChild(c1);
  b3.addChild(c2);
  b3.addChild(c3);
  b3.addChild(c4);

  mobile.randomAdd(new MobileElement(getSphere(), new vec4([1.0, 0, 0, 1])));
  mobile.randomAdd(new MobileElement(getCube(), new vec4([0, 1.0, 0, 1])));

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

  // angle of the spotlight
  let phi = 0.9;

  // handle a file being uploaded
  fileInput.addEventListener("change", () => {
    getInput(fileInput)
      .then(parseFileText)
      .then(obj => {
        mobile.randomAdd(
          new MobileElement(
            obj.polygons,
            new vec4([Math.random(), Math.random(), Math.random(), 1]),
            obj.extents
          )
        );
      });
  });

  const startDrawing = (): void => {
    // cancel any existing animation
    if (GLOBALS.callbackID !== undefined)
      cancelAnimationFrame(GLOBALS.callbackID);

    // start rendering
    render(canvas, gl, program, mobile);
  };

  // handle keyboard input
  document.addEventListener("keydown", (ev: KeyboardEvent) => {
    const key = ev.key.toLowerCase();
    if (key === "p") {
      if (ev.shiftKey) phi += 0.01;
      else phi -= 0.01;
      gl.uniform1f(gl.getUniformLocation(program, "phi"), phi);
    }
    if (key === "m") {
      if (ev.shiftKey) mobile.calculateNormals(true);
      else mobile.calculateNormals(false);
    }
  });

  startDrawing();
}

window.onload = main;

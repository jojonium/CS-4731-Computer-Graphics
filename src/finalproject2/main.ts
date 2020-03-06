/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 2
 */

import { createFileInput, getInput, parseFileText } from "./file";
import {
  createCanvas,
  placeholderTexture,
  createTexture,
  setRFunc
} from "./helpers";
import { initShaders } from "./lib/initShaders";
import vec4 from "./lib/tsm/vec4";
import { setupWebGL } from "./lib/webgl-utils";
import { MobileElement } from "./MobileElement";
import { getCube, getSphere } from "./models";
import { render } from "./render";
import vec3 from "./lib/tsm/vec3";
import { configureEnvironmentMap } from "./environment";

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
  callbackID: undefined as number | undefined,
  /** Whether or not to draw shadows */
  shadowsOn: false,
  /** whether to draw the walls and floor with textures */
  texturesOn: true
};

function main(): void {
  // create the <canvas> element
  const canvas = createCanvas();
  // create file input
  const fileInput = createFileInput();

  const randMesh = (): vec3[][] =>
    Math.random() < 0.5 ? getCube() : getSphere();
  // create the mobile
  const mobile = new MobileElement(randMesh(), new vec4([0.3, 0.4, 0.8, 1]));
  mobile.nextRotSpeed = Math.PI / 360;
  mobile.addChild(new MobileElement(randMesh(), new vec4([1, 0.0, 0.0, 1])));
  mobile.addChild(new MobileElement(randMesh(), new vec4([0.98, 1, 0.07, 1])));
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.25, 0.92, 0.83, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.32, 0.28, 0.61, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.35, 0.76, 0.76, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.75, 0.87, 0.52, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.49, 0.87, 0.39, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.89, 0.71, 0.02, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.03, 0.3, 0.38, 1]))
  );
  mobile.randomAdd(
    new MobileElement(randMesh(), new vec4([0.41, 0.92, 0.82, 1]))
  );
  mobile.randomAdd(new MobileElement(randMesh(), new vec4([1.0, 0, 0, 1])));
  mobile.randomAdd(new MobileElement(randMesh(), new vec4([0, 1.0, 0, 1])));

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

  // set initial attributes
  let reflective = false;
  let refractive = false;
  gl.uniform1i(gl.getUniformLocation(program, "reflective"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "refractive"), 0);

  // set up placeholder texture and load other textures
  placeholderTexture(gl);
  const grassImg = document.getElementById("grass") as HTMLImageElement;
  if (grassImg === null) throw new Error("couldn't get grass image");
  createTexture(gl, program, 0, grassImg);
  const stonesImg = document.getElementById("stones") as HTMLImageElement;
  if (grassImg === null) throw new Error("couldn't get stones image");
  createTexture(gl, program, 1, stonesImg);

  // set up environment map
  const envMapImgs = [
    document.getElementById("nvnegz"),
    document.getElementById("nvposx"),
    document.getElementById("nvnegy"),
    document.getElementById("nvposy"),
    document.getElementById("nvposz"),
    document.getElementById("nvnegx")
  ] as [
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement
  ];
  if (!envMapImgs.every(elt => elt !== null))
    throw new Error("couldn't get env map image");
  configureEnvironmentMap(gl, program, envMapImgs);

  // angle of the spotlight
  let phi = 0.7;

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
    render(canvas, gl, program, program, mobile);
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
      reflective = false;
      refractive = false;
      setRFunc(gl, program, reflective, refractive);
    }
    if (key === "a") {
      GLOBALS.shadowsOn = !GLOBALS.shadowsOn;
    }
    if (key === "c") {
      reflective = !reflective;
      refractive = false;
      setRFunc(gl, program, reflective, refractive);
    }
    if (key === "d") {
      reflective = false;
      refractive = !refractive;
      setRFunc(gl, program, reflective, refractive);
    }
    if (key === "b") {
      GLOBALS.texturesOn = !GLOBALS.texturesOn;
    }
  });

  startDrawing();
}

window.onload = main;

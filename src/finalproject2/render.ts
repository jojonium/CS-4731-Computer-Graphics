import mat4 from "./lib/tsm/mat4";
import vec3 from "./lib/tsm/vec3";
import { GLOBALS } from "./main";
import { MobileElement } from "./MobileElement";

/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 * @param extents the max and min dimensions of the model
 */
export const render = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  mobile: MobileElement
): void => {
  // set view port and clear canvas
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
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
  const modelView = mat4.lookAt(eyeVec, lookVec, upVec);

  // scale and translate to fit the mobile
  const s = 1.5 / Math.max(mobile.getTotalWidth(), mobile.getTotalHeight());
  modelView
    .scale(new vec3([s, s, s]))
    .translate(new vec3([0, mobile.getTotalHeight() / 2, 0]));

  mobile.draw(gl, program, modelView);

  GLOBALS.callbackID = requestAnimationFrame(() => {
    render(canvas, gl, program, mobile);
  });
};

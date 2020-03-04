import { flatten } from "./helpers";
import mat4 from "./lib/tsm/mat4";

/**
 * draws the floor of the world
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using
 * @param mvMatrix the model view matrix
 */
export const drawFloor = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  mvMatrix: mat4
): void => {
  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(mvMatrix.all()));

  // buffer floor triangles
  const points = Float32Array.from(
    flatten([
      // left
      [-10, -10, 10, 1],
      [10, -10, 10, 1],
      [-10, -10, 10, 1],
      // right
      [10, -10, 10, 1],
      [10, -10, -10, 1],
      [-10, -10, 10, 1]
    ])
  );
  const pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  // set grass texture
  gl.activeTexture(gl.TEXTURE0);
  gl.drawArrays(gl.TRIANGLES, 0, 2);
};

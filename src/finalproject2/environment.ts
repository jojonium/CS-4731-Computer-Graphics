import { flatten } from "./helpers";
import mat4 from "./lib/tsm/mat4";

/**
 * draws the floor of the world
 * @param gl the WebGL rendering context to draw to
 * @param textureProgram the WebGL program we're using to draw textures
 * @param mvMatrix the model view matrix
 */
export const drawFloor = (
  gl: WebGLRenderingContext,
  textureProgram: WebGLProgram,
  mvMatrix: mat4
): void => {
  const modelMatrixLoc = gl.getUniformLocation(textureProgram, "modelMatrix");
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

  const texCoords = Float32Array.from(
    flatten([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0]
    ])
  );

  const tvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  const tvPosition = gl.getAttribLocation(textureProgram, "t_vPosition");
  gl.vertexAttribPointer(tvPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(tvPosition);

  const ttBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ttBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  const tvTexCoord = gl.getAttribLocation(textureProgram, "t_vTexCoord");
  gl.vertexAttribPointer(tvTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(tvTexCoord);

  gl.drawArrays(gl.TRIANGLES, 0, 2);

  gl.disableVertexAttribArray(tvPosition);
  gl.disableVertexAttribArray(tvTexCoord);
};

import { createTexture, flatten, normal } from "./helpers";
import mat4 from "./lib/tsm/mat4";
import { quad } from "./models";

const f = quad(3, 0, 4, 7);
const floorTriangles = [
  [f[0], f[1], f[2]],
  [f[3], f[4], f[5]]
];

const floorPointsData = Float32Array.from(
  flatten(flatten(floorTriangles).map(vec => [vec.x, vec.y, vec.z, 1]))
);

const floorNormalsData = Float32Array.from(
  flatten(
    flatten(
      floorTriangles.map(poly => {
        const n = normal(poly).scale(-1);
        return poly.map(() => [n.x, n.y, n.z, 0]);
      })
    )
  )
);

const floorTexCoordsData = Float32Array.from(
  flatten([
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 1],
    [1, 0]
  ])
);

/**
 * draws the floor of the world
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using to draw textures
 * @param mvMatrix the model view matrix
 */
export const drawFloor = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  mvMatrix: mat4
): void => {
  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(mvMatrix.all()));

  // use grass texture
  const grassImg = document.getElementById("grass") as HTMLImageElement;
  if (grassImg === null) throw new Error("couldn't get grass image");
  createTexture(gl, program, 0, grassImg);
  gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), 0.0);

  // colors

  // vertices
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, floorPointsData, gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // normals
  const vNormal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
  gl.bufferData(gl.ARRAY_BUFFER, floorNormalsData, gl.STATIC_DRAW);
  const vNormalPosition = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormalPosition);

  // texture coordinates
  const tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, floorTexCoordsData, gl.STATIC_DRAW);
  const tvTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(tvTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(tvTexCoord);

  gl.drawArrays(gl.TRIANGLES, 0, f.length);
};


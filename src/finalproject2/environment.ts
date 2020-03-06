import { flatten } from "./helpers";
import mat4 from "./lib/tsm/mat4";
import { quad } from "./models";
import { GLOBALS } from "./main";

const f = quad(3, 0, 4, 7);
const floorTriangles = [
  [f[0], f[1], f[2]],
  [f[3], f[4], f[5]]
];

const floorPointsData = Float32Array.from(
  flatten(flatten(floorTriangles).map(vec => [vec.x, vec.y, vec.z, 1]))
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

const lw = quad(5, 4, 0, 1); // left wall
const bw = quad(6, 7, 4, 5); // back wall
const wallTriangles = [
  [lw[0], lw[1], lw[2]],
  [lw[3], lw[4], lw[5]],
  [bw[0], bw[1], bw[2]],
  [bw[3], bw[4], bw[5]]
];

const wallPointsData = Float32Array.from(
  flatten(flatten(wallTriangles).map(vec => [vec.x, vec.y, vec.z, 1]))
);

const wallTexCoords = [
  [0, 0],
  [0, 1],
  [1, 1],
  [0, 0],
  [1, 1],
  [1, 0]
];
const wallTexCoordsData = Float32Array.from(
  flatten(wallTexCoords.concat(wallTexCoords))
);

/**
 * draws the floor and walls of the world
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using to draw textures
 * @param mvMatrix the model view matrix
 */
export const drawEnvironment = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  mvMatrix: mat4
): void => {
  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(mvMatrix.all()));

  // do floor first

  if (GLOBALS.texturesOn) {
    // use grass texture
    gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), 0.0);
  } else {
    gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), -1.0);
    // if textures are off make the floor grey
    gl.uniform4fv(
      gl.getUniformLocation(program, "diffuseProduct"),
      Float32Array.from([0.7, 0.7, 0.7, 1.0])
    );
    gl.uniform4fv(
      gl.getUniformLocation(program, "specularProduct"),
      Float32Array.from([0.7, 0.7, 0.7, 1.0])
    );
    gl.uniform4fv(
      gl.getUniformLocation(program, "ambientProduct"),
      Float32Array.from([0.7, 0.7, 0.7, 1.0])
    );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 20);
  }

  // buffer vertices
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, floorPointsData, gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // buffer texture coordinates
  const tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, floorTexCoordsData, gl.STATIC_DRAW);
  const tvTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(tvTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(tvTexCoord);

  gl.drawArrays(gl.TRIANGLES, 0, f.length);

  // now do walls

  if (GLOBALS.texturesOn) {
    // use stone texture
    gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), 1.0);
  } else {
    gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), -1.0);
    // if textures are off make the walls blue
    gl.uniform4fv(
      gl.getUniformLocation(program, "diffuseProduct"),
      Float32Array.from([0.2, 0.2, 0.8, 1.0])
    );
    gl.uniform4fv(
      gl.getUniformLocation(program, "specularProduct"),
      Float32Array.from([0.2, 0.2, 0.8, 1.0])
    );
    gl.uniform4fv(
      gl.getUniformLocation(program, "ambientProduct"),
      Float32Array.from([0.2, 0.2, 0.8, 1.0])
    );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 20);
  }

  // buffer vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, wallPointsData, gl.STATIC_DRAW);

  // buffer texture coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, wallTexCoordsData, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, bw.length + lw.length);
};

/**
 * sets up an environment map based on six images
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using to draw textures
 * @param images the six images in the order [back, right, bottom, top, front,
 * left]
 */
export const configureEnvironmentMap = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  images: [
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement,
    HTMLImageElement
  ]
): void => {
  const cubeMap = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // back
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[0]
  );
  // right
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[1]
  );
  // bottom
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[2]
  );
  // top
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[3]
  );
  // front
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[4]
  );
  // left
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    images[5]
  );

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 2);
};

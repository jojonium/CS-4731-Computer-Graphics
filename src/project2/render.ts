import { Extents } from "./file";
import { flatten, pulse } from "./helpers";
import mat4 from "./lib/tsm/mat4";
import vec3 from "./lib/tsm/vec3";
import { GLOBALS } from "./main";

export type TransformOpts = {
  scale: number;
  translate: vec3;
  shouldPulse: boolean;
  pulseCount: number;
};

/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 * @param extents the max and min dimensions of the model
 * @param topts transform options
 */
export const render = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  polygons: vec3[][],
  extents: Extents,
  topts: TransformOpts
): void => {
  // set view port and clear canvas
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
  let modelView = mat4.lookAt(eyeVec, lookVec, upVec);

  // transform the modelView matrix
  const scaleFactor =
    1 /
    Math.max(
      extents.maxX - extents.minX,
      extents.maxY - extents.minY,
      extents.maxZ - extents.minZ
    );
  modelView = modelView
    .scale(new vec3([scaleFactor, scaleFactor, scaleFactor]))
    .translate(
      new vec3([
        -0.5 * (extents.minX + extents.maxX),
        -0.5 * (extents.minY + extents.maxY),
        -0.5 * (extents.minZ + extents.maxZ)
      ])
    );

  const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  gl.uniformMatrix4fv(
    modelMatrixLoc,
    false,
    Float32Array.from(modelView.all())
  );

  // apply transformations to the vertices
  const pulseDistance =
    -((Math.sin(topts.pulseCount / 10 - Math.PI / 2) + 1) * 0.05) / scaleFactor;
  const transformedPolygons = polygons.map(poly => pulse(poly, pulseDistance));
  const vertices = flatten(transformedPolygons);

  // buffer the vertices
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(vertices.map(vec => [vec.x, vec.y, vec.z, 1.0]))),
    gl.STATIC_DRAW
  );

  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // buffer colors
  const cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  const colors = vertices.map(() => [1.0, 1.0, 1.0, 1.0]);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(colors)),
    gl.STATIC_DRAW
  );
  const vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

  for (let i = 0; i < vertices.length - 2; i += 3) {
    gl.drawArrays(gl.LINE_LOOP, i, 3);
  }

  // change transformation values for next frame
  if (topts.shouldPulse) {
    topts.pulseCount++;
  }

  GLOBALS.callbackID = requestAnimationFrame(
    (timeStamp: DOMHighResTimeStamp) => {
      render(canvas, gl, program, polygons, extents, topts);
    }
  );
};

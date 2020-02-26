import { flatten, pulse, normal } from "./helpers";
import mat4 from "./lib/tsm/mat4";
import vec3 from "./lib/tsm/vec3";
import { MobileElement, GLOBALS } from "./main";

/**
 * options to pass between steps
 */
export type TransformOpts = {
  shouldXTranslate: -1 | 0 | 1;
  xTranslateCount: number;
  shouldYTranslate: -1 | 0 | 1;
  yTranslateCount: number;
  shouldZTranslate: -1 | 0 | 1;
  zTranslateCount: number;
  shouldXRoll: -1 | 0 | 1;
  xRollCount: number;
  shouldYRoll: -1 | 0 | 1;
  yRollCount: number;
  shouldZRoll: -1 | 0 | 1;
  zRollCount: number;
  shouldPulse: boolean;
  pulseCount: number;
  drawNormals: boolean;
};

/**
 * sets initial transform options to all zero and false
 */
export const initTransformOpts = (): TransformOpts => {
  return {
    shouldXTranslate: 0,
    xTranslateCount: 0,
    shouldYTranslate: 0,
    yTranslateCount: 0,
    shouldZTranslate: 0,
    zTranslateCount: 0,
    shouldXRoll: 0,
    xRollCount: 0,
    shouldYRoll: 0,
    yRollCount: 0,
    shouldZRoll: 0,
    zRollCount: 0,
    shouldPulse: false,
    pulseCount: 0,
    drawNormals: false
  };
};

/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 * @param extents the max and min dimensions of the model
 * @param topts transform options
 * @param lineColor color used for drawing lines as [r, g, b, a], each 0-1
 */
export const render = (
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  mobile: { layer1: MobileElement[] },
  topts: TransformOpts,
  lineColor: number[]
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

  for (const elt of mobile.layer1) {
    // TODO scale elements so they appear the same size

    // transform the modelView matrix
    const scaleFactor =
      1 /
      Math.max(
        elt.extents.maxX - elt.extents.minX,
        elt.extents.maxY - elt.extents.minY,
        elt.extents.maxZ - elt.extents.minZ
      );
    const userTranslateVec = new vec3([
      topts.xTranslateCount,
      topts.yTranslateCount,
      topts.zTranslateCount
    ]);
    modelView = modelView
      .scale(new vec3([scaleFactor, scaleFactor, scaleFactor]))
      .translate(
        new vec3([
          -0.5 * (elt.extents.minX + elt.extents.maxX),
          -0.5 * (elt.extents.minY + elt.extents.maxY),
          -0.5 * (elt.extents.minZ + elt.extents.maxZ)
        ])
      )
      .translate(userTranslateVec);
    // these null checks are annoying but necessary
    let rotated = modelView.rotate(
      0.01 * topts.xRollCount,
      new vec3([1, 0, 0])
    );
    if (rotated !== null)
      rotated = rotated.rotate(0.01 * topts.yRollCount, new vec3([0, 1, 0]));
    if (rotated !== null)
      rotated = rotated.rotate(0.01 * topts.zRollCount, new vec3([0, 0, 1]));
    if (rotated !== null) modelView = rotated;

    const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(
      modelMatrixLoc,
      false,
      Float32Array.from(modelView.all())
    );

    // apply transformations to the vertices
    const pulseDistance =
      -((Math.sin(topts.pulseCount / 10 - Math.PI / 2) + 1) * 0.05) /
      scaleFactor;
    const transformedPolygons = elt.polygons.map(poly =>
      pulse(poly, pulseDistance)
    );
    let vertices = flatten(transformedPolygons);

    // add normals
    if (topts.drawNormals) {
      vertices = vertices.concat(
        flatten(
          elt.polygons.map(poly => {
            const center = new vec3([
              (poly[0].x + poly[1].x + poly[2].x) / 3,
              (poly[0].y + poly[1].y + poly[2].y) / 3,
              (poly[0].z + poly[1].z + poly[2].z) / 3
            ]);
            return [center, vec3.difference(center, normal(poly)), center];
          })
        )
      );
    }

    // buffer the vertices
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      Float32Array.from(
        flatten(vertices.map((vec: vec3) => [vec.x, vec.y, vec.z, 1.0]))
      ),
      gl.STATIC_DRAW
    );

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // buffer colors
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    const colors = vertices.map(() => lineColor);
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
  }

  // change transformation values for next frame
  topts.xTranslateCount += topts.shouldXTranslate;
  topts.yTranslateCount += topts.shouldYTranslate;
  topts.zTranslateCount += topts.shouldZTranslate;
  topts.xRollCount += topts.shouldXRoll;
  topts.yRollCount += topts.shouldYRoll;
  topts.zRollCount += topts.shouldZRoll;
  if (topts.shouldPulse) topts.pulseCount++;

  GLOBALS.callbackID = requestAnimationFrame(
    (timeStamp: DOMHighResTimeStamp) => {
      render(canvas, gl, program, mobile, topts, lineColor);
    }
  );
};

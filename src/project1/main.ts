import { setupWebGL } from "./lib/webgl-utils";
import { initShaders } from "./lib/initShaders";
import vec4 from "./lib/tsm/vec4";

/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten<T>(arr: T[][]): T[] {
  return new Array<T>().concat(...arr);
}

function main(): void {
  // retrieve the <canvas> element
  const canvas = document.getElementById("webgl") as HTMLCanvasElement;

  // get the rendering context for WebGL
  const gl = setupWebGL(canvas) as WebGLRenderingContext;
  if (gl === null) {
    console.error("Failed to get the rendering context for WebGL");
    return;
  }

  // initialize shaders
  const program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // set up the viewport
  gl.viewport(0, 0, canvas.width, canvas.height);

  const points = [
    new vec4([-0.5, -0.5, 0.0, 1.0]),
    new vec4([0.5, -0.5, 0.0, 1.0]),
    new vec4([0.0, 0.5, 0.0, 1.0])
  ];

  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(points.map(p => p.xyzw))),
    gl.STATIC_DRAW
  );

  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

  const colors = [
    new vec4([1.0, 0.0, 0.0, 1.0]),
    new vec4([0.0, 1.0, 0.0, 1.0]),
    new vec4([0.0, 0.0, 1.0, 1.0])
  ];

  const cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Float32Array.from(flatten(colors.map(c => c.xyzw))),
    gl.STATIC_DRAW
  );

  const vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vColor);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

  const vPointSize = gl.getUniformLocation(program, "vPointSize");
  gl.uniform1f(vPointSize, 20.0);

  // set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, points.length);

  window.addEventListener("keydown", ev => {
    const key = ev.key;
    if (key === "a") {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, points.length);
    } else if (key === "s") {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, points.length);
    }
  });

  window.addEventListener("click", () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
  });
}

window.onload = main;

import vec3 from "./lib/tsm/vec3";

/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
export function flatten<T>(arr: T[][]): T[] {
  return new Array<T>().concat(...arr);
}

/**
 * calculates the normal vector for a triangle made up of three points using the
 * Newell method
 */
export const normal = (points: vec3[]): vec3 => {
  const end = points.length - 1;
  let x = (points[end].y - points[0].y) * (points[end].z + points[0].z);
  let y = (points[end].z - points[0].z) * (points[end].x + points[0].x);
  let z = (points[end].x - points[0].x) * (points[end].y + points[0].y);

  for (let i = 0; i < points.length - 1; ++i) {
    x += (points[i].y - points[i + 1].y) * (points[i].z + points[i + 1].z);
    y += (points[i].z - points[i + 1].z) * (points[i].x + points[i + 1].x);
    z += (points[i].x - points[i + 1].x) * (points[i].y + points[i + 1].y);
  }

  return new vec3([x, y, z]).normalize();
};

//vec3.cross(vec3.difference(p2, p0), vec3.difference(p1, p0)).normalize();

/**
 * moves the polygon outward along the normal vector by the given distance,
 * returning the restulting polygon
 */
export const pulse = (polygon: vec3[], distance: number): vec3[] =>
  polygon.map(point => vec3.difference(point, normal(polygon).scale(distance)));

/**
 * converts a fractional color value to a 2-digit hex string
 * @param num a color value from 0 to 1
 */
export const toHex = (num: number): string => {
  let out = Math.floor(num * 255)
    .toString(16)
    .slice(0, 2);
  if (out.length < 2) out = "0" + out;
  return out;
};

/**
 * create a <canvas> element and add it to the #canvas-container
 * @return the created canvas
 */
export const createCanvas = (): HTMLCanvasElement => {
  // remove any existing canvas
  document.getElementById("webgl")?.remove();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  canvas.id = "webgl";
  document.getElementById("canvas-container")?.appendChild(canvas);
  return canvas;
};

/**
 * create an <input type="color"> element and add it to #input-container
 * @return the created input element
 */
export const createColorInput = (): HTMLInputElement => {
  // remove any existing input
  document.getElementById("color-picker-container")?.remove();
  const input = document.createElement("input");
  input.value = "#ffffff";
  input.type = "color";
  input.id = "color-picker";
  const span = document.createElement("span");
  span.id = "color-picker-container";
  span.innerText = "Line color: ";
  span.appendChild(input);
  document.getElementById("input-container")?.appendChild(span);
  return input;
};

/**
 * mixes two vectors according to a ratio
 * @param u first vector
 * @param v second vector
 * @param s ratio of first to second
 */
export const mix = (u: vec3, v: vec3, s: number): vec3 => {
  return new vec3([
    (1 - s) * u.x + s * v.x,
    (1 - s) * u.y + s * v.y,
    (1 - s) * u.z + s * v.z
  ]);
};

/**
 * adds a texture to the webgl rendering context
 * @param gl the webgl context
 * @param program the texture program
 * @param index the number for this texture, 0 or 1
 * @param img element for the texture's image
 */
export const createTexture = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  index: 0 | 1,
  img: HTMLImageElement
): void => {
  const texture = gl.createTexture();
  gl.activeTexture(index === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.uniform1i(gl.getUniformLocation(program, "texture" + index), index);
};

/**
 * create a simple placeholder texture while waiting for other textures to load
 * @param gl the rendering context to use
 */
export const placeholderTexture = (gl: WebGLRenderingContext): void => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    2,
    2,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0,
      0,
      255,
      255,
      255,
      0,
      0,
      255,
      0,
      0,
      255,
      255,
      0,
      0,
      255,
      255
    ])
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};

/**
 * create a simple placeholder texture while waiting for other textures to load
 * @param gl the rendering context to use
 * @param program the webgl program
 * @param reflective whether objects should reflect
 * @param refractive whether objects should refract
 */
export const setRFunc = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  reflective: boolean,
  refractive: boolean
): void => {
  gl.uniform1i(
    gl.getUniformLocation(program, "refractive"),
    refractive ? 1 : 0
  );
  gl.uniform1i(
    gl.getUniformLocation(program, "reflective"),
    reflective ? 1 : 0
  );
};

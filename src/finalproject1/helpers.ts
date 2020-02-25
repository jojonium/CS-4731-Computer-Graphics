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
  if (points.length !== 3) console.log(points.length);
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

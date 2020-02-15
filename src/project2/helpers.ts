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
export const normal = (p0: vec3, p1: vec3, p2: vec3): vec3 =>
  vec3.cross(vec3.difference(p2, p0), vec3.difference(p1, p0)).normalize();

/**
 * moves the polygon outward along the normal vector by the given distance,
 * returning the restulting polygon
 */
export const pulse = (polygon: vec3[], distance: number) => {
  const scaledNormal = normal(polygon[0], polygon[1], polygon[2]).scale(
    distance
  );
  return polygon.map(point => vec3.sum(point, scaledNormal));
};

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

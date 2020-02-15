import vec3 from "./lib/tsm/vec3";

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

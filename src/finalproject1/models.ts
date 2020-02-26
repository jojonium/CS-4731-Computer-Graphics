import vec3 from "./lib/tsm/vec3";

/** helper function for generating cube faces */
const quad = (a: number, b: number, c: number, d: number): vec3[] => {
  const vertices = [
    new vec3([-0.5, -0.5, 0.5]),
    new vec3([-0.5, 0.5, 0.5]),
    new vec3([0.5, 0.5, 0.5]),
    new vec3([0.5, -0.5, 0.5]),
    new vec3([-0.5, -0.5, -0.5]),
    new vec3([-0.5, 0.5, -0.5]),
    new vec3([0.5, 0.5, -0.5]),
    new vec3([0.5, -0.5, -0.5])
  ];
  return [a, b, c, a, c, d].map(x => vertices[x]);
};

/** generates a cube model */
export const getCube = (): vec3[][] => {
  return [
    quad(1, 0, 3, 2), // back
    quad(2, 3, 7, 6), // right
    quad(3, 0, 4, 7), // bottom
    quad(6, 5, 1, 2), // top
    quad(4, 5, 6, 7), // front
    quad(5, 4, 0, 1) // left
  ];
};

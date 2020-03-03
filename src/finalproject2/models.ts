import vec3 from "./lib/tsm/vec3";
import { mix, flatten } from "./helpers";

/** helper function for generating vertices of a cube */
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
export const getCube = (): vec3[][] => [
  quad(1, 0, 3, 2), // back
  quad(2, 3, 7, 6), // right
  quad(3, 0, 4, 7), // bottom
  quad(6, 5, 1, 2), // top
  quad(4, 5, 6, 7), // front
  quad(5, 4, 0, 1) // left
];

/** subdivides a tetrahedron towards approximating a sphere */
const divideTriangle = (a: vec3, b: vec3, c: vec3, count: number): vec3[][] => {
  if (count > 0) {
    const ab = mix(a, b, 0.5).normalize();
    const ac = mix(a, c, 0.5).normalize();
    const bc = mix(b, c, 0.5).normalize();
    return flatten([
      divideTriangle(a, ab, ac, count - 1),
      divideTriangle(bc, c, ac, count - 1),
      divideTriangle(ab, b, bc, count - 1),
      divideTriangle(ab, bc, ac, count - 1)
    ]);
  } else {
    return [[a, b, c]];
  }
};

/** creates a tetrahedron */
const tetrahedron = (
  a: vec3,
  b: vec3,
  c: vec3,
  d: vec3,
  n: number
): vec3[][] => {
  return flatten([
    divideTriangle(a, b, c, n),
    divideTriangle(d, c, b, n),
    divideTriangle(a, d, b, n),
    divideTriangle(a, c, d, n)
  ]);
};

/** returns the faces of a sphere approximation */
export const getSphere = (): vec3[][] => {
  const va = new vec3([0.0, 0.0, -1.0]);
  const vb = new vec3([0.0, 0.942809, 0.333333]);
  const vc = new vec3([-0.816497, -0.471405, 0.333333]);
  const vd = new vec3([0.816497, -0.471405, 0.333333]);
  const tet = tetrahedron(va, vb, vc, vd, 4);
  return tet.map(tri =>
    tri.map(vec => new vec3([vec.x * 0.5, vec.y * 0.5, vec.z * 0.5]))
  );
};

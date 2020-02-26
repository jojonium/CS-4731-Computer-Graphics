import vec3 from "./lib/tsm/vec3";
import { flatten } from "./helpers";

/**
 * This is one element of the mobile tree hierarchy. It may have children or a
 * parent
 */
export class MobileElement {
  /** the triangles used to draw this object */
  private vertices: vec3[];
  /** polygons as an array ready to pass to webgl */
  private pointData: Float32Array;
  /** the list of mobile elements that hang below this one, possibly empty */
  public children: MobileElement[];
  /** optionally the element above this one */
  public parent: MobileElement | undefined;
  /** rgba, each 0-1 */
  private color: number[];
  /** array of the color of this mesh as long as the list of vertices */
  private colorData: Float32Array;
  /** whether to draw the mesh as a wireframe */
  private wireframe = true;

  /**
   * creates a new element with a model
   * @param mesh the polygons of the model
   */
  public constructor(mesh: vec3[][], color: [number, number, number, number]) {
    this.vertices = flatten(mesh);
    this.pointData = Float32Array.from(
      flatten(this.vertices.map(vec => [vec.x, vec.y, vec.z, 1.0]))
    );
    this.children = new Array<MobileElement>();
    this.parent = undefined;
    this.color = color;
    this.colorData = Float32Array.from(
      flatten(this.vertices.map(() => this.color))
    );
  }

  /**
   * recursively draws this element and each of its children on the canvas
   * @param gl the WebGL rendering context to draw to
   * @param program the WebGL program we're using
   */
  public draw(gl: WebGLRenderingContext, program: WebGLProgram): void {
    // buffer vertex data
    const pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.pointData, gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // buffer color data
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorData, gl.STATIC_DRAW);

    const vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    if (this.wireframe) {
      for (let i = 0; i < this.vertices.length - 2; i += 3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3);
      }
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
    }

    // TODO offset and draw horizontal/vertical lines
    // draw children
    this.children.map(me => me.draw(gl, program));
  }
}

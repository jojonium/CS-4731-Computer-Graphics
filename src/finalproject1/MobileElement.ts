import vec3 from "./lib/tsm/vec3";
import { flatten, normal } from "./helpers";
import mat4 from "./lib/tsm/mat4";
import vec4 from "./lib/tsm/vec4";

/** how far apart siblings are */
const X_SEPARATION = 3;
/** how far apart parents and children are */
const Y_SEPARATION = 1.5;

/**
 * This is one element of the mobile tree hierarchy. It may have children or a
 * parent
 */
export class MobileElement {
  /** the triangles used to draw this object */
  private vertices: vec3[];
  /** polygons as an array ready to pass to webgl */
  private pointData: Float32Array;
  /** normals as an array ready to pass to webgl */
  private normalData: Float32Array;
  /** the list of mobile elements that hang below this one, possibly empty */
  private children: MobileElement[];
  /** optionally the element above this one */
  private parent: MobileElement | undefined;
  /** rgba, each 0-1 */
  private color: number[];
  /** array of the color of this mesh as long as the list of vertices */
  private colorData: Float32Array;
  /** whether to draw the mesh as a wireframe */
  private wireframe = false;
  /** 1 for counterclockwise, -1 for clockwise, 0 for no rotation */
  public rotDir: -1 | 0 | 1;
  /** number of radians to rotate per frame */
  private rotSpeed: number;
  /** stepped variable to keep track of rotation */
  private rotStep: number;
  /** number of layers below this one */
  private layersBelow: number;
  /** width needed to fit all children */
  private childrenWidth: number;
  /** Rotation of next layer. 1 for ccw, -1 for cw, 0 for no rotation */
  public nextRotDir: -1 | 0 | 1;
  /** number of radians to rotate next layer per frame */
  private nextRotSpeed: number;
  /** stepped variable to keep track of next layer's rotation */
  private nextRotStep: number;

  /**
   * creates a new element with a model
   * @param mesh the polygons of the model
   */
  public constructor(mesh: vec3[][], color: [number, number, number, number]) {
    // convert mesh into Float32Array for webgl
    this.vertices = flatten(mesh);
    this.pointData = Float32Array.from(
      flatten(this.vertices.map(vec => [vec.x, vec.y, vec.z, 1.0]))
    );

    // calculate normals
    this.normalData = Float32Array.from(
      flatten(mesh.map(normal).map(vec => [vec.x, vec.y, vec.z, 1.0]))
    );

    this.children = new Array<MobileElement>();
    this.parent = undefined;
    this.color = color;
    this.colorData = Float32Array.from(
      flatten(this.vertices.map(() => this.color))
    );
    this.rotDir = 1;
    this.rotSpeed = Math.PI / 180;
    this.rotStep = 0;
    this.nextRotDir = 1;
    this.nextRotSpeed = Math.PI / 360;
    this.nextRotStep = 0;
    this.layersBelow = 0;
    this.childrenWidth = 1;
  }

  /**
   * adds a mobile element one level below this one
   * @param child the mobile element child
   */
  public addChild(child: MobileElement): void {
    if (this.children.length === 0) this.addLayer();
    this.children.push(child);
    child.parent = this;
    this.setChildrenWidth();
  }

  /** increment layersBelow for this mobile element and all its parents */
  private addLayer(): void {
    this.layersBelow++;
    if (this.parent !== undefined) this.parent.addLayer();
  }

  /**
   * set children width for this mobile element and all its parents
   */
  private setChildrenWidth(): void {
    this.childrenWidth = this.children.reduce(
      (prev, cur) => prev + cur.childrenWidth,
      0
    );
    if (this.parent !== undefined) {
      this.parent.setChildrenWidth();
    }
  }

  /** get the total width necessary to fit this mobile on screen */
  public getTotalWidth(): number {
    return this.childrenWidth * X_SEPARATION;
  }

  /** get the total height necessary to fit this mobile on screen */
  public getTotalHeight(): number {
    return this.layersBelow * Y_SEPARATION;
  }

  /**
   * recursively draws this element and each of its children on the canvas
   * @param gl the WebGL rendering context to draw to
   * @param program the WebGL program we're using
   * @param mvMatrix the model view matrix
   */
  public draw(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    mvMatrix: mat4
  ): void {
    const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

    // apply a rotation to spin this shape
    const rotatedMatrix = mvMatrix
      .copy()
      .rotate(
        this.rotDir * this.rotSpeed * this.rotStep++,
        new vec3([0, 1, 0])
      );
    if (rotatedMatrix === null) throw new Error("Failed to rotate");
    gl.uniformMatrix4fv(
      modelMatrixLoc,
      false,
      Float32Array.from(rotatedMatrix.all())
    );

    // buffer vertex data
    const pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.pointData, gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // buffer color data
    /*
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorData, gl.STATIC_DRAW);

    const vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
   */

    // draw wireframe or solid object
    if (this.wireframe) {
      for (let i = 0; i < this.vertices.length - 2; i += 3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3);
      }
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
    }

    // draw top string
    if (this.parent !== undefined) {
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        Float32Array.from([0, Y_SEPARATION / 2, 0, 1, 0, 0, 0, 1]),
        gl.STATIC_DRAW
      );
      /*
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1]),
        gl.STATIC_DRAW
      );
     */
      gl.drawArrays(gl.LINES, 0, 2);
    }

    // rotate the whole next layer
    const layerMatrix = mvMatrix
      .copy()
      .rotate(
        this.nextRotDir * this.nextRotSpeed * this.nextRotStep++,
        new vec3([0, 1, 0])
      );
    if (layerMatrix === null) throw new Error("Layer matrix is null");
    gl.uniformMatrix4fv(
      modelMatrixLoc,
      false,
      Float32Array.from(layerMatrix.all())
    );

    // draw strings connecting the layer
    const strings = this.getNextLevelStrings();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      Float32Array.from(flatten(strings.map(v => v.xyzw))),
      gl.STATIC_DRAW
    );
    /*
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      Float32Array.from(flatten(strings.map(() => [0, 0, 0, 1]))),
      gl.STATIC_DRAW
    );
   */
    gl.drawArrays(gl.LINES, 0, strings.length);

    // buffer normals
    /*
    const vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalData, gl.STATIC_DRAW);

    const vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);
   */

    this.children.forEach((child, index) => {
      // offset children so they all fit side by side
      const n = this.childrenWidth;
      const c = this.children.length / n;
      const xPos = n < 2 ? 0 : X_SEPARATION * (index / c - (n - 1) / 2);
      const translatedMatrix = layerMatrix
        .copy()
        .translate(new vec3([xPos, -Y_SEPARATION, 0]));
      // draw children
      child.draw(gl, program, translatedMatrix);
    });
  }

  /**
   * gets the horizontal string and the bottom half of the vertical string used
   * to draw the next layer
   */
  private getNextLevelStrings(): vec4[] {
    const out = new Array<vec4>();
    // top
    if (this.children.length !== 0) {
      out.push(new vec4([0, 0, 0, 1]));
      out.push(new vec4([0, -Y_SEPARATION / 2, 0, 1]));
    }
    // horizontal
    out.push(
      new vec4([
        -(X_SEPARATION * (this.childrenWidth - 1)) / 2,
        -Y_SEPARATION / 2,
        0,
        1
      ])
    );
    out.push(
      new vec4([
        (X_SEPARATION * (this.childrenWidth - 1)) / 2,
        -Y_SEPARATION / 2,
        0,
        1
      ])
    );
    return out;
  }
}

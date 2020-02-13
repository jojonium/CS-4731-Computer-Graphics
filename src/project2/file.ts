import vec3 from "./lib/tsm/vec3";

/**
 * create an <input type="file"> element and add it to #input-container
 * @return the created input element
 */
export const createFileInput = (): HTMLInputElement => {
  // remove any existing input
  document.getElementById("file-upload")?.remove();
  const input = document.createElement("input");
  input.type = "file";
  input.id = "file-upload";
  document.getElementById("input-container")?.appendChild(input);
  return input;
};

/**
 * asynchronously reads text from a file input element, and returns it as a
 * promise
 * @return a promise containined the contents of the first file in the element,
 * or undefined if it can't be read
 */
export const getInput = (elt: HTMLInputElement): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    if (elt.files === null) {
      reject("elt contains no files");
      return;
    }
    const file = elt.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onloadend = (ev): void => {
      resolve(ev.target?.result as string);
    };
    fileReader.onerror = (): void => {
      reject("fileReader error");
    };
    fileReader.onabort = (): void => {
      reject("fileReader aborted");
    };
  });
};

/**
 * parses the text of an input file and returns the object's vertices and faces
 * in a promise
 * @param str the input file's text as a string
 */
export const parseFileText = (
  str: string
): { vertices: vec3[]; polygons: vec3[][] } => {
  let numVertices = 0;
  let numPolygons = 0;
  let headerDone = false;
  let vertexCounter = 0;
  let polygonCounter = 0;
  // x y z coordinates of each vertex
  let vertices: vec3[] = new Array<vec3>(numVertices);
  // each polygon is an array of vertices
  let polygons: vec3[][] = new Array<vec3[]>(numPolygons);

  const lines = str.split("\n").map(w => w.toLowerCase().trim());
  if (lines[0] !== "ply") {
    throw new Error("First line of input file must by 'ply'");
  }
  for (let lineNum = 1; lineNum < lines.length; ++lineNum) {
    const words = lines[lineNum]
      .trim()
      .replace(/\s+/g, " ")
      .split(" ");
    if (words.length === 0 || words[0] === "") continue;
    if (!headerDone) {
      // parsing header
      if (words[0] === "end_header") {
        headerDone = true;
        vertices = new Array<vec3>(numVertices);
        polygons = new Array<vec3[]>(numPolygons);
        continue;
      }
      if (words[0] === "format") continue;
      if (words[0] === "element") {
        if (words[1] === "vertex") numVertices = parseInt(words[2]);
        if (words[1] === "face") numPolygons = parseInt(words[2]);
      }
      if (words[0] === "property") {
        if (words[1] === "float32" || words[1] === "list") continue;
      }
    } else if (vertexCounter < numVertices) {
      // parsing vertices
      vertices[vertexCounter] = new vec3(
        words.slice(0, 3).map(parseFloat) as [number, number, number]
      );
      vertexCounter++;
    } else {
      // parsing polygons
      polygons[polygonCounter] = words.slice(1).map(w => vertices[parseInt(w)]);
      polygonCounter++;
    }
  }
  return { vertices: vertices, polygons: polygons };
};

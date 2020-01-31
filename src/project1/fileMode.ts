import vec2 from "./lib/tsm/vec2";

/**
 * create an <input type="file"> element and add it to #container
 * @return the created input element
 */
export const createFileInput = (): HTMLInputElement => {
  // remove any existing input
  document.getElementById("file-upload")?.remove();
  const input = document.createElement("input");
  input.type = "file";
  input.id = "file-upload";
  document.getElementById("container")?.appendChild(input);
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
    fileReader.onloadend = ev => {
      resolve(ev.target?.result as string);
    };
    fileReader.onerror = () => {
      reject("fileReader error");
    };
    fileReader.onabort = () => {
      reject("fileReader aborted");
    };
  });
};

/**
 * parses the text of an input file and returns the dimensions and polylines of
 * the figure in a promise
 * @param str the input file's text as a string
 */
export const parseFileText = (
  str: string
): Promise<{
  extents: [number, number, number, number];
  polylines: vec2[][];
}> => {
  return new Promise(resolve => {
    const lines = str.split("\n");
    // string can start comment number of lines followed by a row of asterisks
    let start = 0;
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].substring(0, 1) === "*") {
        start = i + 1;
        break;
      }
    }
    let extents = [0, 0, 1, 1]; // default extents

    // first line after the asterisks contains the extents of the figure
    if (start !== 0) {
      extents = lines[start]
        .split(/\s+/)
        .map(parseFloat)
        .slice(0, 4);
      start++;
    }

    // next line after that is the list of polylines in the figure
    const numPolylines = Math.floor(parseFloat(lines[start]));
    start++;
    if (isNaN(numPolylines) || numPolylines < 1) {
      throw new Error("Parse error: invalid number of polylines");
    }

    const polylines = new Array<vec2[]>(numPolylines);
    for (let i = 0; i < numPolylines; ++i) {
      polylines[i] = new Array<vec2>();
    }
    let numPoints = 0;
    let p = -1; // polyline index
    for (let i = start; start < lines.length && p < numPolylines; ++i) {
      if (numPoints === 0) {
        // reading number of points in this polyline
        numPoints = Math.floor(parseFloat(lines[i]));
        p++;
      } else {
        // reading a point
        polylines[p].push(
          new vec2(
            lines[i]
              .split(/\s+/)
              .map(parseFloat)
              .filter(n => !isNaN(n))
              .slice(0, 2) as [number, number]
          )
        );
        numPoints--;
      }
    }
    resolve({
      extents: extents as [number, number, number, number],
      polylines: polylines
    });
  });
};

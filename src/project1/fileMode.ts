import vec4 from "./lib/tsm/vec4";

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
 * parses the text of an input file and returns the dimensions and polylines of
 * the figure in a promise
 * @param str the input file's text as a string
 */
export const parseFileText = (
  str: string
): Promise<{
  extents: [number, number, number, number];
  polylines: vec4[][];
}> => {
  return new Promise(resolve => {
    const lines = str.split("\n").filter(s => s !== "");
    // string can start comment number of lines followed by a row of asterisks
    let start = 0;
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].substring(0, 1) === "*") {
        start = i + 1;
        break;
      }
    }
    let extents = new Array<number>();

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

    const polylines = new Array<vec4[]>(numPolylines);
    for (let i = 0; i < numPolylines; ++i) {
      polylines[i] = new Array<vec4>();
    }
    let numPoints = 0;
    let p = -1; // polyline index
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = start; start < lines.length && p < numPolylines; ++i) {
      if (numPoints === 0) {
        // reading number of points in this polyline
        numPoints = Math.floor(parseFloat(lines[i]));
        p++;
      } else {
        // reading a point
        const v = new vec4([
          ...lines[i]
            .split(/\s+/)
            .map(parseFloat)
            .filter(n => !isNaN(n))
            .slice(0, 2),
          0.0,
          1.0
        ] as [number, number, number, number]);
        if (v.x < minX) minX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.x > maxX) maxX = v.x;
        if (v.y > maxY) maxY = v.y;
        polylines[p].push(v);
        numPoints--;
      }
    }
    if (extents.length < 4) {
      console.log("default extents");
      extents = [minX, maxY, maxX, minY];
    }
    resolve({
      extents: extents as [number, number, number, number],
      polylines: polylines
    });
  });
};

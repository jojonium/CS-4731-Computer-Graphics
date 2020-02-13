import vec4 from "./lib/tsm/vec4";

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
export const parseFileText = (str: string): void => {
  // TODO implement
  str;
  return;
};

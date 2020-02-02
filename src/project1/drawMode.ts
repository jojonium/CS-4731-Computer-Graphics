import vec4 from "./lib/tsm/vec4";

/**
 * create an <input type="color" element and add it to #input-container
 * @return teh created input element
 */
export const createColorInput = (): HTMLInputElement => {
  // remove any existing input
  document.getElementById("color-picker-container")?.remove();
  const input = document.createElement("input");
  input.type = "color";
  input.id = "color-picker";
  const span = document.createElement("span");
  span.id = "color-picker-container";
  span.innerText = "Line color: ";
  span.appendChild(input);
  document.getElementById("input-container")?.appendChild(span);
  return input;
};
/**
 * Handles a mouse click on the canvas in draw mode.
 * @param x the x-coordinate of the click relative to the canvas
 * @param y the y-coordinate of the click relative to the canvas
 * @param polylines the current list of polylines
 * @param newline whether or not to start a new line with this click
 * @return the new list of polylines after the click has been dealt with
 */
export const handleClick = (
  x: number,
  y: number,
  polylines: vec4[][],
  newline = false
): vec4[][] => {
  if (
    polylines.length < 1 ||
    polylines[polylines.length - 1].length >= 100 ||
    newline
  ) {
    // need to start a new line
    polylines.push(new Array<vec4>());
  }
  // add this point to the last polyline
  polylines[polylines.length - 1].push(new vec4([x, y, 0.0, 1.0]));
  return polylines;
};

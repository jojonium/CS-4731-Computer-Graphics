(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec4_1 = require("./lib/tsm/vec4");
/**
 * create an <input type="color"> element and add it to #input-container
 * @return teh created input element
 */
exports.createColorInput = function () {
    var _a, _b;
    // remove any existing input
    (_a = document.getElementById("color-picker-container")) === null || _a === void 0 ? void 0 : _a.remove();
    var input = document.createElement("input");
    input.type = "color";
    input.id = "color-picker";
    var span = document.createElement("span");
    span.id = "color-picker-container";
    span.innerText = "Line color: ";
    span.appendChild(input);
    (_b = document.getElementById("input-container")) === null || _b === void 0 ? void 0 : _b.appendChild(span);
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
exports.handleClick = function (x, y, polylines, newline) {
    if (newline === void 0) { newline = false; }
    if (polylines.length < 1 ||
        polylines[polylines.length - 1].length >= 100 ||
        newline) {
        // need to start a new line
        polylines.push(new Array());
    }
    // add this point to the last polyline
    polylines[polylines.length - 1].push(new vec4_1.default([x, y, 0.0, 1.0]));
    return polylines;
};

},{"./lib/tsm/vec4":10}],2:[function(require,module,exports){
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var vec4_1 = require("./lib/tsm/vec4");
/**
 * create an <input type="file"> element and add it to #input-container
 * @return the created input element
 */
exports.createFileInput = function () {
    var _a, _b;
    // remove any existing input
    (_a = document.getElementById("file-upload")) === null || _a === void 0 ? void 0 : _a.remove();
    var input = document.createElement("input");
    input.type = "file";
    input.id = "file-upload";
    (_b = document.getElementById("input-container")) === null || _b === void 0 ? void 0 : _b.appendChild(input);
    return input;
};
/**
 * asynchronously reads text from a file input element, and returns it as a
 * promise
 * @return a promise containined the contents of the first file in the element,
 * or undefined if it can't be read
 */
exports.getInput = function (elt) {
    return new Promise(function (resolve, reject) {
        if (elt.files === null) {
            reject("elt contains no files");
            return;
        }
        var file = elt.files[0];
        var fileReader = new FileReader();
        fileReader.readAsText(file, "UTF-8");
        fileReader.onloadend = function (ev) {
            var _a;
            resolve((_a = ev.target) === null || _a === void 0 ? void 0 : _a.result);
        };
        fileReader.onerror = function () {
            reject("fileReader error");
        };
        fileReader.onabort = function () {
            reject("fileReader aborted");
        };
    });
};
/**
 * parses the text of an input file and returns the dimensions and polylines of
 * the figure in a promise
 * @param str the input file's text as a string
 */
exports.parseFileText = function (str) {
    return new Promise(function (resolve) {
        var lines = str.split("\n").filter(function (s) { return s !== ""; });
        // string can start comment number of lines followed by a row of asterisks
        var start = 0;
        for (var i = 0; i < lines.length; ++i) {
            if (lines[i].substring(0, 1) === "*") {
                start = i + 1;
                break;
            }
        }
        var extents = new Array();
        // first line after the asterisks contains the extents of the figure
        if (start !== 0) {
            extents = lines[start]
                .split(/\s+/)
                .map(parseFloat)
                .slice(0, 4);
            start++;
        }
        // next line after that is the list of polylines in the figure
        var numPolylines = Math.floor(parseFloat(lines[start]));
        start++;
        if (isNaN(numPolylines) || numPolylines < 1) {
            throw new Error("Parse error: invalid number of polylines");
        }
        var polylines = new Array(numPolylines);
        for (var i = 0; i < numPolylines; ++i) {
            polylines[i] = new Array();
        }
        var numPoints = 0;
        var p = -1; // polyline index
        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;
        for (var i = start; start < lines.length && p < numPolylines; ++i) {
            if (numPoints === 0) {
                // reading number of points in this polyline
                numPoints = Math.floor(parseFloat(lines[i]));
                p++;
            }
            else {
                // reading a point
                var v = new vec4_1.default(__spreadArrays(lines[i]
                    .split(/\s+/)
                    .map(parseFloat)
                    .filter(function (n) { return !isNaN(n); })
                    .slice(0, 2), [
                    0.0,
                    1.0
                ]));
                if (v.x < minX)
                    minX = v.x;
                if (v.y < minY)
                    minY = v.y;
                if (v.x > maxX)
                    maxX = v.x;
                if (v.y > maxY)
                    maxY = v.y;
                polylines[p].push(v);
                numPoints--;
            }
        }
        if (extents.length < 4) {
            extents = [minX, maxY, maxX, minY];
        }
        resolve({
            extents: extents,
            polylines: polylines
        });
    });
};

},{"./lib/tsm/vec4":10}],3:[function(require,module,exports){
"use strict";
//
//  initShaders.js
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.initShaders = function (gl, vertexShaderId, fragmentShaderId) {
    var vertElem = document.getElementById(vertexShaderId);
    if (vertElem === null || vertElem.textContent === null) {
        throw new Error("Unable to load vertex shader " + vertexShaderId);
    }
    var vertShdr = gl.createShader(gl.VERTEX_SHADER);
    if (vertShdr === null) {
        throw new Error("Unable to create vertex shader " + vertexShaderId);
    }
    gl.shaderSource(vertShdr, vertElem.textContent);
    gl.compileShader(vertShdr);
    if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
        var msg = "Vertex shader failed to compile.  The error log is:" +
            "<pre>" +
            gl.getShaderInfoLog(vertShdr) +
            "</pre>";
        throw new Error(msg);
    }
    var fragElem = document.getElementById(fragmentShaderId);
    if (fragElem === null || fragElem.textContent === null) {
        throw new Error("Unable to load vertex shader " + fragmentShaderId);
    }
    var fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragShdr === null) {
        throw new Error("Unable to create vertex shader " + fragmentShaderId);
    }
    gl.shaderSource(fragShdr, fragElem.textContent);
    gl.compileShader(fragShdr);
    if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
        var msg = "Fragment shader failed to compile.  The error log is:" +
            "<pre>" +
            gl.getShaderInfoLog(fragShdr) +
            "</pre>";
        throw new Error(msg);
    }
    var program = gl.createProgram();
    if (program === null) {
        throw new Error("Unable to create program");
    }
    gl.attachShader(program, vertShdr);
    gl.attachShader(program, fragShdr);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var msg = "Shader program failed to link.  The error log is:" +
            "<pre>" +
            gl.getProgramInfoLog(program) +
            "</pre>";
        throw new Error(msg);
    }
    return program;
};
/*
// Get a file as a string using  AJAX
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};


function initShadersFromFiles(gl, vShaderName, fShaderName) {
    function getShader(gl, shaderName, type) {
        var shader = gl.createShader(type),
            shaderScript = loadFileAJAX(shaderName);
        if (!shaderScript) {
            alert("Could not find shader source: "+shaderName);
        }
        gl.shaderSource(shader, shaderScript);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    var vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER),
        fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }

    
    return program;
};
*/

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epsilon = 0.00001;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
var mat4_1 = require("./mat4");
var quat_1 = require("./quat");
var vec2_1 = require("./vec2");
var vec3_1 = require("./vec3");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var mat3 = /** @class */ (function () {
    function mat3(values) {
        this.values = new Float32Array(9);
        if (values !== undefined) {
            this.init(values);
        }
    }
    mat3.prototype.at = function (index) {
        return this.values[index];
    };
    mat3.prototype.init = function (values) {
        for (var i = 0; i < 9; i++) {
            this.values[i] = values[i];
        }
        return this;
    };
    mat3.prototype.reset = function () {
        for (var i = 0; i < 9; i++) {
            this.values[i] = 0;
        }
    };
    mat3.prototype.copy = function (dest) {
        if (!dest) {
            dest = new mat3();
        }
        for (var i = 0; i < 9; i++) {
            dest.values[i] = this.values[i];
        }
        return dest;
    };
    mat3.prototype.all = function () {
        var data = [];
        for (var i = 0; i < 9; i++) {
            data[i] = this.values[i];
        }
        return data;
    };
    mat3.prototype.row = function (index) {
        return [
            this.values[index * 3 + 0],
            this.values[index * 3 + 1],
            this.values[index * 3 + 2]
        ];
    };
    mat3.prototype.col = function (index) {
        return [this.values[index], this.values[index + 3], this.values[index + 6]];
    };
    mat3.prototype.equals = function (matrix, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        for (var i = 0; i < 9; i++) {
            if (Math.abs(this.values[i] - matrix.at(i)) > threshold) {
                return false;
            }
        }
        return true;
    };
    mat3.prototype.determinant = function () {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a10 = this.values[3];
        var a11 = this.values[4];
        var a12 = this.values[5];
        var a20 = this.values[6];
        var a21 = this.values[7];
        var a22 = this.values[8];
        var det01 = a22 * a11 - a12 * a21;
        var det11 = -a22 * a10 + a12 * a20;
        var det21 = a21 * a10 - a11 * a20;
        return a00 * det01 + a01 * det11 + a02 * det21;
    };
    mat3.prototype.setIdentity = function () {
        this.values[0] = 1;
        this.values[1] = 0;
        this.values[2] = 0;
        this.values[3] = 0;
        this.values[4] = 1;
        this.values[5] = 0;
        this.values[6] = 0;
        this.values[7] = 0;
        this.values[8] = 1;
        return this;
    };
    mat3.prototype.transpose = function () {
        var temp01 = this.values[1];
        var temp02 = this.values[2];
        var temp12 = this.values[5];
        this.values[1] = this.values[3];
        this.values[2] = this.values[6];
        this.values[3] = temp01;
        this.values[5] = this.values[7];
        this.values[6] = temp02;
        this.values[7] = temp12;
        return this;
    };
    mat3.prototype.inverse = function () {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a10 = this.values[3];
        var a11 = this.values[4];
        var a12 = this.values[5];
        var a20 = this.values[6];
        var a21 = this.values[7];
        var a22 = this.values[8];
        var det01 = a22 * a11 - a12 * a21;
        var det11 = -a22 * a10 + a12 * a20;
        var det21 = a21 * a10 - a11 * a20;
        var det = a00 * det01 + a01 * det11 + a02 * det21;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        this.values[0] = det01 * det;
        this.values[1] = (-a22 * a01 + a02 * a21) * det;
        this.values[2] = (a12 * a01 - a02 * a11) * det;
        this.values[3] = det11 * det;
        this.values[4] = (a22 * a00 - a02 * a20) * det;
        this.values[5] = (-a12 * a00 + a02 * a10) * det;
        this.values[6] = det21 * det;
        this.values[7] = (-a21 * a00 + a01 * a20) * det;
        this.values[8] = (a11 * a00 - a01 * a10) * det;
        return this;
    };
    mat3.prototype.multiply = function (matrix) {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a10 = this.values[3];
        var a11 = this.values[4];
        var a12 = this.values[5];
        var a20 = this.values[6];
        var a21 = this.values[7];
        var a22 = this.values[8];
        var b00 = matrix.at(0);
        var b01 = matrix.at(1);
        var b02 = matrix.at(2);
        var b10 = matrix.at(3);
        var b11 = matrix.at(4);
        var b12 = matrix.at(5);
        var b20 = matrix.at(6);
        var b21 = matrix.at(7);
        var b22 = matrix.at(8);
        this.values[0] = b00 * a00 + b01 * a10 + b02 * a20;
        this.values[1] = b00 * a01 + b01 * a11 + b02 * a21;
        this.values[2] = b00 * a02 + b01 * a12 + b02 * a22;
        this.values[3] = b10 * a00 + b11 * a10 + b12 * a20;
        this.values[4] = b10 * a01 + b11 * a11 + b12 * a21;
        this.values[5] = b10 * a02 + b11 * a12 + b12 * a22;
        this.values[6] = b20 * a00 + b21 * a10 + b22 * a20;
        this.values[7] = b20 * a01 + b21 * a11 + b22 * a21;
        this.values[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return this;
    };
    mat3.prototype.multiplyVec2 = function (vector, result) {
        var x = vector.x;
        var y = vector.y;
        if (result) {
            result.xy = [
                x * this.values[0] + y * this.values[3] + this.values[6],
                x * this.values[1] + y * this.values[4] + this.values[7]
            ];
            return result;
        }
        else {
            return new vec2_1.default([
                x * this.values[0] + y * this.values[3] + this.values[6],
                x * this.values[1] + y * this.values[4] + this.values[7]
            ]);
        }
    };
    mat3.prototype.multiplyVec3 = function (vector, result) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        if (result) {
            result.xyz = [
                x * this.values[0] + y * this.values[3] + z * this.values[6],
                x * this.values[1] + y * this.values[4] + z * this.values[7],
                x * this.values[2] + y * this.values[5] + z * this.values[8]
            ];
            return result;
        }
        else {
            return new vec3_1.default([
                x * this.values[0] + y * this.values[3] + z * this.values[6],
                x * this.values[1] + y * this.values[4] + z * this.values[7],
                x * this.values[2] + y * this.values[5] + z * this.values[8]
            ]);
        }
    };
    mat3.prototype.toMat4 = function (result) {
        if (result) {
            result.init([
                this.values[0],
                this.values[1],
                this.values[2],
                0,
                this.values[3],
                this.values[4],
                this.values[5],
                0,
                this.values[6],
                this.values[7],
                this.values[8],
                0,
                0,
                0,
                0,
                1
            ]);
            return result;
        }
        else {
            return new mat4_1.default([
                this.values[0],
                this.values[1],
                this.values[2],
                0,
                this.values[3],
                this.values[4],
                this.values[5],
                0,
                this.values[6],
                this.values[7],
                this.values[8],
                0,
                0,
                0,
                0,
                1
            ]);
        }
    };
    mat3.prototype.toQuat = function () {
        var m00 = this.values[0];
        var m01 = this.values[1];
        var m02 = this.values[2];
        var m10 = this.values[3];
        var m11 = this.values[4];
        var m12 = this.values[5];
        var m20 = this.values[6];
        var m21 = this.values[7];
        var m22 = this.values[8];
        var fourXSquaredMinus1 = m00 - m11 - m22;
        var fourYSquaredMinus1 = m11 - m00 - m22;
        var fourZSquaredMinus1 = m22 - m00 - m11;
        var fourWSquaredMinus1 = m00 + m11 + m22;
        var biggestIndex = 0;
        var fourBiggestSquaredMinus1 = fourWSquaredMinus1;
        if (fourXSquaredMinus1 > fourBiggestSquaredMinus1) {
            fourBiggestSquaredMinus1 = fourXSquaredMinus1;
            biggestIndex = 1;
        }
        if (fourYSquaredMinus1 > fourBiggestSquaredMinus1) {
            fourBiggestSquaredMinus1 = fourYSquaredMinus1;
            biggestIndex = 2;
        }
        if (fourZSquaredMinus1 > fourBiggestSquaredMinus1) {
            fourBiggestSquaredMinus1 = fourZSquaredMinus1;
            biggestIndex = 3;
        }
        var biggestVal = Math.sqrt(fourBiggestSquaredMinus1 + 1) * 0.5;
        var mult = 0.25 / biggestVal;
        var result = new quat_1.default();
        switch (biggestIndex) {
            case 0:
                result.w = biggestVal;
                result.x = (m12 - m21) * mult;
                result.y = (m20 - m02) * mult;
                result.z = (m01 - m10) * mult;
                break;
            case 1:
                result.w = (m12 - m21) * mult;
                result.x = biggestVal;
                result.y = (m01 + m10) * mult;
                result.z = (m20 + m02) * mult;
                break;
            case 2:
                result.w = (m20 - m02) * mult;
                result.x = (m01 + m10) * mult;
                result.y = biggestVal;
                result.z = (m12 + m21) * mult;
                break;
            case 3:
                result.w = (m01 - m10) * mult;
                result.x = (m20 + m02) * mult;
                result.y = (m12 + m21) * mult;
                result.z = biggestVal;
                break;
        }
        return result;
    };
    mat3.prototype.rotate = function (angle, axis) {
        var x = axis.x;
        var y = axis.y;
        var z = axis.z;
        var length = Math.sqrt(x * x + y * y + z * z);
        if (!length) {
            return null;
        }
        if (length !== 1) {
            length = 1 / length;
            x *= length;
            y *= length;
            z *= length;
        }
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        var t = 1.0 - c;
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var b00 = x * x * t + c;
        var b01 = y * x * t + z * s;
        var b02 = z * x * t - y * s;
        var b10 = x * y * t - z * s;
        var b11 = y * y * t + c;
        var b12 = z * y * t + x * s;
        var b20 = x * z * t + y * s;
        var b21 = y * z * t - x * s;
        var b22 = z * z * t + c;
        this.values[0] = a00 * b00 + a10 * b01 + a20 * b02;
        this.values[1] = a01 * b00 + a11 * b01 + a21 * b02;
        this.values[2] = a02 * b00 + a12 * b01 + a22 * b02;
        this.values[3] = a00 * b10 + a10 * b11 + a20 * b12;
        this.values[4] = a01 * b10 + a11 * b11 + a21 * b12;
        this.values[5] = a02 * b10 + a12 * b11 + a22 * b12;
        this.values[6] = a00 * b20 + a10 * b21 + a20 * b22;
        this.values[7] = a01 * b20 + a11 * b21 + a21 * b22;
        this.values[8] = a02 * b20 + a12 * b21 + a22 * b22;
        return this;
    };
    mat3.product = function (m1, m2, result) {
        var a00 = m1.at(0);
        var a01 = m1.at(1);
        var a02 = m1.at(2);
        var a10 = m1.at(3);
        var a11 = m1.at(4);
        var a12 = m1.at(5);
        var a20 = m1.at(6);
        var a21 = m1.at(7);
        var a22 = m1.at(8);
        var b00 = m2.at(0);
        var b01 = m2.at(1);
        var b02 = m2.at(2);
        var b10 = m2.at(3);
        var b11 = m2.at(4);
        var b12 = m2.at(5);
        var b20 = m2.at(6);
        var b21 = m2.at(7);
        var b22 = m2.at(8);
        if (result) {
            result.init([
                b00 * a00 + b01 * a10 + b02 * a20,
                b00 * a01 + b01 * a11 + b02 * a21,
                b00 * a02 + b01 * a12 + b02 * a22,
                b10 * a00 + b11 * a10 + b12 * a20,
                b10 * a01 + b11 * a11 + b12 * a21,
                b10 * a02 + b11 * a12 + b12 * a22,
                b20 * a00 + b21 * a10 + b22 * a20,
                b20 * a01 + b21 * a11 + b22 * a21,
                b20 * a02 + b21 * a12 + b22 * a22
            ]);
            return result;
        }
        else {
            return new mat3([
                b00 * a00 + b01 * a10 + b02 * a20,
                b00 * a01 + b01 * a11 + b02 * a21,
                b00 * a02 + b01 * a12 + b02 * a22,
                b10 * a00 + b11 * a10 + b12 * a20,
                b10 * a01 + b11 * a11 + b12 * a21,
                b10 * a02 + b11 * a12 + b12 * a22,
                b20 * a00 + b21 * a10 + b22 * a20,
                b20 * a01 + b21 * a11 + b22 * a21,
                b20 * a02 + b21 * a12 + b22 * a22
            ]);
        }
    };
    mat3.identity = new mat3().setIdentity();
    return mat3;
}());
exports.default = mat3;

},{"./constants":4,"./mat4":6,"./quat":7,"./vec2":8,"./vec3":9}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
var mat3_1 = require("./mat3");
var vec3_1 = require("./vec3");
var vec4_1 = require("./vec4");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var mat4 = /** @class */ (function () {
    function mat4(values) {
        this.values = new Float32Array(16);
        if (values !== undefined) {
            this.init(values);
        }
    }
    mat4.prototype.at = function (index) {
        return this.values[index];
    };
    mat4.prototype.init = function (values) {
        for (var i = 0; i < 16; i++) {
            this.values[i] = values[i];
        }
        return this;
    };
    mat4.prototype.reset = function () {
        for (var i = 0; i < 16; i++) {
            this.values[i] = 0;
        }
    };
    mat4.prototype.copy = function (dest) {
        if (!dest) {
            dest = new mat4();
        }
        for (var i = 0; i < 16; i++) {
            dest.values[i] = this.values[i];
        }
        return dest;
    };
    mat4.prototype.all = function () {
        var data = [];
        for (var i = 0; i < 16; i++) {
            data[i] = this.values[i];
        }
        return data;
    };
    mat4.prototype.row = function (index) {
        return [
            this.values[index * 4 + 0],
            this.values[index * 4 + 1],
            this.values[index * 4 + 2],
            this.values[index * 4 + 3]
        ];
    };
    mat4.prototype.col = function (index) {
        return [
            this.values[index],
            this.values[index + 4],
            this.values[index + 8],
            this.values[index + 12]
        ];
    };
    mat4.prototype.equals = function (matrix, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        for (var i = 0; i < 16; i++) {
            if (Math.abs(this.values[i] - matrix.at(i)) > threshold) {
                return false;
            }
        }
        return true;
    };
    mat4.prototype.determinant = function () {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a03 = this.values[3];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a13 = this.values[7];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var a23 = this.values[11];
        var a30 = this.values[12];
        var a31 = this.values[13];
        var a32 = this.values[14];
        var a33 = this.values[15];
        var det00 = a00 * a11 - a01 * a10;
        var det01 = a00 * a12 - a02 * a10;
        var det02 = a00 * a13 - a03 * a10;
        var det03 = a01 * a12 - a02 * a11;
        var det04 = a01 * a13 - a03 * a11;
        var det05 = a02 * a13 - a03 * a12;
        var det06 = a20 * a31 - a21 * a30;
        var det07 = a20 * a32 - a22 * a30;
        var det08 = a20 * a33 - a23 * a30;
        var det09 = a21 * a32 - a22 * a31;
        var det10 = a21 * a33 - a23 * a31;
        var det11 = a22 * a33 - a23 * a32;
        return (det00 * det11 -
            det01 * det10 +
            det02 * det09 +
            det03 * det08 -
            det04 * det07 +
            det05 * det06);
    };
    mat4.prototype.setIdentity = function () {
        this.values[0] = 1;
        this.values[1] = 0;
        this.values[2] = 0;
        this.values[3] = 0;
        this.values[4] = 0;
        this.values[5] = 1;
        this.values[6] = 0;
        this.values[7] = 0;
        this.values[8] = 0;
        this.values[9] = 0;
        this.values[10] = 1;
        this.values[11] = 0;
        this.values[12] = 0;
        this.values[13] = 0;
        this.values[14] = 0;
        this.values[15] = 1;
        return this;
    };
    mat4.prototype.transpose = function () {
        var temp01 = this.values[1];
        var temp02 = this.values[2];
        var temp03 = this.values[3];
        var temp12 = this.values[6];
        var temp13 = this.values[7];
        var temp23 = this.values[11];
        this.values[1] = this.values[4];
        this.values[2] = this.values[8];
        this.values[3] = this.values[12];
        this.values[4] = temp01;
        this.values[6] = this.values[9];
        this.values[7] = this.values[13];
        this.values[8] = temp02;
        this.values[9] = temp12;
        this.values[11] = this.values[14];
        this.values[12] = temp03;
        this.values[13] = temp13;
        this.values[14] = temp23;
        return this;
    };
    mat4.prototype.inverse = function () {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a03 = this.values[3];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a13 = this.values[7];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var a23 = this.values[11];
        var a30 = this.values[12];
        var a31 = this.values[13];
        var a32 = this.values[14];
        var a33 = this.values[15];
        var det00 = a00 * a11 - a01 * a10;
        var det01 = a00 * a12 - a02 * a10;
        var det02 = a00 * a13 - a03 * a10;
        var det03 = a01 * a12 - a02 * a11;
        var det04 = a01 * a13 - a03 * a11;
        var det05 = a02 * a13 - a03 * a12;
        var det06 = a20 * a31 - a21 * a30;
        var det07 = a20 * a32 - a22 * a30;
        var det08 = a20 * a33 - a23 * a30;
        var det09 = a21 * a32 - a22 * a31;
        var det10 = a21 * a33 - a23 * a31;
        var det11 = a22 * a33 - a23 * a32;
        var det = det00 * det11 -
            det01 * det10 +
            det02 * det09 +
            det03 * det08 -
            det04 * det07 +
            det05 * det06;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        this.values[0] = (a11 * det11 - a12 * det10 + a13 * det09) * det;
        this.values[1] = (-a01 * det11 + a02 * det10 - a03 * det09) * det;
        this.values[2] = (a31 * det05 - a32 * det04 + a33 * det03) * det;
        this.values[3] = (-a21 * det05 + a22 * det04 - a23 * det03) * det;
        this.values[4] = (-a10 * det11 + a12 * det08 - a13 * det07) * det;
        this.values[5] = (a00 * det11 - a02 * det08 + a03 * det07) * det;
        this.values[6] = (-a30 * det05 + a32 * det02 - a33 * det01) * det;
        this.values[7] = (a20 * det05 - a22 * det02 + a23 * det01) * det;
        this.values[8] = (a10 * det10 - a11 * det08 + a13 * det06) * det;
        this.values[9] = (-a00 * det10 + a01 * det08 - a03 * det06) * det;
        this.values[10] = (a30 * det04 - a31 * det02 + a33 * det00) * det;
        this.values[11] = (-a20 * det04 + a21 * det02 - a23 * det00) * det;
        this.values[12] = (-a10 * det09 + a11 * det07 - a12 * det06) * det;
        this.values[13] = (a00 * det09 - a01 * det07 + a02 * det06) * det;
        this.values[14] = (-a30 * det03 + a31 * det01 - a32 * det00) * det;
        this.values[15] = (a20 * det03 - a21 * det01 + a22 * det00) * det;
        return this;
    };
    mat4.prototype.multiply = function (matrix) {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a03 = this.values[3];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a13 = this.values[7];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var a23 = this.values[11];
        var a30 = this.values[12];
        var a31 = this.values[13];
        var a32 = this.values[14];
        var a33 = this.values[15];
        var b0 = matrix.at(0);
        var b1 = matrix.at(1);
        var b2 = matrix.at(2);
        var b3 = matrix.at(3);
        this.values[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this.values[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this.values[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this.values[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = matrix.at(4);
        b1 = matrix.at(5);
        b2 = matrix.at(6);
        b3 = matrix.at(7);
        this.values[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this.values[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this.values[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this.values[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = matrix.at(8);
        b1 = matrix.at(9);
        b2 = matrix.at(10);
        b3 = matrix.at(11);
        this.values[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this.values[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this.values[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this.values[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = matrix.at(12);
        b1 = matrix.at(13);
        b2 = matrix.at(14);
        b3 = matrix.at(15);
        this.values[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this.values[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this.values[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this.values[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return this;
    };
    mat4.prototype.multiplyVec3 = function (vector) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        return new vec3_1.default([
            this.values[0] * x +
                this.values[4] * y +
                this.values[8] * z +
                this.values[12],
            this.values[1] * x +
                this.values[5] * y +
                this.values[9] * z +
                this.values[13],
            this.values[2] * x +
                this.values[6] * y +
                this.values[10] * z +
                this.values[14]
        ]);
    };
    mat4.prototype.multiplyVec4 = function (vector, dest) {
        if (!dest) {
            dest = new vec4_1.default();
        }
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        var w = vector.w;
        dest.x =
            this.values[0] * x +
                this.values[4] * y +
                this.values[8] * z +
                this.values[12] * w;
        dest.y =
            this.values[1] * x +
                this.values[5] * y +
                this.values[9] * z +
                this.values[13] * w;
        dest.z =
            this.values[2] * x +
                this.values[6] * y +
                this.values[10] * z +
                this.values[14] * w;
        dest.w =
            this.values[3] * x +
                this.values[7] * y +
                this.values[11] * z +
                this.values[15] * w;
        return dest;
    };
    mat4.prototype.toMat3 = function () {
        return new mat3_1.default([
            this.values[0],
            this.values[1],
            this.values[2],
            this.values[4],
            this.values[5],
            this.values[6],
            this.values[8],
            this.values[9],
            this.values[10]
        ]);
    };
    mat4.prototype.toInverseMat3 = function () {
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var det01 = a22 * a11 - a12 * a21;
        var det11 = -a22 * a10 + a12 * a20;
        var det21 = a21 * a10 - a11 * a20;
        var det = a00 * det01 + a01 * det11 + a02 * det21;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        return new mat3_1.default([
            det01 * det,
            (-a22 * a01 + a02 * a21) * det,
            (a12 * a01 - a02 * a11) * det,
            det11 * det,
            (a22 * a00 - a02 * a20) * det,
            (-a12 * a00 + a02 * a10) * det,
            det21 * det,
            (-a21 * a00 + a01 * a20) * det,
            (a11 * a00 - a01 * a10) * det
        ]);
    };
    mat4.prototype.translate = function (vector) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        this.values[12] +=
            this.values[0] * x + this.values[4] * y + this.values[8] * z;
        this.values[13] +=
            this.values[1] * x + this.values[5] * y + this.values[9] * z;
        this.values[14] +=
            this.values[2] * x + this.values[6] * y + this.values[10] * z;
        this.values[15] +=
            this.values[3] * x + this.values[7] * y + this.values[11] * z;
        return this;
    };
    mat4.prototype.scale = function (vector) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        this.values[0] *= x;
        this.values[1] *= x;
        this.values[2] *= x;
        this.values[3] *= x;
        this.values[4] *= y;
        this.values[5] *= y;
        this.values[6] *= y;
        this.values[7] *= y;
        this.values[8] *= z;
        this.values[9] *= z;
        this.values[10] *= z;
        this.values[11] *= z;
        return this;
    };
    mat4.prototype.rotate = function (angle, axis) {
        var x = axis.x;
        var y = axis.y;
        var z = axis.z;
        var length = Math.sqrt(x * x + y * y + z * z);
        if (!length) {
            return null;
        }
        if (length !== 1) {
            length = 1 / length;
            x *= length;
            y *= length;
            z *= length;
        }
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        var t = 1.0 - c;
        var a00 = this.values[0];
        var a01 = this.values[1];
        var a02 = this.values[2];
        var a03 = this.values[3];
        var a10 = this.values[4];
        var a11 = this.values[5];
        var a12 = this.values[6];
        var a13 = this.values[7];
        var a20 = this.values[8];
        var a21 = this.values[9];
        var a22 = this.values[10];
        var a23 = this.values[11];
        var b00 = x * x * t + c;
        var b01 = y * x * t + z * s;
        var b02 = z * x * t - y * s;
        var b10 = x * y * t - z * s;
        var b11 = y * y * t + c;
        var b12 = z * y * t + x * s;
        var b20 = x * z * t + y * s;
        var b21 = y * z * t - x * s;
        var b22 = z * z * t + c;
        this.values[0] = a00 * b00 + a10 * b01 + a20 * b02;
        this.values[1] = a01 * b00 + a11 * b01 + a21 * b02;
        this.values[2] = a02 * b00 + a12 * b01 + a22 * b02;
        this.values[3] = a03 * b00 + a13 * b01 + a23 * b02;
        this.values[4] = a00 * b10 + a10 * b11 + a20 * b12;
        this.values[5] = a01 * b10 + a11 * b11 + a21 * b12;
        this.values[6] = a02 * b10 + a12 * b11 + a22 * b12;
        this.values[7] = a03 * b10 + a13 * b11 + a23 * b12;
        this.values[8] = a00 * b20 + a10 * b21 + a20 * b22;
        this.values[9] = a01 * b20 + a11 * b21 + a21 * b22;
        this.values[10] = a02 * b20 + a12 * b21 + a22 * b22;
        this.values[11] = a03 * b20 + a13 * b21 + a23 * b22;
        return this;
    };
    mat4.frustum = function (left, right, bottom, top, near, far) {
        var rl = right - left;
        var tb = top - bottom;
        var fn = far - near;
        return new mat4([
            (near * 2) / rl,
            0,
            0,
            0,
            0,
            (near * 2) / tb,
            0,
            0,
            (right + left) / rl,
            (top + bottom) / tb,
            -(far + near) / fn,
            -1,
            0,
            0,
            -(far * near * 2) / fn,
            0
        ]);
    };
    mat4.perspective = function (fov, aspect, near, far) {
        var top = near * Math.tan((fov * Math.PI) / 360.0);
        var right = top * aspect;
        return mat4.frustum(-right, right, -top, top, near, far);
    };
    mat4.orthographic = function (left, right, bottom, top, near, far) {
        var rl = right - left;
        var tb = top - bottom;
        var fn = far - near;
        return new mat4([
            2 / rl,
            0,
            0,
            0,
            0,
            2 / tb,
            0,
            0,
            0,
            0,
            -2 / fn,
            0,
            -(left + right) / rl,
            -(top + bottom) / tb,
            -(far + near) / fn,
            1
        ]);
    };
    mat4.lookAt = function (position, target, up) {
        if (up === void 0) { up = vec3_1.default.up; }
        if (position.equals(target)) {
            return this.identity;
        }
        var z = vec3_1.default.difference(position, target).normalize();
        var x = vec3_1.default.cross(up, z).normalize();
        var y = vec3_1.default.cross(z, x).normalize();
        return new mat4([
            x.x,
            y.x,
            z.x,
            0,
            x.y,
            y.y,
            z.y,
            0,
            x.z,
            y.z,
            z.z,
            0,
            -vec3_1.default.dot(x, position),
            -vec3_1.default.dot(y, position),
            -vec3_1.default.dot(z, position),
            1
        ]);
    };
    mat4.product = function (m1, m2, result) {
        var a00 = m1.at(0);
        var a01 = m1.at(1);
        var a02 = m1.at(2);
        var a03 = m1.at(3);
        var a10 = m1.at(4);
        var a11 = m1.at(5);
        var a12 = m1.at(6);
        var a13 = m1.at(7);
        var a20 = m1.at(8);
        var a21 = m1.at(9);
        var a22 = m1.at(10);
        var a23 = m1.at(11);
        var a30 = m1.at(12);
        var a31 = m1.at(13);
        var a32 = m1.at(14);
        var a33 = m1.at(15);
        var b00 = m2.at(0);
        var b01 = m2.at(1);
        var b02 = m2.at(2);
        var b03 = m2.at(3);
        var b10 = m2.at(4);
        var b11 = m2.at(5);
        var b12 = m2.at(6);
        var b13 = m2.at(7);
        var b20 = m2.at(8);
        var b21 = m2.at(9);
        var b22 = m2.at(10);
        var b23 = m2.at(11);
        var b30 = m2.at(12);
        var b31 = m2.at(13);
        var b32 = m2.at(14);
        var b33 = m2.at(15);
        if (result) {
            result.init([
                b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
                b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
                b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
                b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
                b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
                b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
                b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
                b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
                b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
                b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
                b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
                b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
                b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
                b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
                b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
                b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
            ]);
            return result;
        }
        else {
            return new mat4([
                b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
                b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
                b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
                b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
                b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
                b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
                b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
                b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
                b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
                b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
                b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
                b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
                b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
                b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
                b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
                b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
            ]);
        }
    };
    mat4.identity = new mat4().setIdentity();
    return mat4;
}());
exports.default = mat4;

},{"./constants":4,"./mat3":5,"./vec3":9,"./vec4":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
var mat3_1 = require("./mat3");
var mat4_1 = require("./mat4");
var vec3_1 = require("./vec3");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var quat = /** @class */ (function () {
    function quat(values) {
        this.values = new Float32Array(4);
        if (values !== undefined) {
            this.xyzw = values;
        }
    }
    Object.defineProperty(quat.prototype, "x", {
        get: function () {
            return this.values[0];
        },
        set: function (value) {
            this.values[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "y", {
        get: function () {
            return this.values[1];
        },
        set: function (value) {
            this.values[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "z", {
        get: function () {
            return this.values[2];
        },
        set: function (value) {
            this.values[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "w", {
        get: function () {
            return this.values[3];
        },
        set: function (value) {
            this.values[3] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "xy", {
        get: function () {
            return [this.values[0], this.values[1]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "xyz", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(quat.prototype, "xyzw", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2], this.values[3]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
            this.values[3] = values[3];
        },
        enumerable: true,
        configurable: true
    });
    quat.prototype.at = function (index) {
        return this.values[index];
    };
    quat.prototype.reset = function () {
        for (var i = 0; i < 4; i++) {
            this.values[i] = 0;
        }
    };
    quat.prototype.copy = function (dest) {
        if (!dest) {
            dest = new quat();
        }
        for (var i = 0; i < 4; i++) {
            dest.values[i] = this.values[i];
        }
        return dest;
    };
    quat.prototype.roll = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        return Math.atan2(2.0 * (x * y + w * z), w * w + x * x - y * y - z * z);
    };
    quat.prototype.pitch = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        return Math.atan2(2.0 * (y * z + w * x), w * w - x * x - y * y + z * z);
    };
    quat.prototype.yaw = function () {
        return Math.asin(2.0 * (this.x * this.z - this.w * this.y));
    };
    quat.prototype.equals = function (vector, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        for (var i = 0; i < 4; i++) {
            if (Math.abs(this.values[i] - vector.at(i)) > threshold) {
                return false;
            }
        }
        return true;
    };
    quat.prototype.setIdentity = function () {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this;
    };
    quat.prototype.calculateW = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        this.w = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
        return this;
    };
    quat.prototype.inverse = function () {
        var dot = quat.dot(this, this);
        if (!dot) {
            this.xyzw = [0, 0, 0, 0];
            return this;
        }
        var invDot = dot ? 1.0 / dot : 0;
        this.x *= -invDot;
        this.y *= -invDot;
        this.z *= -invDot;
        this.w *= invDot;
        return this;
    };
    quat.prototype.conjugate = function () {
        this.values[0] *= -1;
        this.values[1] *= -1;
        this.values[2] *= -1;
        return this;
    };
    quat.prototype.length = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        return Math.sqrt(x * x + y * y + z * z + w * w);
    };
    quat.prototype.normalize = function (dest) {
        if (!dest) {
            dest = this;
        }
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        var length = Math.sqrt(x * x + y * y + z * z + w * w);
        if (!length) {
            dest.x = 0;
            dest.y = 0;
            dest.z = 0;
            dest.w = 0;
            return dest;
        }
        length = 1 / length;
        dest.x = x * length;
        dest.y = y * length;
        dest.z = z * length;
        dest.w = w * length;
        return dest;
    };
    quat.prototype.add = function (other) {
        for (var i = 0; i < 4; i++) {
            this.values[i] += other.at(i);
        }
        return this;
    };
    quat.prototype.multiply = function (other) {
        var q1x = this.values[0];
        var q1y = this.values[1];
        var q1z = this.values[2];
        var q1w = this.values[3];
        var q2x = other.x;
        var q2y = other.y;
        var q2z = other.z;
        var q2w = other.w;
        this.x = q1x * q2w + q1w * q2x + q1y * q2z - q1z * q2y;
        this.y = q1y * q2w + q1w * q2y + q1z * q2x - q1x * q2z;
        this.z = q1z * q2w + q1w * q2z + q1x * q2y - q1y * q2x;
        this.w = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z;
        return this;
    };
    quat.prototype.multiplyVec3 = function (vector, dest) {
        if (!dest) {
            dest = new vec3_1.default();
        }
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        var qx = this.x;
        var qy = this.y;
        var qz = this.z;
        var qw = this.w;
        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;
        dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return dest;
    };
    quat.prototype.toMat3 = function (dest) {
        if (!dest) {
            dest = new mat3_1.default();
        }
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var xy = x * y2;
        var xz = x * z2;
        var yy = y * y2;
        var yz = y * z2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        dest.init([
            1 - (yy + zz),
            xy + wz,
            xz - wy,
            xy - wz,
            1 - (xx + zz),
            yz + wx,
            xz + wy,
            yz - wx,
            1 - (xx + yy)
        ]);
        return dest;
    };
    quat.prototype.toMat4 = function (dest) {
        if (!dest) {
            dest = new mat4_1.default();
        }
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var xy = x * y2;
        var xz = x * z2;
        var yy = y * y2;
        var yz = y * z2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        dest.init([
            1 - (yy + zz),
            xy + wz,
            xz - wy,
            0,
            xy - wz,
            1 - (xx + zz),
            yz + wx,
            0,
            xz + wy,
            yz - wx,
            1 - (xx + yy),
            0,
            0,
            0,
            0,
            1
        ]);
        return dest;
    };
    quat.dot = function (q1, q2) {
        return q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    };
    quat.sum = function (q1, q2, dest) {
        if (!dest) {
            dest = new quat();
        }
        dest.x = q1.x + q2.x;
        dest.y = q1.y + q2.y;
        dest.z = q1.z + q2.z;
        dest.w = q1.w + q2.w;
        return dest;
    };
    quat.product = function (q1, q2, dest) {
        if (!dest) {
            dest = new quat();
        }
        var q1x = q1.x;
        var q1y = q1.y;
        var q1z = q1.z;
        var q1w = q1.w;
        var q2x = q2.x;
        var q2y = q2.y;
        var q2z = q2.z;
        var q2w = q2.w;
        dest.x = q1x * q2w + q1w * q2x + q1y * q2z - q1z * q2y;
        dest.y = q1y * q2w + q1w * q2y + q1z * q2x - q1x * q2z;
        dest.z = q1z * q2w + q1w * q2z + q1x * q2y - q1y * q2x;
        dest.w = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z;
        return dest;
    };
    quat.cross = function (q1, q2, dest) {
        if (!dest) {
            dest = new quat();
        }
        var q1x = q1.x;
        var q1y = q1.y;
        var q1z = q1.z;
        var q1w = q1.w;
        var q2x = q2.x;
        var q2y = q2.y;
        var q2z = q2.z;
        var q2w = q2.w;
        dest.x = q1w * q2z + q1z * q2w + q1x * q2y - q1y * q2x;
        dest.y = q1w * q2w - q1x * q2x - q1y * q2y - q1z * q2z;
        dest.z = q1w * q2x + q1x * q2w + q1y * q2z - q1z * q2y;
        dest.w = q1w * q2y + q1y * q2w + q1z * q2x - q1x * q2z;
        return dest;
    };
    quat.shortMix = function (q1, q2, time, dest) {
        if (!dest) {
            dest = new quat();
        }
        if (time <= 0.0) {
            dest.xyzw = q1.xyzw;
            return dest;
        }
        else if (time >= 1.0) {
            dest.xyzw = q2.xyzw;
            return dest;
        }
        var cos = quat.dot(q1, q2);
        var q2a = q2.copy();
        if (cos < 0.0) {
            q2a.inverse();
            cos = -cos;
        }
        var k0;
        var k1;
        if (cos > 0.9999) {
            k0 = 1 - time;
            k1 = 0 + time;
        }
        else {
            var sin = Math.sqrt(1 - cos * cos);
            var angle = Math.atan2(sin, cos);
            var oneOverSin = 1 / sin;
            k0 = Math.sin((1 - time) * angle) * oneOverSin;
            k1 = Math.sin((0 + time) * angle) * oneOverSin;
        }
        dest.x = k0 * q1.x + k1 * q2a.x;
        dest.y = k0 * q1.y + k1 * q2a.y;
        dest.z = k0 * q1.z + k1 * q2a.z;
        dest.w = k0 * q1.w + k1 * q2a.w;
        return dest;
    };
    quat.mix = function (q1, q2, time, dest) {
        if (!dest) {
            dest = new quat();
        }
        var cosHalfTheta = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
        if (Math.abs(cosHalfTheta) >= 1.0) {
            dest.xyzw = q1.xyzw;
            return dest;
        }
        var halfTheta = Math.acos(cosHalfTheta);
        var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
        if (Math.abs(sinHalfTheta) < 0.001) {
            dest.x = q1.x * 0.5 + q2.x * 0.5;
            dest.y = q1.y * 0.5 + q2.y * 0.5;
            dest.z = q1.z * 0.5 + q2.z * 0.5;
            dest.w = q1.w * 0.5 + q2.w * 0.5;
            return dest;
        }
        var ratioA = Math.sin((1 - time) * halfTheta) / sinHalfTheta;
        var ratioB = Math.sin(time * halfTheta) / sinHalfTheta;
        dest.x = q1.x * ratioA + q2.x * ratioB;
        dest.y = q1.y * ratioA + q2.y * ratioB;
        dest.z = q1.z * ratioA + q2.z * ratioB;
        dest.w = q1.w * ratioA + q2.w * ratioB;
        return dest;
    };
    quat.fromAxisAngle = function (axis, angle, dest) {
        if (!dest) {
            dest = new quat();
        }
        angle *= 0.5;
        var sin = Math.sin(angle);
        dest.x = axis.x * sin;
        dest.y = axis.y * sin;
        dest.z = axis.z * sin;
        dest.w = Math.cos(angle);
        return dest;
    };
    quat.identity = new quat().setIdentity();
    return quat;
}());
exports.default = quat;

},{"./constants":4,"./mat3":5,"./mat4":6,"./vec3":9}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./vec3");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var vec2 = /** @class */ (function () {
    function vec2(values) {
        this.values = new Float32Array(2);
        if (values !== undefined) {
            this.xy = values;
        }
    }
    Object.defineProperty(vec2.prototype, "x", {
        get: function () {
            return this.values[0];
        },
        set: function (value) {
            this.values[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec2.prototype, "y", {
        get: function () {
            return this.values[1];
        },
        set: function (value) {
            this.values[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec2.prototype, "xy", {
        get: function () {
            return [this.values[0], this.values[1]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
        },
        enumerable: true,
        configurable: true
    });
    vec2.prototype.at = function (index) {
        return this.values[index];
    };
    vec2.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
    };
    vec2.prototype.copy = function (dest) {
        if (!dest) {
            dest = new vec2();
        }
        dest.x = this.x;
        dest.y = this.y;
        return dest;
    };
    vec2.prototype.negate = function (dest) {
        if (!dest) {
            dest = this;
        }
        dest.x = -this.x;
        dest.y = -this.y;
        return dest;
    };
    vec2.prototype.equals = function (vector, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        if (Math.abs(this.x - vector.x) > threshold) {
            return false;
        }
        if (Math.abs(this.y - vector.y) > threshold) {
            return false;
        }
        return true;
    };
    vec2.prototype.length = function () {
        return Math.sqrt(this.squaredLength());
    };
    vec2.prototype.squaredLength = function () {
        var x = this.x;
        var y = this.y;
        return x * x + y * y;
    };
    vec2.prototype.add = function (vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    };
    vec2.prototype.subtract = function (vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    };
    vec2.prototype.multiply = function (vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        return this;
    };
    vec2.prototype.divide = function (vector) {
        this.x /= vector.x;
        this.y /= vector.y;
        return this;
    };
    vec2.prototype.scale = function (value, dest) {
        if (!dest) {
            dest = this;
        }
        dest.x *= value;
        dest.y *= value;
        return dest;
    };
    vec2.prototype.normalize = function (dest) {
        if (!dest) {
            dest = this;
        }
        var length = this.length();
        if (length === 1) {
            return this;
        }
        if (length === 0) {
            dest.x = 0;
            dest.y = 0;
            return dest;
        }
        length = 1.0 / length;
        dest.x *= length;
        dest.y *= length;
        return dest;
    };
    vec2.prototype.multiplyMat2 = function (matrix, dest) {
        if (!dest) {
            dest = this;
        }
        return matrix.multiplyVec2(this, dest);
    };
    vec2.prototype.multiplyMat3 = function (matrix, dest) {
        if (!dest) {
            dest = this;
        }
        return matrix.multiplyVec2(this, dest);
    };
    vec2.cross = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3_1.default();
        }
        var x = vector.x;
        var y = vector.y;
        var x2 = vector2.x;
        var y2 = vector2.y;
        var z = x * y2 - y * x2;
        dest.x = 0;
        dest.y = 0;
        dest.z = z;
        return dest;
    };
    vec2.dot = function (vector, vector2) {
        return vector.x * vector2.x + vector.y * vector2.y;
    };
    vec2.distance = function (vector, vector2) {
        return Math.sqrt(this.squaredDistance(vector, vector2));
    };
    vec2.squaredDistance = function (vector, vector2) {
        var x = vector2.x - vector.x;
        var y = vector2.y - vector.y;
        return x * x + y * y;
    };
    vec2.direction = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec2();
        }
        var x = vector.x - vector2.x;
        var y = vector.y - vector2.y;
        var length = Math.sqrt(x * x + y * y);
        if (length === 0) {
            dest.x = 0;
            dest.y = 0;
            return dest;
        }
        length = 1 / length;
        dest.x = x * length;
        dest.y = y * length;
        return dest;
    };
    vec2.mix = function (vector, vector2, time, dest) {
        if (!dest) {
            dest = new vec2();
        }
        var x = vector.x;
        var y = vector.y;
        var x2 = vector2.x;
        var y2 = vector2.y;
        dest.x = x + time * (x2 - x);
        dest.y = y + time * (y2 - y);
        return dest;
    };
    vec2.sum = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec2();
        }
        dest.x = vector.x + vector2.x;
        dest.y = vector.y + vector2.y;
        return dest;
    };
    vec2.difference = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec2();
        }
        dest.x = vector.x - vector2.x;
        dest.y = vector.y - vector2.y;
        return dest;
    };
    vec2.product = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec2();
        }
        dest.x = vector.x * vector2.x;
        dest.y = vector.y * vector2.y;
        return dest;
    };
    vec2.quotient = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec2();
        }
        dest.x = vector.x / vector2.x;
        dest.y = vector.y / vector2.y;
        return dest;
    };
    vec2.zero = new vec2([0, 0]);
    vec2.one = new vec2([1, 1]);
    return vec2;
}());
exports.default = vec2;

},{"./constants":4,"./vec3":9}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var quat_1 = require("./quat");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var vec3 = /** @class */ (function () {
    function vec3(values) {
        this.values = new Float32Array(3);
        if (values !== undefined) {
            this.xyz = values;
        }
    }
    Object.defineProperty(vec3.prototype, "x", {
        get: function () {
            return this.values[0];
        },
        set: function (value) {
            this.values[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec3.prototype, "y", {
        get: function () {
            return this.values[1];
        },
        set: function (value) {
            this.values[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec3.prototype, "z", {
        get: function () {
            return this.values[2];
        },
        set: function (value) {
            this.values[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec3.prototype, "xy", {
        get: function () {
            return [this.values[0], this.values[1]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec3.prototype, "xyz", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
        },
        enumerable: true,
        configurable: true
    });
    vec3.prototype.at = function (index) {
        return this.values[index];
    };
    vec3.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    };
    vec3.prototype.copy = function (dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = this.x;
        dest.y = this.y;
        dest.z = this.z;
        return dest;
    };
    vec3.prototype.negate = function (dest) {
        if (!dest) {
            dest = this;
        }
        dest.x = -this.x;
        dest.y = -this.y;
        dest.z = -this.z;
        return dest;
    };
    vec3.prototype.equals = function (vector, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        if (Math.abs(this.x - vector.x) > threshold) {
            return false;
        }
        if (Math.abs(this.y - vector.y) > threshold) {
            return false;
        }
        if (Math.abs(this.z - vector.z) > threshold) {
            return false;
        }
        return true;
    };
    vec3.prototype.length = function () {
        return Math.sqrt(this.squaredLength());
    };
    vec3.prototype.squaredLength = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        return x * x + y * y + z * z;
    };
    vec3.prototype.add = function (vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        return this;
    };
    vec3.prototype.subtract = function (vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
        return this;
    };
    vec3.prototype.multiply = function (vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        this.z *= vector.z;
        return this;
    };
    vec3.prototype.divide = function (vector) {
        this.x /= vector.x;
        this.y /= vector.y;
        this.z /= vector.z;
        return this;
    };
    vec3.prototype.scale = function (value, dest) {
        if (!dest) {
            dest = this;
        }
        dest.x *= value;
        dest.y *= value;
        dest.z *= value;
        return dest;
    };
    vec3.prototype.normalize = function (dest) {
        if (!dest) {
            dest = this;
        }
        var length = this.length();
        if (length === 1) {
            return this;
        }
        if (length === 0) {
            dest.x = 0;
            dest.y = 0;
            dest.z = 0;
            return dest;
        }
        length = 1.0 / length;
        dest.x *= length;
        dest.y *= length;
        dest.z *= length;
        return dest;
    };
    vec3.prototype.multiplyByMat3 = function (matrix, dest) {
        if (!dest) {
            dest = this;
        }
        return matrix.multiplyVec3(this, dest);
    };
    vec3.prototype.multiplyByQuat = function (quaternion, dest) {
        if (!dest) {
            dest = this;
        }
        return quaternion.multiplyVec3(this, dest);
    };
    vec3.prototype.toQuat = function (dest) {
        if (!dest) {
            dest = new quat_1.default();
        }
        var c = new vec3();
        var s = new vec3();
        c.x = Math.cos(this.x * 0.5);
        s.x = Math.sin(this.x * 0.5);
        c.y = Math.cos(this.y * 0.5);
        s.y = Math.sin(this.y * 0.5);
        c.z = Math.cos(this.z * 0.5);
        s.z = Math.sin(this.z * 0.5);
        dest.x = s.x * c.y * c.z - c.x * s.y * s.z;
        dest.y = c.x * s.y * c.z + s.x * c.y * s.z;
        dest.z = c.x * c.y * s.z - s.x * s.y * c.z;
        dest.w = c.x * c.y * c.z + s.x * s.y * s.z;
        return dest;
    };
    vec3.cross = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        var x2 = vector2.x;
        var y2 = vector2.y;
        var z2 = vector2.z;
        dest.x = y * z2 - z * y2;
        dest.y = z * x2 - x * z2;
        dest.z = x * y2 - y * x2;
        return dest;
    };
    vec3.dot = function (vector, vector2) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        var x2 = vector2.x;
        var y2 = vector2.y;
        var z2 = vector2.z;
        return x * x2 + y * y2 + z * z2;
    };
    vec3.distance = function (vector, vector2) {
        return Math.sqrt(this.squaredDistance(vector, vector2));
    };
    vec3.squaredDistance = function (vector, vector2) {
        var x = vector2.x - vector.x;
        var y = vector2.y - vector.y;
        var z = vector2.z - vector.z;
        return x * x + y * y + z * z;
    };
    vec3.direction = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        var x = vector.x - vector2.x;
        var y = vector.y - vector2.y;
        var z = vector.z - vector2.z;
        var length = Math.sqrt(x * x + y * y + z * z);
        if (length === 0) {
            dest.x = 0;
            dest.y = 0;
            dest.z = 0;
            return dest;
        }
        length = 1 / length;
        dest.x = x * length;
        dest.y = y * length;
        dest.z = z * length;
        return dest;
    };
    vec3.mix = function (vector, vector2, time, dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = vector.x + time * (vector2.x - vector.x);
        dest.y = vector.y + time * (vector2.y - vector.y);
        dest.z = vector.z + time * (vector2.z - vector.z);
        return dest;
    };
    vec3.sum = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = vector.x + vector2.x;
        dest.y = vector.y + vector2.y;
        dest.z = vector.z + vector2.z;
        return dest;
    };
    vec3.difference = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = vector.x - vector2.x;
        dest.y = vector.y - vector2.y;
        dest.z = vector.z - vector2.z;
        return dest;
    };
    vec3.product = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = vector.x * vector2.x;
        dest.y = vector.y * vector2.y;
        dest.z = vector.z * vector2.z;
        return dest;
    };
    vec3.quotient = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec3();
        }
        dest.x = vector.x / vector2.x;
        dest.y = vector.y / vector2.y;
        dest.z = vector.z / vector2.z;
        return dest;
    };
    vec3.zero = new vec3([0, 0, 0]);
    vec3.one = new vec3([1, 1, 1]);
    vec3.up = new vec3([0, 1, 0]);
    vec3.right = new vec3([1, 0, 0]);
    vec3.forward = new vec3([0, 0, 1]);
    return vec3;
}());
exports.default = vec3;

},{"./constants":4,"./quat":7}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/class-name-casing
var vec4 = /** @class */ (function () {
    function vec4(values) {
        this.values = new Float32Array(4);
        if (values !== undefined) {
            this.xyzw = values;
        }
    }
    Object.defineProperty(vec4.prototype, "x", {
        get: function () {
            return this.values[0];
        },
        set: function (value) {
            this.values[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "y", {
        get: function () {
            return this.values[1];
        },
        set: function (value) {
            this.values[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "z", {
        get: function () {
            return this.values[2];
        },
        set: function (value) {
            this.values[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "w", {
        get: function () {
            return this.values[3];
        },
        set: function (value) {
            this.values[3] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "xy", {
        get: function () {
            return [this.values[0], this.values[1]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "xyz", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "xyzw", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2], this.values[3]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
            this.values[3] = values[3];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "r", {
        get: function () {
            return this.values[0];
        },
        set: function (value) {
            this.values[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "g", {
        get: function () {
            return this.values[1];
        },
        set: function (value) {
            this.values[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "b", {
        get: function () {
            return this.values[2];
        },
        set: function (value) {
            this.values[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "a", {
        get: function () {
            return this.values[3];
        },
        set: function (value) {
            this.values[3] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "rg", {
        get: function () {
            return [this.values[0], this.values[1]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "rgb", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(vec4.prototype, "rgba", {
        get: function () {
            return [this.values[0], this.values[1], this.values[2], this.values[3]];
        },
        set: function (values) {
            this.values[0] = values[0];
            this.values[1] = values[1];
            this.values[2] = values[2];
            this.values[3] = values[3];
        },
        enumerable: true,
        configurable: true
    });
    vec4.prototype.at = function (index) {
        return this.values[index];
    };
    vec4.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    };
    vec4.prototype.copy = function (dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = this.x;
        dest.y = this.y;
        dest.z = this.z;
        dest.w = this.w;
        return dest;
    };
    vec4.prototype.negate = function (dest) {
        if (!dest) {
            dest = this;
        }
        dest.x = -this.x;
        dest.y = -this.y;
        dest.z = -this.z;
        dest.w = -this.w;
        return dest;
    };
    vec4.prototype.equals = function (vector, threshold) {
        if (threshold === void 0) { threshold = constants_1.epsilon; }
        if (Math.abs(this.x - vector.x) > threshold) {
            return false;
        }
        if (Math.abs(this.y - vector.y) > threshold) {
            return false;
        }
        if (Math.abs(this.z - vector.z) > threshold) {
            return false;
        }
        if (Math.abs(this.w - vector.w) > threshold) {
            return false;
        }
        return true;
    };
    vec4.prototype.length = function () {
        return Math.sqrt(this.squaredLength());
    };
    vec4.prototype.squaredLength = function () {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var w = this.w;
        return x * x + y * y + z * z + w * w;
    };
    vec4.prototype.add = function (vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        this.w += vector.w;
        return this;
    };
    vec4.prototype.subtract = function (vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
        this.w -= vector.w;
        return this;
    };
    vec4.prototype.multiply = function (vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        this.z *= vector.z;
        this.w *= vector.w;
        return this;
    };
    vec4.prototype.divide = function (vector) {
        this.x /= vector.x;
        this.y /= vector.y;
        this.z /= vector.z;
        this.w /= vector.w;
        return this;
    };
    vec4.prototype.scale = function (value, dest) {
        if (!dest) {
            dest = this;
        }
        dest.x *= value;
        dest.y *= value;
        dest.z *= value;
        dest.w *= value;
        return dest;
    };
    vec4.prototype.normalize = function (dest) {
        if (!dest) {
            dest = this;
        }
        var length = this.length();
        if (length === 1) {
            return this;
        }
        if (length === 0) {
            dest.x *= 0;
            dest.y *= 0;
            dest.z *= 0;
            dest.w *= 0;
            return dest;
        }
        length = 1.0 / length;
        dest.x *= length;
        dest.y *= length;
        dest.z *= length;
        dest.w *= length;
        return dest;
    };
    vec4.prototype.multiplyMat4 = function (matrix, dest) {
        if (!dest) {
            dest = this;
        }
        return matrix.multiplyVec4(this, dest);
    };
    vec4.mix = function (vector, vector2, time, dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = vector.x + time * (vector2.x - vector.x);
        dest.y = vector.y + time * (vector2.y - vector.y);
        dest.z = vector.z + time * (vector2.z - vector.z);
        dest.w = vector.w + time * (vector2.w - vector.w);
        return dest;
    };
    vec4.sum = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = vector.x + vector2.x;
        dest.y = vector.y + vector2.y;
        dest.z = vector.z + vector2.z;
        dest.w = vector.w + vector2.w;
        return dest;
    };
    vec4.difference = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = vector.x - vector2.x;
        dest.y = vector.y - vector2.y;
        dest.z = vector.z - vector2.z;
        dest.w = vector.w - vector2.w;
        return dest;
    };
    vec4.product = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = vector.x * vector2.x;
        dest.y = vector.y * vector2.y;
        dest.z = vector.z * vector2.z;
        dest.w = vector.w * vector2.w;
        return dest;
    };
    vec4.quotient = function (vector, vector2, dest) {
        if (!dest) {
            dest = new vec4();
        }
        dest.x = vector.x / vector2.x;
        dest.y = vector.y / vector2.y;
        dest.z = vector.z / vector2.z;
        dest.w = vector.w / vector2.w;
        return dest;
    };
    vec4.zero = new vec4([0, 0, 0, 1]);
    vec4.one = new vec4([1, 1, 1, 1]);
    return vec4;
}());
exports.default = vec4;

},{"./constants":4}],11:[function(require,module,exports){
"use strict";
/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */
/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th canvas.
 * @return {string} The html.
 */
var makeFailHTML = function (msg) {
    return ("" +
        '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
        '<td align="center">' +
        '<div style="display: table-cell; vertical-align: middle;">' +
        '<div style="">' +
        msg +
        "</div>" +
        "</div>" +
        "</td></tr></table>");
};
/**
 * Mesasge for getting a webgl browser
 */
var GET_A_WEBGL_BROWSER = "" +
    "This page requires a browser that supports WebGL.<br/>" +
    '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';
/**
 * Mesasge for need better hardware
 */
var OTHER_PROBLEM = "It doesn't appear your computer can support\nWebGL.<br/> <a href=\"http://get.webgl.org/troubleshooting/\">Click here for\nmore information.</a>";
/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context from. If one is not
 * passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
exports.create3DContext = function (canvas, optAttribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
        var n = names_1[_i];
        try {
            context = canvas.getContext(n, optAttribs);
        }
        catch (e) {
            console.error(e);
        }
        if (context !== null) {
            break;
        }
    }
    if (context === null) {
        throw new Error("Enable to create 3D context");
    }
    return context;
};
/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas The canvas element to create a context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any creation
 * attributes you want to pass in.
 * @return {WebGLRenderingContext} The created context.
 */
exports.setupWebGL = function (canvas, optAttribs) {
    var showLink = function (str) {
        var container = canvas.parentNode;
        if (container) {
            container.innerHTML = makeFailHTML(str);
        }
    };
    if (!window.WebGLRenderingContext) {
        showLink(GET_A_WEBGL_BROWSER);
    }
    var context = exports.create3DContext(canvas, optAttribs);
    if (!context) {
        showLink(OTHER_PROBLEM);
    }
    return context;
};

},{}],12:[function(require,module,exports){
"use strict";
/**
 * Joseph Petitti - CS 4731 Computer Graphics Project 1
 *
 * Extra credit features:
 *
 *   - Users are not only limited to red, green, blue, and black line colors.
 *     By using the color picker input to the bottom-right of the canvas, users
 *     can choose any valid HTML color and the drawing will be updated.
 *
 *   - Users can draw on existing .dat file images. By uploading a file and then
 *     clicking on the canvas the program will enter draw mode with the image on
 *     the canvas
 */
Object.defineProperty(exports, "__esModule", { value: true });
var webgl_utils_1 = require("./lib/webgl-utils");
var initShaders_1 = require("./lib/initShaders");
var fileMode_1 = require("./fileMode");
var mat4_1 = require("./lib/tsm/mat4");
var drawMode_1 = require("./drawMode");
/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten(arr) {
    var _a;
    return (_a = new Array()).concat.apply(_a, arr);
}
/**
 * converts a fractional color value to a 2-digit hex string
 * @param num a color value from 0 to 1
 */
var toHex = function (num) {
    var out = Math.floor(num * 255)
        .toString(16)
        .slice(0, 2);
    if (out.length < 2)
        out = "0" + out;
    return out;
};
/**
 * create a <canvas> element and add it to the #canvas-container
 * @return the created canvas
 */
var createCanvas = function () {
    var _a, _b;
    // remove any existing canvas
    (_a = document.getElementById("webgl")) === null || _a === void 0 ? void 0 : _a.remove();
    var canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.id = "webgl";
    (_b = document.getElementById("canvas-container")) === null || _b === void 0 ? void 0 : _b.appendChild(canvas);
    return canvas;
};
/**
 * resets the canvas size and WebGL viewport to default values, clears the
 * screen
 * @param canvas the canvas to clear
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 */
var clearCanvas = function (canvas, gl, program) {
    // set default view port and canvas size
    canvas.width = 640;
    canvas.height = 480;
    var projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    var projMatrix = mat4_1.default.orthographic(0, 640, 0, 480, -1.0, 1.0);
    gl.uniformMatrix4fv(projMatrixLoc, false, Float32Array.from(projMatrix.all()));
    gl.viewport(0, 0, 640, 480);
    // set clear color and clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
};
/**
 * sets canvas size and draws polylines
 * @param canvas the canvas element to draw on
 * @param gl the WebGL rendering context to draw on
 * @param program the WebGL program to use
 * @param polylines each element of this array is a polyline, made up of many
 * points expressed as vec4s
 * @param color the red, green, and blue components of the color to use for
 * drawing lines, each from 0-1
 * @param extents extents of the world as [left, top, right bottom]
 */
var drawPolylines = function (canvas, gl, program, polylines, color, extents) {
    if (color === void 0) { color = { r: 1, g: 1, b: 1 }; }
    if (extents === void 0) { extents = [0, 0.75, 1, 0]; }
    // clear the drawing canvas and color it white
    clearCanvas(canvas, gl, program);
    var projMatrix = mat4_1.default.orthographic(extents[0], extents[2], extents[3], extents[1], -1.0, 1.0);
    var projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projMatrixLoc, false, Float32Array.from(projMatrix.all()));
    var w = extents[2] - extents[0];
    var h = extents[1] - extents[3];
    if (w < h) {
        // image is taller than it is wide
        canvas.height = 480;
        canvas.width = (480 * w) / h;
    }
    else {
        // image is at least as wide as it is tall
        canvas.width = 640;
        canvas.height = (640 * h) / w;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // create new vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // pass vertex data to the buffer
    for (var _i = 0, polylines_1 = polylines; _i < polylines_1.length; _i++) {
        var vecs = polylines_1[_i];
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(flatten(vecs.map(function (p) { return p.xyzw; }))), gl.STATIC_DRAW);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.enableVertexAttribArray(vPosition);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        // pass color data to the buffer
        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var colorArray = new Array(vecs.length);
        colorArray.fill([color.r, color.g, color.b, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(flatten(colorArray)), gl.STATIC_DRAW);
        var vColor = gl.getAttribLocation(program, "vColor");
        gl.enableVertexAttribArray(vColor);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        // draw the lines
        gl.drawArrays(gl.LINE_STRIP, 0, vecs.length);
    }
};
function main() {
    // create the <canvas> element
    var canvas = createCanvas();
    // create the file upload input
    var fileInput = fileMode_1.createFileInput();
    // create the color picker input
    var colorInput = drawMode_1.createColorInput();
    // set up default variables
    var defaultColors = [
        { r: 0, g: 0, b: 0 },
        { r: 1, g: 0, b: 0 },
        { r: 0, g: 1, b: 0 },
        { r: 0, g: 0, b: 1 } // blue
    ];
    var colorIndex = 0;
    var currentColor = defaultColors[colorIndex];
    var extents = [0, 0.75, 1, 0];
    var polylines = [];
    var bDown = false;
    var justDrewFile = false;
    // get the rendering context for WebGL
    var gl = webgl_utils_1.setupWebGL(canvas);
    if (gl === null) {
        console.error("Failed to get the rendering context for WebGL");
        return;
    }
    // initialize viewport and line width
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.lineWidth(2);
    // initialize shaders
    var program = initShaders_1.initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    // clear the drawing canvas and color it white
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    clearCanvas(canvas, gl, program);
    // listen for various key presses that we care about
    document.addEventListener("keydown", function (ev) {
        var m;
        switch (ev.key) {
            case "f": // enter file mode
                polylines = [];
                extents = [0, 0.75, 1, 0];
                m = document.getElementById("mode");
                if (m !== null)
                    m.innerText = "File Mode";
                clearCanvas(canvas, gl, program);
                break;
            case "d": // enter draw mode
                polylines = [];
                extents = [0, 0.75, 1, 0];
                m = document.getElementById("mode");
                if (m !== null)
                    m.innerText = "Draw Mode";
                clearCanvas(canvas, gl, program);
                break;
            case "c": // toggle colors
                colorIndex = (colorIndex + 1) % defaultColors.length;
                currentColor = defaultColors[colorIndex];
                // update color picker
                colorInput.value =
                    "#" +
                        toHex(currentColor.r) +
                        toHex(currentColor.g) +
                        toHex(currentColor.b);
                drawPolylines(canvas, gl, program, polylines, currentColor, extents);
                break;
            case "b": // track when B is held/released
                bDown = true;
                break;
        }
    });
    // listen for the B key being released
    document.addEventListener("keyup", function (ev) {
        if (ev.key === "b")
            bDown = false;
    });
    // handle a file being uploaded
    fileInput.addEventListener("change", function () {
        var m = document.getElementById("mode");
        if (m !== null)
            m.innerText = "File Mode";
        fileMode_1.getInput(fileInput)
            .then(fileMode_1.parseFileText)
            .then(function (args) {
            extents = args.extents;
            polylines = args.polylines;
            drawPolylines(canvas, gl, program, polylines, currentColor, extents);
        })
            .catch(function (err) {
            console.error(err);
        });
        justDrewFile = true; // start a new line the next time the user clicks
    });
    // handle mouse clicks on the canvas
    canvas.addEventListener("mousedown", function (ev) {
        var m = document.getElementById("mode");
        if (m !== null)
            m.innerText = "Draw Mode";
        // translate the click location to its relative position on the canvas
        var rect = canvas.getBoundingClientRect();
        var mx = (ev.clientX - rect.left) / canvas.width;
        var my = (canvas.height - (ev.clientY - rect.top)) / canvas.height;
        mx = mx * (extents[2] - extents[0]) + extents[0];
        my = my * (extents[1] - extents[3]) + extents[3];
        polylines = drawMode_1.handleClick(mx, my, polylines, bDown || justDrewFile);
        drawPolylines(canvas, gl, program, polylines, currentColor, extents);
        justDrewFile = false;
    });
    // change the draw color when the color picker changes
    colorInput.addEventListener("change", function () {
        console.log(colorInput.value);
        currentColor = {
            r: parseInt(colorInput.value.slice(1, 3), 16) / 255,
            g: parseInt(colorInput.value.slice(3, 5), 16) / 255,
            b: parseInt(colorInput.value.slice(5, 7), 16) / 255
        };
        drawPolylines(canvas, gl, program, polylines, currentColor, extents);
    });
}
window.onload = main;

},{"./drawMode":1,"./fileMode":2,"./lib/initShaders":3,"./lib/tsm/mat4":6,"./lib/webgl-utils":11}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9wcm9qZWN0MS9kcmF3TW9kZS5qcyIsImJ1aWxkL3Byb2plY3QxL2ZpbGVNb2RlLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL2luaXRTaGFkZXJzLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS9jb25zdGFudHMuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL21hdDMuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL21hdDQuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL3F1YXQuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL3ZlYzIuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL3ZlYzMuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvdHNtL3ZlYzQuanMiLCJidWlsZC9wcm9qZWN0MS9saWIvd2ViZ2wtdXRpbHMuanMiLCJidWlsZC9wcm9qZWN0MS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMza0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWM0XzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzRcIik7XG4vKipcbiAqIGNyZWF0ZSBhbiA8aW5wdXQgdHlwZT1cImNvbG9yXCI+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byAjaW5wdXQtY29udGFpbmVyXG4gKiBAcmV0dXJuIHRlaCBjcmVhdGVkIGlucHV0IGVsZW1lbnRcbiAqL1xuZXhwb3J0cy5jcmVhdGVDb2xvcklucHV0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgLy8gcmVtb3ZlIGFueSBleGlzdGluZyBpbnB1dFxuICAgIChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3ItcGlja2VyLWNvbnRhaW5lclwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC50eXBlID0gXCJjb2xvclwiO1xuICAgIGlucHV0LmlkID0gXCJjb2xvci1waWNrZXJcIjtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHNwYW4uaWQgPSBcImNvbG9yLXBpY2tlci1jb250YWluZXJcIjtcbiAgICBzcGFuLmlubmVyVGV4dCA9IFwiTGluZSBjb2xvcjogXCI7XG4gICAgc3Bhbi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnB1dC1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICByZXR1cm4gaW5wdXQ7XG59O1xuLyoqXG4gKiBIYW5kbGVzIGEgbW91c2UgY2xpY2sgb24gdGhlIGNhbnZhcyBpbiBkcmF3IG1vZGUuXG4gKiBAcGFyYW0geCB0aGUgeC1jb29yZGluYXRlIG9mIHRoZSBjbGljayByZWxhdGl2ZSB0byB0aGUgY2FudmFzXG4gKiBAcGFyYW0geSB0aGUgeS1jb29yZGluYXRlIG9mIHRoZSBjbGljayByZWxhdGl2ZSB0byB0aGUgY2FudmFzXG4gKiBAcGFyYW0gcG9seWxpbmVzIHRoZSBjdXJyZW50IGxpc3Qgb2YgcG9seWxpbmVzXG4gKiBAcGFyYW0gbmV3bGluZSB3aGV0aGVyIG9yIG5vdCB0byBzdGFydCBhIG5ldyBsaW5lIHdpdGggdGhpcyBjbGlja1xuICogQHJldHVybiB0aGUgbmV3IGxpc3Qgb2YgcG9seWxpbmVzIGFmdGVyIHRoZSBjbGljayBoYXMgYmVlbiBkZWFsdCB3aXRoXG4gKi9cbmV4cG9ydHMuaGFuZGxlQ2xpY2sgPSBmdW5jdGlvbiAoeCwgeSwgcG9seWxpbmVzLCBuZXdsaW5lKSB7XG4gICAgaWYgKG5ld2xpbmUgPT09IHZvaWQgMCkgeyBuZXdsaW5lID0gZmFsc2U7IH1cbiAgICBpZiAocG9seWxpbmVzLmxlbmd0aCA8IDEgfHxcbiAgICAgICAgcG9seWxpbmVzW3BvbHlsaW5lcy5sZW5ndGggLSAxXS5sZW5ndGggPj0gMTAwIHx8XG4gICAgICAgIG5ld2xpbmUpIHtcbiAgICAgICAgLy8gbmVlZCB0byBzdGFydCBhIG5ldyBsaW5lXG4gICAgICAgIHBvbHlsaW5lcy5wdXNoKG5ldyBBcnJheSgpKTtcbiAgICB9XG4gICAgLy8gYWRkIHRoaXMgcG9pbnQgdG8gdGhlIGxhc3QgcG9seWxpbmVcbiAgICBwb2x5bGluZXNbcG9seWxpbmVzLmxlbmd0aCAtIDFdLnB1c2gobmV3IHZlYzRfMS5kZWZhdWx0KFt4LCB5LCAwLjAsIDEuMF0pKTtcbiAgICByZXR1cm4gcG9seWxpbmVzO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRyYXdNb2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fc3ByZWFkQXJyYXlzID0gKHRoaXMgJiYgdGhpcy5fX3NwcmVhZEFycmF5cykgfHwgZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcbiAgICByZXR1cm4gcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjNF8xID0gcmVxdWlyZShcIi4vbGliL3RzbS92ZWM0XCIpO1xuLyoqXG4gKiBjcmVhdGUgYW4gPGlucHV0IHR5cGU9XCJmaWxlXCI+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byAjaW5wdXQtY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGlucHV0IGVsZW1lbnRcbiAqL1xuZXhwb3J0cy5jcmVhdGVGaWxlSW5wdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICAvLyByZW1vdmUgYW55IGV4aXN0aW5nIGlucHV0XG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWxlLXVwbG9hZFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgaW5wdXQuaWQgPSBcImZpbGUtdXBsb2FkXCI7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnB1dC1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0O1xufTtcbi8qKlxuICogYXN5bmNocm9ub3VzbHkgcmVhZHMgdGV4dCBmcm9tIGEgZmlsZSBpbnB1dCBlbGVtZW50LCBhbmQgcmV0dXJucyBpdCBhcyBhXG4gKiBwcm9taXNlXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBjb250YWluaW5lZCB0aGUgY29udGVudHMgb2YgdGhlIGZpcnN0IGZpbGUgaW4gdGhlIGVsZW1lbnQsXG4gKiBvciB1bmRlZmluZWQgaWYgaXQgY2FuJ3QgYmUgcmVhZFxuICovXG5leHBvcnRzLmdldElucHV0ID0gZnVuY3Rpb24gKGVsdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChlbHQuZmlsZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlamVjdChcImVsdCBjb250YWlucyBubyBmaWxlc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmlsZSA9IGVsdC5maWxlc1swXTtcbiAgICAgICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgXCJVVEYtOFwiKTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIHJlc29sdmUoKF9hID0gZXYudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBlcnJvclwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBhYm9ydGVkXCIpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbi8qKlxuICogcGFyc2VzIHRoZSB0ZXh0IG9mIGFuIGlucHV0IGZpbGUgYW5kIHJldHVybnMgdGhlIGRpbWVuc2lvbnMgYW5kIHBvbHlsaW5lcyBvZlxuICogdGhlIGZpZ3VyZSBpbiBhIHByb21pc2VcbiAqIEBwYXJhbSBzdHIgdGhlIGlucHV0IGZpbGUncyB0ZXh0IGFzIGEgc3RyaW5nXG4gKi9cbmV4cG9ydHMucGFyc2VGaWxlVGV4dCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcyAhPT0gXCJcIjsgfSk7XG4gICAgICAgIC8vIHN0cmluZyBjYW4gc3RhcnQgY29tbWVudCBudW1iZXIgb2YgbGluZXMgZm9sbG93ZWQgYnkgYSByb3cgb2YgYXN0ZXJpc2tzXG4gICAgICAgIHZhciBzdGFydCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChsaW5lc1tpXS5zdWJzdHJpbmcoMCwgMSkgPT09IFwiKlwiKSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZXh0ZW50cyA9IG5ldyBBcnJheSgpO1xuICAgICAgICAvLyBmaXJzdCBsaW5lIGFmdGVyIHRoZSBhc3Rlcmlza3MgY29udGFpbnMgdGhlIGV4dGVudHMgb2YgdGhlIGZpZ3VyZVxuICAgICAgICBpZiAoc3RhcnQgIT09IDApIHtcbiAgICAgICAgICAgIGV4dGVudHMgPSBsaW5lc1tzdGFydF1cbiAgICAgICAgICAgICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgICAgICAgICAgIC5tYXAocGFyc2VGbG9hdClcbiAgICAgICAgICAgICAgICAuc2xpY2UoMCwgNCk7XG4gICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5leHQgbGluZSBhZnRlciB0aGF0IGlzIHRoZSBsaXN0IG9mIHBvbHlsaW5lcyBpbiB0aGUgZmlndXJlXG4gICAgICAgIHZhciBudW1Qb2x5bGluZXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobGluZXNbc3RhcnRdKSk7XG4gICAgICAgIHN0YXJ0Kys7XG4gICAgICAgIGlmIChpc05hTihudW1Qb2x5bGluZXMpIHx8IG51bVBvbHlsaW5lcyA8IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcnNlIGVycm9yOiBpbnZhbGlkIG51bWJlciBvZiBwb2x5bGluZXNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvbHlsaW5lcyA9IG5ldyBBcnJheShudW1Qb2x5bGluZXMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVBvbHlsaW5lczsgKytpKSB7XG4gICAgICAgICAgICBwb2x5bGluZXNbaV0gPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbnVtUG9pbnRzID0gMDtcbiAgICAgICAgdmFyIHAgPSAtMTsgLy8gcG9seWxpbmUgaW5kZXhcbiAgICAgICAgdmFyIG1pblggPSBJbmZpbml0eTtcbiAgICAgICAgdmFyIG1pblkgPSBJbmZpbml0eTtcbiAgICAgICAgdmFyIG1heFggPSAtSW5maW5pdHk7XG4gICAgICAgIHZhciBtYXhZID0gLUluZmluaXR5O1xuICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IHN0YXJ0IDwgbGluZXMubGVuZ3RoICYmIHAgPCBudW1Qb2x5bGluZXM7ICsraSkge1xuICAgICAgICAgICAgaWYgKG51bVBvaW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIHJlYWRpbmcgbnVtYmVyIG9mIHBvaW50cyBpbiB0aGlzIHBvbHlsaW5lXG4gICAgICAgICAgICAgICAgbnVtUG9pbnRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGxpbmVzW2ldKSk7XG4gICAgICAgICAgICAgICAgcCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmVhZGluZyBhIHBvaW50XG4gICAgICAgICAgICAgICAgdmFyIHYgPSBuZXcgdmVjNF8xLmRlZmF1bHQoX19zcHJlYWRBcnJheXMobGluZXNbaV1cbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgICAgICAgICAgICAgICAgLm1hcChwYXJzZUZsb2F0KVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChuKSB7IHJldHVybiAhaXNOYU4obik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCAyKSwgW1xuICAgICAgICAgICAgICAgICAgICAwLjAsXG4gICAgICAgICAgICAgICAgICAgIDEuMFxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgICBpZiAodi54IDwgbWluWClcbiAgICAgICAgICAgICAgICAgICAgbWluWCA9IHYueDtcbiAgICAgICAgICAgICAgICBpZiAodi55IDwgbWluWSlcbiAgICAgICAgICAgICAgICAgICAgbWluWSA9IHYueTtcbiAgICAgICAgICAgICAgICBpZiAodi54ID4gbWF4WClcbiAgICAgICAgICAgICAgICAgICAgbWF4WCA9IHYueDtcbiAgICAgICAgICAgICAgICBpZiAodi55ID4gbWF4WSlcbiAgICAgICAgICAgICAgICAgICAgbWF4WSA9IHYueTtcbiAgICAgICAgICAgICAgICBwb2x5bGluZXNbcF0ucHVzaCh2KTtcbiAgICAgICAgICAgICAgICBudW1Qb2ludHMtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0ZW50cy5sZW5ndGggPCA0KSB7XG4gICAgICAgICAgICBleHRlbnRzID0gW21pblgsIG1heFksIG1heFgsIG1pblldO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgZXh0ZW50czogZXh0ZW50cyxcbiAgICAgICAgICAgIHBvbHlsaW5lczogcG9seWxpbmVzXG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZpbGVNb2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLy9cbi8vICBpbml0U2hhZGVycy5qc1xuLy9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuaW5pdFNoYWRlcnMgPSBmdW5jdGlvbiAoZ2wsIHZlcnRleFNoYWRlcklkLCBmcmFnbWVudFNoYWRlcklkKSB7XG4gICAgdmFyIHZlcnRFbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodmVydGV4U2hhZGVySWQpO1xuICAgIGlmICh2ZXJ0RWxlbSA9PT0gbnVsbCB8fCB2ZXJ0RWxlbS50ZXh0Q29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gbG9hZCB2ZXJ0ZXggc2hhZGVyIFwiICsgdmVydGV4U2hhZGVySWQpO1xuICAgIH1cbiAgICB2YXIgdmVydFNoZHIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgaWYgKHZlcnRTaGRyID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBjcmVhdGUgdmVydGV4IHNoYWRlciBcIiArIHZlcnRleFNoYWRlcklkKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHZlcnRTaGRyLCB2ZXJ0RWxlbS50ZXh0Q29udGVudCk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcih2ZXJ0U2hkcik7XG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodmVydFNoZHIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJWZXJ0ZXggc2hhZGVyIGZhaWxlZCB0byBjb21waWxlLiAgVGhlIGVycm9yIGxvZyBpczpcIiArXG4gICAgICAgICAgICBcIjxwcmU+XCIgK1xuICAgICAgICAgICAgZ2wuZ2V0U2hhZGVySW5mb0xvZyh2ZXJ0U2hkcikgK1xuICAgICAgICAgICAgXCI8L3ByZT5cIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxuICAgIHZhciBmcmFnRWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZyYWdtZW50U2hhZGVySWQpO1xuICAgIGlmIChmcmFnRWxlbSA9PT0gbnVsbCB8fCBmcmFnRWxlbS50ZXh0Q29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gbG9hZCB2ZXJ0ZXggc2hhZGVyIFwiICsgZnJhZ21lbnRTaGFkZXJJZCk7XG4gICAgfVxuICAgIHZhciBmcmFnU2hkciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgIGlmIChmcmFnU2hkciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY3JlYXRlIHZlcnRleCBzaGFkZXIgXCIgKyBmcmFnbWVudFNoYWRlcklkKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKGZyYWdTaGRyLCBmcmFnRWxlbS50ZXh0Q29udGVudCk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihmcmFnU2hkcik7XG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoZnJhZ1NoZHIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJGcmFnbWVudCBzaGFkZXIgZmFpbGVkIHRvIGNvbXBpbGUuICBUaGUgZXJyb3IgbG9nIGlzOlwiICtcbiAgICAgICAgICAgIFwiPHByZT5cIiArXG4gICAgICAgICAgICBnbC5nZXRTaGFkZXJJbmZvTG9nKGZyYWdTaGRyKSArXG4gICAgICAgICAgICBcIjwvcHJlPlwiO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG4gICAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgaWYgKHByb2dyYW0gPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNyZWF0ZSBwcm9ncmFtXCIpO1xuICAgIH1cbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydFNoZHIpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnU2hkcik7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJTaGFkZXIgcHJvZ3JhbSBmYWlsZWQgdG8gbGluay4gIFRoZSBlcnJvciBsb2cgaXM6XCIgK1xuICAgICAgICAgICAgXCI8cHJlPlwiICtcbiAgICAgICAgICAgIGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pICtcbiAgICAgICAgICAgIFwiPC9wcmU+XCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvZ3JhbTtcbn07XG4vKlxuLy8gR2V0IGEgZmlsZSBhcyBhIHN0cmluZyB1c2luZyAgQUpBWFxuZnVuY3Rpb24gbG9hZEZpbGVBSkFYKG5hbWUpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICAgIG9rU3RhdHVzID0gZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09IFwiZmlsZTpcIiA/IDAgOiAyMDA7XG4gICAgeGhyLm9wZW4oJ0dFVCcsIG5hbWUsIGZhbHNlKTtcbiAgICB4aHIuc2VuZChudWxsKTtcbiAgICByZXR1cm4geGhyLnN0YXR1cyA9PSBva1N0YXR1cyA/IHhoci5yZXNwb25zZVRleHQgOiBudWxsO1xufTtcblxuXG5mdW5jdGlvbiBpbml0U2hhZGVyc0Zyb21GaWxlcyhnbCwgdlNoYWRlck5hbWUsIGZTaGFkZXJOYW1lKSB7XG4gICAgZnVuY3Rpb24gZ2V0U2hhZGVyKGdsLCBzaGFkZXJOYW1lLCB0eXBlKSB7XG4gICAgICAgIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSksXG4gICAgICAgICAgICBzaGFkZXJTY3JpcHQgPSBsb2FkRmlsZUFKQVgoc2hhZGVyTmFtZSk7XG4gICAgICAgIGlmICghc2hhZGVyU2NyaXB0KSB7XG4gICAgICAgICAgICBhbGVydChcIkNvdWxkIG5vdCBmaW5kIHNoYWRlciBzb3VyY2U6IFwiK3NoYWRlck5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNoYWRlclNjcmlwdCk7XG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcblxuICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgYWxlcnQoZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgfVxuICAgIHZhciB2ZXJ0ZXhTaGFkZXIgPSBnZXRTaGFkZXIoZ2wsIHZTaGFkZXJOYW1lLCBnbC5WRVJURVhfU0hBREVSKSxcbiAgICAgICAgZnJhZ21lbnRTaGFkZXIgPSBnZXRTaGFkZXIoZ2wsIGZTaGFkZXJOYW1lLCBnbC5GUkFHTUVOVF9TSEFERVIpLFxuICAgICAgICBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZyYWdtZW50U2hhZGVyKTtcbiAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcblxuICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgYWxlcnQoXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBcbiAgICByZXR1cm4gcHJvZ3JhbTtcbn07XG4qL1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5pdFNoYWRlcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmVwc2lsb24gPSAwLjAwMDAxO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uc3RhbnRzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5ICovXG52YXIgbWF0NF8xID0gcmVxdWlyZShcIi4vbWF0NFwiKTtcbnZhciBxdWF0XzEgPSByZXF1aXJlKFwiLi9xdWF0XCIpO1xudmFyIHZlYzJfMSA9IHJlcXVpcmUoXCIuL3ZlYzJcIik7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBtYXQzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hdDModmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSg5KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQodmFsdWVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtYXQzLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0MygpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICBkZXN0LnZhbHVlc1tpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgZGF0YVtpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUucm93ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDMgKyAwXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogMyArIDFdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiAzICsgMl1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmNvbCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzW2luZGV4XSwgdGhpcy52YWx1ZXNbaW5kZXggKyAzXSwgdGhpcy52YWx1ZXNbaW5kZXggKyA2XV07XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAobWF0cml4LCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnZhbHVlc1tpXSAtIG1hdHJpeC5hdChpKSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHJldHVybiBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZW1wMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIHRlbXAwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgdGVtcDEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gdGVtcDAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IHRlbXAwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSB0ZW1wMTI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHZhciBkZXQgPSBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gZGV0MDEgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGRldDExICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9ICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBkZXQyMSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAobWF0cml4KSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBiMDAgPSBtYXRyaXguYXQoMCk7XG4gICAgICAgIHZhciBiMDEgPSBtYXRyaXguYXQoMSk7XG4gICAgICAgIHZhciBiMDIgPSBtYXRyaXguYXQoMik7XG4gICAgICAgIHZhciBiMTAgPSBtYXRyaXguYXQoMyk7XG4gICAgICAgIHZhciBiMTEgPSBtYXRyaXguYXQoNCk7XG4gICAgICAgIHZhciBiMTIgPSBtYXRyaXguYXQoNSk7XG4gICAgICAgIHZhciBiMjAgPSBtYXRyaXguYXQoNik7XG4gICAgICAgIHZhciBiMjEgPSBtYXRyaXguYXQoNyk7XG4gICAgICAgIHZhciBiMjIgPSBtYXRyaXguYXQoOCk7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUubXVsdGlwbHlWZWMyID0gZnVuY3Rpb24gKHZlY3RvciwgcmVzdWx0KSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC54eSA9IFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB0aGlzLnZhbHVlc1s3XVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHZlYzJfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB0aGlzLnZhbHVlc1s3XVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLm11bHRpcGx5VmVjMyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHJlc3VsdCkge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQueHl6ID0gW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHogKiB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB6ICogdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzJdICsgeSAqIHRoaXMudmFsdWVzWzVdICsgeiAqIHRoaXMudmFsdWVzWzhdXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHogKiB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB6ICogdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzJdICsgeSAqIHRoaXMudmFsdWVzWzVdICsgeiAqIHRoaXMudmFsdWVzWzhdXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUudG9NYXQ0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQuaW5pdChbXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1szXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtYXQ0XzEuZGVmYXVsdChbXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1szXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnRvUXVhdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0wMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgbTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBtMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIG0xMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgbTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBtMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIG0yMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgbTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBtMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGZvdXJYU3F1YXJlZE1pbnVzMSA9IG0wMCAtIG0xMSAtIG0yMjtcbiAgICAgICAgdmFyIGZvdXJZU3F1YXJlZE1pbnVzMSA9IG0xMSAtIG0wMCAtIG0yMjtcbiAgICAgICAgdmFyIGZvdXJaU3F1YXJlZE1pbnVzMSA9IG0yMiAtIG0wMCAtIG0xMTtcbiAgICAgICAgdmFyIGZvdXJXU3F1YXJlZE1pbnVzMSA9IG0wMCArIG0xMSArIG0yMjtcbiAgICAgICAgdmFyIGJpZ2dlc3RJbmRleCA9IDA7XG4gICAgICAgIHZhciBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyV1NxdWFyZWRNaW51czE7XG4gICAgICAgIGlmIChmb3VyWFNxdWFyZWRNaW51czEgPiBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEpIHtcbiAgICAgICAgICAgIGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSA9IGZvdXJYU3F1YXJlZE1pbnVzMTtcbiAgICAgICAgICAgIGJpZ2dlc3RJbmRleCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdXJZU3F1YXJlZE1pbnVzMSA+IGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSkge1xuICAgICAgICAgICAgZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxID0gZm91cllTcXVhcmVkTWludXMxO1xuICAgICAgICAgICAgYmlnZ2VzdEluZGV4ID0gMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91clpTcXVhcmVkTWludXMxID4gZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxKSB7XG4gICAgICAgICAgICBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyWlNxdWFyZWRNaW51czE7XG4gICAgICAgICAgICBiaWdnZXN0SW5kZXggPSAzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiaWdnZXN0VmFsID0gTWF0aC5zcXJ0KGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSArIDEpICogMC41O1xuICAgICAgICB2YXIgbXVsdCA9IDAuMjUgLyBiaWdnZXN0VmFsO1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IHF1YXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIHN3aXRjaCAoYmlnZ2VzdEluZGV4KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gKG0xMiAtIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gKG0yMCAtIG0wMikgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gKG0wMSAtIG0xMCkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ID0gKG0xMiAtIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gYmlnZ2VzdFZhbDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IChtMDEgKyBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueiA9IChtMjAgKyBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICByZXN1bHQudyA9IChtMjAgLSBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueCA9IChtMDEgKyBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IGJpZ2dlc3RWYWw7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSAobTEyICsgbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSAobTAxIC0gbTEwKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnggPSAobTIwICsgbTAyKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAobTEyICsgbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUsIGF4aXMpIHtcbiAgICAgICAgdmFyIHggPSBheGlzLng7XG4gICAgICAgIHZhciB5ID0gYXhpcy55O1xuICAgICAgICB2YXIgeiA9IGF4aXMuejtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgICAgIHggKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeSAqPSBsZW5ndGg7XG4gICAgICAgICAgICB6ICo9IGxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciB0ID0gMS4wIC0gYztcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBiMDAgPSB4ICogeCAqIHQgKyBjO1xuICAgICAgICB2YXIgYjAxID0geSAqIHggKiB0ICsgeiAqIHM7XG4gICAgICAgIHZhciBiMDIgPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICAgICAgdmFyIGIxMCA9IHggKiB5ICogdCAtIHogKiBzO1xuICAgICAgICB2YXIgYjExID0geSAqIHkgKiB0ICsgYztcbiAgICAgICAgdmFyIGIxMiA9IHogKiB5ICogdCArIHggKiBzO1xuICAgICAgICB2YXIgYjIwID0geCAqIHogKiB0ICsgeSAqIHM7XG4gICAgICAgIHZhciBiMjEgPSB5ICogeiAqIHQgLSB4ICogcztcbiAgICAgICAgdmFyIGIyMiA9IHogKiB6ICogdCArIGM7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYTAwICogYjEwICsgYTEwICogYjExICsgYTIwICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGEwMSAqIGIxMCArIGExMSAqIGIxMSArIGEyMSAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBhMDIgKiBiMTAgKyBhMTIgKiBiMTEgKyBhMjIgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYTAwICogYjIwICsgYTEwICogYjIxICsgYTIwICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGEwMSAqIGIyMCArIGExMSAqIGIyMSArIGEyMSAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm9kdWN0ID0gZnVuY3Rpb24gKG0xLCBtMiwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBhMDAgPSBtMS5hdCgwKTtcbiAgICAgICAgdmFyIGEwMSA9IG0xLmF0KDEpO1xuICAgICAgICB2YXIgYTAyID0gbTEuYXQoMik7XG4gICAgICAgIHZhciBhMTAgPSBtMS5hdCgzKTtcbiAgICAgICAgdmFyIGExMSA9IG0xLmF0KDQpO1xuICAgICAgICB2YXIgYTEyID0gbTEuYXQoNSk7XG4gICAgICAgIHZhciBhMjAgPSBtMS5hdCg2KTtcbiAgICAgICAgdmFyIGEyMSA9IG0xLmF0KDcpO1xuICAgICAgICB2YXIgYTIyID0gbTEuYXQoOCk7XG4gICAgICAgIHZhciBiMDAgPSBtMi5hdCgwKTtcbiAgICAgICAgdmFyIGIwMSA9IG0yLmF0KDEpO1xuICAgICAgICB2YXIgYjAyID0gbTIuYXQoMik7XG4gICAgICAgIHZhciBiMTAgPSBtMi5hdCgzKTtcbiAgICAgICAgdmFyIGIxMSA9IG0yLmF0KDQpO1xuICAgICAgICB2YXIgYjEyID0gbTIuYXQoNSk7XG4gICAgICAgIHZhciBiMjAgPSBtMi5hdCg2KTtcbiAgICAgICAgdmFyIGIyMSA9IG0yLmF0KDcpO1xuICAgICAgICB2YXIgYjIyID0gbTIuYXQoOCk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pbml0KFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMlxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtYXQzKFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMlxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMuaWRlbnRpdHkgPSBuZXcgbWF0MygpLnNldElkZW50aXR5KCk7XG4gICAgcmV0dXJuIG1hdDM7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gbWF0Mztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdDMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHkgKi9cbnZhciBtYXQzXzEgPSByZXF1aXJlKFwiLi9tYXQzXCIpO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL3ZlYzNcIik7XG52YXIgdmVjNF8xID0gcmVxdWlyZShcIi4vdmVjNFwiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBtYXQ0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hdDQodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pbml0KHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbWF0NC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSB2YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0NCgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgZGVzdC52YWx1ZXNbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5yb3cgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDBdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiA0ICsgMV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDQgKyAyXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDNdXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5jb2wgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICsgNF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCArIDhdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKyAxMl1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChtYXRyaXgsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnZhbHVlc1tpXSAtIG1hdHJpeC5hdChpKSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgZGV0MDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMDtcbiAgICAgICAgdmFyIGRldDAyID0gYTAwICogYTEzIC0gYTAzICogYTEwO1xuICAgICAgICB2YXIgZGV0MDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMTtcbiAgICAgICAgdmFyIGRldDA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyO1xuICAgICAgICB2YXIgZGV0MDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwO1xuICAgICAgICB2YXIgZGV0MDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMTtcbiAgICAgICAgdmFyIGRldDExID0gYTIyICogYTMzIC0gYTIzICogYTMyO1xuICAgICAgICByZXR1cm4gKGRldDAwICogZGV0MTEgLVxuICAgICAgICAgICAgZGV0MDEgKiBkZXQxMCArXG4gICAgICAgICAgICBkZXQwMiAqIGRldDA5ICtcbiAgICAgICAgICAgIGRldDAzICogZGV0MDggLVxuICAgICAgICAgICAgZGV0MDQgKiBkZXQwNyArXG4gICAgICAgICAgICBkZXQwNSAqIGRldDA2KTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnNldElkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzE1XSA9IDE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGVtcDAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciB0ZW1wMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIHRlbXAwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgdGVtcDEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciB0ZW1wMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIHRlbXAyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB0aGlzLnZhbHVlc1sxMl07XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gdGVtcDAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IHRoaXMudmFsdWVzWzEzXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSB0ZW1wMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gdGVtcDEyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSB0aGlzLnZhbHVlc1sxNF07XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9IHRlbXAwMztcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdID0gdGVtcDEzO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSB0ZW1wMjM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgZGV0MDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMDtcbiAgICAgICAgdmFyIGRldDAyID0gYTAwICogYTEzIC0gYTAzICogYTEwO1xuICAgICAgICB2YXIgZGV0MDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMTtcbiAgICAgICAgdmFyIGRldDA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyO1xuICAgICAgICB2YXIgZGV0MDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwO1xuICAgICAgICB2YXIgZGV0MDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMTtcbiAgICAgICAgdmFyIGRldDExID0gYTIyICogYTMzIC0gYTIzICogYTMyO1xuICAgICAgICB2YXIgZGV0ID0gZGV0MDAgKiBkZXQxMSAtXG4gICAgICAgICAgICBkZXQwMSAqIGRldDEwICtcbiAgICAgICAgICAgIGRldDAyICogZGV0MDkgK1xuICAgICAgICAgICAgZGV0MDMgKiBkZXQwOCAtXG4gICAgICAgICAgICBkZXQwNCAqIGRldDA3ICtcbiAgICAgICAgICAgIGRldDA1ICogZGV0MDY7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gKGExMSAqIGRldDExIC0gYTEyICogZGV0MTAgKyBhMTMgKiBkZXQwOSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gKC1hMDEgKiBkZXQxMSArIGEwMiAqIGRldDEwIC0gYTAzICogZGV0MDkpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IChhMzEgKiBkZXQwNSAtIGEzMiAqIGRldDA0ICsgYTMzICogZGV0MDMpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9ICgtYTIxICogZGV0MDUgKyBhMjIgKiBkZXQwNCAtIGEyMyAqIGRldDAzKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSAoLWExMCAqIGRldDExICsgYTEyICogZGV0MDggLSBhMTMgKiBkZXQwNykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gKGEwMCAqIGRldDExIC0gYTAyICogZGV0MDggKyBhMDMgKiBkZXQwNykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gKC1hMzAgKiBkZXQwNSArIGEzMiAqIGRldDAyIC0gYTMzICogZGV0MDEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IChhMjAgKiBkZXQwNSAtIGEyMiAqIGRldDAyICsgYTIzICogZGV0MDEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IChhMTAgKiBkZXQxMCAtIGExMSAqIGRldDA4ICsgYTEzICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9ICgtYTAwICogZGV0MTAgKyBhMDEgKiBkZXQwOCAtIGEwMyAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdID0gKGEzMCAqIGRldDA0IC0gYTMxICogZGV0MDIgKyBhMzMgKiBkZXQwMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9ICgtYTIwICogZGV0MDQgKyBhMjEgKiBkZXQwMiAtIGEyMyAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gKC1hMTAgKiBkZXQwOSArIGExMSAqIGRldDA3IC0gYTEyICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gPSAoYTAwICogZGV0MDkgLSBhMDEgKiBkZXQwNyArIGEwMiAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdID0gKC1hMzAgKiBkZXQwMyArIGEzMSAqIGRldDAxIC0gYTMyICogZGV0MDApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxNV0gPSAoYTIwICogZGV0MDMgLSBhMjEgKiBkZXQwMSArIGEyMiAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIChtYXRyaXgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgYjAgPSBtYXRyaXguYXQoMCk7XG4gICAgICAgIHZhciBiMSA9IG1hdHJpeC5hdCgxKTtcbiAgICAgICAgdmFyIGIyID0gbWF0cml4LmF0KDIpO1xuICAgICAgICB2YXIgYjMgPSBtYXRyaXguYXQoMyk7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIGIwID0gbWF0cml4LmF0KDQpO1xuICAgICAgICBiMSA9IG1hdHJpeC5hdCg1KTtcbiAgICAgICAgYjIgPSBtYXRyaXguYXQoNik7XG4gICAgICAgIGIzID0gbWF0cml4LmF0KDcpO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xuICAgICAgICBiMCA9IG1hdHJpeC5hdCg4KTtcbiAgICAgICAgYjEgPSBtYXRyaXguYXQoOSk7XG4gICAgICAgIGIyID0gbWF0cml4LmF0KDEwKTtcbiAgICAgICAgYjMgPSBtYXRyaXguYXQoMTEpO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIGIwID0gbWF0cml4LmF0KDEyKTtcbiAgICAgICAgYjEgPSBtYXRyaXguYXQoMTMpO1xuICAgICAgICBiMiA9IG1hdHJpeC5hdCgxNCk7XG4gICAgICAgIGIzID0gbWF0cml4LmF0KDE1KTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUubXVsdGlwbHlWZWMzID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gbmV3IHZlYzNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEyXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s5XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEzXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxNF1cbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5tdWx0aXBseVZlYzQgPSBmdW5jdGlvbiAodmVjdG9yLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB3ID0gdmVjdG9yLnc7XG4gICAgICAgIGRlc3QueCA9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMl0gKiB3O1xuICAgICAgICBkZXN0LnkgPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzldICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTNdICogdztcbiAgICAgICAgZGVzdC56ID1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxNF0gKiB3O1xuICAgICAgICBkZXN0LncgPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s3XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzExXSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzE1XSAqIHc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudG9NYXQzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IG1hdDNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbOV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF1cbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS50b0ludmVyc2VNYXQzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHZhciBkZXQgPSBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHJldHVybiBuZXcgbWF0M18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgZGV0MDEgKiBkZXQsXG4gICAgICAgICAgICAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQsXG4gICAgICAgICAgICAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldCxcbiAgICAgICAgICAgIGRldDExICogZGV0LFxuICAgICAgICAgICAgKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQsXG4gICAgICAgICAgICAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQsXG4gICAgICAgICAgICBkZXQyMSAqIGRldCxcbiAgICAgICAgICAgICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldCxcbiAgICAgICAgICAgIChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0XG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gKz1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdICogeCArIHRoaXMudmFsdWVzWzRdICogeSArIHRoaXMudmFsdWVzWzhdICogejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSAqIHggKyB0aGlzLnZhbHVlc1s1XSAqIHkgKyB0aGlzLnZhbHVlc1s5XSAqIHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSArPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gKiB4ICsgdGhpcy52YWx1ZXNbNl0gKiB5ICsgdGhpcy52YWx1ZXNbMTBdICogejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSAqIHggKyB0aGlzLnZhbHVlc1s3XSAqIHkgKyB0aGlzLnZhbHVlc1sxMV0gKiB6O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLnZhbHVlc1swXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSAqPSB6O1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSAqPSB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKj0gejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdICo9IHo7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24gKGFuZ2xlLCBheGlzKSB7XG4gICAgICAgIHZhciB4ID0gYXhpcy54O1xuICAgICAgICB2YXIgeSA9IGF4aXMueTtcbiAgICAgICAgdmFyIHogPSBheGlzLno7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgICAgICB4ICo9IGxlbmd0aDtcbiAgICAgICAgICAgIHkgKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeiAqPSBsZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHZhciBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgdCA9IDEuMCAtIGM7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGExMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGEyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdmFyIGIwMCA9IHggKiB4ICogdCArIGM7XG4gICAgICAgIHZhciBiMDEgPSB5ICogeCAqIHQgKyB6ICogcztcbiAgICAgICAgdmFyIGIwMiA9IHogKiB4ICogdCAtIHkgKiBzO1xuICAgICAgICB2YXIgYjEwID0geCAqIHkgKiB0IC0geiAqIHM7XG4gICAgICAgIHZhciBiMTEgPSB5ICogeSAqIHQgKyBjO1xuICAgICAgICB2YXIgYjEyID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgICAgIHZhciBiMjAgPSB4ICogeiAqIHQgKyB5ICogcztcbiAgICAgICAgdmFyIGIyMSA9IHkgKiB6ICogdCAtIHggKiBzO1xuICAgICAgICB2YXIgYjIyID0geiAqIHogKiB0ICsgYztcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBhMDAgKiBiMDAgKyBhMTAgKiBiMDEgKyBhMjAgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYTAxICogYjAwICsgYTExICogYjAxICsgYTIxICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IGEwMiAqIGIwMCArIGExMiAqIGIwMSArIGEyMiAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBhMDMgKiBiMDAgKyBhMTMgKiBiMDEgKyBhMjMgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gYTAwICogYjEwICsgYTEwICogYjExICsgYTIwICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGEwMSAqIGIxMCArIGExMSAqIGIxMSArIGEyMSAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBhMDIgKiBiMTAgKyBhMTIgKiBiMTEgKyBhMjIgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gYTAzICogYjEwICsgYTEzICogYjExICsgYTIzICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGEwMCAqIGIyMCArIGExMCAqIGIyMSArIGEyMCAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSBhMDEgKiBiMjAgKyBhMTEgKiBiMjEgKyBhMjEgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IGEwMiAqIGIyMCArIGExMiAqIGIyMSArIGEyMiAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gYTAzICogYjIwICsgYTEzICogYjIxICsgYTIzICogYjIyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQuZnJ1c3R1bSA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgICAgICB2YXIgcmwgPSByaWdodCAtIGxlZnQ7XG4gICAgICAgIHZhciB0YiA9IHRvcCAtIGJvdHRvbTtcbiAgICAgICAgdmFyIGZuID0gZmFyIC0gbmVhcjtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgIChuZWFyICogMikgLyBybCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAobmVhciAqIDIpIC8gdGIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIChyaWdodCArIGxlZnQpIC8gcmwsXG4gICAgICAgICAgICAodG9wICsgYm90dG9tKSAvIHRiLFxuICAgICAgICAgICAgLShmYXIgKyBuZWFyKSAvIGZuLFxuICAgICAgICAgICAgLTEsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC0oZmFyICogbmVhciAqIDIpIC8gZm4sXG4gICAgICAgICAgICAwXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIChmb3YsIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gICAgICAgIHZhciB0b3AgPSBuZWFyICogTWF0aC50YW4oKGZvdiAqIE1hdGguUEkpIC8gMzYwLjApO1xuICAgICAgICB2YXIgcmlnaHQgPSB0b3AgKiBhc3BlY3Q7XG4gICAgICAgIHJldHVybiBtYXQ0LmZydXN0dW0oLXJpZ2h0LCByaWdodCwgLXRvcCwgdG9wLCBuZWFyLCBmYXIpO1xuICAgIH07XG4gICAgbWF0NC5vcnRob2dyYXBoaWMgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICAgICAgdmFyIHJsID0gcmlnaHQgLSBsZWZ0O1xuICAgICAgICB2YXIgdGIgPSB0b3AgLSBib3R0b207XG4gICAgICAgIHZhciBmbiA9IGZhciAtIG5lYXI7XG4gICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICAyIC8gcmwsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMiAvIHRiLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC0yIC8gZm4sXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShsZWZ0ICsgcmlnaHQpIC8gcmwsXG4gICAgICAgICAgICAtKHRvcCArIGJvdHRvbSkgLyB0YixcbiAgICAgICAgICAgIC0oZmFyICsgbmVhcikgLyBmbixcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0Lmxvb2tBdCA9IGZ1bmN0aW9uIChwb3NpdGlvbiwgdGFyZ2V0LCB1cCkge1xuICAgICAgICBpZiAodXAgPT09IHZvaWQgMCkgeyB1cCA9IHZlYzNfMS5kZWZhdWx0LnVwOyB9XG4gICAgICAgIGlmIChwb3NpdGlvbi5lcXVhbHModGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWRlbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHogPSB2ZWMzXzEuZGVmYXVsdC5kaWZmZXJlbmNlKHBvc2l0aW9uLCB0YXJnZXQpLm5vcm1hbGl6ZSgpO1xuICAgICAgICB2YXIgeCA9IHZlYzNfMS5kZWZhdWx0LmNyb3NzKHVwLCB6KS5ub3JtYWxpemUoKTtcbiAgICAgICAgdmFyIHkgPSB2ZWMzXzEuZGVmYXVsdC5jcm9zcyh6LCB4KS5ub3JtYWxpemUoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgIHgueCxcbiAgICAgICAgICAgIHkueCxcbiAgICAgICAgICAgIHoueCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4LnksXG4gICAgICAgICAgICB5LnksXG4gICAgICAgICAgICB6LnksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgeC56LFxuICAgICAgICAgICAgeS56LFxuICAgICAgICAgICAgei56LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC12ZWMzXzEuZGVmYXVsdC5kb3QoeCwgcG9zaXRpb24pLFxuICAgICAgICAgICAgLXZlYzNfMS5kZWZhdWx0LmRvdCh5LCBwb3NpdGlvbiksXG4gICAgICAgICAgICAtdmVjM18xLmRlZmF1bHQuZG90KHosIHBvc2l0aW9uKSxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb2R1Y3QgPSBmdW5jdGlvbiAobTEsIG0yLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIGEwMCA9IG0xLmF0KDApO1xuICAgICAgICB2YXIgYTAxID0gbTEuYXQoMSk7XG4gICAgICAgIHZhciBhMDIgPSBtMS5hdCgyKTtcbiAgICAgICAgdmFyIGEwMyA9IG0xLmF0KDMpO1xuICAgICAgICB2YXIgYTEwID0gbTEuYXQoNCk7XG4gICAgICAgIHZhciBhMTEgPSBtMS5hdCg1KTtcbiAgICAgICAgdmFyIGExMiA9IG0xLmF0KDYpO1xuICAgICAgICB2YXIgYTEzID0gbTEuYXQoNyk7XG4gICAgICAgIHZhciBhMjAgPSBtMS5hdCg4KTtcbiAgICAgICAgdmFyIGEyMSA9IG0xLmF0KDkpO1xuICAgICAgICB2YXIgYTIyID0gbTEuYXQoMTApO1xuICAgICAgICB2YXIgYTIzID0gbTEuYXQoMTEpO1xuICAgICAgICB2YXIgYTMwID0gbTEuYXQoMTIpO1xuICAgICAgICB2YXIgYTMxID0gbTEuYXQoMTMpO1xuICAgICAgICB2YXIgYTMyID0gbTEuYXQoMTQpO1xuICAgICAgICB2YXIgYTMzID0gbTEuYXQoMTUpO1xuICAgICAgICB2YXIgYjAwID0gbTIuYXQoMCk7XG4gICAgICAgIHZhciBiMDEgPSBtMi5hdCgxKTtcbiAgICAgICAgdmFyIGIwMiA9IG0yLmF0KDIpO1xuICAgICAgICB2YXIgYjAzID0gbTIuYXQoMyk7XG4gICAgICAgIHZhciBiMTAgPSBtMi5hdCg0KTtcbiAgICAgICAgdmFyIGIxMSA9IG0yLmF0KDUpO1xuICAgICAgICB2YXIgYjEyID0gbTIuYXQoNik7XG4gICAgICAgIHZhciBiMTMgPSBtMi5hdCg3KTtcbiAgICAgICAgdmFyIGIyMCA9IG0yLmF0KDgpO1xuICAgICAgICB2YXIgYjIxID0gbTIuYXQoOSk7XG4gICAgICAgIHZhciBiMjIgPSBtMi5hdCgxMCk7XG4gICAgICAgIHZhciBiMjMgPSBtMi5hdCgxMSk7XG4gICAgICAgIHZhciBiMzAgPSBtMi5hdCgxMik7XG4gICAgICAgIHZhciBiMzEgPSBtMi5hdCgxMyk7XG4gICAgICAgIHZhciBiMzIgPSBtMi5hdCgxNCk7XG4gICAgICAgIHZhciBiMzMgPSBtMi5hdCgxNSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pbml0KFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAgKyBiMDMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxICsgYjAzICogYTMxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMiArIGIwMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDMgKyBiMDEgKiBhMTMgKyBiMDIgKiBhMjMgKyBiMDMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwICsgYjEzICogYTMwLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMSArIGIxMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjIgKyBiMTMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjEwICogYTAzICsgYjExICogYTEzICsgYjEyICogYTIzICsgYjEzICogYTMzLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMCArIGIyMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjEgKyBiMjMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyICsgYjIzICogYTMyLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMyArIGIyMSAqIGExMyArIGIyMiAqIGEyMyArIGIyMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDAgKyBiMzEgKiBhMTAgKyBiMzIgKiBhMjAgKyBiMzMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjMwICogYTAxICsgYjMxICogYTExICsgYjMyICogYTIxICsgYjMzICogYTMxLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMiArIGIzMSAqIGExMiArIGIzMiAqIGEyMiArIGIzMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDMgKyBiMzEgKiBhMTMgKyBiMzIgKiBhMjMgKyBiMzMgKiBhMzNcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICAgICAgYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwICsgYjAzICogYTMwLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMSArIGIwMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjIgKyBiMDMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjAwICogYTAzICsgYjAxICogYTEzICsgYjAyICogYTIzICsgYjAzICogYTMzLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMCArIGIxMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjEgKyBiMTMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyICsgYjEzICogYTMyLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMyArIGIxMSAqIGExMyArIGIxMiAqIGEyMyArIGIxMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAgKyBiMjMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxICsgYjIzICogYTMxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMiArIGIyMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDMgKyBiMjEgKiBhMTMgKyBiMjIgKiBhMjMgKyBiMjMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjMwICogYTAwICsgYjMxICogYTEwICsgYjMyICogYTIwICsgYjMzICogYTMwLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMSArIGIzMSAqIGExMSArIGIzMiAqIGEyMSArIGIzMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDIgKyBiMzEgKiBhMTIgKyBiMzIgKiBhMjIgKyBiMzMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjMwICogYTAzICsgYjMxICogYTEzICsgYjMyICogYTIzICsgYjMzICogYTMzXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0NC5pZGVudGl0eSA9IG5ldyBtYXQ0KCkuc2V0SWRlbnRpdHkoKTtcbiAgICByZXR1cm4gbWF0NDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBtYXQ0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0NC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9hZGphY2VudC1vdmVybG9hZC1zaWduYXR1cmVzICovXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHkgKi9cbnZhciBtYXQzXzEgPSByZXF1aXJlKFwiLi9tYXQzXCIpO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL21hdDRcIik7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBxdWF0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHF1YXQodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5encgPSB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwielwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcIndcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4eVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4eXpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieHl6d1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdLCB0aGlzLnZhbHVlc1szXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHF1YXQucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gMDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGRlc3QudmFsdWVzW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5yb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoMi4wICogKHggKiB5ICsgdyAqIHopLCB3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeik7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5waXRjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKDIuMCAqICh5ICogeiArIHcgKiB4KSwgdyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUueWF3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hc2luKDIuMCAqICh0aGlzLnggKiB0aGlzLnogLSB0aGlzLncgKiB0aGlzLnkpKTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMudmFsdWVzW2ldIC0gdmVjdG9yLmF0KGkpKSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnNldElkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLnogPSAwO1xuICAgICAgICB0aGlzLncgPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmNhbGN1bGF0ZVcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHRoaXMudyA9IC1NYXRoLnNxcnQoTWF0aC5hYnMoMS4wIC0geCAqIHggLSB5ICogeSAtIHogKiB6KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRvdCA9IHF1YXQuZG90KHRoaXMsIHRoaXMpO1xuICAgICAgICBpZiAoIWRvdCkge1xuICAgICAgICAgICAgdGhpcy54eXp3ID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGludkRvdCA9IGRvdCA/IDEuMCAvIGRvdCA6IDA7XG4gICAgICAgIHRoaXMueCAqPSAtaW52RG90O1xuICAgICAgICB0aGlzLnkgKj0gLWludkRvdDtcbiAgICAgICAgdGhpcy56ICo9IC1pbnZEb3Q7XG4gICAgICAgIHRoaXMudyAqPSBpbnZEb3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuY29uanVnYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhbHVlc1swXSAqPSAtMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gKj0gLTE7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdICo9IC0xO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHcpO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdyk7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIGRlc3QueiA9IDA7XG4gICAgICAgICAgICBkZXN0LncgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ID0geCAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC55ID0geSAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC56ID0geiAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC53ID0gdyAqIGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldICs9IG90aGVyLmF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHExeCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgcTF5ID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBxMXogPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIHExdyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgcTJ4ID0gb3RoZXIueDtcbiAgICAgICAgdmFyIHEyeSA9IG90aGVyLnk7XG4gICAgICAgIHZhciBxMnogPSBvdGhlci56O1xuICAgICAgICB2YXIgcTJ3ID0gb3RoZXIudztcbiAgICAgICAgdGhpcy54ID0gcTF4ICogcTJ3ICsgcTF3ICogcTJ4ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICB0aGlzLnkgPSBxMXkgKiBxMncgKyBxMXcgKiBxMnkgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIHRoaXMueiA9IHExeiAqIHEydyArIHExdyAqIHEyeiArIHExeCAqIHEyeSAtIHExeSAqIHEyeDtcbiAgICAgICAgdGhpcy53ID0gcTF3ICogcTJ3IC0gcTF4ICogcTJ4IC0gcTF5ICogcTJ5IC0gcTF6ICogcTJ6O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLm11bHRpcGx5VmVjMyA9IGZ1bmN0aW9uICh2ZWN0b3IsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzNfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdmFyIHF4ID0gdGhpcy54O1xuICAgICAgICB2YXIgcXkgPSB0aGlzLnk7XG4gICAgICAgIHZhciBxeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHF3ID0gdGhpcy53O1xuICAgICAgICB2YXIgaXggPSBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHk7XG4gICAgICAgIHZhciBpeSA9IHF3ICogeSArIHF6ICogeCAtIHF4ICogejtcbiAgICAgICAgdmFyIGl6ID0gcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4O1xuICAgICAgICB2YXIgaXcgPSAtcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuICAgICAgICBkZXN0LnggPSBpeCAqIHF3ICsgaXcgKiAtcXggKyBpeSAqIC1xeiAtIGl6ICogLXF5O1xuICAgICAgICBkZXN0LnkgPSBpeSAqIHF3ICsgaXcgKiAtcXkgKyBpeiAqIC1xeCAtIGl4ICogLXF6O1xuICAgICAgICBkZXN0LnogPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnRvTWF0MyA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQzXzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICB2YXIgeDIgPSB4ICsgeDtcbiAgICAgICAgdmFyIHkyID0geSArIHk7XG4gICAgICAgIHZhciB6MiA9IHogKyB6O1xuICAgICAgICB2YXIgeHggPSB4ICogeDI7XG4gICAgICAgIHZhciB4eSA9IHggKiB5MjtcbiAgICAgICAgdmFyIHh6ID0geCAqIHoyO1xuICAgICAgICB2YXIgeXkgPSB5ICogeTI7XG4gICAgICAgIHZhciB5eiA9IHkgKiB6MjtcbiAgICAgICAgdmFyIHp6ID0geiAqIHoyO1xuICAgICAgICB2YXIgd3ggPSB3ICogeDI7XG4gICAgICAgIHZhciB3eSA9IHcgKiB5MjtcbiAgICAgICAgdmFyIHd6ID0gdyAqIHoyO1xuICAgICAgICBkZXN0LmluaXQoW1xuICAgICAgICAgICAgMSAtICh5eSArIHp6KSxcbiAgICAgICAgICAgIHh5ICsgd3osXG4gICAgICAgICAgICB4eiAtIHd5LFxuICAgICAgICAgICAgeHkgLSB3eixcbiAgICAgICAgICAgIDEgLSAoeHggKyB6eiksXG4gICAgICAgICAgICB5eiArIHd4LFxuICAgICAgICAgICAgeHogKyB3eSxcbiAgICAgICAgICAgIHl6IC0gd3gsXG4gICAgICAgICAgICAxIC0gKHh4ICsgeXkpXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnRvTWF0NCA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQ0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICB2YXIgeDIgPSB4ICsgeDtcbiAgICAgICAgdmFyIHkyID0geSArIHk7XG4gICAgICAgIHZhciB6MiA9IHogKyB6O1xuICAgICAgICB2YXIgeHggPSB4ICogeDI7XG4gICAgICAgIHZhciB4eSA9IHggKiB5MjtcbiAgICAgICAgdmFyIHh6ID0geCAqIHoyO1xuICAgICAgICB2YXIgeXkgPSB5ICogeTI7XG4gICAgICAgIHZhciB5eiA9IHkgKiB6MjtcbiAgICAgICAgdmFyIHp6ID0geiAqIHoyO1xuICAgICAgICB2YXIgd3ggPSB3ICogeDI7XG4gICAgICAgIHZhciB3eSA9IHcgKiB5MjtcbiAgICAgICAgdmFyIHd6ID0gdyAqIHoyO1xuICAgICAgICBkZXN0LmluaXQoW1xuICAgICAgICAgICAgMSAtICh5eSArIHp6KSxcbiAgICAgICAgICAgIHh5ICsgd3osXG4gICAgICAgICAgICB4eiAtIHd5LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHh5IC0gd3osXG4gICAgICAgICAgICAxIC0gKHh4ICsgenopLFxuICAgICAgICAgICAgeXogKyB3eCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4eiArIHd5LFxuICAgICAgICAgICAgeXogLSB3eCxcbiAgICAgICAgICAgIDEgLSAoeHggKyB5eSksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMVxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LmRvdCA9IGZ1bmN0aW9uIChxMSwgcTIpIHtcbiAgICAgICAgcmV0dXJuIHExLnggKiBxMi54ICsgcTEueSAqIHEyLnkgKyBxMS56ICogcTIueiArIHExLncgKiBxMi53O1xuICAgIH07XG4gICAgcXVhdC5zdW0gPSBmdW5jdGlvbiAocTEsIHEyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gcTEueCArIHEyLng7XG4gICAgICAgIGRlc3QueSA9IHExLnkgKyBxMi55O1xuICAgICAgICBkZXN0LnogPSBxMS56ICsgcTIuejtcbiAgICAgICAgZGVzdC53ID0gcTEudyArIHEyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm9kdWN0ID0gZnVuY3Rpb24gKHExLCBxMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxMXggPSBxMS54O1xuICAgICAgICB2YXIgcTF5ID0gcTEueTtcbiAgICAgICAgdmFyIHExeiA9IHExLno7XG4gICAgICAgIHZhciBxMXcgPSBxMS53O1xuICAgICAgICB2YXIgcTJ4ID0gcTIueDtcbiAgICAgICAgdmFyIHEyeSA9IHEyLnk7XG4gICAgICAgIHZhciBxMnogPSBxMi56O1xuICAgICAgICB2YXIgcTJ3ID0gcTIudztcbiAgICAgICAgZGVzdC54ID0gcTF4ICogcTJ3ICsgcTF3ICogcTJ4ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICBkZXN0LnkgPSBxMXkgKiBxMncgKyBxMXcgKiBxMnkgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIGRlc3QueiA9IHExeiAqIHEydyArIHExdyAqIHEyeiArIHExeCAqIHEyeSAtIHExeSAqIHEyeDtcbiAgICAgICAgZGVzdC53ID0gcTF3ICogcTJ3IC0gcTF4ICogcTJ4IC0gcTF5ICogcTJ5IC0gcTF6ICogcTJ6O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuY3Jvc3MgPSBmdW5jdGlvbiAocTEsIHEyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHExeCA9IHExLng7XG4gICAgICAgIHZhciBxMXkgPSBxMS55O1xuICAgICAgICB2YXIgcTF6ID0gcTEuejtcbiAgICAgICAgdmFyIHExdyA9IHExLnc7XG4gICAgICAgIHZhciBxMnggPSBxMi54O1xuICAgICAgICB2YXIgcTJ5ID0gcTIueTtcbiAgICAgICAgdmFyIHEyeiA9IHEyLno7XG4gICAgICAgIHZhciBxMncgPSBxMi53O1xuICAgICAgICBkZXN0LnggPSBxMXcgKiBxMnogKyBxMXogKiBxMncgKyBxMXggKiBxMnkgLSBxMXkgKiBxMng7XG4gICAgICAgIGRlc3QueSA9IHExdyAqIHEydyAtIHExeCAqIHEyeCAtIHExeSAqIHEyeSAtIHExeiAqIHEyejtcbiAgICAgICAgZGVzdC56ID0gcTF3ICogcTJ4ICsgcTF4ICogcTJ3ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICBkZXN0LncgPSBxMXcgKiBxMnkgKyBxMXkgKiBxMncgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5zaG9ydE1peCA9IGZ1bmN0aW9uIChxMSwgcTIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGltZSA8PSAwLjApIHtcbiAgICAgICAgICAgIGRlc3QueHl6dyA9IHExLnh5enc7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aW1lID49IDEuMCkge1xuICAgICAgICAgICAgZGVzdC54eXp3ID0gcTIueHl6dztcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb3MgPSBxdWF0LmRvdChxMSwgcTIpO1xuICAgICAgICB2YXIgcTJhID0gcTIuY29weSgpO1xuICAgICAgICBpZiAoY29zIDwgMC4wKSB7XG4gICAgICAgICAgICBxMmEuaW52ZXJzZSgpO1xuICAgICAgICAgICAgY29zID0gLWNvcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgazA7XG4gICAgICAgIHZhciBrMTtcbiAgICAgICAgaWYgKGNvcyA+IDAuOTk5OSkge1xuICAgICAgICAgICAgazAgPSAxIC0gdGltZTtcbiAgICAgICAgICAgIGsxID0gMCArIHRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2luID0gTWF0aC5zcXJ0KDEgLSBjb3MgKiBjb3MpO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMihzaW4sIGNvcyk7XG4gICAgICAgICAgICB2YXIgb25lT3ZlclNpbiA9IDEgLyBzaW47XG4gICAgICAgICAgICBrMCA9IE1hdGguc2luKCgxIC0gdGltZSkgKiBhbmdsZSkgKiBvbmVPdmVyU2luO1xuICAgICAgICAgICAgazEgPSBNYXRoLnNpbigoMCArIHRpbWUpICogYW5nbGUpICogb25lT3ZlclNpbjtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSBrMCAqIHExLnggKyBrMSAqIHEyYS54O1xuICAgICAgICBkZXN0LnkgPSBrMCAqIHExLnkgKyBrMSAqIHEyYS55O1xuICAgICAgICBkZXN0LnogPSBrMCAqIHExLnogKyBrMSAqIHEyYS56O1xuICAgICAgICBkZXN0LncgPSBrMCAqIHExLncgKyBrMSAqIHEyYS53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQubWl4ID0gZnVuY3Rpb24gKHExLCBxMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb3NIYWxmVGhldGEgPSBxMS54ICogcTIueCArIHExLnkgKiBxMi55ICsgcTEueiAqIHEyLnogKyBxMS53ICogcTIudztcbiAgICAgICAgaWYgKE1hdGguYWJzKGNvc0hhbGZUaGV0YSkgPj0gMS4wKSB7XG4gICAgICAgICAgICBkZXN0Lnh5encgPSBxMS54eXp3O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyhjb3NIYWxmVGhldGEpO1xuICAgICAgICB2YXIgc2luSGFsZlRoZXRhID0gTWF0aC5zcXJ0KDEuMCAtIGNvc0hhbGZUaGV0YSAqIGNvc0hhbGZUaGV0YSk7XG4gICAgICAgIGlmIChNYXRoLmFicyhzaW5IYWxmVGhldGEpIDwgMC4wMDEpIHtcbiAgICAgICAgICAgIGRlc3QueCA9IHExLnggKiAwLjUgKyBxMi54ICogMC41O1xuICAgICAgICAgICAgZGVzdC55ID0gcTEueSAqIDAuNSArIHEyLnkgKiAwLjU7XG4gICAgICAgICAgICBkZXN0LnogPSBxMS56ICogMC41ICsgcTIueiAqIDAuNTtcbiAgICAgICAgICAgIGRlc3QudyA9IHExLncgKiAwLjUgKyBxMi53ICogMC41O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJhdGlvQSA9IE1hdGguc2luKCgxIC0gdGltZSkgKiBoYWxmVGhldGEpIC8gc2luSGFsZlRoZXRhO1xuICAgICAgICB2YXIgcmF0aW9CID0gTWF0aC5zaW4odGltZSAqIGhhbGZUaGV0YSkgLyBzaW5IYWxmVGhldGE7XG4gICAgICAgIGRlc3QueCA9IHExLnggKiByYXRpb0EgKyBxMi54ICogcmF0aW9CO1xuICAgICAgICBkZXN0LnkgPSBxMS55ICogcmF0aW9BICsgcTIueSAqIHJhdGlvQjtcbiAgICAgICAgZGVzdC56ID0gcTEueiAqIHJhdGlvQSArIHEyLnogKiByYXRpb0I7XG4gICAgICAgIGRlc3QudyA9IHExLncgKiByYXRpb0EgKyBxMi53ICogcmF0aW9CO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuZnJvbUF4aXNBbmdsZSA9IGZ1bmN0aW9uIChheGlzLCBhbmdsZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIGFuZ2xlICo9IDAuNTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgZGVzdC54ID0gYXhpcy54ICogc2luO1xuICAgICAgICBkZXN0LnkgPSBheGlzLnkgKiBzaW47XG4gICAgICAgIGRlc3QueiA9IGF4aXMueiAqIHNpbjtcbiAgICAgICAgZGVzdC53ID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuaWRlbnRpdHkgPSBuZXcgcXVhdCgpLnNldElkZW50aXR5KCk7XG4gICAgcmV0dXJuIHF1YXQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gcXVhdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1YXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciB2ZWMyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHZlYzIodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5ID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMyLnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMi5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzIucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgdmVjMi5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSB0aGlzLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSAtdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSAtdGhpcy55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy54IC0gdmVjdG9yLngpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueSAtIHZlY3Rvci55KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZExlbmd0aCgpKTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHk7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCArPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICs9IHZlY3Rvci55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLT0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAtPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICo9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uICh2YWx1ZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC55ICo9IHZhbHVlO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMS4wIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgKj0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm11bHRpcGx5TWF0MiA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjMih0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm11bHRpcGx5TWF0MyA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjMih0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzIuY3Jvc3MgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzXzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgeiA9IHggKiB5MiAtIHkgKiB4MjtcbiAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgZGVzdC56ID0gejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLmRvdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgcmV0dXJuIHZlY3Rvci54ICogdmVjdG9yMi54ICsgdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgfTtcbiAgICB2ZWMyLmRpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZERpc3RhbmNlKHZlY3RvciwgdmVjdG9yMikpO1xuICAgIH07XG4gICAgdmVjMi5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yMi54IC0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yMi55IC0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5O1xuICAgIH07XG4gICAgdmVjMi5kaXJlY3Rpb24gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggPSB4ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgPSB5ICogbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIubWl4ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnggPSB4ICsgdGltZSAqICh4MiAtIHgpO1xuICAgICAgICBkZXN0LnkgPSB5ICsgdGltZSAqICh5MiAtIHkpO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIuc3VtID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHZlY3RvcjIueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLmRpZmZlcmVuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5xdW90aWVudCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAvIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLyB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi56ZXJvID0gbmV3IHZlYzIoWzAsIDBdKTtcbiAgICB2ZWMyLm9uZSA9IG5ldyB2ZWMyKFsxLCAxXSk7XG4gICAgcmV0dXJuIHZlYzI7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gdmVjMjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZlYzIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcXVhdF8xID0gcmVxdWlyZShcIi4vcXVhdFwiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciB2ZWMzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHZlYzModmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5eiA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieHlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieHl6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgdmVjMy5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLnogPSAwO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSB0aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IHRoaXMuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IC10aGlzLng7XG4gICAgICAgIGRlc3QueSA9IC10aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IC10aGlzLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnggLSB2ZWN0b3IueCkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy55IC0gdmVjdG9yLnkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueiAtIHZlY3Rvci56KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZExlbmd0aCgpKTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCArPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICs9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKz0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAtPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC09IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLT0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICo9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKj0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56IC89IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZhbHVlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnkgKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueiAqPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIGRlc3QueiA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxLjAgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueSAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueiAqPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubXVsdGlwbHlCeU1hdDMgPSBmdW5jdGlvbiAobWF0cml4LCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdHJpeC5tdWx0aXBseVZlYzModGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5tdWx0aXBseUJ5UXVhdCA9IGZ1bmN0aW9uIChxdWF0ZXJuaW9uLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHF1YXRlcm5pb24ubXVsdGlwbHlWZWMzKHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUudG9RdWF0ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGMgPSBuZXcgdmVjMygpO1xuICAgICAgICB2YXIgcyA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIGMueCA9IE1hdGguY29zKHRoaXMueCAqIDAuNSk7XG4gICAgICAgIHMueCA9IE1hdGguc2luKHRoaXMueCAqIDAuNSk7XG4gICAgICAgIGMueSA9IE1hdGguY29zKHRoaXMueSAqIDAuNSk7XG4gICAgICAgIHMueSA9IE1hdGguc2luKHRoaXMueSAqIDAuNSk7XG4gICAgICAgIGMueiA9IE1hdGguY29zKHRoaXMueiAqIDAuNSk7XG4gICAgICAgIHMueiA9IE1hdGguc2luKHRoaXMueiAqIDAuNSk7XG4gICAgICAgIGRlc3QueCA9IHMueCAqIGMueSAqIGMueiAtIGMueCAqIHMueSAqIHMuejtcbiAgICAgICAgZGVzdC55ID0gYy54ICogcy55ICogYy56ICsgcy54ICogYy55ICogcy56O1xuICAgICAgICBkZXN0LnogPSBjLnggKiBjLnkgKiBzLnogLSBzLnggKiBzLnkgKiBjLno7XG4gICAgICAgIGRlc3QudyA9IGMueCAqIGMueSAqIGMueiArIHMueCAqIHMueSAqIHMuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLmNyb3NzID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgejIgPSB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QueCA9IHkgKiB6MiAtIHogKiB5MjtcbiAgICAgICAgZGVzdC55ID0geiAqIHgyIC0geCAqIHoyO1xuICAgICAgICBkZXN0LnogPSB4ICogeTIgLSB5ICogeDI7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5kb3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgejIgPSB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiB4ICogeDIgKyB5ICogeTIgKyB6ICogejI7XG4gICAgfTtcbiAgICB2ZWMzLmRpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZERpc3RhbmNlKHZlY3RvciwgdmVjdG9yMikpO1xuICAgIH07XG4gICAgdmVjMy5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yMi54IC0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yMi55IC0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yMi56IC0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgfTtcbiAgICB2ZWMzLmRpcmVjdGlvbiA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56IC0gdmVjdG9yMi56O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgZGVzdC56ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCA9IHggKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueSA9IHkgKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueiA9IHogKiBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5taXggPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB0aW1lICogKHZlY3RvcjIueCAtIHZlY3Rvci54KTtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB0aW1lICogKHZlY3RvcjIueSAtIHZlY3Rvci55KTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKyB0aW1lICogKHZlY3RvcjIueiAtIHZlY3Rvci56KTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnN1bSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuZGlmZmVyZW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56IC0gdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICogdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucXVvdGllbnQgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC8gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAvIHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnplcm8gPSBuZXcgdmVjMyhbMCwgMCwgMF0pO1xuICAgIHZlYzMub25lID0gbmV3IHZlYzMoWzEsIDEsIDFdKTtcbiAgICB2ZWMzLnVwID0gbmV3IHZlYzMoWzAsIDEsIDBdKTtcbiAgICB2ZWMzLnJpZ2h0ID0gbmV3IHZlYzMoWzEsIDAsIDBdKTtcbiAgICB2ZWMzLmZvcndhcmQgPSBuZXcgdmVjMyhbMCwgMCwgMV0pO1xuICAgIHJldHVybiB2ZWMzO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZlYzM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWMzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIHZlYzQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gdmVjNCh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMueHl6dyA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwid1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInh5elwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ4eXp3XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl0sIHRoaXMudmFsdWVzWzNdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJnXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwiYlwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcImFcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyZ2JcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwicmdiYVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdLCB0aGlzLnZhbHVlc1szXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHZlYzQucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICAgICAgdGhpcy56ID0gMDtcbiAgICAgICAgdGhpcy53ID0gMDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gdGhpcy55O1xuICAgICAgICBkZXN0LnogPSB0aGlzLno7XG4gICAgICAgIGRlc3QudyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IC10aGlzLng7XG4gICAgICAgIGRlc3QueSA9IC10aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IC10aGlzLno7XG4gICAgICAgIGRlc3QudyA9IC10aGlzLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnggLSB2ZWN0b3IueCkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy55IC0gdmVjdG9yLnkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueiAtIHZlY3Rvci56KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLncgLSB2ZWN0b3IudykgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWRMZW5ndGgoKSk7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogeiArIHcgKiB3O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSArPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56ICs9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLncgKz0gdmVjdG9yLnc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAtPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC09IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLT0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudyAtPSB2ZWN0b3IudztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICo9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAqPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53ICo9IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53IC89IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZhbHVlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnkgKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueiAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC53ICo9IHZhbHVlO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCAqPSAwO1xuICAgICAgICAgICAgZGVzdC55ICo9IDA7XG4gICAgICAgICAgICBkZXN0LnogKj0gMDtcbiAgICAgICAgICAgIGRlc3QudyAqPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMS4wIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnogKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LncgKj0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm11bHRpcGx5TWF0NCA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjNCh0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzQubWl4ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdGltZSAqICh2ZWN0b3IyLnggLSB2ZWN0b3IueCk7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdGltZSAqICh2ZWN0b3IyLnkgLSB2ZWN0b3IueSk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdGltZSAqICh2ZWN0b3IyLnogLSB2ZWN0b3Iueik7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53ICsgdGltZSAqICh2ZWN0b3IyLncgLSB2ZWN0b3Iudyk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5zdW0gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiArIHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgKyB2ZWN0b3IyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5kaWZmZXJlbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLSB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53IC0gdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICogdmVjdG9yMi56O1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyAqIHZlY3RvcjIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnF1b3RpZW50ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC8gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAvIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLyB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53IC8gdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQuemVybyA9IG5ldyB2ZWM0KFswLCAwLCAwLCAxXSk7XG4gICAgdmVjNC5vbmUgPSBuZXcgdmVjNChbMSwgMSwgMSwgMV0pO1xuICAgIHJldHVybiB2ZWM0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZlYzQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWM0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLypcbiAqIENvcHlyaWdodCAyMDEwLCBHb29nbGUgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmVcbiAqIG1ldDpcbiAqXG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZVxuICogY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lclxuICogaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZVxuICogZGlzdHJpYnV0aW9uLlxuICogICAgICogTmVpdGhlciB0aGUgbmFtZSBvZiBHb29nbGUgSW5jLiBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb21cbiAqIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SU1xuICogXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVFxuICogTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SXG4gKiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVFxuICogT1dORVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsXG4gKiBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UXG4gKiBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSxcbiAqIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWVxuICogVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGNvbnRhaW5zIGZ1bmN0aW9ucyBldmVyeSB3ZWJnbCBwcm9ncmFtIHdpbGwgbmVlZFxuICogYSB2ZXJzaW9uIG9mIG9uZSB3YXkgb3IgYW5vdGhlci5cbiAqXG4gKiBJbnN0ZWFkIG9mIHNldHRpbmcgdXAgYSBjb250ZXh0IG1hbnVhbGx5IGl0IGlzIHJlY29tbWVuZGVkIHRvXG4gKiB1c2UuIFRoaXMgd2lsbCBjaGVjayBmb3Igc3VjY2VzcyBvciBmYWlsdXJlLiBPbiBmYWlsdXJlIGl0XG4gKiB3aWxsIGF0dGVtcHQgdG8gcHJlc2VudCBhbiBhcHByb3JpYXRlIG1lc3NhZ2UgdG8gdGhlIHVzZXIuXG4gKlxuICogICAgICAgZ2wgPSBXZWJHTFV0aWxzLnNldHVwV2ViR0woY2FudmFzKTtcbiAqXG4gKiBGb3IgYW5pbWF0ZWQgV2ViR0wgYXBwcyB1c2Ugb2Ygc2V0VGltZW91dCBvciBzZXRJbnRlcnZhbCBhcmVcbiAqIGRpc2NvdXJhZ2VkLiBJdCBpcyByZWNvbW1lbmRlZCB5b3Ugc3RydWN0dXJlIHlvdXIgcmVuZGVyaW5nXG4gKiBsb29wIGxpa2UgdGhpcy5cbiAqXG4gKiAgICAgICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gKiAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbUZyYW1lKHJlbmRlciwgY2FudmFzKTtcbiAqXG4gKiAgICAgICAgIC8vIGRvIHJlbmRlcmluZ1xuICogICAgICAgICAuLi5cbiAqICAgICAgIH1cbiAqICAgICAgIHJlbmRlcigpO1xuICpcbiAqIFRoaXMgd2lsbCBjYWxsIHlvdXIgcmVuZGVyaW5nIGZ1bmN0aW9uIHVwIHRvIHRoZSByZWZyZXNoIHJhdGVcbiAqIG9mIHlvdXIgZGlzcGxheSBidXQgd2lsbCBzdG9wIHJlbmRlcmluZyBpZiB5b3VyIGFwcCBpcyBub3RcbiAqIHZpc2libGUuXG4gKi9cbi8qKlxuICogQ3JlYXRlcyB0aGUgSFRMTSBmb3IgYSBmYWlsdXJlIG1lc3NhZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBjYW52YXNDb250YWluZXJJZCBpZCBvZiBjb250YWluZXIgb2YgdGggY2FudmFzLlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgaHRtbC5cbiAqL1xudmFyIG1ha2VGYWlsSFRNTCA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICByZXR1cm4gKFwiXCIgK1xuICAgICAgICAnPHRhYmxlIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzhDRTsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTtcIj48dHI+JyArXG4gICAgICAgICc8dGQgYWxpZ249XCJjZW50ZXJcIj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJkaXNwbGF5OiB0YWJsZS1jZWxsOyB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1wiPicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cIlwiPicgK1xuICAgICAgICBtc2cgK1xuICAgICAgICBcIjwvZGl2PlwiICtcbiAgICAgICAgXCI8L2Rpdj5cIiArXG4gICAgICAgIFwiPC90ZD48L3RyPjwvdGFibGU+XCIpO1xufTtcbi8qKlxuICogTWVzYXNnZSBmb3IgZ2V0dGluZyBhIHdlYmdsIGJyb3dzZXJcbiAqL1xudmFyIEdFVF9BX1dFQkdMX0JST1dTRVIgPSBcIlwiICtcbiAgICBcIlRoaXMgcGFnZSByZXF1aXJlcyBhIGJyb3dzZXIgdGhhdCBzdXBwb3J0cyBXZWJHTC48YnIvPlwiICtcbiAgICAnPGEgaHJlZj1cImh0dHA6Ly9nZXQud2ViZ2wub3JnXCI+Q2xpY2sgaGVyZSB0byB1cGdyYWRlIHlvdXIgYnJvd3Nlci48L2E+Jztcbi8qKlxuICogTWVzYXNnZSBmb3IgbmVlZCBiZXR0ZXIgaGFyZHdhcmVcbiAqL1xudmFyIE9USEVSX1BST0JMRU0gPSBcIkl0IGRvZXNuJ3QgYXBwZWFyIHlvdXIgY29tcHV0ZXIgY2FuIHN1cHBvcnRcXG5XZWJHTC48YnIvPiA8YSBocmVmPVxcXCJodHRwOi8vZ2V0LndlYmdsLm9yZy90cm91Ymxlc2hvb3RpbmcvXFxcIj5DbGljayBoZXJlIGZvclxcbm1vcmUgaW5mb3JtYXRpb24uPC9hPlwiO1xuLyoqXG4gKiBDcmVhdGVzIGEgd2ViZ2wgY29udGV4dC5cbiAqIEBwYXJhbSB7IUNhbnZhc30gY2FudmFzIFRoZSBjYW52YXMgdGFnIHRvIGdldCBjb250ZXh0IGZyb20uIElmIG9uZSBpcyBub3RcbiAqIHBhc3NlZCBpbiBvbmUgd2lsbCBiZSBjcmVhdGVkLlxuICogQHJldHVybiB7IVdlYkdMQ29udGV4dH0gVGhlIGNyZWF0ZWQgY29udGV4dC5cbiAqL1xuZXhwb3J0cy5jcmVhdGUzRENvbnRleHQgPSBmdW5jdGlvbiAoY2FudmFzLCBvcHRBdHRyaWJzKSB7XG4gICAgdmFyIG5hbWVzID0gW1wid2ViZ2xcIiwgXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgXCJ3ZWJraXQtM2RcIiwgXCJtb3otd2ViZ2xcIl07XG4gICAgdmFyIGNvbnRleHQgPSBudWxsO1xuICAgIGZvciAodmFyIF9pID0gMCwgbmFtZXNfMSA9IG5hbWVzOyBfaSA8IG5hbWVzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBuID0gbmFtZXNfMVtfaV07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQobiwgb3B0QXR0cmlicyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjb250ZXh0ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVuYWJsZSB0byBjcmVhdGUgM0QgY29udGV4dFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQ7XG59O1xuLyoqXG4gKiBDcmVhdGVzIGEgd2ViZ2wgY29udGV4dC4gSWYgY3JlYXRpb24gZmFpbHMgaXQgd2lsbFxuICogY2hhbmdlIHRoZSBjb250ZW50cyBvZiB0aGUgY29udGFpbmVyIG9mIHRoZSA8Y2FudmFzPlxuICogdGFnIHRvIGFuIGVycm9yIG1lc3NhZ2Ugd2l0aCB0aGUgY29ycmVjdCBsaW5rcyBmb3IgV2ViR0wuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNhbnZhcyBUaGUgY2FudmFzIGVsZW1lbnQgdG8gY3JlYXRlIGEgY29udGV4dCBmcm9tLlxuICogQHBhcmFtIHtXZWJHTENvbnRleHRDcmVhdGlvbkF0dGlyYnV0ZXN9IG9wdF9hdHRyaWJzIEFueSBjcmVhdGlvblxuICogYXR0cmlidXRlcyB5b3Ugd2FudCB0byBwYXNzIGluLlxuICogQHJldHVybiB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBUaGUgY3JlYXRlZCBjb250ZXh0LlxuICovXG5leHBvcnRzLnNldHVwV2ViR0wgPSBmdW5jdGlvbiAoY2FudmFzLCBvcHRBdHRyaWJzKSB7XG4gICAgdmFyIHNob3dMaW5rID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gY2FudmFzLnBhcmVudE5vZGU7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBtYWtlRmFpbEhUTUwoc3RyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgaWYgKCF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgIHNob3dMaW5rKEdFVF9BX1dFQkdMX0JST1dTRVIpO1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IGV4cG9ydHMuY3JlYXRlM0RDb250ZXh0KGNhbnZhcywgb3B0QXR0cmlicyk7XG4gICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHNob3dMaW5rKE9USEVSX1BST0JMRU0pO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dDtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD13ZWJnbC11dGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogSm9zZXBoIFBldGl0dGkgLSBDUyA0NzMxIENvbXB1dGVyIEdyYXBoaWNzIFByb2plY3QgMVxuICpcbiAqIEV4dHJhIGNyZWRpdCBmZWF0dXJlczpcbiAqXG4gKiAgIC0gVXNlcnMgYXJlIG5vdCBvbmx5IGxpbWl0ZWQgdG8gcmVkLCBncmVlbiwgYmx1ZSwgYW5kIGJsYWNrIGxpbmUgY29sb3JzLlxuICogICAgIEJ5IHVzaW5nIHRoZSBjb2xvciBwaWNrZXIgaW5wdXQgdG8gdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgY2FudmFzLCB1c2Vyc1xuICogICAgIGNhbiBjaG9vc2UgYW55IHZhbGlkIEhUTUwgY29sb3IgYW5kIHRoZSBkcmF3aW5nIHdpbGwgYmUgdXBkYXRlZC5cbiAqXG4gKiAgIC0gVXNlcnMgY2FuIGRyYXcgb24gZXhpc3RpbmcgLmRhdCBmaWxlIGltYWdlcy4gQnkgdXBsb2FkaW5nIGEgZmlsZSBhbmQgdGhlblxuICogICAgIGNsaWNraW5nIG9uIHRoZSBjYW52YXMgdGhlIHByb2dyYW0gd2lsbCBlbnRlciBkcmF3IG1vZGUgd2l0aCB0aGUgaW1hZ2Ugb25cbiAqICAgICB0aGUgY2FudmFzXG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB3ZWJnbF91dGlsc18xID0gcmVxdWlyZShcIi4vbGliL3dlYmdsLXV0aWxzXCIpO1xudmFyIGluaXRTaGFkZXJzXzEgPSByZXF1aXJlKFwiLi9saWIvaW5pdFNoYWRlcnNcIik7XG52YXIgZmlsZU1vZGVfMSA9IHJlcXVpcmUoXCIuL2ZpbGVNb2RlXCIpO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vbWF0NFwiKTtcbnZhciBkcmF3TW9kZV8xID0gcmVxdWlyZShcIi4vZHJhd01vZGVcIik7XG4vKipcbiAqIGZsYXR0ZW5zIGEgMkQgYXJyYXkgaW50byBhIDFEIGFycmF5XG4gKiBAcGFyYW0gYXJyIGFuIGFycmF5IG9mIGFycmF5c1xuICovXG5mdW5jdGlvbiBmbGF0dGVuKGFycikge1xuICAgIHZhciBfYTtcbiAgICByZXR1cm4gKF9hID0gbmV3IEFycmF5KCkpLmNvbmNhdC5hcHBseShfYSwgYXJyKTtcbn1cbi8qKlxuICogY29udmVydHMgYSBmcmFjdGlvbmFsIGNvbG9yIHZhbHVlIHRvIGEgMi1kaWdpdCBoZXggc3RyaW5nXG4gKiBAcGFyYW0gbnVtIGEgY29sb3IgdmFsdWUgZnJvbSAwIHRvIDFcbiAqL1xudmFyIHRvSGV4ID0gZnVuY3Rpb24gKG51bSkge1xuICAgIHZhciBvdXQgPSBNYXRoLmZsb29yKG51bSAqIDI1NSlcbiAgICAgICAgLnRvU3RyaW5nKDE2KVxuICAgICAgICAuc2xpY2UoMCwgMik7XG4gICAgaWYgKG91dC5sZW5ndGggPCAyKVxuICAgICAgICBvdXQgPSBcIjBcIiArIG91dDtcbiAgICByZXR1cm4gb3V0O1xufTtcbi8qKlxuICogY3JlYXRlIGEgPGNhbnZhcz4gZWxlbWVudCBhbmQgYWRkIGl0IHRvIHRoZSAjY2FudmFzLWNvbnRhaW5lclxuICogQHJldHVybiB0aGUgY3JlYXRlZCBjYW52YXNcbiAqL1xudmFyIGNyZWF0ZUNhbnZhcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIC8vIHJlbW92ZSBhbnkgZXhpc3RpbmcgY2FudmFzXG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWJnbFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgIGNhbnZhcy53aWR0aCA9IDY0MDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gNDgwO1xuICAgIGNhbnZhcy5pZCA9IFwid2ViZ2xcIjtcbiAgICAoX2IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhcy1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgIHJldHVybiBjYW52YXM7XG59O1xuLyoqXG4gKiByZXNldHMgdGhlIGNhbnZhcyBzaXplIGFuZCBXZWJHTCB2aWV3cG9ydCB0byBkZWZhdWx0IHZhbHVlcywgY2xlYXJzIHRoZVxuICogc2NyZWVuXG4gKiBAcGFyYW0gY2FudmFzIHRoZSBjYW52YXMgdG8gY2xlYXJcbiAqIEBwYXJhbSBnbCB0aGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQgb2YgdGhlIGNhbnZhc1xuICogQHBhcmFtIHByb2dyYW0gdGhlIFdlYkdMIHByb2dyYW0gd2UncmUgdXNpbmdcbiAqL1xudmFyIGNsZWFyQ2FudmFzID0gZnVuY3Rpb24gKGNhbnZhcywgZ2wsIHByb2dyYW0pIHtcbiAgICAvLyBzZXQgZGVmYXVsdCB2aWV3IHBvcnQgYW5kIGNhbnZhcyBzaXplXG4gICAgY2FudmFzLndpZHRoID0gNjQwO1xuICAgIGNhbnZhcy5oZWlnaHQgPSA0ODA7XG4gICAgdmFyIHByb2pNYXRyaXhMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJwcm9qTWF0cml4XCIpO1xuICAgIHZhciBwcm9qTWF0cml4ID0gbWF0NF8xLmRlZmF1bHQub3J0aG9ncmFwaGljKDAsIDY0MCwgMCwgNDgwLCAtMS4wLCAxLjApO1xuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYocHJvak1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKHByb2pNYXRyaXguYWxsKCkpKTtcbiAgICBnbC52aWV3cG9ydCgwLCAwLCA2NDAsIDQ4MCk7XG4gICAgLy8gc2V0IGNsZWFyIGNvbG9yIGFuZCBjbGVhciB0aGUgY2FudmFzXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG59O1xuLyoqXG4gKiBzZXRzIGNhbnZhcyBzaXplIGFuZCBkcmF3cyBwb2x5bGluZXNcbiAqIEBwYXJhbSBjYW52YXMgdGhlIGNhbnZhcyBlbGVtZW50IHRvIGRyYXcgb25cbiAqIEBwYXJhbSBnbCB0aGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQgdG8gZHJhdyBvblxuICogQHBhcmFtIHByb2dyYW0gdGhlIFdlYkdMIHByb2dyYW0gdG8gdXNlXG4gKiBAcGFyYW0gcG9seWxpbmVzIGVhY2ggZWxlbWVudCBvZiB0aGlzIGFycmF5IGlzIGEgcG9seWxpbmUsIG1hZGUgdXAgb2YgbWFueVxuICogcG9pbnRzIGV4cHJlc3NlZCBhcyB2ZWM0c1xuICogQHBhcmFtIGNvbG9yIHRoZSByZWQsIGdyZWVuLCBhbmQgYmx1ZSBjb21wb25lbnRzIG9mIHRoZSBjb2xvciB0byB1c2UgZm9yXG4gKiBkcmF3aW5nIGxpbmVzLCBlYWNoIGZyb20gMC0xXG4gKiBAcGFyYW0gZXh0ZW50cyBleHRlbnRzIG9mIHRoZSB3b3JsZCBhcyBbbGVmdCwgdG9wLCByaWdodCBib3R0b21dXG4gKi9cbnZhciBkcmF3UG9seWxpbmVzID0gZnVuY3Rpb24gKGNhbnZhcywgZ2wsIHByb2dyYW0sIHBvbHlsaW5lcywgY29sb3IsIGV4dGVudHMpIHtcbiAgICBpZiAoY29sb3IgPT09IHZvaWQgMCkgeyBjb2xvciA9IHsgcjogMSwgZzogMSwgYjogMSB9OyB9XG4gICAgaWYgKGV4dGVudHMgPT09IHZvaWQgMCkgeyBleHRlbnRzID0gWzAsIDAuNzUsIDEsIDBdOyB9XG4gICAgLy8gY2xlYXIgdGhlIGRyYXdpbmcgY2FudmFzIGFuZCBjb2xvciBpdCB3aGl0ZVxuICAgIGNsZWFyQ2FudmFzKGNhbnZhcywgZ2wsIHByb2dyYW0pO1xuICAgIHZhciBwcm9qTWF0cml4ID0gbWF0NF8xLmRlZmF1bHQub3J0aG9ncmFwaGljKGV4dGVudHNbMF0sIGV4dGVudHNbMl0sIGV4dGVudHNbM10sIGV4dGVudHNbMV0sIC0xLjAsIDEuMCk7XG4gICAgdmFyIHByb2pNYXRyaXhMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJwcm9qTWF0cml4XCIpO1xuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYocHJvak1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKHByb2pNYXRyaXguYWxsKCkpKTtcbiAgICB2YXIgdyA9IGV4dGVudHNbMl0gLSBleHRlbnRzWzBdO1xuICAgIHZhciBoID0gZXh0ZW50c1sxXSAtIGV4dGVudHNbM107XG4gICAgaWYgKHcgPCBoKSB7XG4gICAgICAgIC8vIGltYWdlIGlzIHRhbGxlciB0aGFuIGl0IGlzIHdpZGVcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IDQ4MDtcbiAgICAgICAgY2FudmFzLndpZHRoID0gKDQ4MCAqIHcpIC8gaDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIGltYWdlIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgaXQgaXMgdGFsbFxuICAgICAgICBjYW52YXMud2lkdGggPSA2NDA7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSAoNjQwICogaCkgLyB3O1xuICAgIH1cbiAgICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIC8vIGNyZWF0ZSBuZXcgdmVydGV4IGJ1ZmZlclxuICAgIHZhciB2QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZCdWZmZXIpO1xuICAgIC8vIHBhc3MgdmVydGV4IGRhdGEgdG8gdGhlIGJ1ZmZlclxuICAgIGZvciAodmFyIF9pID0gMCwgcG9seWxpbmVzXzEgPSBwb2x5bGluZXM7IF9pIDwgcG9seWxpbmVzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciB2ZWNzID0gcG9seWxpbmVzXzFbX2ldO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgRmxvYXQzMkFycmF5LmZyb20oZmxhdHRlbih2ZWNzLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcC54eXp3OyB9KSkpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHZhciB2UG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcInZQb3NpdGlvblwiKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodlBvc2l0aW9uKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih2UG9zaXRpb24sIDQsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIC8vIHBhc3MgY29sb3IgZGF0YSB0byB0aGUgYnVmZmVyXG4gICAgICAgIHZhciBjQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBjQnVmZmVyKTtcbiAgICAgICAgdmFyIGNvbG9yQXJyYXkgPSBuZXcgQXJyYXkodmVjcy5sZW5ndGgpO1xuICAgICAgICBjb2xvckFycmF5LmZpbGwoW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIDEuMF0pO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgRmxvYXQzMkFycmF5LmZyb20oZmxhdHRlbihjb2xvckFycmF5KSksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgdmFyIHZDb2xvciA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidkNvbG9yXCIpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2Q29sb3IpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHZDb2xvciwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgLy8gZHJhdyB0aGUgbGluZXNcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhnbC5MSU5FX1NUUklQLCAwLCB2ZWNzLmxlbmd0aCk7XG4gICAgfVxufTtcbmZ1bmN0aW9uIG1haW4oKSB7XG4gICAgLy8gY3JlYXRlIHRoZSA8Y2FudmFzPiBlbGVtZW50XG4gICAgdmFyIGNhbnZhcyA9IGNyZWF0ZUNhbnZhcygpO1xuICAgIC8vIGNyZWF0ZSB0aGUgZmlsZSB1cGxvYWQgaW5wdXRcbiAgICB2YXIgZmlsZUlucHV0ID0gZmlsZU1vZGVfMS5jcmVhdGVGaWxlSW5wdXQoKTtcbiAgICAvLyBjcmVhdGUgdGhlIGNvbG9yIHBpY2tlciBpbnB1dFxuICAgIHZhciBjb2xvcklucHV0ID0gZHJhd01vZGVfMS5jcmVhdGVDb2xvcklucHV0KCk7XG4gICAgLy8gc2V0IHVwIGRlZmF1bHQgdmFyaWFibGVzXG4gICAgdmFyIGRlZmF1bHRDb2xvcnMgPSBbXG4gICAgICAgIHsgcjogMCwgZzogMCwgYjogMCB9LFxuICAgICAgICB7IHI6IDEsIGc6IDAsIGI6IDAgfSxcbiAgICAgICAgeyByOiAwLCBnOiAxLCBiOiAwIH0sXG4gICAgICAgIHsgcjogMCwgZzogMCwgYjogMSB9IC8vIGJsdWVcbiAgICBdO1xuICAgIHZhciBjb2xvckluZGV4ID0gMDtcbiAgICB2YXIgY3VycmVudENvbG9yID0gZGVmYXVsdENvbG9yc1tjb2xvckluZGV4XTtcbiAgICB2YXIgZXh0ZW50cyA9IFswLCAwLjc1LCAxLCAwXTtcbiAgICB2YXIgcG9seWxpbmVzID0gW107XG4gICAgdmFyIGJEb3duID0gZmFsc2U7XG4gICAgdmFyIGp1c3REcmV3RmlsZSA9IGZhbHNlO1xuICAgIC8vIGdldCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgZm9yIFdlYkdMXG4gICAgdmFyIGdsID0gd2ViZ2xfdXRpbHNfMS5zZXR1cFdlYkdMKGNhbnZhcyk7XG4gICAgaWYgKGdsID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZ2V0IHRoZSByZW5kZXJpbmcgY29udGV4dCBmb3IgV2ViR0xcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaW5pdGlhbGl6ZSB2aWV3cG9ydCBhbmQgbGluZSB3aWR0aFxuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgZ2wubGluZVdpZHRoKDIpO1xuICAgIC8vIGluaXRpYWxpemUgc2hhZGVyc1xuICAgIHZhciBwcm9ncmFtID0gaW5pdFNoYWRlcnNfMS5pbml0U2hhZGVycyhnbCwgXCJ2c2hhZGVyXCIsIFwiZnNoYWRlclwiKTtcbiAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xuICAgIC8vIGNsZWFyIHRoZSBkcmF3aW5nIGNhbnZhcyBhbmQgY29sb3IgaXQgd2hpdGVcbiAgICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDEuMCk7XG4gICAgY2xlYXJDYW52YXMoY2FudmFzLCBnbCwgcHJvZ3JhbSk7XG4gICAgLy8gbGlzdGVuIGZvciB2YXJpb3VzIGtleSBwcmVzc2VzIHRoYXQgd2UgY2FyZSBhYm91dFxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChldikge1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgc3dpdGNoIChldi5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJmXCI6IC8vIGVudGVyIGZpbGUgbW9kZVxuICAgICAgICAgICAgICAgIHBvbHlsaW5lcyA9IFtdO1xuICAgICAgICAgICAgICAgIGV4dGVudHMgPSBbMCwgMC43NSwgMSwgMF07XG4gICAgICAgICAgICAgICAgbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kZVwiKTtcbiAgICAgICAgICAgICAgICBpZiAobSAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgbS5pbm5lclRleHQgPSBcIkZpbGUgTW9kZVwiO1xuICAgICAgICAgICAgICAgIGNsZWFyQ2FudmFzKGNhbnZhcywgZ2wsIHByb2dyYW0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRcIjogLy8gZW50ZXIgZHJhdyBtb2RlXG4gICAgICAgICAgICAgICAgcG9seWxpbmVzID0gW107XG4gICAgICAgICAgICAgICAgZXh0ZW50cyA9IFswLCAwLjc1LCAxLCAwXTtcbiAgICAgICAgICAgICAgICBtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RlXCIpO1xuICAgICAgICAgICAgICAgIGlmIChtICE9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICBtLmlubmVyVGV4dCA9IFwiRHJhdyBNb2RlXCI7XG4gICAgICAgICAgICAgICAgY2xlYXJDYW52YXMoY2FudmFzLCBnbCwgcHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY1wiOiAvLyB0b2dnbGUgY29sb3JzXG4gICAgICAgICAgICAgICAgY29sb3JJbmRleCA9IChjb2xvckluZGV4ICsgMSkgJSBkZWZhdWx0Q29sb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29sb3IgPSBkZWZhdWx0Q29sb3JzW2NvbG9ySW5kZXhdO1xuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBjb2xvciBwaWNrZXJcbiAgICAgICAgICAgICAgICBjb2xvcklucHV0LnZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgXCIjXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9IZXgoY3VycmVudENvbG9yLnIpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvSGV4KGN1cnJlbnRDb2xvci5nKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0hleChjdXJyZW50Q29sb3IuYik7XG4gICAgICAgICAgICAgICAgZHJhd1BvbHlsaW5lcyhjYW52YXMsIGdsLCBwcm9ncmFtLCBwb2x5bGluZXMsIGN1cnJlbnRDb2xvciwgZXh0ZW50cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYlwiOiAvLyB0cmFjayB3aGVuIEIgaXMgaGVsZC9yZWxlYXNlZFxuICAgICAgICAgICAgICAgIGJEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGxpc3RlbiBmb3IgdGhlIEIga2V5IGJlaW5nIHJlbGVhc2VkXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYua2V5ID09PSBcImJcIilcbiAgICAgICAgICAgIGJEb3duID0gZmFsc2U7XG4gICAgfSk7XG4gICAgLy8gaGFuZGxlIGEgZmlsZSBiZWluZyB1cGxvYWRlZFxuICAgIGZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGVcIik7XG4gICAgICAgIGlmIChtICE9PSBudWxsKVxuICAgICAgICAgICAgbS5pbm5lclRleHQgPSBcIkZpbGUgTW9kZVwiO1xuICAgICAgICBmaWxlTW9kZV8xLmdldElucHV0KGZpbGVJbnB1dClcbiAgICAgICAgICAgIC50aGVuKGZpbGVNb2RlXzEucGFyc2VGaWxlVGV4dClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICBleHRlbnRzID0gYXJncy5leHRlbnRzO1xuICAgICAgICAgICAgcG9seWxpbmVzID0gYXJncy5wb2x5bGluZXM7XG4gICAgICAgICAgICBkcmF3UG9seWxpbmVzKGNhbnZhcywgZ2wsIHByb2dyYW0sIHBvbHlsaW5lcywgY3VycmVudENvbG9yLCBleHRlbnRzKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBqdXN0RHJld0ZpbGUgPSB0cnVlOyAvLyBzdGFydCBhIG5ldyBsaW5lIHRoZSBuZXh0IHRpbWUgdGhlIHVzZXIgY2xpY2tzXG4gICAgfSk7XG4gICAgLy8gaGFuZGxlIG1vdXNlIGNsaWNrcyBvbiB0aGUgY2FudmFzXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RlXCIpO1xuICAgICAgICBpZiAobSAhPT0gbnVsbClcbiAgICAgICAgICAgIG0uaW5uZXJUZXh0ID0gXCJEcmF3IE1vZGVcIjtcbiAgICAgICAgLy8gdHJhbnNsYXRlIHRoZSBjbGljayBsb2NhdGlvbiB0byBpdHMgcmVsYXRpdmUgcG9zaXRpb24gb24gdGhlIGNhbnZhc1xuICAgICAgICB2YXIgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIG14ID0gKGV2LmNsaWVudFggLSByZWN0LmxlZnQpIC8gY2FudmFzLndpZHRoO1xuICAgICAgICB2YXIgbXkgPSAoY2FudmFzLmhlaWdodCAtIChldi5jbGllbnRZIC0gcmVjdC50b3ApKSAvIGNhbnZhcy5oZWlnaHQ7XG4gICAgICAgIG14ID0gbXggKiAoZXh0ZW50c1syXSAtIGV4dGVudHNbMF0pICsgZXh0ZW50c1swXTtcbiAgICAgICAgbXkgPSBteSAqIChleHRlbnRzWzFdIC0gZXh0ZW50c1szXSkgKyBleHRlbnRzWzNdO1xuICAgICAgICBwb2x5bGluZXMgPSBkcmF3TW9kZV8xLmhhbmRsZUNsaWNrKG14LCBteSwgcG9seWxpbmVzLCBiRG93biB8fCBqdXN0RHJld0ZpbGUpO1xuICAgICAgICBkcmF3UG9seWxpbmVzKGNhbnZhcywgZ2wsIHByb2dyYW0sIHBvbHlsaW5lcywgY3VycmVudENvbG9yLCBleHRlbnRzKTtcbiAgICAgICAganVzdERyZXdGaWxlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgLy8gY2hhbmdlIHRoZSBkcmF3IGNvbG9yIHdoZW4gdGhlIGNvbG9yIHBpY2tlciBjaGFuZ2VzXG4gICAgY29sb3JJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS5sb2coY29sb3JJbnB1dC52YWx1ZSk7XG4gICAgICAgIGN1cnJlbnRDb2xvciA9IHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50KGNvbG9ySW5wdXQudmFsdWUuc2xpY2UoMSwgMyksIDE2KSAvIDI1NSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50KGNvbG9ySW5wdXQudmFsdWUuc2xpY2UoMywgNSksIDE2KSAvIDI1NSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50KGNvbG9ySW5wdXQudmFsdWUuc2xpY2UoNSwgNyksIDE2KSAvIDI1NVxuICAgICAgICB9O1xuICAgICAgICBkcmF3UG9seWxpbmVzKGNhbnZhcywgZ2wsIHByb2dyYW0sIHBvbHlsaW5lcywgY3VycmVudENvbG9yLCBleHRlbnRzKTtcbiAgICB9KTtcbn1cbndpbmRvdy5vbmxvYWQgPSBtYWluO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFpbi5qcy5tYXAiXX0=

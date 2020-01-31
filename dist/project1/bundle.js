(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec2_1 = require("./lib/tsm/vec2");
/**
 * create an <input type="file"> element and add it to #container
 * @return the created input element
 */
exports.createFileInput = function () {
    var _a, _b;
    // remove any existing input
    (_a = document.getElementById("file-upload")) === null || _a === void 0 ? void 0 : _a.remove();
    var input = document.createElement("input");
    input.type = "file";
    input.id = "file-upload";
    (_b = document.getElementById("container")) === null || _b === void 0 ? void 0 : _b.appendChild(input);
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
exports.parseFileText = function (str) {
    var lines = str.split("\n");
    // the string can start comment number of lines followed by a row of asterisks
    var start = 0;
    for (var i = 0; i < lines.length; ++i) {
        if (lines[i].substring(0, 1) === "*") {
            start = i + 1;
            break;
        }
    }
    var extents = [0, 0, 1, 1]; // default extents
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
    for (var i = start; start < lines.length && p < numPolylines; ++i) {
        if (numPoints === 0) {
            // reading number of points in this polyline
            numPoints = Math.floor(parseFloat(lines[i]));
            p++;
        }
        else {
            // reading a point
            polylines[p].push(new vec2_1.default(lines[i]
                .split(/\s+/)
                .map(parseFloat)
                .slice(0, 2)));
            numPoints--;
        }
    }
    return {
        extents: extents,
        polylines: polylines
    };
};

},{"./lib/tsm/vec2":7}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epsilon = 0.00001;

},{}],4:[function(require,module,exports){
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

},{"./constants":3,"./mat4":5,"./quat":6,"./vec2":7,"./vec3":8}],5:[function(require,module,exports){
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

},{"./constants":3,"./mat3":4,"./vec3":8,"./vec4":9}],6:[function(require,module,exports){
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

},{"./constants":3,"./mat3":4,"./mat4":5,"./vec3":8}],7:[function(require,module,exports){
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

},{"./constants":3,"./vec3":8}],8:[function(require,module,exports){
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

},{"./constants":3,"./quat":6}],9:[function(require,module,exports){
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

},{"./constants":3}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webgl_utils_1 = require("./lib/webgl-utils");
var initShaders_1 = require("./lib/initShaders");
var fileMode_1 = require("./fileMode");
var vec4_1 = require("./lib/tsm/vec4");
/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten(arr) {
    var _a;
    return (_a = new Array()).concat.apply(_a, arr);
}
/**
 * create a <canvas> element and add it to the #container
 * @return the created canvas
 */
function createCanvas() {
    var _a, _b;
    // remove any existing canvas
    (_a = document.getElementById("webgl")) === null || _a === void 0 ? void 0 : _a.remove();
    var canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    canvas.id = "webgl";
    (_b = document.getElementById("container")) === null || _b === void 0 ? void 0 : _b.appendChild(canvas);
    return canvas;
}
function main() {
    // create the <canvas> element
    var canvas = createCanvas();
    // create the file upload input
    var input = fileMode_1.createFileInput();
    // get the rendering context for WebGL
    var gl = webgl_utils_1.setupWebGL(canvas);
    if (gl === null) {
        console.error("Failed to get the rendering context for WebGL");
        return;
    }
    // initialize shaders
    var program = initShaders_1.initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    // set up the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    var points = [
        new vec4_1.default([-0.5, -0.5, 0.0, 1.0]),
        new vec4_1.default([0.5, -0.5, 0.0, 1.0]),
        new vec4_1.default([0.0, 0.5, 0.0, 1.0])
    ];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(flatten(points.map(function (p) { return p.xyzw; }))), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    var colors = [
        new vec4_1.default([1.0, 0.0, 0.0, 1.0]),
        new vec4_1.default([0.0, 1.0, 0.0, 1.0]),
        new vec4_1.default([0.0, 0.0, 1.0, 1.0])
    ];
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(flatten(colors.map(function (c) { return c.xyzw; }))), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vColor);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    var vPointSize = gl.getUniformLocation(program, "vPointSize");
    gl.uniform1f(vPointSize, 20.0);
    // set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    window.addEventListener("keydown", function (ev) {
        var key = ev.key;
        if (key === "a") {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, points.length);
        }
        else if (key === "s") {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, points.length);
        }
    });
    window.addEventListener("click", function () {
        gl.clear(gl.COLOR_BUFFER_BIT);
    });
    input.addEventListener("change", function () {
        fileMode_1.getInput(input).then(fileMode_1.parseFileText);
    });
}
window.onload = main;

},{"./fileMode":1,"./lib/initShaders":2,"./lib/tsm/vec4":9,"./lib/webgl-utils":10}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9wcm9qZWN0MS9maWxlTW9kZS5qcyIsImJ1aWxkL3Byb2plY3QxL2xpYi9pbml0U2hhZGVycy5qcyIsImJ1aWxkL3Byb2plY3QxL2xpYi90c20vY29uc3RhbnRzLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS9tYXQzLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS9tYXQ0LmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS9xdWF0LmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS92ZWMyLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS92ZWMzLmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3RzbS92ZWM0LmpzIiwiYnVpbGQvcHJvamVjdDEvbGliL3dlYmdsLXV0aWxzLmpzIiwiYnVpbGQvcHJvamVjdDEvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMza0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjMl8xID0gcmVxdWlyZShcIi4vbGliL3RzbS92ZWMyXCIpO1xuLyoqXG4gKiBjcmVhdGUgYW4gPGlucHV0IHR5cGU9XCJmaWxlXCI+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byAjY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGlucHV0IGVsZW1lbnRcbiAqL1xuZXhwb3J0cy5jcmVhdGVGaWxlSW5wdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICAvLyByZW1vdmUgYW55IGV4aXN0aW5nIGlucHV0XG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWxlLXVwbG9hZFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgaW5wdXQuaWQgPSBcImZpbGUtdXBsb2FkXCI7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0O1xufTtcbi8qKlxuICogYXN5bmNocm9ub3VzbHkgcmVhZHMgdGV4dCBmcm9tIGEgZmlsZSBpbnB1dCBlbGVtZW50LCBhbmQgcmV0dXJucyBpdCBhcyBhXG4gKiBwcm9taXNlXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBjb250YWluaW5lZCB0aGUgY29udGVudHMgb2YgdGhlIGZpcnN0IGZpbGUgaW4gdGhlIGVsZW1lbnQsXG4gKiBvciB1bmRlZmluZWQgaWYgaXQgY2FuJ3QgYmUgcmVhZFxuICovXG5leHBvcnRzLmdldElucHV0ID0gZnVuY3Rpb24gKGVsdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChlbHQuZmlsZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlamVjdChcImVsdCBjb250YWlucyBubyBmaWxlc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmlsZSA9IGVsdC5maWxlc1swXTtcbiAgICAgICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgXCJVVEYtOFwiKTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIHJlc29sdmUoKF9hID0gZXYudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBlcnJvclwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBhYm9ydGVkXCIpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbmV4cG9ydHMucGFyc2VGaWxlVGV4dCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIik7XG4gICAgLy8gdGhlIHN0cmluZyBjYW4gc3RhcnQgY29tbWVudCBudW1iZXIgb2YgbGluZXMgZm9sbG93ZWQgYnkgYSByb3cgb2YgYXN0ZXJpc2tzXG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChsaW5lc1tpXS5zdWJzdHJpbmcoMCwgMSkgPT09IFwiKlwiKSB7XG4gICAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGV4dGVudHMgPSBbMCwgMCwgMSwgMV07IC8vIGRlZmF1bHQgZXh0ZW50c1xuICAgIC8vIGZpcnN0IGxpbmUgYWZ0ZXIgdGhlIGFzdGVyaXNrcyBjb250YWlucyB0aGUgZXh0ZW50cyBvZiB0aGUgZmlndXJlXG4gICAgaWYgKHN0YXJ0ICE9PSAwKSB7XG4gICAgICAgIGV4dGVudHMgPSBsaW5lc1tzdGFydF1cbiAgICAgICAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAgICAgICAubWFwKHBhcnNlRmxvYXQpXG4gICAgICAgICAgICAuc2xpY2UoMCwgNCk7XG4gICAgICAgIHN0YXJ0Kys7XG4gICAgfVxuICAgIC8vIG5leHQgbGluZSBhZnRlciB0aGF0IGlzIHRoZSBsaXN0IG9mIHBvbHlsaW5lcyBpbiB0aGUgZmlndXJlXG4gICAgdmFyIG51bVBvbHlsaW5lcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChsaW5lc1tzdGFydF0pKTtcbiAgICBzdGFydCsrO1xuICAgIGlmIChpc05hTihudW1Qb2x5bGluZXMpIHx8IG51bVBvbHlsaW5lcyA8IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyc2UgZXJyb3I6IGludmFsaWQgbnVtYmVyIG9mIHBvbHlsaW5lc1wiKTtcbiAgICB9XG4gICAgdmFyIHBvbHlsaW5lcyA9IG5ldyBBcnJheShudW1Qb2x5bGluZXMpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUG9seWxpbmVzOyArK2kpIHtcbiAgICAgICAgcG9seWxpbmVzW2ldID0gbmV3IEFycmF5KCk7XG4gICAgfVxuICAgIHZhciBudW1Qb2ludHMgPSAwO1xuICAgIHZhciBwID0gLTE7IC8vIHBvbHlsaW5lIGluZGV4XG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0OyBzdGFydCA8IGxpbmVzLmxlbmd0aCAmJiBwIDwgbnVtUG9seWxpbmVzOyArK2kpIHtcbiAgICAgICAgaWYgKG51bVBvaW50cyA9PT0gMCkge1xuICAgICAgICAgICAgLy8gcmVhZGluZyBudW1iZXIgb2YgcG9pbnRzIGluIHRoaXMgcG9seWxpbmVcbiAgICAgICAgICAgIG51bVBvaW50cyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChsaW5lc1tpXSkpO1xuICAgICAgICAgICAgcCsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVhZGluZyBhIHBvaW50XG4gICAgICAgICAgICBwb2x5bGluZXNbcF0ucHVzaChuZXcgdmVjMl8xLmRlZmF1bHQobGluZXNbaV1cbiAgICAgICAgICAgICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgICAgICAgICAgIC5tYXAocGFyc2VGbG9hdClcbiAgICAgICAgICAgICAgICAuc2xpY2UoMCwgMikpKTtcbiAgICAgICAgICAgIG51bVBvaW50cy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGV4dGVudHM6IGV4dGVudHMsXG4gICAgICAgIHBvbHlsaW5lczogcG9seWxpbmVzXG4gICAgfTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1maWxlTW9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbi8vXG4vLyAgaW5pdFNoYWRlcnMuanNcbi8vXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gKGdsLCB2ZXJ0ZXhTaGFkZXJJZCwgZnJhZ21lbnRTaGFkZXJJZCkge1xuICAgIHZhciB2ZXJ0RWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZlcnRleFNoYWRlcklkKTtcbiAgICBpZiAodmVydEVsZW0gPT09IG51bGwgfHwgdmVydEVsZW0udGV4dENvbnRlbnQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGxvYWQgdmVydGV4IHNoYWRlciBcIiArIHZlcnRleFNoYWRlcklkKTtcbiAgICB9XG4gICAgdmFyIHZlcnRTaGRyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICAgIGlmICh2ZXJ0U2hkciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY3JlYXRlIHZlcnRleCBzaGFkZXIgXCIgKyB2ZXJ0ZXhTaGFkZXJJZCk7XG4gICAgfVxuICAgIGdsLnNoYWRlclNvdXJjZSh2ZXJ0U2hkciwgdmVydEVsZW0udGV4dENvbnRlbnQpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodmVydFNoZHIpO1xuICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHZlcnRTaGRyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgdmFyIG1zZyA9IFwiVmVydGV4IHNoYWRlciBmYWlsZWQgdG8gY29tcGlsZS4gIFRoZSBlcnJvciBsb2cgaXM6XCIgK1xuICAgICAgICAgICAgXCI8cHJlPlwiICtcbiAgICAgICAgICAgIGdsLmdldFNoYWRlckluZm9Mb2codmVydFNoZHIpICtcbiAgICAgICAgICAgIFwiPC9wcmU+XCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbiAgICB2YXIgZnJhZ0VsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmcmFnbWVudFNoYWRlcklkKTtcbiAgICBpZiAoZnJhZ0VsZW0gPT09IG51bGwgfHwgZnJhZ0VsZW0udGV4dENvbnRlbnQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGxvYWQgdmVydGV4IHNoYWRlciBcIiArIGZyYWdtZW50U2hhZGVySWQpO1xuICAgIH1cbiAgICB2YXIgZnJhZ1NoZHIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgICBpZiAoZnJhZ1NoZHIgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNyZWF0ZSB2ZXJ0ZXggc2hhZGVyIFwiICsgZnJhZ21lbnRTaGFkZXJJZCk7XG4gICAgfVxuICAgIGdsLnNoYWRlclNvdXJjZShmcmFnU2hkciwgZnJhZ0VsZW0udGV4dENvbnRlbnQpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIoZnJhZ1NoZHIpO1xuICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZyYWdTaGRyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgdmFyIG1zZyA9IFwiRnJhZ21lbnQgc2hhZGVyIGZhaWxlZCB0byBjb21waWxlLiAgVGhlIGVycm9yIGxvZyBpczpcIiArXG4gICAgICAgICAgICBcIjxwcmU+XCIgK1xuICAgICAgICAgICAgZ2wuZ2V0U2hhZGVySW5mb0xvZyhmcmFnU2hkcikgK1xuICAgICAgICAgICAgXCI8L3ByZT5cIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxuICAgIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIGlmIChwcm9ncmFtID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBjcmVhdGUgcHJvZ3JhbVwiKTtcbiAgICB9XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRTaGRyKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ1NoZHIpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgdmFyIG1zZyA9IFwiU2hhZGVyIHByb2dyYW0gZmFpbGVkIHRvIGxpbmsuICBUaGUgZXJyb3IgbG9nIGlzOlwiICtcbiAgICAgICAgICAgIFwiPHByZT5cIiArXG4gICAgICAgICAgICBnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSArXG4gICAgICAgICAgICBcIjwvcHJlPlwiO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW07XG59O1xuLypcbi8vIEdldCBhIGZpbGUgYXMgYSBzdHJpbmcgdXNpbmcgIEFKQVhcbmZ1bmN0aW9uIGxvYWRGaWxlQUpBWChuYW1lKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgICBva1N0YXR1cyA9IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSBcImZpbGU6XCIgPyAwIDogMjAwO1xuICAgIHhoci5vcGVuKCdHRVQnLCBuYW1lLCBmYWxzZSk7XG4gICAgeGhyLnNlbmQobnVsbCk7XG4gICAgcmV0dXJuIHhoci5zdGF0dXMgPT0gb2tTdGF0dXMgPyB4aHIucmVzcG9uc2VUZXh0IDogbnVsbDtcbn07XG5cblxuZnVuY3Rpb24gaW5pdFNoYWRlcnNGcm9tRmlsZXMoZ2wsIHZTaGFkZXJOYW1lLCBmU2hhZGVyTmFtZSkge1xuICAgIGZ1bmN0aW9uIGdldFNoYWRlcihnbCwgc2hhZGVyTmFtZSwgdHlwZSkge1xuICAgICAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpLFxuICAgICAgICAgICAgc2hhZGVyU2NyaXB0ID0gbG9hZEZpbGVBSkFYKHNoYWRlck5hbWUpO1xuICAgICAgICBpZiAoIXNoYWRlclNjcmlwdCkge1xuICAgICAgICAgICAgYWxlcnQoXCJDb3VsZCBub3QgZmluZCBzaGFkZXIgc291cmNlOiBcIitzaGFkZXJOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzaGFkZXJTY3JpcHQpO1xuICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XG5cbiAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGFsZXJ0KGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hhZGVyO1xuICAgIH1cbiAgICB2YXIgdmVydGV4U2hhZGVyID0gZ2V0U2hhZGVyKGdsLCB2U2hhZGVyTmFtZSwgZ2wuVkVSVEVYX1NIQURFUiksXG4gICAgICAgIGZyYWdtZW50U2hhZGVyID0gZ2V0U2hhZGVyKGdsLCBmU2hhZGVyTmFtZSwgZ2wuRlJBR01FTlRfU0hBREVSKSxcbiAgICAgICAgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG4gICAgICAgIGFsZXJ0KFwiQ291bGQgbm90IGluaXRpYWxpc2Ugc2hhZGVyc1wiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgXG4gICAgcmV0dXJuIHByb2dyYW07XG59O1xuKi9cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluaXRTaGFkZXJzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5lcHNpbG9uID0gMC4wMDAwMTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbnN0YW50cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eSAqL1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL21hdDRcIik7XG52YXIgcXVhdF8xID0gcmVxdWlyZShcIi4vcXVhdFwiKTtcbnZhciB2ZWMyXzEgPSByZXF1aXJlKFwiLi92ZWMyXCIpO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL3ZlYzNcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgbWF0MyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBtYXQzKHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoOSk7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pbml0KHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbWF0My5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IG1hdDMoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgZGVzdC52YWx1ZXNbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnJvdyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiAzICsgMF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDMgKyAxXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogMyArIDJdXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5jb2wgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1tpbmRleF0sIHRoaXMudmFsdWVzW2luZGV4ICsgM10sIHRoaXMudmFsdWVzW2luZGV4ICsgNl1dO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKG1hdHJpeCwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnModGhpcy52YWx1ZXNbaV0gLSBtYXRyaXguYXQoaSkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBkZXQwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMTtcbiAgICAgICAgdmFyIGRldDExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcbiAgICAgICAgdmFyIGRldDIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xuICAgICAgICByZXR1cm4gYTAwICogZGV0MDEgKyBhMDEgKiBkZXQxMSArIGEwMiAqIGRldDIxO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IDE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGVtcDAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciB0ZW1wMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIHRlbXAxMiA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHRlbXAwMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSB0ZW1wMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gdGVtcDEyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmludmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBkZXQwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMTtcbiAgICAgICAgdmFyIGRldDExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcbiAgICAgICAgdmFyIGRldDIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xuICAgICAgICB2YXIgZGV0ID0gYTAwICogZGV0MDEgKyBhMDEgKiBkZXQxMSArIGEwMiAqIGRldDIxO1xuICAgICAgICBpZiAoIWRldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZGV0ID0gMS4wIC8gZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IGRldDAxICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBkZXQxMSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gZGV0MjEgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKG1hdHJpeCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYjAwID0gbWF0cml4LmF0KDApO1xuICAgICAgICB2YXIgYjAxID0gbWF0cml4LmF0KDEpO1xuICAgICAgICB2YXIgYjAyID0gbWF0cml4LmF0KDIpO1xuICAgICAgICB2YXIgYjEwID0gbWF0cml4LmF0KDMpO1xuICAgICAgICB2YXIgYjExID0gbWF0cml4LmF0KDQpO1xuICAgICAgICB2YXIgYjEyID0gbWF0cml4LmF0KDUpO1xuICAgICAgICB2YXIgYjIwID0gbWF0cml4LmF0KDYpO1xuICAgICAgICB2YXIgYjIxID0gbWF0cml4LmF0KDcpO1xuICAgICAgICB2YXIgYjIyID0gbWF0cml4LmF0KDgpO1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjE7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjE7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjE7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLm11bHRpcGx5VmVjMiA9IGZ1bmN0aW9uICh2ZWN0b3IsIHJlc3VsdCkge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQueHkgPSBbXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzBdICsgeSAqIHRoaXMudmFsdWVzWzNdICsgdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzFdICsgeSAqIHRoaXMudmFsdWVzWzRdICsgdGhpcy52YWx1ZXNbN11cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB2ZWMyXzEuZGVmYXVsdChbXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzBdICsgeSAqIHRoaXMudmFsdWVzWzNdICsgdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzFdICsgeSAqIHRoaXMudmFsdWVzWzRdICsgdGhpcy52YWx1ZXNbN11cbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5tdWx0aXBseVZlYzMgPSBmdW5jdGlvbiAodmVjdG9yLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0Lnh5eiA9IFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB6ICogdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzFdICsgeSAqIHRoaXMudmFsdWVzWzRdICsgeiAqIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1syXSArIHkgKiB0aGlzLnZhbHVlc1s1XSArIHogKiB0aGlzLnZhbHVlc1s4XVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHZlYzNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB6ICogdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzFdICsgeSAqIHRoaXMudmFsdWVzWzRdICsgeiAqIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1syXSArIHkgKiB0aGlzLnZhbHVlc1s1XSArIHogKiB0aGlzLnZhbHVlc1s4XVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnRvTWF0NCA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0LmluaXQoW1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s3XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbWF0NF8xLmRlZmF1bHQoW1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s3XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS50b1F1YXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIG0wMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgbTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBtMTAgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIG0xMSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgbTEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBtMjAgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIG0yMSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgbTIyID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBmb3VyWFNxdWFyZWRNaW51czEgPSBtMDAgLSBtMTEgLSBtMjI7XG4gICAgICAgIHZhciBmb3VyWVNxdWFyZWRNaW51czEgPSBtMTEgLSBtMDAgLSBtMjI7XG4gICAgICAgIHZhciBmb3VyWlNxdWFyZWRNaW51czEgPSBtMjIgLSBtMDAgLSBtMTE7XG4gICAgICAgIHZhciBmb3VyV1NxdWFyZWRNaW51czEgPSBtMDAgKyBtMTEgKyBtMjI7XG4gICAgICAgIHZhciBiaWdnZXN0SW5kZXggPSAwO1xuICAgICAgICB2YXIgZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxID0gZm91cldTcXVhcmVkTWludXMxO1xuICAgICAgICBpZiAoZm91clhTcXVhcmVkTWludXMxID4gZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxKSB7XG4gICAgICAgICAgICBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyWFNxdWFyZWRNaW51czE7XG4gICAgICAgICAgICBiaWdnZXN0SW5kZXggPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3VyWVNxdWFyZWRNaW51czEgPiBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEpIHtcbiAgICAgICAgICAgIGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSA9IGZvdXJZU3F1YXJlZE1pbnVzMTtcbiAgICAgICAgICAgIGJpZ2dlc3RJbmRleCA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdXJaU3F1YXJlZE1pbnVzMSA+IGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSkge1xuICAgICAgICAgICAgZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxID0gZm91clpTcXVhcmVkTWludXMxO1xuICAgICAgICAgICAgYmlnZ2VzdEluZGV4ID0gMztcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmlnZ2VzdFZhbCA9IE1hdGguc3FydChmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgKyAxKSAqIDAuNTtcbiAgICAgICAgdmFyIG11bHQgPSAwLjI1IC8gYmlnZ2VzdFZhbDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBxdWF0XzEuZGVmYXVsdCgpO1xuICAgICAgICBzd2l0Y2ggKGJpZ2dlc3RJbmRleCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ID0gYmlnZ2VzdFZhbDtcbiAgICAgICAgICAgICAgICByZXN1bHQueCA9IChtMTIgLSBtMjEpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IChtMjAgLSBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueiA9IChtMDEgLSBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZXN1bHQudyA9IChtMTIgLSBtMjEpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueCA9IGJpZ2dlc3RWYWw7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAobTAxICsgbTEwKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSAobTIwICsgbTAyKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSAobTIwIC0gbTAyKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnggPSAobTAxICsgbTEwKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gKG0xMiArIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ID0gKG0wMSAtIG0xMCkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gKG0yMCArIG0wMikgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gKG0xMiArIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gYmlnZ2VzdFZhbDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24gKGFuZ2xlLCBheGlzKSB7XG4gICAgICAgIHZhciB4ID0gYXhpcy54O1xuICAgICAgICB2YXIgeSA9IGF4aXMueTtcbiAgICAgICAgdmFyIHogPSBheGlzLno7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgICAgICB4ICo9IGxlbmd0aDtcbiAgICAgICAgICAgIHkgKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeiAqPSBsZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHZhciBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgdCA9IDEuMCAtIGM7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYjAwID0geCAqIHggKiB0ICsgYztcbiAgICAgICAgdmFyIGIwMSA9IHkgKiB4ICogdCArIHogKiBzO1xuICAgICAgICB2YXIgYjAyID0geiAqIHggKiB0IC0geSAqIHM7XG4gICAgICAgIHZhciBiMTAgPSB4ICogeSAqIHQgLSB6ICogcztcbiAgICAgICAgdmFyIGIxMSA9IHkgKiB5ICogdCArIGM7XG4gICAgICAgIHZhciBiMTIgPSB6ICogeSAqIHQgKyB4ICogcztcbiAgICAgICAgdmFyIGIyMCA9IHggKiB6ICogdCArIHkgKiBzO1xuICAgICAgICB2YXIgYjIxID0geSAqIHogKiB0IC0geCAqIHM7XG4gICAgICAgIHZhciBiMjIgPSB6ICogeiAqIHQgKyBjO1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IGEwMCAqIGIwMCArIGExMCAqIGIwMSArIGEyMCAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSBhMDEgKiBiMDAgKyBhMTEgKiBiMDEgKyBhMjEgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gYTAyICogYjAwICsgYTEyICogYjAxICsgYTIyICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGEwMCAqIGIxMCArIGExMCAqIGIxMSArIGEyMCAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSBhMDEgKiBiMTAgKyBhMTEgKiBiMTEgKyBhMjEgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gYTAyICogYjEwICsgYTEyICogYjExICsgYTIyICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGEwMCAqIGIyMCArIGExMCAqIGIyMSArIGEyMCAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSBhMDEgKiBiMjAgKyBhMTEgKiBiMjEgKyBhMjEgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gYTAyICogYjIwICsgYTEyICogYjIxICsgYTIyICogYjIyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvZHVjdCA9IGZ1bmN0aW9uIChtMSwgbTIsIHJlc3VsdCkge1xuICAgICAgICB2YXIgYTAwID0gbTEuYXQoMCk7XG4gICAgICAgIHZhciBhMDEgPSBtMS5hdCgxKTtcbiAgICAgICAgdmFyIGEwMiA9IG0xLmF0KDIpO1xuICAgICAgICB2YXIgYTEwID0gbTEuYXQoMyk7XG4gICAgICAgIHZhciBhMTEgPSBtMS5hdCg0KTtcbiAgICAgICAgdmFyIGExMiA9IG0xLmF0KDUpO1xuICAgICAgICB2YXIgYTIwID0gbTEuYXQoNik7XG4gICAgICAgIHZhciBhMjEgPSBtMS5hdCg3KTtcbiAgICAgICAgdmFyIGEyMiA9IG0xLmF0KDgpO1xuICAgICAgICB2YXIgYjAwID0gbTIuYXQoMCk7XG4gICAgICAgIHZhciBiMDEgPSBtMi5hdCgxKTtcbiAgICAgICAgdmFyIGIwMiA9IG0yLmF0KDIpO1xuICAgICAgICB2YXIgYjEwID0gbTIuYXQoMyk7XG4gICAgICAgIHZhciBiMTEgPSBtMi5hdCg0KTtcbiAgICAgICAgdmFyIGIxMiA9IG0yLmF0KDUpO1xuICAgICAgICB2YXIgYjIwID0gbTIuYXQoNik7XG4gICAgICAgIHZhciBiMjEgPSBtMi5hdCg3KTtcbiAgICAgICAgdmFyIGIyMiA9IG0yLmF0KDgpO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQuaW5pdChbXG4gICAgICAgICAgICAgICAgYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjIsXG4gICAgICAgICAgICAgICAgYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjIsXG4gICAgICAgICAgICAgICAgYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjJcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbWF0MyhbXG4gICAgICAgICAgICAgICAgYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjIsXG4gICAgICAgICAgICAgICAgYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjIsXG4gICAgICAgICAgICAgICAgYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMSxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjJcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQzLmlkZW50aXR5ID0gbmV3IG1hdDMoKS5zZXRJZGVudGl0eSgpO1xuICAgIHJldHVybiBtYXQzO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1hdDM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXQzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5ICovXG52YXIgbWF0M18xID0gcmVxdWlyZShcIi4vbWF0M1wiKTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi92ZWMzXCIpO1xudmFyIHZlYzRfMSA9IHJlcXVpcmUoXCIuL3ZlYzRcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgbWF0NCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBtYXQ0KHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1hdDQucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IG1hdDQoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIGRlc3QudmFsdWVzW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgZGF0YVtpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUucm93ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDQgKyAwXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDFdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiA0ICsgMl0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDQgKyAzXVxuICAgICAgICBdO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuY29sID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCArIDRdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKyA4XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICsgMTJdXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAobWF0cml4LCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnModGhpcy52YWx1ZXNbaV0gLSBtYXRyaXguYXQoaSkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGExMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGEyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdmFyIGEzMCA9IHRoaXMudmFsdWVzWzEyXTtcbiAgICAgICAgdmFyIGEzMSA9IHRoaXMudmFsdWVzWzEzXTtcbiAgICAgICAgdmFyIGEzMiA9IHRoaXMudmFsdWVzWzE0XTtcbiAgICAgICAgdmFyIGEzMyA9IHRoaXMudmFsdWVzWzE1XTtcbiAgICAgICAgdmFyIGRldDAwID0gYTAwICogYTExIC0gYTAxICogYTEwO1xuICAgICAgICB2YXIgZGV0MDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMDtcbiAgICAgICAgdmFyIGRldDAzID0gYTAxICogYTEyIC0gYTAyICogYTExO1xuICAgICAgICB2YXIgZGV0MDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMjtcbiAgICAgICAgdmFyIGRldDA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwO1xuICAgICAgICB2YXIgZGV0MDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxO1xuICAgICAgICB2YXIgZGV0MTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMjtcbiAgICAgICAgcmV0dXJuIChkZXQwMCAqIGRldDExIC1cbiAgICAgICAgICAgIGRldDAxICogZGV0MTAgK1xuICAgICAgICAgICAgZGV0MDIgKiBkZXQwOSArXG4gICAgICAgICAgICBkZXQwMyAqIGRldDA4IC1cbiAgICAgICAgICAgIGRldDA0ICogZGV0MDcgK1xuICAgICAgICAgICAgZGV0MDUgKiBkZXQwNik7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNV0gPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRlbXAwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgdGVtcDAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciB0ZW1wMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIHRlbXAxMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgdGVtcDEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciB0ZW1wMjMgPSB0aGlzLnZhbHVlc1sxMV07XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IHRlbXAwMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSB0aGlzLnZhbHVlc1sxM107XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gdGVtcDAyO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IHRlbXAxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gPSB0ZW1wMDM7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IHRlbXAxMztcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdID0gdGVtcDIzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmludmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGExMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGEyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdmFyIGEzMCA9IHRoaXMudmFsdWVzWzEyXTtcbiAgICAgICAgdmFyIGEzMSA9IHRoaXMudmFsdWVzWzEzXTtcbiAgICAgICAgdmFyIGEzMiA9IHRoaXMudmFsdWVzWzE0XTtcbiAgICAgICAgdmFyIGEzMyA9IHRoaXMudmFsdWVzWzE1XTtcbiAgICAgICAgdmFyIGRldDAwID0gYTAwICogYTExIC0gYTAxICogYTEwO1xuICAgICAgICB2YXIgZGV0MDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMDtcbiAgICAgICAgdmFyIGRldDAzID0gYTAxICogYTEyIC0gYTAyICogYTExO1xuICAgICAgICB2YXIgZGV0MDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMjtcbiAgICAgICAgdmFyIGRldDA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwO1xuICAgICAgICB2YXIgZGV0MDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxO1xuICAgICAgICB2YXIgZGV0MTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMjtcbiAgICAgICAgdmFyIGRldCA9IGRldDAwICogZGV0MTEgLVxuICAgICAgICAgICAgZGV0MDEgKiBkZXQxMCArXG4gICAgICAgICAgICBkZXQwMiAqIGRldDA5ICtcbiAgICAgICAgICAgIGRldDAzICogZGV0MDggLVxuICAgICAgICAgICAgZGV0MDQgKiBkZXQwNyArXG4gICAgICAgICAgICBkZXQwNSAqIGRldDA2O1xuICAgICAgICBpZiAoIWRldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZGV0ID0gMS4wIC8gZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IChhMTEgKiBkZXQxMSAtIGExMiAqIGRldDEwICsgYTEzICogZGV0MDkpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9ICgtYTAxICogZGV0MTEgKyBhMDIgKiBkZXQxMCAtIGEwMyAqIGRldDA5KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSAoYTMxICogZGV0MDUgLSBhMzIgKiBkZXQwNCArIGEzMyAqIGRldDAzKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSAoLWEyMSAqIGRldDA1ICsgYTIyICogZGV0MDQgLSBhMjMgKiBkZXQwMykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gKC1hMTAgKiBkZXQxMSArIGExMiAqIGRldDA4IC0gYTEzICogZGV0MDcpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IChhMDAgKiBkZXQxMSAtIGEwMiAqIGRldDA4ICsgYTAzICogZGV0MDcpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9ICgtYTMwICogZGV0MDUgKyBhMzIgKiBkZXQwMiAtIGEzMyAqIGRldDAxKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSAoYTIwICogZGV0MDUgLSBhMjIgKiBkZXQwMiArIGEyMyAqIGRldDAxKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSAoYTEwICogZGV0MTAgLSBhMTEgKiBkZXQwOCArIGExMyAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSAoLWEwMCAqIGRldDEwICsgYTAxICogZGV0MDggLSBhMDMgKiBkZXQwNikgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IChhMzAgKiBkZXQwNCAtIGEzMSAqIGRldDAyICsgYTMzICogZGV0MDApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSAoLWEyMCAqIGRldDA0ICsgYTIxICogZGV0MDIgLSBhMjMgKiBkZXQwMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9ICgtYTEwICogZGV0MDkgKyBhMTEgKiBkZXQwNyAtIGExMiAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdID0gKGEwMCAqIGRldDA5IC0gYTAxICogZGV0MDcgKyBhMDIgKiBkZXQwNikgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSA9ICgtYTMwICogZGV0MDMgKyBhMzEgKiBkZXQwMSAtIGEzMiAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdID0gKGEyMCAqIGRldDAzIC0gYTIxICogZGV0MDEgKyBhMjIgKiBkZXQwMCkgKiBkZXQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAobWF0cml4KSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGExMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGEyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdmFyIGEzMCA9IHRoaXMudmFsdWVzWzEyXTtcbiAgICAgICAgdmFyIGEzMSA9IHRoaXMudmFsdWVzWzEzXTtcbiAgICAgICAgdmFyIGEzMiA9IHRoaXMudmFsdWVzWzE0XTtcbiAgICAgICAgdmFyIGEzMyA9IHRoaXMudmFsdWVzWzE1XTtcbiAgICAgICAgdmFyIGIwID0gbWF0cml4LmF0KDApO1xuICAgICAgICB2YXIgYjEgPSBtYXRyaXguYXQoMSk7XG4gICAgICAgIHZhciBiMiA9IG1hdHJpeC5hdCgyKTtcbiAgICAgICAgdmFyIGIzID0gbWF0cml4LmF0KDMpO1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xuICAgICAgICBiMCA9IG1hdHJpeC5hdCg0KTtcbiAgICAgICAgYjEgPSBtYXRyaXguYXQoNSk7XG4gICAgICAgIGIyID0gbWF0cml4LmF0KDYpO1xuICAgICAgICBiMyA9IG1hdHJpeC5hdCg3KTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSBiMCAqIGEwMCArIGIxICogYTEwICsgYjIgKiBhMjAgKyBiMyAqIGEzMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBiMCAqIGEwMSArIGIxICogYTExICsgYjIgKiBhMjEgKyBiMyAqIGEzMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSBiMCAqIGEwMyArIGIxICogYTEzICsgYjIgKiBhMjMgKyBiMyAqIGEzMztcbiAgICAgICAgYjAgPSBtYXRyaXguYXQoOCk7XG4gICAgICAgIGIxID0gbWF0cml4LmF0KDkpO1xuICAgICAgICBiMiA9IG1hdHJpeC5hdCgxMCk7XG4gICAgICAgIGIzID0gbWF0cml4LmF0KDExKTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBiMCAqIGEwMCArIGIxICogYTEwICsgYjIgKiBhMjAgKyBiMyAqIGEzMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSBiMCAqIGEwMSArIGIxICogYTExICsgYjIgKiBhMjEgKyBiMyAqIGEzMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xuICAgICAgICBiMCA9IG1hdHJpeC5hdCgxMik7XG4gICAgICAgIGIxID0gbWF0cml4LmF0KDEzKTtcbiAgICAgICAgYjIgPSBtYXRyaXguYXQoMTQpO1xuICAgICAgICBiMyA9IG1hdHJpeC5hdCgxNSk7XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gPSBiMCAqIGEwMSArIGIxICogYTExICsgYjIgKiBhMjEgKyBiMyAqIGEzMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XG4gICAgICAgIHRoaXMudmFsdWVzWzE1XSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLm11bHRpcGx5VmVjMyA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIG5ldyB2ZWMzXzEuZGVmYXVsdChbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMl0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzVdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOV0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxM10sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTBdICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTRdXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUubXVsdGlwbHlWZWM0ID0gZnVuY3Rpb24gKHZlY3RvciwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNF8xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB2YXIgdyA9IHZlY3Rvci53O1xuICAgICAgICBkZXN0LnggPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTJdICogdztcbiAgICAgICAgZGVzdC55ID1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s5XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEzXSAqIHc7XG4gICAgICAgIGRlc3QueiA9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTBdICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTRdICogdztcbiAgICAgICAgZGVzdC53ID1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbN10gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMV0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxNV0gKiB3O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnRvTWF0MyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQzXzEuZGVmYXVsdChbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzVdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzldLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTBdXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudG9JbnZlcnNlTWF0MyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBkZXQwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMTtcbiAgICAgICAgdmFyIGRldDExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcbiAgICAgICAgdmFyIGRldDIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xuICAgICAgICB2YXIgZGV0ID0gYTAwICogZGV0MDEgKyBhMDEgKiBkZXQxMSArIGEwMiAqIGRldDIxO1xuICAgICAgICBpZiAoIWRldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZGV0ID0gMS4wIC8gZGV0O1xuICAgICAgICByZXR1cm4gbmV3IG1hdDNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIGRldDAxICogZGV0LFxuICAgICAgICAgICAgKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0LFxuICAgICAgICAgICAgKGExMiAqIGEwMSAtIGEwMiAqIGExMSkgKiBkZXQsXG4gICAgICAgICAgICBkZXQxMSAqIGRldCxcbiAgICAgICAgICAgIChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0LFxuICAgICAgICAgICAgKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0LFxuICAgICAgICAgICAgZGV0MjEgKiBkZXQsXG4gICAgICAgICAgICAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQsXG4gICAgICAgICAgICAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldFxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSAqIHggKyB0aGlzLnZhbHVlc1s0XSAqIHkgKyB0aGlzLnZhbHVlc1s4XSAqIHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSArPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gKiB4ICsgdGhpcy52YWx1ZXNbNV0gKiB5ICsgdGhpcy52YWx1ZXNbOV0gKiB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gKz1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdICogeCArIHRoaXMudmFsdWVzWzZdICogeSArIHRoaXMudmFsdWVzWzEwXSAqIHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzE1XSArPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gKiB4ICsgdGhpcy52YWx1ZXNbN10gKiB5ICsgdGhpcy52YWx1ZXNbMTFdICogejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gKj0geDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gKj0geDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gKj0geDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gKj0geDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gKj0geTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gKj0geTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gKj0geTtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gKj0geTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gKj0gejtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gKj0gejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdICo9IHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSAqPSB6O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmdsZSwgYXhpcykge1xuICAgICAgICB2YXIgeCA9IGF4aXMueDtcbiAgICAgICAgdmFyIHkgPSBheGlzLnk7XG4gICAgICAgIHZhciB6ID0gYXhpcy56O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICAgICAgeCAqPSBsZW5ndGg7XG4gICAgICAgICAgICB5ICo9IGxlbmd0aDtcbiAgICAgICAgICAgIHogKj0gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHQgPSAxLjAgLSBjO1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTAzID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBhMjMgPSB0aGlzLnZhbHVlc1sxMV07XG4gICAgICAgIHZhciBiMDAgPSB4ICogeCAqIHQgKyBjO1xuICAgICAgICB2YXIgYjAxID0geSAqIHggKiB0ICsgeiAqIHM7XG4gICAgICAgIHZhciBiMDIgPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICAgICAgdmFyIGIxMCA9IHggKiB5ICogdCAtIHogKiBzO1xuICAgICAgICB2YXIgYjExID0geSAqIHkgKiB0ICsgYztcbiAgICAgICAgdmFyIGIxMiA9IHogKiB5ICogdCArIHggKiBzO1xuICAgICAgICB2YXIgYjIwID0geCAqIHogKiB0ICsgeSAqIHM7XG4gICAgICAgIHZhciBiMjEgPSB5ICogeiAqIHQgLSB4ICogcztcbiAgICAgICAgdmFyIGIyMiA9IHogKiB6ICogdCArIGM7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYTAzICogYjAwICsgYTEzICogYjAxICsgYTIzICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGEwMCAqIGIxMCArIGExMCAqIGIxMSArIGEyMCAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBhMDEgKiBiMTAgKyBhMTEgKiBiMTEgKyBhMjEgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYTAyICogYjEwICsgYTEyICogYjExICsgYTIyICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGEwMyAqIGIxMCArIGExMyAqIGIxMSArIGEyMyAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBhMDAgKiBiMjAgKyBhMTAgKiBiMjEgKyBhMjAgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gYTAxICogYjIwICsgYTExICogYjIxICsgYTIxICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9IGEwMyAqIGIyMCArIGExMyAqIGIyMSArIGEyMyAqIGIyMjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LmZydXN0dW0gPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICAgICAgdmFyIHJsID0gcmlnaHQgLSBsZWZ0O1xuICAgICAgICB2YXIgdGIgPSB0b3AgLSBib3R0b207XG4gICAgICAgIHZhciBmbiA9IGZhciAtIG5lYXI7XG4gICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICAobmVhciAqIDIpIC8gcmwsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgKG5lYXIgKiAyKSAvIHRiLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAocmlnaHQgKyBsZWZ0KSAvIHJsLFxuICAgICAgICAgICAgKHRvcCArIGJvdHRvbSkgLyB0YixcbiAgICAgICAgICAgIC0oZmFyICsgbmVhcikgLyBmbixcbiAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAtKGZhciAqIG5lYXIgKiAyKSAvIGZuLFxuICAgICAgICAgICAgMFxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQucGVyc3BlY3RpdmUgPSBmdW5jdGlvbiAoZm92LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICAgICAgICB2YXIgdG9wID0gbmVhciAqIE1hdGgudGFuKChmb3YgKiBNYXRoLlBJKSAvIDM2MC4wKTtcbiAgICAgICAgdmFyIHJpZ2h0ID0gdG9wICogYXNwZWN0O1xuICAgICAgICByZXR1cm4gbWF0NC5mcnVzdHVtKC1yaWdodCwgcmlnaHQsIC10b3AsIHRvcCwgbmVhciwgZmFyKTtcbiAgICB9O1xuICAgIG1hdDQub3J0aG9ncmFwaGljID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgICAgIHZhciBybCA9IHJpZ2h0IC0gbGVmdDtcbiAgICAgICAgdmFyIHRiID0gdG9wIC0gYm90dG9tO1xuICAgICAgICB2YXIgZm4gPSBmYXIgLSBuZWFyO1xuICAgICAgICByZXR1cm4gbmV3IG1hdDQoW1xuICAgICAgICAgICAgMiAvIHJsLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDIgLyB0YixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAtMiAvIGZuLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC0obGVmdCArIHJpZ2h0KSAvIHJsLFxuICAgICAgICAgICAgLSh0b3AgKyBib3R0b20pIC8gdGIsXG4gICAgICAgICAgICAtKGZhciArIG5lYXIpIC8gZm4sXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5sb29rQXQgPSBmdW5jdGlvbiAocG9zaXRpb24sIHRhcmdldCwgdXApIHtcbiAgICAgICAgaWYgKHVwID09PSB2b2lkIDApIHsgdXAgPSB2ZWMzXzEuZGVmYXVsdC51cDsgfVxuICAgICAgICBpZiAocG9zaXRpb24uZXF1YWxzKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlkZW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIHZhciB6ID0gdmVjM18xLmRlZmF1bHQuZGlmZmVyZW5jZShwb3NpdGlvbiwgdGFyZ2V0KS5ub3JtYWxpemUoKTtcbiAgICAgICAgdmFyIHggPSB2ZWMzXzEuZGVmYXVsdC5jcm9zcyh1cCwgeikubm9ybWFsaXplKCk7XG4gICAgICAgIHZhciB5ID0gdmVjM18xLmRlZmF1bHQuY3Jvc3MoeiwgeCkubm9ybWFsaXplKCk7XG4gICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICB4LngsXG4gICAgICAgICAgICB5LngsXG4gICAgICAgICAgICB6LngsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgeC55LFxuICAgICAgICAgICAgeS55LFxuICAgICAgICAgICAgei55LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHgueixcbiAgICAgICAgICAgIHkueixcbiAgICAgICAgICAgIHoueixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAtdmVjM18xLmRlZmF1bHQuZG90KHgsIHBvc2l0aW9uKSxcbiAgICAgICAgICAgIC12ZWMzXzEuZGVmYXVsdC5kb3QoeSwgcG9zaXRpb24pLFxuICAgICAgICAgICAgLXZlYzNfMS5kZWZhdWx0LmRvdCh6LCBwb3NpdGlvbiksXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wcm9kdWN0ID0gZnVuY3Rpb24gKG0xLCBtMiwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBhMDAgPSBtMS5hdCgwKTtcbiAgICAgICAgdmFyIGEwMSA9IG0xLmF0KDEpO1xuICAgICAgICB2YXIgYTAyID0gbTEuYXQoMik7XG4gICAgICAgIHZhciBhMDMgPSBtMS5hdCgzKTtcbiAgICAgICAgdmFyIGExMCA9IG0xLmF0KDQpO1xuICAgICAgICB2YXIgYTExID0gbTEuYXQoNSk7XG4gICAgICAgIHZhciBhMTIgPSBtMS5hdCg2KTtcbiAgICAgICAgdmFyIGExMyA9IG0xLmF0KDcpO1xuICAgICAgICB2YXIgYTIwID0gbTEuYXQoOCk7XG4gICAgICAgIHZhciBhMjEgPSBtMS5hdCg5KTtcbiAgICAgICAgdmFyIGEyMiA9IG0xLmF0KDEwKTtcbiAgICAgICAgdmFyIGEyMyA9IG0xLmF0KDExKTtcbiAgICAgICAgdmFyIGEzMCA9IG0xLmF0KDEyKTtcbiAgICAgICAgdmFyIGEzMSA9IG0xLmF0KDEzKTtcbiAgICAgICAgdmFyIGEzMiA9IG0xLmF0KDE0KTtcbiAgICAgICAgdmFyIGEzMyA9IG0xLmF0KDE1KTtcbiAgICAgICAgdmFyIGIwMCA9IG0yLmF0KDApO1xuICAgICAgICB2YXIgYjAxID0gbTIuYXQoMSk7XG4gICAgICAgIHZhciBiMDIgPSBtMi5hdCgyKTtcbiAgICAgICAgdmFyIGIwMyA9IG0yLmF0KDMpO1xuICAgICAgICB2YXIgYjEwID0gbTIuYXQoNCk7XG4gICAgICAgIHZhciBiMTEgPSBtMi5hdCg1KTtcbiAgICAgICAgdmFyIGIxMiA9IG0yLmF0KDYpO1xuICAgICAgICB2YXIgYjEzID0gbTIuYXQoNyk7XG4gICAgICAgIHZhciBiMjAgPSBtMi5hdCg4KTtcbiAgICAgICAgdmFyIGIyMSA9IG0yLmF0KDkpO1xuICAgICAgICB2YXIgYjIyID0gbTIuYXQoMTApO1xuICAgICAgICB2YXIgYjIzID0gbTIuYXQoMTEpO1xuICAgICAgICB2YXIgYjMwID0gbTIuYXQoMTIpO1xuICAgICAgICB2YXIgYjMxID0gbTIuYXQoMTMpO1xuICAgICAgICB2YXIgYjMyID0gbTIuYXQoMTQpO1xuICAgICAgICB2YXIgYjMzID0gbTIuYXQoMTUpO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQuaW5pdChbXG4gICAgICAgICAgICAgICAgYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwICsgYjAzICogYTMwLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMSArIGIwMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjIgKyBiMDMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjAwICogYTAzICsgYjAxICogYTEzICsgYjAyICogYTIzICsgYjAzICogYTMzLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMCArIGIxMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjEgKyBiMTMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyICsgYjEzICogYTMyLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMyArIGIxMSAqIGExMyArIGIxMiAqIGEyMyArIGIxMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAgKyBiMjMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxICsgYjIzICogYTMxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMiArIGIyMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDMgKyBiMjEgKiBhMTMgKyBiMjIgKiBhMjMgKyBiMjMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjMwICogYTAwICsgYjMxICogYTEwICsgYjMyICogYTIwICsgYjMzICogYTMwLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMSArIGIzMSAqIGExMSArIGIzMiAqIGEyMSArIGIzMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDIgKyBiMzEgKiBhMTIgKyBiMzIgKiBhMjIgKyBiMzMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjMwICogYTAzICsgYjMxICogYTEzICsgYjMyICogYTIzICsgYjMzICogYTMzXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG1hdDQoW1xuICAgICAgICAgICAgICAgIGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMCArIGIwMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjEgKyBiMDMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyICsgYjAzICogYTMyLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMyArIGIwMSAqIGExMyArIGIwMiAqIGEyMyArIGIwMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAgKyBiMTMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxICsgYjEzICogYTMxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMiArIGIxMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDMgKyBiMTEgKiBhMTMgKyBiMTIgKiBhMjMgKyBiMTMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwICsgYjIzICogYTMwLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMSArIGIyMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjIgKyBiMjMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjIwICogYTAzICsgYjIxICogYTEzICsgYjIyICogYTIzICsgYjIzICogYTMzLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMCArIGIzMSAqIGExMCArIGIzMiAqIGEyMCArIGIzMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDEgKyBiMzEgKiBhMTEgKyBiMzIgKiBhMjEgKyBiMzMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjMwICogYTAyICsgYjMxICogYTEyICsgYjMyICogYTIyICsgYjMzICogYTMyLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMyArIGIzMSAqIGExMyArIGIzMiAqIGEyMyArIGIzMyAqIGEzM1xuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDQuaWRlbnRpdHkgPSBuZXcgbWF0NCgpLnNldElkZW50aXR5KCk7XG4gICAgcmV0dXJuIG1hdDQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gbWF0NDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdDQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvYWRqYWNlbnQtb3ZlcmxvYWQtc2lnbmF0dXJlcyAqL1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5ICovXG52YXIgbWF0M18xID0gcmVxdWlyZShcIi4vbWF0M1wiKTtcbnZhciBtYXQ0XzEgPSByZXF1aXJlKFwiLi9tYXQ0XCIpO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL3ZlYzNcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgcXVhdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBxdWF0KHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy54eXp3ID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ3XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieHlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieHl6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInh5endcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXSwgdGhpcy52YWx1ZXNbM11dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBxdWF0LnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICBkZXN0LnZhbHVlc1tpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUucm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKDIuMCAqICh4ICogeSArIHcgKiB6KSwgdyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUucGl0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMigyLjAgKiAoeSAqIHogKyB3ICogeCksIHcgKiB3IC0geCAqIHggLSB5ICogeSArIHogKiB6KTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnlhdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXNpbigyLjAgKiAodGhpcy54ICogdGhpcy56IC0gdGhpcy53ICogdGhpcy55KSk7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodmVjdG9yLCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnZhbHVlc1tpXSAtIHZlY3Rvci5hdChpKSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICAgICAgdGhpcy56ID0gMDtcbiAgICAgICAgdGhpcy53ID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5jYWxjdWxhdGVXID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB0aGlzLncgPSAtTWF0aC5zcXJ0KE1hdGguYWJzKDEuMCAtIHggKiB4IC0geSAqIHkgLSB6ICogeikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmludmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkb3QgPSBxdWF0LmRvdCh0aGlzLCB0aGlzKTtcbiAgICAgICAgaWYgKCFkb3QpIHtcbiAgICAgICAgICAgIHRoaXMueHl6dyA9IFswLCAwLCAwLCAwXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbnZEb3QgPSBkb3QgPyAxLjAgLyBkb3QgOiAwO1xuICAgICAgICB0aGlzLnggKj0gLWludkRvdDtcbiAgICAgICAgdGhpcy55ICo9IC1pbnZEb3Q7XG4gICAgICAgIHRoaXMueiAqPSAtaW52RG90O1xuICAgICAgICB0aGlzLncgKj0gaW52RG90O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gKj0gLTE7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdICo9IC0xO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSAqPSAtMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeiArIHcgKiB3KTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHcpO1xuICAgICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICBkZXN0LnogPSAwO1xuICAgICAgICAgICAgZGVzdC53ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCA9IHggKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueSA9IHkgKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueiA9IHogKiBsZW5ndGg7XG4gICAgICAgIGRlc3QudyA9IHcgKiBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSArPSBvdGhlci5hdChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciBxMXggPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIHExeSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgcTF6ID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBxMXcgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIHEyeCA9IG90aGVyLng7XG4gICAgICAgIHZhciBxMnkgPSBvdGhlci55O1xuICAgICAgICB2YXIgcTJ6ID0gb3RoZXIuejtcbiAgICAgICAgdmFyIHEydyA9IG90aGVyLnc7XG4gICAgICAgIHRoaXMueCA9IHExeCAqIHEydyArIHExdyAqIHEyeCArIHExeSAqIHEyeiAtIHExeiAqIHEyeTtcbiAgICAgICAgdGhpcy55ID0gcTF5ICogcTJ3ICsgcTF3ICogcTJ5ICsgcTF6ICogcTJ4IC0gcTF4ICogcTJ6O1xuICAgICAgICB0aGlzLnogPSBxMXogKiBxMncgKyBxMXcgKiBxMnogKyBxMXggKiBxMnkgLSBxMXkgKiBxMng7XG4gICAgICAgIHRoaXMudyA9IHExdyAqIHEydyAtIHExeCAqIHEyeCAtIHExeSAqIHEyeSAtIHExeiAqIHEyejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5tdWx0aXBseVZlYzMgPSBmdW5jdGlvbiAodmVjdG9yLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzXzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciBxeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHF5ID0gdGhpcy55O1xuICAgICAgICB2YXIgcXogPSB0aGlzLno7XG4gICAgICAgIHZhciBxdyA9IHRoaXMudztcbiAgICAgICAgdmFyIGl4ID0gcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5O1xuICAgICAgICB2YXIgaXkgPSBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHo7XG4gICAgICAgIHZhciBpeiA9IHF3ICogeiArIHF4ICogeSAtIHF5ICogeDtcbiAgICAgICAgdmFyIGl3ID0gLXF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcbiAgICAgICAgZGVzdC54ID0gaXggKiBxdyArIGl3ICogLXF4ICsgaXkgKiAtcXogLSBpeiAqIC1xeTtcbiAgICAgICAgZGVzdC55ID0gaXkgKiBxdyArIGl3ICogLXF5ICsgaXogKiAtcXggLSBpeCAqIC1xejtcbiAgICAgICAgZGVzdC56ID0gaXogKiBxdyArIGl3ICogLXF6ICsgaXggKiAtcXkgLSBpeSAqIC1xeDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS50b01hdDMgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0M18xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgdmFyIHgyID0geCArIHg7XG4gICAgICAgIHZhciB5MiA9IHkgKyB5O1xuICAgICAgICB2YXIgejIgPSB6ICsgejtcbiAgICAgICAgdmFyIHh4ID0geCAqIHgyO1xuICAgICAgICB2YXIgeHkgPSB4ICogeTI7XG4gICAgICAgIHZhciB4eiA9IHggKiB6MjtcbiAgICAgICAgdmFyIHl5ID0geSAqIHkyO1xuICAgICAgICB2YXIgeXogPSB5ICogejI7XG4gICAgICAgIHZhciB6eiA9IHogKiB6MjtcbiAgICAgICAgdmFyIHd4ID0gdyAqIHgyO1xuICAgICAgICB2YXIgd3kgPSB3ICogeTI7XG4gICAgICAgIHZhciB3eiA9IHcgKiB6MjtcbiAgICAgICAgZGVzdC5pbml0KFtcbiAgICAgICAgICAgIDEgLSAoeXkgKyB6eiksXG4gICAgICAgICAgICB4eSArIHd6LFxuICAgICAgICAgICAgeHogLSB3eSxcbiAgICAgICAgICAgIHh5IC0gd3osXG4gICAgICAgICAgICAxIC0gKHh4ICsgenopLFxuICAgICAgICAgICAgeXogKyB3eCxcbiAgICAgICAgICAgIHh6ICsgd3ksXG4gICAgICAgICAgICB5eiAtIHd4LFxuICAgICAgICAgICAgMSAtICh4eCArIHl5KVxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS50b01hdDQgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0NF8xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgdmFyIHgyID0geCArIHg7XG4gICAgICAgIHZhciB5MiA9IHkgKyB5O1xuICAgICAgICB2YXIgejIgPSB6ICsgejtcbiAgICAgICAgdmFyIHh4ID0geCAqIHgyO1xuICAgICAgICB2YXIgeHkgPSB4ICogeTI7XG4gICAgICAgIHZhciB4eiA9IHggKiB6MjtcbiAgICAgICAgdmFyIHl5ID0geSAqIHkyO1xuICAgICAgICB2YXIgeXogPSB5ICogejI7XG4gICAgICAgIHZhciB6eiA9IHogKiB6MjtcbiAgICAgICAgdmFyIHd4ID0gdyAqIHgyO1xuICAgICAgICB2YXIgd3kgPSB3ICogeTI7XG4gICAgICAgIHZhciB3eiA9IHcgKiB6MjtcbiAgICAgICAgZGVzdC5pbml0KFtcbiAgICAgICAgICAgIDEgLSAoeXkgKyB6eiksXG4gICAgICAgICAgICB4eSArIHd6LFxuICAgICAgICAgICAgeHogLSB3eSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4eSAtIHd6LFxuICAgICAgICAgICAgMSAtICh4eCArIHp6KSxcbiAgICAgICAgICAgIHl6ICsgd3gsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgeHogKyB3eSxcbiAgICAgICAgICAgIHl6IC0gd3gsXG4gICAgICAgICAgICAxIC0gKHh4ICsgeXkpLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5kb3QgPSBmdW5jdGlvbiAocTEsIHEyKSB7XG4gICAgICAgIHJldHVybiBxMS54ICogcTIueCArIHExLnkgKiBxMi55ICsgcTEueiAqIHEyLnogKyBxMS53ICogcTIudztcbiAgICB9O1xuICAgIHF1YXQuc3VtID0gZnVuY3Rpb24gKHExLCBxMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHExLnggKyBxMi54O1xuICAgICAgICBkZXN0LnkgPSBxMS55ICsgcTIueTtcbiAgICAgICAgZGVzdC56ID0gcTEueiArIHEyLno7XG4gICAgICAgIGRlc3QudyA9IHExLncgKyBxMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvZHVjdCA9IGZ1bmN0aW9uIChxMSwgcTIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcTF4ID0gcTEueDtcbiAgICAgICAgdmFyIHExeSA9IHExLnk7XG4gICAgICAgIHZhciBxMXogPSBxMS56O1xuICAgICAgICB2YXIgcTF3ID0gcTEudztcbiAgICAgICAgdmFyIHEyeCA9IHEyLng7XG4gICAgICAgIHZhciBxMnkgPSBxMi55O1xuICAgICAgICB2YXIgcTJ6ID0gcTIuejtcbiAgICAgICAgdmFyIHEydyA9IHEyLnc7XG4gICAgICAgIGRlc3QueCA9IHExeCAqIHEydyArIHExdyAqIHEyeCArIHExeSAqIHEyeiAtIHExeiAqIHEyeTtcbiAgICAgICAgZGVzdC55ID0gcTF5ICogcTJ3ICsgcTF3ICogcTJ5ICsgcTF6ICogcTJ4IC0gcTF4ICogcTJ6O1xuICAgICAgICBkZXN0LnogPSBxMXogKiBxMncgKyBxMXcgKiBxMnogKyBxMXggKiBxMnkgLSBxMXkgKiBxMng7XG4gICAgICAgIGRlc3QudyA9IHExdyAqIHEydyAtIHExeCAqIHEyeCAtIHExeSAqIHEyeSAtIHExeiAqIHEyejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LmNyb3NzID0gZnVuY3Rpb24gKHExLCBxMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxMXggPSBxMS54O1xuICAgICAgICB2YXIgcTF5ID0gcTEueTtcbiAgICAgICAgdmFyIHExeiA9IHExLno7XG4gICAgICAgIHZhciBxMXcgPSBxMS53O1xuICAgICAgICB2YXIgcTJ4ID0gcTIueDtcbiAgICAgICAgdmFyIHEyeSA9IHEyLnk7XG4gICAgICAgIHZhciBxMnogPSBxMi56O1xuICAgICAgICB2YXIgcTJ3ID0gcTIudztcbiAgICAgICAgZGVzdC54ID0gcTF3ICogcTJ6ICsgcTF6ICogcTJ3ICsgcTF4ICogcTJ5IC0gcTF5ICogcTJ4O1xuICAgICAgICBkZXN0LnkgPSBxMXcgKiBxMncgLSBxMXggKiBxMnggLSBxMXkgKiBxMnkgLSBxMXogKiBxMno7XG4gICAgICAgIGRlc3QueiA9IHExdyAqIHEyeCArIHExeCAqIHEydyArIHExeSAqIHEyeiAtIHExeiAqIHEyeTtcbiAgICAgICAgZGVzdC53ID0gcTF3ICogcTJ5ICsgcTF5ICogcTJ3ICsgcTF6ICogcTJ4IC0gcTF4ICogcTJ6O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuc2hvcnRNaXggPSBmdW5jdGlvbiAocTEsIHEyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpbWUgPD0gMC4wKSB7XG4gICAgICAgICAgICBkZXN0Lnh5encgPSBxMS54eXp3O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGltZSA+PSAxLjApIHtcbiAgICAgICAgICAgIGRlc3QueHl6dyA9IHEyLnh5enc7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29zID0gcXVhdC5kb3QocTEsIHEyKTtcbiAgICAgICAgdmFyIHEyYSA9IHEyLmNvcHkoKTtcbiAgICAgICAgaWYgKGNvcyA8IDAuMCkge1xuICAgICAgICAgICAgcTJhLmludmVyc2UoKTtcbiAgICAgICAgICAgIGNvcyA9IC1jb3M7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGswO1xuICAgICAgICB2YXIgazE7XG4gICAgICAgIGlmIChjb3MgPiAwLjk5OTkpIHtcbiAgICAgICAgICAgIGswID0gMSAtIHRpbWU7XG4gICAgICAgICAgICBrMSA9IDAgKyB0aW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNpbiA9IE1hdGguc3FydCgxIC0gY29zICogY29zKTtcbiAgICAgICAgICAgIHZhciBhbmdsZSA9IE1hdGguYXRhbjIoc2luLCBjb3MpO1xuICAgICAgICAgICAgdmFyIG9uZU92ZXJTaW4gPSAxIC8gc2luO1xuICAgICAgICAgICAgazAgPSBNYXRoLnNpbigoMSAtIHRpbWUpICogYW5nbGUpICogb25lT3ZlclNpbjtcbiAgICAgICAgICAgIGsxID0gTWF0aC5zaW4oKDAgKyB0aW1lKSAqIGFuZ2xlKSAqIG9uZU92ZXJTaW47XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gazAgKiBxMS54ICsgazEgKiBxMmEueDtcbiAgICAgICAgZGVzdC55ID0gazAgKiBxMS55ICsgazEgKiBxMmEueTtcbiAgICAgICAgZGVzdC56ID0gazAgKiBxMS56ICsgazEgKiBxMmEuejtcbiAgICAgICAgZGVzdC53ID0gazAgKiBxMS53ICsgazEgKiBxMmEudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0Lm1peCA9IGZ1bmN0aW9uIChxMSwgcTIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29zSGFsZlRoZXRhID0gcTEueCAqIHEyLnggKyBxMS55ICogcTIueSArIHExLnogKiBxMi56ICsgcTEudyAqIHEyLnc7XG4gICAgICAgIGlmIChNYXRoLmFicyhjb3NIYWxmVGhldGEpID49IDEuMCkge1xuICAgICAgICAgICAgZGVzdC54eXp3ID0gcTEueHl6dztcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBoYWxmVGhldGEgPSBNYXRoLmFjb3MoY29zSGFsZlRoZXRhKTtcbiAgICAgICAgdmFyIHNpbkhhbGZUaGV0YSA9IE1hdGguc3FydCgxLjAgLSBjb3NIYWxmVGhldGEgKiBjb3NIYWxmVGhldGEpO1xuICAgICAgICBpZiAoTWF0aC5hYnMoc2luSGFsZlRoZXRhKSA8IDAuMDAxKSB7XG4gICAgICAgICAgICBkZXN0LnggPSBxMS54ICogMC41ICsgcTIueCAqIDAuNTtcbiAgICAgICAgICAgIGRlc3QueSA9IHExLnkgKiAwLjUgKyBxMi55ICogMC41O1xuICAgICAgICAgICAgZGVzdC56ID0gcTEueiAqIDAuNSArIHEyLnogKiAwLjU7XG4gICAgICAgICAgICBkZXN0LncgPSBxMS53ICogMC41ICsgcTIudyAqIDAuNTtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIHZhciByYXRpb0EgPSBNYXRoLnNpbigoMSAtIHRpbWUpICogaGFsZlRoZXRhKSAvIHNpbkhhbGZUaGV0YTtcbiAgICAgICAgdmFyIHJhdGlvQiA9IE1hdGguc2luKHRpbWUgKiBoYWxmVGhldGEpIC8gc2luSGFsZlRoZXRhO1xuICAgICAgICBkZXN0LnggPSBxMS54ICogcmF0aW9BICsgcTIueCAqIHJhdGlvQjtcbiAgICAgICAgZGVzdC55ID0gcTEueSAqIHJhdGlvQSArIHEyLnkgKiByYXRpb0I7XG4gICAgICAgIGRlc3QueiA9IHExLnogKiByYXRpb0EgKyBxMi56ICogcmF0aW9CO1xuICAgICAgICBkZXN0LncgPSBxMS53ICogcmF0aW9BICsgcTIudyAqIHJhdGlvQjtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LmZyb21BeGlzQW5nbGUgPSBmdW5jdGlvbiAoYXhpcywgYW5nbGUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICBhbmdsZSAqPSAwLjU7XG4gICAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIGRlc3QueCA9IGF4aXMueCAqIHNpbjtcbiAgICAgICAgZGVzdC55ID0gYXhpcy55ICogc2luO1xuICAgICAgICBkZXN0LnogPSBheGlzLnogKiBzaW47XG4gICAgICAgIGRlc3QudyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LmlkZW50aXR5ID0gbmV3IHF1YXQoKS5zZXRJZGVudGl0eSgpO1xuICAgIHJldHVybiBxdWF0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHF1YXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWF0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL3ZlYzNcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgdmVjMiA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiB2ZWMyKHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMik7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy54eSA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMi5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzIucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMyLnByb3RvdHlwZSwgXCJ4eVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHZlYzIucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gdGhpcy55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gLXRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gLXRoaXMueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodmVjdG9yLCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueCAtIHZlY3Rvci54KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnkgLSB2ZWN0b3IueSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWRMZW5ndGgoKSk7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSArPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC09IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLT0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICo9IHZlY3Rvci55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiAodmFsdWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueSAqPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEuMCAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC55ICo9IGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5tdWx0aXBseU1hdDIgPSBmdW5jdGlvbiAobWF0cml4LCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdHJpeC5tdWx0aXBseVZlYzIodGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5tdWx0aXBseU1hdDMgPSBmdW5jdGlvbiAobWF0cml4LCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdHJpeC5tdWx0aXBseVZlYzIodGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWMyLmNyb3NzID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjM18xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeDIgPSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5MiA9IHZlY3RvcjIueTtcbiAgICAgICAgdmFyIHogPSB4ICogeTIgLSB5ICogeDI7XG4gICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgIGRlc3QueiA9IHo7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5kb3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHJldHVybiB2ZWN0b3IueCAqIHZlY3RvcjIueCArIHZlY3Rvci55ICogdmVjdG9yMi55O1xuICAgIH07XG4gICAgdmVjMi5kaXN0YW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWREaXN0YW5jZSh2ZWN0b3IsIHZlY3RvcjIpKTtcbiAgICB9O1xuICAgIHZlYzIuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICB2YXIgeCA9IHZlY3RvcjIueCAtIHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3RvcjIueSAtIHZlY3Rvci55O1xuICAgICAgICByZXR1cm4geCAqIHggKyB5ICogeTtcbiAgICB9O1xuICAgIHZlYzIuZGlyZWN0aW9uID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ID0geCAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC55ID0geSAqIGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLm1peCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeDIgPSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5MiA9IHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC54ID0geCArIHRpbWUgKiAoeDIgLSB4KTtcbiAgICAgICAgZGVzdC55ID0geSArIHRpbWUgKiAoeTIgLSB5KTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnN1bSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5kaWZmZXJlbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnByb2R1Y3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKiB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICogdmVjdG9yMi55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucXVvdGllbnQgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC8gdmVjdG9yMi55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIuemVybyA9IG5ldyB2ZWMyKFswLCAwXSk7XG4gICAgdmVjMi5vbmUgPSBuZXcgdmVjMihbMSwgMV0pO1xuICAgIHJldHVybiB2ZWMyO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZlYzI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWMyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHF1YXRfMSA9IHJlcXVpcmUoXCIuL3F1YXRcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgdmVjMyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiB2ZWMzKHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy54eXogPSB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwielwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInh5elwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHZlYzMucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICAgICAgdGhpcy56ID0gMDtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gdGhpcy55O1xuICAgICAgICBkZXN0LnogPSB0aGlzLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSAtdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSAtdGhpcy55O1xuICAgICAgICBkZXN0LnogPSAtdGhpcy56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy54IC0gdmVjdG9yLngpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueSAtIHZlY3Rvci55KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnogLSB2ZWN0b3IueikgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWRMZW5ndGgoKSk7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSArPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56ICs9IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLT0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAtPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56IC09IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKj0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56ICo9IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uICh2YWx1ZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC55ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnogKj0gdmFsdWU7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICBkZXN0LnogPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMS4wIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnogKj0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLm11bHRpcGx5QnlNYXQzID0gZnVuY3Rpb24gKG1hdHJpeCwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHlWZWMzKHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubXVsdGlwbHlCeVF1YXQgPSBmdW5jdGlvbiAocXVhdGVybmlvbiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBxdWF0ZXJuaW9uLm11bHRpcGx5VmVjMyh0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnRvUXVhdCA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjID0gbmV3IHZlYzMoKTtcbiAgICAgICAgdmFyIHMgPSBuZXcgdmVjMygpO1xuICAgICAgICBjLnggPSBNYXRoLmNvcyh0aGlzLnggKiAwLjUpO1xuICAgICAgICBzLnggPSBNYXRoLnNpbih0aGlzLnggKiAwLjUpO1xuICAgICAgICBjLnkgPSBNYXRoLmNvcyh0aGlzLnkgKiAwLjUpO1xuICAgICAgICBzLnkgPSBNYXRoLnNpbih0aGlzLnkgKiAwLjUpO1xuICAgICAgICBjLnogPSBNYXRoLmNvcyh0aGlzLnogKiAwLjUpO1xuICAgICAgICBzLnogPSBNYXRoLnNpbih0aGlzLnogKiAwLjUpO1xuICAgICAgICBkZXN0LnggPSBzLnggKiBjLnkgKiBjLnogLSBjLnggKiBzLnkgKiBzLno7XG4gICAgICAgIGRlc3QueSA9IGMueCAqIHMueSAqIGMueiArIHMueCAqIGMueSAqIHMuejtcbiAgICAgICAgZGVzdC56ID0gYy54ICogYy55ICogcy56IC0gcy54ICogcy55ICogYy56O1xuICAgICAgICBkZXN0LncgPSBjLnggKiBjLnkgKiBjLnogKyBzLnggKiBzLnkgKiBzLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5jcm9zcyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB2YXIgeDIgPSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5MiA9IHZlY3RvcjIueTtcbiAgICAgICAgdmFyIHoyID0gdmVjdG9yMi56O1xuICAgICAgICBkZXN0LnggPSB5ICogejIgLSB6ICogeTI7XG4gICAgICAgIGRlc3QueSA9IHogKiB4MiAtIHggKiB6MjtcbiAgICAgICAgZGVzdC56ID0geCAqIHkyIC0geSAqIHgyO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuZG90ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB2YXIgeDIgPSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5MiA9IHZlY3RvcjIueTtcbiAgICAgICAgdmFyIHoyID0gdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4geCAqIHgyICsgeSAqIHkyICsgeiAqIHoyO1xuICAgIH07XG4gICAgdmVjMy5kaXN0YW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWREaXN0YW5jZSh2ZWN0b3IsIHZlY3RvcjIpKTtcbiAgICB9O1xuICAgIHZlYzMuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICB2YXIgeCA9IHZlY3RvcjIueCAtIHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3RvcjIueSAtIHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3RvcjIueiAtIHZlY3Rvci56O1xuICAgICAgICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6O1xuICAgIH07XG4gICAgdmVjMy5kaXJlY3Rpb24gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IueiAtIHZlY3RvcjIuejtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIGRlc3QueiA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggPSB4ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgPSB5ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnogPSB6ICogbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMubWl4ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdGltZSAqICh2ZWN0b3IyLnggLSB2ZWN0b3IueCk7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdGltZSAqICh2ZWN0b3IyLnkgLSB2ZWN0b3IueSk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdGltZSAqICh2ZWN0b3IyLnogLSB2ZWN0b3Iueik7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5zdW0gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiArIHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLmRpZmZlcmVuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAtIHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb2R1Y3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKiB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICogdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAqIHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnF1b3RpZW50ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC8gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAvIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLyB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy56ZXJvID0gbmV3IHZlYzMoWzAsIDAsIDBdKTtcbiAgICB2ZWMzLm9uZSA9IG5ldyB2ZWMzKFsxLCAxLCAxXSk7XG4gICAgdmVjMy51cCA9IG5ldyB2ZWMzKFswLCAxLCAwXSk7XG4gICAgdmVjMy5yaWdodCA9IG5ldyB2ZWMzKFsxLCAwLCAwXSk7XG4gICAgdmVjMy5mb3J3YXJkID0gbmV3IHZlYzMoWzAsIDAsIDFdKTtcbiAgICByZXR1cm4gdmVjMztcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2ZWMzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjMy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciB2ZWM0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHZlYzQodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5encgPSB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwielwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcIndcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ4eVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ4eXpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieHl6d1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdLCB0aGlzLnZhbHVlc1szXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwiZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcImJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJhXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwicmdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwicmdiXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInJnYmFcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXSwgdGhpcy52YWx1ZXNbM11dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICB2ZWM0LnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgICAgIHRoaXMueiA9IDA7XG4gICAgICAgIHRoaXMudyA9IDA7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB0aGlzLng7XG4gICAgICAgIGRlc3QueSA9IHRoaXMueTtcbiAgICAgICAgZGVzdC56ID0gdGhpcy56O1xuICAgICAgICBkZXN0LncgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSAtdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSAtdGhpcy55O1xuICAgICAgICBkZXN0LnogPSAtdGhpcy56O1xuICAgICAgICBkZXN0LncgPSAtdGhpcy53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy54IC0gdmVjdG9yLngpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueSAtIHZlY3Rvci55KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnogLSB2ZWN0b3IueikgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy53IC0gdmVjdG9yLncpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5zcXVhcmVkTGVuZ3RoKCkpO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICs9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKz0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiArPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53ICs9IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLT0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAtPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56IC09IHZlY3Rvci56O1xuICAgICAgICB0aGlzLncgLT0gdmVjdG9yLnc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICo9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKj0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudyAqPSB2ZWN0b3IudztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC89IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLz0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudyAvPSB2ZWN0b3IudztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uICh2YWx1ZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC55ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnogKj0gdmFsdWU7XG4gICAgICAgIGRlc3QudyAqPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggKj0gMDtcbiAgICAgICAgICAgIGRlc3QueSAqPSAwO1xuICAgICAgICAgICAgZGVzdC56ICo9IDA7XG4gICAgICAgICAgICBkZXN0LncgKj0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEuMCAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC55ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC56ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC53ICo9IGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5tdWx0aXBseU1hdDQgPSBmdW5jdGlvbiAobWF0cml4LCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdHJpeC5tdWx0aXBseVZlYzQodGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWM0Lm1peCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHRpbWUgKiAodmVjdG9yMi54IC0gdmVjdG9yLngpO1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHRpbWUgKiAodmVjdG9yMi55IC0gdmVjdG9yLnkpO1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiArIHRpbWUgKiAodmVjdG9yMi56IC0gdmVjdG9yLnopO1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyArIHRpbWUgKiAodmVjdG9yMi53IC0gdmVjdG9yLncpO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQuc3VtID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKyB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53ICsgdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQuZGlmZmVyZW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56IC0gdmVjdG9yMi56O1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyAtIHZlY3RvcjIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb2R1Y3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKiB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICogdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAqIHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgKiB2ZWN0b3IyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5xdW90aWVudCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAvIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLyB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56IC8gdmVjdG9yMi56O1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyAvIHZlY3RvcjIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0Lnplcm8gPSBuZXcgdmVjNChbMCwgMCwgMCwgMV0pO1xuICAgIHZlYzQub25lID0gbmV3IHZlYzQoWzEsIDEsIDEsIDFdKTtcbiAgICByZXR1cm4gdmVjNDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2ZWM0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjNC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxMCwgR29vZ2xlIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlXG4gKiBtZXQ6XG4gKlxuICogICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmVcbiAqIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXJcbiAqIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGVcbiAqIGRpc3RyaWJ1dGlvbi5cbiAqICAgICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgR29vZ2xlIEluYy4gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tXG4gKiB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlNcbiAqIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1RcbiAqIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUlxuICogQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFRcbiAqIE9XTkVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLFxuICogU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVFxuICogTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsXG4gKiBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTllcbiAqIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBjb250YWlucyBmdW5jdGlvbnMgZXZlcnkgd2ViZ2wgcHJvZ3JhbSB3aWxsIG5lZWRcbiAqIGEgdmVyc2lvbiBvZiBvbmUgd2F5IG9yIGFub3RoZXIuXG4gKlxuICogSW5zdGVhZCBvZiBzZXR0aW5nIHVwIGEgY29udGV4dCBtYW51YWxseSBpdCBpcyByZWNvbW1lbmRlZCB0b1xuICogdXNlLiBUaGlzIHdpbGwgY2hlY2sgZm9yIHN1Y2Nlc3Mgb3IgZmFpbHVyZS4gT24gZmFpbHVyZSBpdFxuICogd2lsbCBhdHRlbXB0IHRvIHByZXNlbnQgYW4gYXBwcm9yaWF0ZSBtZXNzYWdlIHRvIHRoZSB1c2VyLlxuICpcbiAqICAgICAgIGdsID0gV2ViR0xVdGlscy5zZXR1cFdlYkdMKGNhbnZhcyk7XG4gKlxuICogRm9yIGFuaW1hdGVkIFdlYkdMIGFwcHMgdXNlIG9mIHNldFRpbWVvdXQgb3Igc2V0SW50ZXJ2YWwgYXJlXG4gKiBkaXNjb3VyYWdlZC4gSXQgaXMgcmVjb21tZW5kZWQgeW91IHN0cnVjdHVyZSB5b3VyIHJlbmRlcmluZ1xuICogbG9vcCBsaWtlIHRoaXMuXG4gKlxuICogICAgICAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICogICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1GcmFtZShyZW5kZXIsIGNhbnZhcyk7XG4gKlxuICogICAgICAgICAvLyBkbyByZW5kZXJpbmdcbiAqICAgICAgICAgLi4uXG4gKiAgICAgICB9XG4gKiAgICAgICByZW5kZXIoKTtcbiAqXG4gKiBUaGlzIHdpbGwgY2FsbCB5b3VyIHJlbmRlcmluZyBmdW5jdGlvbiB1cCB0byB0aGUgcmVmcmVzaCByYXRlXG4gKiBvZiB5b3VyIGRpc3BsYXkgYnV0IHdpbGwgc3RvcCByZW5kZXJpbmcgaWYgeW91ciBhcHAgaXMgbm90XG4gKiB2aXNpYmxlLlxuICovXG4vKipcbiAqIENyZWF0ZXMgdGhlIEhUTE0gZm9yIGEgZmFpbHVyZSBtZXNzYWdlXG4gKiBAcGFyYW0ge3N0cmluZ30gY2FudmFzQ29udGFpbmVySWQgaWQgb2YgY29udGFpbmVyIG9mIHRoIGNhbnZhcy5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGh0bWwuXG4gKi9cbnZhciBtYWtlRmFpbEhUTUwgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgcmV0dXJuIChcIlwiICtcbiAgICAgICAgJzx0YWJsZSBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICM4Q0U7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7XCI+PHRyPicgK1xuICAgICAgICAnPHRkIGFsaWduPVwiY2VudGVyXCI+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZGlzcGxheTogdGFibGUtY2VsbDsgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcIj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJcIj4nICtcbiAgICAgICAgbXNnICtcbiAgICAgICAgXCI8L2Rpdj5cIiArXG4gICAgICAgIFwiPC9kaXY+XCIgK1xuICAgICAgICBcIjwvdGQ+PC90cj48L3RhYmxlPlwiKTtcbn07XG4vKipcbiAqIE1lc2FzZ2UgZm9yIGdldHRpbmcgYSB3ZWJnbCBicm93c2VyXG4gKi9cbnZhciBHRVRfQV9XRUJHTF9CUk9XU0VSID0gXCJcIiArXG4gICAgXCJUaGlzIHBhZ2UgcmVxdWlyZXMgYSBicm93c2VyIHRoYXQgc3VwcG9ydHMgV2ViR0wuPGJyLz5cIiArXG4gICAgJzxhIGhyZWY9XCJodHRwOi8vZ2V0LndlYmdsLm9yZ1wiPkNsaWNrIGhlcmUgdG8gdXBncmFkZSB5b3VyIGJyb3dzZXIuPC9hPic7XG4vKipcbiAqIE1lc2FzZ2UgZm9yIG5lZWQgYmV0dGVyIGhhcmR3YXJlXG4gKi9cbnZhciBPVEhFUl9QUk9CTEVNID0gXCJJdCBkb2Vzbid0IGFwcGVhciB5b3VyIGNvbXB1dGVyIGNhbiBzdXBwb3J0XFxuV2ViR0wuPGJyLz4gPGEgaHJlZj1cXFwiaHR0cDovL2dldC53ZWJnbC5vcmcvdHJvdWJsZXNob290aW5nL1xcXCI+Q2xpY2sgaGVyZSBmb3JcXG5tb3JlIGluZm9ybWF0aW9uLjwvYT5cIjtcbi8qKlxuICogQ3JlYXRlcyBhIHdlYmdsIGNvbnRleHQuXG4gKiBAcGFyYW0geyFDYW52YXN9IGNhbnZhcyBUaGUgY2FudmFzIHRhZyB0byBnZXQgY29udGV4dCBmcm9tLiBJZiBvbmUgaXMgbm90XG4gKiBwYXNzZWQgaW4gb25lIHdpbGwgYmUgY3JlYXRlZC5cbiAqIEByZXR1cm4geyFXZWJHTENvbnRleHR9IFRoZSBjcmVhdGVkIGNvbnRleHQuXG4gKi9cbmV4cG9ydHMuY3JlYXRlM0RDb250ZXh0ID0gZnVuY3Rpb24gKGNhbnZhcywgb3B0QXR0cmlicykge1xuICAgIHZhciBuYW1lcyA9IFtcIndlYmdsXCIsIFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIFwid2Via2l0LTNkXCIsIFwibW96LXdlYmdsXCJdO1xuICAgIHZhciBjb250ZXh0ID0gbnVsbDtcbiAgICBmb3IgKHZhciBfaSA9IDAsIG5hbWVzXzEgPSBuYW1lczsgX2kgPCBuYW1lc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgbiA9IG5hbWVzXzFbX2ldO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KG4sIG9wdEF0dHJpYnMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZXh0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbmFibGUgdG8gY3JlYXRlIDNEIGNvbnRleHRcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0O1xufTtcbi8qKlxuICogQ3JlYXRlcyBhIHdlYmdsIGNvbnRleHQuIElmIGNyZWF0aW9uIGZhaWxzIGl0IHdpbGxcbiAqIGNoYW5nZSB0aGUgY29udGVudHMgb2YgdGhlIGNvbnRhaW5lciBvZiB0aGUgPGNhbnZhcz5cbiAqIHRhZyB0byBhbiBlcnJvciBtZXNzYWdlIHdpdGggdGhlIGNvcnJlY3QgbGlua3MgZm9yIFdlYkdMLlxuICogQHBhcmFtIHtFbGVtZW50fSBjYW52YXMgVGhlIGNhbnZhcyBlbGVtZW50IHRvIGNyZWF0ZSBhIGNvbnRleHQgZnJvbS5cbiAqIEBwYXJhbSB7V2ViR0xDb250ZXh0Q3JlYXRpb25BdHRpcmJ1dGVzfSBvcHRfYXR0cmlicyBBbnkgY3JlYXRpb25cbiAqIGF0dHJpYnV0ZXMgeW91IHdhbnQgdG8gcGFzcyBpbi5cbiAqIEByZXR1cm4ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gVGhlIGNyZWF0ZWQgY29udGV4dC5cbiAqL1xuZXhwb3J0cy5zZXR1cFdlYkdMID0gZnVuY3Rpb24gKGNhbnZhcywgb3B0QXR0cmlicykge1xuICAgIHZhciBzaG93TGluayA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNhbnZhcy5wYXJlbnROb2RlO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gbWFrZUZhaWxIVE1MKHN0cik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmICghd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCkge1xuICAgICAgICBzaG93TGluayhHRVRfQV9XRUJHTF9CUk9XU0VSKTtcbiAgICB9XG4gICAgdmFyIGNvbnRleHQgPSBleHBvcnRzLmNyZWF0ZTNEQ29udGV4dChjYW52YXMsIG9wdEF0dHJpYnMpO1xuICAgIGlmICghY29udGV4dCkge1xuICAgICAgICBzaG93TGluayhPVEhFUl9QUk9CTEVNKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQ7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9d2ViZ2wtdXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgd2ViZ2xfdXRpbHNfMSA9IHJlcXVpcmUoXCIuL2xpYi93ZWJnbC11dGlsc1wiKTtcbnZhciBpbml0U2hhZGVyc18xID0gcmVxdWlyZShcIi4vbGliL2luaXRTaGFkZXJzXCIpO1xudmFyIGZpbGVNb2RlXzEgPSByZXF1aXJlKFwiLi9maWxlTW9kZVwiKTtcbnZhciB2ZWM0XzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzRcIik7XG4vKipcbiAqIGZsYXR0ZW5zIGEgMkQgYXJyYXkgaW50byBhIDFEIGFycmF5XG4gKiBAcGFyYW0gYXJyIGFuIGFycmF5IG9mIGFycmF5c1xuICovXG5mdW5jdGlvbiBmbGF0dGVuKGFycikge1xuICAgIHZhciBfYTtcbiAgICByZXR1cm4gKF9hID0gbmV3IEFycmF5KCkpLmNvbmNhdC5hcHBseShfYSwgYXJyKTtcbn1cbi8qKlxuICogY3JlYXRlIGEgPGNhbnZhcz4gZWxlbWVudCBhbmQgYWRkIGl0IHRvIHRoZSAjY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGNhbnZhc1xuICovXG5mdW5jdGlvbiBjcmVhdGVDYW52YXMoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICAvLyByZW1vdmUgYW55IGV4aXN0aW5nIGNhbnZhc1xuICAgIChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViZ2xcIikpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZW1vdmUoKTtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICBjYW52YXMud2lkdGggPSA4MDA7XG4gICAgY2FudmFzLmhlaWdodCA9IDQwMDtcbiAgICBjYW52YXMuaWQgPSBcIndlYmdsXCI7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgIHJldHVybiBjYW52YXM7XG59XG5mdW5jdGlvbiBtYWluKCkge1xuICAgIC8vIGNyZWF0ZSB0aGUgPGNhbnZhcz4gZWxlbWVudFxuICAgIHZhciBjYW52YXMgPSBjcmVhdGVDYW52YXMoKTtcbiAgICAvLyBjcmVhdGUgdGhlIGZpbGUgdXBsb2FkIGlucHV0XG4gICAgdmFyIGlucHV0ID0gZmlsZU1vZGVfMS5jcmVhdGVGaWxlSW5wdXQoKTtcbiAgICAvLyBnZXQgdGhlIHJlbmRlcmluZyBjb250ZXh0IGZvciBXZWJHTFxuICAgIHZhciBnbCA9IHdlYmdsX3V0aWxzXzEuc2V0dXBXZWJHTChjYW52YXMpO1xuICAgIGlmIChnbCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGdldCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgZm9yIFdlYkdMXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGluaXRpYWxpemUgc2hhZGVyc1xuICAgIHZhciBwcm9ncmFtID0gaW5pdFNoYWRlcnNfMS5pbml0U2hhZGVycyhnbCwgXCJ2c2hhZGVyXCIsIFwiZnNoYWRlclwiKTtcbiAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xuICAgIC8vIHNldCB1cCB0aGUgdmlld3BvcnRcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIHZhciBwb2ludHMgPSBbXG4gICAgICAgIG5ldyB2ZWM0XzEuZGVmYXVsdChbLTAuNSwgLTAuNSwgMC4wLCAxLjBdKSxcbiAgICAgICAgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjUsIC0wLjUsIDAuMCwgMS4wXSksXG4gICAgICAgIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4wLCAwLjUsIDAuMCwgMS4wXSlcbiAgICBdO1xuICAgIHZhciB2QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXkuZnJvbShmbGF0dGVuKHBvaW50cy5tYXAoZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAueHl6dzsgfSkpKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIHZhciB2UG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcInZQb3NpdGlvblwiKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2UG9zaXRpb24pO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodlBvc2l0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgIHZhciBjb2xvcnMgPSBbXG4gICAgICAgIG5ldyB2ZWM0XzEuZGVmYXVsdChbMS4wLCAwLjAsIDAuMCwgMS4wXSksXG4gICAgICAgIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4wLCAxLjAsIDAuMCwgMS4wXSksXG4gICAgICAgIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4wLCAwLjAsIDEuMCwgMS4wXSlcbiAgICBdO1xuICAgIHZhciBjQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGNCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXkuZnJvbShmbGF0dGVuKGNvbG9ycy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMueHl6dzsgfSkpKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIHZhciB2Q29sb3IgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcInZDb2xvclwiKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2Q29sb3IpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodkNvbG9yLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgIHZhciB2UG9pbnRTaXplID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidlBvaW50U2l6ZVwiKTtcbiAgICBnbC51bmlmb3JtMWYodlBvaW50U2l6ZSwgMjAuMCk7XG4gICAgLy8gc2V0IGNsZWFyIGNvbG9yXG4gICAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBwb2ludHMubGVuZ3RoKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBrZXkgPSBldi5rZXk7XG4gICAgICAgIGlmIChrZXkgPT09IFwiYVwiKSB7XG4gICAgICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuUE9JTlRTLCAwLCBwb2ludHMubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09IFwic1wiKSB7XG4gICAgICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBwb2ludHMubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9KTtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZmlsZU1vZGVfMS5nZXRJbnB1dChpbnB1dCkudGhlbihmaWxlTW9kZV8xLnBhcnNlRmlsZVRleHQpO1xuICAgIH0pO1xufVxud2luZG93Lm9ubG9hZCA9IG1haW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCJdfQ==

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
var helpers_1 = require("./helpers");
var vec4_1 = require("./lib/tsm/vec4");
/** how far apart siblings are */
var X_SEPARATION = 3;
/** how far apart parents and children are */
var Y_SEPARATION = 1.5;
var lightPosition = new vec4_1.default([1.0, 1.0, -1.0, 0.0]);
var lightAmbient = new vec4_1.default([0.2, 0.2, 0.2, 1.0]);
var lightDiffuse = new vec4_1.default([1.0, 1.0, 1.0, 1.0]);
var lightSpecular = new vec4_1.default([1.0, 1.0, 1.0, 1.0]);
var materialAmbient = new vec4_1.default([1.0, 1.0, 1.0, 1.0]);
var materialDiffuse = new vec4_1.default([1.0, 1.0, 1.0, 1.0]);
var materialShininess = 20.0;
/**
 * This is one element of the mobile tree hierarchy. It may have children or a
 * parent
 */
var MobileElement = /** @class */ (function () {
    /**
     * creates a new element with a model
     * @param mesh the polygons of the model
     * @param color the r, g, b, a components of this mesh's color
     */
    function MobileElement(mesh, color) {
        /** whether to draw the mesh as a wireframe */
        this.wireframe = false;
        this.mesh = mesh;
        // convert mesh into Float32Array for webgl
        this.vertices = helpers_1.flatten(mesh);
        this.pointData = Float32Array.from(helpers_1.flatten(this.vertices.map(function (vec) { return [vec.x, vec.y, vec.z, 1.0]; })));
        this.children = new Array();
        this.parent = undefined;
        this.color = color;
        // calculate normals
        this.normalData = new Float32Array(0);
        this.calculateNormals(false);
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
    MobileElement.prototype.addChild = function (child) {
        if (this.children.length === 0)
            this.addLayer();
        if (this.parent !== undefined)
            this.nextRotDir = (-1 * this.parent.nextRotDir);
        this.children.push(child);
        child.parent = this;
        this.setChildrenWidth();
    };
    /** increment layersBelow for this mobile element and all its parents */
    MobileElement.prototype.addLayer = function () {
        this.layersBelow++;
        if (this.parent !== undefined)
            this.parent.addLayer();
    };
    /**
     * set children width for this mobile element and all its parents
     */
    MobileElement.prototype.setChildrenWidth = function () {
        this.childrenWidth = this.children.reduce(function (prev, cur) { return prev + cur.childrenWidth; }, 0);
        if (this.parent !== undefined) {
            this.parent.setChildrenWidth();
        }
    };
    /** get the total width necessary to fit this mobile on screen */
    MobileElement.prototype.getTotalWidth = function () {
        return this.childrenWidth * X_SEPARATION;
    };
    /** get the total height necessary to fit this mobile on screen */
    MobileElement.prototype.getTotalHeight = function () {
        return this.layersBelow * Y_SEPARATION;
    };
    /**
     * recursively draws this element and each of its children on the canvas
     * @param gl the WebGL rendering context to draw to
     * @param program the WebGL program we're using
     * @param mvMatrix the model view matrix
     * @param flat whether to use flat shading
     */
    MobileElement.prototype.draw = function (gl, program, mvMatrix) {
        var _this = this;
        var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
        // buffer vertex data
        var pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.pointData, gl.STATIC_DRAW);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        // buffer normals
        var vNormal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalData, gl.STATIC_DRAW);
        var vNormalPosition = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormalPosition);
        // apply a rotation to spin this shape
        var rotatedMatrix = mvMatrix
            .copy()
            .rotate(this.rotDir * this.rotSpeed * this.rotStep++, new vec3_1.default([0, 1, 0]));
        if (rotatedMatrix === null)
            throw new Error("Failed to rotate");
        gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(rotatedMatrix.all()));
        // set lighting attributes
        var diffuseProduct = vec4_1.default.product(vec4_1.default.product(lightDiffuse, this.color), this.color);
        var specularProduct = vec4_1.default.product(lightSpecular, materialDiffuse);
        var ambientProduct = vec4_1.default.product(vec4_1.default.product(lightAmbient, materialAmbient), this.color);
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), Float32Array.from(diffuseProduct.xyzw));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), Float32Array.from(specularProduct.xyzw));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), Float32Array.from(ambientProduct.xyzw));
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), Float32Array.from(lightPosition.xyzw));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
        // draw wireframe or solid object
        if (this.wireframe) {
            for (var i = 0; i < this.vertices.length - 2; i += 3) {
                gl.drawArrays(gl.LINE_LOOP, i, 3);
            }
        }
        else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
        }
        // draw top string
        if (this.parent !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from([0, Y_SEPARATION / 2, 0, 1, 0, 0, 0, 1]), gl.STATIC_DRAW);
            gl.drawArrays(gl.LINES, 0, 2);
        }
        // rotate the whole next layer
        var layerMatrix = mvMatrix
            .copy()
            .rotate(this.nextRotDir * this.nextRotSpeed * this.nextRotStep++, new vec3_1.default([0, 1, 0]));
        if (layerMatrix === null)
            throw new Error("Layer matrix is null");
        gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(layerMatrix.all()));
        // draw strings connecting the layer
        var strings = this.getNextLevelStrings();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(helpers_1.flatten(strings.map(function (v) { return v.xyzw; }))), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINES, 0, strings.length);
        this.children.forEach(function (child, index) {
            // offset children so they all fit side by side
            var n = _this.childrenWidth;
            var c = _this.children.length / n;
            var xPos = n < 2 ? 0 : X_SEPARATION * (index / c - (n - 1) / 2);
            var translatedMatrix = layerMatrix
                .copy()
                .translate(new vec3_1.default([xPos, -Y_SEPARATION, 0]));
            // draw children
            child.draw(gl, program, translatedMatrix);
        });
    };
    /**
     * gets the horizontal string and the bottom half of the vertical string used
     * to draw the next layer
     */
    MobileElement.prototype.getNextLevelStrings = function () {
        var out = new Array();
        // top
        if (this.children.length !== 0) {
            out.push(new vec4_1.default([0, 0, 0, 1]));
            out.push(new vec4_1.default([0, -Y_SEPARATION / 2, 0, 1]));
        }
        // horizontal
        out.push(new vec4_1.default([
            -(X_SEPARATION * (this.childrenWidth - 1)) / 2,
            -Y_SEPARATION / 2,
            0,
            1
        ]));
        out.push(new vec4_1.default([
            (X_SEPARATION * (this.childrenWidth - 1)) / 2,
            -Y_SEPARATION / 2,
            0,
            1
        ]));
        return out;
    };
    /**
     * recalculates normals based on shading type, then does the same for all
     * children
     * @param flat whether to do flat shading
     */
    MobileElement.prototype.calculateNormals = function (flat) {
        var normals = [];
        for (var _i = 0, _a = this.mesh; _i < _a.length; _i++) {
            var poly = _a[_i];
            var temp = helpers_1.normal(poly);
            var n = new vec4_1.default([temp.x, temp.y, temp.z, 0.0]);
            for (var _b = 0, poly_1 = poly; _b < poly_1.length; _b++) {
                var vec = poly_1[_b];
                if (flat)
                    normals.push(n);
                else
                    normals.push(new vec4_1.default([vec.x, vec.y, vec.z, 0.0]));
            }
        }
        this.normalData = Float32Array.from(helpers_1.flatten(normals.map(function (a) { return a.xyzw; })));
        // repeat down the tree
        this.children.map(function (child) { return child.calculateNormals(flat); });
    };
    /**
     * adds a new element somewhere below this one
     * @param mesh mesh to add
     * @param color color of mesh
     */
    MobileElement.prototype.randomAdd = function (mesh, color) {
        var r = Math.random();
        if (r < 1 / (this.children.length + 1)) {
            this.addChild(new MobileElement(mesh, color));
            return;
        }
        this.children[Math.floor(r * this.children.length)].addChild(new MobileElement(mesh, color));
    };
    return MobileElement;
}());
exports.MobileElement = MobileElement;

},{"./helpers":3,"./lib/tsm/vec3":10,"./lib/tsm/vec4":11}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
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
 * parses the text of an input file and returns the object's vertices and faces
 * in a promise
 * @param str the input file's text as a string
 * @returns polygons the list of polygons as vec3 arrays
 * @returns extents the X, Y, and Z bounds of the figure
 */
exports.parseFileText = function (str) {
    var numVertices = 0;
    var numPolygons = 0;
    var headerDone = false;
    var vertexCounter = 0;
    var polygonCounter = 0;
    var minX = Infinity;
    var minY = Infinity;
    var minZ = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var maxZ = -Infinity;
    // x y z coordinates of each vertex
    var vertices = new Array(numVertices);
    // each polygon is an array of vertices
    var polygons = new Array(numPolygons);
    var lines = str.split("\n").map(function (w) { return w.toLowerCase().trim(); });
    if (lines[0] !== "ply") {
        throw new Error("First line of input file must by 'ply'");
    }
    for (var lineNum = 1; lineNum < lines.length; ++lineNum) {
        var words = lines[lineNum]
            .trim()
            .replace(/\s+/g, " ")
            .split(" ");
        if (words.length === 0 || words[0] === "")
            continue;
        if (!headerDone) {
            // parsing header
            if (words[0] === "end_header") {
                headerDone = true;
                vertices = new Array(numVertices);
                polygons = new Array(numPolygons);
                continue;
            }
            if (words[0] === "format")
                continue;
            if (words[0] === "element") {
                if (words[1] === "vertex")
                    numVertices = parseInt(words[2]);
                if (words[1] === "face")
                    numPolygons = parseInt(words[2]);
            }
            if (words[0] === "property") {
                if (words[1] === "float32" || words[1] === "list")
                    continue;
            }
        }
        else if (vertexCounter < numVertices) {
            // parsing vertices
            var v = new vec3_1.default(words.slice(0, 3).map(parseFloat));
            vertices[vertexCounter] = v;
            // check to see if this goes beyond our existing extents
            if (v.x < minX)
                minX = v.x;
            if (v.y < minY)
                minY = v.y;
            if (v.z < minZ)
                minZ = v.z;
            if (v.x > maxX)
                maxX = v.x;
            if (v.y > maxY)
                maxY = v.y;
            if (v.z > maxZ)
                maxZ = v.z;
            vertexCounter++;
        }
        else {
            // parsing polygons
            polygons[polygonCounter] = words.slice(1).map(function (w) { return vertices[parseInt(w)]; });
            polygonCounter++;
        }
    }
    return {
        polygons: polygons,
        extents: {
            minX: minX,
            minY: minY,
            minZ: minZ,
            maxX: maxX,
            maxY: maxY,
            maxZ: maxZ
        }
    };
};

},{"./lib/tsm/vec3":10}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
/**
 * flattens a 2D array into a 1D array
 * @param arr an array of arrays
 */
function flatten(arr) {
    var _a;
    return (_a = new Array()).concat.apply(_a, arr);
}
exports.flatten = flatten;
/**
 * calculates the normal vector for a triangle made up of three points using the
 * Newell method
 */
exports.normal = function (points) {
    var end = points.length - 1;
    var x = (points[end].y - points[0].y) * (points[end].z + points[0].z);
    var y = (points[end].z - points[0].z) * (points[end].x + points[0].x);
    var z = (points[end].x - points[0].x) * (points[end].y + points[0].y);
    for (var i = 0; i < points.length - 1; ++i) {
        x += (points[i].y - points[i + 1].y) * (points[i].z + points[i + 1].z);
        y += (points[i].z - points[i + 1].z) * (points[i].x + points[i + 1].x);
        z += (points[i].x - points[i + 1].x) * (points[i].y + points[i + 1].y);
    }
    return new vec3_1.default([x, y, z]).normalize();
};
//vec3.cross(vec3.difference(p2, p0), vec3.difference(p1, p0)).normalize();
/**
 * moves the polygon outward along the normal vector by the given distance,
 * returning the restulting polygon
 */
exports.pulse = function (polygon, distance) {
    return polygon.map(function (point) { return vec3_1.default.difference(point, exports.normal(polygon).scale(distance)); });
};
/**
 * converts a fractional color value to a 2-digit hex string
 * @param num a color value from 0 to 1
 */
exports.toHex = function (num) {
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
exports.createCanvas = function () {
    var _a, _b;
    // remove any existing canvas
    (_a = document.getElementById("webgl")) === null || _a === void 0 ? void 0 : _a.remove();
    var canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    canvas.id = "webgl";
    (_b = document.getElementById("canvas-container")) === null || _b === void 0 ? void 0 : _b.appendChild(canvas);
    return canvas;
};
/**
 * create an <input type="color"> element and add it to #input-container
 * @return the created input element
 */
exports.createColorInput = function () {
    var _a, _b;
    // remove any existing input
    (_a = document.getElementById("color-picker-container")) === null || _a === void 0 ? void 0 : _a.remove();
    var input = document.createElement("input");
    input.value = "#ffffff";
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
 * mixes two vectors according to a ratio
 * @param u first vector
 * @param v second vector
 * @param s ratio of first to second
 */
exports.mix = function (u, v, s) {
    return new vec3_1.default([
        (1 - s) * u.x + s * v.x,
        (1 - s) * u.y + s * v.y,
        (1 - s) * u.z + s * v.z
    ]);
};

},{"./lib/tsm/vec3":10}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epsilon = 0.00001;

},{}],6:[function(require,module,exports){
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

},{"./constants":5,"./mat4":7,"./quat":8,"./vec2":9,"./vec3":10}],7:[function(require,module,exports){
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

},{"./constants":5,"./mat3":6,"./vec3":10,"./vec4":11}],8:[function(require,module,exports){
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

},{"./constants":5,"./mat3":6,"./mat4":7,"./vec3":10}],9:[function(require,module,exports){
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

},{"./constants":5,"./vec3":10}],10:[function(require,module,exports){
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

},{"./constants":5,"./quat":8}],11:[function(require,module,exports){
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

},{"./constants":5}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
"use strict";
/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 1
 */
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var initShaders_1 = require("./lib/initShaders");
var webgl_utils_1 = require("./lib/webgl-utils");
var render_1 = require("./render");
var file_1 = require("./file");
var MobileElement_1 = require("./MobileElement");
var models_1 = require("./models");
var vec4_1 = require("./lib/tsm/vec4");
/**
 * All global variables are stored in this object to make them accessible from
 * any module
 */
exports.GLOBALS = {
    /**
     * global variable used to store the ID of the animation callback so it can be
     * cancelled later
     */
    callbackID: undefined
};
function main() {
    // create the <canvas> element
    var canvas = helpers_1.createCanvas();
    // create file input
    var fileInput = file_1.createFileInput();
    // create the mobile
    var mobile = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([0.0, 0.0, 1.0, 1]));
    //mobile.nextRotDir = 1;
    mobile.nextRotSpeed = Math.PI / 360;
    // level 1
    var a1 = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([1, 0.0, 0.0, 1]));
    //a1.nextRotDir = -1;
    var a2 = new MobileElement_1.MobileElement(models_1.getSphere(), new vec4_1.default([0.98, 1, 0.07, 1]));
    var a3 = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([0.25, 0.92, 0.83, 1]));
    mobile.addChild(a1);
    mobile.addChild(a2);
    mobile.addChild(a3);
    // level 2
    var b1 = new MobileElement_1.MobileElement(models_1.getSphere(), new vec4_1.default([0.32, 0.28, 0.61, 1]));
    //b1.nextRotDir = 1;
    b1.nextRotSpeed = Math.PI / 180;
    var b2 = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([0.35, 0.76, 0.76, 1]));
    var b3 = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([0.75, 0.87, 0.52, 1]));
    //b3.nextRotDir = 1;
    b3.nextRotSpeed = Math.PI / 180;
    a1.addChild(b1);
    a1.addChild(b2);
    a3.addChild(b3);
    // level 3
    var c1 = new MobileElement_1.MobileElement(models_1.getSphere(), new vec4_1.default([0.49, 0.87, 0.39, 1]));
    var c2 = new MobileElement_1.MobileElement(models_1.getSphere(), new vec4_1.default([0.89, 0.71, 0.02, 1]));
    var c3 = new MobileElement_1.MobileElement(models_1.getSphere(), new vec4_1.default([0.03, 0.3, 0.38, 1]));
    var c4 = new MobileElement_1.MobileElement(models_1.getCube(), new vec4_1.default([0.41, 0.92, 0.82, 1]));
    b1.addChild(c1);
    b3.addChild(c2);
    b3.addChild(c3);
    b3.addChild(c4);
    mobile.randomAdd(models_1.getSphere(), new vec4_1.default([1.0, 0, 0, 1]));
    // get the rendering context for WebGL
    var gl = webgl_utils_1.setupWebGL(canvas);
    if (gl === null) {
        console.error("Failed to get the rendering context for WebGL");
        return;
    }
    // initialize shaders
    var program = initShaders_1.initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    // angle of the spotlight
    var phi = 0.9;
    // handle a file being uploaded
    fileInput.addEventListener("change", function () {
        file_1.getInput(fileInput)
            .then(file_1.parseFileText)
            .then(function (obj) {
            obj;
            // TODO add object to the mobile
        });
    });
    var startDrawing = function () {
        // cancel any existing animation
        if (exports.GLOBALS.callbackID !== undefined)
            cancelAnimationFrame(exports.GLOBALS.callbackID);
        // start rendering
        render_1.render(canvas, gl, program, mobile);
    };
    // handle keyboard input
    document.addEventListener("keydown", function (ev) {
        var key = ev.key.toLowerCase();
        if (key === "p") {
            if (ev.shiftKey)
                phi += 0.01;
            else
                phi -= 0.01;
            gl.uniform1f(gl.getUniformLocation(program, "phi"), phi);
        }
        if (key === "m") {
            if (ev.shiftKey)
                mobile.calculateNormals(true);
            else
                mobile.calculateNormals(false);
        }
    });
    startDrawing();
}
window.onload = main;

},{"./MobileElement":1,"./file":2,"./helpers":3,"./lib/initShaders":4,"./lib/tsm/vec4":11,"./lib/webgl-utils":12,"./models":14,"./render":15}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
var helpers_1 = require("./helpers");
/** helper function for generating vertices of a cube */
var quad = function (a, b, c, d) {
    var vertices = [
        new vec3_1.default([-0.5, -0.5, 0.5]),
        new vec3_1.default([-0.5, 0.5, 0.5]),
        new vec3_1.default([0.5, 0.5, 0.5]),
        new vec3_1.default([0.5, -0.5, 0.5]),
        new vec3_1.default([-0.5, -0.5, -0.5]),
        new vec3_1.default([-0.5, 0.5, -0.5]),
        new vec3_1.default([0.5, 0.5, -0.5]),
        new vec3_1.default([0.5, -0.5, -0.5])
    ];
    return [a, b, c, a, c, d].map(function (x) { return vertices[x]; });
};
/** generates a cube model */
exports.getCube = function () { return [
    quad(1, 0, 3, 2),
    quad(2, 3, 7, 6),
    quad(3, 0, 4, 7),
    quad(6, 5, 1, 2),
    quad(4, 5, 6, 7),
    quad(5, 4, 0, 1) // left
]; };
/** subdivides a tetrahedron towards approximating a sphere */
var divideTriangle = function (a, b, c, count) {
    if (count > 0) {
        var ab = helpers_1.mix(a, b, 0.5).normalize();
        var ac = helpers_1.mix(a, c, 0.5).normalize();
        var bc = helpers_1.mix(b, c, 0.5).normalize();
        return helpers_1.flatten([
            divideTriangle(a, ab, ac, count - 1),
            divideTriangle(bc, c, ac, count - 1),
            divideTriangle(ab, b, bc, count - 1),
            divideTriangle(ab, bc, ac, count - 1)
        ]);
    }
    else {
        return [[a, b, c]];
    }
};
/** creates a tetrahedron */
var tetrahedron = function (a, b, c, d, n) {
    return helpers_1.flatten([
        divideTriangle(a, b, c, n),
        divideTriangle(d, c, b, n),
        divideTriangle(a, d, b, n),
        divideTriangle(a, c, d, n)
    ]);
};
/** returns the faces of a sphere approximation */
exports.getSphere = function () {
    var va = new vec3_1.default([0.0, 0.0, -1.0]);
    var vb = new vec3_1.default([0.0, 0.942809, 0.333333]);
    var vc = new vec3_1.default([-0.816497, -0.471405, 0.333333]);
    var vd = new vec3_1.default([0.816497, -0.471405, 0.333333]);
    var tet = tetrahedron(va, vb, vc, vd, 4);
    return tet.map(function (tri) {
        return tri.map(function (vec) { return new vec3_1.default([vec.x * 0.5, vec.y * 0.5, vec.z * 0.5]); });
    });
};

},{"./helpers":3,"./lib/tsm/vec3":10}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mat4_1 = require("./lib/tsm/mat4");
var vec3_1 = require("./lib/tsm/vec3");
var main_1 = require("./main");
/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param polygons the list of polygons, represented as arrays of vec3s
 * @param extents the max and min dimensions of the model
 */
exports.render = function (canvas, gl, program, mobile) {
    // set view port and clear canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // set perspective transform
    var aspectRatio = 1;
    var fovY = 45;
    var projMatrix = mat4_1.default.perspective(fovY, aspectRatio, 0.01, 100);
    var projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projMatrixLoc, false, Float32Array.from(projMatrix.all()));
    var eyeVec = new vec3_1.default([0, 0, 2]);
    var lookVec = new vec3_1.default([0, 0, 0]);
    var upVec = new vec3_1.default([0, 1, 0]);
    var modelView = mat4_1.default.lookAt(eyeVec, lookVec, upVec);
    // scale and translate to fit the mobile
    var s = 1 / Math.max(mobile.getTotalWidth(), mobile.getTotalHeight());
    modelView
        .scale(new vec3_1.default([s, s, s]))
        .translate(new vec3_1.default([0, mobile.getTotalHeight() / 2, 0]));
    mobile.draw(gl, program, modelView);
    main_1.GLOBALS.callbackID = requestAnimationFrame(function () {
        exports.render(canvas, gl, program, mobile);
    });
};

},{"./lib/tsm/mat4":7,"./lib/tsm/vec3":10,"./main":13}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9maW5hbHByb2plY3QxL01vYmlsZUVsZW1lbnQuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2ZpbGUuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2hlbHBlcnMuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2xpYi9pbml0U2hhZGVycy5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDEvbGliL3RzbS9jb25zdGFudHMuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2xpYi90c20vbWF0My5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDEvbGliL3RzbS9tYXQ0LmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0MS9saWIvdHNtL3F1YXQuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2xpYi90c20vdmVjMi5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDEvbGliL3RzbS92ZWMzLmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0MS9saWIvdHNtL3ZlYzQuanMiLCJidWlsZC9maW5hbHByb2plY3QxL2xpYi93ZWJnbC11dGlscy5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDEvbWFpbi5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDEvbW9kZWxzLmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0MS9yZW5kZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjM1wiKTtcbnZhciBoZWxwZXJzXzEgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpO1xudmFyIHZlYzRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjNFwiKTtcbi8qKiBob3cgZmFyIGFwYXJ0IHNpYmxpbmdzIGFyZSAqL1xudmFyIFhfU0VQQVJBVElPTiA9IDM7XG4vKiogaG93IGZhciBhcGFydCBwYXJlbnRzIGFuZCBjaGlsZHJlbiBhcmUgKi9cbnZhciBZX1NFUEFSQVRJT04gPSAxLjU7XG52YXIgbGlnaHRQb3NpdGlvbiA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMS4wLCAxLjAsIC0xLjAsIDAuMF0pO1xudmFyIGxpZ2h0QW1iaWVudCA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4yLCAwLjIsIDAuMiwgMS4wXSk7XG52YXIgbGlnaHREaWZmdXNlID0gbmV3IHZlYzRfMS5kZWZhdWx0KFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcbnZhciBsaWdodFNwZWN1bGFyID0gbmV3IHZlYzRfMS5kZWZhdWx0KFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcbnZhciBtYXRlcmlhbEFtYmllbnQgPSBuZXcgdmVjNF8xLmRlZmF1bHQoWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xudmFyIG1hdGVyaWFsRGlmZnVzZSA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMS4wLCAxLjAsIDEuMCwgMS4wXSk7XG52YXIgbWF0ZXJpYWxTaGluaW5lc3MgPSAyMC4wO1xuLyoqXG4gKiBUaGlzIGlzIG9uZSBlbGVtZW50IG9mIHRoZSBtb2JpbGUgdHJlZSBoaWVyYXJjaHkuIEl0IG1heSBoYXZlIGNoaWxkcmVuIG9yIGFcbiAqIHBhcmVudFxuICovXG52YXIgTW9iaWxlRWxlbWVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBjcmVhdGVzIGEgbmV3IGVsZW1lbnQgd2l0aCBhIG1vZGVsXG4gICAgICogQHBhcmFtIG1lc2ggdGhlIHBvbHlnb25zIG9mIHRoZSBtb2RlbFxuICAgICAqIEBwYXJhbSBjb2xvciB0aGUgciwgZywgYiwgYSBjb21wb25lbnRzIG9mIHRoaXMgbWVzaCdzIGNvbG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gTW9iaWxlRWxlbWVudChtZXNoLCBjb2xvcikge1xuICAgICAgICAvKiogd2hldGhlciB0byBkcmF3IHRoZSBtZXNoIGFzIGEgd2lyZWZyYW1lICovXG4gICAgICAgIHRoaXMud2lyZWZyYW1lID0gZmFsc2U7XG4gICAgICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgICAgIC8vIGNvbnZlcnQgbWVzaCBpbnRvIEZsb2F0MzJBcnJheSBmb3Igd2ViZ2xcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IGhlbHBlcnNfMS5mbGF0dGVuKG1lc2gpO1xuICAgICAgICB0aGlzLnBvaW50RGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKHRoaXMudmVydGljZXMubWFwKGZ1bmN0aW9uICh2ZWMpIHsgcmV0dXJuIFt2ZWMueCwgdmVjLnksIHZlYy56LCAxLjBdOyB9KSkpO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSBub3JtYWxzXG4gICAgICAgIHRoaXMubm9ybWFsRGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoMCk7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlTm9ybWFscyhmYWxzZSk7XG4gICAgICAgIHRoaXMucm90RGlyID0gMTtcbiAgICAgICAgdGhpcy5yb3RTcGVlZCA9IE1hdGguUEkgLyAxODA7XG4gICAgICAgIHRoaXMucm90U3RlcCA9IDA7XG4gICAgICAgIHRoaXMubmV4dFJvdERpciA9IDE7XG4gICAgICAgIHRoaXMubmV4dFJvdFNwZWVkID0gTWF0aC5QSSAvIDM2MDtcbiAgICAgICAgdGhpcy5uZXh0Um90U3RlcCA9IDA7XG4gICAgICAgIHRoaXMubGF5ZXJzQmVsb3cgPSAwO1xuICAgICAgICB0aGlzLmNoaWxkcmVuV2lkdGggPSAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBhZGRzIGEgbW9iaWxlIGVsZW1lbnQgb25lIGxldmVsIGJlbG93IHRoaXMgb25lXG4gICAgICogQHBhcmFtIGNoaWxkIHRoZSBtb2JpbGUgZWxlbWVudCBjaGlsZFxuICAgICAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLmFkZENoaWxkID0gZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmICh0aGlzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXIoKTtcbiAgICAgICAgaWYgKHRoaXMucGFyZW50ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICB0aGlzLm5leHRSb3REaXIgPSAoLTEgKiB0aGlzLnBhcmVudC5uZXh0Um90RGlyKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcbiAgICAgICAgdGhpcy5zZXRDaGlsZHJlbldpZHRoKCk7XG4gICAgfTtcbiAgICAvKiogaW5jcmVtZW50IGxheWVyc0JlbG93IGZvciB0aGlzIG1vYmlsZSBlbGVtZW50IGFuZCBhbGwgaXRzIHBhcmVudHMgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5hZGRMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sYXllcnNCZWxvdysrO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnQgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmFkZExheWVyKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBzZXQgY2hpbGRyZW4gd2lkdGggZm9yIHRoaXMgbW9iaWxlIGVsZW1lbnQgYW5kIGFsbCBpdHMgcGFyZW50c1xuICAgICAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLnNldENoaWxkcmVuV2lkdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW5XaWR0aCA9IHRoaXMuY2hpbGRyZW4ucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHsgcmV0dXJuIHByZXYgKyBjdXIuY2hpbGRyZW5XaWR0aDsgfSwgMCk7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudC5zZXRDaGlsZHJlbldpZHRoKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKiBnZXQgdGhlIHRvdGFsIHdpZHRoIG5lY2Vzc2FyeSB0byBmaXQgdGhpcyBtb2JpbGUgb24gc2NyZWVuICovXG4gICAgTW9iaWxlRWxlbWVudC5wcm90b3R5cGUuZ2V0VG90YWxXaWR0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW5XaWR0aCAqIFhfU0VQQVJBVElPTjtcbiAgICB9O1xuICAgIC8qKiBnZXQgdGhlIHRvdGFsIGhlaWdodCBuZWNlc3NhcnkgdG8gZml0IHRoaXMgbW9iaWxlIG9uIHNjcmVlbiAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLmdldFRvdGFsSGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXllcnNCZWxvdyAqIFlfU0VQQVJBVElPTjtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIHJlY3Vyc2l2ZWx5IGRyYXdzIHRoaXMgZWxlbWVudCBhbmQgZWFjaCBvZiBpdHMgY2hpbGRyZW4gb24gdGhlIGNhbnZhc1xuICAgICAqIEBwYXJhbSBnbCB0aGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQgdG8gZHJhdyB0b1xuICAgICAqIEBwYXJhbSBwcm9ncmFtIHRoZSBXZWJHTCBwcm9ncmFtIHdlJ3JlIHVzaW5nXG4gICAgICogQHBhcmFtIG12TWF0cml4IHRoZSBtb2RlbCB2aWV3IG1hdHJpeFxuICAgICAqIEBwYXJhbSBmbGF0IHdoZXRoZXIgdG8gdXNlIGZsYXQgc2hhZGluZ1xuICAgICAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIG12TWF0cml4KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBtb2RlbE1hdHJpeExvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcIm1vZGVsTWF0cml4XCIpO1xuICAgICAgICAvLyBidWZmZXIgdmVydGV4IGRhdGFcbiAgICAgICAgdmFyIHBCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5wb2ludERhdGEsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgdmFyIHZQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidlBvc2l0aW9uXCIpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHZQb3NpdGlvbiwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodlBvc2l0aW9uKTtcbiAgICAgICAgLy8gYnVmZmVyIG5vcm1hbHNcbiAgICAgICAgdmFyIHZOb3JtYWwgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZOb3JtYWwpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5ub3JtYWxEYXRhLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHZhciB2Tm9ybWFsUG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcInZOb3JtYWxcIik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodk5vcm1hbFBvc2l0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2Tm9ybWFsUG9zaXRpb24pO1xuICAgICAgICAvLyBhcHBseSBhIHJvdGF0aW9uIHRvIHNwaW4gdGhpcyBzaGFwZVxuICAgICAgICB2YXIgcm90YXRlZE1hdHJpeCA9IG12TWF0cml4XG4gICAgICAgICAgICAuY29weSgpXG4gICAgICAgICAgICAucm90YXRlKHRoaXMucm90RGlyICogdGhpcy5yb3RTcGVlZCAqIHRoaXMucm90U3RlcCsrLCBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDEsIDBdKSk7XG4gICAgICAgIGlmIChyb3RhdGVkTWF0cml4ID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHJvdGF0ZVwiKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihtb2RlbE1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKHJvdGF0ZWRNYXRyaXguYWxsKCkpKTtcbiAgICAgICAgLy8gc2V0IGxpZ2h0aW5nIGF0dHJpYnV0ZXNcbiAgICAgICAgdmFyIGRpZmZ1c2VQcm9kdWN0ID0gdmVjNF8xLmRlZmF1bHQucHJvZHVjdCh2ZWM0XzEuZGVmYXVsdC5wcm9kdWN0KGxpZ2h0RGlmZnVzZSwgdGhpcy5jb2xvciksIHRoaXMuY29sb3IpO1xuICAgICAgICB2YXIgc3BlY3VsYXJQcm9kdWN0ID0gdmVjNF8xLmRlZmF1bHQucHJvZHVjdChsaWdodFNwZWN1bGFyLCBtYXRlcmlhbERpZmZ1c2UpO1xuICAgICAgICB2YXIgYW1iaWVudFByb2R1Y3QgPSB2ZWM0XzEuZGVmYXVsdC5wcm9kdWN0KHZlYzRfMS5kZWZhdWx0LnByb2R1Y3QobGlnaHRBbWJpZW50LCBtYXRlcmlhbEFtYmllbnQpLCB0aGlzLmNvbG9yKTtcbiAgICAgICAgZ2wudW5pZm9ybTRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJkaWZmdXNlUHJvZHVjdFwiKSwgRmxvYXQzMkFycmF5LmZyb20oZGlmZnVzZVByb2R1Y3QueHl6dykpO1xuICAgICAgICBnbC51bmlmb3JtNGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInNwZWN1bGFyUHJvZHVjdFwiKSwgRmxvYXQzMkFycmF5LmZyb20oc3BlY3VsYXJQcm9kdWN0Lnh5encpKTtcbiAgICAgICAgZ2wudW5pZm9ybTRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJhbWJpZW50UHJvZHVjdFwiKSwgRmxvYXQzMkFycmF5LmZyb20oYW1iaWVudFByb2R1Y3QueHl6dykpO1xuICAgICAgICBnbC51bmlmb3JtNGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImxpZ2h0UG9zaXRpb25cIiksIEZsb2F0MzJBcnJheS5mcm9tKGxpZ2h0UG9zaXRpb24ueHl6dykpO1xuICAgICAgICBnbC51bmlmb3JtMWYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwic2hpbmluZXNzXCIpLCBtYXRlcmlhbFNoaW5pbmVzcyk7XG4gICAgICAgIC8vIGRyYXcgd2lyZWZyYW1lIG9yIHNvbGlkIG9iamVjdFxuICAgICAgICBpZiAodGhpcy53aXJlZnJhbWUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGggLSAyOyBpICs9IDMpIHtcbiAgICAgICAgICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLkxJTkVfTE9PUCwgaSwgMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgdGhpcy52ZXJ0aWNlcy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRyYXcgdG9wIHN0cmluZ1xuICAgICAgICBpZiAodGhpcy5wYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBCdWZmZXIpO1xuICAgICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIEZsb2F0MzJBcnJheS5mcm9tKFswLCBZX1NFUEFSQVRJT04gLyAyLCAwLCAxLCAwLCAwLCAwLCAxXSksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORVMsIDAsIDIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZSB0aGUgd2hvbGUgbmV4dCBsYXllclxuICAgICAgICB2YXIgbGF5ZXJNYXRyaXggPSBtdk1hdHJpeFxuICAgICAgICAgICAgLmNvcHkoKVxuICAgICAgICAgICAgLnJvdGF0ZSh0aGlzLm5leHRSb3REaXIgKiB0aGlzLm5leHRSb3RTcGVlZCAqIHRoaXMubmV4dFJvdFN0ZXArKywgbmV3IHZlYzNfMS5kZWZhdWx0KFswLCAxLCAwXSkpO1xuICAgICAgICBpZiAobGF5ZXJNYXRyaXggPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMYXllciBtYXRyaXggaXMgbnVsbFwiKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihtb2RlbE1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKGxheWVyTWF0cml4LmFsbCgpKSk7XG4gICAgICAgIC8vIGRyYXcgc3RyaW5ncyBjb25uZWN0aW5nIHRoZSBsYXllclxuICAgICAgICB2YXIgc3RyaW5ncyA9IHRoaXMuZ2V0TmV4dExldmVsU3RyaW5ncygpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcEJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXkuZnJvbShoZWxwZXJzXzEuZmxhdHRlbihzdHJpbmdzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi54eXp3OyB9KSkpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORVMsIDAsIHN0cmluZ3MubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcbiAgICAgICAgICAgIC8vIG9mZnNldCBjaGlsZHJlbiBzbyB0aGV5IGFsbCBmaXQgc2lkZSBieSBzaWRlXG4gICAgICAgICAgICB2YXIgbiA9IF90aGlzLmNoaWxkcmVuV2lkdGg7XG4gICAgICAgICAgICB2YXIgYyA9IF90aGlzLmNoaWxkcmVuLmxlbmd0aCAvIG47XG4gICAgICAgICAgICB2YXIgeFBvcyA9IG4gPCAyID8gMCA6IFhfU0VQQVJBVElPTiAqIChpbmRleCAvIGMgLSAobiAtIDEpIC8gMik7XG4gICAgICAgICAgICB2YXIgdHJhbnNsYXRlZE1hdHJpeCA9IGxheWVyTWF0cml4XG4gICAgICAgICAgICAgICAgLmNvcHkoKVxuICAgICAgICAgICAgICAgIC50cmFuc2xhdGUobmV3IHZlYzNfMS5kZWZhdWx0KFt4UG9zLCAtWV9TRVBBUkFUSU9OLCAwXSkpO1xuICAgICAgICAgICAgLy8gZHJhdyBjaGlsZHJlblxuICAgICAgICAgICAgY2hpbGQuZHJhdyhnbCwgcHJvZ3JhbSwgdHJhbnNsYXRlZE1hdHJpeCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogZ2V0cyB0aGUgaG9yaXpvbnRhbCBzdHJpbmcgYW5kIHRoZSBib3R0b20gaGFsZiBvZiB0aGUgdmVydGljYWwgc3RyaW5nIHVzZWRcbiAgICAgKiB0byBkcmF3IHRoZSBuZXh0IGxheWVyXG4gICAgICovXG4gICAgTW9iaWxlRWxlbWVudC5wcm90b3R5cGUuZ2V0TmV4dExldmVsU3RyaW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IG5ldyBBcnJheSgpO1xuICAgICAgICAvLyB0b3BcbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICBvdXQucHVzaChuZXcgdmVjNF8xLmRlZmF1bHQoWzAsIDAsIDAsIDFdKSk7XG4gICAgICAgICAgICBvdXQucHVzaChuZXcgdmVjNF8xLmRlZmF1bHQoWzAsIC1ZX1NFUEFSQVRJT04gLyAyLCAwLCAxXSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGhvcml6b250YWxcbiAgICAgICAgb3V0LnB1c2gobmV3IHZlYzRfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIC0oWF9TRVBBUkFUSU9OICogKHRoaXMuY2hpbGRyZW5XaWR0aCAtIDEpKSAvIDIsXG4gICAgICAgICAgICAtWV9TRVBBUkFUSU9OIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pKTtcbiAgICAgICAgb3V0LnB1c2gobmV3IHZlYzRfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIChYX1NFUEFSQVRJT04gKiAodGhpcy5jaGlsZHJlbldpZHRoIC0gMSkpIC8gMixcbiAgICAgICAgICAgIC1ZX1NFUEFSQVRJT04gLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSkpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLyoqXG4gICAgICogcmVjYWxjdWxhdGVzIG5vcm1hbHMgYmFzZWQgb24gc2hhZGluZyB0eXBlLCB0aGVuIGRvZXMgdGhlIHNhbWUgZm9yIGFsbFxuICAgICAqIGNoaWxkcmVuXG4gICAgICogQHBhcmFtIGZsYXQgd2hldGhlciB0byBkbyBmbGF0IHNoYWRpbmdcbiAgICAgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5jYWxjdWxhdGVOb3JtYWxzID0gZnVuY3Rpb24gKGZsYXQpIHtcbiAgICAgICAgdmFyIG5vcm1hbHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMubWVzaDsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBwb2x5ID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIHRlbXAgPSBoZWxwZXJzXzEubm9ybWFsKHBvbHkpO1xuICAgICAgICAgICAgdmFyIG4gPSBuZXcgdmVjNF8xLmRlZmF1bHQoW3RlbXAueCwgdGVtcC55LCB0ZW1wLnosIDAuMF0pO1xuICAgICAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBwb2x5XzEgPSBwb2x5OyBfYiA8IHBvbHlfMS5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdmVjID0gcG9seV8xW19iXTtcbiAgICAgICAgICAgICAgICBpZiAoZmxhdClcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG4pO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG5ldyB2ZWM0XzEuZGVmYXVsdChbdmVjLngsIHZlYy55LCB2ZWMueiwgMC4wXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9ybWFsRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKG5vcm1hbHMubWFwKGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLnh5enc7IH0pKSk7XG4gICAgICAgIC8vIHJlcGVhdCBkb3duIHRoZSB0cmVlXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uIChjaGlsZCkgeyByZXR1cm4gY2hpbGQuY2FsY3VsYXRlTm9ybWFscyhmbGF0KTsgfSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBhZGRzIGEgbmV3IGVsZW1lbnQgc29tZXdoZXJlIGJlbG93IHRoaXMgb25lXG4gICAgICogQHBhcmFtIG1lc2ggbWVzaCB0byBhZGRcbiAgICAgKiBAcGFyYW0gY29sb3IgY29sb3Igb2YgbWVzaFxuICAgICAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLnJhbmRvbUFkZCA9IGZ1bmN0aW9uIChtZXNoLCBjb2xvcikge1xuICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIGlmIChyIDwgMSAvICh0aGlzLmNoaWxkcmVuLmxlbmd0aCArIDEpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKG5ldyBNb2JpbGVFbGVtZW50KG1lc2gsIGNvbG9yKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGlsZHJlbltNYXRoLmZsb29yKHIgKiB0aGlzLmNoaWxkcmVuLmxlbmd0aCldLmFkZENoaWxkKG5ldyBNb2JpbGVFbGVtZW50KG1lc2gsIGNvbG9yKSk7XG4gICAgfTtcbiAgICByZXR1cm4gTW9iaWxlRWxlbWVudDtcbn0oKSk7XG5leHBvcnRzLk1vYmlsZUVsZW1lbnQgPSBNb2JpbGVFbGVtZW50O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TW9iaWxlRWxlbWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzNcIik7XG4vKipcbiAqIGNyZWF0ZSBhbiA8aW5wdXQgdHlwZT1cImZpbGVcIj4gZWxlbWVudCBhbmQgYWRkIGl0IHRvICNpbnB1dC1jb250YWluZXJcbiAqIEByZXR1cm4gdGhlIGNyZWF0ZWQgaW5wdXQgZWxlbWVudFxuICovXG5leHBvcnRzLmNyZWF0ZUZpbGVJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIC8vIHJlbW92ZSBhbnkgZXhpc3RpbmcgaW5wdXRcbiAgICAoX2EgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbGUtdXBsb2FkXCIpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVtb3ZlKCk7XG4gICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgIGlucHV0LnR5cGUgPSBcImZpbGVcIjtcbiAgICBpbnB1dC5pZCA9IFwiZmlsZS11cGxvYWRcIjtcbiAgICAoX2IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImlucHV0LWNvbnRhaW5lclwiKSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICByZXR1cm4gaW5wdXQ7XG59O1xuLyoqXG4gKiBhc3luY2hyb25vdXNseSByZWFkcyB0ZXh0IGZyb20gYSBmaWxlIGlucHV0IGVsZW1lbnQsIGFuZCByZXR1cm5zIGl0IGFzIGFcbiAqIHByb21pc2VcbiAqIEByZXR1cm4gYSBwcm9taXNlIGNvbnRhaW5pbmVkIHRoZSBjb250ZW50cyBvZiB0aGUgZmlyc3QgZmlsZSBpbiB0aGUgZWxlbWVudCxcbiAqIG9yIHVuZGVmaW5lZCBpZiBpdCBjYW4ndCBiZSByZWFkXG4gKi9cbmV4cG9ydHMuZ2V0SW5wdXQgPSBmdW5jdGlvbiAoZWx0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgaWYgKGVsdC5maWxlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZWx0IGNvbnRhaW5zIG5vIGZpbGVzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmaWxlID0gZWx0LmZpbGVzWzBdO1xuICAgICAgICB2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIGZpbGVSZWFkZXIucmVhZEFzVGV4dChmaWxlLCBcIlVURi04XCIpO1xuICAgICAgICBmaWxlUmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgcmVzb2x2ZSgoX2EgPSBldi50YXJnZXQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICBmaWxlUmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZWplY3QoXCJmaWxlUmVhZGVyIGVycm9yXCIpO1xuICAgICAgICB9O1xuICAgICAgICBmaWxlUmVhZGVyLm9uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZWplY3QoXCJmaWxlUmVhZGVyIGFib3J0ZWRcIik7XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuLyoqXG4gKiBwYXJzZXMgdGhlIHRleHQgb2YgYW4gaW5wdXQgZmlsZSBhbmQgcmV0dXJucyB0aGUgb2JqZWN0J3MgdmVydGljZXMgYW5kIGZhY2VzXG4gKiBpbiBhIHByb21pc2VcbiAqIEBwYXJhbSBzdHIgdGhlIGlucHV0IGZpbGUncyB0ZXh0IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyBwb2x5Z29ucyB0aGUgbGlzdCBvZiBwb2x5Z29ucyBhcyB2ZWMzIGFycmF5c1xuICogQHJldHVybnMgZXh0ZW50cyB0aGUgWCwgWSwgYW5kIFogYm91bmRzIG9mIHRoZSBmaWd1cmVcbiAqL1xuZXhwb3J0cy5wYXJzZUZpbGVUZXh0ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBudW1WZXJ0aWNlcyA9IDA7XG4gICAgdmFyIG51bVBvbHlnb25zID0gMDtcbiAgICB2YXIgaGVhZGVyRG9uZSA9IGZhbHNlO1xuICAgIHZhciB2ZXJ0ZXhDb3VudGVyID0gMDtcbiAgICB2YXIgcG9seWdvbkNvdW50ZXIgPSAwO1xuICAgIHZhciBtaW5YID0gSW5maW5pdHk7XG4gICAgdmFyIG1pblkgPSBJbmZpbml0eTtcbiAgICB2YXIgbWluWiA9IEluZmluaXR5O1xuICAgIHZhciBtYXhYID0gLUluZmluaXR5O1xuICAgIHZhciBtYXhZID0gLUluZmluaXR5O1xuICAgIHZhciBtYXhaID0gLUluZmluaXR5O1xuICAgIC8vIHggeSB6IGNvb3JkaW5hdGVzIG9mIGVhY2ggdmVydGV4XG4gICAgdmFyIHZlcnRpY2VzID0gbmV3IEFycmF5KG51bVZlcnRpY2VzKTtcbiAgICAvLyBlYWNoIHBvbHlnb24gaXMgYW4gYXJyYXkgb2YgdmVydGljZXNcbiAgICB2YXIgcG9seWdvbnMgPSBuZXcgQXJyYXkobnVtUG9seWdvbnMpO1xuICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKS5tYXAoZnVuY3Rpb24gKHcpIHsgcmV0dXJuIHcudG9Mb3dlckNhc2UoKS50cmltKCk7IH0pO1xuICAgIGlmIChsaW5lc1swXSAhPT0gXCJwbHlcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBsaW5lIG9mIGlucHV0IGZpbGUgbXVzdCBieSAncGx5J1wiKTtcbiAgICB9XG4gICAgZm9yICh2YXIgbGluZU51bSA9IDE7IGxpbmVOdW0gPCBsaW5lcy5sZW5ndGg7ICsrbGluZU51bSkge1xuICAgICAgICB2YXIgd29yZHMgPSBsaW5lc1tsaW5lTnVtXVxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAuc3BsaXQoXCIgXCIpO1xuICAgICAgICBpZiAod29yZHMubGVuZ3RoID09PSAwIHx8IHdvcmRzWzBdID09PSBcIlwiKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmICghaGVhZGVyRG9uZSkge1xuICAgICAgICAgICAgLy8gcGFyc2luZyBoZWFkZXJcbiAgICAgICAgICAgIGlmICh3b3Jkc1swXSA9PT0gXCJlbmRfaGVhZGVyXCIpIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJEb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2ZXJ0aWNlcyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcyk7XG4gICAgICAgICAgICAgICAgcG9seWdvbnMgPSBuZXcgQXJyYXkobnVtUG9seWdvbnMpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdvcmRzWzBdID09PSBcImZvcm1hdFwiKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKHdvcmRzWzBdID09PSBcImVsZW1lbnRcIikge1xuICAgICAgICAgICAgICAgIGlmICh3b3Jkc1sxXSA9PT0gXCJ2ZXJ0ZXhcIilcbiAgICAgICAgICAgICAgICAgICAgbnVtVmVydGljZXMgPSBwYXJzZUludCh3b3Jkc1syXSk7XG4gICAgICAgICAgICAgICAgaWYgKHdvcmRzWzFdID09PSBcImZhY2VcIilcbiAgICAgICAgICAgICAgICAgICAgbnVtUG9seWdvbnMgPSBwYXJzZUludCh3b3Jkc1syXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod29yZHNbMF0gPT09IFwicHJvcGVydHlcIikge1xuICAgICAgICAgICAgICAgIGlmICh3b3Jkc1sxXSA9PT0gXCJmbG9hdDMyXCIgfHwgd29yZHNbMV0gPT09IFwibGlzdFwiKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2ZXJ0ZXhDb3VudGVyIDwgbnVtVmVydGljZXMpIHtcbiAgICAgICAgICAgIC8vIHBhcnNpbmcgdmVydGljZXNcbiAgICAgICAgICAgIHZhciB2ID0gbmV3IHZlYzNfMS5kZWZhdWx0KHdvcmRzLnNsaWNlKDAsIDMpLm1hcChwYXJzZUZsb2F0KSk7XG4gICAgICAgICAgICB2ZXJ0aWNlc1t2ZXJ0ZXhDb3VudGVyXSA9IHY7XG4gICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgdGhpcyBnb2VzIGJleW9uZCBvdXIgZXhpc3RpbmcgZXh0ZW50c1xuICAgICAgICAgICAgaWYgKHYueCA8IG1pblgpXG4gICAgICAgICAgICAgICAgbWluWCA9IHYueDtcbiAgICAgICAgICAgIGlmICh2LnkgPCBtaW5ZKVxuICAgICAgICAgICAgICAgIG1pblkgPSB2Lnk7XG4gICAgICAgICAgICBpZiAodi56IDwgbWluWilcbiAgICAgICAgICAgICAgICBtaW5aID0gdi56O1xuICAgICAgICAgICAgaWYgKHYueCA+IG1heFgpXG4gICAgICAgICAgICAgICAgbWF4WCA9IHYueDtcbiAgICAgICAgICAgIGlmICh2LnkgPiBtYXhZKVxuICAgICAgICAgICAgICAgIG1heFkgPSB2Lnk7XG4gICAgICAgICAgICBpZiAodi56ID4gbWF4WilcbiAgICAgICAgICAgICAgICBtYXhaID0gdi56O1xuICAgICAgICAgICAgdmVydGV4Q291bnRlcisrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gcGFyc2luZyBwb2x5Z29uc1xuICAgICAgICAgICAgcG9seWdvbnNbcG9seWdvbkNvdW50ZXJdID0gd29yZHMuc2xpY2UoMSkubWFwKGZ1bmN0aW9uICh3KSB7IHJldHVybiB2ZXJ0aWNlc1twYXJzZUludCh3KV07IH0pO1xuICAgICAgICAgICAgcG9seWdvbkNvdW50ZXIrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBwb2x5Z29uczogcG9seWdvbnMsXG4gICAgICAgIGV4dGVudHM6IHtcbiAgICAgICAgICAgIG1pblg6IG1pblgsXG4gICAgICAgICAgICBtaW5ZOiBtaW5ZLFxuICAgICAgICAgICAgbWluWjogbWluWixcbiAgICAgICAgICAgIG1heFg6IG1heFgsXG4gICAgICAgICAgICBtYXhZOiBtYXhZLFxuICAgICAgICAgICAgbWF4WjogbWF4WlxuICAgICAgICB9XG4gICAgfTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1maWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjM1wiKTtcbi8qKlxuICogZmxhdHRlbnMgYSAyRCBhcnJheSBpbnRvIGEgMUQgYXJyYXlcbiAqIEBwYXJhbSBhcnIgYW4gYXJyYXkgb2YgYXJyYXlzXG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW4oYXJyKSB7XG4gICAgdmFyIF9hO1xuICAgIHJldHVybiAoX2EgPSBuZXcgQXJyYXkoKSkuY29uY2F0LmFwcGx5KF9hLCBhcnIpO1xufVxuZXhwb3J0cy5mbGF0dGVuID0gZmxhdHRlbjtcbi8qKlxuICogY2FsY3VsYXRlcyB0aGUgbm9ybWFsIHZlY3RvciBmb3IgYSB0cmlhbmdsZSBtYWRlIHVwIG9mIHRocmVlIHBvaW50cyB1c2luZyB0aGVcbiAqIE5ld2VsbCBtZXRob2RcbiAqL1xuZXhwb3J0cy5ub3JtYWwgPSBmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgdmFyIGVuZCA9IHBvaW50cy5sZW5ndGggLSAxO1xuICAgIHZhciB4ID0gKHBvaW50c1tlbmRdLnkgLSBwb2ludHNbMF0ueSkgKiAocG9pbnRzW2VuZF0ueiArIHBvaW50c1swXS56KTtcbiAgICB2YXIgeSA9IChwb2ludHNbZW5kXS56IC0gcG9pbnRzWzBdLnopICogKHBvaW50c1tlbmRdLnggKyBwb2ludHNbMF0ueCk7XG4gICAgdmFyIHogPSAocG9pbnRzW2VuZF0ueCAtIHBvaW50c1swXS54KSAqIChwb2ludHNbZW5kXS55ICsgcG9pbnRzWzBdLnkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgICAgICB4ICs9IChwb2ludHNbaV0ueSAtIHBvaW50c1tpICsgMV0ueSkgKiAocG9pbnRzW2ldLnogKyBwb2ludHNbaSArIDFdLnopO1xuICAgICAgICB5ICs9IChwb2ludHNbaV0ueiAtIHBvaW50c1tpICsgMV0ueikgKiAocG9pbnRzW2ldLnggKyBwb2ludHNbaSArIDFdLngpO1xuICAgICAgICB6ICs9IChwb2ludHNbaV0ueCAtIHBvaW50c1tpICsgMV0ueCkgKiAocG9pbnRzW2ldLnkgKyBwb2ludHNbaSArIDFdLnkpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IHZlYzNfMS5kZWZhdWx0KFt4LCB5LCB6XSkubm9ybWFsaXplKCk7XG59O1xuLy92ZWMzLmNyb3NzKHZlYzMuZGlmZmVyZW5jZShwMiwgcDApLCB2ZWMzLmRpZmZlcmVuY2UocDEsIHAwKSkubm9ybWFsaXplKCk7XG4vKipcbiAqIG1vdmVzIHRoZSBwb2x5Z29uIG91dHdhcmQgYWxvbmcgdGhlIG5vcm1hbCB2ZWN0b3IgYnkgdGhlIGdpdmVuIGRpc3RhbmNlLFxuICogcmV0dXJuaW5nIHRoZSByZXN0dWx0aW5nIHBvbHlnb25cbiAqL1xuZXhwb3J0cy5wdWxzZSA9IGZ1bmN0aW9uIChwb2x5Z29uLCBkaXN0YW5jZSkge1xuICAgIHJldHVybiBwb2x5Z29uLm1hcChmdW5jdGlvbiAocG9pbnQpIHsgcmV0dXJuIHZlYzNfMS5kZWZhdWx0LmRpZmZlcmVuY2UocG9pbnQsIGV4cG9ydHMubm9ybWFsKHBvbHlnb24pLnNjYWxlKGRpc3RhbmNlKSk7IH0pO1xufTtcbi8qKlxuICogY29udmVydHMgYSBmcmFjdGlvbmFsIGNvbG9yIHZhbHVlIHRvIGEgMi1kaWdpdCBoZXggc3RyaW5nXG4gKiBAcGFyYW0gbnVtIGEgY29sb3IgdmFsdWUgZnJvbSAwIHRvIDFcbiAqL1xuZXhwb3J0cy50b0hleCA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICB2YXIgb3V0ID0gTWF0aC5mbG9vcihudW0gKiAyNTUpXG4gICAgICAgIC50b1N0cmluZygxNilcbiAgICAgICAgLnNsaWNlKDAsIDIpO1xuICAgIGlmIChvdXQubGVuZ3RoIDwgMilcbiAgICAgICAgb3V0ID0gXCIwXCIgKyBvdXQ7XG4gICAgcmV0dXJuIG91dDtcbn07XG4vKipcbiAqIGNyZWF0ZSBhIDxjYW52YXM+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byB0aGUgI2NhbnZhcy1jb250YWluZXJcbiAqIEByZXR1cm4gdGhlIGNyZWF0ZWQgY2FudmFzXG4gKi9cbmV4cG9ydHMuY3JlYXRlQ2FudmFzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgLy8gcmVtb3ZlIGFueSBleGlzdGluZyBjYW52YXNcbiAgICAoX2EgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndlYmdsXCIpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVtb3ZlKCk7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgY2FudmFzLndpZHRoID0gNjQwO1xuICAgIGNhbnZhcy5oZWlnaHQgPSA2NDA7XG4gICAgY2FudmFzLmlkID0gXCJ3ZWJnbFwiO1xuICAgIChfYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzLWNvbnRhaW5lclwiKSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgcmV0dXJuIGNhbnZhcztcbn07XG4vKipcbiAqIGNyZWF0ZSBhbiA8aW5wdXQgdHlwZT1cImNvbG9yXCI+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byAjaW5wdXQtY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGlucHV0IGVsZW1lbnRcbiAqL1xuZXhwb3J0cy5jcmVhdGVDb2xvcklucHV0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgLy8gcmVtb3ZlIGFueSBleGlzdGluZyBpbnB1dFxuICAgIChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3ItcGlja2VyLWNvbnRhaW5lclwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC52YWx1ZSA9IFwiI2ZmZmZmZlwiO1xuICAgIGlucHV0LnR5cGUgPSBcImNvbG9yXCI7XG4gICAgaW5wdXQuaWQgPSBcImNvbG9yLXBpY2tlclwiO1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgc3Bhbi5pZCA9IFwiY29sb3ItcGlja2VyLWNvbnRhaW5lclwiO1xuICAgIHNwYW4uaW5uZXJUZXh0ID0gXCJMaW5lIGNvbG9yOiBcIjtcbiAgICBzcGFuLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAoX2IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImlucHV0LWNvbnRhaW5lclwiKSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgIHJldHVybiBpbnB1dDtcbn07XG4vKipcbiAqIG1peGVzIHR3byB2ZWN0b3JzIGFjY29yZGluZyB0byBhIHJhdGlvXG4gKiBAcGFyYW0gdSBmaXJzdCB2ZWN0b3JcbiAqIEBwYXJhbSB2IHNlY29uZCB2ZWN0b3JcbiAqIEBwYXJhbSBzIHJhdGlvIG9mIGZpcnN0IHRvIHNlY29uZFxuICovXG5leHBvcnRzLm1peCA9IGZ1bmN0aW9uICh1LCB2LCBzKSB7XG4gICAgcmV0dXJuIG5ldyB2ZWMzXzEuZGVmYXVsdChbXG4gICAgICAgICgxIC0gcykgKiB1LnggKyBzICogdi54LFxuICAgICAgICAoMSAtIHMpICogdS55ICsgcyAqIHYueSxcbiAgICAgICAgKDEgLSBzKSAqIHUueiArIHMgKiB2LnpcbiAgICBdKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oZWxwZXJzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLy9cbi8vICBpbml0U2hhZGVycy5qc1xuLy9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuaW5pdFNoYWRlcnMgPSBmdW5jdGlvbiAoZ2wsIHZlcnRleFNoYWRlcklkLCBmcmFnbWVudFNoYWRlcklkKSB7XG4gICAgdmFyIHZlcnRFbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodmVydGV4U2hhZGVySWQpO1xuICAgIGlmICh2ZXJ0RWxlbSA9PT0gbnVsbCB8fCB2ZXJ0RWxlbS50ZXh0Q29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gbG9hZCB2ZXJ0ZXggc2hhZGVyIFwiICsgdmVydGV4U2hhZGVySWQpO1xuICAgIH1cbiAgICB2YXIgdmVydFNoZHIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgaWYgKHZlcnRTaGRyID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBjcmVhdGUgdmVydGV4IHNoYWRlciBcIiArIHZlcnRleFNoYWRlcklkKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHZlcnRTaGRyLCB2ZXJ0RWxlbS50ZXh0Q29udGVudCk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcih2ZXJ0U2hkcik7XG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodmVydFNoZHIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJWZXJ0ZXggc2hhZGVyIGZhaWxlZCB0byBjb21waWxlLiAgVGhlIGVycm9yIGxvZyBpczpcIiArXG4gICAgICAgICAgICBcIjxwcmU+XCIgK1xuICAgICAgICAgICAgZ2wuZ2V0U2hhZGVySW5mb0xvZyh2ZXJ0U2hkcikgK1xuICAgICAgICAgICAgXCI8L3ByZT5cIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxuICAgIHZhciBmcmFnRWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZyYWdtZW50U2hhZGVySWQpO1xuICAgIGlmIChmcmFnRWxlbSA9PT0gbnVsbCB8fCBmcmFnRWxlbS50ZXh0Q29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gbG9hZCB2ZXJ0ZXggc2hhZGVyIFwiICsgZnJhZ21lbnRTaGFkZXJJZCk7XG4gICAgfVxuICAgIHZhciBmcmFnU2hkciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgIGlmIChmcmFnU2hkciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY3JlYXRlIHZlcnRleCBzaGFkZXIgXCIgKyBmcmFnbWVudFNoYWRlcklkKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKGZyYWdTaGRyLCBmcmFnRWxlbS50ZXh0Q29udGVudCk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihmcmFnU2hkcik7XG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoZnJhZ1NoZHIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJGcmFnbWVudCBzaGFkZXIgZmFpbGVkIHRvIGNvbXBpbGUuICBUaGUgZXJyb3IgbG9nIGlzOlwiICtcbiAgICAgICAgICAgIFwiPHByZT5cIiArXG4gICAgICAgICAgICBnbC5nZXRTaGFkZXJJbmZvTG9nKGZyYWdTaGRyKSArXG4gICAgICAgICAgICBcIjwvcHJlPlwiO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG4gICAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgaWYgKHByb2dyYW0gPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNyZWF0ZSBwcm9ncmFtXCIpO1xuICAgIH1cbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydFNoZHIpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnU2hkcik7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICB2YXIgbXNnID0gXCJTaGFkZXIgcHJvZ3JhbSBmYWlsZWQgdG8gbGluay4gIFRoZSBlcnJvciBsb2cgaXM6XCIgK1xuICAgICAgICAgICAgXCI8cHJlPlwiICtcbiAgICAgICAgICAgIGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pICtcbiAgICAgICAgICAgIFwiPC9wcmU+XCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvZ3JhbTtcbn07XG4vKlxuLy8gR2V0IGEgZmlsZSBhcyBhIHN0cmluZyB1c2luZyAgQUpBWFxuZnVuY3Rpb24gbG9hZEZpbGVBSkFYKG5hbWUpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICAgIG9rU3RhdHVzID0gZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09IFwiZmlsZTpcIiA/IDAgOiAyMDA7XG4gICAgeGhyLm9wZW4oJ0dFVCcsIG5hbWUsIGZhbHNlKTtcbiAgICB4aHIuc2VuZChudWxsKTtcbiAgICByZXR1cm4geGhyLnN0YXR1cyA9PSBva1N0YXR1cyA/IHhoci5yZXNwb25zZVRleHQgOiBudWxsO1xufTtcblxuXG5mdW5jdGlvbiBpbml0U2hhZGVyc0Zyb21GaWxlcyhnbCwgdlNoYWRlck5hbWUsIGZTaGFkZXJOYW1lKSB7XG4gICAgZnVuY3Rpb24gZ2V0U2hhZGVyKGdsLCBzaGFkZXJOYW1lLCB0eXBlKSB7XG4gICAgICAgIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSksXG4gICAgICAgICAgICBzaGFkZXJTY3JpcHQgPSBsb2FkRmlsZUFKQVgoc2hhZGVyTmFtZSk7XG4gICAgICAgIGlmICghc2hhZGVyU2NyaXB0KSB7XG4gICAgICAgICAgICBhbGVydChcIkNvdWxkIG5vdCBmaW5kIHNoYWRlciBzb3VyY2U6IFwiK3NoYWRlck5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNoYWRlclNjcmlwdCk7XG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcblxuICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgYWxlcnQoZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgfVxuICAgIHZhciB2ZXJ0ZXhTaGFkZXIgPSBnZXRTaGFkZXIoZ2wsIHZTaGFkZXJOYW1lLCBnbC5WRVJURVhfU0hBREVSKSxcbiAgICAgICAgZnJhZ21lbnRTaGFkZXIgPSBnZXRTaGFkZXIoZ2wsIGZTaGFkZXJOYW1lLCBnbC5GUkFHTUVOVF9TSEFERVIpLFxuICAgICAgICBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZyYWdtZW50U2hhZGVyKTtcbiAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcblxuICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgYWxlcnQoXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBcbiAgICByZXR1cm4gcHJvZ3JhbTtcbn07XG4qL1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5pdFNoYWRlcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmVwc2lsb24gPSAwLjAwMDAxO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uc3RhbnRzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5ICovXG52YXIgbWF0NF8xID0gcmVxdWlyZShcIi4vbWF0NFwiKTtcbnZhciBxdWF0XzEgPSByZXF1aXJlKFwiLi9xdWF0XCIpO1xudmFyIHZlYzJfMSA9IHJlcXVpcmUoXCIuL3ZlYzJcIik7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBtYXQzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hdDModmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSg5KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQodmFsdWVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtYXQzLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0MygpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICBkZXN0LnZhbHVlc1tpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgZGF0YVtpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUucm93ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDMgKyAwXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogMyArIDFdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiAzICsgMl1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmNvbCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzW2luZGV4XSwgdGhpcy52YWx1ZXNbaW5kZXggKyAzXSwgdGhpcy52YWx1ZXNbaW5kZXggKyA2XV07XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAobWF0cml4LCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnZhbHVlc1tpXSAtIG1hdHJpeC5hdChpKSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHJldHVybiBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZW1wMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIHRlbXAwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgdGVtcDEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gdGVtcDAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IHRlbXAwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSB0ZW1wMTI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHZhciBkZXQgPSBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gZGV0MDEgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGRldDExICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9ICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBkZXQyMSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAobWF0cml4KSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBiMDAgPSBtYXRyaXguYXQoMCk7XG4gICAgICAgIHZhciBiMDEgPSBtYXRyaXguYXQoMSk7XG4gICAgICAgIHZhciBiMDIgPSBtYXRyaXguYXQoMik7XG4gICAgICAgIHZhciBiMTAgPSBtYXRyaXguYXQoMyk7XG4gICAgICAgIHZhciBiMTEgPSBtYXRyaXguYXQoNCk7XG4gICAgICAgIHZhciBiMTIgPSBtYXRyaXguYXQoNSk7XG4gICAgICAgIHZhciBiMjAgPSBtYXRyaXguYXQoNik7XG4gICAgICAgIHZhciBiMjEgPSBtYXRyaXguYXQoNyk7XG4gICAgICAgIHZhciBiMjIgPSBtYXRyaXguYXQoOCk7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUubXVsdGlwbHlWZWMyID0gZnVuY3Rpb24gKHZlY3RvciwgcmVzdWx0KSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC54eSA9IFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB0aGlzLnZhbHVlc1s3XVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHZlYzJfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMF0gKyB5ICogdGhpcy52YWx1ZXNbM10gKyB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB0aGlzLnZhbHVlc1s3XVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLm11bHRpcGx5VmVjMyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHJlc3VsdCkge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQueHl6ID0gW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHogKiB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB6ICogdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzJdICsgeSAqIHRoaXMudmFsdWVzWzVdICsgeiAqIHRoaXMudmFsdWVzWzhdXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHogKiB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMV0gKyB5ICogdGhpcy52YWx1ZXNbNF0gKyB6ICogdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzJdICsgeSAqIHRoaXMudmFsdWVzWzVdICsgeiAqIHRoaXMudmFsdWVzWzhdXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUudG9NYXQ0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHQuaW5pdChbXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1szXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtYXQ0XzEuZGVmYXVsdChbXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1szXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzddLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnRvUXVhdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0wMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgbTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBtMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIG0xMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgbTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBtMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIG0yMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgbTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBtMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGZvdXJYU3F1YXJlZE1pbnVzMSA9IG0wMCAtIG0xMSAtIG0yMjtcbiAgICAgICAgdmFyIGZvdXJZU3F1YXJlZE1pbnVzMSA9IG0xMSAtIG0wMCAtIG0yMjtcbiAgICAgICAgdmFyIGZvdXJaU3F1YXJlZE1pbnVzMSA9IG0yMiAtIG0wMCAtIG0xMTtcbiAgICAgICAgdmFyIGZvdXJXU3F1YXJlZE1pbnVzMSA9IG0wMCArIG0xMSArIG0yMjtcbiAgICAgICAgdmFyIGJpZ2dlc3RJbmRleCA9IDA7XG4gICAgICAgIHZhciBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyV1NxdWFyZWRNaW51czE7XG4gICAgICAgIGlmIChmb3VyWFNxdWFyZWRNaW51czEgPiBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEpIHtcbiAgICAgICAgICAgIGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSA9IGZvdXJYU3F1YXJlZE1pbnVzMTtcbiAgICAgICAgICAgIGJpZ2dlc3RJbmRleCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdXJZU3F1YXJlZE1pbnVzMSA+IGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSkge1xuICAgICAgICAgICAgZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxID0gZm91cllTcXVhcmVkTWludXMxO1xuICAgICAgICAgICAgYmlnZ2VzdEluZGV4ID0gMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91clpTcXVhcmVkTWludXMxID4gZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxKSB7XG4gICAgICAgICAgICBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyWlNxdWFyZWRNaW51czE7XG4gICAgICAgICAgICBiaWdnZXN0SW5kZXggPSAzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiaWdnZXN0VmFsID0gTWF0aC5zcXJ0KGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSArIDEpICogMC41O1xuICAgICAgICB2YXIgbXVsdCA9IDAuMjUgLyBiaWdnZXN0VmFsO1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IHF1YXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIHN3aXRjaCAoYmlnZ2VzdEluZGV4KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gKG0xMiAtIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gKG0yMCAtIG0wMikgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gKG0wMSAtIG0xMCkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ID0gKG0xMiAtIG0yMSkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gYmlnZ2VzdFZhbDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IChtMDEgKyBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueiA9IChtMjAgKyBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICByZXN1bHQudyA9IChtMjAgLSBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueCA9IChtMDEgKyBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IGJpZ2dlc3RWYWw7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSAobTEyICsgbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSAobTAxIC0gbTEwKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnggPSAobTIwICsgbTAyKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAobTEyICsgbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUsIGF4aXMpIHtcbiAgICAgICAgdmFyIHggPSBheGlzLng7XG4gICAgICAgIHZhciB5ID0gYXhpcy55O1xuICAgICAgICB2YXIgeiA9IGF4aXMuejtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgICAgIHggKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeSAqPSBsZW5ndGg7XG4gICAgICAgICAgICB6ICo9IGxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciB0ID0gMS4wIC0gYztcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBiMDAgPSB4ICogeCAqIHQgKyBjO1xuICAgICAgICB2YXIgYjAxID0geSAqIHggKiB0ICsgeiAqIHM7XG4gICAgICAgIHZhciBiMDIgPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICAgICAgdmFyIGIxMCA9IHggKiB5ICogdCAtIHogKiBzO1xuICAgICAgICB2YXIgYjExID0geSAqIHkgKiB0ICsgYztcbiAgICAgICAgdmFyIGIxMiA9IHogKiB5ICogdCArIHggKiBzO1xuICAgICAgICB2YXIgYjIwID0geCAqIHogKiB0ICsgeSAqIHM7XG4gICAgICAgIHZhciBiMjEgPSB5ICogeiAqIHQgLSB4ICogcztcbiAgICAgICAgdmFyIGIyMiA9IHogKiB6ICogdCArIGM7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYTAwICogYjEwICsgYTEwICogYjExICsgYTIwICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGEwMSAqIGIxMCArIGExMSAqIGIxMSArIGEyMSAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSBhMDIgKiBiMTAgKyBhMTIgKiBiMTEgKyBhMjIgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYTAwICogYjIwICsgYTEwICogYjIxICsgYTIwICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGEwMSAqIGIyMCArIGExMSAqIGIyMSArIGEyMSAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0My5wcm9kdWN0ID0gZnVuY3Rpb24gKG0xLCBtMiwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBhMDAgPSBtMS5hdCgwKTtcbiAgICAgICAgdmFyIGEwMSA9IG0xLmF0KDEpO1xuICAgICAgICB2YXIgYTAyID0gbTEuYXQoMik7XG4gICAgICAgIHZhciBhMTAgPSBtMS5hdCgzKTtcbiAgICAgICAgdmFyIGExMSA9IG0xLmF0KDQpO1xuICAgICAgICB2YXIgYTEyID0gbTEuYXQoNSk7XG4gICAgICAgIHZhciBhMjAgPSBtMS5hdCg2KTtcbiAgICAgICAgdmFyIGEyMSA9IG0xLmF0KDcpO1xuICAgICAgICB2YXIgYTIyID0gbTEuYXQoOCk7XG4gICAgICAgIHZhciBiMDAgPSBtMi5hdCgwKTtcbiAgICAgICAgdmFyIGIwMSA9IG0yLmF0KDEpO1xuICAgICAgICB2YXIgYjAyID0gbTIuYXQoMik7XG4gICAgICAgIHZhciBiMTAgPSBtMi5hdCgzKTtcbiAgICAgICAgdmFyIGIxMSA9IG0yLmF0KDQpO1xuICAgICAgICB2YXIgYjEyID0gbTIuYXQoNSk7XG4gICAgICAgIHZhciBiMjAgPSBtMi5hdCg2KTtcbiAgICAgICAgdmFyIGIyMSA9IG0yLmF0KDcpO1xuICAgICAgICB2YXIgYjIyID0gbTIuYXQoOCk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pbml0KFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMlxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtYXQzKFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMlxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDMuaWRlbnRpdHkgPSBuZXcgbWF0MygpLnNldElkZW50aXR5KCk7XG4gICAgcmV0dXJuIG1hdDM7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gbWF0Mztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdDMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHkgKi9cbnZhciBtYXQzXzEgPSByZXF1aXJlKFwiLi9tYXQzXCIpO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL3ZlYzNcIik7XG52YXIgdmVjNF8xID0gcmVxdWlyZShcIi4vdmVjNFwiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBtYXQ0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hdDQodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pbml0KHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbWF0NC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSB2YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgbWF0NCgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgZGVzdC52YWx1ZXNbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5yb3cgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDBdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiA0ICsgMV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDQgKyAyXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDNdXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5jb2wgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICsgNF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCArIDhdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKyAxMl1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChtYXRyaXgsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnZhbHVlc1tpXSAtIG1hdHJpeC5hdChpKSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgZGV0MDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMDtcbiAgICAgICAgdmFyIGRldDAyID0gYTAwICogYTEzIC0gYTAzICogYTEwO1xuICAgICAgICB2YXIgZGV0MDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMTtcbiAgICAgICAgdmFyIGRldDA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyO1xuICAgICAgICB2YXIgZGV0MDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwO1xuICAgICAgICB2YXIgZGV0MDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMTtcbiAgICAgICAgdmFyIGRldDExID0gYTIyICogYTMzIC0gYTIzICogYTMyO1xuICAgICAgICByZXR1cm4gKGRldDAwICogZGV0MTEgLVxuICAgICAgICAgICAgZGV0MDEgKiBkZXQxMCArXG4gICAgICAgICAgICBkZXQwMiAqIGRldDA5ICtcbiAgICAgICAgICAgIGRldDAzICogZGV0MDggLVxuICAgICAgICAgICAgZGV0MDQgKiBkZXQwNyArXG4gICAgICAgICAgICBkZXQwNSAqIGRldDA2KTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnNldElkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzE1XSA9IDE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGVtcDAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciB0ZW1wMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIHRlbXAwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgdGVtcDEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciB0ZW1wMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIHRlbXAyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB0aGlzLnZhbHVlc1sxMl07XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gdGVtcDAxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IHRoaXMudmFsdWVzWzEzXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSB0ZW1wMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gdGVtcDEyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSB0aGlzLnZhbHVlc1sxNF07XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSA9IHRlbXAwMztcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdID0gdGVtcDEzO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSB0ZW1wMjM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgZGV0MDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMDtcbiAgICAgICAgdmFyIGRldDAyID0gYTAwICogYTEzIC0gYTAzICogYTEwO1xuICAgICAgICB2YXIgZGV0MDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTE7XG4gICAgICAgIHZhciBkZXQwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMTtcbiAgICAgICAgdmFyIGRldDA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyO1xuICAgICAgICB2YXIgZGV0MDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwO1xuICAgICAgICB2YXIgZGV0MDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzE7XG4gICAgICAgIHZhciBkZXQxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMTtcbiAgICAgICAgdmFyIGRldDExID0gYTIyICogYTMzIC0gYTIzICogYTMyO1xuICAgICAgICB2YXIgZGV0ID0gZGV0MDAgKiBkZXQxMSAtXG4gICAgICAgICAgICBkZXQwMSAqIGRldDEwICtcbiAgICAgICAgICAgIGRldDAyICogZGV0MDkgK1xuICAgICAgICAgICAgZGV0MDMgKiBkZXQwOCAtXG4gICAgICAgICAgICBkZXQwNCAqIGRldDA3ICtcbiAgICAgICAgICAgIGRldDA1ICogZGV0MDY7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gKGExMSAqIGRldDExIC0gYTEyICogZGV0MTAgKyBhMTMgKiBkZXQwOSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gKC1hMDEgKiBkZXQxMSArIGEwMiAqIGRldDEwIC0gYTAzICogZGV0MDkpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IChhMzEgKiBkZXQwNSAtIGEzMiAqIGRldDA0ICsgYTMzICogZGV0MDMpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9ICgtYTIxICogZGV0MDUgKyBhMjIgKiBkZXQwNCAtIGEyMyAqIGRldDAzKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSAoLWExMCAqIGRldDExICsgYTEyICogZGV0MDggLSBhMTMgKiBkZXQwNykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gKGEwMCAqIGRldDExIC0gYTAyICogZGV0MDggKyBhMDMgKiBkZXQwNykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gKC1hMzAgKiBkZXQwNSArIGEzMiAqIGRldDAyIC0gYTMzICogZGV0MDEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IChhMjAgKiBkZXQwNSAtIGEyMiAqIGRldDAyICsgYTIzICogZGV0MDEpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IChhMTAgKiBkZXQxMCAtIGExMSAqIGRldDA4ICsgYTEzICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9ICgtYTAwICogZGV0MTAgKyBhMDEgKiBkZXQwOCAtIGEwMyAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdID0gKGEzMCAqIGRldDA0IC0gYTMxICogZGV0MDIgKyBhMzMgKiBkZXQwMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9ICgtYTIwICogZGV0MDQgKyBhMjEgKiBkZXQwMiAtIGEyMyAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gKC1hMTAgKiBkZXQwOSArIGExMSAqIGRldDA3IC0gYTEyICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gPSAoYTAwICogZGV0MDkgLSBhMDEgKiBkZXQwNyArIGEwMiAqIGRldDA2KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdID0gKC1hMzAgKiBkZXQwMyArIGEzMSAqIGRldDAxIC0gYTMyICogZGV0MDApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxNV0gPSAoYTIwICogZGV0MDMgLSBhMjEgKiBkZXQwMSArIGEyMiAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIChtYXRyaXgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYTMwID0gdGhpcy52YWx1ZXNbMTJdO1xuICAgICAgICB2YXIgYTMxID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB2YXIgYTMyID0gdGhpcy52YWx1ZXNbMTRdO1xuICAgICAgICB2YXIgYTMzID0gdGhpcy52YWx1ZXNbMTVdO1xuICAgICAgICB2YXIgYjAgPSBtYXRyaXguYXQoMCk7XG4gICAgICAgIHZhciBiMSA9IG1hdHJpeC5hdCgxKTtcbiAgICAgICAgdmFyIGIyID0gbWF0cml4LmF0KDIpO1xuICAgICAgICB2YXIgYjMgPSBtYXRyaXguYXQoMyk7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIGIwID0gbWF0cml4LmF0KDQpO1xuICAgICAgICBiMSA9IG1hdHJpeC5hdCg1KTtcbiAgICAgICAgYjIgPSBtYXRyaXguYXQoNik7XG4gICAgICAgIGIzID0gbWF0cml4LmF0KDcpO1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xuICAgICAgICBiMCA9IG1hdHJpeC5hdCg4KTtcbiAgICAgICAgYjEgPSBtYXRyaXguYXQoOSk7XG4gICAgICAgIGIyID0gbWF0cml4LmF0KDEwKTtcbiAgICAgICAgYjMgPSBtYXRyaXguYXQoMTEpO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIGIwID0gbWF0cml4LmF0KDEyKTtcbiAgICAgICAgYjEgPSBtYXRyaXguYXQoMTMpO1xuICAgICAgICBiMiA9IG1hdHJpeC5hdCgxNCk7XG4gICAgICAgIGIzID0gbWF0cml4LmF0KDE1KTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUubXVsdGlwbHlWZWMzID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gbmV3IHZlYzNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEyXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s5XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEzXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxNF1cbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5tdWx0aXBseVZlYzQgPSBmdW5jdGlvbiAodmVjdG9yLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB3ID0gdmVjdG9yLnc7XG4gICAgICAgIGRlc3QueCA9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMl0gKiB3O1xuICAgICAgICBkZXN0LnkgPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzldICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTNdICogdztcbiAgICAgICAgZGVzdC56ID1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxNF0gKiB3O1xuICAgICAgICBkZXN0LncgPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s3XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzExXSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzE1XSAqIHc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudG9NYXQzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IG1hdDNfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbNV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbOV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxMF1cbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS50b0ludmVyc2VNYXQzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGRldDAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xuICAgICAgICB2YXIgZGV0MTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xuICAgICAgICB2YXIgZGV0MjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XG4gICAgICAgIHZhciBkZXQgPSBhMDAgKiBkZXQwMSArIGEwMSAqIGRldDExICsgYTAyICogZGV0MjE7XG4gICAgICAgIGlmICghZGV0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgICAgIHJldHVybiBuZXcgbWF0M18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgZGV0MDEgKiBkZXQsXG4gICAgICAgICAgICAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQsXG4gICAgICAgICAgICAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldCxcbiAgICAgICAgICAgIGRldDExICogZGV0LFxuICAgICAgICAgICAgKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQsXG4gICAgICAgICAgICAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQsXG4gICAgICAgICAgICBkZXQyMSAqIGRldCxcbiAgICAgICAgICAgICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldCxcbiAgICAgICAgICAgIChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0XG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gKz1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdICogeCArIHRoaXMudmFsdWVzWzRdICogeSArIHRoaXMudmFsdWVzWzhdICogejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSAqIHggKyB0aGlzLnZhbHVlc1s1XSAqIHkgKyB0aGlzLnZhbHVlc1s5XSAqIHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSArPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gKiB4ICsgdGhpcy52YWx1ZXNbNl0gKiB5ICsgdGhpcy52YWx1ZXNbMTBdICogejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSAqIHggKyB0aGlzLnZhbHVlc1s3XSAqIHkgKyB0aGlzLnZhbHVlc1sxMV0gKiB6O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLnZhbHVlc1swXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1syXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1szXSAqPSB4O1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSAqPSB5O1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSAqPSB6O1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSAqPSB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gKj0gejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdICo9IHo7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24gKGFuZ2xlLCBheGlzKSB7XG4gICAgICAgIHZhciB4ID0gYXhpcy54O1xuICAgICAgICB2YXIgeSA9IGF4aXMueTtcbiAgICAgICAgdmFyIHogPSBheGlzLno7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgICAgICB4ICo9IGxlbmd0aDtcbiAgICAgICAgICAgIHkgKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeiAqPSBsZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIHZhciBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgdCA9IDEuMCAtIGM7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMDMgPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNV07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIGExMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGEyMyA9IHRoaXMudmFsdWVzWzExXTtcbiAgICAgICAgdmFyIGIwMCA9IHggKiB4ICogdCArIGM7XG4gICAgICAgIHZhciBiMDEgPSB5ICogeCAqIHQgKyB6ICogcztcbiAgICAgICAgdmFyIGIwMiA9IHogKiB4ICogdCAtIHkgKiBzO1xuICAgICAgICB2YXIgYjEwID0geCAqIHkgKiB0IC0geiAqIHM7XG4gICAgICAgIHZhciBiMTEgPSB5ICogeSAqIHQgKyBjO1xuICAgICAgICB2YXIgYjEyID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgICAgIHZhciBiMjAgPSB4ICogeiAqIHQgKyB5ICogcztcbiAgICAgICAgdmFyIGIyMSA9IHkgKiB6ICogdCAtIHggKiBzO1xuICAgICAgICB2YXIgYjIyID0geiAqIHogKiB0ICsgYztcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBhMDAgKiBiMDAgKyBhMTAgKiBiMDEgKyBhMjAgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYTAxICogYjAwICsgYTExICogYjAxICsgYTIxICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IGEwMiAqIGIwMCArIGExMiAqIGIwMSArIGEyMiAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBhMDMgKiBiMDAgKyBhMTMgKiBiMDEgKyBhMjMgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gYTAwICogYjEwICsgYTEwICogYjExICsgYTIwICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGEwMSAqIGIxMCArIGExMSAqIGIxMSArIGEyMSAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBhMDIgKiBiMTAgKyBhMTIgKiBiMTEgKyBhMjIgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gYTAzICogYjEwICsgYTEzICogYjExICsgYTIzICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGEwMCAqIGIyMCArIGExMCAqIGIyMSArIGEyMCAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSBhMDEgKiBiMjAgKyBhMTEgKiBiMjEgKyBhMjEgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IGEwMiAqIGIyMCArIGExMiAqIGIyMSArIGEyMiAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gYTAzICogYjIwICsgYTEzICogYjIxICsgYTIzICogYjIyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQuZnJ1c3R1bSA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgICAgICB2YXIgcmwgPSByaWdodCAtIGxlZnQ7XG4gICAgICAgIHZhciB0YiA9IHRvcCAtIGJvdHRvbTtcbiAgICAgICAgdmFyIGZuID0gZmFyIC0gbmVhcjtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgIChuZWFyICogMikgLyBybCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAobmVhciAqIDIpIC8gdGIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIChyaWdodCArIGxlZnQpIC8gcmwsXG4gICAgICAgICAgICAodG9wICsgYm90dG9tKSAvIHRiLFxuICAgICAgICAgICAgLShmYXIgKyBuZWFyKSAvIGZuLFxuICAgICAgICAgICAgLTEsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC0oZmFyICogbmVhciAqIDIpIC8gZm4sXG4gICAgICAgICAgICAwXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgbWF0NC5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIChmb3YsIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gICAgICAgIHZhciB0b3AgPSBuZWFyICogTWF0aC50YW4oKGZvdiAqIE1hdGguUEkpIC8gMzYwLjApO1xuICAgICAgICB2YXIgcmlnaHQgPSB0b3AgKiBhc3BlY3Q7XG4gICAgICAgIHJldHVybiBtYXQ0LmZydXN0dW0oLXJpZ2h0LCByaWdodCwgLXRvcCwgdG9wLCBuZWFyLCBmYXIpO1xuICAgIH07XG4gICAgbWF0NC5vcnRob2dyYXBoaWMgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICAgICAgdmFyIHJsID0gcmlnaHQgLSBsZWZ0O1xuICAgICAgICB2YXIgdGIgPSB0b3AgLSBib3R0b207XG4gICAgICAgIHZhciBmbiA9IGZhciAtIG5lYXI7XG4gICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICAyIC8gcmwsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMiAvIHRiLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC0yIC8gZm4sXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShsZWZ0ICsgcmlnaHQpIC8gcmwsXG4gICAgICAgICAgICAtKHRvcCArIGJvdHRvbSkgLyB0YixcbiAgICAgICAgICAgIC0oZmFyICsgbmVhcikgLyBmbixcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0Lmxvb2tBdCA9IGZ1bmN0aW9uIChwb3NpdGlvbiwgdGFyZ2V0LCB1cCkge1xuICAgICAgICBpZiAodXAgPT09IHZvaWQgMCkgeyB1cCA9IHZlYzNfMS5kZWZhdWx0LnVwOyB9XG4gICAgICAgIGlmIChwb3NpdGlvbi5lcXVhbHModGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWRlbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHogPSB2ZWMzXzEuZGVmYXVsdC5kaWZmZXJlbmNlKHBvc2l0aW9uLCB0YXJnZXQpLm5vcm1hbGl6ZSgpO1xuICAgICAgICB2YXIgeCA9IHZlYzNfMS5kZWZhdWx0LmNyb3NzKHVwLCB6KS5ub3JtYWxpemUoKTtcbiAgICAgICAgdmFyIHkgPSB2ZWMzXzEuZGVmYXVsdC5jcm9zcyh6LCB4KS5ub3JtYWxpemUoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgIHgueCxcbiAgICAgICAgICAgIHkueCxcbiAgICAgICAgICAgIHoueCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4LnksXG4gICAgICAgICAgICB5LnksXG4gICAgICAgICAgICB6LnksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgeC56LFxuICAgICAgICAgICAgeS56LFxuICAgICAgICAgICAgei56LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIC12ZWMzXzEuZGVmYXVsdC5kb3QoeCwgcG9zaXRpb24pLFxuICAgICAgICAgICAgLXZlYzNfMS5kZWZhdWx0LmRvdCh5LCBwb3NpdGlvbiksXG4gICAgICAgICAgICAtdmVjM18xLmRlZmF1bHQuZG90KHosIHBvc2l0aW9uKSxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb2R1Y3QgPSBmdW5jdGlvbiAobTEsIG0yLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIGEwMCA9IG0xLmF0KDApO1xuICAgICAgICB2YXIgYTAxID0gbTEuYXQoMSk7XG4gICAgICAgIHZhciBhMDIgPSBtMS5hdCgyKTtcbiAgICAgICAgdmFyIGEwMyA9IG0xLmF0KDMpO1xuICAgICAgICB2YXIgYTEwID0gbTEuYXQoNCk7XG4gICAgICAgIHZhciBhMTEgPSBtMS5hdCg1KTtcbiAgICAgICAgdmFyIGExMiA9IG0xLmF0KDYpO1xuICAgICAgICB2YXIgYTEzID0gbTEuYXQoNyk7XG4gICAgICAgIHZhciBhMjAgPSBtMS5hdCg4KTtcbiAgICAgICAgdmFyIGEyMSA9IG0xLmF0KDkpO1xuICAgICAgICB2YXIgYTIyID0gbTEuYXQoMTApO1xuICAgICAgICB2YXIgYTIzID0gbTEuYXQoMTEpO1xuICAgICAgICB2YXIgYTMwID0gbTEuYXQoMTIpO1xuICAgICAgICB2YXIgYTMxID0gbTEuYXQoMTMpO1xuICAgICAgICB2YXIgYTMyID0gbTEuYXQoMTQpO1xuICAgICAgICB2YXIgYTMzID0gbTEuYXQoMTUpO1xuICAgICAgICB2YXIgYjAwID0gbTIuYXQoMCk7XG4gICAgICAgIHZhciBiMDEgPSBtMi5hdCgxKTtcbiAgICAgICAgdmFyIGIwMiA9IG0yLmF0KDIpO1xuICAgICAgICB2YXIgYjAzID0gbTIuYXQoMyk7XG4gICAgICAgIHZhciBiMTAgPSBtMi5hdCg0KTtcbiAgICAgICAgdmFyIGIxMSA9IG0yLmF0KDUpO1xuICAgICAgICB2YXIgYjEyID0gbTIuYXQoNik7XG4gICAgICAgIHZhciBiMTMgPSBtMi5hdCg3KTtcbiAgICAgICAgdmFyIGIyMCA9IG0yLmF0KDgpO1xuICAgICAgICB2YXIgYjIxID0gbTIuYXQoOSk7XG4gICAgICAgIHZhciBiMjIgPSBtMi5hdCgxMCk7XG4gICAgICAgIHZhciBiMjMgPSBtMi5hdCgxMSk7XG4gICAgICAgIHZhciBiMzAgPSBtMi5hdCgxMik7XG4gICAgICAgIHZhciBiMzEgPSBtMi5hdCgxMyk7XG4gICAgICAgIHZhciBiMzIgPSBtMi5hdCgxNCk7XG4gICAgICAgIHZhciBiMzMgPSBtMi5hdCgxNSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pbml0KFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAgKyBiMDMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxICsgYjAzICogYTMxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMiArIGIwMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDMgKyBiMDEgKiBhMTMgKyBiMDIgKiBhMjMgKyBiMDMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwICsgYjEzICogYTMwLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMSArIGIxMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjIgKyBiMTMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjEwICogYTAzICsgYjExICogYTEzICsgYjEyICogYTIzICsgYjEzICogYTMzLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMCArIGIyMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjEgKyBiMjMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyICsgYjIzICogYTMyLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMyArIGIyMSAqIGExMyArIGIyMiAqIGEyMyArIGIyMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDAgKyBiMzEgKiBhMTAgKyBiMzIgKiBhMjAgKyBiMzMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjMwICogYTAxICsgYjMxICogYTExICsgYjMyICogYTIxICsgYjMzICogYTMxLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMiArIGIzMSAqIGExMiArIGIzMiAqIGEyMiArIGIzMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDMgKyBiMzEgKiBhMTMgKyBiMzIgKiBhMjMgKyBiMzMgKiBhMzNcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbWF0NChbXG4gICAgICAgICAgICAgICAgYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwICsgYjAzICogYTMwLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMSArIGIwMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjIgKyBiMDMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjAwICogYTAzICsgYjAxICogYTEzICsgYjAyICogYTIzICsgYjAzICogYTMzLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMCArIGIxMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjEgKyBiMTMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyICsgYjEzICogYTMyLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMyArIGIxMSAqIGExMyArIGIxMiAqIGEyMyArIGIxMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjAgKyBiMjMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxICsgYjIzICogYTMxLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMiArIGIyMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDMgKyBiMjEgKiBhMTMgKyBiMjIgKiBhMjMgKyBiMjMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjMwICogYTAwICsgYjMxICogYTEwICsgYjMyICogYTIwICsgYjMzICogYTMwLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMSArIGIzMSAqIGExMSArIGIzMiAqIGEyMSArIGIzMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDIgKyBiMzEgKiBhMTIgKyBiMzIgKiBhMjIgKyBiMzMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjMwICogYTAzICsgYjMxICogYTEzICsgYjMyICogYTIzICsgYjMzICogYTMzXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0NC5pZGVudGl0eSA9IG5ldyBtYXQ0KCkuc2V0SWRlbnRpdHkoKTtcbiAgICByZXR1cm4gbWF0NDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBtYXQ0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0NC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9hZGphY2VudC1vdmVybG9hZC1zaWduYXR1cmVzICovXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHkgKi9cbnZhciBtYXQzXzEgPSByZXF1aXJlKFwiLi9tYXQzXCIpO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL21hdDRcIik7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciBxdWF0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHF1YXQodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5encgPSB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwielwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcIndcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4eVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4eXpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieHl6d1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdLCB0aGlzLnZhbHVlc1szXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHF1YXQucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gMDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGRlc3QudmFsdWVzW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5yb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoMi4wICogKHggKiB5ICsgdyAqIHopLCB3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeik7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5waXRjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKDIuMCAqICh5ICogeiArIHcgKiB4KSwgdyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUueWF3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hc2luKDIuMCAqICh0aGlzLnggKiB0aGlzLnogLSB0aGlzLncgKiB0aGlzLnkpKTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMudmFsdWVzW2ldIC0gdmVjdG9yLmF0KGkpKSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnNldElkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLnogPSAwO1xuICAgICAgICB0aGlzLncgPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmNhbGN1bGF0ZVcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHRoaXMudyA9IC1NYXRoLnNxcnQoTWF0aC5hYnMoMS4wIC0geCAqIHggLSB5ICogeSAtIHogKiB6KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRvdCA9IHF1YXQuZG90KHRoaXMsIHRoaXMpO1xuICAgICAgICBpZiAoIWRvdCkge1xuICAgICAgICAgICAgdGhpcy54eXp3ID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGludkRvdCA9IGRvdCA/IDEuMCAvIGRvdCA6IDA7XG4gICAgICAgIHRoaXMueCAqPSAtaW52RG90O1xuICAgICAgICB0aGlzLnkgKj0gLWludkRvdDtcbiAgICAgICAgdGhpcy56ICo9IC1pbnZEb3Q7XG4gICAgICAgIHRoaXMudyAqPSBpbnZEb3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuY29uanVnYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhbHVlc1swXSAqPSAtMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gKj0gLTE7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdICo9IC0xO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHcpO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdyk7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIGRlc3QueiA9IDA7XG4gICAgICAgICAgICBkZXN0LncgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ID0geCAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC55ID0geSAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC56ID0geiAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC53ID0gdyAqIGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldICs9IG90aGVyLmF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHExeCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgcTF5ID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBxMXogPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIHExdyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgcTJ4ID0gb3RoZXIueDtcbiAgICAgICAgdmFyIHEyeSA9IG90aGVyLnk7XG4gICAgICAgIHZhciBxMnogPSBvdGhlci56O1xuICAgICAgICB2YXIgcTJ3ID0gb3RoZXIudztcbiAgICAgICAgdGhpcy54ID0gcTF4ICogcTJ3ICsgcTF3ICogcTJ4ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICB0aGlzLnkgPSBxMXkgKiBxMncgKyBxMXcgKiBxMnkgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIHRoaXMueiA9IHExeiAqIHEydyArIHExdyAqIHEyeiArIHExeCAqIHEyeSAtIHExeSAqIHEyeDtcbiAgICAgICAgdGhpcy53ID0gcTF3ICogcTJ3IC0gcTF4ICogcTJ4IC0gcTF5ICogcTJ5IC0gcTF6ICogcTJ6O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLm11bHRpcGx5VmVjMyA9IGZ1bmN0aW9uICh2ZWN0b3IsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzNfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdmFyIHF4ID0gdGhpcy54O1xuICAgICAgICB2YXIgcXkgPSB0aGlzLnk7XG4gICAgICAgIHZhciBxeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHF3ID0gdGhpcy53O1xuICAgICAgICB2YXIgaXggPSBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHk7XG4gICAgICAgIHZhciBpeSA9IHF3ICogeSArIHF6ICogeCAtIHF4ICogejtcbiAgICAgICAgdmFyIGl6ID0gcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4O1xuICAgICAgICB2YXIgaXcgPSAtcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuICAgICAgICBkZXN0LnggPSBpeCAqIHF3ICsgaXcgKiAtcXggKyBpeSAqIC1xeiAtIGl6ICogLXF5O1xuICAgICAgICBkZXN0LnkgPSBpeSAqIHF3ICsgaXcgKiAtcXkgKyBpeiAqIC1xeCAtIGl4ICogLXF6O1xuICAgICAgICBkZXN0LnogPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnRvTWF0MyA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQzXzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICB2YXIgeDIgPSB4ICsgeDtcbiAgICAgICAgdmFyIHkyID0geSArIHk7XG4gICAgICAgIHZhciB6MiA9IHogKyB6O1xuICAgICAgICB2YXIgeHggPSB4ICogeDI7XG4gICAgICAgIHZhciB4eSA9IHggKiB5MjtcbiAgICAgICAgdmFyIHh6ID0geCAqIHoyO1xuICAgICAgICB2YXIgeXkgPSB5ICogeTI7XG4gICAgICAgIHZhciB5eiA9IHkgKiB6MjtcbiAgICAgICAgdmFyIHp6ID0geiAqIHoyO1xuICAgICAgICB2YXIgd3ggPSB3ICogeDI7XG4gICAgICAgIHZhciB3eSA9IHcgKiB5MjtcbiAgICAgICAgdmFyIHd6ID0gdyAqIHoyO1xuICAgICAgICBkZXN0LmluaXQoW1xuICAgICAgICAgICAgMSAtICh5eSArIHp6KSxcbiAgICAgICAgICAgIHh5ICsgd3osXG4gICAgICAgICAgICB4eiAtIHd5LFxuICAgICAgICAgICAgeHkgLSB3eixcbiAgICAgICAgICAgIDEgLSAoeHggKyB6eiksXG4gICAgICAgICAgICB5eiArIHd4LFxuICAgICAgICAgICAgeHogKyB3eSxcbiAgICAgICAgICAgIHl6IC0gd3gsXG4gICAgICAgICAgICAxIC0gKHh4ICsgeXkpXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnRvTWF0NCA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQ0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICB2YXIgeDIgPSB4ICsgeDtcbiAgICAgICAgdmFyIHkyID0geSArIHk7XG4gICAgICAgIHZhciB6MiA9IHogKyB6O1xuICAgICAgICB2YXIgeHggPSB4ICogeDI7XG4gICAgICAgIHZhciB4eSA9IHggKiB5MjtcbiAgICAgICAgdmFyIHh6ID0geCAqIHoyO1xuICAgICAgICB2YXIgeXkgPSB5ICogeTI7XG4gICAgICAgIHZhciB5eiA9IHkgKiB6MjtcbiAgICAgICAgdmFyIHp6ID0geiAqIHoyO1xuICAgICAgICB2YXIgd3ggPSB3ICogeDI7XG4gICAgICAgIHZhciB3eSA9IHcgKiB5MjtcbiAgICAgICAgdmFyIHd6ID0gdyAqIHoyO1xuICAgICAgICBkZXN0LmluaXQoW1xuICAgICAgICAgICAgMSAtICh5eSArIHp6KSxcbiAgICAgICAgICAgIHh5ICsgd3osXG4gICAgICAgICAgICB4eiAtIHd5LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHh5IC0gd3osXG4gICAgICAgICAgICAxIC0gKHh4ICsgenopLFxuICAgICAgICAgICAgeXogKyB3eCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4eiArIHd5LFxuICAgICAgICAgICAgeXogLSB3eCxcbiAgICAgICAgICAgIDEgLSAoeHggKyB5eSksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMVxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LmRvdCA9IGZ1bmN0aW9uIChxMSwgcTIpIHtcbiAgICAgICAgcmV0dXJuIHExLnggKiBxMi54ICsgcTEueSAqIHEyLnkgKyBxMS56ICogcTIueiArIHExLncgKiBxMi53O1xuICAgIH07XG4gICAgcXVhdC5zdW0gPSBmdW5jdGlvbiAocTEsIHEyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gcTEueCArIHEyLng7XG4gICAgICAgIGRlc3QueSA9IHExLnkgKyBxMi55O1xuICAgICAgICBkZXN0LnogPSBxMS56ICsgcTIuejtcbiAgICAgICAgZGVzdC53ID0gcTEudyArIHEyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm9kdWN0ID0gZnVuY3Rpb24gKHExLCBxMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxMXggPSBxMS54O1xuICAgICAgICB2YXIgcTF5ID0gcTEueTtcbiAgICAgICAgdmFyIHExeiA9IHExLno7XG4gICAgICAgIHZhciBxMXcgPSBxMS53O1xuICAgICAgICB2YXIgcTJ4ID0gcTIueDtcbiAgICAgICAgdmFyIHEyeSA9IHEyLnk7XG4gICAgICAgIHZhciBxMnogPSBxMi56O1xuICAgICAgICB2YXIgcTJ3ID0gcTIudztcbiAgICAgICAgZGVzdC54ID0gcTF4ICogcTJ3ICsgcTF3ICogcTJ4ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICBkZXN0LnkgPSBxMXkgKiBxMncgKyBxMXcgKiBxMnkgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIGRlc3QueiA9IHExeiAqIHEydyArIHExdyAqIHEyeiArIHExeCAqIHEyeSAtIHExeSAqIHEyeDtcbiAgICAgICAgZGVzdC53ID0gcTF3ICogcTJ3IC0gcTF4ICogcTJ4IC0gcTF5ICogcTJ5IC0gcTF6ICogcTJ6O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuY3Jvc3MgPSBmdW5jdGlvbiAocTEsIHEyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHExeCA9IHExLng7XG4gICAgICAgIHZhciBxMXkgPSBxMS55O1xuICAgICAgICB2YXIgcTF6ID0gcTEuejtcbiAgICAgICAgdmFyIHExdyA9IHExLnc7XG4gICAgICAgIHZhciBxMnggPSBxMi54O1xuICAgICAgICB2YXIgcTJ5ID0gcTIueTtcbiAgICAgICAgdmFyIHEyeiA9IHEyLno7XG4gICAgICAgIHZhciBxMncgPSBxMi53O1xuICAgICAgICBkZXN0LnggPSBxMXcgKiBxMnogKyBxMXogKiBxMncgKyBxMXggKiBxMnkgLSBxMXkgKiBxMng7XG4gICAgICAgIGRlc3QueSA9IHExdyAqIHEydyAtIHExeCAqIHEyeCAtIHExeSAqIHEyeSAtIHExeiAqIHEyejtcbiAgICAgICAgZGVzdC56ID0gcTF3ICogcTJ4ICsgcTF4ICogcTJ3ICsgcTF5ICogcTJ6IC0gcTF6ICogcTJ5O1xuICAgICAgICBkZXN0LncgPSBxMXcgKiBxMnkgKyBxMXkgKiBxMncgKyBxMXogKiBxMnggLSBxMXggKiBxMno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5zaG9ydE1peCA9IGZ1bmN0aW9uIChxMSwgcTIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGltZSA8PSAwLjApIHtcbiAgICAgICAgICAgIGRlc3QueHl6dyA9IHExLnh5enc7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aW1lID49IDEuMCkge1xuICAgICAgICAgICAgZGVzdC54eXp3ID0gcTIueHl6dztcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb3MgPSBxdWF0LmRvdChxMSwgcTIpO1xuICAgICAgICB2YXIgcTJhID0gcTIuY29weSgpO1xuICAgICAgICBpZiAoY29zIDwgMC4wKSB7XG4gICAgICAgICAgICBxMmEuaW52ZXJzZSgpO1xuICAgICAgICAgICAgY29zID0gLWNvcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgazA7XG4gICAgICAgIHZhciBrMTtcbiAgICAgICAgaWYgKGNvcyA+IDAuOTk5OSkge1xuICAgICAgICAgICAgazAgPSAxIC0gdGltZTtcbiAgICAgICAgICAgIGsxID0gMCArIHRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2luID0gTWF0aC5zcXJ0KDEgLSBjb3MgKiBjb3MpO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMihzaW4sIGNvcyk7XG4gICAgICAgICAgICB2YXIgb25lT3ZlclNpbiA9IDEgLyBzaW47XG4gICAgICAgICAgICBrMCA9IE1hdGguc2luKCgxIC0gdGltZSkgKiBhbmdsZSkgKiBvbmVPdmVyU2luO1xuICAgICAgICAgICAgazEgPSBNYXRoLnNpbigoMCArIHRpbWUpICogYW5nbGUpICogb25lT3ZlclNpbjtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSBrMCAqIHExLnggKyBrMSAqIHEyYS54O1xuICAgICAgICBkZXN0LnkgPSBrMCAqIHExLnkgKyBrMSAqIHEyYS55O1xuICAgICAgICBkZXN0LnogPSBrMCAqIHExLnogKyBrMSAqIHEyYS56O1xuICAgICAgICBkZXN0LncgPSBrMCAqIHExLncgKyBrMSAqIHEyYS53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQubWl4ID0gZnVuY3Rpb24gKHExLCBxMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb3NIYWxmVGhldGEgPSBxMS54ICogcTIueCArIHExLnkgKiBxMi55ICsgcTEueiAqIHEyLnogKyBxMS53ICogcTIudztcbiAgICAgICAgaWYgKE1hdGguYWJzKGNvc0hhbGZUaGV0YSkgPj0gMS4wKSB7XG4gICAgICAgICAgICBkZXN0Lnh5encgPSBxMS54eXp3O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyhjb3NIYWxmVGhldGEpO1xuICAgICAgICB2YXIgc2luSGFsZlRoZXRhID0gTWF0aC5zcXJ0KDEuMCAtIGNvc0hhbGZUaGV0YSAqIGNvc0hhbGZUaGV0YSk7XG4gICAgICAgIGlmIChNYXRoLmFicyhzaW5IYWxmVGhldGEpIDwgMC4wMDEpIHtcbiAgICAgICAgICAgIGRlc3QueCA9IHExLnggKiAwLjUgKyBxMi54ICogMC41O1xuICAgICAgICAgICAgZGVzdC55ID0gcTEueSAqIDAuNSArIHEyLnkgKiAwLjU7XG4gICAgICAgICAgICBkZXN0LnogPSBxMS56ICogMC41ICsgcTIueiAqIDAuNTtcbiAgICAgICAgICAgIGRlc3QudyA9IHExLncgKiAwLjUgKyBxMi53ICogMC41O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJhdGlvQSA9IE1hdGguc2luKCgxIC0gdGltZSkgKiBoYWxmVGhldGEpIC8gc2luSGFsZlRoZXRhO1xuICAgICAgICB2YXIgcmF0aW9CID0gTWF0aC5zaW4odGltZSAqIGhhbGZUaGV0YSkgLyBzaW5IYWxmVGhldGE7XG4gICAgICAgIGRlc3QueCA9IHExLnggKiByYXRpb0EgKyBxMi54ICogcmF0aW9CO1xuICAgICAgICBkZXN0LnkgPSBxMS55ICogcmF0aW9BICsgcTIueSAqIHJhdGlvQjtcbiAgICAgICAgZGVzdC56ID0gcTEueiAqIHJhdGlvQSArIHEyLnogKiByYXRpb0I7XG4gICAgICAgIGRlc3QudyA9IHExLncgKiByYXRpb0EgKyBxMi53ICogcmF0aW9CO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuZnJvbUF4aXNBbmdsZSA9IGZ1bmN0aW9uIChheGlzLCBhbmdsZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIGFuZ2xlICo9IDAuNTtcbiAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgZGVzdC54ID0gYXhpcy54ICogc2luO1xuICAgICAgICBkZXN0LnkgPSBheGlzLnkgKiBzaW47XG4gICAgICAgIGRlc3QueiA9IGF4aXMueiAqIHNpbjtcbiAgICAgICAgZGVzdC53ID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuaWRlbnRpdHkgPSBuZXcgcXVhdCgpLnNldElkZW50aXR5KCk7XG4gICAgcmV0dXJuIHF1YXQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gcXVhdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1YXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciB2ZWMyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHZlYzIodmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5ID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMyLnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMi5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzIucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgdmVjMi5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSB0aGlzLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSAtdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSAtdGhpcy55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy54IC0gdmVjdG9yLngpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueSAtIHZlY3Rvci55KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZExlbmd0aCgpKTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHk7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCArPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICs9IHZlY3Rvci55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLT0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAtPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICo9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uICh2YWx1ZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC55ICo9IHZhbHVlO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMS4wIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgKj0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm11bHRpcGx5TWF0MiA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjMih0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm11bHRpcGx5TWF0MyA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjMih0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzIuY3Jvc3MgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzXzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgeiA9IHggKiB5MiAtIHkgKiB4MjtcbiAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgZGVzdC56ID0gejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLmRvdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgcmV0dXJuIHZlY3Rvci54ICogdmVjdG9yMi54ICsgdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgfTtcbiAgICB2ZWMyLmRpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZERpc3RhbmNlKHZlY3RvciwgdmVjdG9yMikpO1xuICAgIH07XG4gICAgdmVjMi5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yMi54IC0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yMi55IC0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5O1xuICAgIH07XG4gICAgdmVjMi5kaXJlY3Rpb24gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggPSB4ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgPSB5ICogbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIubWl4ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnggPSB4ICsgdGltZSAqICh4MiAtIHgpO1xuICAgICAgICBkZXN0LnkgPSB5ICsgdGltZSAqICh5MiAtIHkpO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIuc3VtID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHZlY3RvcjIueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLmRpZmZlcmVuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5xdW90aWVudCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAvIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLyB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi56ZXJvID0gbmV3IHZlYzIoWzAsIDBdKTtcbiAgICB2ZWMyLm9uZSA9IG5ldyB2ZWMyKFsxLCAxXSk7XG4gICAgcmV0dXJuIHZlYzI7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gdmVjMjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZlYzIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcXVhdF8xID0gcmVxdWlyZShcIi4vcXVhdFwiKTtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY2xhc3MtbmFtZS1jYXNpbmdcbnZhciB2ZWMzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHZlYzModmFsdWVzKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnh5eiA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieHlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieHl6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgdmVjMy5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLnogPSAwO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSB0aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IHRoaXMuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IC10aGlzLng7XG4gICAgICAgIGRlc3QueSA9IC10aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IC10aGlzLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnggLSB2ZWN0b3IueCkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy55IC0gdmVjdG9yLnkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueiAtIHZlY3Rvci56KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZExlbmd0aCgpKTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCArPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICs9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKz0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAtPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC09IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLT0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICo9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKj0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56IC89IHZlY3Rvci56O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZhbHVlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnkgKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueiAqPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIGRlc3QueiA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxLjAgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueSAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueiAqPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUubXVsdGlwbHlCeU1hdDMgPSBmdW5jdGlvbiAobWF0cml4LCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdHJpeC5tdWx0aXBseVZlYzModGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5tdWx0aXBseUJ5UXVhdCA9IGZ1bmN0aW9uIChxdWF0ZXJuaW9uLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHF1YXRlcm5pb24ubXVsdGlwbHlWZWMzKHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUudG9RdWF0ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGMgPSBuZXcgdmVjMygpO1xuICAgICAgICB2YXIgcyA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIGMueCA9IE1hdGguY29zKHRoaXMueCAqIDAuNSk7XG4gICAgICAgIHMueCA9IE1hdGguc2luKHRoaXMueCAqIDAuNSk7XG4gICAgICAgIGMueSA9IE1hdGguY29zKHRoaXMueSAqIDAuNSk7XG4gICAgICAgIHMueSA9IE1hdGguc2luKHRoaXMueSAqIDAuNSk7XG4gICAgICAgIGMueiA9IE1hdGguY29zKHRoaXMueiAqIDAuNSk7XG4gICAgICAgIHMueiA9IE1hdGguc2luKHRoaXMueiAqIDAuNSk7XG4gICAgICAgIGRlc3QueCA9IHMueCAqIGMueSAqIGMueiAtIGMueCAqIHMueSAqIHMuejtcbiAgICAgICAgZGVzdC55ID0gYy54ICogcy55ICogYy56ICsgcy54ICogYy55ICogcy56O1xuICAgICAgICBkZXN0LnogPSBjLnggKiBjLnkgKiBzLnogLSBzLnggKiBzLnkgKiBjLno7XG4gICAgICAgIGRlc3QudyA9IGMueCAqIGMueSAqIGMueiArIHMueCAqIHMueSAqIHMuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLmNyb3NzID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgejIgPSB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QueCA9IHkgKiB6MiAtIHogKiB5MjtcbiAgICAgICAgZGVzdC55ID0geiAqIHgyIC0geCAqIHoyO1xuICAgICAgICBkZXN0LnogPSB4ICogeTIgLSB5ICogeDI7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5kb3QgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHZhciB4MiA9IHZlY3RvcjIueDtcbiAgICAgICAgdmFyIHkyID0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgejIgPSB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiB4ICogeDIgKyB5ICogeTIgKyB6ICogejI7XG4gICAgfTtcbiAgICB2ZWMzLmRpc3RhbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZERpc3RhbmNlKHZlY3RvciwgdmVjdG9yMikpO1xuICAgIH07XG4gICAgdmVjMy5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yMi54IC0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yMi55IC0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yMi56IC0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgfTtcbiAgICB2ZWMzLmRpcmVjdGlvbiA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56IC0gdmVjdG9yMi56O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgZGVzdC56ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCA9IHggKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueSA9IHkgKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueiA9IHogKiBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5taXggPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB0aW1lICogKHZlY3RvcjIueCAtIHZlY3Rvci54KTtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB0aW1lICogKHZlY3RvcjIueSAtIHZlY3Rvci55KTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKyB0aW1lICogKHZlY3RvcjIueiAtIHZlY3Rvci56KTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnN1bSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuZGlmZmVyZW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56IC0gdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICogdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucXVvdGllbnQgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC8gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAvIHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnplcm8gPSBuZXcgdmVjMyhbMCwgMCwgMF0pO1xuICAgIHZlYzMub25lID0gbmV3IHZlYzMoWzEsIDEsIDFdKTtcbiAgICB2ZWMzLnVwID0gbmV3IHZlYzMoWzAsIDEsIDBdKTtcbiAgICB2ZWMzLnJpZ2h0ID0gbmV3IHZlYzMoWzEsIDAsIDBdKTtcbiAgICB2ZWMzLmZvcndhcmQgPSBuZXcgdmVjMyhbMCwgMCwgMV0pO1xuICAgIHJldHVybiB2ZWMzO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZlYzM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWMzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIHZlYzQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gdmVjNCh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMueHl6dyA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwid1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInh5elwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ4eXp3XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl0sIHRoaXMudmFsdWVzWzNdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJnXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwiYlwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcImFcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyZ2JcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwicmdiYVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdLCB0aGlzLnZhbHVlc1szXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHZlYzQucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICAgICAgdGhpcy56ID0gMDtcbiAgICAgICAgdGhpcy53ID0gMDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gdGhpcy55O1xuICAgICAgICBkZXN0LnogPSB0aGlzLno7XG4gICAgICAgIGRlc3QudyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IC10aGlzLng7XG4gICAgICAgIGRlc3QueSA9IC10aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IC10aGlzLno7XG4gICAgICAgIGRlc3QudyA9IC10aGlzLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnggLSB2ZWN0b3IueCkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy55IC0gdmVjdG9yLnkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueiAtIHZlY3Rvci56KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLncgLSB2ZWN0b3IudykgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnNxdWFyZWRMZW5ndGgoKSk7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogeiArIHcgKiB3O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSArPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56ICs9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLncgKz0gdmVjdG9yLnc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAtPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC09IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLT0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudyAtPSB2ZWN0b3IudztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICo9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAqPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53ICo9IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLz0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAvPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53IC89IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZhbHVlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnkgKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueiAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC53ICo9IHZhbHVlO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCAqPSAwO1xuICAgICAgICAgICAgZGVzdC55ICo9IDA7XG4gICAgICAgICAgICBkZXN0LnogKj0gMDtcbiAgICAgICAgICAgIGRlc3QudyAqPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMS4wIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LnogKj0gbGVuZ3RoO1xuICAgICAgICBkZXN0LncgKj0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm11bHRpcGx5TWF0NCA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjNCh0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzQubWl4ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdGltZSAqICh2ZWN0b3IyLnggLSB2ZWN0b3IueCk7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdGltZSAqICh2ZWN0b3IyLnkgLSB2ZWN0b3IueSk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdGltZSAqICh2ZWN0b3IyLnogLSB2ZWN0b3Iueik7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53ICsgdGltZSAqICh2ZWN0b3IyLncgLSB2ZWN0b3Iudyk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5zdW0gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiArIHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgKyB2ZWN0b3IyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5kaWZmZXJlbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLSB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53IC0gdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvZHVjdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAqIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKiB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICogdmVjdG9yMi56O1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyAqIHZlY3RvcjIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnF1b3RpZW50ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC8gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAvIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLyB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53IC8gdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQuemVybyA9IG5ldyB2ZWM0KFswLCAwLCAwLCAxXSk7XG4gICAgdmVjNC5vbmUgPSBuZXcgdmVjNChbMSwgMSwgMSwgMV0pO1xuICAgIHJldHVybiB2ZWM0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZlYzQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWM0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLypcbiAqIENvcHlyaWdodCAyMDEwLCBHb29nbGUgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmVcbiAqIG1ldDpcbiAqXG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZVxuICogY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lclxuICogaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZVxuICogZGlzdHJpYnV0aW9uLlxuICogICAgICogTmVpdGhlciB0aGUgbmFtZSBvZiBHb29nbGUgSW5jLiBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb21cbiAqIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SU1xuICogXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVFxuICogTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SXG4gKiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVFxuICogT1dORVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsXG4gKiBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UXG4gKiBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSxcbiAqIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWVxuICogVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGNvbnRhaW5zIGZ1bmN0aW9ucyBldmVyeSB3ZWJnbCBwcm9ncmFtIHdpbGwgbmVlZFxuICogYSB2ZXJzaW9uIG9mIG9uZSB3YXkgb3IgYW5vdGhlci5cbiAqXG4gKiBJbnN0ZWFkIG9mIHNldHRpbmcgdXAgYSBjb250ZXh0IG1hbnVhbGx5IGl0IGlzIHJlY29tbWVuZGVkIHRvXG4gKiB1c2UuIFRoaXMgd2lsbCBjaGVjayBmb3Igc3VjY2VzcyBvciBmYWlsdXJlLiBPbiBmYWlsdXJlIGl0XG4gKiB3aWxsIGF0dGVtcHQgdG8gcHJlc2VudCBhbiBhcHByb3JpYXRlIG1lc3NhZ2UgdG8gdGhlIHVzZXIuXG4gKlxuICogICAgICAgZ2wgPSBXZWJHTFV0aWxzLnNldHVwV2ViR0woY2FudmFzKTtcbiAqXG4gKiBGb3IgYW5pbWF0ZWQgV2ViR0wgYXBwcyB1c2Ugb2Ygc2V0VGltZW91dCBvciBzZXRJbnRlcnZhbCBhcmVcbiAqIGRpc2NvdXJhZ2VkLiBJdCBpcyByZWNvbW1lbmRlZCB5b3Ugc3RydWN0dXJlIHlvdXIgcmVuZGVyaW5nXG4gKiBsb29wIGxpa2UgdGhpcy5cbiAqXG4gKiAgICAgICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gKiAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbUZyYW1lKHJlbmRlciwgY2FudmFzKTtcbiAqXG4gKiAgICAgICAgIC8vIGRvIHJlbmRlcmluZ1xuICogICAgICAgICAuLi5cbiAqICAgICAgIH1cbiAqICAgICAgIHJlbmRlcigpO1xuICpcbiAqIFRoaXMgd2lsbCBjYWxsIHlvdXIgcmVuZGVyaW5nIGZ1bmN0aW9uIHVwIHRvIHRoZSByZWZyZXNoIHJhdGVcbiAqIG9mIHlvdXIgZGlzcGxheSBidXQgd2lsbCBzdG9wIHJlbmRlcmluZyBpZiB5b3VyIGFwcCBpcyBub3RcbiAqIHZpc2libGUuXG4gKi9cbi8qKlxuICogQ3JlYXRlcyB0aGUgSFRMTSBmb3IgYSBmYWlsdXJlIG1lc3NhZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBjYW52YXNDb250YWluZXJJZCBpZCBvZiBjb250YWluZXIgb2YgdGggY2FudmFzLlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgaHRtbC5cbiAqL1xudmFyIG1ha2VGYWlsSFRNTCA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICByZXR1cm4gKFwiXCIgK1xuICAgICAgICAnPHRhYmxlIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzhDRTsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTtcIj48dHI+JyArXG4gICAgICAgICc8dGQgYWxpZ249XCJjZW50ZXJcIj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJkaXNwbGF5OiB0YWJsZS1jZWxsOyB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1wiPicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cIlwiPicgK1xuICAgICAgICBtc2cgK1xuICAgICAgICBcIjwvZGl2PlwiICtcbiAgICAgICAgXCI8L2Rpdj5cIiArXG4gICAgICAgIFwiPC90ZD48L3RyPjwvdGFibGU+XCIpO1xufTtcbi8qKlxuICogTWVzYXNnZSBmb3IgZ2V0dGluZyBhIHdlYmdsIGJyb3dzZXJcbiAqL1xudmFyIEdFVF9BX1dFQkdMX0JST1dTRVIgPSBcIlwiICtcbiAgICBcIlRoaXMgcGFnZSByZXF1aXJlcyBhIGJyb3dzZXIgdGhhdCBzdXBwb3J0cyBXZWJHTC48YnIvPlwiICtcbiAgICAnPGEgaHJlZj1cImh0dHA6Ly9nZXQud2ViZ2wub3JnXCI+Q2xpY2sgaGVyZSB0byB1cGdyYWRlIHlvdXIgYnJvd3Nlci48L2E+Jztcbi8qKlxuICogTWVzYXNnZSBmb3IgbmVlZCBiZXR0ZXIgaGFyZHdhcmVcbiAqL1xudmFyIE9USEVSX1BST0JMRU0gPSBcIkl0IGRvZXNuJ3QgYXBwZWFyIHlvdXIgY29tcHV0ZXIgY2FuIHN1cHBvcnRcXG5XZWJHTC48YnIvPiA8YSBocmVmPVxcXCJodHRwOi8vZ2V0LndlYmdsLm9yZy90cm91Ymxlc2hvb3RpbmcvXFxcIj5DbGljayBoZXJlIGZvclxcbm1vcmUgaW5mb3JtYXRpb24uPC9hPlwiO1xuLyoqXG4gKiBDcmVhdGVzIGEgd2ViZ2wgY29udGV4dC5cbiAqIEBwYXJhbSB7IUNhbnZhc30gY2FudmFzIFRoZSBjYW52YXMgdGFnIHRvIGdldCBjb250ZXh0IGZyb20uIElmIG9uZSBpcyBub3RcbiAqIHBhc3NlZCBpbiBvbmUgd2lsbCBiZSBjcmVhdGVkLlxuICogQHJldHVybiB7IVdlYkdMQ29udGV4dH0gVGhlIGNyZWF0ZWQgY29udGV4dC5cbiAqL1xuZXhwb3J0cy5jcmVhdGUzRENvbnRleHQgPSBmdW5jdGlvbiAoY2FudmFzLCBvcHRBdHRyaWJzKSB7XG4gICAgdmFyIG5hbWVzID0gW1wid2ViZ2xcIiwgXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgXCJ3ZWJraXQtM2RcIiwgXCJtb3otd2ViZ2xcIl07XG4gICAgdmFyIGNvbnRleHQgPSBudWxsO1xuICAgIGZvciAodmFyIF9pID0gMCwgbmFtZXNfMSA9IG5hbWVzOyBfaSA8IG5hbWVzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBuID0gbmFtZXNfMVtfaV07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQobiwgb3B0QXR0cmlicyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjb250ZXh0ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVuYWJsZSB0byBjcmVhdGUgM0QgY29udGV4dFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRleHQ7XG59O1xuLyoqXG4gKiBDcmVhdGVzIGEgd2ViZ2wgY29udGV4dC4gSWYgY3JlYXRpb24gZmFpbHMgaXQgd2lsbFxuICogY2hhbmdlIHRoZSBjb250ZW50cyBvZiB0aGUgY29udGFpbmVyIG9mIHRoZSA8Y2FudmFzPlxuICogdGFnIHRvIGFuIGVycm9yIG1lc3NhZ2Ugd2l0aCB0aGUgY29ycmVjdCBsaW5rcyBmb3IgV2ViR0wuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNhbnZhcyBUaGUgY2FudmFzIGVsZW1lbnQgdG8gY3JlYXRlIGEgY29udGV4dCBmcm9tLlxuICogQHBhcmFtIHtXZWJHTENvbnRleHRDcmVhdGlvbkF0dGlyYnV0ZXN9IG9wdF9hdHRyaWJzIEFueSBjcmVhdGlvblxuICogYXR0cmlidXRlcyB5b3Ugd2FudCB0byBwYXNzIGluLlxuICogQHJldHVybiB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBUaGUgY3JlYXRlZCBjb250ZXh0LlxuICovXG5leHBvcnRzLnNldHVwV2ViR0wgPSBmdW5jdGlvbiAoY2FudmFzLCBvcHRBdHRyaWJzKSB7XG4gICAgdmFyIHNob3dMaW5rID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gY2FudmFzLnBhcmVudE5vZGU7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBtYWtlRmFpbEhUTUwoc3RyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgaWYgKCF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgIHNob3dMaW5rKEdFVF9BX1dFQkdMX0JST1dTRVIpO1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IGV4cG9ydHMuY3JlYXRlM0RDb250ZXh0KGNhbnZhcywgb3B0QXR0cmlicyk7XG4gICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHNob3dMaW5rKE9USEVSX1BST0JMRU0pO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dDtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD13ZWJnbC11dGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogSm9zZXBoIFBldGl0dGkgLSBDUyA0NzMxIENvbXB1dGVyIEdyYXBoaWNzIEZpbmFsIFByb2plY3QsIFBhcnQgMVxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaGVscGVyc18xID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKTtcbnZhciBpbml0U2hhZGVyc18xID0gcmVxdWlyZShcIi4vbGliL2luaXRTaGFkZXJzXCIpO1xudmFyIHdlYmdsX3V0aWxzXzEgPSByZXF1aXJlKFwiLi9saWIvd2ViZ2wtdXRpbHNcIik7XG52YXIgcmVuZGVyXzEgPSByZXF1aXJlKFwiLi9yZW5kZXJcIik7XG52YXIgZmlsZV8xID0gcmVxdWlyZShcIi4vZmlsZVwiKTtcbnZhciBNb2JpbGVFbGVtZW50XzEgPSByZXF1aXJlKFwiLi9Nb2JpbGVFbGVtZW50XCIpO1xudmFyIG1vZGVsc18xID0gcmVxdWlyZShcIi4vbW9kZWxzXCIpO1xudmFyIHZlYzRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjNFwiKTtcbi8qKlxuICogQWxsIGdsb2JhbCB2YXJpYWJsZXMgYXJlIHN0b3JlZCBpbiB0aGlzIG9iamVjdCB0byBtYWtlIHRoZW0gYWNjZXNzaWJsZSBmcm9tXG4gKiBhbnkgbW9kdWxlXG4gKi9cbmV4cG9ydHMuR0xPQkFMUyA9IHtcbiAgICAvKipcbiAgICAgKiBnbG9iYWwgdmFyaWFibGUgdXNlZCB0byBzdG9yZSB0aGUgSUQgb2YgdGhlIGFuaW1hdGlvbiBjYWxsYmFjayBzbyBpdCBjYW4gYmVcbiAgICAgKiBjYW5jZWxsZWQgbGF0ZXJcbiAgICAgKi9cbiAgICBjYWxsYmFja0lEOiB1bmRlZmluZWRcbn07XG5mdW5jdGlvbiBtYWluKCkge1xuICAgIC8vIGNyZWF0ZSB0aGUgPGNhbnZhcz4gZWxlbWVudFxuICAgIHZhciBjYW52YXMgPSBoZWxwZXJzXzEuY3JlYXRlQ2FudmFzKCk7XG4gICAgLy8gY3JlYXRlIGZpbGUgaW5wdXRcbiAgICB2YXIgZmlsZUlucHV0ID0gZmlsZV8xLmNyZWF0ZUZpbGVJbnB1dCgpO1xuICAgIC8vIGNyZWF0ZSB0aGUgbW9iaWxlXG4gICAgdmFyIG1vYmlsZSA9IG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChtb2RlbHNfMS5nZXRDdWJlKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4wLCAwLjAsIDEuMCwgMV0pKTtcbiAgICAvL21vYmlsZS5uZXh0Um90RGlyID0gMTtcbiAgICBtb2JpbGUubmV4dFJvdFNwZWVkID0gTWF0aC5QSSAvIDM2MDtcbiAgICAvLyBsZXZlbCAxXG4gICAgdmFyIGExID0gbmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KG1vZGVsc18xLmdldEN1YmUoKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFsxLCAwLjAsIDAuMCwgMV0pKTtcbiAgICAvL2ExLm5leHRSb3REaXIgPSAtMTtcbiAgICB2YXIgYTIgPSBuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQobW9kZWxzXzEuZ2V0U3BoZXJlKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC45OCwgMSwgMC4wNywgMV0pKTtcbiAgICB2YXIgYTMgPSBuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQobW9kZWxzXzEuZ2V0Q3ViZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuMjUsIDAuOTIsIDAuODMsIDFdKSk7XG4gICAgbW9iaWxlLmFkZENoaWxkKGExKTtcbiAgICBtb2JpbGUuYWRkQ2hpbGQoYTIpO1xuICAgIG1vYmlsZS5hZGRDaGlsZChhMyk7XG4gICAgLy8gbGV2ZWwgMlxuICAgIHZhciBiMSA9IG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChtb2RlbHNfMS5nZXRTcGhlcmUoKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjMyLCAwLjI4LCAwLjYxLCAxXSkpO1xuICAgIC8vYjEubmV4dFJvdERpciA9IDE7XG4gICAgYjEubmV4dFJvdFNwZWVkID0gTWF0aC5QSSAvIDE4MDtcbiAgICB2YXIgYjIgPSBuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQobW9kZWxzXzEuZ2V0Q3ViZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuMzUsIDAuNzYsIDAuNzYsIDFdKSk7XG4gICAgdmFyIGIzID0gbmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KG1vZGVsc18xLmdldEN1YmUoKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjc1LCAwLjg3LCAwLjUyLCAxXSkpO1xuICAgIC8vYjMubmV4dFJvdERpciA9IDE7XG4gICAgYjMubmV4dFJvdFNwZWVkID0gTWF0aC5QSSAvIDE4MDtcbiAgICBhMS5hZGRDaGlsZChiMSk7XG4gICAgYTEuYWRkQ2hpbGQoYjIpO1xuICAgIGEzLmFkZENoaWxkKGIzKTtcbiAgICAvLyBsZXZlbCAzXG4gICAgdmFyIGMxID0gbmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KG1vZGVsc18xLmdldFNwaGVyZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuNDksIDAuODcsIDAuMzksIDFdKSk7XG4gICAgdmFyIGMyID0gbmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KG1vZGVsc18xLmdldFNwaGVyZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuODksIDAuNzEsIDAuMDIsIDFdKSk7XG4gICAgdmFyIGMzID0gbmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KG1vZGVsc18xLmdldFNwaGVyZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuMDMsIDAuMywgMC4zOCwgMV0pKTtcbiAgICB2YXIgYzQgPSBuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQobW9kZWxzXzEuZ2V0Q3ViZSgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuNDEsIDAuOTIsIDAuODIsIDFdKSk7XG4gICAgYjEuYWRkQ2hpbGQoYzEpO1xuICAgIGIzLmFkZENoaWxkKGMyKTtcbiAgICBiMy5hZGRDaGlsZChjMyk7XG4gICAgYjMuYWRkQ2hpbGQoYzQpO1xuICAgIG1vYmlsZS5yYW5kb21BZGQobW9kZWxzXzEuZ2V0U3BoZXJlKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMS4wLCAwLCAwLCAxXSkpO1xuICAgIC8vIGdldCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgZm9yIFdlYkdMXG4gICAgdmFyIGdsID0gd2ViZ2xfdXRpbHNfMS5zZXR1cFdlYkdMKGNhbnZhcyk7XG4gICAgaWYgKGdsID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZ2V0IHRoZSByZW5kZXJpbmcgY29udGV4dCBmb3IgV2ViR0xcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gaW5pdGlhbGl6ZSBzaGFkZXJzXG4gICAgdmFyIHByb2dyYW0gPSBpbml0U2hhZGVyc18xLmluaXRTaGFkZXJzKGdsLCBcInZzaGFkZXJcIiwgXCJmc2hhZGVyXCIpO1xuICAgIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XG4gICAgZ2wuY3VsbEZhY2UoZ2wuQkFDSyk7XG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIC8vIGFuZ2xlIG9mIHRoZSBzcG90bGlnaHRcbiAgICB2YXIgcGhpID0gMC45O1xuICAgIC8vIGhhbmRsZSBhIGZpbGUgYmVpbmcgdXBsb2FkZWRcbiAgICBmaWxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZpbGVfMS5nZXRJbnB1dChmaWxlSW5wdXQpXG4gICAgICAgICAgICAudGhlbihmaWxlXzEucGFyc2VGaWxlVGV4dClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIG9iajtcbiAgICAgICAgICAgIC8vIFRPRE8gYWRkIG9iamVjdCB0byB0aGUgbW9iaWxlXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHZhciBzdGFydERyYXdpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNhbmNlbCBhbnkgZXhpc3RpbmcgYW5pbWF0aW9uXG4gICAgICAgIGlmIChleHBvcnRzLkdMT0JBTFMuY2FsbGJhY2tJRCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoZXhwb3J0cy5HTE9CQUxTLmNhbGxiYWNrSUQpO1xuICAgICAgICAvLyBzdGFydCByZW5kZXJpbmdcbiAgICAgICAgcmVuZGVyXzEucmVuZGVyKGNhbnZhcywgZ2wsIHByb2dyYW0sIG1vYmlsZSk7XG4gICAgfTtcbiAgICAvLyBoYW5kbGUga2V5Ym9hcmQgaW5wdXRcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2LmtleS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoa2V5ID09PSBcInBcIikge1xuICAgICAgICAgICAgaWYgKGV2LnNoaWZ0S2V5KVxuICAgICAgICAgICAgICAgIHBoaSArPSAwLjAxO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBoaSAtPSAwLjAxO1xuICAgICAgICAgICAgZ2wudW5pZm9ybTFmKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInBoaVwiKSwgcGhpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSBcIm1cIikge1xuICAgICAgICAgICAgaWYgKGV2LnNoaWZ0S2V5KVxuICAgICAgICAgICAgICAgIG1vYmlsZS5jYWxjdWxhdGVOb3JtYWxzKHRydWUpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1vYmlsZS5jYWxjdWxhdGVOb3JtYWxzKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHN0YXJ0RHJhd2luZygpO1xufVxud2luZG93Lm9ubG9hZCA9IG1haW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjM1wiKTtcbnZhciBoZWxwZXJzXzEgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpO1xuLyoqIGhlbHBlciBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyB2ZXJ0aWNlcyBvZiBhIGN1YmUgKi9cbnZhciBxdWFkID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgLTAuNSwgMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgMC41LCAwLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFswLjUsIDAuNSwgMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbMC41LCAtMC41LCAwLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFstMC41LCAtMC41LCAtMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgMC41LCAtMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbMC41LCAwLjUsIC0wLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFswLjUsIC0wLjUsIC0wLjVdKVxuICAgIF07XG4gICAgcmV0dXJuIFthLCBiLCBjLCBhLCBjLCBkXS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHZlcnRpY2VzW3hdOyB9KTtcbn07XG4vKiogZ2VuZXJhdGVzIGEgY3ViZSBtb2RlbCAqL1xuZXhwb3J0cy5nZXRDdWJlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gW1xuICAgIHF1YWQoMSwgMCwgMywgMiksXG4gICAgcXVhZCgyLCAzLCA3LCA2KSxcbiAgICBxdWFkKDMsIDAsIDQsIDcpLFxuICAgIHF1YWQoNiwgNSwgMSwgMiksXG4gICAgcXVhZCg0LCA1LCA2LCA3KSxcbiAgICBxdWFkKDUsIDQsIDAsIDEpIC8vIGxlZnRcbl07IH07XG4vKiogc3ViZGl2aWRlcyBhIHRldHJhaGVkcm9uIHRvd2FyZHMgYXBwcm94aW1hdGluZyBhIHNwaGVyZSAqL1xudmFyIGRpdmlkZVRyaWFuZ2xlID0gZnVuY3Rpb24gKGEsIGIsIGMsIGNvdW50KSB7XG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICB2YXIgYWIgPSBoZWxwZXJzXzEubWl4KGEsIGIsIDAuNSkubm9ybWFsaXplKCk7XG4gICAgICAgIHZhciBhYyA9IGhlbHBlcnNfMS5taXgoYSwgYywgMC41KS5ub3JtYWxpemUoKTtcbiAgICAgICAgdmFyIGJjID0gaGVscGVyc18xLm1peChiLCBjLCAwLjUpLm5vcm1hbGl6ZSgpO1xuICAgICAgICByZXR1cm4gaGVscGVyc18xLmZsYXR0ZW4oW1xuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYSwgYWIsIGFjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYmMsIGMsIGFjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYWIsIGIsIGJjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYWIsIGJjLCBhYywgY291bnQgLSAxKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBbW2EsIGIsIGNdXTtcbiAgICB9XG59O1xuLyoqIGNyZWF0ZXMgYSB0ZXRyYWhlZHJvbiAqL1xudmFyIHRldHJhaGVkcm9uID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIG4pIHtcbiAgICByZXR1cm4gaGVscGVyc18xLmZsYXR0ZW4oW1xuICAgICAgICBkaXZpZGVUcmlhbmdsZShhLCBiLCBjLCBuKSxcbiAgICAgICAgZGl2aWRlVHJpYW5nbGUoZCwgYywgYiwgbiksXG4gICAgICAgIGRpdmlkZVRyaWFuZ2xlKGEsIGQsIGIsIG4pLFxuICAgICAgICBkaXZpZGVUcmlhbmdsZShhLCBjLCBkLCBuKVxuICAgIF0pO1xufTtcbi8qKiByZXR1cm5zIHRoZSBmYWNlcyBvZiBhIHNwaGVyZSBhcHByb3hpbWF0aW9uICovXG5leHBvcnRzLmdldFNwaGVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdmEgPSBuZXcgdmVjM18xLmRlZmF1bHQoWzAuMCwgMC4wLCAtMS4wXSk7XG4gICAgdmFyIHZiID0gbmV3IHZlYzNfMS5kZWZhdWx0KFswLjAsIDAuOTQyODA5LCAwLjMzMzMzM10pO1xuICAgIHZhciB2YyA9IG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuODE2NDk3LCAtMC40NzE0MDUsIDAuMzMzMzMzXSk7XG4gICAgdmFyIHZkID0gbmV3IHZlYzNfMS5kZWZhdWx0KFswLjgxNjQ5NywgLTAuNDcxNDA1LCAwLjMzMzMzM10pO1xuICAgIHZhciB0ZXQgPSB0ZXRyYWhlZHJvbih2YSwgdmIsIHZjLCB2ZCwgNCk7XG4gICAgcmV0dXJuIHRldC5tYXAoZnVuY3Rpb24gKHRyaSkge1xuICAgICAgICByZXR1cm4gdHJpLm1hcChmdW5jdGlvbiAodmVjKSB7IHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW3ZlYy54ICogMC41LCB2ZWMueSAqIDAuNSwgdmVjLnogKiAwLjVdKTsgfSk7XG4gICAgfSk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kZWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vbWF0NFwiKTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzNcIik7XG52YXIgbWFpbl8xID0gcmVxdWlyZShcIi4vbWFpblwiKTtcbi8qKlxuICogQHBhcmFtIGNhbnZhcyB0aGUgY2FudmFzIHRvIGRyYXcgb25cbiAqIEBwYXJhbSBnbCB0aGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQgb2YgdGhlIGNhbnZhc1xuICogQHBhcmFtIHByb2dyYW0gdGhlIFdlYkdMIHByb2dyYW0gd2UncmUgdXNpbmdcbiAqIEBwYXJhbSBwb2x5Z29ucyB0aGUgbGlzdCBvZiBwb2x5Z29ucywgcmVwcmVzZW50ZWQgYXMgYXJyYXlzIG9mIHZlYzNzXG4gKiBAcGFyYW0gZXh0ZW50cyB0aGUgbWF4IGFuZCBtaW4gZGltZW5zaW9ucyBvZiB0aGUgbW9kZWxcbiAqL1xuZXhwb3J0cy5yZW5kZXIgPSBmdW5jdGlvbiAoY2FudmFzLCBnbCwgcHJvZ3JhbSwgbW9iaWxlKSB7XG4gICAgLy8gc2V0IHZpZXcgcG9ydCBhbmQgY2xlYXIgY2FudmFzXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICBnbC5jbGVhckNvbG9yKDAuOSwgMC45LCAwLjksIDEuMCk7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIC8vIHNldCBwZXJzcGVjdGl2ZSB0cmFuc2Zvcm1cbiAgICB2YXIgYXNwZWN0UmF0aW8gPSAxO1xuICAgIHZhciBmb3ZZID0gNDU7XG4gICAgdmFyIHByb2pNYXRyaXggPSBtYXQ0XzEuZGVmYXVsdC5wZXJzcGVjdGl2ZShmb3ZZLCBhc3BlY3RSYXRpbywgMC4wMSwgMTAwKTtcbiAgICB2YXIgcHJvak1hdHJpeExvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInByb2pNYXRyaXhcIik7XG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihwcm9qTWF0cml4TG9jLCBmYWxzZSwgRmxvYXQzMkFycmF5LmZyb20ocHJvak1hdHJpeC5hbGwoKSkpO1xuICAgIHZhciBleWVWZWMgPSBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDAsIDJdKTtcbiAgICB2YXIgbG9va1ZlYyA9IG5ldyB2ZWMzXzEuZGVmYXVsdChbMCwgMCwgMF0pO1xuICAgIHZhciB1cFZlYyA9IG5ldyB2ZWMzXzEuZGVmYXVsdChbMCwgMSwgMF0pO1xuICAgIHZhciBtb2RlbFZpZXcgPSBtYXQ0XzEuZGVmYXVsdC5sb29rQXQoZXllVmVjLCBsb29rVmVjLCB1cFZlYyk7XG4gICAgLy8gc2NhbGUgYW5kIHRyYW5zbGF0ZSB0byBmaXQgdGhlIG1vYmlsZVxuICAgIHZhciBzID0gMSAvIE1hdGgubWF4KG1vYmlsZS5nZXRUb3RhbFdpZHRoKCksIG1vYmlsZS5nZXRUb3RhbEhlaWdodCgpKTtcbiAgICBtb2RlbFZpZXdcbiAgICAgICAgLnNjYWxlKG5ldyB2ZWMzXzEuZGVmYXVsdChbcywgcywgc10pKVxuICAgICAgICAudHJhbnNsYXRlKG5ldyB2ZWMzXzEuZGVmYXVsdChbMCwgbW9iaWxlLmdldFRvdGFsSGVpZ2h0KCkgLyAyLCAwXSkpO1xuICAgIG1vYmlsZS5kcmF3KGdsLCBwcm9ncmFtLCBtb2RlbFZpZXcpO1xuICAgIG1haW5fMS5HTE9CQUxTLmNhbGxiYWNrSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBvcnRzLnJlbmRlcihjYW52YXMsIGdsLCBwcm9ncmFtLCBtb2JpbGUpO1xuICAgIH0pO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlbmRlci5qcy5tYXAiXX0=

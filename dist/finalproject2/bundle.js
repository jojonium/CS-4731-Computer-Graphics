(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
var helpers_1 = require("./helpers");
var mat4_1 = require("./lib/tsm/mat4");
var vec4_1 = require("./lib/tsm/vec4");
var main_1 = require("./main");
/** how far apart siblings are */
var X_SEPARATION = 3;
/** how far apart parents and children are */
var Y_SEPARATION = 1.5;
var lightPosition = new vec4_1.default([0.0, 0.0, 1.0, 1.0]);
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
     * @param extents the extents of the mesh
     */
    function MobileElement(mesh, color, extents) {
        if (extents === void 0) { extents = main_1.defaultExtents(); }
        /** whether to draw the mesh as a wireframe */
        this.wireframe = false;
        this.mesh = mesh;
        this.extents = extents;
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
     * draws just the mesh of this element, optionally as a shadow
     * @param gl the WebGL rendering context to draw on
     * @param program the WebGL program we're using
     * @param asShadow whether this should be drawn as a 3D object or a flat
     * shadow
     */
    MobileElement.prototype.drawMesh = function (gl, program, asShadow) {
        if (asShadow === void 0) { asShadow = false; }
        // set colors according to whether this is a shadow drawing or not
        var diffuseProduct = new vec4_1.default([0, 0, 0, 1]);
        var specularProduct = new vec4_1.default([0, 0, 0, 1]);
        var ambientProduct = new vec4_1.default([0, 0, 0, 1]);
        if (!asShadow) {
            diffuseProduct = vec4_1.default.product(vec4_1.default.product(lightDiffuse, materialDiffuse), this.color);
            specularProduct = vec4_1.default.product(lightSpecular, materialDiffuse);
            ambientProduct = vec4_1.default.product(vec4_1.default.product(lightAmbient, materialAmbient), this.color);
        }
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
        // set lighting attributes
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
    };
    MobileElement.prototype.drawShadow = function (gl, program, mvMatrix) {
        var shadowView = mvMatrix.copy();
        if (this.parent !== undefined) {
            var index = this.parent.children.indexOf(this);
            var n = this.parent.childrenWidth;
            var c = this.parent.children.length / n;
            var xPos = n < 2 ? 0 : X_SEPARATION * (index / c - (n - 1) / 2);
            shadowView
                // move back to origin
                .translate(new vec3_1.default([-xPos, 0, 0]))
                // undo arm rotation
                .rotate(-this.parent.nextRotDir *
                this.parent.nextRotSpeed *
                this.parent.nextRotStep, new vec3_1.default([0, 1, 0]));
            if (shadowView === null)
                throw new Error("failed to rotate");
            // translate back to correct location
            shadowView.translate(new vec3_1.default([xPos, 0, 0]));
        }
        shadowView
            .translate(new vec3_1.default([0, 0, -8]))
            .translate(new vec3_1.default([lightPosition.x, lightPosition.y, lightPosition.z]))
            .multiply(new mat4_1.default(helpers_1.flatten([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, -1 / lightPosition.z],
            [0, 0, 0, 0]
        ])))
            .translate(new vec3_1.default([-lightPosition.x, -lightPosition.y, -lightPosition.z]));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, Float32Array.from(shadowView.all()));
        this.drawMesh(gl, program, true);
    };
    /**
     * recursively draws this element and each of its children on the canvas
     * @param gl the WebGL rendering context to draw to
     * @param program the WebGL program we're using
     * @param mvMatrix the model view matrix
     */
    MobileElement.prototype.draw = function (gl, program, mvMatrix) {
        var _this = this;
        var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
        var scaleFactor = 1 /
            Math.max(this.extents.maxX - this.extents.minX, this.extents.maxY - this.extents.minY, this.extents.maxZ - this.extents.minZ);
        var transformedMatrix = mvMatrix
            .copy()
            // scale based on extents
            .scale(new vec3_1.default([scaleFactor, scaleFactor, scaleFactor]));
        // draw shadows if necessary
        if (main_1.GLOBALS.shadowsOn) {
            this.drawShadow(gl, program, transformedMatrix);
        }
        transformedMatrix
            // apply a rotation to spin this shape
            .rotate(this.rotDir * this.rotSpeed * this.rotStep++, new vec3_1.default([0, 1, 0]));
        if (transformedMatrix === null)
            throw new Error("Failed to rotate");
        gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(transformedMatrix.all()));
        // draw the mesh
        this.drawMesh(gl, program, false);
        var pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        // draw top string
        if (this.parent !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from([
                0,
                Y_SEPARATION / (2 * scaleFactor),
                0,
                1,
                0,
                0,
                0,
                1
            ]), gl.STATIC_DRAW);
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
     * @param me the element to add
     */
    MobileElement.prototype.randomAdd = function (me) {
        var r = Math.random();
        if (r < 1 / (this.children.length + 1)) {
            this.addChild(me);
            return;
        }
        this.children[Math.floor(r * this.children.length)].randomAdd(me);
    };
    return MobileElement;
}());
exports.MobileElement = MobileElement;

},{"./helpers":4,"./lib/tsm/mat4":8,"./lib/tsm/vec3":11,"./lib/tsm/vec4":12,"./main":14}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var models_1 = require("./models");
var main_1 = require("./main");
var f = models_1.quad(3, 0, 4, 7);
var floorTriangles = [
    [f[0], f[1], f[2]],
    [f[3], f[4], f[5]]
];
var floorPointsData = Float32Array.from(helpers_1.flatten(helpers_1.flatten(floorTriangles).map(function (vec) { return [vec.x, vec.y, vec.z, 1]; })));
var floorTexCoordsData = Float32Array.from(helpers_1.flatten([
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 1],
    [1, 0]
]));
var lw = models_1.quad(5, 4, 0, 1); // left wall
var bw = models_1.quad(6, 7, 4, 5); // back wall
var wallTriangles = [
    [lw[0], lw[1], lw[2]],
    [lw[3], lw[4], lw[5]],
    [bw[0], bw[1], bw[2]],
    [bw[3], bw[4], bw[5]]
];
var wallPointsData = Float32Array.from(helpers_1.flatten(helpers_1.flatten(wallTriangles).map(function (vec) { return [vec.x, vec.y, vec.z, 1]; })));
var wallTexCoords = [
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 1],
    [1, 0]
];
var wallTexCoordsData = Float32Array.from(helpers_1.flatten(wallTexCoords.concat(wallTexCoords)));
/**
 * draws the floor and walls of the world
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using to draw textures
 * @param mvMatrix the model view matrix
 */
exports.drawEnvironment = function (gl, program, mvMatrix) {
    var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc, false, Float32Array.from(mvMatrix.all()));
    // do floor first
    if (main_1.GLOBALS.texturesOn) {
        // use grass texture
        gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), 0.0);
    }
    else {
        gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), -1.0);
        // if textures are off make the floor grey
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), Float32Array.from([0.7, 0.7, 0.7, 1.0]));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), Float32Array.from([0.7, 0.7, 0.7, 1.0]));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), Float32Array.from([0.7, 0.7, 0.7, 1.0]));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), 20);
    }
    // buffer vertices
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, floorPointsData, gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    // buffer texture coordinates
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, floorTexCoordsData, gl.STATIC_DRAW);
    var tvTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(tvTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tvTexCoord);
    gl.drawArrays(gl.TRIANGLES, 0, f.length);
    // now do walls
    if (main_1.GLOBALS.texturesOn) {
        // use stone texture
        gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), 1.0);
    }
    else {
        gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), -1.0);
        // if textures are off make the walls blue
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), Float32Array.from([0.2, 0.2, 0.8, 1.0]));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), Float32Array.from([0.2, 0.2, 0.8, 1.0]));
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), Float32Array.from([0.2, 0.2, 0.8, 1.0]));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), 20);
    }
    // buffer vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallPointsData, gl.STATIC_DRAW);
    // buffer texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallTexCoordsData, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, bw.length + lw.length);
};
/**
 * sets up an environment map based on six images
 * @param gl the WebGL rendering context to draw to
 * @param program the WebGL program we're using to draw textures
 * @param images the six images in the order [back, right, bottom, top, front,
 * left]
 */
exports.configureEnvironmentMap = function (gl, program, images) {
    var cubeMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // back
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[0]);
    // right
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[1]);
    // bottom
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[2]);
    // top
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[3]);
    // front
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[4]);
    // left
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[5]);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 2);
};

},{"./helpers":4,"./main":14,"./models":15}],3:[function(require,module,exports){
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

},{"./lib/tsm/vec3":11}],4:[function(require,module,exports){
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
/**
 * adds a texture to the webgl rendering context
 * @param gl the webgl context
 * @param program the texture program
 * @param index the number for this texture, 0 or 1
 * @param img element for the texture's image
 */
exports.createTexture = function (gl, program, index, img) {
    var texture = gl.createTexture();
    gl.activeTexture(index === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texture" + index), index);
};
/**
 * create a simple placeholder texture while waiting for other textures to load
 * @param gl the rendering context to use
 */
exports.placeholderTexture = function (gl) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
        0,
        0,
        255,
        255,
        255,
        0,
        0,
        255,
        0,
        0,
        255,
        255,
        0,
        0,
        255,
        255
    ]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};
/**
 * create a simple placeholder texture while waiting for other textures to load
 * @param gl the rendering context to use
 * @param program the webgl program
 * @param reflective whether objects should reflect
 * @param refractive whether objects should refract
 */
exports.setRFunc = function (gl, program, reflective, refractive) {
    gl.uniform1i(gl.getUniformLocation(program, "refractive"), refractive ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, "reflective"), reflective ? 1 : 0);
};

},{"./lib/tsm/vec3":11}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epsilon = 0.00001;

},{}],7:[function(require,module,exports){
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

},{"./constants":6,"./mat4":8,"./quat":9,"./vec2":10,"./vec3":11}],8:[function(require,module,exports){
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

},{"./constants":6,"./mat3":7,"./vec3":11,"./vec4":12}],9:[function(require,module,exports){
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

},{"./constants":6,"./mat3":7,"./mat4":8,"./vec3":11}],10:[function(require,module,exports){
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

},{"./constants":6,"./vec3":11}],11:[function(require,module,exports){
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

},{"./constants":6,"./quat":9}],12:[function(require,module,exports){
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

},{"./constants":6}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
"use strict";
/**
 * Joseph Petitti - CS 4731 Computer Graphics Final Project, Part 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
var file_1 = require("./file");
var helpers_1 = require("./helpers");
var initShaders_1 = require("./lib/initShaders");
var vec4_1 = require("./lib/tsm/vec4");
var webgl_utils_1 = require("./lib/webgl-utils");
var MobileElement_1 = require("./MobileElement");
var models_1 = require("./models");
var render_1 = require("./render");
var environment_1 = require("./environment");
exports.defaultExtents = function () {
    return {
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 1,
        maxY: 1,
        maxZ: 1
    };
};
/**
 * All global variables are stored in this object to make them accessible from
 * any module
 */
exports.GLOBALS = {
    /**
     * global variable used to store the ID of the animation callback so it can be
     * cancelled later
     */
    callbackID: undefined,
    /** Whether or not to draw shadows */
    shadowsOn: false,
    /** whether to draw the walls and floor with textures */
    texturesOn: true
};
function main() {
    // create the <canvas> element
    var canvas = helpers_1.createCanvas();
    // create file input
    var fileInput = file_1.createFileInput();
    var randMesh = function () {
        return Math.random() < 0.5 ? models_1.getCube() : models_1.getSphere();
    };
    // create the mobile
    var mobile = new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.3, 0.4, 0.8, 1]));
    mobile.nextRotSpeed = Math.PI / 360;
    mobile.addChild(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([1, 0.0, 0.0, 1])));
    mobile.addChild(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.98, 1, 0.07, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.25, 0.92, 0.83, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.32, 0.28, 0.61, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.35, 0.76, 0.76, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.75, 0.87, 0.52, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.49, 0.87, 0.39, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.89, 0.71, 0.02, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.03, 0.3, 0.38, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0.41, 0.92, 0.82, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([1.0, 0, 0, 1])));
    mobile.randomAdd(new MobileElement_1.MobileElement(randMesh(), new vec4_1.default([0, 1.0, 0, 1])));
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
    // set initial attributes
    var reflective = false;
    var refractive = false;
    gl.uniform1i(gl.getUniformLocation(program, "reflective"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "refractive"), 0);
    // set up placeholder texture and load other textures
    helpers_1.placeholderTexture(gl);
    var grassImg = document.getElementById("grass");
    if (grassImg === null)
        throw new Error("couldn't get grass image");
    helpers_1.createTexture(gl, program, 0, grassImg);
    var stonesImg = document.getElementById("stones");
    if (grassImg === null)
        throw new Error("couldn't get stones image");
    helpers_1.createTexture(gl, program, 1, stonesImg);
    // set up environment map
    var envMapImgs = [
        document.getElementById("nvnegz"),
        document.getElementById("nvposx"),
        document.getElementById("nvnegy"),
        document.getElementById("nvposy"),
        document.getElementById("nvposz"),
        document.getElementById("nvnegx")
    ];
    if (!envMapImgs.every(function (elt) { return elt !== null; }))
        throw new Error("couldn't get env map image");
    environment_1.configureEnvironmentMap(gl, program, envMapImgs);
    // angle of the spotlight
    var phi = 0.7;
    // handle a file being uploaded
    fileInput.addEventListener("change", function () {
        file_1.getInput(fileInput)
            .then(file_1.parseFileText)
            .then(function (obj) {
            mobile.randomAdd(new MobileElement_1.MobileElement(obj.polygons, new vec4_1.default([Math.random(), Math.random(), Math.random(), 1]), obj.extents));
        });
    });
    var startDrawing = function () {
        // cancel any existing animation
        if (exports.GLOBALS.callbackID !== undefined)
            cancelAnimationFrame(exports.GLOBALS.callbackID);
        // start rendering
        render_1.render(canvas, gl, program, program, mobile);
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
            reflective = false;
            refractive = false;
            helpers_1.setRFunc(gl, program, reflective, refractive);
        }
        if (key === "a") {
            exports.GLOBALS.shadowsOn = !exports.GLOBALS.shadowsOn;
        }
        if (key === "c") {
            reflective = !reflective;
            refractive = false;
            helpers_1.setRFunc(gl, program, reflective, refractive);
        }
        if (key === "d") {
            reflective = false;
            refractive = !refractive;
            helpers_1.setRFunc(gl, program, reflective, refractive);
        }
        if (key === "b") {
            exports.GLOBALS.texturesOn = !exports.GLOBALS.texturesOn;
        }
    });
    startDrawing();
}
window.onload = main;

},{"./MobileElement":1,"./environment":2,"./file":3,"./helpers":4,"./lib/initShaders":5,"./lib/tsm/vec4":12,"./lib/webgl-utils":13,"./models":15,"./render":16}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vec3_1 = require("./lib/tsm/vec3");
var helpers_1 = require("./helpers");
/** helper function for generating vertices of a cube */
exports.quad = function (a, b, c, d) {
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
    exports.quad(1, 0, 3, 2),
    exports.quad(2, 3, 7, 6),
    exports.quad(3, 0, 4, 7),
    exports.quad(6, 5, 1, 2),
    exports.quad(4, 5, 6, 7),
    exports.quad(5, 4, 0, 1) // left
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
    var tet = tetrahedron(vc, vb, va, vd, 4);
    return tet.map(function (tri) {
        return tri.map(function (vec) { return new vec3_1.default([vec.x * 0.5, vec.y * 0.5, vec.z * 0.5]); });
    });
};

},{"./helpers":4,"./lib/tsm/vec3":11}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mat4_1 = require("./lib/tsm/mat4");
var vec3_1 = require("./lib/tsm/vec3");
var main_1 = require("./main");
var environment_1 = require("./environment");
/**
 * @param canvas the canvas to draw on
 * @param gl the WebGL rendering context of the canvas
 * @param program the WebGL program we're using
 * @param program the WebGL program for drawing textured objects
 * @param mobile the list of polygons, represented as arrays of vec3s
 */
exports.render = function (canvas, gl, program, textureProgram, mobile) {
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
    var s = 2 / Math.max(mobile.getTotalWidth(), mobile.getTotalHeight());
    modelView
        .scale(new vec3_1.default([s, s, s]))
        .translate(new vec3_1.default([0, mobile.getTotalHeight() / 3, 0]));
    // draw environment
    var environmentView = modelView
        .copy()
        .translate(new vec3_1.default([0, 0, -mobile.getTotalWidth() * 2]))
        .scale(new vec3_1.default([6 / s, 6 / s, 6 / s]))
        .rotate(-Math.PI / 4, new vec3_1.default([0, 1, 0]));
    if (environmentView === null)
        throw new Error("Couldn't rotate environment view");
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "vTexCoord"));
    environment_1.drawEnvironment(gl, textureProgram, environmentView);
    // disable texture mode
    gl.uniform1f(gl.getUniformLocation(program, "vTextureSelector"), -1.0);
    gl.disableVertexAttribArray(gl.getAttribLocation(program, "vTexCoord"));
    // draw mobile
    mobile.draw(gl, program, modelView);
    main_1.GLOBALS.callbackID = requestAnimationFrame(function () {
        exports.render(canvas, gl, program, textureProgram, mobile);
    });
};

},{"./environment":2,"./lib/tsm/mat4":8,"./lib/tsm/vec3":11,"./main":14}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9maW5hbHByb2plY3QyL01vYmlsZUVsZW1lbnQuanMiLCJidWlsZC9maW5hbHByb2plY3QyL2Vudmlyb25tZW50LmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9maWxlLmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9oZWxwZXJzLmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9saWIvaW5pdFNoYWRlcnMuanMiLCJidWlsZC9maW5hbHByb2plY3QyL2xpYi90c20vY29uc3RhbnRzLmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9saWIvdHNtL21hdDMuanMiLCJidWlsZC9maW5hbHByb2plY3QyL2xpYi90c20vbWF0NC5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDIvbGliL3RzbS9xdWF0LmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9saWIvdHNtL3ZlYzIuanMiLCJidWlsZC9maW5hbHByb2plY3QyL2xpYi90c20vdmVjMy5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDIvbGliL3RzbS92ZWM0LmpzIiwiYnVpbGQvZmluYWxwcm9qZWN0Mi9saWIvd2ViZ2wtdXRpbHMuanMiLCJidWlsZC9maW5hbHByb2plY3QyL21haW4uanMiLCJidWlsZC9maW5hbHByb2plY3QyL21vZGVscy5qcyIsImJ1aWxkL2ZpbmFscHJvamVjdDIvcmVuZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlYzNfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vdmVjM1wiKTtcbnZhciBoZWxwZXJzXzEgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vbWF0NFwiKTtcbnZhciB2ZWM0XzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzRcIik7XG52YXIgbWFpbl8xID0gcmVxdWlyZShcIi4vbWFpblwiKTtcbi8qKiBob3cgZmFyIGFwYXJ0IHNpYmxpbmdzIGFyZSAqL1xudmFyIFhfU0VQQVJBVElPTiA9IDM7XG4vKiogaG93IGZhciBhcGFydCBwYXJlbnRzIGFuZCBjaGlsZHJlbiBhcmUgKi9cbnZhciBZX1NFUEFSQVRJT04gPSAxLjU7XG52YXIgbGlnaHRQb3NpdGlvbiA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4wLCAwLjAsIDEuMCwgMS4wXSk7XG52YXIgbGlnaHRBbWJpZW50ID0gbmV3IHZlYzRfMS5kZWZhdWx0KFswLjIsIDAuMiwgMC4yLCAxLjBdKTtcbnZhciBsaWdodERpZmZ1c2UgPSBuZXcgdmVjNF8xLmRlZmF1bHQoWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xudmFyIGxpZ2h0U3BlY3VsYXIgPSBuZXcgdmVjNF8xLmRlZmF1bHQoWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xudmFyIG1hdGVyaWFsQW1iaWVudCA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMS4wLCAxLjAsIDEuMCwgMS4wXSk7XG52YXIgbWF0ZXJpYWxEaWZmdXNlID0gbmV3IHZlYzRfMS5kZWZhdWx0KFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcbnZhciBtYXRlcmlhbFNoaW5pbmVzcyA9IDIwLjA7XG4vKipcbiAqIFRoaXMgaXMgb25lIGVsZW1lbnQgb2YgdGhlIG1vYmlsZSB0cmVlIGhpZXJhcmNoeS4gSXQgbWF5IGhhdmUgY2hpbGRyZW4gb3IgYVxuICogcGFyZW50XG4gKi9cbnZhciBNb2JpbGVFbGVtZW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIGNyZWF0ZXMgYSBuZXcgZWxlbWVudCB3aXRoIGEgbW9kZWxcbiAgICAgKiBAcGFyYW0gbWVzaCB0aGUgcG9seWdvbnMgb2YgdGhlIG1vZGVsXG4gICAgICogQHBhcmFtIGNvbG9yIHRoZSByLCBnLCBiLCBhIGNvbXBvbmVudHMgb2YgdGhpcyBtZXNoJ3MgY29sb3JcbiAgICAgKiBAcGFyYW0gZXh0ZW50cyB0aGUgZXh0ZW50cyBvZiB0aGUgbWVzaFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIE1vYmlsZUVsZW1lbnQobWVzaCwgY29sb3IsIGV4dGVudHMpIHtcbiAgICAgICAgaWYgKGV4dGVudHMgPT09IHZvaWQgMCkgeyBleHRlbnRzID0gbWFpbl8xLmRlZmF1bHRFeHRlbnRzKCk7IH1cbiAgICAgICAgLyoqIHdoZXRoZXIgdG8gZHJhdyB0aGUgbWVzaCBhcyBhIHdpcmVmcmFtZSAqL1xuICAgICAgICB0aGlzLndpcmVmcmFtZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1lc2ggPSBtZXNoO1xuICAgICAgICB0aGlzLmV4dGVudHMgPSBleHRlbnRzO1xuICAgICAgICAvLyBjb252ZXJ0IG1lc2ggaW50byBGbG9hdDMyQXJyYXkgZm9yIHdlYmdsXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBoZWxwZXJzXzEuZmxhdHRlbihtZXNoKTtcbiAgICAgICAgdGhpcy5wb2ludERhdGEgPSBGbG9hdDMyQXJyYXkuZnJvbShoZWxwZXJzXzEuZmxhdHRlbih0aGlzLnZlcnRpY2VzLm1hcChmdW5jdGlvbiAodmVjKSB7IHJldHVybiBbdmVjLngsIHZlYy55LCB2ZWMueiwgMS4wXTsgfSkpKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICAvLyBjYWxjdWxhdGUgbm9ybWFsc1xuICAgICAgICB0aGlzLm5vcm1hbERhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDApO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZU5vcm1hbHMoZmFsc2UpO1xuICAgICAgICB0aGlzLnJvdERpciA9IDE7XG4gICAgICAgIHRoaXMucm90U3BlZWQgPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB0aGlzLnJvdFN0ZXAgPSAwO1xuICAgICAgICB0aGlzLm5leHRSb3REaXIgPSAxO1xuICAgICAgICB0aGlzLm5leHRSb3RTcGVlZCA9IE1hdGguUEkgLyAzNjA7XG4gICAgICAgIHRoaXMubmV4dFJvdFN0ZXAgPSAwO1xuICAgICAgICB0aGlzLmxheWVyc0JlbG93ID0gMDtcbiAgICAgICAgdGhpcy5jaGlsZHJlbldpZHRoID0gMTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogYWRkcyBhIG1vYmlsZSBlbGVtZW50IG9uZSBsZXZlbCBiZWxvdyB0aGlzIG9uZVxuICAgICAqIEBwYXJhbSBjaGlsZCB0aGUgbW9iaWxlIGVsZW1lbnQgY2hpbGRcbiAgICAgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5hZGRDaGlsZCA9IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbi5sZW5ndGggPT09IDApXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyKCk7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgdGhpcy5uZXh0Um90RGlyID0gKC0xICogdGhpcy5wYXJlbnQubmV4dFJvdERpcik7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnBhcmVudCA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2V0Q2hpbGRyZW5XaWR0aCgpO1xuICAgIH07XG4gICAgLyoqIGluY3JlbWVudCBsYXllcnNCZWxvdyBmb3IgdGhpcyBtb2JpbGUgZWxlbWVudCBhbmQgYWxsIGl0cyBwYXJlbnRzICovXG4gICAgTW9iaWxlRWxlbWVudC5wcm90b3R5cGUuYWRkTGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubGF5ZXJzQmVsb3crKztcbiAgICAgICAgaWYgKHRoaXMucGFyZW50ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5hZGRMYXllcigpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogc2V0IGNoaWxkcmVuIHdpZHRoIGZvciB0aGlzIG1vYmlsZSBlbGVtZW50IGFuZCBhbGwgaXRzIHBhcmVudHNcbiAgICAgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5zZXRDaGlsZHJlbldpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNoaWxkcmVuV2lkdGggPSB0aGlzLmNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7IHJldHVybiBwcmV2ICsgY3VyLmNoaWxkcmVuV2lkdGg7IH0sIDApO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQuc2V0Q2hpbGRyZW5XaWR0aCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKiogZ2V0IHRoZSB0b3RhbCB3aWR0aCBuZWNlc3NhcnkgdG8gZml0IHRoaXMgbW9iaWxlIG9uIHNjcmVlbiAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLmdldFRvdGFsV2lkdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuV2lkdGggKiBYX1NFUEFSQVRJT047XG4gICAgfTtcbiAgICAvKiogZ2V0IHRoZSB0b3RhbCBoZWlnaHQgbmVjZXNzYXJ5IHRvIGZpdCB0aGlzIG1vYmlsZSBvbiBzY3JlZW4gKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5nZXRUb3RhbEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzQmVsb3cgKiBZX1NFUEFSQVRJT047XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBkcmF3cyBqdXN0IHRoZSBtZXNoIG9mIHRoaXMgZWxlbWVudCwgb3B0aW9uYWxseSBhcyBhIHNoYWRvd1xuICAgICAqIEBwYXJhbSBnbCB0aGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQgdG8gZHJhdyBvblxuICAgICAqIEBwYXJhbSBwcm9ncmFtIHRoZSBXZWJHTCBwcm9ncmFtIHdlJ3JlIHVzaW5nXG4gICAgICogQHBhcmFtIGFzU2hhZG93IHdoZXRoZXIgdGhpcyBzaG91bGQgYmUgZHJhd24gYXMgYSAzRCBvYmplY3Qgb3IgYSBmbGF0XG4gICAgICogc2hhZG93XG4gICAgICovXG4gICAgTW9iaWxlRWxlbWVudC5wcm90b3R5cGUuZHJhd01lc2ggPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIGFzU2hhZG93KSB7XG4gICAgICAgIGlmIChhc1NoYWRvdyA9PT0gdm9pZCAwKSB7IGFzU2hhZG93ID0gZmFsc2U7IH1cbiAgICAgICAgLy8gc2V0IGNvbG9ycyBhY2NvcmRpbmcgdG8gd2hldGhlciB0aGlzIGlzIGEgc2hhZG93IGRyYXdpbmcgb3Igbm90XG4gICAgICAgIHZhciBkaWZmdXNlUHJvZHVjdCA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMCwgMCwgMCwgMV0pO1xuICAgICAgICB2YXIgc3BlY3VsYXJQcm9kdWN0ID0gbmV3IHZlYzRfMS5kZWZhdWx0KFswLCAwLCAwLCAxXSk7XG4gICAgICAgIHZhciBhbWJpZW50UHJvZHVjdCA9IG5ldyB2ZWM0XzEuZGVmYXVsdChbMCwgMCwgMCwgMV0pO1xuICAgICAgICBpZiAoIWFzU2hhZG93KSB7XG4gICAgICAgICAgICBkaWZmdXNlUHJvZHVjdCA9IHZlYzRfMS5kZWZhdWx0LnByb2R1Y3QodmVjNF8xLmRlZmF1bHQucHJvZHVjdChsaWdodERpZmZ1c2UsIG1hdGVyaWFsRGlmZnVzZSksIHRoaXMuY29sb3IpO1xuICAgICAgICAgICAgc3BlY3VsYXJQcm9kdWN0ID0gdmVjNF8xLmRlZmF1bHQucHJvZHVjdChsaWdodFNwZWN1bGFyLCBtYXRlcmlhbERpZmZ1c2UpO1xuICAgICAgICAgICAgYW1iaWVudFByb2R1Y3QgPSB2ZWM0XzEuZGVmYXVsdC5wcm9kdWN0KHZlYzRfMS5kZWZhdWx0LnByb2R1Y3QobGlnaHRBbWJpZW50LCBtYXRlcmlhbEFtYmllbnQpLCB0aGlzLmNvbG9yKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBidWZmZXIgdmVydGV4IGRhdGFcbiAgICAgICAgdmFyIHBCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5wb2ludERhdGEsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgdmFyIHZQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidlBvc2l0aW9uXCIpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHZQb3NpdGlvbiwgNCwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodlBvc2l0aW9uKTtcbiAgICAgICAgLy8gYnVmZmVyIG5vcm1hbHNcbiAgICAgICAgdmFyIHZOb3JtYWwgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZOb3JtYWwpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5ub3JtYWxEYXRhLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHZhciB2Tm9ybWFsUG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcInZOb3JtYWxcIik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodk5vcm1hbFBvc2l0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2Tm9ybWFsUG9zaXRpb24pO1xuICAgICAgICAvLyBzZXQgbGlnaHRpbmcgYXR0cmlidXRlc1xuICAgICAgICBnbC51bmlmb3JtNGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImRpZmZ1c2VQcm9kdWN0XCIpLCBGbG9hdDMyQXJyYXkuZnJvbShkaWZmdXNlUHJvZHVjdC54eXp3KSk7XG4gICAgICAgIGdsLnVuaWZvcm00ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwic3BlY3VsYXJQcm9kdWN0XCIpLCBGbG9hdDMyQXJyYXkuZnJvbShzcGVjdWxhclByb2R1Y3QueHl6dykpO1xuICAgICAgICBnbC51bmlmb3JtNGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImFtYmllbnRQcm9kdWN0XCIpLCBGbG9hdDMyQXJyYXkuZnJvbShhbWJpZW50UHJvZHVjdC54eXp3KSk7XG4gICAgICAgIGdsLnVuaWZvcm00ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHRQb3NpdGlvblwiKSwgRmxvYXQzMkFycmF5LmZyb20obGlnaHRQb3NpdGlvbi54eXp3KSk7XG4gICAgICAgIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJzaGluaW5lc3NcIiksIG1hdGVyaWFsU2hpbmluZXNzKTtcbiAgICAgICAgLy8gZHJhdyB3aXJlZnJhbWUgb3Igc29saWQgb2JqZWN0XG4gICAgICAgIGlmICh0aGlzLndpcmVmcmFtZSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aCAtIDI7IGkgKz0gMykge1xuICAgICAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORV9MT09QLCBpLCAzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCB0aGlzLnZlcnRpY2VzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLmRyYXdTaGFkb3cgPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIG12TWF0cml4KSB7XG4gICAgICAgIHZhciBzaGFkb3dWaWV3ID0gbXZNYXRyaXguY29weSgpO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5wYXJlbnQuY2hpbGRyZW4uaW5kZXhPZih0aGlzKTtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5wYXJlbnQuY2hpbGRyZW5XaWR0aDtcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5wYXJlbnQuY2hpbGRyZW4ubGVuZ3RoIC8gbjtcbiAgICAgICAgICAgIHZhciB4UG9zID0gbiA8IDIgPyAwIDogWF9TRVBBUkFUSU9OICogKGluZGV4IC8gYyAtIChuIC0gMSkgLyAyKTtcbiAgICAgICAgICAgIHNoYWRvd1ZpZXdcbiAgICAgICAgICAgICAgICAvLyBtb3ZlIGJhY2sgdG8gb3JpZ2luXG4gICAgICAgICAgICAgICAgLnRyYW5zbGF0ZShuZXcgdmVjM18xLmRlZmF1bHQoWy14UG9zLCAwLCAwXSkpXG4gICAgICAgICAgICAgICAgLy8gdW5kbyBhcm0gcm90YXRpb25cbiAgICAgICAgICAgICAgICAucm90YXRlKC10aGlzLnBhcmVudC5uZXh0Um90RGlyICpcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5uZXh0Um90U3BlZWQgKlxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50Lm5leHRSb3RTdGVwLCBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDEsIDBdKSk7XG4gICAgICAgICAgICBpZiAoc2hhZG93VmlldyA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsZWQgdG8gcm90YXRlXCIpO1xuICAgICAgICAgICAgLy8gdHJhbnNsYXRlIGJhY2sgdG8gY29ycmVjdCBsb2NhdGlvblxuICAgICAgICAgICAgc2hhZG93Vmlldy50cmFuc2xhdGUobmV3IHZlYzNfMS5kZWZhdWx0KFt4UG9zLCAwLCAwXSkpO1xuICAgICAgICB9XG4gICAgICAgIHNoYWRvd1ZpZXdcbiAgICAgICAgICAgIC50cmFuc2xhdGUobmV3IHZlYzNfMS5kZWZhdWx0KFswLCAwLCAtOF0pKVxuICAgICAgICAgICAgLnRyYW5zbGF0ZShuZXcgdmVjM18xLmRlZmF1bHQoW2xpZ2h0UG9zaXRpb24ueCwgbGlnaHRQb3NpdGlvbi55LCBsaWdodFBvc2l0aW9uLnpdKSlcbiAgICAgICAgICAgIC5tdWx0aXBseShuZXcgbWF0NF8xLmRlZmF1bHQoaGVscGVyc18xLmZsYXR0ZW4oW1xuICAgICAgICAgICAgWzEsIDAsIDAsIDBdLFxuICAgICAgICAgICAgWzAsIDEsIDAsIDBdLFxuICAgICAgICAgICAgWzAsIDAsIDEsIC0xIC8gbGlnaHRQb3NpdGlvbi56XSxcbiAgICAgICAgICAgIFswLCAwLCAwLCAwXVxuICAgICAgICBdKSkpXG4gICAgICAgICAgICAudHJhbnNsYXRlKG5ldyB2ZWMzXzEuZGVmYXVsdChbLWxpZ2h0UG9zaXRpb24ueCwgLWxpZ2h0UG9zaXRpb24ueSwgLWxpZ2h0UG9zaXRpb24uel0pKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtb2RlbE1hdHJpeFwiKSwgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKHNoYWRvd1ZpZXcuYWxsKCkpKTtcbiAgICAgICAgdGhpcy5kcmF3TWVzaChnbCwgcHJvZ3JhbSwgdHJ1ZSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiByZWN1cnNpdmVseSBkcmF3cyB0aGlzIGVsZW1lbnQgYW5kIGVhY2ggb2YgaXRzIGNoaWxkcmVuIG9uIHRoZSBjYW52YXNcbiAgICAgKiBAcGFyYW0gZ2wgdGhlIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0IHRvIGRyYXcgdG9cbiAgICAgKiBAcGFyYW0gcHJvZ3JhbSB0aGUgV2ViR0wgcHJvZ3JhbSB3ZSdyZSB1c2luZ1xuICAgICAqIEBwYXJhbSBtdk1hdHJpeCB0aGUgbW9kZWwgdmlldyBtYXRyaXhcbiAgICAgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGdsLCBwcm9ncmFtLCBtdk1hdHJpeCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgbW9kZWxNYXRyaXhMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtb2RlbE1hdHJpeFwiKTtcbiAgICAgICAgdmFyIHNjYWxlRmFjdG9yID0gMSAvXG4gICAgICAgICAgICBNYXRoLm1heCh0aGlzLmV4dGVudHMubWF4WCAtIHRoaXMuZXh0ZW50cy5taW5YLCB0aGlzLmV4dGVudHMubWF4WSAtIHRoaXMuZXh0ZW50cy5taW5ZLCB0aGlzLmV4dGVudHMubWF4WiAtIHRoaXMuZXh0ZW50cy5taW5aKTtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWVkTWF0cml4ID0gbXZNYXRyaXhcbiAgICAgICAgICAgIC5jb3B5KClcbiAgICAgICAgICAgIC8vIHNjYWxlIGJhc2VkIG9uIGV4dGVudHNcbiAgICAgICAgICAgIC5zY2FsZShuZXcgdmVjM18xLmRlZmF1bHQoW3NjYWxlRmFjdG9yLCBzY2FsZUZhY3Rvciwgc2NhbGVGYWN0b3JdKSk7XG4gICAgICAgIC8vIGRyYXcgc2hhZG93cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgaWYgKG1haW5fMS5HTE9CQUxTLnNoYWRvd3NPbikge1xuICAgICAgICAgICAgdGhpcy5kcmF3U2hhZG93KGdsLCBwcm9ncmFtLCB0cmFuc2Zvcm1lZE1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNmb3JtZWRNYXRyaXhcbiAgICAgICAgICAgIC8vIGFwcGx5IGEgcm90YXRpb24gdG8gc3BpbiB0aGlzIHNoYXBlXG4gICAgICAgICAgICAucm90YXRlKHRoaXMucm90RGlyICogdGhpcy5yb3RTcGVlZCAqIHRoaXMucm90U3RlcCsrLCBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDEsIDBdKSk7XG4gICAgICAgIGlmICh0cmFuc2Zvcm1lZE1hdHJpeCA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byByb3RhdGVcIik7XG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYobW9kZWxNYXRyaXhMb2MsIGZhbHNlLCBGbG9hdDMyQXJyYXkuZnJvbSh0cmFuc2Zvcm1lZE1hdHJpeC5hbGwoKSkpO1xuICAgICAgICAvLyBkcmF3IHRoZSBtZXNoXG4gICAgICAgIHRoaXMuZHJhd01lc2goZ2wsIHByb2dyYW0sIGZhbHNlKTtcbiAgICAgICAgdmFyIHBCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBCdWZmZXIpO1xuICAgICAgICB2YXIgdlBvc2l0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJ2UG9zaXRpb25cIik7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodlBvc2l0aW9uLCA0LCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2UG9zaXRpb24pO1xuICAgICAgICAvLyBkcmF3IHRvcCBzdHJpbmdcbiAgICAgICAgaWYgKHRoaXMucGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwQnVmZmVyKTtcbiAgICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXkuZnJvbShbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICBZX1NFUEFSQVRJT04gLyAoMiAqIHNjYWxlRmFjdG9yKSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORVMsIDAsIDIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJvdGF0ZSB0aGUgd2hvbGUgbmV4dCBsYXllclxuICAgICAgICB2YXIgbGF5ZXJNYXRyaXggPSBtdk1hdHJpeFxuICAgICAgICAgICAgLmNvcHkoKVxuICAgICAgICAgICAgLnJvdGF0ZSh0aGlzLm5leHRSb3REaXIgKiB0aGlzLm5leHRSb3RTcGVlZCAqIHRoaXMubmV4dFJvdFN0ZXArKywgbmV3IHZlYzNfMS5kZWZhdWx0KFswLCAxLCAwXSkpO1xuICAgICAgICBpZiAobGF5ZXJNYXRyaXggPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMYXllciBtYXRyaXggaXMgbnVsbFwiKTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihtb2RlbE1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKGxheWVyTWF0cml4LmFsbCgpKSk7XG4gICAgICAgIC8vIGRyYXcgc3RyaW5ncyBjb25uZWN0aW5nIHRoZSBsYXllclxuICAgICAgICB2YXIgc3RyaW5ncyA9IHRoaXMuZ2V0TmV4dExldmVsU3RyaW5ncygpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcEJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXkuZnJvbShoZWxwZXJzXzEuZmxhdHRlbihzdHJpbmdzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi54eXp3OyB9KSkpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuTElORVMsIDAsIHN0cmluZ3MubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcbiAgICAgICAgICAgIC8vIG9mZnNldCBjaGlsZHJlbiBzbyB0aGV5IGFsbCBmaXQgc2lkZSBieSBzaWRlXG4gICAgICAgICAgICB2YXIgbiA9IF90aGlzLmNoaWxkcmVuV2lkdGg7XG4gICAgICAgICAgICB2YXIgYyA9IF90aGlzLmNoaWxkcmVuLmxlbmd0aCAvIG47XG4gICAgICAgICAgICB2YXIgeFBvcyA9IG4gPCAyID8gMCA6IFhfU0VQQVJBVElPTiAqIChpbmRleCAvIGMgLSAobiAtIDEpIC8gMik7XG4gICAgICAgICAgICB2YXIgdHJhbnNsYXRlZE1hdHJpeCA9IGxheWVyTWF0cml4XG4gICAgICAgICAgICAgICAgLmNvcHkoKVxuICAgICAgICAgICAgICAgIC50cmFuc2xhdGUobmV3IHZlYzNfMS5kZWZhdWx0KFt4UG9zLCAtWV9TRVBBUkFUSU9OLCAwXSkpO1xuICAgICAgICAgICAgLy8gZHJhdyBjaGlsZHJlblxuICAgICAgICAgICAgY2hpbGQuZHJhdyhnbCwgcHJvZ3JhbSwgdHJhbnNsYXRlZE1hdHJpeCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogZ2V0cyB0aGUgaG9yaXpvbnRhbCBzdHJpbmcgYW5kIHRoZSBib3R0b20gaGFsZiBvZiB0aGUgdmVydGljYWwgc3RyaW5nIHVzZWRcbiAgICAgKiB0byBkcmF3IHRoZSBuZXh0IGxheWVyXG4gICAgICovXG4gICAgTW9iaWxlRWxlbWVudC5wcm90b3R5cGUuZ2V0TmV4dExldmVsU3RyaW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IG5ldyBBcnJheSgpO1xuICAgICAgICAvLyB0b3BcbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICBvdXQucHVzaChuZXcgdmVjNF8xLmRlZmF1bHQoWzAsIDAsIDAsIDFdKSk7XG4gICAgICAgICAgICBvdXQucHVzaChuZXcgdmVjNF8xLmRlZmF1bHQoWzAsIC1ZX1NFUEFSQVRJT04gLyAyLCAwLCAxXSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGhvcml6b250YWxcbiAgICAgICAgb3V0LnB1c2gobmV3IHZlYzRfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIC0oWF9TRVBBUkFUSU9OICogKHRoaXMuY2hpbGRyZW5XaWR0aCAtIDEpKSAvIDIsXG4gICAgICAgICAgICAtWV9TRVBBUkFUSU9OIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pKTtcbiAgICAgICAgb3V0LnB1c2gobmV3IHZlYzRfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgIChYX1NFUEFSQVRJT04gKiAodGhpcy5jaGlsZHJlbldpZHRoIC0gMSkpIC8gMixcbiAgICAgICAgICAgIC1ZX1NFUEFSQVRJT04gLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSkpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLyoqXG4gICAgICogcmVjYWxjdWxhdGVzIG5vcm1hbHMgYmFzZWQgb24gc2hhZGluZyB0eXBlLCB0aGVuIGRvZXMgdGhlIHNhbWUgZm9yIGFsbFxuICAgICAqIGNoaWxkcmVuXG4gICAgICogQHBhcmFtIGZsYXQgd2hldGhlciB0byBkbyBmbGF0IHNoYWRpbmdcbiAgICAgKi9cbiAgICBNb2JpbGVFbGVtZW50LnByb3RvdHlwZS5jYWxjdWxhdGVOb3JtYWxzID0gZnVuY3Rpb24gKGZsYXQpIHtcbiAgICAgICAgdmFyIG5vcm1hbHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMubWVzaDsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBwb2x5ID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIHRlbXAgPSBoZWxwZXJzXzEubm9ybWFsKHBvbHkpO1xuICAgICAgICAgICAgdmFyIG4gPSBuZXcgdmVjNF8xLmRlZmF1bHQoW3RlbXAueCwgdGVtcC55LCB0ZW1wLnosIDAuMF0pO1xuICAgICAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBwb2x5XzEgPSBwb2x5OyBfYiA8IHBvbHlfMS5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdmVjID0gcG9seV8xW19iXTtcbiAgICAgICAgICAgICAgICBpZiAoZmxhdClcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG4pO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG5ldyB2ZWM0XzEuZGVmYXVsdChbdmVjLngsIHZlYy55LCB2ZWMueiwgMC4wXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9ybWFsRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKG5vcm1hbHMubWFwKGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLnh5enc7IH0pKSk7XG4gICAgICAgIC8vIHJlcGVhdCBkb3duIHRoZSB0cmVlXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uIChjaGlsZCkgeyByZXR1cm4gY2hpbGQuY2FsY3VsYXRlTm9ybWFscyhmbGF0KTsgfSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBhZGRzIGEgbmV3IGVsZW1lbnQgc29tZXdoZXJlIGJlbG93IHRoaXMgb25lXG4gICAgICogQHBhcmFtIG1lIHRoZSBlbGVtZW50IHRvIGFkZFxuICAgICAqL1xuICAgIE1vYmlsZUVsZW1lbnQucHJvdG90eXBlLnJhbmRvbUFkZCA9IGZ1bmN0aW9uIChtZSkge1xuICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIGlmIChyIDwgMSAvICh0aGlzLmNoaWxkcmVuLmxlbmd0aCArIDEpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKG1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoaWxkcmVuW01hdGguZmxvb3IociAqIHRoaXMuY2hpbGRyZW4ubGVuZ3RoKV0ucmFuZG9tQWRkKG1lKTtcbiAgICB9O1xuICAgIHJldHVybiBNb2JpbGVFbGVtZW50O1xufSgpKTtcbmV4cG9ydHMuTW9iaWxlRWxlbWVudCA9IE1vYmlsZUVsZW1lbnQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Nb2JpbGVFbGVtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIik7XG52YXIgbW9kZWxzXzEgPSByZXF1aXJlKFwiLi9tb2RlbHNcIik7XG52YXIgbWFpbl8xID0gcmVxdWlyZShcIi4vbWFpblwiKTtcbnZhciBmID0gbW9kZWxzXzEucXVhZCgzLCAwLCA0LCA3KTtcbnZhciBmbG9vclRyaWFuZ2xlcyA9IFtcbiAgICBbZlswXSwgZlsxXSwgZlsyXV0sXG4gICAgW2ZbM10sIGZbNF0sIGZbNV1dXG5dO1xudmFyIGZsb29yUG9pbnRzRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKGhlbHBlcnNfMS5mbGF0dGVuKGZsb29yVHJpYW5nbGVzKS5tYXAoZnVuY3Rpb24gKHZlYykgeyByZXR1cm4gW3ZlYy54LCB2ZWMueSwgdmVjLnosIDFdOyB9KSkpO1xudmFyIGZsb29yVGV4Q29vcmRzRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKFtcbiAgICBbMCwgMF0sXG4gICAgWzAsIDFdLFxuICAgIFsxLCAxXSxcbiAgICBbMCwgMF0sXG4gICAgWzEsIDFdLFxuICAgIFsxLCAwXVxuXSkpO1xudmFyIGx3ID0gbW9kZWxzXzEucXVhZCg1LCA0LCAwLCAxKTsgLy8gbGVmdCB3YWxsXG52YXIgYncgPSBtb2RlbHNfMS5xdWFkKDYsIDcsIDQsIDUpOyAvLyBiYWNrIHdhbGxcbnZhciB3YWxsVHJpYW5nbGVzID0gW1xuICAgIFtsd1swXSwgbHdbMV0sIGx3WzJdXSxcbiAgICBbbHdbM10sIGx3WzRdLCBsd1s1XV0sXG4gICAgW2J3WzBdLCBid1sxXSwgYndbMl1dLFxuICAgIFtid1szXSwgYndbNF0sIGJ3WzVdXVxuXTtcbnZhciB3YWxsUG9pbnRzRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKGhlbHBlcnNfMS5mbGF0dGVuKHdhbGxUcmlhbmdsZXMpLm1hcChmdW5jdGlvbiAodmVjKSB7IHJldHVybiBbdmVjLngsIHZlYy55LCB2ZWMueiwgMV07IH0pKSk7XG52YXIgd2FsbFRleENvb3JkcyA9IFtcbiAgICBbMCwgMF0sXG4gICAgWzAsIDFdLFxuICAgIFsxLCAxXSxcbiAgICBbMCwgMF0sXG4gICAgWzEsIDFdLFxuICAgIFsxLCAwXVxuXTtcbnZhciB3YWxsVGV4Q29vcmRzRGF0YSA9IEZsb2F0MzJBcnJheS5mcm9tKGhlbHBlcnNfMS5mbGF0dGVuKHdhbGxUZXhDb29yZHMuY29uY2F0KHdhbGxUZXhDb29yZHMpKSk7XG4vKipcbiAqIGRyYXdzIHRoZSBmbG9vciBhbmQgd2FsbHMgb2YgdGhlIHdvcmxkXG4gKiBAcGFyYW0gZ2wgdGhlIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0IHRvIGRyYXcgdG9cbiAqIEBwYXJhbSBwcm9ncmFtIHRoZSBXZWJHTCBwcm9ncmFtIHdlJ3JlIHVzaW5nIHRvIGRyYXcgdGV4dHVyZXNcbiAqIEBwYXJhbSBtdk1hdHJpeCB0aGUgbW9kZWwgdmlldyBtYXRyaXhcbiAqL1xuZXhwb3J0cy5kcmF3RW52aXJvbm1lbnQgPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIG12TWF0cml4KSB7XG4gICAgdmFyIG1vZGVsTWF0cml4TG9jID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibW9kZWxNYXRyaXhcIik7XG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihtb2RlbE1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKG12TWF0cml4LmFsbCgpKSk7XG4gICAgLy8gZG8gZmxvb3IgZmlyc3RcbiAgICBpZiAobWFpbl8xLkdMT0JBTFMudGV4dHVyZXNPbikge1xuICAgICAgICAvLyB1c2UgZ3Jhc3MgdGV4dHVyZVxuICAgICAgICBnbC51bmlmb3JtMWYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidlRleHR1cmVTZWxlY3RvclwiKSwgMC4wKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ2VGV4dHVyZVNlbGVjdG9yXCIpLCAtMS4wKTtcbiAgICAgICAgLy8gaWYgdGV4dHVyZXMgYXJlIG9mZiBtYWtlIHRoZSBmbG9vciBncmV5XG4gICAgICAgIGdsLnVuaWZvcm00ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwiZGlmZnVzZVByb2R1Y3RcIiksIEZsb2F0MzJBcnJheS5mcm9tKFswLjcsIDAuNywgMC43LCAxLjBdKSk7XG4gICAgICAgIGdsLnVuaWZvcm00ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwic3BlY3VsYXJQcm9kdWN0XCIpLCBGbG9hdDMyQXJyYXkuZnJvbShbMC43LCAwLjcsIDAuNywgMS4wXSkpO1xuICAgICAgICBnbC51bmlmb3JtNGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImFtYmllbnRQcm9kdWN0XCIpLCBGbG9hdDMyQXJyYXkuZnJvbShbMC43LCAwLjcsIDAuNywgMS4wXSkpO1xuICAgICAgICBnbC51bmlmb3JtMWYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwic2hpbmluZXNzXCIpLCAyMCk7XG4gICAgfVxuICAgIC8vIGJ1ZmZlciB2ZXJ0aWNlc1xuICAgIHZhciB2QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBmbG9vclBvaW50c0RhdGEsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICB2YXIgdlBvc2l0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJ2UG9zaXRpb25cIik7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih2UG9zaXRpb24sIDQsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodlBvc2l0aW9uKTtcbiAgICAvLyBidWZmZXIgdGV4dHVyZSBjb29yZGluYXRlc1xuICAgIHZhciB0QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBmbG9vclRleENvb3Jkc0RhdGEsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICB2YXIgdHZUZXhDb29yZCA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidlRleENvb3JkXCIpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodHZUZXhDb29yZCwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0dlRleENvb3JkKTtcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgZi5sZW5ndGgpO1xuICAgIC8vIG5vdyBkbyB3YWxsc1xuICAgIGlmIChtYWluXzEuR0xPQkFMUy50ZXh0dXJlc09uKSB7XG4gICAgICAgIC8vIHVzZSBzdG9uZSB0ZXh0dXJlXG4gICAgICAgIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ2VGV4dHVyZVNlbGVjdG9yXCIpLCAxLjApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2wudW5pZm9ybTFmKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInZUZXh0dXJlU2VsZWN0b3JcIiksIC0xLjApO1xuICAgICAgICAvLyBpZiB0ZXh0dXJlcyBhcmUgb2ZmIG1ha2UgdGhlIHdhbGxzIGJsdWVcbiAgICAgICAgZ2wudW5pZm9ybTRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJkaWZmdXNlUHJvZHVjdFwiKSwgRmxvYXQzMkFycmF5LmZyb20oWzAuMiwgMC4yLCAwLjgsIDEuMF0pKTtcbiAgICAgICAgZ2wudW5pZm9ybTRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJzcGVjdWxhclByb2R1Y3RcIiksIEZsb2F0MzJBcnJheS5mcm9tKFswLjIsIDAuMiwgMC44LCAxLjBdKSk7XG4gICAgICAgIGdsLnVuaWZvcm00ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwiYW1iaWVudFByb2R1Y3RcIiksIEZsb2F0MzJBcnJheS5mcm9tKFswLjIsIDAuMiwgMC44LCAxLjBdKSk7XG4gICAgICAgIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJzaGluaW5lc3NcIiksIDIwKTtcbiAgICB9XG4gICAgLy8gYnVmZmVyIHZlcnRpY2VzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB3YWxsUG9pbnRzRGF0YSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIC8vIGJ1ZmZlciB0ZXh0dXJlIGNvb3JkaW5hdGVzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB3YWxsVGV4Q29vcmRzRGF0YSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBidy5sZW5ndGggKyBsdy5sZW5ndGgpO1xufTtcbi8qKlxuICogc2V0cyB1cCBhbiBlbnZpcm9ubWVudCBtYXAgYmFzZWQgb24gc2l4IGltYWdlc1xuICogQHBhcmFtIGdsIHRoZSBXZWJHTCByZW5kZXJpbmcgY29udGV4dCB0byBkcmF3IHRvXG4gKiBAcGFyYW0gcHJvZ3JhbSB0aGUgV2ViR0wgcHJvZ3JhbSB3ZSdyZSB1c2luZyB0byBkcmF3IHRleHR1cmVzXG4gKiBAcGFyYW0gaW1hZ2VzIHRoZSBzaXggaW1hZ2VzIGluIHRoZSBvcmRlciBbYmFjaywgcmlnaHQsIGJvdHRvbSwgdG9wLCBmcm9udCxcbiAqIGxlZnRdXG4gKi9cbmV4cG9ydHMuY29uZmlndXJlRW52aXJvbm1lbnRNYXAgPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIGltYWdlcykge1xuICAgIHZhciBjdWJlTWFwID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTIpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGN1YmVNYXApO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gICAgLy8gYmFja1xuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCBnbC5SR0IsIGdsLlJHQiwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2VzWzBdKTtcbiAgICAvLyByaWdodFxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCBnbC5SR0IsIGdsLlJHQiwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2VzWzFdKTtcbiAgICAvLyBib3R0b21cbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgZ2wuUkdCLCBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlc1syXSk7XG4gICAgLy8gdG9wXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIDAsIGdsLlJHQiwgZ2wuUkdCLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZXNbM10pO1xuICAgIC8vIGZyb250XG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIGdsLlJHQiwgZ2wuUkdCLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZXNbNF0pO1xuICAgIC8vIGxlZnRcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgZ2wuUkdCLCBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlc1s1XSk7XG4gICAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInRleE1hcFwiKSwgMik7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZW52aXJvbm1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vbGliL3RzbS92ZWMzXCIpO1xuLyoqXG4gKiBjcmVhdGUgYW4gPGlucHV0IHR5cGU9XCJmaWxlXCI+IGVsZW1lbnQgYW5kIGFkZCBpdCB0byAjaW5wdXQtY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGlucHV0IGVsZW1lbnRcbiAqL1xuZXhwb3J0cy5jcmVhdGVGaWxlSW5wdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICAvLyByZW1vdmUgYW55IGV4aXN0aW5nIGlucHV0XG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWxlLXVwbG9hZFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgaW5wdXQuaWQgPSBcImZpbGUtdXBsb2FkXCI7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnB1dC1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0O1xufTtcbi8qKlxuICogYXN5bmNocm9ub3VzbHkgcmVhZHMgdGV4dCBmcm9tIGEgZmlsZSBpbnB1dCBlbGVtZW50LCBhbmQgcmV0dXJucyBpdCBhcyBhXG4gKiBwcm9taXNlXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBjb250YWluaW5lZCB0aGUgY29udGVudHMgb2YgdGhlIGZpcnN0IGZpbGUgaW4gdGhlIGVsZW1lbnQsXG4gKiBvciB1bmRlZmluZWQgaWYgaXQgY2FuJ3QgYmUgcmVhZFxuICovXG5leHBvcnRzLmdldElucHV0ID0gZnVuY3Rpb24gKGVsdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChlbHQuZmlsZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlamVjdChcImVsdCBjb250YWlucyBubyBmaWxlc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmlsZSA9IGVsdC5maWxlc1swXTtcbiAgICAgICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgXCJVVEYtOFwiKTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIHJlc29sdmUoKF9hID0gZXYudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBlcnJvclwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsZVJlYWRlci5vbmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiZmlsZVJlYWRlciBhYm9ydGVkXCIpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbi8qKlxuICogcGFyc2VzIHRoZSB0ZXh0IG9mIGFuIGlucHV0IGZpbGUgYW5kIHJldHVybnMgdGhlIG9iamVjdCdzIHZlcnRpY2VzIGFuZCBmYWNlc1xuICogaW4gYSBwcm9taXNlXG4gKiBAcGFyYW0gc3RyIHRoZSBpbnB1dCBmaWxlJ3MgdGV4dCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMgcG9seWdvbnMgdGhlIGxpc3Qgb2YgcG9seWdvbnMgYXMgdmVjMyBhcnJheXNcbiAqIEByZXR1cm5zIGV4dGVudHMgdGhlIFgsIFksIGFuZCBaIGJvdW5kcyBvZiB0aGUgZmlndXJlXG4gKi9cbmV4cG9ydHMucGFyc2VGaWxlVGV4dCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgbnVtVmVydGljZXMgPSAwO1xuICAgIHZhciBudW1Qb2x5Z29ucyA9IDA7XG4gICAgdmFyIGhlYWRlckRvbmUgPSBmYWxzZTtcbiAgICB2YXIgdmVydGV4Q291bnRlciA9IDA7XG4gICAgdmFyIHBvbHlnb25Db3VudGVyID0gMDtcbiAgICB2YXIgbWluWCA9IEluZmluaXR5O1xuICAgIHZhciBtaW5ZID0gSW5maW5pdHk7XG4gICAgdmFyIG1pblogPSBJbmZpbml0eTtcbiAgICB2YXIgbWF4WCA9IC1JbmZpbml0eTtcbiAgICB2YXIgbWF4WSA9IC1JbmZpbml0eTtcbiAgICB2YXIgbWF4WiA9IC1JbmZpbml0eTtcbiAgICAvLyB4IHkgeiBjb29yZGluYXRlcyBvZiBlYWNoIHZlcnRleFxuICAgIHZhciB2ZXJ0aWNlcyA9IG5ldyBBcnJheShudW1WZXJ0aWNlcyk7XG4gICAgLy8gZWFjaCBwb2x5Z29uIGlzIGFuIGFycmF5IG9mIHZlcnRpY2VzXG4gICAgdmFyIHBvbHlnb25zID0gbmV3IEFycmF5KG51bVBvbHlnb25zKTtcbiAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIikubWFwKGZ1bmN0aW9uICh3KSB7IHJldHVybiB3LnRvTG93ZXJDYXNlKCkudHJpbSgpOyB9KTtcbiAgICBpZiAobGluZXNbMF0gIT09IFwicGx5XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgbGluZSBvZiBpbnB1dCBmaWxlIG11c3QgYnkgJ3BseSdcIik7XG4gICAgfVxuICAgIGZvciAodmFyIGxpbmVOdW0gPSAxOyBsaW5lTnVtIDwgbGluZXMubGVuZ3RoOyArK2xpbmVOdW0pIHtcbiAgICAgICAgdmFyIHdvcmRzID0gbGluZXNbbGluZU51bV1cbiAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCB8fCB3b3Jkc1swXSA9PT0gXCJcIilcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIWhlYWRlckRvbmUpIHtcbiAgICAgICAgICAgIC8vIHBhcnNpbmcgaGVhZGVyXG4gICAgICAgICAgICBpZiAod29yZHNbMF0gPT09IFwiZW5kX2hlYWRlclwiKSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyRG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmVydGljZXMgPSBuZXcgQXJyYXkobnVtVmVydGljZXMpO1xuICAgICAgICAgICAgICAgIHBvbHlnb25zID0gbmV3IEFycmF5KG51bVBvbHlnb25zKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3b3Jkc1swXSA9PT0gXCJmb3JtYXRcIilcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGlmICh3b3Jkc1swXSA9PT0gXCJlbGVtZW50XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAod29yZHNbMV0gPT09IFwidmVydGV4XCIpXG4gICAgICAgICAgICAgICAgICAgIG51bVZlcnRpY2VzID0gcGFyc2VJbnQod29yZHNbMl0pO1xuICAgICAgICAgICAgICAgIGlmICh3b3Jkc1sxXSA9PT0gXCJmYWNlXCIpXG4gICAgICAgICAgICAgICAgICAgIG51bVBvbHlnb25zID0gcGFyc2VJbnQod29yZHNbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdvcmRzWzBdID09PSBcInByb3BlcnR5XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAod29yZHNbMV0gPT09IFwiZmxvYXQzMlwiIHx8IHdvcmRzWzFdID09PSBcImxpc3RcIilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmVydGV4Q291bnRlciA8IG51bVZlcnRpY2VzKSB7XG4gICAgICAgICAgICAvLyBwYXJzaW5nIHZlcnRpY2VzXG4gICAgICAgICAgICB2YXIgdiA9IG5ldyB2ZWMzXzEuZGVmYXVsdCh3b3Jkcy5zbGljZSgwLCAzKS5tYXAocGFyc2VGbG9hdCkpO1xuICAgICAgICAgICAgdmVydGljZXNbdmVydGV4Q291bnRlcl0gPSB2O1xuICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoaXMgZ29lcyBiZXlvbmQgb3VyIGV4aXN0aW5nIGV4dGVudHNcbiAgICAgICAgICAgIGlmICh2LnggPCBtaW5YKVxuICAgICAgICAgICAgICAgIG1pblggPSB2Lng7XG4gICAgICAgICAgICBpZiAodi55IDwgbWluWSlcbiAgICAgICAgICAgICAgICBtaW5ZID0gdi55O1xuICAgICAgICAgICAgaWYgKHYueiA8IG1pblopXG4gICAgICAgICAgICAgICAgbWluWiA9IHYuejtcbiAgICAgICAgICAgIGlmICh2LnggPiBtYXhYKVxuICAgICAgICAgICAgICAgIG1heFggPSB2Lng7XG4gICAgICAgICAgICBpZiAodi55ID4gbWF4WSlcbiAgICAgICAgICAgICAgICBtYXhZID0gdi55O1xuICAgICAgICAgICAgaWYgKHYueiA+IG1heFopXG4gICAgICAgICAgICAgICAgbWF4WiA9IHYuejtcbiAgICAgICAgICAgIHZlcnRleENvdW50ZXIrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHBhcnNpbmcgcG9seWdvbnNcbiAgICAgICAgICAgIHBvbHlnb25zW3BvbHlnb25Db3VudGVyXSA9IHdvcmRzLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAodykgeyByZXR1cm4gdmVydGljZXNbcGFyc2VJbnQodyldOyB9KTtcbiAgICAgICAgICAgIHBvbHlnb25Db3VudGVyKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9seWdvbnM6IHBvbHlnb25zLFxuICAgICAgICBleHRlbnRzOiB7XG4gICAgICAgICAgICBtaW5YOiBtaW5YLFxuICAgICAgICAgICAgbWluWTogbWluWSxcbiAgICAgICAgICAgIG1pblo6IG1pblosXG4gICAgICAgICAgICBtYXhYOiBtYXhYLFxuICAgICAgICAgICAgbWF4WTogbWF4WSxcbiAgICAgICAgICAgIG1heFo6IG1heFpcbiAgICAgICAgfVxuICAgIH07XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmlsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzNcIik7XG4vKipcbiAqIGZsYXR0ZW5zIGEgMkQgYXJyYXkgaW50byBhIDFEIGFycmF5XG4gKiBAcGFyYW0gYXJyIGFuIGFycmF5IG9mIGFycmF5c1xuICovXG5mdW5jdGlvbiBmbGF0dGVuKGFycikge1xuICAgIHZhciBfYTtcbiAgICByZXR1cm4gKF9hID0gbmV3IEFycmF5KCkpLmNvbmNhdC5hcHBseShfYSwgYXJyKTtcbn1cbmV4cG9ydHMuZmxhdHRlbiA9IGZsYXR0ZW47XG4vKipcbiAqIGNhbGN1bGF0ZXMgdGhlIG5vcm1hbCB2ZWN0b3IgZm9yIGEgdHJpYW5nbGUgbWFkZSB1cCBvZiB0aHJlZSBwb2ludHMgdXNpbmcgdGhlXG4gKiBOZXdlbGwgbWV0aG9kXG4gKi9cbmV4cG9ydHMubm9ybWFsID0gZnVuY3Rpb24gKHBvaW50cykge1xuICAgIHZhciBlbmQgPSBwb2ludHMubGVuZ3RoIC0gMTtcbiAgICB2YXIgeCA9IChwb2ludHNbZW5kXS55IC0gcG9pbnRzWzBdLnkpICogKHBvaW50c1tlbmRdLnogKyBwb2ludHNbMF0ueik7XG4gICAgdmFyIHkgPSAocG9pbnRzW2VuZF0ueiAtIHBvaW50c1swXS56KSAqIChwb2ludHNbZW5kXS54ICsgcG9pbnRzWzBdLngpO1xuICAgIHZhciB6ID0gKHBvaW50c1tlbmRdLnggLSBwb2ludHNbMF0ueCkgKiAocG9pbnRzW2VuZF0ueSArIHBvaW50c1swXS55KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICAgICAgeCArPSAocG9pbnRzW2ldLnkgLSBwb2ludHNbaSArIDFdLnkpICogKHBvaW50c1tpXS56ICsgcG9pbnRzW2kgKyAxXS56KTtcbiAgICAgICAgeSArPSAocG9pbnRzW2ldLnogLSBwb2ludHNbaSArIDFdLnopICogKHBvaW50c1tpXS54ICsgcG9pbnRzW2kgKyAxXS54KTtcbiAgICAgICAgeiArPSAocG9pbnRzW2ldLnggLSBwb2ludHNbaSArIDFdLngpICogKHBvaW50c1tpXS55ICsgcG9pbnRzW2kgKyAxXS55KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyB2ZWMzXzEuZGVmYXVsdChbeCwgeSwgel0pLm5vcm1hbGl6ZSgpO1xufTtcbi8vdmVjMy5jcm9zcyh2ZWMzLmRpZmZlcmVuY2UocDIsIHAwKSwgdmVjMy5kaWZmZXJlbmNlKHAxLCBwMCkpLm5vcm1hbGl6ZSgpO1xuLyoqXG4gKiBtb3ZlcyB0aGUgcG9seWdvbiBvdXR3YXJkIGFsb25nIHRoZSBub3JtYWwgdmVjdG9yIGJ5IHRoZSBnaXZlbiBkaXN0YW5jZSxcbiAqIHJldHVybmluZyB0aGUgcmVzdHVsdGluZyBwb2x5Z29uXG4gKi9cbmV4cG9ydHMucHVsc2UgPSBmdW5jdGlvbiAocG9seWdvbiwgZGlzdGFuY2UpIHtcbiAgICByZXR1cm4gcG9seWdvbi5tYXAoZnVuY3Rpb24gKHBvaW50KSB7IHJldHVybiB2ZWMzXzEuZGVmYXVsdC5kaWZmZXJlbmNlKHBvaW50LCBleHBvcnRzLm5vcm1hbChwb2x5Z29uKS5zY2FsZShkaXN0YW5jZSkpOyB9KTtcbn07XG4vKipcbiAqIGNvbnZlcnRzIGEgZnJhY3Rpb25hbCBjb2xvciB2YWx1ZSB0byBhIDItZGlnaXQgaGV4IHN0cmluZ1xuICogQHBhcmFtIG51bSBhIGNvbG9yIHZhbHVlIGZyb20gMCB0byAxXG4gKi9cbmV4cG9ydHMudG9IZXggPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgdmFyIG91dCA9IE1hdGguZmxvb3IobnVtICogMjU1KVxuICAgICAgICAudG9TdHJpbmcoMTYpXG4gICAgICAgIC5zbGljZSgwLCAyKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA8IDIpXG4gICAgICAgIG91dCA9IFwiMFwiICsgb3V0O1xuICAgIHJldHVybiBvdXQ7XG59O1xuLyoqXG4gKiBjcmVhdGUgYSA8Y2FudmFzPiBlbGVtZW50IGFuZCBhZGQgaXQgdG8gdGhlICNjYW52YXMtY29udGFpbmVyXG4gKiBAcmV0dXJuIHRoZSBjcmVhdGVkIGNhbnZhc1xuICovXG5leHBvcnRzLmNyZWF0ZUNhbnZhcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIC8vIHJlbW92ZSBhbnkgZXhpc3RpbmcgY2FudmFzXG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWJnbFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgIGNhbnZhcy53aWR0aCA9IDY0MDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gNjQwO1xuICAgIGNhbnZhcy5pZCA9IFwid2ViZ2xcIjtcbiAgICAoX2IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhcy1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgIHJldHVybiBjYW52YXM7XG59O1xuLyoqXG4gKiBjcmVhdGUgYW4gPGlucHV0IHR5cGU9XCJjb2xvclwiPiBlbGVtZW50IGFuZCBhZGQgaXQgdG8gI2lucHV0LWNvbnRhaW5lclxuICogQHJldHVybiB0aGUgY3JlYXRlZCBpbnB1dCBlbGVtZW50XG4gKi9cbmV4cG9ydHMuY3JlYXRlQ29sb3JJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIC8vIHJlbW92ZSBhbnkgZXhpc3RpbmcgaW5wdXRcbiAgICAoX2EgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbG9yLXBpY2tlci1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZW1vdmUoKTtcbiAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgaW5wdXQudmFsdWUgPSBcIiNmZmZmZmZcIjtcbiAgICBpbnB1dC50eXBlID0gXCJjb2xvclwiO1xuICAgIGlucHV0LmlkID0gXCJjb2xvci1waWNrZXJcIjtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHNwYW4uaWQgPSBcImNvbG9yLXBpY2tlci1jb250YWluZXJcIjtcbiAgICBzcGFuLmlubmVyVGV4dCA9IFwiTGluZSBjb2xvcjogXCI7XG4gICAgc3Bhbi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgKF9iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnB1dC1jb250YWluZXJcIikpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICByZXR1cm4gaW5wdXQ7XG59O1xuLyoqXG4gKiBtaXhlcyB0d28gdmVjdG9ycyBhY2NvcmRpbmcgdG8gYSByYXRpb1xuICogQHBhcmFtIHUgZmlyc3QgdmVjdG9yXG4gKiBAcGFyYW0gdiBzZWNvbmQgdmVjdG9yXG4gKiBAcGFyYW0gcyByYXRpbyBvZiBmaXJzdCB0byBzZWNvbmRcbiAqL1xuZXhwb3J0cy5taXggPSBmdW5jdGlvbiAodSwgdiwgcykge1xuICAgIHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW1xuICAgICAgICAoMSAtIHMpICogdS54ICsgcyAqIHYueCxcbiAgICAgICAgKDEgLSBzKSAqIHUueSArIHMgKiB2LnksXG4gICAgICAgICgxIC0gcykgKiB1LnogKyBzICogdi56XG4gICAgXSk7XG59O1xuLyoqXG4gKiBhZGRzIGEgdGV4dHVyZSB0byB0aGUgd2ViZ2wgcmVuZGVyaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBnbCB0aGUgd2ViZ2wgY29udGV4dFxuICogQHBhcmFtIHByb2dyYW0gdGhlIHRleHR1cmUgcHJvZ3JhbVxuICogQHBhcmFtIGluZGV4IHRoZSBudW1iZXIgZm9yIHRoaXMgdGV4dHVyZSwgMCBvciAxXG4gKiBAcGFyYW0gaW1nIGVsZW1lbnQgZm9yIHRoZSB0ZXh0dXJlJ3MgaW1hZ2VcbiAqL1xuZXhwb3J0cy5jcmVhdGVUZXh0dXJlID0gZnVuY3Rpb24gKGdsLCBwcm9ncmFtLCBpbmRleCwgaW1nKSB7XG4gICAgdmFyIHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShpbmRleCA9PT0gMCA/IGdsLlRFWFRVUkUwIDogZ2wuVEVYVFVSRTEpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCLCBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidGV4dHVyZVwiICsgaW5kZXgpLCBpbmRleCk7XG59O1xuLyoqXG4gKiBjcmVhdGUgYSBzaW1wbGUgcGxhY2Vob2xkZXIgdGV4dHVyZSB3aGlsZSB3YWl0aW5nIGZvciBvdGhlciB0ZXh0dXJlcyB0byBsb2FkXG4gKiBAcGFyYW0gZ2wgdGhlIHJlbmRlcmluZyBjb250ZXh0IHRvIHVzZVxuICovXG5leHBvcnRzLnBsYWNlaG9sZGVyVGV4dHVyZSA9IGZ1bmN0aW9uIChnbCkge1xuICAgIHZhciB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIDIsIDIsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFtcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMjU1LFxuICAgICAgICAyNTUsXG4gICAgICAgIDI1NSxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMjU1LFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAyNTUsXG4gICAgICAgIDI1NSxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMjU1LFxuICAgICAgICAyNTVcbiAgICBdKSk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbn07XG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBwbGFjZWhvbGRlciB0ZXh0dXJlIHdoaWxlIHdhaXRpbmcgZm9yIG90aGVyIHRleHR1cmVzIHRvIGxvYWRcbiAqIEBwYXJhbSBnbCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgdG8gdXNlXG4gKiBAcGFyYW0gcHJvZ3JhbSB0aGUgd2ViZ2wgcHJvZ3JhbVxuICogQHBhcmFtIHJlZmxlY3RpdmUgd2hldGhlciBvYmplY3RzIHNob3VsZCByZWZsZWN0XG4gKiBAcGFyYW0gcmVmcmFjdGl2ZSB3aGV0aGVyIG9iamVjdHMgc2hvdWxkIHJlZnJhY3RcbiAqL1xuZXhwb3J0cy5zZXRSRnVuYyA9IGZ1bmN0aW9uIChnbCwgcHJvZ3JhbSwgcmVmbGVjdGl2ZSwgcmVmcmFjdGl2ZSkge1xuICAgIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJyZWZyYWN0aXZlXCIpLCByZWZyYWN0aXZlID8gMSA6IDApO1xuICAgIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJyZWZsZWN0aXZlXCIpLCByZWZsZWN0aXZlID8gMSA6IDApO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWhlbHBlcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vL1xuLy8gIGluaXRTaGFkZXJzLmpzXG4vL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pbml0U2hhZGVycyA9IGZ1bmN0aW9uIChnbCwgdmVydGV4U2hhZGVySWQsIGZyYWdtZW50U2hhZGVySWQpIHtcbiAgICB2YXIgdmVydEVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2ZXJ0ZXhTaGFkZXJJZCk7XG4gICAgaWYgKHZlcnRFbGVtID09PSBudWxsIHx8IHZlcnRFbGVtLnRleHRDb250ZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBsb2FkIHZlcnRleCBzaGFkZXIgXCIgKyB2ZXJ0ZXhTaGFkZXJJZCk7XG4gICAgfVxuICAgIHZhciB2ZXJ0U2hkciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgICBpZiAodmVydFNoZHIgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNyZWF0ZSB2ZXJ0ZXggc2hhZGVyIFwiICsgdmVydGV4U2hhZGVySWQpO1xuICAgIH1cbiAgICBnbC5zaGFkZXJTb3VyY2UodmVydFNoZHIsIHZlcnRFbGVtLnRleHRDb250ZW50KTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHZlcnRTaGRyKTtcbiAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcih2ZXJ0U2hkciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgIHZhciBtc2cgPSBcIlZlcnRleCBzaGFkZXIgZmFpbGVkIHRvIGNvbXBpbGUuICBUaGUgZXJyb3IgbG9nIGlzOlwiICtcbiAgICAgICAgICAgIFwiPHByZT5cIiArXG4gICAgICAgICAgICBnbC5nZXRTaGFkZXJJbmZvTG9nKHZlcnRTaGRyKSArXG4gICAgICAgICAgICBcIjwvcHJlPlwiO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG4gICAgdmFyIGZyYWdFbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZnJhZ21lbnRTaGFkZXJJZCk7XG4gICAgaWYgKGZyYWdFbGVtID09PSBudWxsIHx8IGZyYWdFbGVtLnRleHRDb250ZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBsb2FkIHZlcnRleCBzaGFkZXIgXCIgKyBmcmFnbWVudFNoYWRlcklkKTtcbiAgICB9XG4gICAgdmFyIGZyYWdTaGRyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgaWYgKGZyYWdTaGRyID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBjcmVhdGUgdmVydGV4IHNoYWRlciBcIiArIGZyYWdtZW50U2hhZGVySWQpO1xuICAgIH1cbiAgICBnbC5zaGFkZXJTb3VyY2UoZnJhZ1NoZHIsIGZyYWdFbGVtLnRleHRDb250ZW50KTtcbiAgICBnbC5jb21waWxlU2hhZGVyKGZyYWdTaGRyKTtcbiAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihmcmFnU2hkciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgIHZhciBtc2cgPSBcIkZyYWdtZW50IHNoYWRlciBmYWlsZWQgdG8gY29tcGlsZS4gIFRoZSBlcnJvciBsb2cgaXM6XCIgK1xuICAgICAgICAgICAgXCI8cHJlPlwiICtcbiAgICAgICAgICAgIGdsLmdldFNoYWRlckluZm9Mb2coZnJhZ1NoZHIpICtcbiAgICAgICAgICAgIFwiPC9wcmU+XCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbiAgICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAocHJvZ3JhbSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY3JlYXRlIHByb2dyYW1cIik7XG4gICAgfVxuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0U2hkcik7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZyYWdTaGRyKTtcbiAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcbiAgICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG4gICAgICAgIHZhciBtc2cgPSBcIlNoYWRlciBwcm9ncmFtIGZhaWxlZCB0byBsaW5rLiAgVGhlIGVycm9yIGxvZyBpczpcIiArXG4gICAgICAgICAgICBcIjxwcmU+XCIgK1xuICAgICAgICAgICAgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkgK1xuICAgICAgICAgICAgXCI8L3ByZT5cIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtO1xufTtcbi8qXG4vLyBHZXQgYSBmaWxlIGFzIGEgc3RyaW5nIHVzaW5nICBBSkFYXG5mdW5jdGlvbiBsb2FkRmlsZUFKQVgobmFtZSkge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICAgICAgb2tTdGF0dXMgPSBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJmaWxlOlwiID8gMCA6IDIwMDtcbiAgICB4aHIub3BlbignR0VUJywgbmFtZSwgZmFsc2UpO1xuICAgIHhoci5zZW5kKG51bGwpO1xuICAgIHJldHVybiB4aHIuc3RhdHVzID09IG9rU3RhdHVzID8geGhyLnJlc3BvbnNlVGV4dCA6IG51bGw7XG59O1xuXG5cbmZ1bmN0aW9uIGluaXRTaGFkZXJzRnJvbUZpbGVzKGdsLCB2U2hhZGVyTmFtZSwgZlNoYWRlck5hbWUpIHtcbiAgICBmdW5jdGlvbiBnZXRTaGFkZXIoZ2wsIHNoYWRlck5hbWUsIHR5cGUpIHtcbiAgICAgICAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKSxcbiAgICAgICAgICAgIHNoYWRlclNjcmlwdCA9IGxvYWRGaWxlQUpBWChzaGFkZXJOYW1lKTtcbiAgICAgICAgaWYgKCFzaGFkZXJTY3JpcHQpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ291bGQgbm90IGZpbmQgc2hhZGVyIHNvdXJjZTogXCIrc2hhZGVyTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc2hhZGVyU2NyaXB0KTtcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuXG4gICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICBhbGVydChnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYWRlcjtcbiAgICB9XG4gICAgdmFyIHZlcnRleFNoYWRlciA9IGdldFNoYWRlcihnbCwgdlNoYWRlck5hbWUsIGdsLlZFUlRFWF9TSEFERVIpLFxuICAgICAgICBmcmFnbWVudFNoYWRlciA9IGdldFNoYWRlcihnbCwgZlNoYWRlck5hbWUsIGdsLkZSQUdNRU5UX1NIQURFUiksXG4gICAgICAgIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG5cbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuXG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICBhbGVydChcIkNvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnNcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIFxuICAgIHJldHVybiBwcm9ncmFtO1xufTtcbiovXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbml0U2hhZGVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZXBzaWxvbiA9IDAuMDAwMDE7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25zdGFudHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHkgKi9cbnZhciBtYXQ0XzEgPSByZXF1aXJlKFwiLi9tYXQ0XCIpO1xudmFyIHF1YXRfMSA9IHJlcXVpcmUoXCIuL3F1YXRcIik7XG52YXIgdmVjMl8xID0gcmVxdWlyZShcIi4vdmVjMlwiKTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi92ZWMzXCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIG1hdDMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gbWF0Myh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDkpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1hdDMucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSB2YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gMDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA5OyBpKyspIHtcbiAgICAgICAgICAgIGRlc3QudmFsdWVzW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gdGhpcy52YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5yb3cgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogMyArIDBdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiAzICsgMV0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDMgKyAyXVxuICAgICAgICBdO1xuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUuY29sID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbaW5kZXhdLCB0aGlzLnZhbHVlc1tpbmRleCArIDNdLCB0aGlzLnZhbHVlc1tpbmRleCArIDZdXTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChtYXRyaXgsIHRocmVzaG9sZCkge1xuICAgICAgICBpZiAodGhyZXNob2xkID09PSB2b2lkIDApIHsgdGhyZXNob2xkID0gY29uc3RhbnRzXzEuZXBzaWxvbjsgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMudmFsdWVzW2ldIC0gbWF0cml4LmF0KGkpKSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLmRldGVybWluYW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgZGV0MDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XG4gICAgICAgIHZhciBkZXQxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjA7XG4gICAgICAgIHZhciBkZXQyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcbiAgICAgICAgcmV0dXJuIGEwMCAqIGRldDAxICsgYTAxICogZGV0MTEgKyBhMDIgKiBkZXQyMTtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnNldElkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRlbXAwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgdGVtcDAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciB0ZW1wMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB0aGlzLnZhbHVlc1szXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB0ZW1wMDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gdGVtcDAyO1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9IHRlbXAxMjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5pbnZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgZGV0MDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XG4gICAgICAgIHZhciBkZXQxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjA7XG4gICAgICAgIHZhciBkZXQyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcbiAgICAgICAgdmFyIGRldCA9IGEwMCAqIGRldDAxICsgYTAxICogZGV0MTEgKyBhMDIgKiBkZXQyMTtcbiAgICAgICAgaWYgKCFkZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGRldCA9IDEuMCAvIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBkZXQwMSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gKGExMiAqIGEwMSAtIGEwMiAqIGExMSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gZGV0MTEgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGRldDIxICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s3XSA9ICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbOF0gPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIChtYXRyaXgpIHtcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGExMCA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTExID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTIgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGIwMCA9IG1hdHJpeC5hdCgwKTtcbiAgICAgICAgdmFyIGIwMSA9IG1hdHJpeC5hdCgxKTtcbiAgICAgICAgdmFyIGIwMiA9IG1hdHJpeC5hdCgyKTtcbiAgICAgICAgdmFyIGIxMCA9IG1hdHJpeC5hdCgzKTtcbiAgICAgICAgdmFyIGIxMSA9IG1hdHJpeC5hdCg0KTtcbiAgICAgICAgdmFyIGIxMiA9IG1hdHJpeC5hdCg1KTtcbiAgICAgICAgdmFyIGIyMCA9IG1hdHJpeC5hdCg2KTtcbiAgICAgICAgdmFyIGIyMSA9IG1hdHJpeC5hdCg3KTtcbiAgICAgICAgdmFyIGIyMiA9IG1hdHJpeC5hdCg4KTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjA7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjA7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjA7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS5tdWx0aXBseVZlYzIgPSBmdW5jdGlvbiAodmVjdG9yLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0Lnh5ID0gW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1sxXSArIHkgKiB0aGlzLnZhbHVlc1s0XSArIHRoaXMudmFsdWVzWzddXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdmVjMl8xLmRlZmF1bHQoW1xuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1swXSArIHkgKiB0aGlzLnZhbHVlc1szXSArIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1sxXSArIHkgKiB0aGlzLnZhbHVlc1s0XSArIHRoaXMudmFsdWVzWzddXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUubXVsdGlwbHlWZWMzID0gZnVuY3Rpb24gKHZlY3RvciwgcmVzdWx0KSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC54eXogPSBbXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzBdICsgeSAqIHRoaXMudmFsdWVzWzNdICsgeiAqIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1sxXSArIHkgKiB0aGlzLnZhbHVlc1s0XSArIHogKiB0aGlzLnZhbHVlc1s3XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMl0gKyB5ICogdGhpcy52YWx1ZXNbNV0gKyB6ICogdGhpcy52YWx1ZXNbOF1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB2ZWMzXzEuZGVmYXVsdChbXG4gICAgICAgICAgICAgICAgeCAqIHRoaXMudmFsdWVzWzBdICsgeSAqIHRoaXMudmFsdWVzWzNdICsgeiAqIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgICAgIHggKiB0aGlzLnZhbHVlc1sxXSArIHkgKiB0aGlzLnZhbHVlc1s0XSArIHogKiB0aGlzLnZhbHVlc1s3XSxcbiAgICAgICAgICAgICAgICB4ICogdGhpcy52YWx1ZXNbMl0gKyB5ICogdGhpcy52YWx1ZXNbNV0gKyB6ICogdGhpcy52YWx1ZXNbOF1cbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQzLnByb3RvdHlwZS50b01hdDQgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pbml0KFtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1swXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1syXSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzVdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG1hdDRfMS5kZWZhdWx0KFtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1swXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSxcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1syXSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzRdLFxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzVdLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNl0sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbN10sXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0sXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5wcm90b3R5cGUudG9RdWF0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBtMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIG0wMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgbTEwID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBtMTEgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIG0xMiA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgbTIwID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBtMjEgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIG0yMiA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgZm91clhTcXVhcmVkTWludXMxID0gbTAwIC0gbTExIC0gbTIyO1xuICAgICAgICB2YXIgZm91cllTcXVhcmVkTWludXMxID0gbTExIC0gbTAwIC0gbTIyO1xuICAgICAgICB2YXIgZm91clpTcXVhcmVkTWludXMxID0gbTIyIC0gbTAwIC0gbTExO1xuICAgICAgICB2YXIgZm91cldTcXVhcmVkTWludXMxID0gbTAwICsgbTExICsgbTIyO1xuICAgICAgICB2YXIgYmlnZ2VzdEluZGV4ID0gMDtcbiAgICAgICAgdmFyIGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSA9IGZvdXJXU3F1YXJlZE1pbnVzMTtcbiAgICAgICAgaWYgKGZvdXJYU3F1YXJlZE1pbnVzMSA+IGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSkge1xuICAgICAgICAgICAgZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxID0gZm91clhTcXVhcmVkTWludXMxO1xuICAgICAgICAgICAgYmlnZ2VzdEluZGV4ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91cllTcXVhcmVkTWludXMxID4gZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxKSB7XG4gICAgICAgICAgICBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEgPSBmb3VyWVNxdWFyZWRNaW51czE7XG4gICAgICAgICAgICBiaWdnZXN0SW5kZXggPSAyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3VyWlNxdWFyZWRNaW51czEgPiBmb3VyQmlnZ2VzdFNxdWFyZWRNaW51czEpIHtcbiAgICAgICAgICAgIGZvdXJCaWdnZXN0U3F1YXJlZE1pbnVzMSA9IGZvdXJaU3F1YXJlZE1pbnVzMTtcbiAgICAgICAgICAgIGJpZ2dlc3RJbmRleCA9IDM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJpZ2dlc3RWYWwgPSBNYXRoLnNxcnQoZm91ckJpZ2dlc3RTcXVhcmVkTWludXMxICsgMSkgKiAwLjU7XG4gICAgICAgIHZhciBtdWx0ID0gMC4yNSAvIGJpZ2dlc3RWYWw7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgcXVhdF8xLmRlZmF1bHQoKTtcbiAgICAgICAgc3dpdGNoIChiaWdnZXN0SW5kZXgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICByZXN1bHQudyA9IGJpZ2dlc3RWYWw7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnggPSAobTEyIC0gbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAobTIwIC0gbTAyKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnogPSAobTAxIC0gbTEwKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmVzdWx0LncgPSAobTEyIC0gbTIxKSAqIG11bHQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnggPSBiaWdnZXN0VmFsO1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gKG0wMSArIG0xMCkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gKG0yMCArIG0wMikgKiBtdWx0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ID0gKG0yMCAtIG0wMikgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gKG0wMSArIG0xMCkgKiBtdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gYmlnZ2VzdFZhbDtcbiAgICAgICAgICAgICAgICByZXN1bHQueiA9IChtMTIgKyBtMjEpICogbXVsdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICByZXN1bHQudyA9IChtMDEgLSBtMTApICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueCA9IChtMjAgKyBtMDIpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IChtMTIgKyBtMjEpICogbXVsdDtcbiAgICAgICAgICAgICAgICByZXN1bHQueiA9IGJpZ2dlc3RWYWw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIG1hdDMucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmdsZSwgYXhpcykge1xuICAgICAgICB2YXIgeCA9IGF4aXMueDtcbiAgICAgICAgdmFyIHkgPSBheGlzLnk7XG4gICAgICAgIHZhciB6ID0gYXhpcy56O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICAgICAgeCAqPSBsZW5ndGg7XG4gICAgICAgICAgICB5ICo9IGxlbmd0aDtcbiAgICAgICAgICAgIHogKj0gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHQgPSAxLjAgLSBjO1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTIwID0gdGhpcy52YWx1ZXNbOF07XG4gICAgICAgIHZhciBhMjEgPSB0aGlzLnZhbHVlc1s5XTtcbiAgICAgICAgdmFyIGEyMiA9IHRoaXMudmFsdWVzWzEwXTtcbiAgICAgICAgdmFyIGIwMCA9IHggKiB4ICogdCArIGM7XG4gICAgICAgIHZhciBiMDEgPSB5ICogeCAqIHQgKyB6ICogcztcbiAgICAgICAgdmFyIGIwMiA9IHogKiB4ICogdCAtIHkgKiBzO1xuICAgICAgICB2YXIgYjEwID0geCAqIHkgKiB0IC0geiAqIHM7XG4gICAgICAgIHZhciBiMTEgPSB5ICogeSAqIHQgKyBjO1xuICAgICAgICB2YXIgYjEyID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgICAgIHZhciBiMjAgPSB4ICogeiAqIHQgKyB5ICogcztcbiAgICAgICAgdmFyIGIyMSA9IHkgKiB6ICogdCAtIHggKiBzO1xuICAgICAgICB2YXIgYjIyID0geiAqIHogKiB0ICsgYztcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBhMDAgKiBiMDAgKyBhMTAgKiBiMDEgKyBhMjAgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdID0gYTAxICogYjAwICsgYTExICogYjAxICsgYTIxICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IGEwMiAqIGIwMCArIGExMiAqIGIwMSArIGEyMiAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBhMDAgKiBiMTAgKyBhMTAgKiBiMTEgKyBhMjAgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gYTAxICogYjEwICsgYTExICogYjExICsgYTIxICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IGEwMiAqIGIxMCArIGExMiAqIGIxMSArIGEyMiAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSBhMDAgKiBiMjAgKyBhMTAgKiBiMjEgKyBhMjAgKiBiMjI7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gYTAxICogYjIwICsgYTExICogYjIxICsgYTIxICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IGEwMiAqIGIyMCArIGExMiAqIGIyMSArIGEyMiAqIGIyMjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQzLnByb2R1Y3QgPSBmdW5jdGlvbiAobTEsIG0yLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIGEwMCA9IG0xLmF0KDApO1xuICAgICAgICB2YXIgYTAxID0gbTEuYXQoMSk7XG4gICAgICAgIHZhciBhMDIgPSBtMS5hdCgyKTtcbiAgICAgICAgdmFyIGExMCA9IG0xLmF0KDMpO1xuICAgICAgICB2YXIgYTExID0gbTEuYXQoNCk7XG4gICAgICAgIHZhciBhMTIgPSBtMS5hdCg1KTtcbiAgICAgICAgdmFyIGEyMCA9IG0xLmF0KDYpO1xuICAgICAgICB2YXIgYTIxID0gbTEuYXQoNyk7XG4gICAgICAgIHZhciBhMjIgPSBtMS5hdCg4KTtcbiAgICAgICAgdmFyIGIwMCA9IG0yLmF0KDApO1xuICAgICAgICB2YXIgYjAxID0gbTIuYXQoMSk7XG4gICAgICAgIHZhciBiMDIgPSBtMi5hdCgyKTtcbiAgICAgICAgdmFyIGIxMCA9IG0yLmF0KDMpO1xuICAgICAgICB2YXIgYjExID0gbTIuYXQoNCk7XG4gICAgICAgIHZhciBiMTIgPSBtMi5hdCg1KTtcbiAgICAgICAgdmFyIGIyMCA9IG0yLmF0KDYpO1xuICAgICAgICB2YXIgYjIxID0gbTIuYXQoNyk7XG4gICAgICAgIHZhciBiMjIgPSBtMi5hdCg4KTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0LmluaXQoW1xuICAgICAgICAgICAgICAgIGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG1hdDMoW1xuICAgICAgICAgICAgICAgIGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMCxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjEsXG4gICAgICAgICAgICAgICAgYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0My5pZGVudGl0eSA9IG5ldyBtYXQzKCkuc2V0SWRlbnRpdHkoKTtcbiAgICByZXR1cm4gbWF0Mztcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBtYXQzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0My5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eSAqL1xudmFyIG1hdDNfMSA9IHJlcXVpcmUoXCIuL21hdDNcIik7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vdmVjM1wiKTtcbnZhciB2ZWM0XzEgPSByZXF1aXJlKFwiLi92ZWM0XCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIG1hdDQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gbWF0NCh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQodmFsdWVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtYXQ0LnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2ldID0gMDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBtYXQ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBkZXN0LnZhbHVlc1tpXSA9IHRoaXMudmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnJvdyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiA0ICsgMF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCAqIDQgKyAxXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICogNCArIDJdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKiA0ICsgM11cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmNvbCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXhdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaW5kZXggKyA0XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW2luZGV4ICsgOF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tpbmRleCArIDEyXVxuICAgICAgICBdO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKG1hdHJpeCwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMudmFsdWVzW2ldIC0gbWF0cml4LmF0KGkpKSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLmRldGVybWluYW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTAzID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBhMjMgPSB0aGlzLnZhbHVlc1sxMV07XG4gICAgICAgIHZhciBhMzAgPSB0aGlzLnZhbHVlc1sxMl07XG4gICAgICAgIHZhciBhMzEgPSB0aGlzLnZhbHVlc1sxM107XG4gICAgICAgIHZhciBhMzIgPSB0aGlzLnZhbHVlc1sxNF07XG4gICAgICAgIHZhciBhMzMgPSB0aGlzLnZhbHVlc1sxNV07XG4gICAgICAgIHZhciBkZXQwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcbiAgICAgICAgdmFyIGRldDAxID0gYTAwICogYTEyIC0gYTAyICogYTEwO1xuICAgICAgICB2YXIgZGV0MDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcbiAgICAgICAgdmFyIGRldDA0ID0gYTAxICogYTEzIC0gYTAzICogYTExO1xuICAgICAgICB2YXIgZGV0MDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTI7XG4gICAgICAgIHZhciBkZXQwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwO1xuICAgICAgICB2YXIgZGV0MDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMTtcbiAgICAgICAgdmFyIGRldDEwID0gYTIxICogYTMzIC0gYTIzICogYTMxO1xuICAgICAgICB2YXIgZGV0MTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XG4gICAgICAgIHJldHVybiAoZGV0MDAgKiBkZXQxMSAtXG4gICAgICAgICAgICBkZXQwMSAqIGRldDEwICtcbiAgICAgICAgICAgIGRldDAyICogZGV0MDkgK1xuICAgICAgICAgICAgZGV0MDMgKiBkZXQwOCAtXG4gICAgICAgICAgICBkZXQwNCAqIGRldDA3ICtcbiAgICAgICAgICAgIGRldDA1ICogZGV0MDYpO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdID0gMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s1XSA9IDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSAwO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdID0gMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTVdID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZW1wMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIHRlbXAwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgdGVtcDAzID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciB0ZW1wMTIgPSB0aGlzLnZhbHVlc1s2XTtcbiAgICAgICAgdmFyIHRlbXAxMyA9IHRoaXMudmFsdWVzWzddO1xuICAgICAgICB2YXIgdGVtcDIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHRoaXMudmFsdWVzWzRdO1xuICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHRoaXMudmFsdWVzWzEyXTtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSB0ZW1wMDE7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gdGhpcy52YWx1ZXNbMTNdO1xuICAgICAgICB0aGlzLnZhbHVlc1s4XSA9IHRlbXAwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbOV0gPSB0ZW1wMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzExXSA9IHRoaXMudmFsdWVzWzE0XTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTJdID0gdGVtcDAzO1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gPSB0ZW1wMTM7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSA9IHRlbXAyMztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5pbnZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTAzID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBhMjMgPSB0aGlzLnZhbHVlc1sxMV07XG4gICAgICAgIHZhciBhMzAgPSB0aGlzLnZhbHVlc1sxMl07XG4gICAgICAgIHZhciBhMzEgPSB0aGlzLnZhbHVlc1sxM107XG4gICAgICAgIHZhciBhMzIgPSB0aGlzLnZhbHVlc1sxNF07XG4gICAgICAgIHZhciBhMzMgPSB0aGlzLnZhbHVlc1sxNV07XG4gICAgICAgIHZhciBkZXQwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcbiAgICAgICAgdmFyIGRldDAxID0gYTAwICogYTEyIC0gYTAyICogYTEwO1xuICAgICAgICB2YXIgZGV0MDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTA7XG4gICAgICAgIHZhciBkZXQwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcbiAgICAgICAgdmFyIGRldDA0ID0gYTAxICogYTEzIC0gYTAzICogYTExO1xuICAgICAgICB2YXIgZGV0MDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTI7XG4gICAgICAgIHZhciBkZXQwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMDtcbiAgICAgICAgdmFyIGRldDA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwO1xuICAgICAgICB2YXIgZGV0MDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzA7XG4gICAgICAgIHZhciBkZXQwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMTtcbiAgICAgICAgdmFyIGRldDEwID0gYTIxICogYTMzIC0gYTIzICogYTMxO1xuICAgICAgICB2YXIgZGV0MTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XG4gICAgICAgIHZhciBkZXQgPSBkZXQwMCAqIGRldDExIC1cbiAgICAgICAgICAgIGRldDAxICogZGV0MTAgK1xuICAgICAgICAgICAgZGV0MDIgKiBkZXQwOSArXG4gICAgICAgICAgICBkZXQwMyAqIGRldDA4IC1cbiAgICAgICAgICAgIGRldDA0ICogZGV0MDcgK1xuICAgICAgICAgICAgZGV0MDUgKiBkZXQwNjtcbiAgICAgICAgaWYgKCFkZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGRldCA9IDEuMCAvIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSAoYTExICogZGV0MTEgLSBhMTIgKiBkZXQxMCArIGExMyAqIGRldDA5KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSAoLWEwMSAqIGRldDExICsgYTAyICogZGV0MTAgLSBhMDMgKiBkZXQwOSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gKGEzMSAqIGRldDA1IC0gYTMyICogZGV0MDQgKyBhMzMgKiBkZXQwMykgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdID0gKC1hMjEgKiBkZXQwNSArIGEyMiAqIGRldDA0IC0gYTIzICogZGV0MDMpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1s0XSA9ICgtYTEwICogZGV0MTEgKyBhMTIgKiBkZXQwOCAtIGExMyAqIGRldDA3KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNV0gPSAoYTAwICogZGV0MTEgLSBhMDIgKiBkZXQwOCArIGEwMyAqIGRldDA3KSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbNl0gPSAoLWEzMCAqIGRldDA1ICsgYTMyICogZGV0MDIgLSBhMzMgKiBkZXQwMSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gKGEyMCAqIGRldDA1IC0gYTIyICogZGV0MDIgKyBhMjMgKiBkZXQwMSkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gKGExMCAqIGRldDEwIC0gYTExICogZGV0MDggKyBhMTMgKiBkZXQwNikgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gKC1hMDAgKiBkZXQxMCArIGEwMSAqIGRldDA4IC0gYTAzICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMF0gPSAoYTMwICogZGV0MDQgLSBhMzEgKiBkZXQwMiArIGEzMyAqIGRldDAwKSAqIGRldDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTFdID0gKC1hMjAgKiBkZXQwNCArIGEyMSAqIGRldDAyIC0gYTIzICogZGV0MDApICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gPSAoLWExMCAqIGRldDA5ICsgYTExICogZGV0MDcgLSBhMTIgKiBkZXQwNikgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzEzXSA9IChhMDAgKiBkZXQwOSAtIGEwMSAqIGRldDA3ICsgYTAyICogZGV0MDYpICogZGV0O1xuICAgICAgICB0aGlzLnZhbHVlc1sxNF0gPSAoLWEzMCAqIGRldDAzICsgYTMxICogZGV0MDEgLSBhMzIgKiBkZXQwMCkgKiBkZXQ7XG4gICAgICAgIHRoaXMudmFsdWVzWzE1XSA9IChhMjAgKiBkZXQwMyAtIGEyMSAqIGRldDAxICsgYTIyICogZGV0MDApICogZGV0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKG1hdHJpeCkge1xuICAgICAgICB2YXIgYTAwID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBhMDEgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIGEwMiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgYTAzID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMTMgPSB0aGlzLnZhbHVlc1s3XTtcbiAgICAgICAgdmFyIGEyMCA9IHRoaXMudmFsdWVzWzhdO1xuICAgICAgICB2YXIgYTIxID0gdGhpcy52YWx1ZXNbOV07XG4gICAgICAgIHZhciBhMjIgPSB0aGlzLnZhbHVlc1sxMF07XG4gICAgICAgIHZhciBhMjMgPSB0aGlzLnZhbHVlc1sxMV07XG4gICAgICAgIHZhciBhMzAgPSB0aGlzLnZhbHVlc1sxMl07XG4gICAgICAgIHZhciBhMzEgPSB0aGlzLnZhbHVlc1sxM107XG4gICAgICAgIHZhciBhMzIgPSB0aGlzLnZhbHVlc1sxNF07XG4gICAgICAgIHZhciBhMzMgPSB0aGlzLnZhbHVlc1sxNV07XG4gICAgICAgIHZhciBiMCA9IG1hdHJpeC5hdCgwKTtcbiAgICAgICAgdmFyIGIxID0gbWF0cml4LmF0KDEpO1xuICAgICAgICB2YXIgYjIgPSBtYXRyaXguYXQoMik7XG4gICAgICAgIHZhciBiMyA9IG1hdHJpeC5hdCgzKTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSBiMCAqIGEwMCArIGIxICogYTEwICsgYjIgKiBhMjAgKyBiMyAqIGEzMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSBiMCAqIGEwMSArIGIxICogYTExICsgYjIgKiBhMjEgKyBiMyAqIGEzMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbM10gPSBiMCAqIGEwMyArIGIxICogYTEzICsgYjIgKiBhMjMgKyBiMyAqIGEzMztcbiAgICAgICAgYjAgPSBtYXRyaXguYXQoNCk7XG4gICAgICAgIGIxID0gbWF0cml4LmF0KDUpO1xuICAgICAgICBiMiA9IG1hdHJpeC5hdCg2KTtcbiAgICAgICAgYjMgPSBtYXRyaXguYXQoNyk7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XG4gICAgICAgIHRoaXMudmFsdWVzWzddID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XG4gICAgICAgIGIwID0gbWF0cml4LmF0KDgpO1xuICAgICAgICBiMSA9IG1hdHJpeC5hdCg5KTtcbiAgICAgICAgYjIgPSBtYXRyaXguYXQoMTApO1xuICAgICAgICBiMyA9IG1hdHJpeC5hdCgxMSk7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XG4gICAgICAgIHRoaXMudmFsdWVzWzldID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSBiMCAqIGEwMyArIGIxICogYTEzICsgYjIgKiBhMjMgKyBiMyAqIGEzMztcbiAgICAgICAgYjAgPSBtYXRyaXguYXQoMTIpO1xuICAgICAgICBiMSA9IG1hdHJpeC5hdCgxMyk7XG4gICAgICAgIGIyID0gbWF0cml4LmF0KDE0KTtcbiAgICAgICAgYjMgPSBtYXRyaXguYXQoMTUpO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMl0gPSBiMCAqIGEwMCArIGIxICogYTEwICsgYjIgKiBhMjAgKyBiMyAqIGEzMDtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTNdID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XG4gICAgICAgIHRoaXMudmFsdWVzWzE0XSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxNV0gPSBiMCAqIGEwMyArIGIxICogYTEzICsgYjIgKiBhMjMgKyBiMyAqIGEzMztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5tdWx0aXBseVZlYzMgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s0XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzhdICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTJdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzldICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTNdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEwXSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzE0XVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLm11bHRpcGx5VmVjNCA9IGZ1bmN0aW9uICh2ZWN0b3IsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdmFyIHcgPSB2ZWN0b3IudztcbiAgICAgICAgZGVzdC54ID1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdICogeCArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0gKiB5ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s4XSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEyXSAqIHc7XG4gICAgICAgIGRlc3QueSA9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzVdICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbOV0gKiB6ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1sxM10gKiB3O1xuICAgICAgICBkZXN0LnogPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gKiB4ICtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlc1s2XSAqIHkgK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzEwXSAqIHogK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzE0XSAqIHc7XG4gICAgICAgIGRlc3QudyA9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSAqIHggK1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzWzddICogeSArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTFdICogeiArXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbMTVdICogdztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS50b01hdDMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgbWF0M18xLmRlZmF1bHQoW1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbNF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s1XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzZdLFxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbOF0sXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1s5XSxcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzEwXVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQucHJvdG90eXBlLnRvSW52ZXJzZU1hdDMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhMDAgPSB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgdmFyIGEwMSA9IHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB2YXIgYTAyID0gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIHZhciBhMTAgPSB0aGlzLnZhbHVlc1s0XTtcbiAgICAgICAgdmFyIGExMSA9IHRoaXMudmFsdWVzWzVdO1xuICAgICAgICB2YXIgYTEyID0gdGhpcy52YWx1ZXNbNl07XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgZGV0MDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XG4gICAgICAgIHZhciBkZXQxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjA7XG4gICAgICAgIHZhciBkZXQyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcbiAgICAgICAgdmFyIGRldCA9IGEwMCAqIGRldDAxICsgYTAxICogZGV0MTEgKyBhMDIgKiBkZXQyMTtcbiAgICAgICAgaWYgKCFkZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGRldCA9IDEuMCAvIGRldDtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQzXzEuZGVmYXVsdChbXG4gICAgICAgICAgICBkZXQwMSAqIGRldCxcbiAgICAgICAgICAgICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldCxcbiAgICAgICAgICAgIChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0LFxuICAgICAgICAgICAgZGV0MTEgKiBkZXQsXG4gICAgICAgICAgICAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldCxcbiAgICAgICAgICAgICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldCxcbiAgICAgICAgICAgIGRldDIxICogZGV0LFxuICAgICAgICAgICAgKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApICogZGV0LFxuICAgICAgICAgICAgKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXRcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudmFsdWVzWzEyXSArPVxuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gKiB4ICsgdGhpcy52YWx1ZXNbNF0gKiB5ICsgdGhpcy52YWx1ZXNbOF0gKiB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxM10gKz1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdICogeCArIHRoaXMudmFsdWVzWzVdICogeSArIHRoaXMudmFsdWVzWzldICogejtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTRdICs9XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSAqIHggKyB0aGlzLnZhbHVlc1s2XSAqIHkgKyB0aGlzLnZhbHVlc1sxMF0gKiB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxNV0gKz1cbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdICogeCArIHRoaXMudmFsdWVzWzddICogeSArIHRoaXMudmFsdWVzWzExXSAqIHo7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdICo9IHg7XG4gICAgICAgIHRoaXMudmFsdWVzWzFdICo9IHg7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdICo9IHg7XG4gICAgICAgIHRoaXMudmFsdWVzWzNdICo9IHg7XG4gICAgICAgIHRoaXMudmFsdWVzWzRdICo9IHk7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdICo9IHk7XG4gICAgICAgIHRoaXMudmFsdWVzWzZdICo9IHk7XG4gICAgICAgIHRoaXMudmFsdWVzWzddICo9IHk7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdICo9IHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzldICo9IHo7XG4gICAgICAgIHRoaXMudmFsdWVzWzEwXSAqPSB6O1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gKj0gejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBtYXQ0LnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUsIGF4aXMpIHtcbiAgICAgICAgdmFyIHggPSBheGlzLng7XG4gICAgICAgIHZhciB5ID0gYXhpcy55O1xuICAgICAgICB2YXIgeiA9IGF4aXMuejtcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgICAgIHggKj0gbGVuZ3RoO1xuICAgICAgICAgICAgeSAqPSBsZW5ndGg7XG4gICAgICAgICAgICB6ICo9IGxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcyA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciB0ID0gMS4wIC0gYztcbiAgICAgICAgdmFyIGEwMCA9IHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB2YXIgYTAxID0gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIHZhciBhMDIgPSB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgdmFyIGEwMyA9IHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB2YXIgYTEwID0gdGhpcy52YWx1ZXNbNF07XG4gICAgICAgIHZhciBhMTEgPSB0aGlzLnZhbHVlc1s1XTtcbiAgICAgICAgdmFyIGExMiA9IHRoaXMudmFsdWVzWzZdO1xuICAgICAgICB2YXIgYTEzID0gdGhpcy52YWx1ZXNbN107XG4gICAgICAgIHZhciBhMjAgPSB0aGlzLnZhbHVlc1s4XTtcbiAgICAgICAgdmFyIGEyMSA9IHRoaXMudmFsdWVzWzldO1xuICAgICAgICB2YXIgYTIyID0gdGhpcy52YWx1ZXNbMTBdO1xuICAgICAgICB2YXIgYTIzID0gdGhpcy52YWx1ZXNbMTFdO1xuICAgICAgICB2YXIgYjAwID0geCAqIHggKiB0ICsgYztcbiAgICAgICAgdmFyIGIwMSA9IHkgKiB4ICogdCArIHogKiBzO1xuICAgICAgICB2YXIgYjAyID0geiAqIHggKiB0IC0geSAqIHM7XG4gICAgICAgIHZhciBiMTAgPSB4ICogeSAqIHQgLSB6ICogcztcbiAgICAgICAgdmFyIGIxMSA9IHkgKiB5ICogdCArIGM7XG4gICAgICAgIHZhciBiMTIgPSB6ICogeSAqIHQgKyB4ICogcztcbiAgICAgICAgdmFyIGIyMCA9IHggKiB6ICogdCArIHkgKiBzO1xuICAgICAgICB2YXIgYjIxID0geSAqIHogKiB0IC0geCAqIHM7XG4gICAgICAgIHZhciBiMjIgPSB6ICogeiAqIHQgKyBjO1xuICAgICAgICB0aGlzLnZhbHVlc1swXSA9IGEwMCAqIGIwMCArIGExMCAqIGIwMSArIGEyMCAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSBhMDEgKiBiMDAgKyBhMTEgKiBiMDEgKyBhMjEgKiBiMDI7XG4gICAgICAgIHRoaXMudmFsdWVzWzJdID0gYTAyICogYjAwICsgYTEyICogYjAxICsgYTIyICogYjAyO1xuICAgICAgICB0aGlzLnZhbHVlc1szXSA9IGEwMyAqIGIwMCArIGExMyAqIGIwMSArIGEyMyAqIGIwMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbNF0gPSBhMDAgKiBiMTAgKyBhMTAgKiBiMTEgKyBhMjAgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzVdID0gYTAxICogYjEwICsgYTExICogYjExICsgYTIxICogYjEyO1xuICAgICAgICB0aGlzLnZhbHVlc1s2XSA9IGEwMiAqIGIxMCArIGExMiAqIGIxMSArIGEyMiAqIGIxMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbN10gPSBhMDMgKiBiMTAgKyBhMTMgKiBiMTEgKyBhMjMgKiBiMTI7XG4gICAgICAgIHRoaXMudmFsdWVzWzhdID0gYTAwICogYjIwICsgYTEwICogYjIxICsgYTIwICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1s5XSA9IGEwMSAqIGIyMCArIGExMSAqIGIyMSArIGEyMSAqIGIyMjtcbiAgICAgICAgdGhpcy52YWx1ZXNbMTBdID0gYTAyICogYjIwICsgYTEyICogYjIxICsgYTIyICogYjIyO1xuICAgICAgICB0aGlzLnZhbHVlc1sxMV0gPSBhMDMgKiBiMjAgKyBhMTMgKiBiMjEgKyBhMjMgKiBiMjI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgbWF0NC5mcnVzdHVtID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgICAgIHZhciBybCA9IHJpZ2h0IC0gbGVmdDtcbiAgICAgICAgdmFyIHRiID0gdG9wIC0gYm90dG9tO1xuICAgICAgICB2YXIgZm4gPSBmYXIgLSBuZWFyO1xuICAgICAgICByZXR1cm4gbmV3IG1hdDQoW1xuICAgICAgICAgICAgKG5lYXIgKiAyKSAvIHJsLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIChuZWFyICogMikgLyB0YixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgKHJpZ2h0ICsgbGVmdCkgLyBybCxcbiAgICAgICAgICAgICh0b3AgKyBib3R0b20pIC8gdGIsXG4gICAgICAgICAgICAtKGZhciArIG5lYXIpIC8gZm4sXG4gICAgICAgICAgICAtMSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShmYXIgKiBuZWFyICogMikgLyBmbixcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBtYXQ0LnBlcnNwZWN0aXZlID0gZnVuY3Rpb24gKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgICAgICAgdmFyIHRvcCA9IG5lYXIgKiBNYXRoLnRhbigoZm92ICogTWF0aC5QSSkgLyAzNjAuMCk7XG4gICAgICAgIHZhciByaWdodCA9IHRvcCAqIGFzcGVjdDtcbiAgICAgICAgcmV0dXJuIG1hdDQuZnJ1c3R1bSgtcmlnaHQsIHJpZ2h0LCAtdG9wLCB0b3AsIG5lYXIsIGZhcik7XG4gICAgfTtcbiAgICBtYXQ0Lm9ydGhvZ3JhcGhpYyA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgICAgICB2YXIgcmwgPSByaWdodCAtIGxlZnQ7XG4gICAgICAgIHZhciB0YiA9IHRvcCAtIGJvdHRvbTtcbiAgICAgICAgdmFyIGZuID0gZmFyIC0gbmVhcjtcbiAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgIDIgLyBybCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAyIC8gdGIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLTIgLyBmbixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAtKGxlZnQgKyByaWdodCkgLyBybCxcbiAgICAgICAgICAgIC0odG9wICsgYm90dG9tKSAvIHRiLFxuICAgICAgICAgICAgLShmYXIgKyBuZWFyKSAvIGZuLFxuICAgICAgICAgICAgMVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQubG9va0F0ID0gZnVuY3Rpb24gKHBvc2l0aW9uLCB0YXJnZXQsIHVwKSB7XG4gICAgICAgIGlmICh1cCA9PT0gdm9pZCAwKSB7IHVwID0gdmVjM18xLmRlZmF1bHQudXA7IH1cbiAgICAgICAgaWYgKHBvc2l0aW9uLmVxdWFscyh0YXJnZXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pZGVudGl0eTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeiA9IHZlYzNfMS5kZWZhdWx0LmRpZmZlcmVuY2UocG9zaXRpb24sIHRhcmdldCkubm9ybWFsaXplKCk7XG4gICAgICAgIHZhciB4ID0gdmVjM18xLmRlZmF1bHQuY3Jvc3ModXAsIHopLm5vcm1hbGl6ZSgpO1xuICAgICAgICB2YXIgeSA9IHZlYzNfMS5kZWZhdWx0LmNyb3NzKHosIHgpLm5vcm1hbGl6ZSgpO1xuICAgICAgICByZXR1cm4gbmV3IG1hdDQoW1xuICAgICAgICAgICAgeC54LFxuICAgICAgICAgICAgeS54LFxuICAgICAgICAgICAgei54LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHgueSxcbiAgICAgICAgICAgIHkueSxcbiAgICAgICAgICAgIHoueSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB4LnosXG4gICAgICAgICAgICB5LnosXG4gICAgICAgICAgICB6LnosXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLXZlYzNfMS5kZWZhdWx0LmRvdCh4LCBwb3NpdGlvbiksXG4gICAgICAgICAgICAtdmVjM18xLmRlZmF1bHQuZG90KHksIHBvc2l0aW9uKSxcbiAgICAgICAgICAgIC12ZWMzXzEuZGVmYXVsdC5kb3QoeiwgcG9zaXRpb24pLFxuICAgICAgICAgICAgMVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIG1hdDQucHJvZHVjdCA9IGZ1bmN0aW9uIChtMSwgbTIsIHJlc3VsdCkge1xuICAgICAgICB2YXIgYTAwID0gbTEuYXQoMCk7XG4gICAgICAgIHZhciBhMDEgPSBtMS5hdCgxKTtcbiAgICAgICAgdmFyIGEwMiA9IG0xLmF0KDIpO1xuICAgICAgICB2YXIgYTAzID0gbTEuYXQoMyk7XG4gICAgICAgIHZhciBhMTAgPSBtMS5hdCg0KTtcbiAgICAgICAgdmFyIGExMSA9IG0xLmF0KDUpO1xuICAgICAgICB2YXIgYTEyID0gbTEuYXQoNik7XG4gICAgICAgIHZhciBhMTMgPSBtMS5hdCg3KTtcbiAgICAgICAgdmFyIGEyMCA9IG0xLmF0KDgpO1xuICAgICAgICB2YXIgYTIxID0gbTEuYXQoOSk7XG4gICAgICAgIHZhciBhMjIgPSBtMS5hdCgxMCk7XG4gICAgICAgIHZhciBhMjMgPSBtMS5hdCgxMSk7XG4gICAgICAgIHZhciBhMzAgPSBtMS5hdCgxMik7XG4gICAgICAgIHZhciBhMzEgPSBtMS5hdCgxMyk7XG4gICAgICAgIHZhciBhMzIgPSBtMS5hdCgxNCk7XG4gICAgICAgIHZhciBhMzMgPSBtMS5hdCgxNSk7XG4gICAgICAgIHZhciBiMDAgPSBtMi5hdCgwKTtcbiAgICAgICAgdmFyIGIwMSA9IG0yLmF0KDEpO1xuICAgICAgICB2YXIgYjAyID0gbTIuYXQoMik7XG4gICAgICAgIHZhciBiMDMgPSBtMi5hdCgzKTtcbiAgICAgICAgdmFyIGIxMCA9IG0yLmF0KDQpO1xuICAgICAgICB2YXIgYjExID0gbTIuYXQoNSk7XG4gICAgICAgIHZhciBiMTIgPSBtMi5hdCg2KTtcbiAgICAgICAgdmFyIGIxMyA9IG0yLmF0KDcpO1xuICAgICAgICB2YXIgYjIwID0gbTIuYXQoOCk7XG4gICAgICAgIHZhciBiMjEgPSBtMi5hdCg5KTtcbiAgICAgICAgdmFyIGIyMiA9IG0yLmF0KDEwKTtcbiAgICAgICAgdmFyIGIyMyA9IG0yLmF0KDExKTtcbiAgICAgICAgdmFyIGIzMCA9IG0yLmF0KDEyKTtcbiAgICAgICAgdmFyIGIzMSA9IG0yLmF0KDEzKTtcbiAgICAgICAgdmFyIGIzMiA9IG0yLmF0KDE0KTtcbiAgICAgICAgdmFyIGIzMyA9IG0yLmF0KDE1KTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0LmluaXQoW1xuICAgICAgICAgICAgICAgIGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMCArIGIwMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjEgKyBiMDMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyICsgYjAzICogYTMyLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMyArIGIwMSAqIGExMyArIGIwMiAqIGEyMyArIGIwMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjAgKyBiMTMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxICsgYjEzICogYTMxLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMiArIGIxMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDMgKyBiMTEgKiBhMTMgKyBiMTIgKiBhMjMgKyBiMTMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwICsgYjIzICogYTMwLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMSArIGIyMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjIgKyBiMjMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjIwICogYTAzICsgYjIxICogYTEzICsgYjIyICogYTIzICsgYjIzICogYTMzLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMCArIGIzMSAqIGExMCArIGIzMiAqIGEyMCArIGIzMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDEgKyBiMzEgKiBhMTEgKyBiMzIgKiBhMjEgKyBiMzMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjMwICogYTAyICsgYjMxICogYTEyICsgYjMyICogYTIyICsgYjMzICogYTMyLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMyArIGIzMSAqIGExMyArIGIzMiAqIGEyMyArIGIzMyAqIGEzM1xuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtYXQ0KFtcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjAgKyBiMDMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxICsgYjAzICogYTMxLFxuICAgICAgICAgICAgICAgIGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMiArIGIwMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMDAgKiBhMDMgKyBiMDEgKiBhMTMgKyBiMDIgKiBhMjMgKyBiMDMgKiBhMzMsXG4gICAgICAgICAgICAgICAgYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwICsgYjEzICogYTMwLFxuICAgICAgICAgICAgICAgIGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMSArIGIxMyAqIGEzMSxcbiAgICAgICAgICAgICAgICBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjIgKyBiMTMgKiBhMzIsXG4gICAgICAgICAgICAgICAgYjEwICogYTAzICsgYjExICogYTEzICsgYjEyICogYTIzICsgYjEzICogYTMzLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMCArIGIyMyAqIGEzMCxcbiAgICAgICAgICAgICAgICBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjEgKyBiMjMgKiBhMzEsXG4gICAgICAgICAgICAgICAgYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyICsgYjIzICogYTMyLFxuICAgICAgICAgICAgICAgIGIyMCAqIGEwMyArIGIyMSAqIGExMyArIGIyMiAqIGEyMyArIGIyMyAqIGEzMyxcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDAgKyBiMzEgKiBhMTAgKyBiMzIgKiBhMjAgKyBiMzMgKiBhMzAsXG4gICAgICAgICAgICAgICAgYjMwICogYTAxICsgYjMxICogYTExICsgYjMyICogYTIxICsgYjMzICogYTMxLFxuICAgICAgICAgICAgICAgIGIzMCAqIGEwMiArIGIzMSAqIGExMiArIGIzMiAqIGEyMiArIGIzMyAqIGEzMixcbiAgICAgICAgICAgICAgICBiMzAgKiBhMDMgKyBiMzEgKiBhMTMgKyBiMzIgKiBhMjMgKyBiMzMgKiBhMzNcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBtYXQ0LmlkZW50aXR5ID0gbmV3IG1hdDQoKS5zZXRJZGVudGl0eSgpO1xuICAgIHJldHVybiBtYXQ0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1hdDQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXQ0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2FkamFjZW50LW92ZXJsb2FkLXNpZ25hdHVyZXMgKi9cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eSAqL1xudmFyIG1hdDNfMSA9IHJlcXVpcmUoXCIuL21hdDNcIik7XG52YXIgbWF0NF8xID0gcmVxdWlyZShcIi4vbWF0NFwiKTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi92ZWMzXCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIHF1YXQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gcXVhdCh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMueHl6dyA9IHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwieFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocXVhdC5wcm90b3R5cGUsIFwid1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInh5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHF1YXQucHJvdG90eXBlLCBcInh5elwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxdWF0LnByb3RvdHlwZSwgXCJ4eXp3XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl0sIHRoaXMudmFsdWVzWzNdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcXVhdC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgZGVzdC52YWx1ZXNbaV0gPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnJvbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMigyLjAgKiAoeCAqIHkgKyB3ICogeiksIHcgKiB3ICsgeCAqIHggLSB5ICogeSAtIHogKiB6KTtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoMi4wICogKHkgKiB6ICsgdyAqIHgpLCB3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeik7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS55YXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmFzaW4oMi4wICogKHRoaXMueCAqIHRoaXMueiAtIHRoaXMudyAqIHRoaXMueSkpO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnModGhpcy52YWx1ZXNbaV0gLSB2ZWN0b3IuYXQoaSkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgICAgIHRoaXMueiA9IDA7XG4gICAgICAgIHRoaXMudyA9IDE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUuY2FsY3VsYXRlVyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdGhpcy53ID0gLU1hdGguc3FydChNYXRoLmFicygxLjAgLSB4ICogeCAtIHkgKiB5IC0geiAqIHopKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5pbnZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZG90ID0gcXVhdC5kb3QodGhpcywgdGhpcyk7XG4gICAgICAgIGlmICghZG90KSB7XG4gICAgICAgICAgICB0aGlzLnh5encgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW52RG90ID0gZG90ID8gMS4wIC8gZG90IDogMDtcbiAgICAgICAgdGhpcy54ICo9IC1pbnZEb3Q7XG4gICAgICAgIHRoaXMueSAqPSAtaW52RG90O1xuICAgICAgICB0aGlzLnogKj0gLWludkRvdDtcbiAgICAgICAgdGhpcy53ICo9IGludkRvdDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5jb25qdWdhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudmFsdWVzWzBdICo9IC0xO1xuICAgICAgICB0aGlzLnZhbHVlc1sxXSAqPSAtMTtcbiAgICAgICAgdGhpcy52YWx1ZXNbMl0gKj0gLTE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciB6ID0gdGhpcy56O1xuICAgICAgICB2YXIgdyA9IHRoaXMudztcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdyk7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeiArIHcgKiB3KTtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgZGVzdC56ID0gMDtcbiAgICAgICAgICAgIGRlc3QudyA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgICAgICBkZXN0LnggPSB4ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnkgPSB5ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LnogPSB6ICogbGVuZ3RoO1xuICAgICAgICBkZXN0LncgPSB3ICogbGVuZ3RoO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbaV0gKz0gb3RoZXIuYXQoaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBxdWF0LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICB2YXIgcTF4ID0gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIHZhciBxMXkgPSB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgdmFyIHExeiA9IHRoaXMudmFsdWVzWzJdO1xuICAgICAgICB2YXIgcTF3ID0gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIHZhciBxMnggPSBvdGhlci54O1xuICAgICAgICB2YXIgcTJ5ID0gb3RoZXIueTtcbiAgICAgICAgdmFyIHEyeiA9IG90aGVyLno7XG4gICAgICAgIHZhciBxMncgPSBvdGhlci53O1xuICAgICAgICB0aGlzLnggPSBxMXggKiBxMncgKyBxMXcgKiBxMnggKyBxMXkgKiBxMnogLSBxMXogKiBxMnk7XG4gICAgICAgIHRoaXMueSA9IHExeSAqIHEydyArIHExdyAqIHEyeSArIHExeiAqIHEyeCAtIHExeCAqIHEyejtcbiAgICAgICAgdGhpcy56ID0gcTF6ICogcTJ3ICsgcTF3ICogcTJ6ICsgcTF4ICogcTJ5IC0gcTF5ICogcTJ4O1xuICAgICAgICB0aGlzLncgPSBxMXcgKiBxMncgLSBxMXggKiBxMnggLSBxMXkgKiBxMnkgLSBxMXogKiBxMno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUubXVsdGlwbHlWZWMzID0gZnVuY3Rpb24gKHZlY3RvciwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjM18xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55O1xuICAgICAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgICAgICB2YXIgcXggPSB0aGlzLng7XG4gICAgICAgIHZhciBxeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHF6ID0gdGhpcy56O1xuICAgICAgICB2YXIgcXcgPSB0aGlzLnc7XG4gICAgICAgIHZhciBpeCA9IHF3ICogeCArIHF5ICogeiAtIHF6ICogeTtcbiAgICAgICAgdmFyIGl5ID0gcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6O1xuICAgICAgICB2YXIgaXogPSBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XG4gICAgICAgIHZhciBpdyA9IC1xeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG4gICAgICAgIGRlc3QueCA9IGl4ICogcXcgKyBpdyAqIC1xeCArIGl5ICogLXF6IC0gaXogKiAtcXk7XG4gICAgICAgIGRlc3QueSA9IGl5ICogcXcgKyBpdyAqIC1xeSArIGl6ICogLXF4IC0gaXggKiAtcXo7XG4gICAgICAgIGRlc3QueiA9IGl6ICogcXcgKyBpdyAqIC1xeiArIGl4ICogLXF5IC0gaXkgKiAtcXg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUudG9NYXQzID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IG1hdDNfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHZhciB4MiA9IHggKyB4O1xuICAgICAgICB2YXIgeTIgPSB5ICsgeTtcbiAgICAgICAgdmFyIHoyID0geiArIHo7XG4gICAgICAgIHZhciB4eCA9IHggKiB4MjtcbiAgICAgICAgdmFyIHh5ID0geCAqIHkyO1xuICAgICAgICB2YXIgeHogPSB4ICogejI7XG4gICAgICAgIHZhciB5eSA9IHkgKiB5MjtcbiAgICAgICAgdmFyIHl6ID0geSAqIHoyO1xuICAgICAgICB2YXIgenogPSB6ICogejI7XG4gICAgICAgIHZhciB3eCA9IHcgKiB4MjtcbiAgICAgICAgdmFyIHd5ID0gdyAqIHkyO1xuICAgICAgICB2YXIgd3ogPSB3ICogejI7XG4gICAgICAgIGRlc3QuaW5pdChbXG4gICAgICAgICAgICAxIC0gKHl5ICsgenopLFxuICAgICAgICAgICAgeHkgKyB3eixcbiAgICAgICAgICAgIHh6IC0gd3ksXG4gICAgICAgICAgICB4eSAtIHd6LFxuICAgICAgICAgICAgMSAtICh4eCArIHp6KSxcbiAgICAgICAgICAgIHl6ICsgd3gsXG4gICAgICAgICAgICB4eiArIHd5LFxuICAgICAgICAgICAgeXogLSB3eCxcbiAgICAgICAgICAgIDEgLSAoeHggKyB5eSlcbiAgICAgICAgXSk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5wcm90b3R5cGUudG9NYXQ0ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IG1hdDRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgICAgIHZhciB4MiA9IHggKyB4O1xuICAgICAgICB2YXIgeTIgPSB5ICsgeTtcbiAgICAgICAgdmFyIHoyID0geiArIHo7XG4gICAgICAgIHZhciB4eCA9IHggKiB4MjtcbiAgICAgICAgdmFyIHh5ID0geCAqIHkyO1xuICAgICAgICB2YXIgeHogPSB4ICogejI7XG4gICAgICAgIHZhciB5eSA9IHkgKiB5MjtcbiAgICAgICAgdmFyIHl6ID0geSAqIHoyO1xuICAgICAgICB2YXIgenogPSB6ICogejI7XG4gICAgICAgIHZhciB3eCA9IHcgKiB4MjtcbiAgICAgICAgdmFyIHd5ID0gdyAqIHkyO1xuICAgICAgICB2YXIgd3ogPSB3ICogejI7XG4gICAgICAgIGRlc3QuaW5pdChbXG4gICAgICAgICAgICAxIC0gKHl5ICsgenopLFxuICAgICAgICAgICAgeHkgKyB3eixcbiAgICAgICAgICAgIHh6IC0gd3ksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgeHkgLSB3eixcbiAgICAgICAgICAgIDEgLSAoeHggKyB6eiksXG4gICAgICAgICAgICB5eiArIHd4LFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHh6ICsgd3ksXG4gICAgICAgICAgICB5eiAtIHd4LFxuICAgICAgICAgICAgMSAtICh4eCArIHl5KSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHF1YXQuZG90ID0gZnVuY3Rpb24gKHExLCBxMikge1xuICAgICAgICByZXR1cm4gcTEueCAqIHEyLnggKyBxMS55ICogcTIueSArIHExLnogKiBxMi56ICsgcTEudyAqIHEyLnc7XG4gICAgfTtcbiAgICBxdWF0LnN1bSA9IGZ1bmN0aW9uIChxMSwgcTIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSBxMS54ICsgcTIueDtcbiAgICAgICAgZGVzdC55ID0gcTEueSArIHEyLnk7XG4gICAgICAgIGRlc3QueiA9IHExLnogKyBxMi56O1xuICAgICAgICBkZXN0LncgPSBxMS53ICsgcTIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnByb2R1Y3QgPSBmdW5jdGlvbiAocTEsIHEyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHExeCA9IHExLng7XG4gICAgICAgIHZhciBxMXkgPSBxMS55O1xuICAgICAgICB2YXIgcTF6ID0gcTEuejtcbiAgICAgICAgdmFyIHExdyA9IHExLnc7XG4gICAgICAgIHZhciBxMnggPSBxMi54O1xuICAgICAgICB2YXIgcTJ5ID0gcTIueTtcbiAgICAgICAgdmFyIHEyeiA9IHEyLno7XG4gICAgICAgIHZhciBxMncgPSBxMi53O1xuICAgICAgICBkZXN0LnggPSBxMXggKiBxMncgKyBxMXcgKiBxMnggKyBxMXkgKiBxMnogLSBxMXogKiBxMnk7XG4gICAgICAgIGRlc3QueSA9IHExeSAqIHEydyArIHExdyAqIHEyeSArIHExeiAqIHEyeCAtIHExeCAqIHEyejtcbiAgICAgICAgZGVzdC56ID0gcTF6ICogcTJ3ICsgcTF3ICogcTJ6ICsgcTF4ICogcTJ5IC0gcTF5ICogcTJ4O1xuICAgICAgICBkZXN0LncgPSBxMXcgKiBxMncgLSBxMXggKiBxMnggLSBxMXkgKiBxMnkgLSBxMXogKiBxMno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5jcm9zcyA9IGZ1bmN0aW9uIChxMSwgcTIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHF1YXQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcTF4ID0gcTEueDtcbiAgICAgICAgdmFyIHExeSA9IHExLnk7XG4gICAgICAgIHZhciBxMXogPSBxMS56O1xuICAgICAgICB2YXIgcTF3ID0gcTEudztcbiAgICAgICAgdmFyIHEyeCA9IHEyLng7XG4gICAgICAgIHZhciBxMnkgPSBxMi55O1xuICAgICAgICB2YXIgcTJ6ID0gcTIuejtcbiAgICAgICAgdmFyIHEydyA9IHEyLnc7XG4gICAgICAgIGRlc3QueCA9IHExdyAqIHEyeiArIHExeiAqIHEydyArIHExeCAqIHEyeSAtIHExeSAqIHEyeDtcbiAgICAgICAgZGVzdC55ID0gcTF3ICogcTJ3IC0gcTF4ICogcTJ4IC0gcTF5ICogcTJ5IC0gcTF6ICogcTJ6O1xuICAgICAgICBkZXN0LnogPSBxMXcgKiBxMnggKyBxMXggKiBxMncgKyBxMXkgKiBxMnogLSBxMXogKiBxMnk7XG4gICAgICAgIGRlc3QudyA9IHExdyAqIHEyeSArIHExeSAqIHEydyArIHExeiAqIHEyeCAtIHExeCAqIHEyejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICBxdWF0LnNob3J0TWl4ID0gZnVuY3Rpb24gKHExLCBxMiwgdGltZSwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lIDw9IDAuMCkge1xuICAgICAgICAgICAgZGVzdC54eXp3ID0gcTEueHl6dztcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRpbWUgPj0gMS4wKSB7XG4gICAgICAgICAgICBkZXN0Lnh5encgPSBxMi54eXp3O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNvcyA9IHF1YXQuZG90KHExLCBxMik7XG4gICAgICAgIHZhciBxMmEgPSBxMi5jb3B5KCk7XG4gICAgICAgIGlmIChjb3MgPCAwLjApIHtcbiAgICAgICAgICAgIHEyYS5pbnZlcnNlKCk7XG4gICAgICAgICAgICBjb3MgPSAtY29zO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrMDtcbiAgICAgICAgdmFyIGsxO1xuICAgICAgICBpZiAoY29zID4gMC45OTk5KSB7XG4gICAgICAgICAgICBrMCA9IDEgLSB0aW1lO1xuICAgICAgICAgICAgazEgPSAwICsgdGltZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzaW4gPSBNYXRoLnNxcnQoMSAtIGNvcyAqIGNvcyk7XG4gICAgICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHNpbiwgY29zKTtcbiAgICAgICAgICAgIHZhciBvbmVPdmVyU2luID0gMSAvIHNpbjtcbiAgICAgICAgICAgIGswID0gTWF0aC5zaW4oKDEgLSB0aW1lKSAqIGFuZ2xlKSAqIG9uZU92ZXJTaW47XG4gICAgICAgICAgICBrMSA9IE1hdGguc2luKCgwICsgdGltZSkgKiBhbmdsZSkgKiBvbmVPdmVyU2luO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IGswICogcTEueCArIGsxICogcTJhLng7XG4gICAgICAgIGRlc3QueSA9IGswICogcTEueSArIGsxICogcTJhLnk7XG4gICAgICAgIGRlc3QueiA9IGswICogcTEueiArIGsxICogcTJhLno7XG4gICAgICAgIGRlc3QudyA9IGswICogcTEudyArIGsxICogcTJhLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5taXggPSBmdW5jdGlvbiAocTEsIHEyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNvc0hhbGZUaGV0YSA9IHExLnggKiBxMi54ICsgcTEueSAqIHEyLnkgKyBxMS56ICogcTIueiArIHExLncgKiBxMi53O1xuICAgICAgICBpZiAoTWF0aC5hYnMoY29zSGFsZlRoZXRhKSA+PSAxLjApIHtcbiAgICAgICAgICAgIGRlc3QueHl6dyA9IHExLnh5enc7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFsZlRoZXRhID0gTWF0aC5hY29zKGNvc0hhbGZUaGV0YSk7XG4gICAgICAgIHZhciBzaW5IYWxmVGhldGEgPSBNYXRoLnNxcnQoMS4wIC0gY29zSGFsZlRoZXRhICogY29zSGFsZlRoZXRhKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKHNpbkhhbGZUaGV0YSkgPCAwLjAwMSkge1xuICAgICAgICAgICAgZGVzdC54ID0gcTEueCAqIDAuNSArIHEyLnggKiAwLjU7XG4gICAgICAgICAgICBkZXN0LnkgPSBxMS55ICogMC41ICsgcTIueSAqIDAuNTtcbiAgICAgICAgICAgIGRlc3QueiA9IHExLnogKiAwLjUgKyBxMi56ICogMC41O1xuICAgICAgICAgICAgZGVzdC53ID0gcTEudyAqIDAuNSArIHEyLncgKiAwLjU7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmF0aW9BID0gTWF0aC5zaW4oKDEgLSB0aW1lKSAqIGhhbGZUaGV0YSkgLyBzaW5IYWxmVGhldGE7XG4gICAgICAgIHZhciByYXRpb0IgPSBNYXRoLnNpbih0aW1lICogaGFsZlRoZXRhKSAvIHNpbkhhbGZUaGV0YTtcbiAgICAgICAgZGVzdC54ID0gcTEueCAqIHJhdGlvQSArIHEyLnggKiByYXRpb0I7XG4gICAgICAgIGRlc3QueSA9IHExLnkgKiByYXRpb0EgKyBxMi55ICogcmF0aW9CO1xuICAgICAgICBkZXN0LnogPSBxMS56ICogcmF0aW9BICsgcTIueiAqIHJhdGlvQjtcbiAgICAgICAgZGVzdC53ID0gcTEudyAqIHJhdGlvQSArIHEyLncgKiByYXRpb0I7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5mcm9tQXhpc0FuZ2xlID0gZnVuY3Rpb24gKGF4aXMsIGFuZ2xlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyBxdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgYW5nbGUgKj0gMC41O1xuICAgICAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICBkZXN0LnggPSBheGlzLnggKiBzaW47XG4gICAgICAgIGRlc3QueSA9IGF4aXMueSAqIHNpbjtcbiAgICAgICAgZGVzdC56ID0gYXhpcy56ICogc2luO1xuICAgICAgICBkZXN0LncgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgcXVhdC5pZGVudGl0eSA9IG5ldyBxdWF0KCkuc2V0SWRlbnRpdHkoKTtcbiAgICByZXR1cm4gcXVhdDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBxdWF0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVhdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi92ZWMzXCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIHZlYzIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gdmVjMih2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMueHkgPSB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzIucHJvdG90eXBlLCBcInhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMyLnByb3RvdHlwZSwgXCJ5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMi5wcm90b3R5cGUsIFwieHlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICB2ZWMyLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB0aGlzLng7XG4gICAgICAgIGRlc3QueSA9IHRoaXMueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IC10aGlzLng7XG4gICAgICAgIGRlc3QueSA9IC10aGlzLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHZlY3RvciwgdGhyZXNob2xkKSB7XG4gICAgICAgIGlmICh0aHJlc2hvbGQgPT09IHZvaWQgMCkgeyB0aHJlc2hvbGQgPSBjb25zdGFudHNfMS5lcHNpbG9uOyB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnggLSB2ZWN0b3IueCkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy55IC0gdmVjdG9yLnkpID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5zcXVhcmVkTGVuZ3RoKCkpO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICByZXR1cm4geCAqIHggKyB5ICogeTtcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICs9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKz0gdmVjdG9yLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAtPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC09IHZlY3Rvci55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKj0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMyLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC89IHZlY3Rvci55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzIucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHZhbHVlLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LnkgKj0gdmFsdWU7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxLjAgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueSAqPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubXVsdGlwbHlNYXQyID0gZnVuY3Rpb24gKG1hdHJpeCwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHlWZWMyKHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjMi5wcm90b3R5cGUubXVsdGlwbHlNYXQzID0gZnVuY3Rpb24gKG1hdHJpeCwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHlWZWMyKHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjMi5jcm9zcyA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzNfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHgyID0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeTIgPSB2ZWN0b3IyLnk7XG4gICAgICAgIHZhciB6ID0geCAqIHkyIC0geSAqIHgyO1xuICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICBkZXN0LnogPSB6O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIuZG90ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMikge1xuICAgICAgICByZXR1cm4gdmVjdG9yLnggKiB2ZWN0b3IyLnggKyB2ZWN0b3IueSAqIHZlY3RvcjIueTtcbiAgICB9O1xuICAgIHZlYzIuZGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5zcXVhcmVkRGlzdGFuY2UodmVjdG9yLCB2ZWN0b3IyKSk7XG4gICAgfTtcbiAgICB2ZWMyLnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IyLnggLSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IyLnkgLSB2ZWN0b3IueTtcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHk7XG4gICAgfTtcbiAgICB2ZWMyLmRpcmVjdGlvbiA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXN0LnggPSAwO1xuICAgICAgICAgICAgZGVzdC55ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCA9IHggKiBsZW5ndGg7XG4gICAgICAgIGRlc3QueSA9IHkgKiBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5taXggPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHgyID0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeTIgPSB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueCA9IHggKyB0aW1lICogKHgyIC0geCk7XG4gICAgICAgIGRlc3QueSA9IHkgKyB0aW1lICogKHkyIC0geSk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5zdW0gPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55ICsgdmVjdG9yMi55O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzIuZGlmZmVyZW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzIoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAtIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMi5wcm9kdWN0ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICogdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAqIHZlY3RvcjIueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnF1b3RpZW50ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMigpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC8gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAvIHZlY3RvcjIueTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMyLnplcm8gPSBuZXcgdmVjMihbMCwgMF0pO1xuICAgIHZlYzIub25lID0gbmV3IHZlYzIoWzEsIDFdKTtcbiAgICByZXR1cm4gdmVjMjtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2ZWMyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjMi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBxdWF0XzEgPSByZXF1aXJlKFwiLi9xdWF0XCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jbGFzcy1uYW1lLWNhc2luZ1xudmFyIHZlYzMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gdmVjMyh2YWx1ZXMpIHtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMueHl6ID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjMy5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzMucHJvdG90eXBlLCBcInpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ4eVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWMzLnByb3RvdHlwZSwgXCJ4eXpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWVzWzJdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICB2ZWMzLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaW5kZXhdO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgICAgIHRoaXMueiA9IDA7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB0aGlzLng7XG4gICAgICAgIGRlc3QueSA9IHRoaXMueTtcbiAgICAgICAgZGVzdC56ID0gdGhpcy56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gLXRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gLXRoaXMueTtcbiAgICAgICAgZGVzdC56ID0gLXRoaXMuejtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodmVjdG9yLCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueCAtIHZlY3Rvci54KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnkgLSB2ZWN0b3IueSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy56IC0gdmVjdG9yLnopID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5zcXVhcmVkTGVuZ3RoKCkpO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB2YXIgeiA9IHRoaXMuejtcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogejtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICs9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKz0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiArPSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC09IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLT0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAtPSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54ICo9IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAqPSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55IC89IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogLz0gdmVjdG9yLno7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjMy5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiAodmFsdWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueSAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC56ICo9IHZhbHVlO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGRlc3QueCA9IDA7XG4gICAgICAgICAgICBkZXN0LnkgPSAwO1xuICAgICAgICAgICAgZGVzdC56ID0gMDtcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IDEuMCAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC55ICo9IGxlbmd0aDtcbiAgICAgICAgZGVzdC56ICo9IGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS5tdWx0aXBseUJ5TWF0MyA9IGZ1bmN0aW9uIChtYXRyaXgsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0cml4Lm11bHRpcGx5VmVjMyh0aGlzLCBkZXN0KTtcbiAgICB9O1xuICAgIHZlYzMucHJvdG90eXBlLm11bHRpcGx5QnlRdWF0ID0gZnVuY3Rpb24gKHF1YXRlcm5pb24sIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcXVhdGVybmlvbi5tdWx0aXBseVZlYzModGhpcywgZGVzdCk7XG4gICAgfTtcbiAgICB2ZWMzLnByb3RvdHlwZS50b1F1YXQgPSBmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgcXVhdF8xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYyA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIHZhciBzID0gbmV3IHZlYzMoKTtcbiAgICAgICAgYy54ID0gTWF0aC5jb3ModGhpcy54ICogMC41KTtcbiAgICAgICAgcy54ID0gTWF0aC5zaW4odGhpcy54ICogMC41KTtcbiAgICAgICAgYy55ID0gTWF0aC5jb3ModGhpcy55ICogMC41KTtcbiAgICAgICAgcy55ID0gTWF0aC5zaW4odGhpcy55ICogMC41KTtcbiAgICAgICAgYy56ID0gTWF0aC5jb3ModGhpcy56ICogMC41KTtcbiAgICAgICAgcy56ID0gTWF0aC5zaW4odGhpcy56ICogMC41KTtcbiAgICAgICAgZGVzdC54ID0gcy54ICogYy55ICogYy56IC0gYy54ICogcy55ICogcy56O1xuICAgICAgICBkZXN0LnkgPSBjLnggKiBzLnkgKiBjLnogKyBzLnggKiBjLnkgKiBzLno7XG4gICAgICAgIGRlc3QueiA9IGMueCAqIGMueSAqIHMueiAtIHMueCAqIHMueSAqIGMuejtcbiAgICAgICAgZGVzdC53ID0gYy54ICogYy55ICogYy56ICsgcy54ICogcy55ICogcy56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuY3Jvc3MgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdmFyIHgyID0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeTIgPSB2ZWN0b3IyLnk7XG4gICAgICAgIHZhciB6MiA9IHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC54ID0geSAqIHoyIC0geiAqIHkyO1xuICAgICAgICBkZXN0LnkgPSB6ICogeDIgLSB4ICogejI7XG4gICAgICAgIGRlc3QueiA9IHggKiB5MiAtIHkgKiB4MjtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLmRvdCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICAgICAgdmFyIHgyID0gdmVjdG9yMi54O1xuICAgICAgICB2YXIgeTIgPSB2ZWN0b3IyLnk7XG4gICAgICAgIHZhciB6MiA9IHZlY3RvcjIuejtcbiAgICAgICAgcmV0dXJuIHggKiB4MiArIHkgKiB5MiArIHogKiB6MjtcbiAgICB9O1xuICAgIHZlYzMuZGlzdGFuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5zcXVhcmVkRGlzdGFuY2UodmVjdG9yLCB2ZWN0b3IyKSk7XG4gICAgfTtcbiAgICB2ZWMzLnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIpIHtcbiAgICAgICAgdmFyIHggPSB2ZWN0b3IyLnggLSB2ZWN0b3IueDtcbiAgICAgICAgdmFyIHkgPSB2ZWN0b3IyLnkgLSB2ZWN0b3IueTtcbiAgICAgICAgdmFyIHogPSB2ZWN0b3IyLnogLSB2ZWN0b3IuejtcbiAgICAgICAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogejtcbiAgICB9O1xuICAgIHZlYzMuZGlyZWN0aW9uID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIHZhciB5ID0gdmVjdG9yLnkgLSB2ZWN0b3IyLnk7XG4gICAgICAgIHZhciB6ID0gdmVjdG9yLnogLSB2ZWN0b3IyLno7XG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ID0gMDtcbiAgICAgICAgICAgIGRlc3QueSA9IDA7XG4gICAgICAgICAgICBkZXN0LnogPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcbiAgICAgICAgZGVzdC54ID0geCAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC55ID0geSAqIGxlbmd0aDtcbiAgICAgICAgZGVzdC56ID0geiAqIGxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWMzLm1peCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIHRpbWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHRpbWUgKiAodmVjdG9yMi54IC0gdmVjdG9yLngpO1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHRpbWUgKiAodmVjdG9yMi55IC0gdmVjdG9yLnkpO1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiArIHRpbWUgKiAodmVjdG9yMi56IC0gdmVjdG9yLnopO1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuc3VtID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICsgdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSArIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKyB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5kaWZmZXJlbmNlID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54IC0gdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAtIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogLSB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5wcm9kdWN0ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICogdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAqIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKiB2ZWN0b3IyLno7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjMy5xdW90aWVudCA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCAvIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgLyB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56IC8gdmVjdG9yMi56O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzMuemVybyA9IG5ldyB2ZWMzKFswLCAwLCAwXSk7XG4gICAgdmVjMy5vbmUgPSBuZXcgdmVjMyhbMSwgMSwgMV0pO1xuICAgIHZlYzMudXAgPSBuZXcgdmVjMyhbMCwgMSwgMF0pO1xuICAgIHZlYzMucmlnaHQgPSBuZXcgdmVjMyhbMSwgMCwgMF0pO1xuICAgIHZlYzMuZm9yd2FyZCA9IG5ldyB2ZWMzKFswLCAwLCAxXSk7XG4gICAgcmV0dXJuIHZlYzM7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gdmVjMztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZlYzMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NsYXNzLW5hbWUtY2FzaW5nXG52YXIgdmVjNCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiB2ZWM0KHZhbHVlcykge1xuICAgICAgICB0aGlzLnZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy54eXp3ID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInpcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzJdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJ3XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbM107XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieHlcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwieHl6XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl1dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInh5endcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy52YWx1ZXNbMF0sIHRoaXMudmFsdWVzWzFdLCB0aGlzLnZhbHVlc1syXSwgdGhpcy52YWx1ZXNbM11dO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzBdID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMV0gPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlc1syXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzNdID0gdmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwiclwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcImdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJiXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1syXSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmVjNC5wcm90b3R5cGUsIFwiYVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzWzNdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbM10gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInJnXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMF0gPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1sxXSA9IHZhbHVlc1sxXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZlYzQucHJvdG90eXBlLCBcInJnYlwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLnZhbHVlc1swXSwgdGhpcy52YWx1ZXNbMV0sIHRoaXMudmFsdWVzWzJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2ZWM0LnByb3RvdHlwZSwgXCJyZ2JhXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMudmFsdWVzWzBdLCB0aGlzLnZhbHVlc1sxXSwgdGhpcy52YWx1ZXNbMl0sIHRoaXMudmFsdWVzWzNdXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1swXSA9IHZhbHVlc1swXTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzWzFdID0gdmFsdWVzWzFdO1xuICAgICAgICAgICAgdGhpcy52YWx1ZXNbMl0gPSB2YWx1ZXNbMl07XG4gICAgICAgICAgICB0aGlzLnZhbHVlc1szXSA9IHZhbHVlc1szXTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgdmVjNC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLnogPSAwO1xuICAgICAgICB0aGlzLncgPSAwO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdGhpcy54O1xuICAgICAgICBkZXN0LnkgPSB0aGlzLnk7XG4gICAgICAgIGRlc3QueiA9IHRoaXMuejtcbiAgICAgICAgZGVzdC53ID0gdGhpcy53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gLXRoaXMueDtcbiAgICAgICAgZGVzdC55ID0gLXRoaXMueTtcbiAgICAgICAgZGVzdC56ID0gLXRoaXMuejtcbiAgICAgICAgZGVzdC53ID0gLXRoaXMudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodmVjdG9yLCB0aHJlc2hvbGQpIHtcbiAgICAgICAgaWYgKHRocmVzaG9sZCA9PT0gdm9pZCAwKSB7IHRocmVzaG9sZCA9IGNvbnN0YW50c18xLmVwc2lsb247IH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueCAtIHZlY3Rvci54KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnkgLSB2ZWN0b3IueSkgPiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnModGhpcy56IC0gdmVjdG9yLnopID4gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMudyAtIHZlY3Rvci53KSA+IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuc3F1YXJlZExlbmd0aCgpKTtcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdmFyIHogPSB0aGlzLno7XG4gICAgICAgIHZhciB3ID0gdGhpcy53O1xuICAgICAgICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHc7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG4gICAgICAgIHRoaXMueCArPSB2ZWN0b3IueDtcbiAgICAgICAgdGhpcy55ICs9IHZlY3Rvci55O1xuICAgICAgICB0aGlzLnogKz0gdmVjdG9yLno7XG4gICAgICAgIHRoaXMudyArPSB2ZWN0b3IudztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2ZWM0LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcbiAgICAgICAgdGhpcy54IC09IHZlY3Rvci54O1xuICAgICAgICB0aGlzLnkgLT0gdmVjdG9yLnk7XG4gICAgICAgIHRoaXMueiAtPSB2ZWN0b3IuejtcbiAgICAgICAgdGhpcy53IC09IHZlY3Rvci53O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZlYzQucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggKj0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAqPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56ICo9IHZlY3Rvci56O1xuICAgICAgICB0aGlzLncgKj0gdmVjdG9yLnc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICB0aGlzLnggLz0gdmVjdG9yLng7XG4gICAgICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICAgICAgdGhpcy56IC89IHZlY3Rvci56O1xuICAgICAgICB0aGlzLncgLz0gdmVjdG9yLnc7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiAodmFsdWUsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggKj0gdmFsdWU7XG4gICAgICAgIGRlc3QueSAqPSB2YWx1ZTtcbiAgICAgICAgZGVzdC56ICo9IHZhbHVlO1xuICAgICAgICBkZXN0LncgKj0gdmFsdWU7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVzdC54ICo9IDA7XG4gICAgICAgICAgICBkZXN0LnkgKj0gMDtcbiAgICAgICAgICAgIGRlc3QueiAqPSAwO1xuICAgICAgICAgICAgZGVzdC53ICo9IDA7XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSAxLjAgLyBsZW5ndGg7XG4gICAgICAgIGRlc3QueCAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueSAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QueiAqPSBsZW5ndGg7XG4gICAgICAgIGRlc3QudyAqPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm90b3R5cGUubXVsdGlwbHlNYXQ0ID0gZnVuY3Rpb24gKG1hdHJpeCwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHlWZWM0KHRoaXMsIGRlc3QpO1xuICAgIH07XG4gICAgdmVjNC5taXggPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCB0aW1lLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggKyB0aW1lICogKHZlY3RvcjIueCAtIHZlY3Rvci54KTtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB0aW1lICogKHZlY3RvcjIueSAtIHZlY3Rvci55KTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKyB0aW1lICogKHZlY3RvcjIueiAtIHZlY3Rvci56KTtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgKyB0aW1lICogKHZlY3RvcjIudyAtIHZlY3Rvci53KTtcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LnN1bSA9IGZ1bmN0aW9uICh2ZWN0b3IsIHZlY3RvcjIsIGRlc3QpIHtcbiAgICAgICAgaWYgKCFkZXN0KSB7XG4gICAgICAgICAgICBkZXN0ID0gbmV3IHZlYzQoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0LnggPSB2ZWN0b3IueCArIHZlY3RvcjIueDtcbiAgICAgICAgZGVzdC55ID0gdmVjdG9yLnkgKyB2ZWN0b3IyLnk7XG4gICAgICAgIGRlc3QueiA9IHZlY3Rvci56ICsgdmVjdG9yMi56O1xuICAgICAgICBkZXN0LncgPSB2ZWN0b3IudyArIHZlY3RvcjIudztcbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgfTtcbiAgICB2ZWM0LmRpZmZlcmVuY2UgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLSB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC0gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAtIHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgLSB2ZWN0b3IyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC5wcm9kdWN0ID0gZnVuY3Rpb24gKHZlY3RvciwgdmVjdG9yMiwgZGVzdCkge1xuICAgICAgICBpZiAoIWRlc3QpIHtcbiAgICAgICAgICAgIGRlc3QgPSBuZXcgdmVjNCgpO1xuICAgICAgICB9XG4gICAgICAgIGRlc3QueCA9IHZlY3Rvci54ICogdmVjdG9yMi54O1xuICAgICAgICBkZXN0LnkgPSB2ZWN0b3IueSAqIHZlY3RvcjIueTtcbiAgICAgICAgZGVzdC56ID0gdmVjdG9yLnogKiB2ZWN0b3IyLno7XG4gICAgICAgIGRlc3QudyA9IHZlY3Rvci53ICogdmVjdG9yMi53O1xuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9O1xuICAgIHZlYzQucXVvdGllbnQgPSBmdW5jdGlvbiAodmVjdG9yLCB2ZWN0b3IyLCBkZXN0KSB7XG4gICAgICAgIGlmICghZGVzdCkge1xuICAgICAgICAgICAgZGVzdCA9IG5ldyB2ZWM0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVzdC54ID0gdmVjdG9yLnggLyB2ZWN0b3IyLng7XG4gICAgICAgIGRlc3QueSA9IHZlY3Rvci55IC8gdmVjdG9yMi55O1xuICAgICAgICBkZXN0LnogPSB2ZWN0b3IueiAvIHZlY3RvcjIuejtcbiAgICAgICAgZGVzdC53ID0gdmVjdG9yLncgLyB2ZWN0b3IyLnc7XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH07XG4gICAgdmVjNC56ZXJvID0gbmV3IHZlYzQoWzAsIDAsIDAsIDFdKTtcbiAgICB2ZWM0Lm9uZSA9IG5ldyB2ZWM0KFsxLCAxLCAxLCAxXSk7XG4gICAgcmV0dXJuIHZlYzQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gdmVjNDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZlYzQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKlxuICogQ29weXJpZ2h0IDIwMTAsIEdvb2dsZSBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZVxuICogbWV0OlxuICpcbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlXG4gKiBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyXG4gKiBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlXG4gKiBkaXN0cmlidXRpb24uXG4gKiAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEdvb2dsZSBJbmMuIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbVxuICogdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTXG4gKiBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UXG4gKiBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1JcbiAqIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUXG4gKiBPV05FUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCxcbiAqIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1RcbiAqIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuICogREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZXG4gKiBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcbiAqIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbnMgZnVuY3Rpb25zIGV2ZXJ5IHdlYmdsIHByb2dyYW0gd2lsbCBuZWVkXG4gKiBhIHZlcnNpb24gb2Ygb25lIHdheSBvciBhbm90aGVyLlxuICpcbiAqIEluc3RlYWQgb2Ygc2V0dGluZyB1cCBhIGNvbnRleHQgbWFudWFsbHkgaXQgaXMgcmVjb21tZW5kZWQgdG9cbiAqIHVzZS4gVGhpcyB3aWxsIGNoZWNrIGZvciBzdWNjZXNzIG9yIGZhaWx1cmUuIE9uIGZhaWx1cmUgaXRcbiAqIHdpbGwgYXR0ZW1wdCB0byBwcmVzZW50IGFuIGFwcHJvcmlhdGUgbWVzc2FnZSB0byB0aGUgdXNlci5cbiAqXG4gKiAgICAgICBnbCA9IFdlYkdMVXRpbHMuc2V0dXBXZWJHTChjYW52YXMpO1xuICpcbiAqIEZvciBhbmltYXRlZCBXZWJHTCBhcHBzIHVzZSBvZiBzZXRUaW1lb3V0IG9yIHNldEludGVydmFsIGFyZVxuICogZGlzY291cmFnZWQuIEl0IGlzIHJlY29tbWVuZGVkIHlvdSBzdHJ1Y3R1cmUgeW91ciByZW5kZXJpbmdcbiAqIGxvb3AgbGlrZSB0aGlzLlxuICpcbiAqICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAqICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltRnJhbWUocmVuZGVyLCBjYW52YXMpO1xuICpcbiAqICAgICAgICAgLy8gZG8gcmVuZGVyaW5nXG4gKiAgICAgICAgIC4uLlxuICogICAgICAgfVxuICogICAgICAgcmVuZGVyKCk7XG4gKlxuICogVGhpcyB3aWxsIGNhbGwgeW91ciByZW5kZXJpbmcgZnVuY3Rpb24gdXAgdG8gdGhlIHJlZnJlc2ggcmF0ZVxuICogb2YgeW91ciBkaXNwbGF5IGJ1dCB3aWxsIHN0b3AgcmVuZGVyaW5nIGlmIHlvdXIgYXBwIGlzIG5vdFxuICogdmlzaWJsZS5cbiAqL1xuLyoqXG4gKiBDcmVhdGVzIHRoZSBIVExNIGZvciBhIGZhaWx1cmUgbWVzc2FnZVxuICogQHBhcmFtIHtzdHJpbmd9IGNhbnZhc0NvbnRhaW5lcklkIGlkIG9mIGNvbnRhaW5lciBvZiB0aCBjYW52YXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBodG1sLlxuICovXG52YXIgbWFrZUZhaWxIVE1MID0gZnVuY3Rpb24gKG1zZykge1xuICAgIHJldHVybiAoXCJcIiArXG4gICAgICAgICc8dGFibGUgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjOENFOyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlO1wiPjx0cj4nICtcbiAgICAgICAgJzx0ZCBhbGlnbj1cImNlbnRlclwiPicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImRpc3BsYXk6IHRhYmxlLWNlbGw7IHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XCI+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiXCI+JyArXG4gICAgICAgIG1zZyArXG4gICAgICAgIFwiPC9kaXY+XCIgK1xuICAgICAgICBcIjwvZGl2PlwiICtcbiAgICAgICAgXCI8L3RkPjwvdHI+PC90YWJsZT5cIik7XG59O1xuLyoqXG4gKiBNZXNhc2dlIGZvciBnZXR0aW5nIGEgd2ViZ2wgYnJvd3NlclxuICovXG52YXIgR0VUX0FfV0VCR0xfQlJPV1NFUiA9IFwiXCIgK1xuICAgIFwiVGhpcyBwYWdlIHJlcXVpcmVzIGEgYnJvd3NlciB0aGF0IHN1cHBvcnRzIFdlYkdMLjxici8+XCIgK1xuICAgICc8YSBocmVmPVwiaHR0cDovL2dldC53ZWJnbC5vcmdcIj5DbGljayBoZXJlIHRvIHVwZ3JhZGUgeW91ciBicm93c2VyLjwvYT4nO1xuLyoqXG4gKiBNZXNhc2dlIGZvciBuZWVkIGJldHRlciBoYXJkd2FyZVxuICovXG52YXIgT1RIRVJfUFJPQkxFTSA9IFwiSXQgZG9lc24ndCBhcHBlYXIgeW91ciBjb21wdXRlciBjYW4gc3VwcG9ydFxcbldlYkdMLjxici8+IDxhIGhyZWY9XFxcImh0dHA6Ly9nZXQud2ViZ2wub3JnL3Ryb3VibGVzaG9vdGluZy9cXFwiPkNsaWNrIGhlcmUgZm9yXFxubW9yZSBpbmZvcm1hdGlvbi48L2E+XCI7XG4vKipcbiAqIENyZWF0ZXMgYSB3ZWJnbCBjb250ZXh0LlxuICogQHBhcmFtIHshQ2FudmFzfSBjYW52YXMgVGhlIGNhbnZhcyB0YWcgdG8gZ2V0IGNvbnRleHQgZnJvbS4gSWYgb25lIGlzIG5vdFxuICogcGFzc2VkIGluIG9uZSB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHshV2ViR0xDb250ZXh0fSBUaGUgY3JlYXRlZCBjb250ZXh0LlxuICovXG5leHBvcnRzLmNyZWF0ZTNEQ29udGV4dCA9IGZ1bmN0aW9uIChjYW52YXMsIG9wdEF0dHJpYnMpIHtcbiAgICB2YXIgbmFtZXMgPSBbXCJ3ZWJnbFwiLCBcImV4cGVyaW1lbnRhbC13ZWJnbFwiLCBcIndlYmtpdC0zZFwiLCBcIm1vei13ZWJnbFwiXTtcbiAgICB2YXIgY29udGV4dCA9IG51bGw7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBuYW1lc18xID0gbmFtZXM7IF9pIDwgbmFtZXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIG4gPSBuYW1lc18xW19pXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChuLCBvcHRBdHRyaWJzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGV4dCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbnRleHQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRW5hYmxlIHRvIGNyZWF0ZSAzRCBjb250ZXh0XCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dDtcbn07XG4vKipcbiAqIENyZWF0ZXMgYSB3ZWJnbCBjb250ZXh0LiBJZiBjcmVhdGlvbiBmYWlscyBpdCB3aWxsXG4gKiBjaGFuZ2UgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb250YWluZXIgb2YgdGhlIDxjYW52YXM+XG4gKiB0YWcgdG8gYW4gZXJyb3IgbWVzc2FnZSB3aXRoIHRoZSBjb3JyZWN0IGxpbmtzIGZvciBXZWJHTC5cbiAqIEBwYXJhbSB7RWxlbWVudH0gY2FudmFzIFRoZSBjYW52YXMgZWxlbWVudCB0byBjcmVhdGUgYSBjb250ZXh0IGZyb20uXG4gKiBAcGFyYW0ge1dlYkdMQ29udGV4dENyZWF0aW9uQXR0aXJidXRlc30gb3B0X2F0dHJpYnMgQW55IGNyZWF0aW9uXG4gKiBhdHRyaWJ1dGVzIHlvdSB3YW50IHRvIHBhc3MgaW4uXG4gKiBAcmV0dXJuIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IFRoZSBjcmVhdGVkIGNvbnRleHQuXG4gKi9cbmV4cG9ydHMuc2V0dXBXZWJHTCA9IGZ1bmN0aW9uIChjYW52YXMsIG9wdEF0dHJpYnMpIHtcbiAgICB2YXIgc2hvd0xpbmsgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHZhciBjb250YWluZXIgPSBjYW52YXMucGFyZW50Tm9kZTtcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IG1ha2VGYWlsSFRNTChzdHIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAoIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgc2hvd0xpbmsoR0VUX0FfV0VCR0xfQlJPV1NFUik7XG4gICAgfVxuICAgIHZhciBjb250ZXh0ID0gZXhwb3J0cy5jcmVhdGUzRENvbnRleHQoY2FudmFzLCBvcHRBdHRyaWJzKTtcbiAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgc2hvd0xpbmsoT1RIRVJfUFJPQkxFTSk7XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0O1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdlYmdsLXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBKb3NlcGggUGV0aXR0aSAtIENTIDQ3MzEgQ29tcHV0ZXIgR3JhcGhpY3MgRmluYWwgUHJvamVjdCwgUGFydCAyXG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBmaWxlXzEgPSByZXF1aXJlKFwiLi9maWxlXCIpO1xudmFyIGhlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIik7XG52YXIgaW5pdFNoYWRlcnNfMSA9IHJlcXVpcmUoXCIuL2xpYi9pbml0U2hhZGVyc1wiKTtcbnZhciB2ZWM0XzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzRcIik7XG52YXIgd2ViZ2xfdXRpbHNfMSA9IHJlcXVpcmUoXCIuL2xpYi93ZWJnbC11dGlsc1wiKTtcbnZhciBNb2JpbGVFbGVtZW50XzEgPSByZXF1aXJlKFwiLi9Nb2JpbGVFbGVtZW50XCIpO1xudmFyIG1vZGVsc18xID0gcmVxdWlyZShcIi4vbW9kZWxzXCIpO1xudmFyIHJlbmRlcl8xID0gcmVxdWlyZShcIi4vcmVuZGVyXCIpO1xudmFyIGVudmlyb25tZW50XzEgPSByZXF1aXJlKFwiLi9lbnZpcm9ubWVudFwiKTtcbmV4cG9ydHMuZGVmYXVsdEV4dGVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWluWDogMCxcbiAgICAgICAgbWluWTogMCxcbiAgICAgICAgbWluWjogMCxcbiAgICAgICAgbWF4WDogMSxcbiAgICAgICAgbWF4WTogMSxcbiAgICAgICAgbWF4WjogMVxuICAgIH07XG59O1xuLyoqXG4gKiBBbGwgZ2xvYmFsIHZhcmlhYmxlcyBhcmUgc3RvcmVkIGluIHRoaXMgb2JqZWN0IHRvIG1ha2UgdGhlbSBhY2Nlc3NpYmxlIGZyb21cbiAqIGFueSBtb2R1bGVcbiAqL1xuZXhwb3J0cy5HTE9CQUxTID0ge1xuICAgIC8qKlxuICAgICAqIGdsb2JhbCB2YXJpYWJsZSB1c2VkIHRvIHN0b3JlIHRoZSBJRCBvZiB0aGUgYW5pbWF0aW9uIGNhbGxiYWNrIHNvIGl0IGNhbiBiZVxuICAgICAqIGNhbmNlbGxlZCBsYXRlclxuICAgICAqL1xuICAgIGNhbGxiYWNrSUQ6IHVuZGVmaW5lZCxcbiAgICAvKiogV2hldGhlciBvciBub3QgdG8gZHJhdyBzaGFkb3dzICovXG4gICAgc2hhZG93c09uOiBmYWxzZSxcbiAgICAvKiogd2hldGhlciB0byBkcmF3IHRoZSB3YWxscyBhbmQgZmxvb3Igd2l0aCB0ZXh0dXJlcyAqL1xuICAgIHRleHR1cmVzT246IHRydWVcbn07XG5mdW5jdGlvbiBtYWluKCkge1xuICAgIC8vIGNyZWF0ZSB0aGUgPGNhbnZhcz4gZWxlbWVudFxuICAgIHZhciBjYW52YXMgPSBoZWxwZXJzXzEuY3JlYXRlQ2FudmFzKCk7XG4gICAgLy8gY3JlYXRlIGZpbGUgaW5wdXRcbiAgICB2YXIgZmlsZUlucHV0ID0gZmlsZV8xLmNyZWF0ZUZpbGVJbnB1dCgpO1xuICAgIHZhciByYW5kTWVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPCAwLjUgPyBtb2RlbHNfMS5nZXRDdWJlKCkgOiBtb2RlbHNfMS5nZXRTcGhlcmUoKTtcbiAgICB9O1xuICAgIC8vIGNyZWF0ZSB0aGUgbW9iaWxlXG4gICAgdmFyIG1vYmlsZSA9IG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChyYW5kTWVzaCgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuMywgMC40LCAwLjgsIDFdKSk7XG4gICAgbW9iaWxlLm5leHRSb3RTcGVlZCA9IE1hdGguUEkgLyAzNjA7XG4gICAgbW9iaWxlLmFkZENoaWxkKG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChyYW5kTWVzaCgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzEsIDAuMCwgMC4wLCAxXSkpKTtcbiAgICBtb2JpbGUuYWRkQ2hpbGQobmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KHJhbmRNZXNoKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC45OCwgMSwgMC4wNywgMV0pKSk7XG4gICAgbW9iaWxlLnJhbmRvbUFkZChuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQocmFuZE1lc2goKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjI1LCAwLjkyLCAwLjgzLCAxXSkpKTtcbiAgICBtb2JpbGUucmFuZG9tQWRkKG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChyYW5kTWVzaCgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuMzIsIDAuMjgsIDAuNjEsIDFdKSkpO1xuICAgIG1vYmlsZS5yYW5kb21BZGQobmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KHJhbmRNZXNoKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC4zNSwgMC43NiwgMC43NiwgMV0pKSk7XG4gICAgbW9iaWxlLnJhbmRvbUFkZChuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQocmFuZE1lc2goKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjc1LCAwLjg3LCAwLjUyLCAxXSkpKTtcbiAgICBtb2JpbGUucmFuZG9tQWRkKG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChyYW5kTWVzaCgpLCBuZXcgdmVjNF8xLmRlZmF1bHQoWzAuNDksIDAuODcsIDAuMzksIDFdKSkpO1xuICAgIG1vYmlsZS5yYW5kb21BZGQobmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KHJhbmRNZXNoKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC44OSwgMC43MSwgMC4wMiwgMV0pKSk7XG4gICAgbW9iaWxlLnJhbmRvbUFkZChuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQocmFuZE1lc2goKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFswLjAzLCAwLjMsIDAuMzgsIDFdKSkpO1xuICAgIG1vYmlsZS5yYW5kb21BZGQobmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KHJhbmRNZXNoKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMC40MSwgMC45MiwgMC44MiwgMV0pKSk7XG4gICAgbW9iaWxlLnJhbmRvbUFkZChuZXcgTW9iaWxlRWxlbWVudF8xLk1vYmlsZUVsZW1lbnQocmFuZE1lc2goKSwgbmV3IHZlYzRfMS5kZWZhdWx0KFsxLjAsIDAsIDAsIDFdKSkpO1xuICAgIG1vYmlsZS5yYW5kb21BZGQobmV3IE1vYmlsZUVsZW1lbnRfMS5Nb2JpbGVFbGVtZW50KHJhbmRNZXNoKCksIG5ldyB2ZWM0XzEuZGVmYXVsdChbMCwgMS4wLCAwLCAxXSkpKTtcbiAgICAvLyBnZXQgdGhlIHJlbmRlcmluZyBjb250ZXh0IGZvciBXZWJHTFxuICAgIHZhciBnbCA9IHdlYmdsX3V0aWxzXzEuc2V0dXBXZWJHTChjYW52YXMpO1xuICAgIGlmIChnbCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGdldCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgZm9yIFdlYkdMXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGluaXRpYWxpemUgc2hhZGVyc1xuICAgIHZhciBwcm9ncmFtID0gaW5pdFNoYWRlcnNfMS5pbml0U2hhZGVycyhnbCwgXCJ2c2hhZGVyXCIsIFwiZnNoYWRlclwiKTtcbiAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xuICAgIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAvLyBzZXQgaW5pdGlhbCBhdHRyaWJ1dGVzXG4gICAgdmFyIHJlZmxlY3RpdmUgPSBmYWxzZTtcbiAgICB2YXIgcmVmcmFjdGl2ZSA9IGZhbHNlO1xuICAgIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJyZWZsZWN0aXZlXCIpLCAwKTtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwicmVmcmFjdGl2ZVwiKSwgMCk7XG4gICAgLy8gc2V0IHVwIHBsYWNlaG9sZGVyIHRleHR1cmUgYW5kIGxvYWQgb3RoZXIgdGV4dHVyZXNcbiAgICBoZWxwZXJzXzEucGxhY2Vob2xkZXJUZXh0dXJlKGdsKTtcbiAgICB2YXIgZ3Jhc3NJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyYXNzXCIpO1xuICAgIGlmIChncmFzc0ltZyA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGRuJ3QgZ2V0IGdyYXNzIGltYWdlXCIpO1xuICAgIGhlbHBlcnNfMS5jcmVhdGVUZXh0dXJlKGdsLCBwcm9ncmFtLCAwLCBncmFzc0ltZyk7XG4gICAgdmFyIHN0b25lc0ltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RvbmVzXCIpO1xuICAgIGlmIChncmFzc0ltZyA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGRuJ3QgZ2V0IHN0b25lcyBpbWFnZVwiKTtcbiAgICBoZWxwZXJzXzEuY3JlYXRlVGV4dHVyZShnbCwgcHJvZ3JhbSwgMSwgc3RvbmVzSW1nKTtcbiAgICAvLyBzZXQgdXAgZW52aXJvbm1lbnQgbWFwXG4gICAgdmFyIGVudk1hcEltZ3MgPSBbXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibnZuZWd6XCIpLFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm52cG9zeFwiKSxcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJudm5lZ3lcIiksXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibnZwb3N5XCIpLFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm52cG9zelwiKSxcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJudm5lZ3hcIilcbiAgICBdO1xuICAgIGlmICghZW52TWFwSW1ncy5ldmVyeShmdW5jdGlvbiAoZWx0KSB7IHJldHVybiBlbHQgIT09IG51bGw7IH0pKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb3VsZG4ndCBnZXQgZW52IG1hcCBpbWFnZVwiKTtcbiAgICBlbnZpcm9ubWVudF8xLmNvbmZpZ3VyZUVudmlyb25tZW50TWFwKGdsLCBwcm9ncmFtLCBlbnZNYXBJbWdzKTtcbiAgICAvLyBhbmdsZSBvZiB0aGUgc3BvdGxpZ2h0XG4gICAgdmFyIHBoaSA9IDAuNztcbiAgICAvLyBoYW5kbGUgYSBmaWxlIGJlaW5nIHVwbG9hZGVkXG4gICAgZmlsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBmaWxlXzEuZ2V0SW5wdXQoZmlsZUlucHV0KVxuICAgICAgICAgICAgLnRoZW4oZmlsZV8xLnBhcnNlRmlsZVRleHQpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICBtb2JpbGUucmFuZG9tQWRkKG5ldyBNb2JpbGVFbGVtZW50XzEuTW9iaWxlRWxlbWVudChvYmoucG9seWdvbnMsIG5ldyB2ZWM0XzEuZGVmYXVsdChbTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSwgMV0pLCBvYmouZXh0ZW50cykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICB2YXIgc3RhcnREcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjYW5jZWwgYW55IGV4aXN0aW5nIGFuaW1hdGlvblxuICAgICAgICBpZiAoZXhwb3J0cy5HTE9CQUxTLmNhbGxiYWNrSUQgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGV4cG9ydHMuR0xPQkFMUy5jYWxsYmFja0lEKTtcbiAgICAgICAgLy8gc3RhcnQgcmVuZGVyaW5nXG4gICAgICAgIHJlbmRlcl8xLnJlbmRlcihjYW52YXMsIGdsLCBwcm9ncmFtLCBwcm9ncmFtLCBtb2JpbGUpO1xuICAgIH07XG4gICAgLy8gaGFuZGxlIGtleWJvYXJkIGlucHV0XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBrZXkgPSBldi5rZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGtleSA9PT0gXCJwXCIpIHtcbiAgICAgICAgICAgIGlmIChldi5zaGlmdEtleSlcbiAgICAgICAgICAgICAgICBwaGkgKz0gMC4wMTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwaGkgLT0gMC4wMTtcbiAgICAgICAgICAgIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJwaGlcIiksIHBoaSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gXCJtXCIpIHtcbiAgICAgICAgICAgIGlmIChldi5zaGlmdEtleSlcbiAgICAgICAgICAgICAgICBtb2JpbGUuY2FsY3VsYXRlTm9ybWFscyh0cnVlKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtb2JpbGUuY2FsY3VsYXRlTm9ybWFscyhmYWxzZSk7XG4gICAgICAgICAgICByZWZsZWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICByZWZyYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICBoZWxwZXJzXzEuc2V0UkZ1bmMoZ2wsIHByb2dyYW0sIHJlZmxlY3RpdmUsIHJlZnJhY3RpdmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09IFwiYVwiKSB7XG4gICAgICAgICAgICBleHBvcnRzLkdMT0JBTFMuc2hhZG93c09uID0gIWV4cG9ydHMuR0xPQkFMUy5zaGFkb3dzT247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gXCJjXCIpIHtcbiAgICAgICAgICAgIHJlZmxlY3RpdmUgPSAhcmVmbGVjdGl2ZTtcbiAgICAgICAgICAgIHJlZnJhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGhlbHBlcnNfMS5zZXRSRnVuYyhnbCwgcHJvZ3JhbSwgcmVmbGVjdGl2ZSwgcmVmcmFjdGl2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gXCJkXCIpIHtcbiAgICAgICAgICAgIHJlZmxlY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlZnJhY3RpdmUgPSAhcmVmcmFjdGl2ZTtcbiAgICAgICAgICAgIGhlbHBlcnNfMS5zZXRSRnVuYyhnbCwgcHJvZ3JhbSwgcmVmbGVjdGl2ZSwgcmVmcmFjdGl2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gXCJiXCIpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuR0xPQkFMUy50ZXh0dXJlc09uID0gIWV4cG9ydHMuR0xPQkFMUy50ZXh0dXJlc09uO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgc3RhcnREcmF3aW5nKCk7XG59XG53aW5kb3cub25sb2FkID0gbWFpbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haW4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjM18xID0gcmVxdWlyZShcIi4vbGliL3RzbS92ZWMzXCIpO1xudmFyIGhlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIik7XG4vKiogaGVscGVyIGZ1bmN0aW9uIGZvciBnZW5lcmF0aW5nIHZlcnRpY2VzIG9mIGEgY3ViZSAqL1xuZXhwb3J0cy5xdWFkID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgLTAuNSwgMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgMC41LCAwLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFswLjUsIDAuNSwgMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbMC41LCAtMC41LCAwLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFstMC41LCAtMC41LCAtMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuNSwgMC41LCAtMC41XSksXG4gICAgICAgIG5ldyB2ZWMzXzEuZGVmYXVsdChbMC41LCAwLjUsIC0wLjVdKSxcbiAgICAgICAgbmV3IHZlYzNfMS5kZWZhdWx0KFswLjUsIC0wLjUsIC0wLjVdKVxuICAgIF07XG4gICAgcmV0dXJuIFthLCBiLCBjLCBhLCBjLCBkXS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHZlcnRpY2VzW3hdOyB9KTtcbn07XG4vKiogZ2VuZXJhdGVzIGEgY3ViZSBtb2RlbCAqL1xuZXhwb3J0cy5nZXRDdWJlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gW1xuICAgIGV4cG9ydHMucXVhZCgxLCAwLCAzLCAyKSxcbiAgICBleHBvcnRzLnF1YWQoMiwgMywgNywgNiksXG4gICAgZXhwb3J0cy5xdWFkKDMsIDAsIDQsIDcpLFxuICAgIGV4cG9ydHMucXVhZCg2LCA1LCAxLCAyKSxcbiAgICBleHBvcnRzLnF1YWQoNCwgNSwgNiwgNyksXG4gICAgZXhwb3J0cy5xdWFkKDUsIDQsIDAsIDEpIC8vIGxlZnRcbl07IH07XG4vKiogc3ViZGl2aWRlcyBhIHRldHJhaGVkcm9uIHRvd2FyZHMgYXBwcm94aW1hdGluZyBhIHNwaGVyZSAqL1xudmFyIGRpdmlkZVRyaWFuZ2xlID0gZnVuY3Rpb24gKGEsIGIsIGMsIGNvdW50KSB7XG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICB2YXIgYWIgPSBoZWxwZXJzXzEubWl4KGEsIGIsIDAuNSkubm9ybWFsaXplKCk7XG4gICAgICAgIHZhciBhYyA9IGhlbHBlcnNfMS5taXgoYSwgYywgMC41KS5ub3JtYWxpemUoKTtcbiAgICAgICAgdmFyIGJjID0gaGVscGVyc18xLm1peChiLCBjLCAwLjUpLm5vcm1hbGl6ZSgpO1xuICAgICAgICByZXR1cm4gaGVscGVyc18xLmZsYXR0ZW4oW1xuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYSwgYWIsIGFjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYmMsIGMsIGFjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYWIsIGIsIGJjLCBjb3VudCAtIDEpLFxuICAgICAgICAgICAgZGl2aWRlVHJpYW5nbGUoYWIsIGJjLCBhYywgY291bnQgLSAxKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBbW2EsIGIsIGNdXTtcbiAgICB9XG59O1xuLyoqIGNyZWF0ZXMgYSB0ZXRyYWhlZHJvbiAqL1xudmFyIHRldHJhaGVkcm9uID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIG4pIHtcbiAgICByZXR1cm4gaGVscGVyc18xLmZsYXR0ZW4oW1xuICAgICAgICBkaXZpZGVUcmlhbmdsZShhLCBiLCBjLCBuKSxcbiAgICAgICAgZGl2aWRlVHJpYW5nbGUoZCwgYywgYiwgbiksXG4gICAgICAgIGRpdmlkZVRyaWFuZ2xlKGEsIGQsIGIsIG4pLFxuICAgICAgICBkaXZpZGVUcmlhbmdsZShhLCBjLCBkLCBuKVxuICAgIF0pO1xufTtcbi8qKiByZXR1cm5zIHRoZSBmYWNlcyBvZiBhIHNwaGVyZSBhcHByb3hpbWF0aW9uICovXG5leHBvcnRzLmdldFNwaGVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdmEgPSBuZXcgdmVjM18xLmRlZmF1bHQoWzAuMCwgMC4wLCAtMS4wXSk7XG4gICAgdmFyIHZiID0gbmV3IHZlYzNfMS5kZWZhdWx0KFswLjAsIDAuOTQyODA5LCAwLjMzMzMzM10pO1xuICAgIHZhciB2YyA9IG5ldyB2ZWMzXzEuZGVmYXVsdChbLTAuODE2NDk3LCAtMC40NzE0MDUsIDAuMzMzMzMzXSk7XG4gICAgdmFyIHZkID0gbmV3IHZlYzNfMS5kZWZhdWx0KFswLjgxNjQ5NywgLTAuNDcxNDA1LCAwLjMzMzMzM10pO1xuICAgIHZhciB0ZXQgPSB0ZXRyYWhlZHJvbih2YywgdmIsIHZhLCB2ZCwgNCk7XG4gICAgcmV0dXJuIHRldC5tYXAoZnVuY3Rpb24gKHRyaSkge1xuICAgICAgICByZXR1cm4gdHJpLm1hcChmdW5jdGlvbiAodmVjKSB7IHJldHVybiBuZXcgdmVjM18xLmRlZmF1bHQoW3ZlYy54ICogMC41LCB2ZWMueSAqIDAuNSwgdmVjLnogKiAwLjVdKTsgfSk7XG4gICAgfSk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kZWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1hdDRfMSA9IHJlcXVpcmUoXCIuL2xpYi90c20vbWF0NFwiKTtcbnZhciB2ZWMzXzEgPSByZXF1aXJlKFwiLi9saWIvdHNtL3ZlYzNcIik7XG52YXIgbWFpbl8xID0gcmVxdWlyZShcIi4vbWFpblwiKTtcbnZhciBlbnZpcm9ubWVudF8xID0gcmVxdWlyZShcIi4vZW52aXJvbm1lbnRcIik7XG4vKipcbiAqIEBwYXJhbSBjYW52YXMgdGhlIGNhbnZhcyB0byBkcmF3IG9uXG4gKiBAcGFyYW0gZ2wgdGhlIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0IG9mIHRoZSBjYW52YXNcbiAqIEBwYXJhbSBwcm9ncmFtIHRoZSBXZWJHTCBwcm9ncmFtIHdlJ3JlIHVzaW5nXG4gKiBAcGFyYW0gcHJvZ3JhbSB0aGUgV2ViR0wgcHJvZ3JhbSBmb3IgZHJhd2luZyB0ZXh0dXJlZCBvYmplY3RzXG4gKiBAcGFyYW0gbW9iaWxlIHRoZSBsaXN0IG9mIHBvbHlnb25zLCByZXByZXNlbnRlZCBhcyBhcnJheXMgb2YgdmVjM3NcbiAqL1xuZXhwb3J0cy5yZW5kZXIgPSBmdW5jdGlvbiAoY2FudmFzLCBnbCwgcHJvZ3JhbSwgdGV4dHVyZVByb2dyYW0sIG1vYmlsZSkge1xuICAgIC8vIHNldCB2aWV3IHBvcnQgYW5kIGNsZWFyIGNhbnZhc1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgZ2wuY2xlYXJDb2xvcigwLjksIDAuOSwgMC45LCAxLjApO1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICAvLyBzZXQgcGVyc3BlY3RpdmUgdHJhbnNmb3JtXG4gICAgdmFyIGFzcGVjdFJhdGlvID0gMTtcbiAgICB2YXIgZm92WSA9IDQ1O1xuICAgIHZhciBwcm9qTWF0cml4ID0gbWF0NF8xLmRlZmF1bHQucGVyc3BlY3RpdmUoZm92WSwgYXNwZWN0UmF0aW8sIDAuMDEsIDEwMCk7XG4gICAgdmFyIHByb2pNYXRyaXhMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJwcm9qTWF0cml4XCIpO1xuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYocHJvak1hdHJpeExvYywgZmFsc2UsIEZsb2F0MzJBcnJheS5mcm9tKHByb2pNYXRyaXguYWxsKCkpKTtcbiAgICB2YXIgZXllVmVjID0gbmV3IHZlYzNfMS5kZWZhdWx0KFswLCAwLCAyXSk7XG4gICAgdmFyIGxvb2tWZWMgPSBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDAsIDBdKTtcbiAgICB2YXIgdXBWZWMgPSBuZXcgdmVjM18xLmRlZmF1bHQoWzAsIDEsIDBdKTtcbiAgICB2YXIgbW9kZWxWaWV3ID0gbWF0NF8xLmRlZmF1bHQubG9va0F0KGV5ZVZlYywgbG9va1ZlYywgdXBWZWMpO1xuICAgIC8vIHNjYWxlIGFuZCB0cmFuc2xhdGUgdG8gZml0IHRoZSBtb2JpbGVcbiAgICB2YXIgcyA9IDIgLyBNYXRoLm1heChtb2JpbGUuZ2V0VG90YWxXaWR0aCgpLCBtb2JpbGUuZ2V0VG90YWxIZWlnaHQoKSk7XG4gICAgbW9kZWxWaWV3XG4gICAgICAgIC5zY2FsZShuZXcgdmVjM18xLmRlZmF1bHQoW3MsIHMsIHNdKSlcbiAgICAgICAgLnRyYW5zbGF0ZShuZXcgdmVjM18xLmRlZmF1bHQoWzAsIG1vYmlsZS5nZXRUb3RhbEhlaWdodCgpIC8gMywgMF0pKTtcbiAgICAvLyBkcmF3IGVudmlyb25tZW50XG4gICAgdmFyIGVudmlyb25tZW50VmlldyA9IG1vZGVsVmlld1xuICAgICAgICAuY29weSgpXG4gICAgICAgIC50cmFuc2xhdGUobmV3IHZlYzNfMS5kZWZhdWx0KFswLCAwLCAtbW9iaWxlLmdldFRvdGFsV2lkdGgoKSAqIDJdKSlcbiAgICAgICAgLnNjYWxlKG5ldyB2ZWMzXzEuZGVmYXVsdChbNiAvIHMsIDYgLyBzLCA2IC8gc10pKVxuICAgICAgICAucm90YXRlKC1NYXRoLlBJIC8gNCwgbmV3IHZlYzNfMS5kZWZhdWx0KFswLCAxLCAwXSkpO1xuICAgIGlmIChlbnZpcm9ubWVudFZpZXcgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkbid0IHJvdGF0ZSBlbnZpcm9ubWVudCB2aWV3XCIpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidlRleENvb3JkXCIpKTtcbiAgICBlbnZpcm9ubWVudF8xLmRyYXdFbnZpcm9ubWVudChnbCwgdGV4dHVyZVByb2dyYW0sIGVudmlyb25tZW50Vmlldyk7XG4gICAgLy8gZGlzYWJsZSB0ZXh0dXJlIG1vZGVcbiAgICBnbC51bmlmb3JtMWYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidlRleHR1cmVTZWxlY3RvclwiKSwgLTEuMCk7XG4gICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwidlRleENvb3JkXCIpKTtcbiAgICAvLyBkcmF3IG1vYmlsZVxuICAgIG1vYmlsZS5kcmF3KGdsLCBwcm9ncmFtLCBtb2RlbFZpZXcpO1xuICAgIG1haW5fMS5HTE9CQUxTLmNhbGxiYWNrSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBvcnRzLnJlbmRlcihjYW52YXMsIGdsLCBwcm9ncmFtLCB0ZXh0dXJlUHJvZ3JhbSwgbW9iaWxlKTtcbiAgICB9KTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZW5kZXIuanMubWFwIl19

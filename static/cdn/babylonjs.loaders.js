

(function universalModuleDefinition(root, factory) {
    var amdDependencies = [];
    var BABYLON = root.BABYLON || this.BABYLON;
    if(typeof exports === 'object' && typeof module === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        module.exports = factory(BABYLON);
    } else if(typeof define === 'function' && define.amd) {
         amdDependencies.push("babylonjs");

        define("babylonjs-loaders", amdDependencies, factory);
    } else if(typeof exports === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        exports["babylonjs-loaders"] = factory(BABYLON);
    } else {
        root["BABYLON"] = factory(BABYLON);
    }
})(this, function(BABYLON) {
  BABYLON = BABYLON || this.BABYLON;

var __decorate=this&&this.__decorate||function(e,t,r,c){var o,f=arguments.length,n=f<3?t:null===c?c=Object.getOwnPropertyDescriptor(t,r):c;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,c);else for(var l=e.length-1;l>=0;l--)(o=e[l])&&(n=(f<3?o(n):f>3?o(t,r,n):o(t,r))||n);return f>3&&n&&Object.defineProperty(t,r,n),n};
var __extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var n in o)o.hasOwnProperty(n)&&(t[n]=o[n])};return function(o,n){function r(){this.constructor=o}t(o,n),o.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();

var BABYLON;
(function (BABYLON) {
    var STLFileLoader = /** @class */ (function () {
        function STLFileLoader() {
            this.solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
            this.facetsPattern = /facet([\s\S]*?)endfacet/g;
            this.normalPattern = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
            this.vertexPattern = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
            this.name = "stl";
            // force data to come in as an ArrayBuffer
            // we'll convert to string if it looks like it's an ASCII .stl
            this.extensions = {
                ".stl": { isBinary: true },
            };
        }
        STLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
            var matches;
            if (typeof data !== "string") {
                if (this.isBinary(data)) {
                    // binary .stl
                    var babylonMesh = new BABYLON.Mesh("stlmesh", scene);
                    this.parseBinary(babylonMesh, data);
                    if (meshes) {
                        meshes.push(babylonMesh);
                    }
                    return true;
                }
                // ASCII .stl
                // convert to string
                var array_buffer = new Uint8Array(data);
                var str = '';
                for (var i = 0; i < data.byteLength; i++) {
                    str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
                }
                data = str;
            }
            //if arrived here, data is a string, containing the STLA data.
            while (matches = this.solidPattern.exec(data)) {
                var meshName = matches[1];
                var meshNameFromEnd = matches[3];
                if (meshName != meshNameFromEnd) {
                    BABYLON.Tools.Error("Error in STL, solid name != endsolid name");
                    return false;
                }
                // check meshesNames
                if (meshesNames && meshName) {
                    if (meshesNames instanceof Array) {
                        if (!meshesNames.indexOf(meshName)) {
                            continue;
                        }
                    }
                    else {
                        if (meshName !== meshesNames) {
                            continue;
                        }
                    }
                }
                // stl mesh name can be empty as well
                meshName = meshName || "stlmesh";
                var babylonMesh = new BABYLON.Mesh(meshName, scene);
                this.parseASCII(babylonMesh, matches[2]);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
            }
            return true;
        };
        STLFileLoader.prototype.load = function (scene, data, rootUrl) {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);
            if (result) {
                scene.createDefaultCameraOrLight();
            }
            return result;
        };
        STLFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
            var container = new BABYLON.AssetContainer(scene);
            this.importMesh(null, scene, data, rootUrl, container.meshes, null, null);
            container.removeAllFromScene();
            return container;
        };
        STLFileLoader.prototype.isBinary = function (data) {
            // check if file size is correct for binary stl
            var faceSize, nFaces, reader;
            reader = new DataView(data);
            faceSize = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
            nFaces = reader.getUint32(80, true);
            if (80 + (32 / 8) + (nFaces * faceSize) === reader.byteLength) {
                return true;
            }
            // check characters higher than ASCII to confirm binary
            var fileLength = reader.byteLength;
            for (var index = 0; index < fileLength; index++) {
                if (reader.getUint8(index) > 127) {
                    return true;
                }
            }
            return false;
        };
        STLFileLoader.prototype.parseBinary = function (mesh, data) {
            var reader = new DataView(data);
            var faces = reader.getUint32(80, true);
            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;
            var offset = 0;
            var positions = new Float32Array(faces * 3 * 3);
            var normals = new Float32Array(faces * 3 * 3);
            var indices = new Uint32Array(faces * 3);
            var indicesCount = 0;
            for (var face = 0; face < faces; face++) {
                var start = dataOffset + face * faceLength;
                var normalX = reader.getFloat32(start, true);
                var normalY = reader.getFloat32(start + 4, true);
                var normalZ = reader.getFloat32(start + 8, true);
                for (var i = 1; i <= 3; i++) {
                    var vertexstart = start + i * 12;
                    // ordering is intentional to match ascii import
                    positions[offset] = reader.getFloat32(vertexstart, true);
                    positions[offset + 2] = reader.getFloat32(vertexstart + 4, true);
                    positions[offset + 1] = reader.getFloat32(vertexstart + 8, true);
                    normals[offset] = normalX;
                    normals[offset + 2] = normalY;
                    normals[offset + 1] = normalZ;
                    offset += 3;
                }
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
            }
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        };
        STLFileLoader.prototype.parseASCII = function (mesh, solidData) {
            var positions = [];
            var normals = [];
            var indices = [];
            var indicesCount = 0;
            //load facets, ignoring loop as the standard doesn't define it can contain more than vertices
            var matches;
            while (matches = this.facetsPattern.exec(solidData)) {
                var facet = matches[1];
                //one normal per face
                var normalMatches = this.normalPattern.exec(facet);
                this.normalPattern.lastIndex = 0;
                if (!normalMatches) {
                    continue;
                }
                var normal = [Number(normalMatches[1]), Number(normalMatches[5]), Number(normalMatches[3])];
                var vertexMatch;
                while (vertexMatch = this.vertexPattern.exec(facet)) {
                    positions.push(Number(vertexMatch[1]), Number(vertexMatch[5]), Number(vertexMatch[3]));
                    normals.push(normal[0], normal[1], normal[2]);
                }
                indices.push(indicesCount++, indicesCount++, indicesCount++);
                this.vertexPattern.lastIndex = 0;
            }
            this.facetsPattern.lastIndex = 0;
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        };
        return STLFileLoader;
    }());
    BABYLON.STLFileLoader = STLFileLoader;
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new STLFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.stlFileLoader.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * Class reading and parsing the MTL file bundled with the obj file.
     */
    var MTLFileLoader = /** @class */ (function () {
        function MTLFileLoader() {
            // All material loaded from the mtl will be set here
            this.materials = [];
        }
        /**
         * This function will read the mtl file and create each material described inside
         * This function could be improve by adding :
         * -some component missing (Ni, Tf...)
         * -including the specific options available
         *
         * @param scene
         * @param data
         * @param rootUrl
         */
        MTLFileLoader.prototype.parseMTL = function (scene, data, rootUrl) {
            if (data instanceof ArrayBuffer) {
                return;
            }
            //Split the lines from the file
            var lines = data.split('\n');
            //Space char
            var delimiter_pattern = /\s+/;
            //Array with RGB colors
            var color;
            //New material
            var material = null;
            //Look at each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                // Blank line or comment
                if (line.length === 0 || line.charAt(0) === '#') {
                    continue;
                }
                //Get the first parameter (keyword)
                var pos = line.indexOf(' ');
                var key = (pos >= 0) ? line.substring(0, pos) : line;
                key = key.toLowerCase();
                //Get the data following the key
                var value = (pos >= 0) ? line.substring(pos + 1).trim() : "";
                //This mtl keyword will create the new material
                if (key === "newmtl") {
                    //Check if it is the first material.
                    // Materials specifications are described after this keyword.
                    if (material) {
                        //Add the previous material in the material array.
                        this.materials.push(material);
                    }
                    //Create a new material.
                    // value is the name of the material read in the mtl file
                    material = new BABYLON.StandardMaterial(value, scene);
                }
                else if (key === "kd" && material) {
                    // Diffuse color (color under white light) using RGB values
                    //value  = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set tghe color into the material
                    material.diffuseColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ka" && material) {
                    // Ambient color (color under shadow) using RGB values
                    //value = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set tghe color into the material
                    material.ambientColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ks" && material) {
                    // Specular color (color when light is reflected from shiny surface) using RGB values
                    //value = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set the color into the material
                    material.specularColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ke" && material) {
                    // Emissive color using RGB values
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    material.emissiveColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ns" && material) {
                    //value = "Integer"
                    material.specularPower = parseFloat(value);
                }
                else if (key === "d" && material) {
                    //d is dissolve for current material. It mean alpha for BABYLON
                    material.alpha = parseFloat(value);
                    //Texture
                    //This part can be improved by adding the possible options of texture
                }
                else if (key === "map_ka" && material) {
                    // ambient texture map with a loaded image
                    //We must first get the folder of the image
                    material.ambientTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_kd" && material) {
                    // Diffuse texture map with a loaded image
                    material.diffuseTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_ks" && material) {
                    // Specular texture map with a loaded image
                    //We must first get the folder of the image
                    material.specularTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_ns") {
                    //Specular
                    //Specular highlight component
                    //We must first get the folder of the image
                    //
                    //Not supported by BABYLON
                    //
                    //    continue;
                }
                else if (key === "map_bump" && material) {
                    //The bump texture
                    material.bumpTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_d" && material) {
                    // The dissolve of the material
                    material.opacityTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                    //Options for illumination
                }
                else if (key === "illum") {
                    //Illumination
                    if (value === "0") {
                        //That mean Kd == Kd
                    }
                    else if (value === "1") {
                        //Color on and Ambient on
                    }
                    else if (value === "2") {
                        //Highlight on
                    }
                    else if (value === "3") {
                        //Reflection on and Ray trace on
                    }
                    else if (value === "4") {
                        //Transparency: Glass on, Reflection: Ray trace on
                    }
                    else if (value === "5") {
                        //Reflection: Fresnel on and Ray trace on
                    }
                    else if (value === "6") {
                        //Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
                    }
                    else if (value === "7") {
                        //Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
                    }
                    else if (value === "8") {
                        //Reflection on and Ray trace off
                    }
                    else if (value === "9") {
                        //Transparency: Glass on, Reflection: Ray trace off
                    }
                    else if (value === "10") {
                        //Casts shadows onto invisible surfaces
                    }
                }
                else {
                    // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
                }
            }
            //At the end of the file, add the last material
            if (material) {
                this.materials.push(material);
            }
        };
        /**
         * Gets the texture for the material.
         *
         * If the material is imported from input file,
         * We sanitize the url to ensure it takes the textre from aside the material.
         *
         * @param rootUrl The root url to load from
         * @param value The value stored in the mtl
         * @return The Texture
         */
        MTLFileLoader._getTexture = function (rootUrl, value, scene) {
            if (!value) {
                return null;
            }
            var url = rootUrl;
            // Load from input file.
            if (rootUrl === "file:") {
                var lastDelimiter = value.lastIndexOf("\\");
                if (lastDelimiter === -1) {
                    lastDelimiter = value.lastIndexOf("/");
                }
                if (lastDelimiter > -1) {
                    url += value.substr(lastDelimiter + 1);
                }
                else {
                    url += value;
                }
            }
            // Not from input file.
            else {
                url += value;
            }
            return new BABYLON.Texture(url, scene);
        };
        return MTLFileLoader;
    }());
    BABYLON.MTLFileLoader = MTLFileLoader;
    var OBJFileLoader = /** @class */ (function () {
        function OBJFileLoader() {
            this.name = "obj";
            this.extensions = ".obj";
            this.obj = /^o/;
            this.group = /^g/;
            this.mtllib = /^mtllib /;
            this.usemtl = /^usemtl /;
            this.smooth = /^s /;
            this.vertexPattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // vn float float float
            this.normalPattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // vt float float
            this.uvPattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // f vertex vertex vertex ...
            this.facePattern1 = /f\s+(([\d]{1,}[\s]?){3,})+/;
            // f vertex/uvs vertex/uvs vertex/uvs ...
            this.facePattern2 = /f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
            // f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal ...
            this.facePattern3 = /f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
            // f vertex//normal vertex//normal vertex//normal ...
            this.facePattern4 = /f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
            // f -vertex/-uvs/-normal -vertex/-uvs/-normal -vertex/-uvs/-normal ...
            this.facePattern5 = /f\s+(((-[\d]{1,}\/-[\d]{1,}\/-[\d]{1,}[\s]?){3,})+)/;
        }
        /**
         * Calls synchronously the MTL file attached to this obj.
         * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
         * Without this function materials are not displayed in the first frame (but displayed after).
         * In consequence it is impossible to get material information in your HTML file
         *
         * @param url The URL of the MTL file
         * @param rootUrl
         * @param onSuccess Callback function to be called when the MTL file is loaded
         * @private
         */
        OBJFileLoader.prototype._loadMTL = function (url, rootUrl, onSuccess) {
            //The complete path to the mtl file
            var pathOfFile = BABYLON.Tools.BaseUrl + rootUrl + url;
            // Loads through the babylon tools to allow fileInput search.
            BABYLON.Tools.LoadFile(pathOfFile, onSuccess, undefined, undefined, false, function () { console.warn("Error - Unable to load " + pathOfFile); });
        };
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @param fileName Defines the name of the file to load
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        OBJFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress, fileName) {
            //get the meshes from OBJ file
            return this._parseSolid(meshesNames, scene, data, rootUrl).then(function (meshes) {
                return {
                    meshes: meshes,
                    particleSystems: [],
                    skeletons: [],
                    animationGroups: []
                };
            });
        };
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @param fileName Defines the name of the file to load
         * @returns a promise which completes when objects have been loaded to the scene
         */
        OBJFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
            //Get the 3D model
            return this.importMeshAsync(null, scene, data, rootUrl, onProgress).then(function () {
                // return void
            });
        };
        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @param fileName Defines the name of the file to load
         * @returns The loaded asset container
         */
        OBJFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress, fileName) {
            return this.importMeshAsync(null, scene, data, rootUrl).then(function (result) {
                var container = new BABYLON.AssetContainer(scene);
                result.meshes.forEach(function (mesh) { return container.meshes.push(mesh); });
                container.removeAllFromScene();
                return container;
            });
        };
        /**
         * Read the OBJ file and create an Array of meshes.
         * Each mesh contains all information given by the OBJ and the MTL file.
         * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
         *
         * @param meshesNames
         * @param scene BABYLON.Scene The scene where are displayed the data
         * @param data String The content of the obj file
         * @param rootUrl String The path to the folder
         * @returns Array<AbstractMesh>
         * @private
         */
        OBJFileLoader.prototype._parseSolid = function (meshesNames, scene, data, rootUrl) {
            var _this = this;
            var positions = []; //values for the positions of vertices
            var normals = []; //Values for the normals
            var uvs = []; //Values for the textures
            var meshesFromObj = []; //[mesh] Contains all the obj meshes
            var handledMesh; //The current mesh of meshes array
            var indicesForBabylon = []; //The list of indices for VertexData
            var wrappedPositionForBabylon = []; //The list of position in vectors
            var wrappedUvsForBabylon = []; //Array with all value of uvs to match with the indices
            var wrappedNormalsForBabylon = []; //Array with all value of normals to match with the indices
            var tuplePosNorm = []; //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
            var curPositionInIndices = 0;
            var hasMeshes = false; //Meshes are defined in the file
            var unwrappedPositionsForBabylon = []; //Value of positionForBabylon w/o Vector3() [x,y,z]
            var unwrappedNormalsForBabylon = []; //Value of normalsForBabylon w/o Vector3()  [x,y,z]
            var unwrappedUVForBabylon = []; //Value of uvsForBabylon w/o Vector3()      [x,y,z]
            var triangles = []; //Indices from new triangles coming from polygons
            var materialNameFromObj = ""; //The name of the current material
            var fileToLoad = ""; //The name of the mtlFile to load
            var materialsFromMTLFile = new MTLFileLoader();
            var objMeshName = ""; //The name of the current obj mesh
            var increment = 1; //Id for meshes created by the multimaterial
            var isFirstMaterial = true;
            /**
             * Search for obj in the given array.
             * This function is called to check if a couple of data already exists in an array.
             *
             * If found, returns the index of the founded tuple index. Returns -1 if not found
             * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
             * @param obj Array<number>
             * @returns {boolean}
             */
            var isInArray = function (arr, obj) {
                if (!arr[obj[0]]) {
                    arr[obj[0]] = { normals: [], idx: [] };
                }
                var idx = arr[obj[0]].normals.indexOf(obj[1]);
                return idx === -1 ? -1 : arr[obj[0]].idx[idx];
            };
            var isInArrayUV = function (arr, obj) {
                if (!arr[obj[0]]) {
                    arr[obj[0]] = { normals: [], idx: [], uv: [] };
                }
                var idx = arr[obj[0]].normals.indexOf(obj[1]);
                if (idx != 1 && (obj[2] == arr[obj[0]].uv[idx])) {
                    return arr[obj[0]].idx[idx];
                }
                return -1;
            };
            /**
             * This function set the data for each triangle.
             * Data are position, normals and uvs
             * If a tuple of (position, normal) is not set, add the data into the corresponding array
             * If the tuple already exist, add only their indice
             *
             * @param indicePositionFromObj Integer The index in positions array
             * @param indiceUvsFromObj Integer The index in uvs array
             * @param indiceNormalFromObj Integer The index in normals array
             * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
             * @param textureVectorFromOBJ Vector3 The value of uvs
             * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
             */
            var setData = function (indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positionVectorFromOBJ, textureVectorFromOBJ, normalsVectorFromOBJ) {
                //Check if this tuple already exists in the list of tuples
                var _index;
                if (OBJFileLoader.OPTIMIZE_WITH_UV) {
                    _index = isInArrayUV(tuplePosNorm, [
                        indicePositionFromObj,
                        indiceNormalFromObj,
                        indiceUvsFromObj
                    ]);
                }
                else {
                    _index = isInArray(tuplePosNorm, [
                        indicePositionFromObj,
                        indiceNormalFromObj
                    ]);
                }
                //If it not exists
                if (_index == -1) {
                    //Add an new indice.
                    //The array of indices is only an array with his length equal to the number of triangles - 1.
                    //We add vertices data in this order
                    indicesForBabylon.push(wrappedPositionForBabylon.length);
                    //Push the position of vertice for Babylon
                    //Each element is a BABYLON.Vector3(x,y,z)
                    wrappedPositionForBabylon.push(positionVectorFromOBJ);
                    //Push the uvs for Babylon
                    //Each element is a BABYLON.Vector3(u,v)
                    wrappedUvsForBabylon.push(textureVectorFromOBJ);
                    //Push the normals for Babylon
                    //Each element is a BABYLON.Vector3(x,y,z)
                    wrappedNormalsForBabylon.push(normalsVectorFromOBJ);
                    //Add the tuple in the comparison list
                    tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
                    tuplePosNorm[indicePositionFromObj].idx.push(curPositionInIndices++);
                    if (OBJFileLoader.OPTIMIZE_WITH_UV) {
                        tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj);
                    }
                }
                else {
                    //The tuple already exists
                    //Add the index of the already existing tuple
                    //At this index we can get the value of position, normal and uvs of vertex
                    indicesForBabylon.push(_index);
                }
            };
            /**
             * Transform BABYLON.Vector() object onto 3 digits in an array
             */
            var unwrapData = function () {
                //Every array has the same length
                for (var l = 0; l < wrappedPositionForBabylon.length; l++) {
                    //Push the x, y, z values of each element in the unwrapped array
                    unwrappedPositionsForBabylon.push(wrappedPositionForBabylon[l].x, wrappedPositionForBabylon[l].y, wrappedPositionForBabylon[l].z);
                    unwrappedNormalsForBabylon.push(wrappedNormalsForBabylon[l].x, wrappedNormalsForBabylon[l].y, wrappedNormalsForBabylon[l].z);
                    unwrappedUVForBabylon.push(wrappedUvsForBabylon[l].x, wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
                }
                // Reset arrays for the next new meshes
                wrappedPositionForBabylon = [];
                wrappedNormalsForBabylon = [];
                wrappedUvsForBabylon = [];
                tuplePosNorm = [];
                curPositionInIndices = 0;
            };
            /**
             * Create triangles from polygons by recursion
             * The best to understand how it works is to draw it in the same time you get the recursion.
             * It is important to notice that a triangle is a polygon
             * We get 5 patterns of face defined in OBJ File :
             * facePattern1 = ["1","2","3","4","5","6"]
             * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
             * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
             * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
             * facePattern5 = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-4/-4/-4","-5/-5/-5","-6/-6/-6"]
             * Each pattern is divided by the same method
             * @param face Array[String] The indices of elements
             * @param v Integer The variable to increment
             */
            var getTriangles = function (face, v) {
                //Work for each element of the array
                if (v + 1 < face.length) {
                    //Add on the triangle variable the indexes to obtain triangles
                    triangles.push(face[0], face[v], face[v + 1]);
                    //Incrementation for recursion
                    v += 1;
                    //Recursion
                    getTriangles(face, v);
                }
                //Result obtained after 2 iterations:
                //Pattern1 => triangle = ["1","2","3","1","3","4"];
                //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
                //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
                //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
                //Pattern5 => triangle = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-1/-1/-1","-3/-3/-3","-4/-4/-4"];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 1
             * In this pattern we get vertice positions
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern1 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                //For each element in the triangles array.
                //This var could contains 1 to an infinity of triangles
                for (var k = 0; k < triangles.length; k++) {
                    // Set position indice
                    var indicePositionFromObj = parseInt(triangles[k]) - 1;
                    setData(indicePositionFromObj, 0, 0, //In the pattern 1, normals and uvs are not defined
                    positions[indicePositionFromObj], //Get the vectors data
                    BABYLON.Vector2.Zero(), BABYLON.Vector3.Up() //Create default vectors
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 2
             * In this pattern we get vertice positions and uvsu
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern2 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1/1"
                    //Split the data for getting position and uv
                    var point = triangles[k].split("/"); // ["1", "1"]
                    //Set position indice
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    //Set uv indice
                    var indiceUvsFromObj = parseInt(point[1]) - 1;
                    setData(indicePositionFromObj, indiceUvsFromObj, 0, //Default value for normals
                    positions[indicePositionFromObj], //Get the values for each element
                    uvs[indiceUvsFromObj], BABYLON.Vector3.Up() //Default value for normals
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 3
             * In this pattern we get vertice positions, uvs and normals
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern3 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1/1/1"
                    //Split the data for getting position, uv, and normals
                    var point = triangles[k].split("/"); // ["1", "1", "1"]
                    // Set position indice
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    // Set uv indice
                    var indiceUvsFromObj = parseInt(point[1]) - 1;
                    // Set normal indice
                    var indiceNormalFromObj = parseInt(point[2]) - 1;
                    setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj] //Set the vector for each component
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 4
             * In this pattern we get vertice positions and normals
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern4 = function (face, v) {
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1//1"
                    //Split the data for getting position and normals
                    var point = triangles[k].split("//"); // ["1", "1"]
                    // We check indices, and normals
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    var indiceNormalFromObj = parseInt(point[1]) - 1;
                    setData(indicePositionFromObj, 1, //Default value for uv
                    indiceNormalFromObj, positions[indicePositionFromObj], //Get each vector of data
                    BABYLON.Vector2.Zero(), normals[indiceNormalFromObj]);
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 3
             * In this pattern we get vertice positions, uvs and normals
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern5 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "-1/-1/-1"
                    //Split the data for getting position, uv, and normals
                    var point = triangles[k].split("/"); // ["-1", "-1", "-1"]
                    // Set position indice
                    var indicePositionFromObj = positions.length + parseInt(point[0]);
                    // Set uv indice
                    var indiceUvsFromObj = uvs.length + parseInt(point[1]);
                    // Set normal indice
                    var indiceNormalFromObj = normals.length + parseInt(point[2]);
                    setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj] //Set the vector for each component
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            var addPreviousObjMesh = function () {
                //Check if it is not the first mesh. Otherwise we don't have data.
                if (meshesFromObj.length > 0) {
                    //Get the previous mesh for applying the data about the faces
                    //=> in obj file, faces definition append after the name of the mesh
                    handledMesh = meshesFromObj[meshesFromObj.length - 1];
                    //Set the data into Array for the mesh
                    unwrapData();
                    // Reverse tab. Otherwise face are displayed in the wrong sens
                    indicesForBabylon.reverse();
                    //Set the information for the mesh
                    //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
                    handledMesh.indices = indicesForBabylon.slice();
                    handledMesh.positions = unwrappedPositionsForBabylon.slice();
                    handledMesh.normals = unwrappedNormalsForBabylon.slice();
                    handledMesh.uvs = unwrappedUVForBabylon.slice();
                    //Reset the array for the next mesh
                    indicesForBabylon = [];
                    unwrappedPositionsForBabylon = [];
                    unwrappedNormalsForBabylon = [];
                    unwrappedUVForBabylon = [];
                }
            };
            //Main function
            //Split the file into lines
            var lines = data.split('\n');
            //Look at each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                var result;
                //Comment or newLine
                if (line.length === 0 || line.charAt(0) === '#') {
                    continue;
                    //Get information about one position possible for the vertices
                }
                else if ((result = this.vertexPattern.exec(line)) !== null) {
                    //Create a Vector3 with the position x, y, z
                    //Value of result:
                    // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    //Add the Vector in the list of positions
                    positions.push(new BABYLON.Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                }
                else if ((result = this.normalPattern.exec(line)) !== null) {
                    //Create a Vector3 with the normals x, y, z
                    //Value of result
                    // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    //Add the Vector in the list of normals
                    normals.push(new BABYLON.Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                }
                else if ((result = this.uvPattern.exec(line)) !== null) {
                    //Create a Vector2 with the normals u, v
                    //Value of result
                    // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
                    //Add the Vector in the list of uvs
                    uvs.push(new BABYLON.Vector2(parseFloat(result[1]), parseFloat(result[2])));
                    //Identify patterns of faces
                    //Face could be defined in different type of pattern
                }
                else if ((result = this.facePattern3.exec(line)) !== null) {
                    //Value of result:
                    //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), // ["1/1/1", "2/2/2", "3/3/3"]
                    1);
                }
                else if ((result = this.facePattern4.exec(line)) !== null) {
                    //Value of result:
                    //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern4(result[1].trim().split(" "), // ["1//1", "2//2", "3//3"]
                    1);
                }
                else if ((result = this.facePattern5.exec(line)) !== null) {
                    //Value of result:
                    //["f -1/-1/-1 -2/-2/-2 -3/-3/-3", "-1/-1/-1 -2/-2/-2 -3/-3/-3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern5(result[1].trim().split(" "), // ["-1/-1/-1", "-2/-2/-2", "-3/-3/-3"]
                    1);
                }
                else if ((result = this.facePattern2.exec(line)) !== null) {
                    //Value of result:
                    //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), // ["1/1", "2/2", "3/3"]
                    1);
                }
                else if ((result = this.facePattern1.exec(line)) !== null) {
                    //Value of result
                    //["f 1 2 3", "1 2 3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), // ["1", "2", "3"]
                    1);
                    //Define a mesh or an object
                    //Each time this keyword is analysed, create a new Object with all data for creating a babylonMesh
                }
                else if (this.group.test(line) || this.obj.test(line)) {
                    //Create a new mesh corresponding to the name of the group.
                    //Definition of the mesh
                    var objMesh = 
                    //Set the name of the current obj mesh
                    {
                        name: line.substring(2).trim(),
                        indices: undefined,
                        positions: undefined,
                        normals: undefined,
                        uvs: undefined,
                        materialName: ""
                    };
                    addPreviousObjMesh();
                    //Push the last mesh created with only the name
                    meshesFromObj.push(objMesh);
                    //Set this variable to indicate that now meshesFromObj has objects defined inside
                    hasMeshes = true;
                    isFirstMaterial = true;
                    increment = 1;
                    //Keyword for applying a material
                }
                else if (this.usemtl.test(line)) {
                    //Get the name of the material
                    materialNameFromObj = line.substring(7).trim();
                    //If this new material is in the same mesh
                    if (!isFirstMaterial) {
                        //Set the data for the previous mesh
                        addPreviousObjMesh();
                        //Create a new mesh
                        var objMesh = 
                        //Set the name of the current obj mesh
                        {
                            name: objMeshName + "_mm" + increment.toString(),
                            indices: undefined,
                            positions: undefined,
                            normals: undefined,
                            uvs: undefined,
                            materialName: materialNameFromObj
                        };
                        increment++;
                        //If meshes are already defined
                        meshesFromObj.push(objMesh);
                    }
                    //Set the material name if the previous line define a mesh
                    if (hasMeshes && isFirstMaterial) {
                        //Set the material name to the previous mesh (1 material per mesh)
                        meshesFromObj[meshesFromObj.length - 1].materialName = materialNameFromObj;
                        isFirstMaterial = false;
                    }
                    //Keyword for loading the mtl file
                }
                else if (this.mtllib.test(line)) {
                    //Get the name of mtl file
                    fileToLoad = line.substring(7).trim();
                    //Apply smoothing
                }
                else if (this.smooth.test(line)) {
                    // smooth shading => apply smoothing
                    //Toda  y I don't know it work with babylon and with obj.
                    //With the obj file  an integer is set
                }
                else {
                    //If there is another possibility
                    console.log("Unhandled expression at line : " + line);
                }
            }
            //At the end of the file, add the last mesh into the meshesFromObj array
            if (hasMeshes) {
                //Set the data for the last mesh
                handledMesh = meshesFromObj[meshesFromObj.length - 1];
                //Reverse indices for displaying faces in the good sens
                indicesForBabylon.reverse();
                //Get the good array
                unwrapData();
                //Set array
                handledMesh.indices = indicesForBabylon;
                handledMesh.positions = unwrappedPositionsForBabylon;
                handledMesh.normals = unwrappedNormalsForBabylon;
                handledMesh.uvs = unwrappedUVForBabylon;
            }
            //If any o or g keyword found, create a mesj with a random id
            if (!hasMeshes) {
                // reverse tab of indices
                indicesForBabylon.reverse();
                //Get positions normals uvs
                unwrapData();
                //Set data for one mesh
                meshesFromObj.push({
                    name: BABYLON.Geometry.RandomId(),
                    indices: indicesForBabylon,
                    positions: unwrappedPositionsForBabylon,
                    normals: unwrappedNormalsForBabylon,
                    uvs: unwrappedUVForBabylon,
                    materialName: materialNameFromObj
                });
            }
            //Create a BABYLON.Mesh list
            var babylonMeshesArray = []; //The mesh for babylon
            var materialToUse = new Array();
            //Set data for each mesh
            for (var j = 0; j < meshesFromObj.length; j++) {
                //check meshesNames (stlFileLoader)
                if (meshesNames && meshesFromObj[j].name) {
                    if (meshesNames instanceof Array) {
                        if (meshesNames.indexOf(meshesFromObj[j].name) == -1) {
                            continue;
                        }
                    }
                    else {
                        if (meshesFromObj[j].name !== meshesNames) {
                            continue;
                        }
                    }
                }
                //Get the current mesh
                //Set the data with VertexBuffer for each mesh
                handledMesh = meshesFromObj[j];
                //Create a BABYLON.Mesh with the name of the obj mesh
                var babylonMesh = new BABYLON.Mesh(meshesFromObj[j].name, scene);
                //Push the name of the material to an array
                //This is indispensable for the importMesh function
                materialToUse.push(meshesFromObj[j].materialName);
                var vertexData = new BABYLON.VertexData(); //The container for the values
                //Set the data for the babylonMesh
                vertexData.positions = handledMesh.positions;
                vertexData.normals = handledMesh.normals;
                vertexData.uvs = handledMesh.uvs;
                vertexData.indices = handledMesh.indices;
                //Set the data from the VertexBuffer to the current BABYLON.Mesh
                vertexData.applyToMesh(babylonMesh);
                if (OBJFileLoader.INVERT_Y) {
                    babylonMesh.scaling.y *= -1;
                }
                //Push the mesh into an array
                babylonMeshesArray.push(babylonMesh);
            }
            var mtlPromises = [];
            //load the materials
            //Check if we have a file to load
            if (fileToLoad !== "") {
                //Load the file synchronously
                mtlPromises.push(new Promise(function (resolve, reject) {
                    _this._loadMTL(fileToLoad, rootUrl, function (dataLoaded) {
                        try {
                            //Create materials thanks MTLLoader function
                            materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl);
                            //Look at each material loaded in the mtl file
                            for (var n = 0; n < materialsFromMTLFile.materials.length; n++) {
                                //Three variables to get all meshes with the same material
                                var startIndex = 0;
                                var _indices = [];
                                var _index;
                                //The material from MTL file is used in the meshes loaded
                                //Push the indice in an array
                                //Check if the material is not used for another mesh
                                while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                                    _indices.push(_index);
                                    startIndex = _index + 1;
                                }
                                //If the material is not used dispose it
                                if (_index == -1 && _indices.length == 0) {
                                    //If the material is not needed, remove it
                                    materialsFromMTLFile.materials[n].dispose();
                                }
                                else {
                                    for (var o = 0; o < _indices.length; o++) {
                                        //Apply the material to the BABYLON.Mesh for each mesh with the material
                                        babylonMeshesArray[_indices[o]].material = materialsFromMTLFile.materials[n];
                                    }
                                }
                            }
                            resolve();
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                }));
            }
            //Return an array with all BABYLON.Mesh
            return Promise.all(mtlPromises).then(function () {
                return babylonMeshesArray;
            });
        };
        OBJFileLoader.OPTIMIZE_WITH_UV = false;
        OBJFileLoader.INVERT_Y = false;
        return OBJFileLoader;
    }());
    BABYLON.OBJFileLoader = OBJFileLoader;
    if (BABYLON.SceneLoader) {
        //Add this loader into the register plugin
        BABYLON.SceneLoader.RegisterPlugin(new OBJFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.objFileLoader.js.map



var BABYLON;
(function (BABYLON) {
    /**
     * Mode that determines the coordinate system to use.
     */
    var GLTFLoaderCoordinateSystemMode;
    (function (GLTFLoaderCoordinateSystemMode) {
        /**
         * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
        /**
         * Sets the useRightHandedSystem flag on the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 1] = "FORCE_RIGHT_HANDED";
    })(GLTFLoaderCoordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode || (BABYLON.GLTFLoaderCoordinateSystemMode = {}));
    /**
     * Mode that determines what animations will start.
     */
    var GLTFLoaderAnimationStartMode;
    (function (GLTFLoaderAnimationStartMode) {
        /**
         * No animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["NONE"] = 0] = "NONE";
        /**
         * The first animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["FIRST"] = 1] = "FIRST";
        /**
         * All animations will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["ALL"] = 2] = "ALL";
    })(GLTFLoaderAnimationStartMode = BABYLON.GLTFLoaderAnimationStartMode || (BABYLON.GLTFLoaderAnimationStartMode = {}));
    /**
     * Loader state.
     */
    var GLTFLoaderState;
    (function (GLTFLoaderState) {
        /**
         * The asset is loading.
         */
        GLTFLoaderState[GLTFLoaderState["LOADING"] = 0] = "LOADING";
        /**
         * The asset is ready for rendering.
         */
        GLTFLoaderState[GLTFLoaderState["READY"] = 1] = "READY";
        /**
         * The asset is completely loaded.
         */
        GLTFLoaderState[GLTFLoaderState["COMPLETE"] = 2] = "COMPLETE";
    })(GLTFLoaderState = BABYLON.GLTFLoaderState || (BABYLON.GLTFLoaderState = {}));
    /**
     * File loader for loading glTF files into a scene.
     */
    var GLTFFileLoader = /** @class */ (function () {
        function GLTFFileLoader() {
            // --------------
            // Common options
            // --------------
            /**
             * Raised when the asset has been parsed
             */
            this.onParsedObservable = new BABYLON.Observable();
            // ----------
            // V2 options
            // ----------
            /**
             * The coordinate system mode. Defaults to AUTO.
             */
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            /**
            * The animation start mode. Defaults to FIRST.
            */
            this.animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
            /**
             * Defines if the loader should compile materials before raising the success callback. Defaults to false.
             */
            this.compileMaterials = false;
            /**
             * Defines if the loader should also compile materials with clip planes. Defaults to false.
             */
            this.useClipPlane = false;
            /**
             * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
             */
            this.compileShadowGenerators = false;
            /**
             * Defines if the Alpha blended materials are only applied as coverage.
             * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
             * If true, no extra effects are applied to transparent pixels.
             */
            this.transparencyAsCoverage = false;
            /**
             * Function called before loading a url referenced by the asset.
             */
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            /**
             * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            this.onMeshLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            this.onTextureLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a material after parsing the glTF properties of the material.
             */
            this.onMaterialLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            this.onCameraLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
             * For assets with LODs, raised when all of the LODs are complete.
             * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
             */
            this.onCompleteObservable = new BABYLON.Observable();
            /**
             * Observable raised when an error occurs.
             */
            this.onErrorObservable = new BABYLON.Observable();
            /**
             * Observable raised after the loader is disposed.
             */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
             * Observable raised after a loader extension is created.
             * Set additional options for a loader extension in this event.
             */
            this.onExtensionLoadedObservable = new BABYLON.Observable();
            /**
             * Defines if the loader should validate the asset.
             */
            this.validate = false;
            /**
             * Observable raised after validation when validate is set to true. The event data is the result of the validation.
             */
            this.onValidatedObservable = new BABYLON.Observable();
            this._loader = null;
            /**
             * Name of the loader ("gltf")
             */
            this.name = "gltf";
            /**
             * Supported file extensions of the loader (.gltf, .glb)
             */
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
            this._logIndentLevel = 0;
            this._loggingEnabled = false;
            /** @hidden */
            this._log = this._logDisabled;
            this._capturePerformanceCounters = false;
            /** @hidden */
            this._startPerformanceCounter = this._startPerformanceCounterDisabled;
            /** @hidden */
            this._endPerformanceCounter = this._endPerformanceCounterDisabled;
        }
        Object.defineProperty(GLTFFileLoader.prototype, "onParsed", {
            /**
             * Raised when the asset has been parsed
             */
            set: function (callback) {
                if (this._onParsedObserver) {
                    this.onParsedObservable.remove(this._onParsedObserver);
                }
                this._onParsedObserver = this.onParsedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMeshLoaded", {
            /**
             * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            set: function (callback) {
                if (this._onMeshLoadedObserver) {
                    this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
                }
                this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onTextureLoaded", {
            /**
             * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            set: function (callback) {
                if (this._onTextureLoadedObserver) {
                    this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver);
                }
                this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMaterialLoaded", {
            /**
             * Callback raised when the loader creates a material after parsing the glTF properties of the material.
             */
            set: function (callback) {
                if (this._onMaterialLoadedObserver) {
                    this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
                }
                this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onCameraLoaded", {
            /**
             * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            set: function (callback) {
                if (this._onCameraLoadedObserver) {
                    this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver);
                }
                this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onComplete", {
            /**
             * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
             * For assets with LODs, raised when all of the LODs are complete.
             * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
             */
            set: function (callback) {
                if (this._onCompleteObserver) {
                    this.onCompleteObservable.remove(this._onCompleteObserver);
                }
                this._onCompleteObserver = this.onCompleteObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onError", {
            /**
             * Callback raised when an error occurs.
             */
            set: function (callback) {
                if (this._onErrorObserver) {
                    this.onErrorObservable.remove(this._onErrorObserver);
                }
                this._onErrorObserver = this.onErrorObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onDispose", {
            /**
             * Callback raised after the loader is disposed.
             */
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onExtensionLoaded", {
            /**
             * Callback raised after a loader extension is created.
             */
            set: function (callback) {
                if (this._onExtensionLoadedObserver) {
                    this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver);
                }
                this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "loggingEnabled", {
            /**
             * Defines if the loader logging is enabled.
             */
            get: function () {
                return this._loggingEnabled;
            },
            set: function (value) {
                if (this._loggingEnabled === value) {
                    return;
                }
                this._loggingEnabled = value;
                if (this._loggingEnabled) {
                    this._log = this._logEnabled;
                }
                else {
                    this._log = this._logDisabled;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "capturePerformanceCounters", {
            /**
             * Defines if the loader should capture performance counters.
             */
            get: function () {
                return this._capturePerformanceCounters;
            },
            set: function (value) {
                if (this._capturePerformanceCounters === value) {
                    return;
                }
                this._capturePerformanceCounters = value;
                if (this._capturePerformanceCounters) {
                    this._startPerformanceCounter = this._startPerformanceCounterEnabled;
                    this._endPerformanceCounter = this._endPerformanceCounterEnabled;
                }
                else {
                    this._startPerformanceCounter = this._startPerformanceCounterDisabled;
                    this._endPerformanceCounter = this._endPerformanceCounterDisabled;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onValidated", {
            /**
             * Callback raised after a loader extension is created.
             */
            set: function (callback) {
                if (this._onValidatedObserver) {
                    this.onValidatedObservable.remove(this._onValidatedObserver);
                }
                this._onValidatedObserver = this.onValidatedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        GLTFFileLoader.prototype.dispose = function () {
            if (this._loader) {
                this._loader.dispose();
                this._loader = null;
            }
            this._clear();
            this.onDisposeObservable.notifyObservers(undefined);
            this.onDisposeObservable.clear();
        };
        /** @hidden */
        GLTFFileLoader.prototype._clear = function () {
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
            this.onCameraLoadedObservable.clear();
            this.onCompleteObservable.clear();
            this.onExtensionLoadedObservable.clear();
        };
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @param fileName Defines the name of the file to load
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress, fileName) {
            var _this = this;
            return this._parseAsync(scene, data, rootUrl, fileName).then(function (loaderData) {
                _this._log("Loading " + (fileName || ""));
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onProgress, fileName);
            });
        };
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @param fileName Defines the name of the file to load
         * @returns a promise which completes when objects have been loaded to the scene
         */
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
            var _this = this;
            return this._parseAsync(scene, data, rootUrl, fileName).then(function (loaderData) {
                _this._log("Loading " + (fileName || ""));
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.loadAsync(scene, loaderData, rootUrl, onProgress, fileName);
            });
        };
        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @param fileName Defines the name of the file to load
         * @returns The loaded asset container
         */
        GLTFFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress, fileName) {
            var _this = this;
            return this._parseAsync(scene, data, rootUrl, fileName).then(function (loaderData) {
                _this._log("Loading " + (fileName || ""));
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(null, scene, loaderData, rootUrl, onProgress, fileName).then(function (result) {
                    var container = new BABYLON.AssetContainer(scene);
                    Array.prototype.push.apply(container.meshes, result.meshes);
                    Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                    Array.prototype.push.apply(container.skeletons, result.skeletons);
                    Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                    container.removeAllFromScene();
                    return container;
                });
            });
        };
        /**
         * If the data string can be loaded directly.
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        /**
         * Instantiates a glTF file loader plugin.
         * @returns the created plugin
         */
        GLTFFileLoader.prototype.createPlugin = function () {
            return new GLTFFileLoader();
        };
        Object.defineProperty(GLTFFileLoader.prototype, "loaderState", {
            /**
             * The loader state or null if the loader is not active.
             */
            get: function () {
                return this._loader ? this._loader.state : null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns a promise that resolves when the asset is completely loaded.
         */
        GLTFFileLoader.prototype.whenCompleteAsync = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.onCompleteObservable.addOnce(function () {
                    resolve();
                });
                _this.onErrorObservable.addOnce(function (reason) {
                    reject(reason);
                });
            });
        };
        GLTFFileLoader.prototype._parseAsync = function (scene, data, rootUrl, fileName) {
            var _this = this;
            return Promise.resolve().then(function () {
                var unpacked = (data instanceof ArrayBuffer) ? _this._unpackBinary(data) : { json: data, bin: null };
                return _this._validateAsync(scene, unpacked.json, rootUrl, fileName).then(function () {
                    _this._startPerformanceCounter("Parse JSON");
                    _this._log("JSON length: " + unpacked.json.length);
                    var loaderData = {
                        json: JSON.parse(unpacked.json),
                        bin: unpacked.bin
                    };
                    _this._endPerformanceCounter("Parse JSON");
                    _this.onParsedObservable.notifyObservers(loaderData);
                    _this.onParsedObservable.clear();
                    return loaderData;
                });
            });
        };
        GLTFFileLoader.prototype._validateAsync = function (scene, json, rootUrl, fileName) {
            var _this = this;
            if (!this.validate || typeof GLTFValidator === "undefined") {
                return Promise.resolve();
            }
            this._startPerformanceCounter("Validate JSON");
            var options = {
                externalResourceFunction: function (uri) {
                    return _this.preprocessUrlAsync(rootUrl + uri)
                        .then(function (url) { return scene._loadFileAsync(url, true, true); })
                        .then(function (data) { return new Uint8Array(data); });
                }
            };
            if (fileName && fileName.substr(0, 5) !== "data:") {
                options.uri = (rootUrl === "file:" ? fileName : "" + rootUrl + fileName);
            }
            return GLTFValidator.validateString(json, options).then(function (result) {
                _this._endPerformanceCounter("Validate JSON");
                _this.onValidatedObservable.notifyObservers(result);
                _this.onValidatedObservable.clear();
            }, function (reason) {
                _this._endPerformanceCounter("Validate JSON");
                BABYLON.Tools.Warn("Failed to validate: " + reason);
                _this.onValidatedObservable.clear();
            });
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var asset = loaderData.json.asset || {};
            this._log("Asset version: " + asset.version);
            asset.minVersion && this._log("Asset minimum version: " + asset.minVersion);
            asset.generator && this._log("Asset generator: " + asset.generator);
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                throw new Error("Invalid version: " + asset.version);
            }
            if (asset.minVersion !== undefined) {
                var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
                if (!minVersion) {
                    throw new Error("Invalid minimum version: " + asset.minVersion);
                }
                if (GLTFFileLoader._compareVersion(minVersion, { major: 2, minor: 0 }) > 0) {
                    throw new Error("Incompatible minimum version: " + asset.minVersion);
                }
            }
            var createLoaders = {
                1: GLTFFileLoader._CreateGLTFLoaderV1,
                2: GLTFFileLoader._CreateGLTFLoaderV2
            };
            var createLoader = createLoaders[version.major];
            if (!createLoader) {
                throw new Error("Unsupported version: " + asset.version);
            }
            return createLoader(this);
        };
        GLTFFileLoader.prototype._unpackBinary = function (data) {
            this._startPerformanceCounter("Unpack binary");
            this._log("Binary length: " + data.byteLength);
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }
            var version = binaryReader.readUint32();
            if (this.loggingEnabled) {
                this._log("Binary version: " + version);
            }
            var unpacked;
            switch (version) {
                case 1: {
                    unpacked = this._unpackBinaryV1(binaryReader);
                    break;
                }
                case 2: {
                    unpacked = this._unpackBinaryV2(binaryReader);
                    break;
                }
                default: {
                    throw new Error("Unsupported version: " + version);
                }
            }
            this._endPerformanceCounter("Unpack binary");
            return unpacked;
        };
        GLTFFileLoader.prototype._unpackBinaryV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
            switch (contentFormat) {
                case ContentFormat.JSON: {
                    content = GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength));
                    break;
                }
                default: {
                    throw new Error("Unexpected content format: " + contentFormat);
                }
            }
            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);
            return {
                json: content,
                bin: body
            };
        };
        GLTFFileLoader.prototype._unpackBinaryV2 = function (binaryReader) {
            var ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };
            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                throw new Error("First chunk format is not JSON");
            }
            var json = GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength));
            // Look for BIN chunk
            var bin = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                var chunkLength_1 = binaryReader.readUint32();
                var chunkFormat_1 = binaryReader.readUint32();
                switch (chunkFormat_1) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        bin = binaryReader.readUint8Array(chunkLength_1);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength_1);
                        break;
                    }
                }
            }
            return {
                json: json,
                bin: bin
            };
        };
        GLTFFileLoader._parseVersion = function (version) {
            if (version === "1.0" || version === "1.0.1") {
                return {
                    major: 1,
                    minor: 0
                };
            }
            var match = (version + "").match(/^(\d+)\.(\d+)/);
            if (!match) {
                return null;
            }
            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2])
            };
        };
        GLTFFileLoader._compareVersion = function (a, b) {
            if (a.major > b.major) {
                return 1;
            }
            if (a.major < b.major) {
                return -1;
            }
            if (a.minor > b.minor) {
                return 1;
            }
            if (a.minor < b.minor) {
                return -1;
            }
            return 0;
        };
        GLTFFileLoader._decodeBufferToText = function (buffer) {
            var result = "";
            var length = buffer.byteLength;
            for (var i = 0; i < length; i++) {
                result += String.fromCharCode(buffer[i]);
            }
            return result;
        };
        /** @hidden */
        GLTFFileLoader.prototype._logOpen = function (message) {
            this._log(message);
            this._logIndentLevel++;
        };
        /** @hidden */
        GLTFFileLoader.prototype._logClose = function () {
            --this._logIndentLevel;
        };
        GLTFFileLoader.prototype._logEnabled = function (message) {
            var spaces = GLTFFileLoader._logSpaces.substr(0, this._logIndentLevel * 2);
            BABYLON.Tools.Log("" + spaces + message);
        };
        GLTFFileLoader.prototype._logDisabled = function (message) {
        };
        GLTFFileLoader.prototype._startPerformanceCounterEnabled = function (counterName) {
            BABYLON.Tools.StartPerformanceCounter(counterName);
        };
        GLTFFileLoader.prototype._startPerformanceCounterDisabled = function (counterName) {
        };
        GLTFFileLoader.prototype._endPerformanceCounterEnabled = function (counterName) {
            BABYLON.Tools.EndPerformanceCounter(counterName);
        };
        GLTFFileLoader.prototype._endPerformanceCounterDisabled = function (counterName) {
        };
        // ----------
        // V1 options
        // ----------
        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
         * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
         * Defaults to true.
         * @hidden
         */
        GLTFFileLoader.IncrementalLoading = true;
        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
         * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
         * @hidden
         */
        GLTFFileLoader.HomogeneousCoordinates = false;
        GLTFFileLoader._logSpaces = "                                ";
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = /** @class */ (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getPosition = function () {
            return this._byteOffset;
        };
        BinaryReader.prototype.getLength = function () {
            return this._arrayBuffer.byteLength;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.readUint8Array = function (length) {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        BinaryReader.prototype.skipBytes = function (length) {
            this._byteOffset += length;
        };
        return BinaryReader;
    }());
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFFileLoader.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF1.EComponentType || (GLTF1.EComponentType = {}));
        var EShaderType;
        (function (EShaderType) {
            EShaderType[EShaderType["FRAGMENT"] = 35632] = "FRAGMENT";
            EShaderType[EShaderType["VERTEX"] = 35633] = "VERTEX";
        })(EShaderType = GLTF1.EShaderType || (GLTF1.EShaderType = {}));
        var EParameterType;
        (function (EParameterType) {
            EParameterType[EParameterType["BYTE"] = 5120] = "BYTE";
            EParameterType[EParameterType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EParameterType[EParameterType["SHORT"] = 5122] = "SHORT";
            EParameterType[EParameterType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EParameterType[EParameterType["INT"] = 5124] = "INT";
            EParameterType[EParameterType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EParameterType[EParameterType["FLOAT"] = 5126] = "FLOAT";
            EParameterType[EParameterType["FLOAT_VEC2"] = 35664] = "FLOAT_VEC2";
            EParameterType[EParameterType["FLOAT_VEC3"] = 35665] = "FLOAT_VEC3";
            EParameterType[EParameterType["FLOAT_VEC4"] = 35666] = "FLOAT_VEC4";
            EParameterType[EParameterType["INT_VEC2"] = 35667] = "INT_VEC2";
            EParameterType[EParameterType["INT_VEC3"] = 35668] = "INT_VEC3";
            EParameterType[EParameterType["INT_VEC4"] = 35669] = "INT_VEC4";
            EParameterType[EParameterType["BOOL"] = 35670] = "BOOL";
            EParameterType[EParameterType["BOOL_VEC2"] = 35671] = "BOOL_VEC2";
            EParameterType[EParameterType["BOOL_VEC3"] = 35672] = "BOOL_VEC3";
            EParameterType[EParameterType["BOOL_VEC4"] = 35673] = "BOOL_VEC4";
            EParameterType[EParameterType["FLOAT_MAT2"] = 35674] = "FLOAT_MAT2";
            EParameterType[EParameterType["FLOAT_MAT3"] = 35675] = "FLOAT_MAT3";
            EParameterType[EParameterType["FLOAT_MAT4"] = 35676] = "FLOAT_MAT4";
            EParameterType[EParameterType["SAMPLER_2D"] = 35678] = "SAMPLER_2D";
        })(EParameterType = GLTF1.EParameterType || (GLTF1.EParameterType = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF1.ETextureWrapMode || (GLTF1.ETextureWrapMode = {}));
        var ETextureFilterType;
        (function (ETextureFilterType) {
            ETextureFilterType[ETextureFilterType["NEAREST"] = 9728] = "NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR"] = 9728] = "LINEAR";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureFilterType = GLTF1.ETextureFilterType || (GLTF1.ETextureFilterType = {}));
        var ETextureFormat;
        (function (ETextureFormat) {
            ETextureFormat[ETextureFormat["ALPHA"] = 6406] = "ALPHA";
            ETextureFormat[ETextureFormat["RGB"] = 6407] = "RGB";
            ETextureFormat[ETextureFormat["RGBA"] = 6408] = "RGBA";
            ETextureFormat[ETextureFormat["LUMINANCE"] = 6409] = "LUMINANCE";
            ETextureFormat[ETextureFormat["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        })(ETextureFormat = GLTF1.ETextureFormat || (GLTF1.ETextureFormat = {}));
        var ECullingType;
        (function (ECullingType) {
            ECullingType[ECullingType["FRONT"] = 1028] = "FRONT";
            ECullingType[ECullingType["BACK"] = 1029] = "BACK";
            ECullingType[ECullingType["FRONT_AND_BACK"] = 1032] = "FRONT_AND_BACK";
        })(ECullingType = GLTF1.ECullingType || (GLTF1.ECullingType = {}));
        var EBlendingFunction;
        (function (EBlendingFunction) {
            EBlendingFunction[EBlendingFunction["ZERO"] = 0] = "ZERO";
            EBlendingFunction[EBlendingFunction["ONE"] = 1] = "ONE";
            EBlendingFunction[EBlendingFunction["SRC_COLOR"] = 768] = "SRC_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_COLOR"] = 769] = "ONE_MINUS_SRC_COLOR";
            EBlendingFunction[EBlendingFunction["DST_COLOR"] = 774] = "DST_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_COLOR"] = 775] = "ONE_MINUS_DST_COLOR";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA"] = 770] = "SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_ALPHA"] = 771] = "ONE_MINUS_SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["DST_ALPHA"] = 772] = "DST_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_ALPHA"] = 773] = "ONE_MINUS_DST_ALPHA";
            EBlendingFunction[EBlendingFunction["CONSTANT_COLOR"] = 32769] = "CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_COLOR"] = 32770] = "ONE_MINUS_CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["CONSTANT_ALPHA"] = 32771] = "CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_ALPHA"] = 32772] = "ONE_MINUS_CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA_SATURATE"] = 776] = "SRC_ALPHA_SATURATE";
        })(EBlendingFunction = GLTF1.EBlendingFunction || (GLTF1.EBlendingFunction = {}));
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Tokenizer. Used for shaders compatibility
        * Automatically map world, view, projection, worldViewProjection, attributes and so on
        */
        var ETokenType;
        (function (ETokenType) {
            ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
            ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
            ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
        })(ETokenType || (ETokenType = {}));
        var Tokenizer = /** @class */ (function () {
            function Tokenizer(toParse) {
                this._pos = 0;
                this.currentToken = ETokenType.UNKNOWN;
                this.currentIdentifier = "";
                this.currentString = "";
                this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
                this._toParse = toParse;
                this._maxPos = toParse.length;
            }
            Tokenizer.prototype.getNextToken = function () {
                if (this.isEnd()) {
                    return ETokenType.END_OF_INPUT;
                }
                this.currentString = this.read();
                this.currentToken = ETokenType.UNKNOWN;
                if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
                    this.currentToken = ETokenType.IDENTIFIER;
                    this.currentIdentifier = this.currentString;
                    while (!this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_")) {
                        this.currentIdentifier += this.currentString;
                        this.forward();
                    }
                }
                return this.currentToken;
            };
            Tokenizer.prototype.peek = function () {
                return this._toParse[this._pos];
            };
            Tokenizer.prototype.read = function () {
                return this._toParse[this._pos++];
            };
            Tokenizer.prototype.forward = function () {
                this._pos++;
            };
            Tokenizer.prototype.isEnd = function () {
                return this._pos >= this._maxPos;
            };
            return Tokenizer;
        }());
        /**
        * Values
        */
        var glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
        var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];
        var glTFAnimationPaths = ["translation", "rotation", "scale"];
        var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];
        /**
        * Parse
        */
        var parseBuffers = function (parsedBuffers, gltfRuntime) {
            for (var buf in parsedBuffers) {
                var parsedBuffer = parsedBuffers[buf];
                gltfRuntime.buffers[buf] = parsedBuffer;
                gltfRuntime.buffersCount++;
            }
        };
        var parseShaders = function (parsedShaders, gltfRuntime) {
            for (var sha in parsedShaders) {
                var parsedShader = parsedShaders[sha];
                gltfRuntime.shaders[sha] = parsedShader;
                gltfRuntime.shaderscount++;
            }
        };
        var parseObject = function (parsedObjects, runtimeProperty, gltfRuntime) {
            for (var object in parsedObjects) {
                var parsedObject = parsedObjects[object];
                gltfRuntime[runtimeProperty][object] = parsedObject;
            }
        };
        /**
        * Utils
        */
        var normalizeUVs = function (buffer) {
            if (!buffer) {
                return;
            }
            for (var i = 0; i < buffer.length / 2; i++) {
                buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
            }
        };
        var getAttribute = function (attributeParameter) {
            if (attributeParameter.semantic === "NORMAL") {
                return "normal";
            }
            else if (attributeParameter.semantic === "POSITION") {
                return "position";
            }
            else if (attributeParameter.semantic === "JOINT") {
                return "matricesIndices";
            }
            else if (attributeParameter.semantic === "WEIGHT") {
                return "matricesWeights";
            }
            else if (attributeParameter.semantic === "COLOR") {
                return "color";
            }
            else if (attributeParameter.semantic && attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
                var channel = Number(attributeParameter.semantic.split("_")[1]);
                return "uv" + (channel === 0 ? "" : channel + 1);
            }
            return null;
        };
        /**
        * Loads and creates animations
        */
        var loadAnimations = function (gltfRuntime) {
            for (var anim in gltfRuntime.animations) {
                var animation = gltfRuntime.animations[anim];
                if (!animation.channels || !animation.samplers) {
                    continue;
                }
                var lastAnimation = null;
                for (var i = 0; i < animation.channels.length; i++) {
                    // Get parameters and load buffers
                    var channel = animation.channels[i];
                    var sampler = animation.samplers[channel.sampler];
                    if (!sampler) {
                        continue;
                    }
                    var inputData = null;
                    var outputData = null;
                    if (animation.parameters) {
                        inputData = animation.parameters[sampler.input];
                        outputData = animation.parameters[sampler.output];
                    }
                    else {
                        inputData = sampler.input;
                        outputData = sampler.output;
                    }
                    var bufferInput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                    var bufferOutput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
                    var targetID = channel.target.id;
                    var targetNode = gltfRuntime.scene.getNodeByID(targetID);
                    if (targetNode === null) {
                        targetNode = gltfRuntime.scene.getNodeByName(targetID);
                    }
                    if (targetNode === null) {
                        BABYLON.Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                        continue;
                    }
                    var isBone = targetNode instanceof BABYLON.Bone;
                    // Get target path (position, rotation or scaling)
                    var targetPath = channel.target.path;
                    var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                    if (targetPathIndex !== -1) {
                        targetPath = babylonAnimationPaths[targetPathIndex];
                    }
                    // Determine animation type
                    var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                    if (!isBone) {
                        if (targetPath === "rotationQuaternion") {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            targetNode.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        else {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        }
                    }
                    // Create animation and key frames
                    var babylonAnimation = null;
                    var keys = [];
                    var arrayOffset = 0;
                    var modifyKey = false;
                    if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                        babylonAnimation = lastAnimation;
                        modifyKey = true;
                    }
                    if (!modifyKey) {
                        babylonAnimation = new BABYLON.Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                    }
                    // For each frame
                    for (var j = 0; j < bufferInput.length; j++) {
                        var value = null;
                        if (targetPath === "rotationQuaternion") { // VEC4
                            value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                            arrayOffset += 4;
                        }
                        else { // Position and scaling are VEC3
                            value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                            arrayOffset += 3;
                        }
                        if (isBone) {
                            var bone = targetNode;
                            var translation = BABYLON.Vector3.Zero();
                            var rotationQuaternion = new BABYLON.Quaternion();
                            var scaling = BABYLON.Vector3.Zero();
                            // Warning on decompose
                            var mat = bone.getBaseMatrix();
                            if (modifyKey && lastAnimation) {
                                mat = lastAnimation.getKeys()[j].value;
                            }
                            mat.decompose(scaling, rotationQuaternion, translation);
                            if (targetPath === "position") {
                                translation = value;
                            }
                            else if (targetPath === "rotationQuaternion") {
                                rotationQuaternion = value;
                            }
                            else {
                                scaling = value;
                            }
                            value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
                        }
                        if (!modifyKey) {
                            keys.push({
                                frame: bufferInput[j],
                                value: value
                            });
                        }
                        else if (lastAnimation) {
                            lastAnimation.getKeys()[j].value = value;
                        }
                    }
                    // Finish
                    if (!modifyKey && babylonAnimation) {
                        babylonAnimation.setKeys(keys);
                        targetNode.animations.push(babylonAnimation);
                    }
                    lastAnimation = babylonAnimation;
                    gltfRuntime.scene.stopAnimation(targetNode);
                    gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                }
            }
        };
        /**
        * Returns the bones transformation matrix
        */
        var configureBoneTransformation = function (node) {
            var mat = null;
            if (node.translation || node.rotation || node.scale) {
                var scale = BABYLON.Vector3.FromArray(node.scale || [1, 1, 1]);
                var rotation = BABYLON.Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
                var position = BABYLON.Vector3.FromArray(node.translation || [0, 0, 0]);
                mat = BABYLON.Matrix.Compose(scale, rotation, position);
            }
            else {
                mat = BABYLON.Matrix.FromArray(node.matrix);
            }
            return mat;
        };
        /**
        * Returns the parent bone
        */
        var getParentBone = function (gltfRuntime, skins, jointName, newSkeleton) {
            // Try to find
            for (var i = 0; i < newSkeleton.bones.length; i++) {
                if (newSkeleton.bones[i].name === jointName) {
                    return newSkeleton.bones[i];
                }
            }
            // Not found, search in gltf nodes
            var nodes = gltfRuntime.nodes;
            for (var nde in nodes) {
                var node = nodes[nde];
                if (!node.jointName) {
                    continue;
                }
                var children = node.children;
                for (var i = 0; i < children.length; i++) {
                    var child = gltfRuntime.nodes[children[i]];
                    if (!child.jointName) {
                        continue;
                    }
                    if (child.jointName === jointName) {
                        var mat = configureBoneTransformation(node);
                        var bone = new BABYLON.Bone(node.name || "", newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                        bone.id = nde;
                        return bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the appropriate root node
        */
        var getNodeToRoot = function (nodesToRoot, id) {
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                    var child = nodeToRoot.node.children[j];
                    if (child === id) {
                        return nodeToRoot.bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the node with the joint name
        */
        var getJointNode = function (gltfRuntime, jointName) {
            var nodes = gltfRuntime.nodes;
            var node = nodes[jointName];
            if (node) {
                return {
                    node: node,
                    id: jointName
                };
            }
            for (var nde in nodes) {
                node = nodes[nde];
                if (node.jointName === jointName) {
                    return {
                        node: node,
                        id: nde
                    };
                }
            }
            return null;
        };
        /**
        * Checks if a nodes is in joints
        */
        var nodeIsInJoints = function (skins, id) {
            for (var i = 0; i < skins.jointNames.length; i++) {
                if (skins.jointNames[i] === id) {
                    return true;
                }
            }
            return false;
        };
        /**
        * Fills the nodes to root for bones and builds hierarchy
        */
        var getNodesToRoot = function (gltfRuntime, newSkeleton, skins, nodesToRoot) {
            // Creates nodes for root
            for (var nde in gltfRuntime.nodes) {
                var node = gltfRuntime.nodes[nde];
                var id = nde;
                if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                    continue;
                }
                // Create node to root bone
                var mat = configureBoneTransformation(node);
                var bone = new BABYLON.Bone(node.name || "", newSkeleton, null, mat);
                bone.id = id;
                nodesToRoot.push({ bone: bone, node: node, id: id });
            }
            // Parenting
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                var children = nodeToRoot.node.children;
                for (var j = 0; j < children.length; j++) {
                    var child = null;
                    for (var k = 0; k < nodesToRoot.length; k++) {
                        if (nodesToRoot[k].id === children[j]) {
                            child = nodesToRoot[k];
                            break;
                        }
                    }
                    if (child) {
                        child.bone._parent = nodeToRoot.bone;
                        nodeToRoot.bone.children.push(child.bone);
                    }
                }
            }
        };
        /**
        * Imports a skeleton
        */
        var importSkeleton = function (gltfRuntime, skins, mesh, newSkeleton, id) {
            if (!newSkeleton) {
                newSkeleton = new BABYLON.Skeleton(skins.name || "", "", gltfRuntime.scene);
            }
            if (!skins.babylonSkeleton) {
                return newSkeleton;
            }
            // Find the root bones
            var nodesToRoot = [];
            var nodesToRootToAdd = [];
            getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
            newSkeleton.bones = [];
            // Joints
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                var node = jointNode.node;
                if (!node) {
                    BABYLON.Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                    continue;
                }
                var id = jointNode.id;
                // Optimize, if the bone already exists...
                var existingBone = gltfRuntime.scene.getBoneByID(id);
                if (existingBone) {
                    newSkeleton.bones.push(existingBone);
                    continue;
                }
                // Search for parent bone
                var foundBone = false;
                var parentBone = null;
                for (var j = 0; j < i; j++) {
                    var jointNode_1 = getJointNode(gltfRuntime, skins.jointNames[j]);
                    if (!jointNode_1) {
                        continue;
                    }
                    var joint = jointNode_1.node;
                    if (!joint) {
                        BABYLON.Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                        continue;
                    }
                    var children = joint.children;
                    if (!children) {
                        continue;
                    }
                    foundBone = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k] === id) {
                            parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
                            foundBone = true;
                            break;
                        }
                    }
                    if (foundBone) {
                        break;
                    }
                }
                // Create bone
                var mat = configureBoneTransformation(node);
                if (!parentBone && nodesToRoot.length > 0) {
                    parentBone = getNodeToRoot(nodesToRoot, id);
                    if (parentBone) {
                        if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                            nodesToRootToAdd.push(parentBone);
                        }
                    }
                }
                var bone = new BABYLON.Bone(node.jointName || "", newSkeleton, parentBone, mat);
                bone.id = id;
            }
            // Polish
            var bones = newSkeleton.bones;
            newSkeleton.bones = [];
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                for (var j = 0; j < bones.length; j++) {
                    if (bones[j].id === jointNode.id) {
                        newSkeleton.bones.push(bones[j]);
                        break;
                    }
                }
            }
            newSkeleton.prepare();
            // Finish
            for (var i = 0; i < nodesToRootToAdd.length; i++) {
                newSkeleton.bones.push(nodesToRootToAdd[i]);
            }
            return newSkeleton;
        };
        /**
        * Imports a mesh and its geometries
        */
        var importMesh = function (gltfRuntime, node, meshes, id, newMesh) {
            if (!newMesh) {
                newMesh = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                newMesh.id = id;
            }
            if (!node.babylonNode) {
                return newMesh;
            }
            var subMaterials = [];
            var vertexData = null;
            var verticesStarts = new Array();
            var verticesCounts = new Array();
            var indexStarts = new Array();
            var indexCounts = new Array();
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                // Positions, normals and UVs
                for (var i = 0; i < mesh.primitives.length; i++) {
                    // Temporary vertex data
                    var tempVertexData = new BABYLON.VertexData();
                    var primitive = mesh.primitives[i];
                    if (primitive.mode !== 4) {
                        // continue;
                    }
                    var attributes = primitive.attributes;
                    var accessor = null;
                    var buffer = null;
                    // Set positions, normal and uvs
                    for (var semantic in attributes) {
                        // Link accessor and buffer view
                        accessor = gltfRuntime.accessors[attributes[semantic]];
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        if (semantic === "NORMAL") {
                            tempVertexData.normals = new Float32Array(buffer.length);
                            tempVertexData.normals.set(buffer);
                        }
                        else if (semantic === "POSITION") {
                            if (BABYLON.GLTFFileLoader.HomogeneousCoordinates) {
                                tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);
                                for (var j = 0; j < buffer.length; j += 4) {
                                    tempVertexData.positions[j] = buffer[j];
                                    tempVertexData.positions[j + 1] = buffer[j + 1];
                                    tempVertexData.positions[j + 2] = buffer[j + 2];
                                }
                            }
                            else {
                                tempVertexData.positions = new Float32Array(buffer.length);
                                tempVertexData.positions.set(buffer);
                            }
                            verticesCounts.push(tempVertexData.positions.length);
                        }
                        else if (semantic.indexOf("TEXCOORD_") !== -1) {
                            var channel = Number(semantic.split("_")[1]);
                            var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                            var uvs = new Float32Array(buffer.length);
                            uvs.set(buffer);
                            normalizeUVs(uvs);
                            tempVertexData.set(uvs, uvKind);
                        }
                        else if (semantic === "JOINT") {
                            tempVertexData.matricesIndices = new Float32Array(buffer.length);
                            tempVertexData.matricesIndices.set(buffer);
                        }
                        else if (semantic === "WEIGHT") {
                            tempVertexData.matricesWeights = new Float32Array(buffer.length);
                            tempVertexData.matricesWeights.set(buffer);
                        }
                        else if (semantic === "COLOR") {
                            tempVertexData.colors = new Float32Array(buffer.length);
                            tempVertexData.colors.set(buffer);
                        }
                    }
                    // Indices
                    accessor = gltfRuntime.accessors[primitive.indices];
                    if (accessor) {
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        tempVertexData.indices = new Int32Array(buffer.length);
                        tempVertexData.indices.set(buffer);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    else {
                        // Set indices on the fly
                        var indices = [];
                        for (var j = 0; j < tempVertexData.positions.length / 3; j++) {
                            indices.push(j);
                        }
                        tempVertexData.indices = new Int32Array(indices);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    if (!vertexData) {
                        vertexData = tempVertexData;
                    }
                    else {
                        vertexData.merge(tempVertexData);
                    }
                    // Sub material
                    var material_1 = gltfRuntime.scene.getMaterialByID(primitive.material);
                    subMaterials.push(material_1 === null ? GLTF1.GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material_1);
                    // Update vertices start and index start
                    verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                    indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
                }
            }
            var material;
            if (subMaterials.length > 1) {
                material = new BABYLON.MultiMaterial("multimat" + id, gltfRuntime.scene);
                material.subMaterials = subMaterials;
            }
            else {
                material = new BABYLON.StandardMaterial("multimat" + id, gltfRuntime.scene);
            }
            if (subMaterials.length === 1) {
                material = subMaterials[0];
            }
            if (!newMesh.material) {
                newMesh.material = material;
            }
            // Apply geometry
            new BABYLON.Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
            newMesh.computeWorldMatrix(true);
            // Apply submeshes
            newMesh.subMeshes = [];
            var index = 0;
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                for (var i = 0; i < mesh.primitives.length; i++) {
                    if (mesh.primitives[i].mode !== 4) {
                        //continue;
                    }
                    BABYLON.SubMesh.AddToMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                    index++;
                }
            }
            // Finish
            return newMesh;
        };
        /**
        * Configure node transformation from position, rotation and scaling
        */
        var configureNode = function (newNode, position, rotation, scaling) {
            if (newNode.position) {
                newNode.position = position;
            }
            if (newNode.rotationQuaternion || newNode.rotation) {
                newNode.rotationQuaternion = rotation;
            }
            if (newNode.scaling) {
                newNode.scaling = scaling;
            }
        };
        /**
        * Configures node from transformation matrix
        */
        var configureNodeFromMatrix = function (newNode, node, parent) {
            if (node.matrix) {
                var position = new BABYLON.Vector3(0, 0, 0);
                var rotation = new BABYLON.Quaternion();
                var scaling = new BABYLON.Vector3(0, 0, 0);
                var mat = BABYLON.Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
                configureNode(newNode, position, rotation, scaling);
            }
            else if (node.translation && node.rotation && node.scale) {
                configureNode(newNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.FromArray(node.rotation), BABYLON.Vector3.FromArray(node.scale));
            }
            newNode.computeWorldMatrix(true);
        };
        /**
        * Imports a node
        */
        var importNode = function (gltfRuntime, node, id, parent) {
            var lastNode = null;
            if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
                if (gltfRuntime.importMeshesNames && gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name || "") === -1) {
                    return null;
                }
            }
            // Meshes
            if (node.skin) {
                if (node.meshes) {
                    var skin = gltfRuntime.skins[node.skin];
                    var newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
                    newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(node.skin);
                    if (newMesh.skeleton === null) {
                        newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);
                        if (!skin.babylonSkeleton) {
                            skin.babylonSkeleton = newMesh.skeleton;
                        }
                    }
                    lastNode = newMesh;
                }
            }
            else if (node.meshes) {
                /**
                * Improve meshes property
                */
                var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
                lastNode = newMesh;
            }
            // Lights
            else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var light = gltfRuntime.lights[node.light];
                if (light) {
                    if (light.type === "ambient") {
                        var ambienLight = light[light.type];
                        var hemiLight = new BABYLON.HemisphericLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        hemiLight.name = node.name || "";
                        if (ambienLight.color) {
                            hemiLight.diffuse = BABYLON.Color3.FromArray(ambienLight.color);
                        }
                        lastNode = hemiLight;
                    }
                    else if (light.type === "directional") {
                        var directionalLight = light[light.type];
                        var dirLight = new BABYLON.DirectionalLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        dirLight.name = node.name || "";
                        if (directionalLight.color) {
                            dirLight.diffuse = BABYLON.Color3.FromArray(directionalLight.color);
                        }
                        lastNode = dirLight;
                    }
                    else if (light.type === "point") {
                        var pointLight = light[light.type];
                        var ptLight = new BABYLON.PointLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        ptLight.name = node.name || "";
                        if (pointLight.color) {
                            ptLight.diffuse = BABYLON.Color3.FromArray(pointLight.color);
                        }
                        lastNode = ptLight;
                    }
                    else if (light.type === "spot") {
                        var spotLight = light[light.type];
                        var spLight = new BABYLON.SpotLight(node.light, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, gltfRuntime.scene);
                        spLight.name = node.name || "";
                        if (spotLight.color) {
                            spLight.diffuse = BABYLON.Color3.FromArray(spotLight.color);
                        }
                        if (spotLight.fallOfAngle) {
                            spLight.angle = spotLight.fallOfAngle;
                        }
                        if (spotLight.fallOffExponent) {
                            spLight.exponent = spotLight.fallOffExponent;
                        }
                        lastNode = spLight;
                    }
                }
            }
            // Cameras
            else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var camera = gltfRuntime.cameras[node.camera];
                if (camera) {
                    if (camera.type === "orthographic") {
                        var orthoCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene, false);
                        orthoCamera.name = node.name || "";
                        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        lastNode = orthoCamera;
                    }
                    else if (camera.type === "perspective") {
                        var perspectiveCamera = camera[camera.type];
                        var persCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene, false);
                        persCamera.name = node.name || "";
                        persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        if (!perspectiveCamera.aspectRatio) {
                            perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                        }
                        if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                            persCamera.maxZ = perspectiveCamera.zfar;
                            persCamera.minZ = perspectiveCamera.znear;
                        }
                        lastNode = persCamera;
                    }
                }
            }
            // Empty node
            if (!node.jointName) {
                if (node.babylonNode) {
                    return node.babylonNode;
                }
                else if (lastNode === null) {
                    var dummy = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                    node.babylonNode = dummy;
                    lastNode = dummy;
                }
            }
            if (lastNode !== null) {
                if (node.matrix && lastNode instanceof BABYLON.Mesh) {
                    configureNodeFromMatrix(lastNode, node, parent);
                }
                else {
                    var translation = node.translation || [0, 0, 0];
                    var rotation = node.rotation || [0, 0, 0, 1];
                    var scale = node.scale || [1, 1, 1];
                    configureNode(lastNode, BABYLON.Vector3.FromArray(translation), BABYLON.Quaternion.FromArray(rotation), BABYLON.Vector3.FromArray(scale));
                }
                lastNode.updateCache(true);
                node.babylonNode = lastNode;
            }
            return lastNode;
        };
        /**
        * Traverses nodes and creates them
        */
        var traverseNodes = function (gltfRuntime, id, parent, meshIncluded) {
            if (meshIncluded === void 0) { meshIncluded = false; }
            var node = gltfRuntime.nodes[id];
            var newNode = null;
            if (gltfRuntime.importOnlyMeshes && !meshIncluded && gltfRuntime.importMeshesNames) {
                if (gltfRuntime.importMeshesNames.indexOf(node.name || "") !== -1 || gltfRuntime.importMeshesNames.length === 0) {
                    meshIncluded = true;
                }
                else {
                    meshIncluded = false;
                }
            }
            else {
                meshIncluded = true;
            }
            if (!node.jointName && meshIncluded) {
                newNode = importNode(gltfRuntime, node, id, parent);
                if (newNode !== null) {
                    newNode.id = id;
                    newNode.parent = parent;
                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
                }
            }
        };
        /**
        * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
        */
        var postLoad = function (gltfRuntime) {
            // Nodes
            var currentScene = gltfRuntime.currentScene;
            if (currentScene) {
                for (var i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
            else {
                for (var thing in gltfRuntime.scenes) {
                    currentScene = gltfRuntime.scenes[thing];
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
            }
            // Set animations
            loadAnimations(gltfRuntime);
            for (var i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
                var skeleton = gltfRuntime.scene.skeletons[i];
                gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
            }
        };
        /**
        * onBind shaderrs callback to set uniforms and matrices
        */
        var onBindShaderMaterial = function (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) {
            var materialValues = material.values || technique.parameters;
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                if (type === GLTF1.EParameterType.FLOAT_MAT2 || type === GLTF1.EParameterType.FLOAT_MAT3 || type === GLTF1.EParameterType.FLOAT_MAT4) {
                    if (uniform.semantic && !uniform.source && !uniform.node) {
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                    }
                    else if (uniform.semantic && (uniform.source || uniform.node)) {
                        var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node || "");
                        if (source === null) {
                            source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node || "");
                        }
                        if (source === null) {
                            continue;
                        }
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                    }
                }
                else {
                    var value = materialValues[technique.uniforms[unif]];
                    if (!value) {
                        continue;
                    }
                    if (type === GLTF1.EParameterType.SAMPLER_2D) {
                        var texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;
                        if (texture === null || texture === undefined) {
                            continue;
                        }
                        shaderMaterial.getEffect().setTexture(unif, texture);
                    }
                    else {
                        GLTF1.GLTFUtils.SetUniform((shaderMaterial.getEffect()), unif, value, type);
                    }
                }
            }
            onSuccess(shaderMaterial);
        };
        /**
        * Prepare uniforms to send the only one time
        * Loads the appropriate textures
        */
        var prepareShaderMaterialUniforms = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) {
            var materialValues = material.values || technique.parameters;
            var techniqueUniforms = technique.uniforms;
            /**
            * Prepare values here (not matrices)
            */
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                var value = materialValues[techniqueUniforms[unif]];
                if (value === undefined) {
                    // In case the value is the same for all materials
                    value = uniform.value;
                }
                if (!value) {
                    continue;
                }
                var onLoadTexture = function (uniformName) {
                    return function (texture) {
                        if (uniform.value && uniformName) {
                            // Static uniform
                            shaderMaterial.setTexture(uniformName, texture);
                            delete unTreatedUniforms[uniformName];
                        }
                    };
                };
                // Texture (sampler2D)
                if (type === GLTF1.EParameterType.SAMPLER_2D) {
                    GLTF1.GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), function () { return onLoadTexture(null); });
                }
                // Others
                else {
                    if (uniform.value && GLTF1.GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                        // Static uniform
                        delete unTreatedUniforms[unif];
                    }
                }
            }
        };
        /**
        * Shader compilation failed
        */
        var onShaderCompileError = function (program, shaderMaterial, onError) {
            return function (effect, error) {
                shaderMaterial.dispose(true);
                onError("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            };
        };
        /**
        * Shader compilation success
        */
        var onShaderCompileSuccess = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) {
            return function (_) {
                prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
                shaderMaterial.onBind = function (mesh) {
                    onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
                };
            };
        };
        /**
        * Returns the appropriate uniform if already handled by babylon
        */
        var parseShaderUniforms = function (tokenizer, technique, unTreatedUniforms) {
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter = technique.parameters[uniform];
                if (tokenizer.currentIdentifier === unif) {
                    if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            delete unTreatedUniforms[unif];
                            return babylonTransforms[transformIndex];
                        }
                    }
                }
            }
            return tokenizer.currentIdentifier;
        };
        /**
        * All shaders loaded. Create materials one by one
        */
        var importMaterials = function (gltfRuntime) {
            // Create materials
            for (var mat in gltfRuntime.materials) {
                GLTF1.GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, function (material) { }, function () { });
            }
        };
        /**
        * Implementation of the base glTF spec
        */
        var GLTFLoaderBase = /** @class */ (function () {
            function GLTFLoaderBase() {
            }
            GLTFLoaderBase.CreateRuntime = function (parsedData, scene, rootUrl) {
                var gltfRuntime = {
                    extensions: {},
                    accessors: {},
                    buffers: {},
                    bufferViews: {},
                    meshes: {},
                    lights: {},
                    cameras: {},
                    nodes: {},
                    images: {},
                    textures: {},
                    shaders: {},
                    programs: {},
                    samplers: {},
                    techniques: {},
                    materials: {},
                    animations: {},
                    skins: {},
                    extensionsUsed: [],
                    scenes: {},
                    buffersCount: 0,
                    shaderscount: 0,
                    scene: scene,
                    rootUrl: rootUrl,
                    loadedBufferCount: 0,
                    loadedBufferViews: {},
                    loadedShaderCount: 0,
                    importOnlyMeshes: false,
                    dummyNodes: []
                };
                // Parse
                if (parsedData.extensions) {
                    parseObject(parsedData.extensions, "extensions", gltfRuntime);
                }
                if (parsedData.extensionsUsed) {
                    parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
                }
                if (parsedData.buffers) {
                    parseBuffers(parsedData.buffers, gltfRuntime);
                }
                if (parsedData.bufferViews) {
                    parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
                }
                if (parsedData.accessors) {
                    parseObject(parsedData.accessors, "accessors", gltfRuntime);
                }
                if (parsedData.meshes) {
                    parseObject(parsedData.meshes, "meshes", gltfRuntime);
                }
                if (parsedData.lights) {
                    parseObject(parsedData.lights, "lights", gltfRuntime);
                }
                if (parsedData.cameras) {
                    parseObject(parsedData.cameras, "cameras", gltfRuntime);
                }
                if (parsedData.nodes) {
                    parseObject(parsedData.nodes, "nodes", gltfRuntime);
                }
                if (parsedData.images) {
                    parseObject(parsedData.images, "images", gltfRuntime);
                }
                if (parsedData.textures) {
                    parseObject(parsedData.textures, "textures", gltfRuntime);
                }
                if (parsedData.shaders) {
                    parseShaders(parsedData.shaders, gltfRuntime);
                }
                if (parsedData.programs) {
                    parseObject(parsedData.programs, "programs", gltfRuntime);
                }
                if (parsedData.samplers) {
                    parseObject(parsedData.samplers, "samplers", gltfRuntime);
                }
                if (parsedData.techniques) {
                    parseObject(parsedData.techniques, "techniques", gltfRuntime);
                }
                if (parsedData.materials) {
                    parseObject(parsedData.materials, "materials", gltfRuntime);
                }
                if (parsedData.animations) {
                    parseObject(parsedData.animations, "animations", gltfRuntime);
                }
                if (parsedData.skins) {
                    parseObject(parsedData.skins, "skins", gltfRuntime);
                }
                if (parsedData.scenes) {
                    gltfRuntime.scenes = parsedData.scenes;
                }
                if (parsedData.scene && parsedData.scenes) {
                    gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
                }
                return gltfRuntime;
            };
            GLTFLoaderBase.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                var buffer = gltfRuntime.buffers[id];
                if (BABYLON.Tools.IsBase64(buffer.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(BABYLON.Tools.DecodeBase64(buffer.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, function (data) { return onSuccess(new Uint8Array(data)); }, onProgress, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (!texture || !texture.source) {
                    onError("");
                    return;
                }
                if (texture.babylonTexture) {
                    onSuccess(null);
                    return;
                }
                var source = gltfRuntime.images[texture.source];
                if (BABYLON.Tools.IsBase64(source.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(BABYLON.Tools.DecodeBase64(source.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + source.uri, function (data) { return onSuccess(new Uint8Array(data)); }, undefined, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (texture.babylonTexture) {
                    onSuccess(texture.babylonTexture);
                    return;
                }
                var sampler = gltfRuntime.samplers[texture.sampler];
                var createMipMaps = (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR);
                var samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                var blob = buffer == null ? new Blob() : new Blob([buffer]);
                var blobURL = URL.createObjectURL(blob);
                var revokeBlobURL = function () { return URL.revokeObjectURL(blobURL); };
                var newTexture = new BABYLON.Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
                if (sampler.wrapS !== undefined) {
                    newTexture.wrapU = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapS);
                }
                if (sampler.wrapT !== undefined) {
                    newTexture.wrapV = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapT);
                }
                newTexture.name = id;
                texture.babylonTexture = newTexture;
                onSuccess(newTexture);
            };
            GLTFLoaderBase.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (BABYLON.Tools.IsBase64(shader.uri)) {
                    var shaderString = atob(shader.uri.split(",")[1]);
                    if (onSuccess) {
                        onSuccess(shaderString);
                    }
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, undefined, undefined, false, function (request) {
                        if (request && onError) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material.technique) {
                    if (onError) {
                        onError("No technique found.");
                    }
                    return;
                }
                var technique = gltfRuntime.techniques[material.technique];
                if (!technique) {
                    var defaultMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                    defaultMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                    defaultMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                    onSuccess(defaultMaterial);
                    return;
                }
                var program = gltfRuntime.programs[technique.program];
                var states = technique.states;
                var vertexShader = BABYLON.Effect.ShadersStore[program.vertexShader + "VertexShader"];
                var pixelShader = BABYLON.Effect.ShadersStore[program.fragmentShader + "PixelShader"];
                var newVertexShader = "";
                var newPixelShader = "";
                var vertexTokenizer = new Tokenizer(vertexShader);
                var pixelTokenizer = new Tokenizer(pixelShader);
                var unTreatedUniforms = {};
                var uniforms = [];
                var attributes = [];
                var samplers = [];
                // Fill uniform, sampler2D and attributes
                for (var unif in technique.uniforms) {
                    var uniform = technique.uniforms[unif];
                    var uniformParameter = technique.parameters[uniform];
                    unTreatedUniforms[unif] = uniformParameter;
                    if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            uniforms.push(babylonTransforms[transformIndex]);
                            delete unTreatedUniforms[unif];
                        }
                        else {
                            uniforms.push(unif);
                        }
                    }
                    else if (uniformParameter.type === GLTF1.EParameterType.SAMPLER_2D) {
                        samplers.push(unif);
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                for (var attr in technique.attributes) {
                    var attribute = technique.attributes[attr];
                    var attributeParameter = technique.parameters[attribute];
                    if (attributeParameter.semantic) {
                        var name_1 = getAttribute(attributeParameter);
                        if (name_1) {
                            attributes.push(name_1);
                        }
                    }
                }
                // Configure vertex shader
                while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
                    var tokenType = vertexTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newVertexShader += vertexTokenizer.currentString;
                        continue;
                    }
                    var foundAttribute = false;
                    for (var attr in technique.attributes) {
                        var attribute = technique.attributes[attr];
                        var attributeParameter = technique.parameters[attribute];
                        if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                            newVertexShader += getAttribute(attributeParameter);
                            foundAttribute = true;
                            break;
                        }
                    }
                    if (foundAttribute) {
                        continue;
                    }
                    newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
                }
                // Configure pixel shader
                while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                    var tokenType = pixelTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newPixelShader += pixelTokenizer.currentString;
                        continue;
                    }
                    newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
                }
                // Create shader material
                var shaderPath = {
                    vertex: program.vertexShader + id,
                    fragment: program.fragmentShader + id
                };
                var options = {
                    attributes: attributes,
                    uniforms: uniforms,
                    samplers: samplers,
                    needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1
                };
                BABYLON.Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
                BABYLON.Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
                var shaderMaterial = new BABYLON.ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
                shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
                shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
                shaderMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (states && states.functions) {
                    var functions = states.functions;
                    if (functions.cullFace && functions.cullFace[0] !== GLTF1.ECullingType.BACK) {
                        shaderMaterial.backFaceCulling = false;
                    }
                    var blendFunc = functions.blendFuncSeparate;
                    if (blendFunc) {
                        if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ONE && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ZERO && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.DST_COLOR && blendFunc[1] === GLTF1.EBlendingFunction.ZERO && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MAXIMIZED;
                        }
                    }
                }
            };
            return GLTFLoaderBase;
        }());
        GLTF1.GLTFLoaderBase = GLTFLoaderBase;
        /**
        * glTF V1 Loader
        */
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
                this.state = null;
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
            };
            GLTFLoader.prototype.dispose = function () {
                // do nothing
            };
            GLTFLoader.prototype._importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    gltfRuntime.importOnlyMeshes = true;
                    if (meshesNames === "") {
                        gltfRuntime.importMeshesNames = [];
                    }
                    else if (typeof meshesNames === "string") {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else if (meshesNames && !(meshesNames instanceof Array)) {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else {
                        gltfRuntime.importMeshesNames = [];
                        BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                    }
                    // Create nodes
                    _this._createNodes(gltfRuntime);
                    var meshes = new Array();
                    var skeletons = new Array();
                    // Fill arrays of meshes and skeletons
                    for (var nde in gltfRuntime.nodes) {
                        var node = gltfRuntime.nodes[nde];
                        if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                            meshes.push(node.babylonNode);
                        }
                    }
                    for (var skl in gltfRuntime.skins) {
                        var skin = gltfRuntime.skins[skl];
                        if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    }
                    // Load buffers, shaders, materials, etc.
                    _this._loadBuffersAsync(gltfRuntime, function () {
                        _this._loadShadersAsync(gltfRuntime, function () {
                            importMaterials(gltfRuntime);
                            postLoad(gltfRuntime);
                            if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                                onSuccess(meshes, skeletons);
                            }
                        });
                    }, onProgress);
                    if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, skeletons);
                    }
                }, onError);
                return true;
            };
            /**
            * Imports one or more meshes from a loaded gltf file and adds them to the scene
            * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
            * @param scene the scene the meshes should be added to
            * @param data gltf data containing information of the meshes in a loaded file
            * @param rootUrl root url to load from
            * @param onProgress event that fires when loading progress has occured
            * @returns a promise containg the loaded meshes, particles, skeletons and animations
            */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._importMeshAsync(meshesNames, scene, data, rootUrl, function (meshes, skeletons) {
                        resolve({
                            meshes: meshes,
                            particleSystems: [],
                            skeletons: skeletons,
                            animationGroups: []
                        });
                    }, onProgress, function (message) {
                        reject(new Error(message));
                    });
                });
            };
            GLTFLoader.prototype._loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    // Load runtime extensios
                    GLTF1.GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, function () {
                        // Create nodes
                        _this._createNodes(gltfRuntime);
                        // Load buffers, shaders, materials, etc.
                        _this._loadBuffersAsync(gltfRuntime, function () {
                            _this._loadShadersAsync(gltfRuntime, function () {
                                importMaterials(gltfRuntime);
                                postLoad(gltfRuntime);
                                if (!BABYLON.GLTFFileLoader.IncrementalLoading) {
                                    onSuccess();
                                }
                            });
                        });
                        if (BABYLON.GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    }, onError);
                }, onError);
            };
            /**
            * Imports all objects from a loaded gltf file and adds them to the scene
            * @param scene the scene the objects should be added to
            * @param data gltf data containing information of the meshes in a loaded file
            * @param rootUrl root url to load from
            * @param onProgress event that fires when loading progress has occured
            * @returns a promise which completes when objects have been loaded to the scene
            */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._loadAsync(scene, data, rootUrl, function () {
                        resolve();
                    }, onProgress, function (message) {
                        reject(new Error(message));
                    });
                });
            };
            GLTFLoader.prototype._loadShadersAsync = function (gltfRuntime, onload) {
                var hasShaders = false;
                var processShader = function (sha, shader) {
                    GLTF1.GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, function (shaderString) {
                        if (shaderString instanceof ArrayBuffer) {
                            return;
                        }
                        gltfRuntime.loadedShaderCount++;
                        if (shaderString) {
                            BABYLON.Effect.ShadersStore[sha + (shader.type === GLTF1.EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                        }
                        if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                            onload();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                    });
                };
                for (var sha in gltfRuntime.shaders) {
                    hasShaders = true;
                    var shader = gltfRuntime.shaders[sha];
                    if (shader) {
                        processShader.bind(this, sha, shader)();
                    }
                    else {
                        BABYLON.Tools.Error("No shader named: " + sha);
                    }
                }
                if (!hasShaders) {
                    onload();
                }
            };
            GLTFLoader.prototype._loadBuffersAsync = function (gltfRuntime, onLoad, onProgress) {
                var hasBuffers = false;
                var processBuffer = function (buf, buffer) {
                    GLTF1.GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, function (bufferView) {
                        gltfRuntime.loadedBufferCount++;
                        if (bufferView) {
                            if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                                BABYLON.Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                            }
                            gltfRuntime.loadedBufferViews[buf] = bufferView;
                        }
                        if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                            onLoad();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                    });
                };
                for (var buf in gltfRuntime.buffers) {
                    hasBuffers = true;
                    var buffer = gltfRuntime.buffers[buf];
                    if (buffer) {
                        processBuffer.bind(this, buf, buffer)();
                    }
                    else {
                        BABYLON.Tools.Error("No buffer named: " + buf);
                    }
                }
                if (!hasBuffers) {
                    onLoad();
                }
            };
            GLTFLoader.prototype._createNodes = function (gltfRuntime) {
                var currentScene = gltfRuntime.currentScene;
                if (currentScene) {
                    // Only one scene even if multiple scenes are defined
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
                else {
                    // Load all scenes
                    for (var thing in gltfRuntime.scenes) {
                        currentScene = gltfRuntime.scenes[thing];
                        for (var i = 0; i < currentScene.nodes.length; i++) {
                            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                        }
                    }
                }
            };
            GLTFLoader.Extensions = {};
            return GLTFLoader;
        }());
        GLTF1.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader._CreateGLTFLoaderV1 = function () { return new GLTFLoader(); };
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = /** @class */ (function () {
            function GLTFUtils() {
            }
            /**
             * Sets the given "parameter" matrix
             * @param scene: the Scene object
             * @param source: the source node where to pick the matrix
             * @param parameter: the GLTF technique parameter
             * @param uniformName: the name of the shader's uniform
             * @param shaderMaterial: the shader material
             */
            GLTFUtils.SetMatrix = function (scene, source, parameter, uniformName, shaderMaterial) {
                var mat = null;
                if (parameter.semantic === "MODEL") {
                    mat = source.getWorldMatrix();
                }
                else if (parameter.semantic === "PROJECTION") {
                    mat = scene.getProjectionMatrix();
                }
                else if (parameter.semantic === "VIEW") {
                    mat = scene.getViewMatrix();
                }
                else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
                }
                else if (parameter.semantic === "MODELVIEW") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
                }
                else if (parameter.semantic === "MODELVIEWPROJECTION") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
                }
                else if (parameter.semantic === "MODELINVERSE") {
                    mat = source.getWorldMatrix().invert();
                }
                else if (parameter.semantic === "VIEWINVERSE") {
                    mat = scene.getViewMatrix().invert();
                }
                else if (parameter.semantic === "PROJECTIONINVERSE") {
                    mat = scene.getProjectionMatrix().invert();
                }
                else if (parameter.semantic === "MODELVIEWINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
                }
                else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
                }
                else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().invert());
                }
                else {
                    debugger;
                }
                if (mat) {
                    switch (parameter.type) {
                        case GLTF1.EParameterType.FLOAT_MAT2:
                            shaderMaterial.setMatrix2x2(uniformName, BABYLON.Matrix.GetAsMatrix2x2(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT3:
                            shaderMaterial.setMatrix3x3(uniformName, BABYLON.Matrix.GetAsMatrix3x3(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT4:
                            shaderMaterial.setMatrix(uniformName, mat);
                            break;
                        default: break;
                    }
                }
            };
            /**
             * Sets the given "parameter" matrix
             * @param shaderMaterial: the shader material
             * @param uniform: the name of the shader's uniform
             * @param value: the value of the uniform
             * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
             */
            GLTFUtils.SetUniform = function (shaderMaterial, uniform, value, type) {
                switch (type) {
                    case GLTF1.EParameterType.FLOAT:
                        shaderMaterial.setFloat(uniform, value);
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC2:
                        shaderMaterial.setVector2(uniform, BABYLON.Vector2.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC3:
                        shaderMaterial.setVector3(uniform, BABYLON.Vector3.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC4:
                        shaderMaterial.setVector4(uniform, BABYLON.Vector4.FromArray(value));
                        return true;
                    default: return false;
                }
            };
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureFilterType.LINEAR:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF1.ETextureFilterType.NEAREST:
                    case GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                }
            };
            GLTFUtils.GetBufferFromBufferView = function (gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
                var byteOffset = bufferView.byteOffset + byteOffset;
                var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
                if (byteOffset + byteLength > loadedBufferView.byteLength) {
                    throw new Error("Buffer access is out of range");
                }
                var buffer = loadedBufferView.buffer;
                byteOffset += loadedBufferView.byteOffset;
                switch (componentType) {
                    case GLTF1.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                    default: return new Float32Array(buffer, byteOffset, byteLength);
                }
            };
            /**
             * Returns a buffer from its accessor
             * @param gltfRuntime: the GLTF runtime
             * @param accessor: the GLTF accessor
             */
            GLTFUtils.GetBufferFromAccessor = function (gltfRuntime, accessor) {
                var bufferView = gltfRuntime.bufferViews[accessor.bufferView];
                var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
                return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            /**
             * Returns the default material of gltf. Related to
             * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
             * @param scene: the Babylon.js scene
             */
            GLTFUtils.GetDefaultMaterial = function (scene) {
                if (!GLTFUtils._DefaultMaterial) {
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                        "precision highp float;",
                        "",
                        "uniform mat4 worldView;",
                        "uniform mat4 projection;",
                        "",
                        "attribute vec3 position;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_Position = projection * worldView * vec4(position, 1.0);",
                        "}"
                    ].join("\n");
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                        "precision highp float;",
                        "",
                        "uniform vec4 u_emission;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_FragColor = u_emission;",
                        "}"
                    ].join("\n");
                    var shaderPath = {
                        vertex: "GLTFDefaultMaterial",
                        fragment: "GLTFDefaultMaterial"
                    };
                    var options = {
                        attributes: ["position"],
                        uniforms: ["worldView", "projection", "u_emission"],
                        samplers: new Array(),
                        needAlphaBlending: false
                    };
                    GLTFUtils._DefaultMaterial = new BABYLON.ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
                    GLTFUtils._DefaultMaterial.setColor4("u_emission", new BABYLON.Color4(0.5, 0.5, 0.5, 1.0));
                }
                return GLTFUtils._DefaultMaterial;
            };
            // The GLTF default material
            GLTFUtils._DefaultMaterial = null;
            return GLTFUtils;
        }());
        GLTF1.GLTFUtils = GLTFUtils;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(name) {
                this._name = name;
            }
            Object.defineProperty(GLTFLoaderExtension.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            /**
            * Defines an override for loading the runtime
            * Return true to stop further extensions from loading the runtime
            */
            GLTFLoaderExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                return false;
            };
            /**
             * Defines an onverride for creating gltf runtime
             * Return true to stop further extensions from creating the runtime
             */
            GLTFLoaderExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading buffers
            * Return true to stop further extensions from loading this buffer
            */
            GLTFLoaderExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                return false;
            };
            /**
            * Defines an override for loading texture buffers
            * Return true to stop further extensions from loading this texture data
            */
            GLTFLoaderExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for creating textures
            * Return true to stop further extensions from loading this texture
            */
            GLTFLoaderExtension.prototype.createTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading shader strings
            * Return true to stop further extensions from loading this shader data
            */
            GLTFLoaderExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading materials
            * Return true to stop further extensions from loading this material
            */
            GLTFLoaderExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            // ---------
            // Utilities
            // ---------
            GLTFLoaderExtension.LoadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        if (!onSuccess) {
                            return;
                        }
                        onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                    });
                });
            };
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess();
                    });
                });
            };
            GLTFLoaderExtension.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                });
            };
            GLTFLoaderExtension.LoadTextureAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    if (buffer) {
                        GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                    }
                }, onError);
            };
            GLTFLoaderExtension.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.ApplyExtensions = function (func, defaultFunc) {
                for (var extensionName in GLTF1.GLTFLoader.Extensions) {
                    var loaderExtension = GLTF1.GLTFLoader.Extensions[extensionName];
                    if (func(loaderExtension)) {
                        return;
                    }
                }
                defaultFunc();
            };
            return GLTFLoaderExtension;
        }());
        GLTF1.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var BinaryExtensionBufferName = "binary_glTF";
        var GLTFBinaryExtension = /** @class */ (function (_super) {
            __extends(GLTFBinaryExtension, _super);
            function GLTFBinaryExtension() {
                return _super.call(this, "KHR_binary_glTF") || this;
            }
            GLTFBinaryExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                var extensionsUsed = data.json.extensionsUsed;
                if (!extensionsUsed || extensionsUsed.indexOf(this.name) === -1 || !data.bin) {
                    return false;
                }
                this._bin = data.bin;
                onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                return true;
            };
            GLTFBinaryExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                    return false;
                }
                if (id !== BinaryExtensionBufferName) {
                    return false;
                }
                onSuccess(this._bin);
                return true;
            };
            GLTFBinaryExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                var source = gltfRuntime.images[texture.source];
                if (!source.extensions || !(this.name in source.extensions)) {
                    return false;
                }
                var sourceExt = source.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
                var buffer = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                onSuccess(buffer);
                return true;
            };
            GLTFBinaryExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (!shader.extensions || !(this.name in shader.extensions)) {
                    return false;
                }
                var binaryExtensionShader = shader.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
                var shaderBytes = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                setTimeout(function () {
                    var shaderString = GLTF1.GLTFUtils.DecodeBufferToText(shaderBytes);
                    onSuccess(shaderString);
                });
                return true;
            };
            return GLTFBinaryExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFBinaryExtension = GLTFBinaryExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFBinaryExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFBinaryExtension.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var GLTFMaterialsCommonExtension = /** @class */ (function (_super) {
            __extends(GLTFMaterialsCommonExtension, _super);
            function GLTFMaterialsCommonExtension() {
                return _super.call(this, "KHR_materials_common") || this;
            }
            GLTFMaterialsCommonExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                if (!gltfRuntime.extensions) {
                    return false;
                }
                var extension = gltfRuntime.extensions[this.name];
                if (!extension) {
                    return false;
                }
                // Create lights
                var lights = extension.lights;
                if (lights) {
                    for (var thing in lights) {
                        var light = lights[thing];
                        switch (light.type) {
                            case "ambient":
                                var ambientLight = new BABYLON.HemisphericLight(light.name, new BABYLON.Vector3(0, 1, 0), gltfRuntime.scene);
                                var ambient = light.ambient;
                                if (ambient) {
                                    ambientLight.diffuse = BABYLON.Color3.FromArray(ambient.color || [1, 1, 1]);
                                }
                                break;
                            case "point":
                                var pointLight = new BABYLON.PointLight(light.name, new BABYLON.Vector3(10, 10, 10), gltfRuntime.scene);
                                var point = light.point;
                                if (point) {
                                    pointLight.diffuse = BABYLON.Color3.FromArray(point.color || [1, 1, 1]);
                                }
                                break;
                            case "directional":
                                var dirLight = new BABYLON.DirectionalLight(light.name, new BABYLON.Vector3(0, -1, 0), gltfRuntime.scene);
                                var directional = light.directional;
                                if (directional) {
                                    dirLight.diffuse = BABYLON.Color3.FromArray(directional.color || [1, 1, 1]);
                                }
                                break;
                            case "spot":
                                var spot = light.spot;
                                if (spot) {
                                    var spotLight = new BABYLON.SpotLight(light.name, new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), spot.fallOffAngle || Math.PI, spot.fallOffExponent || 0.0, gltfRuntime.scene);
                                    spotLight.diffuse = BABYLON.Color3.FromArray(spot.color || [1, 1, 1]);
                                }
                                break;
                            default:
                                BABYLON.Tools.Warn("GLTF Material Common extension: light type \"" + light.type + "\â€ not supported");
                                break;
                        }
                    }
                }
                return false;
            };
            GLTFMaterialsCommonExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material || !material.extensions) {
                    return false;
                }
                var extension = material.extensions[this.name];
                if (!extension) {
                    return false;
                }
                var standardMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                standardMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (extension.technique === "CONSTANT") {
                    standardMaterial.disableLighting = true;
                }
                standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
                standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
                standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;
                // Ambient
                if (typeof extension.values.ambient === "string") {
                    this._loadTexture(gltfRuntime, extension.values.ambient, standardMaterial, "ambientTexture", onError);
                }
                else {
                    standardMaterial.ambientColor = BABYLON.Color3.FromArray(extension.values.ambient || [0, 0, 0]);
                }
                // Diffuse
                if (typeof extension.values.diffuse === "string") {
                    this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onError);
                }
                else {
                    standardMaterial.diffuseColor = BABYLON.Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
                }
                // Emission
                if (typeof extension.values.emission === "string") {
                    this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onError);
                }
                else {
                    standardMaterial.emissiveColor = BABYLON.Color3.FromArray(extension.values.emission || [0, 0, 0]);
                }
                // Specular
                if (typeof extension.values.specular === "string") {
                    this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onError);
                }
                else {
                    standardMaterial.specularColor = BABYLON.Color3.FromArray(extension.values.specular || [0, 0, 0]);
                }
                return true;
            };
            GLTFMaterialsCommonExtension.prototype._loadTexture = function (gltfRuntime, id, material, propertyPath, onError) {
                // Create buffer from texture url
                GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    // Create texture from buffer
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, function (texture) { return material[propertyPath] = texture; }, onError);
                }, onError);
            };
            return GLTFMaterialsCommonExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFMaterialsCommonExtension = GLTFMaterialsCommonExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialsCommonExtension.js.map



//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map


/**
 * Defines the module for importing and exporting glTF 2.0 assets
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Helper class for working with arrays when loading the glTF asset
         */
        var ArrayItem = /** @class */ (function () {
            function ArrayItem() {
            }
            /**
             * Gets an item from the given array.
             * @param context The context when loading the asset
             * @param array The array to get the item from
             * @param index The index to the array
             * @returns The array item
             */
            ArrayItem.Get = function (context, array, index) {
                if (!array || index == undefined || !array[index]) {
                    throw new Error(context + ": Failed to find index (" + index + ")");
                }
                return array[index];
            };
            /**
             * Assign an `index` field to each item of the given array.
             * @param array The array of items
             */
            ArrayItem.Assign = function (array) {
                if (array) {
                    for (var index = 0; index < array.length; index++) {
                        array[index].index = index;
                    }
                }
            };
            return ArrayItem;
        }());
        GLTF2.ArrayItem = ArrayItem;
        /**
         * The glTF 2.0 loader
         */
        var GLTFLoader = /** @class */ (function () {
            /** @hidden */
            function GLTFLoader(parent) {
                /** @hidden */
                this._completePromises = new Array();
                this._disposed = false;
                this._state = null;
                this._extensions = {};
                this._defaultBabylonMaterialData = {};
                this._requests = new Array();
                this._parent = parent;
            }
            /**
             * Registers a loader extension.
             * @param name The name of the loader extension.
             * @param factory The factory function that creates the loader extension.
             */
            GLTFLoader.RegisterExtension = function (name, factory) {
                if (GLTFLoader.UnregisterExtension(name)) {
                    BABYLON.Tools.Warn("Extension with the name '" + name + "' already exists");
                }
                GLTFLoader._ExtensionFactories[name] = factory;
                // Keep the order of registration so that extensions registered first are called first.
                GLTFLoader._ExtensionNames.push(name);
            };
            /**
             * Unregisters a loader extension.
             * @param name The name of the loader extenion.
             * @returns A boolean indicating whether the extension has been unregistered
             */
            GLTFLoader.UnregisterExtension = function (name) {
                if (!GLTFLoader._ExtensionFactories[name]) {
                    return false;
                }
                delete GLTFLoader._ExtensionFactories[name];
                var index = GLTFLoader._ExtensionNames.indexOf(name);
                if (index !== -1) {
                    GLTFLoader._ExtensionNames.splice(index, 1);
                }
                return true;
            };
            Object.defineProperty(GLTFLoader.prototype, "state", {
                /**
                 * Gets the loader state.
                 */
                get: function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            /** @hidden */
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    request.abort();
                }
                this._requests.length = 0;
                delete this.gltf;
                delete this.babylonScene;
                this._completePromises.length = 0;
                for (var name_1 in this._extensions) {
                    var extension = this._extensions[name_1];
                    if (extension.dispose) {
                        this._extensions[name_1].dispose();
                    }
                }
                this._extensions = {};
                delete this._rootBabylonMesh;
                delete this._progressCallback;
                this._parent._clear();
            };
            /** @hidden */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress, fileName) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this.babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._fileName = fileName || "scene";
                    _this._progressCallback = onProgress;
                    _this._loadData(data);
                    var nodes = null;
                    if (meshesNames) {
                        var nodeMap_1 = {};
                        if (_this.gltf.nodes) {
                            for (var _i = 0, _a = _this.gltf.nodes; _i < _a.length; _i++) {
                                var node = _a[_i];
                                if (node.name) {
                                    nodeMap_1[node.name] = node.index;
                                }
                            }
                        }
                        var names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                        nodes = names.map(function (name) {
                            var node = nodeMap_1[name];
                            if (node === undefined) {
                                throw new Error("Failed to find node '" + name + "'");
                            }
                            return node;
                        });
                    }
                    return _this._loadAsync(nodes, function () {
                        return {
                            meshes: _this._getMeshes(),
                            particleSystems: [],
                            skeletons: _this._getSkeletons(),
                            animationGroups: _this._getAnimationGroups()
                        };
                    });
                });
            };
            /** @hidden */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this.babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._fileName = fileName || "scene";
                    _this._progressCallback = onProgress;
                    _this._loadData(data);
                    return _this._loadAsync(null, function () { return undefined; });
                });
            };
            GLTFLoader.prototype._loadAsync = function (nodes, resultFunc) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this._uniqueRootUrl = (_this._rootUrl.indexOf("file:") === -1 && _this._fileName) ? _this._rootUrl : "" + _this._rootUrl + Date.now() + "/";
                    _this._loadExtensions();
                    _this._checkExtensions();
                    var loadingToReadyCounterName = BABYLON.GLTFLoaderState[BABYLON.GLTFLoaderState.LOADING] + " => " + BABYLON.GLTFLoaderState[BABYLON.GLTFLoaderState.READY];
                    var loadingToCompleteCounterName = BABYLON.GLTFLoaderState[BABYLON.GLTFLoaderState.LOADING] + " => " + BABYLON.GLTFLoaderState[BABYLON.GLTFLoaderState.COMPLETE];
                    _this._parent._startPerformanceCounter(loadingToReadyCounterName);
                    _this._parent._startPerformanceCounter(loadingToCompleteCounterName);
                    _this._setState(BABYLON.GLTFLoaderState.LOADING);
                    _this._extensionsOnLoading();
                    var promises = new Array();
                    if (nodes) {
                        promises.push(_this.loadSceneAsync("/nodes", { nodes: nodes, index: -1 }));
                    }
                    else {
                        var scene = ArrayItem.Get("/scene", _this.gltf.scenes, _this.gltf.scene || 0);
                        promises.push(_this.loadSceneAsync("/scenes/" + scene.index, scene));
                    }
                    if (_this._parent.compileMaterials) {
                        promises.push(_this._compileMaterialsAsync());
                    }
                    if (_this._parent.compileShadowGenerators) {
                        promises.push(_this._compileShadowGeneratorsAsync());
                    }
                    var resultPromise = Promise.all(promises).then(function () {
                        if (_this._rootBabylonMesh) {
                            _this._rootBabylonMesh.setEnabled(true);
                        }
                        _this._setState(BABYLON.GLTFLoaderState.READY);
                        _this._extensionsOnReady();
                        _this._startAnimations();
                        return resultFunc();
                    });
                    resultPromise.then(function () {
                        _this._parent._endPerformanceCounter(loadingToReadyCounterName);
                        BABYLON.Tools.SetImmediate(function () {
                            if (!_this._disposed) {
                                Promise.all(_this._completePromises).then(function () {
                                    _this._parent._endPerformanceCounter(loadingToCompleteCounterName);
                                    _this._setState(BABYLON.GLTFLoaderState.COMPLETE);
                                    _this._parent.onCompleteObservable.notifyObservers(undefined);
                                    _this._parent.onCompleteObservable.clear();
                                    _this.dispose();
                                }, function (error) {
                                    _this._parent.onErrorObservable.notifyObservers(error);
                                    _this._parent.onErrorObservable.clear();
                                    _this.dispose();
                                });
                            }
                        });
                    });
                    return resultPromise;
                }, function (error) {
                    if (!_this._disposed) {
                        _this._parent.onErrorObservable.notifyObservers(error);
                        _this._parent.onErrorObservable.clear();
                        _this.dispose();
                    }
                    throw error;
                });
            };
            GLTFLoader.prototype._loadData = function (data) {
                this.gltf = data.json;
                this._setupData();
                if (data.bin) {
                    var buffers = this.gltf.buffers;
                    if (buffers && buffers[0] && !buffers[0].uri) {
                        var binaryBuffer = buffers[0];
                        if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                            BABYLON.Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                        }
                        binaryBuffer._data = Promise.resolve(data.bin);
                    }
                    else {
                        BABYLON.Tools.Warn("Unexpected BIN chunk");
                    }
                }
            };
            GLTFLoader.prototype._setupData = function () {
                ArrayItem.Assign(this.gltf.accessors);
                ArrayItem.Assign(this.gltf.animations);
                ArrayItem.Assign(this.gltf.buffers);
                ArrayItem.Assign(this.gltf.bufferViews);
                ArrayItem.Assign(this.gltf.cameras);
                ArrayItem.Assign(this.gltf.images);
                ArrayItem.Assign(this.gltf.materials);
                ArrayItem.Assign(this.gltf.meshes);
                ArrayItem.Assign(this.gltf.nodes);
                ArrayItem.Assign(this.gltf.samplers);
                ArrayItem.Assign(this.gltf.scenes);
                ArrayItem.Assign(this.gltf.skins);
                ArrayItem.Assign(this.gltf.textures);
                if (this.gltf.nodes) {
                    var nodeParents = {};
                    for (var _i = 0, _a = this.gltf.nodes; _i < _a.length; _i++) {
                        var node = _a[_i];
                        if (node.children) {
                            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                                var index = _c[_b];
                                nodeParents[index] = node.index;
                            }
                        }
                    }
                    var rootNode = this._createRootNode();
                    for (var _d = 0, _e = this.gltf.nodes; _d < _e.length; _d++) {
                        var node = _e[_d];
                        var parentIndex = nodeParents[node.index];
                        node.parent = parentIndex === undefined ? rootNode : this.gltf.nodes[parentIndex];
                    }
                }
            };
            GLTFLoader.prototype._loadExtensions = function () {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_2 = _a[_i];
                    var extension = GLTFLoader._ExtensionFactories[name_2](this);
                    this._extensions[name_2] = extension;
                    this._parent.onExtensionLoadedObservable.notifyObservers(extension);
                }
                this._parent.onExtensionLoadedObservable.clear();
            };
            GLTFLoader.prototype._checkExtensions = function () {
                if (this.gltf.extensionsRequired) {
                    for (var _i = 0, _a = this.gltf.extensionsRequired; _i < _a.length; _i++) {
                        var name_3 = _a[_i];
                        var extension = this._extensions[name_3];
                        if (!extension || !extension.enabled) {
                            throw new Error("Require extension " + name_3 + " is not available");
                        }
                    }
                }
            };
            GLTFLoader.prototype._setState = function (state) {
                this._state = state;
                this.log(BABYLON.GLTFLoaderState[this._state]);
            };
            GLTFLoader.prototype._createRootNode = function () {
                this._rootBabylonMesh = new BABYLON.Mesh("__root__", this.babylonScene);
                this._rootBabylonMesh.setEnabled(false);
                var rootNode = {
                    _babylonTransformNode: this._rootBabylonMesh,
                    index: -1
                };
                switch (this._parent.coordinateSystemMode) {
                    case BABYLON.GLTFLoaderCoordinateSystemMode.AUTO: {
                        if (!this.babylonScene.useRightHandedSystem) {
                            rootNode.rotation = [0, 1, 0, 0];
                            rootNode.scale = [1, 1, -1];
                            GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                        this.babylonScene.useRightHandedSystem = true;
                        break;
                    }
                    default: {
                        throw new Error("Invalid coordinate system mode (" + this._parent.coordinateSystemMode + ")");
                    }
                }
                this._parent.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
                return rootNode;
            };
            /**
             * Loads a glTF scene.
             * @param context The context when loading the asset
             * @param scene The glTF scene property
             * @returns A promise that resolves when the load is complete
             */
            GLTFLoader.prototype.loadSceneAsync = function (context, scene) {
                var _this = this;
                var extensionPromise = this._extensionsLoadSceneAsync(context, scene);
                if (extensionPromise) {
                    return extensionPromise;
                }
                var promises = new Array();
                this.logOpen(context + " " + (scene.name || ""));
                if (scene.nodes) {
                    for (var _i = 0, _a = scene.nodes; _i < _a.length; _i++) {
                        var index = _a[_i];
                        var node = ArrayItem.Get(context + "/nodes/" + index, this.gltf.nodes, index);
                        promises.push(this.loadNodeAsync("/nodes/" + node.index, node, function (babylonMesh) {
                            babylonMesh.parent = _this._rootBabylonMesh;
                        }));
                    }
                }
                // Link all Babylon bones for each glTF node with the corresponding Babylon transform node.
                // A glTF joint is a pointer to a glTF node in the glTF node hierarchy similar to Unity3D.
                if (this.gltf.nodes) {
                    for (var _b = 0, _c = this.gltf.nodes; _b < _c.length; _b++) {
                        var node = _c[_b];
                        if (node._babylonTransformNode && node._babylonBones) {
                            for (var _d = 0, _e = node._babylonBones; _d < _e.length; _d++) {
                                var babylonBone = _e[_d];
                                babylonBone.linkTransformNode(node._babylonTransformNode);
                            }
                        }
                    }
                }
                promises.push(this._loadAnimationsAsync());
                this.logClose();
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._forEachPrimitive = function (node, callback) {
                if (node._primitiveBabylonMeshes) {
                    for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                        var babylonMesh = _a[_i];
                        callback(babylonMesh);
                    }
                }
            };
            GLTFLoader.prototype._getMeshes = function () {
                var meshes = new Array();
                // Root mesh is always first.
                meshes.push(this._rootBabylonMesh);
                var nodes = this.gltf.nodes;
                if (nodes) {
                    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                        var node = nodes_1[_i];
                        this._forEachPrimitive(node, function (babylonMesh) {
                            meshes.push(babylonMesh);
                        });
                    }
                }
                return meshes;
            };
            GLTFLoader.prototype._getSkeletons = function () {
                var skeletons = new Array();
                var skins = this.gltf.skins;
                if (skins) {
                    for (var _i = 0, skins_1 = skins; _i < skins_1.length; _i++) {
                        var skin = skins_1[_i];
                        if (skin._data) {
                            skeletons.push(skin._data.babylonSkeleton);
                        }
                    }
                }
                return skeletons;
            };
            GLTFLoader.prototype._getAnimationGroups = function () {
                var animationGroups = new Array();
                var animations = this.gltf.animations;
                if (animations) {
                    for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                        var animation = animations_1[_i];
                        if (animation._babylonAnimationGroup) {
                            animationGroups.push(animation._babylonAnimationGroup);
                        }
                    }
                }
                return animationGroups;
            };
            GLTFLoader.prototype._startAnimations = function () {
                switch (this._parent.animationStartMode) {
                    case BABYLON.GLTFLoaderAnimationStartMode.NONE: {
                        // do nothing
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.FIRST: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        if (babylonAnimationGroups.length !== 0) {
                            babylonAnimationGroups[0].start(true);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.ALL: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        for (var _i = 0, babylonAnimationGroups_1 = babylonAnimationGroups; _i < babylonAnimationGroups_1.length; _i++) {
                            var babylonAnimationGroup = babylonAnimationGroups_1[_i];
                            babylonAnimationGroup.start(true);
                        }
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Invalid animation start mode (" + this._parent.animationStartMode + ")");
                        return;
                    }
                }
            };
            /**
             * Loads a glTF node.
             * @param context The context when loading the asset
             * @param node The glTF node property
             * @param assign A function called synchronously after parsing the glTF properties
             * @returns A promise that resolves with the loaded Babylon mesh when the load is complete
             */
            GLTFLoader.prototype.loadNodeAsync = function (context, node, assign) {
                var _this = this;
                if (assign === void 0) { assign = function () { }; }
                var extensionPromise = this._extensionsLoadNodeAsync(context, node, assign);
                if (extensionPromise) {
                    return extensionPromise;
                }
                if (node._babylonTransformNode) {
                    throw new Error(context + ": Invalid recursive node hierarchy");
                }
                var promises = new Array();
                this.logOpen(context + " " + (node.name || ""));
                var loadNode = function (babylonTransformNode) {
                    GLTFLoader.AddPointerMetadata(babylonTransformNode, context);
                    GLTFLoader._LoadTransform(node, babylonTransformNode);
                    if (node.camera != undefined) {
                        var camera = ArrayItem.Get(context + "/camera", _this.gltf.cameras, node.camera);
                        promises.push(_this.loadCameraAsync("/cameras/" + camera.index, camera, function (babylonCamera) {
                            babylonCamera.parent = babylonTransformNode;
                        }));
                    }
                    if (node.children) {
                        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                            var index = _a[_i];
                            var childNode = ArrayItem.Get(context + "/children/" + index, _this.gltf.nodes, index);
                            promises.push(_this.loadNodeAsync("/nodes/" + childNode.index, childNode, function (childBabylonMesh) {
                                childBabylonMesh.parent = babylonTransformNode;
                            }));
                        }
                    }
                    assign(babylonTransformNode);
                };
                if (node.mesh == undefined) {
                    var nodeName = node.name || "node" + node.index;
                    node._babylonTransformNode = new BABYLON.TransformNode(nodeName, this.babylonScene);
                    loadNode(node._babylonTransformNode);
                }
                else {
                    var mesh = ArrayItem.Get(context + "/mesh", this.gltf.meshes, node.mesh);
                    promises.push(this._loadMeshAsync("/meshes/" + mesh.index, node, mesh, loadNode));
                }
                this.logClose();
                return Promise.all(promises).then(function () {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh.refreshBoundingInfo(true);
                    });
                    return node._babylonTransformNode;
                });
            };
            GLTFLoader.prototype._loadMeshAsync = function (context, node, mesh, assign) {
                var primitives = mesh.primitives;
                if (!primitives || !primitives.length) {
                    throw new Error(context + ": Primitives are missing");
                }
                if (primitives[0].index == undefined) {
                    ArrayItem.Assign(primitives);
                }
                var promises = new Array();
                this.logOpen(context + " " + (mesh.name || ""));
                var name = node.name || "node" + node.index;
                if (primitives.length === 1) {
                    var primitive = mesh.primitives[0];
                    promises.push(this._loadMeshPrimitiveAsync(context + "/primitives/" + primitive.index, name, node, mesh, primitive, function (babylonMesh) {
                        node._babylonTransformNode = babylonMesh;
                        node._primitiveBabylonMeshes = [babylonMesh];
                    }));
                }
                else {
                    node._babylonTransformNode = new BABYLON.TransformNode(name, this.babylonScene);
                    node._primitiveBabylonMeshes = [];
                    for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                        var primitive = primitives_1[_i];
                        promises.push(this._loadMeshPrimitiveAsync(context + "/primitives/" + primitive.index, name + "_primitive" + primitive.index, node, mesh, primitive, function (babylonMesh) {
                            babylonMesh.parent = node._babylonTransformNode;
                            node._primitiveBabylonMeshes.push(babylonMesh);
                        }));
                    }
                }
                if (node.skin != undefined) {
                    var skin = ArrayItem.Get(context + "/skin", this.gltf.skins, node.skin);
                    promises.push(this._loadSkinAsync("/skins/" + skin.index, node, skin));
                }
                assign(node._babylonTransformNode);
                this.logClose();
                return Promise.all(promises).then(function () {
                    return node._babylonTransformNode;
                });
            };
            GLTFLoader.prototype._loadMeshPrimitiveAsync = function (context, name, node, mesh, primitive, assign) {
                var _this = this;
                this.logOpen("" + context);
                var canInstance = (node.skin == undefined && !mesh.primitives[0].targets);
                var babylonAbstractMesh;
                var promise;
                var instanceData = primitive._instanceData;
                if (canInstance && instanceData) {
                    babylonAbstractMesh = instanceData.babylonSourceMesh.createInstance(name);
                    promise = instanceData.promise;
                }
                else {
                    var promises = new Array();
                    var babylonMesh_1 = new BABYLON.Mesh(name, this.babylonScene);
                    this._createMorphTargets(context, node, mesh, primitive, babylonMesh_1);
                    promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh_1).then(function (babylonGeometry) {
                        return _this._loadMorphTargetsAsync(context, primitive, babylonMesh_1, babylonGeometry).then(function () {
                            babylonGeometry.applyToMesh(babylonMesh_1);
                        });
                    }));
                    var babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
                    if (primitive.material == undefined) {
                        var babylonMaterial = this._defaultBabylonMaterialData[babylonDrawMode];
                        if (!babylonMaterial) {
                            babylonMaterial = this._createDefaultMaterial("__gltf_default", babylonDrawMode);
                            this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                            this._defaultBabylonMaterialData[babylonDrawMode] = babylonMaterial;
                        }
                        babylonMesh_1.material = babylonMaterial;
                    }
                    else {
                        var material = ArrayItem.Get(context + "/material", this.gltf.materials, primitive.material);
                        promises.push(this._loadMaterialAsync("/materials/" + material.index, material, babylonMesh_1, babylonDrawMode, function (babylonMaterial) {
                            babylonMesh_1.material = babylonMaterial;
                        }));
                    }
                    promise = Promise.all(promises);
                    if (canInstance) {
                        primitive._instanceData = {
                            babylonSourceMesh: babylonMesh_1,
                            promise: promise
                        };
                    }
                    babylonAbstractMesh = babylonMesh_1;
                }
                GLTFLoader.AddPointerMetadata(babylonAbstractMesh, context);
                this._parent.onMeshLoadedObservable.notifyObservers(babylonAbstractMesh);
                assign(babylonAbstractMesh);
                this.logClose();
                return promise.then(function () {
                    return babylonAbstractMesh;
                });
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                var _this = this;
                var extensionPromise = this._extensionsLoadVertexDataAsync(context, primitive, babylonMesh);
                if (extensionPromise) {
                    return extensionPromise;
                }
                var attributes = primitive.attributes;
                if (!attributes) {
                    throw new Error(context + ": Attributes are missing");
                }
                var promises = new Array();
                var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, this.babylonScene);
                if (primitive.indices == undefined) {
                    babylonMesh.isUnIndexed = true;
                }
                else {
                    var accessor = ArrayItem.Get(context + "/indices", this.gltf.accessors, primitive.indices);
                    promises.push(this._loadIndicesAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                        babylonGeometry.setIndices(data);
                    }));
                }
                var loadAttribute = function (attribute, kind, callback) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                    if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                        babylonMesh._delayInfo.push(kind);
                    }
                    var accessor = ArrayItem.Get(context + "/attributes/" + attribute, _this.gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadVertexAccessorAsync("/accessors/" + accessor.index, accessor, kind).then(function (babylonVertexBuffer) {
                        babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
                    }));
                    if (callback) {
                        callback(accessor);
                    }
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind, function (accessor) {
                    if (accessor.type === "VEC4" /* VEC4 */) {
                        babylonMesh.hasVertexAlpha = true;
                    }
                });
                return Promise.all(promises).then(function () {
                    return babylonGeometry;
                });
            };
            GLTFLoader.prototype._createMorphTargets = function (context, node, mesh, primitive, babylonMesh) {
                if (!primitive.targets) {
                    return;
                }
                if (node._numMorphTargets == undefined) {
                    node._numMorphTargets = primitive.targets.length;
                }
                else if (primitive.targets.length !== node._numMorphTargets) {
                    throw new Error(context + ": Primitives do not have the same number of targets");
                }
                babylonMesh.morphTargetManager = new BABYLON.MorphTargetManager();
                for (var index = 0; index < primitive.targets.length; index++) {
                    var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                    babylonMesh.morphTargetManager.addTarget(new BABYLON.MorphTarget("morphTarget" + index, weight));
                    // TODO: tell the target whether it has positions, normals, tangents
                }
            };
            GLTFLoader.prototype._loadMorphTargetsAsync = function (context, primitive, babylonMesh, babylonGeometry) {
                if (!primitive.targets) {
                    return Promise.resolve();
                }
                var promises = new Array();
                var morphTargetManager = babylonMesh.morphTargetManager;
                for (var index = 0; index < morphTargetManager.numTargets; index++) {
                    var babylonMorphTarget = morphTargetManager.getTarget(index);
                    promises.push(this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, babylonGeometry, primitive.targets[index], babylonMorphTarget));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, babylonGeometry, attributes, babylonMorphTarget) {
                var _this = this;
                var promises = new Array();
                var loadAttribute = function (attribute, kind, setData) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    var babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
                    if (!babylonVertexBuffer) {
                        return;
                    }
                    var accessor = ArrayItem.Get(context + "/" + attribute, _this.gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                        setData(babylonVertexBuffer, data);
                    }));
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setPositions(data);
                });
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setNormals(data);
                });
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind, function (babylonVertexBuffer, data) {
                    var dataIndex = 0;
                    babylonVertexBuffer.forEach(data.length / 3 * 4, function (value, index) {
                        // Tangent data for morph targets is stored as xyz delta.
                        // The vertexData.tangent is stored as xyzw.
                        // So we need to skip every fourth vertexData.tangent.
                        if (((index + 1) % 4) !== 0) {
                            data[dataIndex++] += value;
                        }
                    });
                    babylonMorphTarget.setTangents(data);
                });
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader._LoadTransform = function (node, babylonNode) {
                // Ignore the TRS of skinned nodes.
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                if (node.skin != undefined) {
                    return;
                }
                var position = BABYLON.Vector3.Zero();
                var rotation = BABYLON.Quaternion.Identity();
                var scaling = BABYLON.Vector3.One();
                if (node.matrix) {
                    var matrix = BABYLON.Matrix.FromArray(node.matrix);
                    matrix.decompose(scaling, rotation, position);
                }
                else {
                    if (node.translation) {
                        position = BABYLON.Vector3.FromArray(node.translation);
                    }
                    if (node.rotation) {
                        rotation = BABYLON.Quaternion.FromArray(node.rotation);
                    }
                    if (node.scale) {
                        scaling = BABYLON.Vector3.FromArray(node.scale);
                    }
                }
                babylonNode.position = position;
                babylonNode.rotationQuaternion = rotation;
                babylonNode.scaling = scaling;
            };
            GLTFLoader.prototype._loadSkinAsync = function (context, node, skin) {
                var _this = this;
                var assignSkeleton = function (skeleton) {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh.skeleton = skeleton;
                    });
                };
                if (skin._data) {
                    assignSkeleton(skin._data.babylonSkeleton);
                    return skin._data.promise;
                }
                var skeletonId = "skeleton" + skin.index;
                var babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this.babylonScene);
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                babylonSkeleton.overrideMesh = this._rootBabylonMesh;
                this._loadBones(context, skin, babylonSkeleton);
                assignSkeleton(babylonSkeleton);
                var promise = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(function (inverseBindMatricesData) {
                    _this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
                });
                skin._data = {
                    babylonSkeleton: babylonSkeleton,
                    promise: promise
                };
                return promise;
            };
            GLTFLoader.prototype._loadBones = function (context, skin, babylonSkeleton) {
                var babylonBones = {};
                for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = ArrayItem.Get(context + "/joints/" + index, this.gltf.nodes, index);
                    this._loadBone(node, skin, babylonSkeleton, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, babylonSkeleton, babylonBones) {
                var babylonBone = babylonBones[node.index];
                if (babylonBone) {
                    return babylonBone;
                }
                var babylonParentBone = null;
                if (node.parent && node.parent._babylonTransformNode !== this._rootBabylonMesh) {
                    babylonParentBone = this._loadBone(node.parent, skin, babylonSkeleton, babylonBones);
                }
                var boneIndex = skin.joints.indexOf(node.index);
                babylonBone = new BABYLON.Bone(node.name || "joint" + node.index, babylonSkeleton, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
                babylonBones[node.index] = babylonBone;
                node._babylonBones = node._babylonBones || [];
                node._babylonBones.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadSkinInverseBindMatricesDataAsync = function (context, skin) {
                if (skin.inverseBindMatrices == undefined) {
                    return Promise.resolve(null);
                }
                var accessor = ArrayItem.Get(context + "/inverseBindMatrices", this.gltf.accessors, skin.inverseBindMatrices);
                return this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor);
            };
            GLTFLoader.prototype._updateBoneMatrices = function (babylonSkeleton, inverseBindMatricesData) {
                for (var _i = 0, _a = babylonSkeleton.bones; _i < _a.length; _i++) {
                    var babylonBone = _a[_i];
                    var baseMatrix = BABYLON.Matrix.Identity();
                    var boneIndex = babylonBone._index;
                    if (inverseBindMatricesData && boneIndex !== -1) {
                        BABYLON.Matrix.FromArrayToRef(inverseBindMatricesData, boneIndex * 16, baseMatrix);
                        baseMatrix.invertToRef(baseMatrix);
                    }
                    var babylonParentBone = babylonBone.getParent();
                    if (babylonParentBone) {
                        baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                    }
                    babylonBone.updateMatrix(baseMatrix, false, false);
                    babylonBone._updateDifferenceMatrix(undefined, false);
                }
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
            };
            /**
             * Loads a glTF camera.
             * @param context The context when loading the asset
             * @param camera The glTF camera property
             * @param assign A function called synchronously after parsing the glTF properties
             * @returns A promise that resolves with the loaded Babylon camera when the load is complete
             */
            GLTFLoader.prototype.loadCameraAsync = function (context, camera, assign) {
                if (assign === void 0) { assign = function () { }; }
                var extensionPromise = this._extensionsLoadCameraAsync(context, camera, assign);
                if (extensionPromise) {
                    return extensionPromise;
                }
                var promises = new Array();
                this.logOpen(context + " " + (camera.name || ""));
                var babylonCamera = new BABYLON.FreeCamera(camera.name || "camera" + camera.index, BABYLON.Vector3.Zero(), this.babylonScene, false);
                babylonCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                switch (camera.type) {
                    case "perspective" /* PERSPECTIVE */: {
                        var perspective = camera.perspective;
                        if (!perspective) {
                            throw new Error(context + ": Camera perspective properties are missing");
                        }
                        babylonCamera.fov = perspective.yfov;
                        babylonCamera.minZ = perspective.znear;
                        babylonCamera.maxZ = perspective.zfar || Number.MAX_VALUE;
                        break;
                    }
                    case "orthographic" /* ORTHOGRAPHIC */: {
                        if (!camera.orthographic) {
                            throw new Error(context + ": Camera orthographic properties are missing");
                        }
                        babylonCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        babylonCamera.orthoLeft = -camera.orthographic.xmag;
                        babylonCamera.orthoRight = camera.orthographic.xmag;
                        babylonCamera.orthoBottom = -camera.orthographic.ymag;
                        babylonCamera.orthoTop = camera.orthographic.ymag;
                        babylonCamera.minZ = camera.orthographic.znear;
                        babylonCamera.maxZ = camera.orthographic.zfar;
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid camera type (" + camera.type + ")");
                    }
                }
                GLTFLoader.AddPointerMetadata(babylonCamera, context);
                this._parent.onCameraLoadedObservable.notifyObservers(babylonCamera);
                assign(babylonCamera);
                return Promise.all(promises).then(function () {
                    return babylonCamera;
                });
            };
            GLTFLoader.prototype._loadAnimationsAsync = function () {
                var animations = this.gltf.animations;
                if (!animations) {
                    return Promise.resolve();
                }
                var promises = new Array();
                for (var index = 0; index < animations.length; index++) {
                    var animation = animations[index];
                    promises.push(this.loadAnimationAsync("/animations/" + animation.index, animation));
                }
                return Promise.all(promises).then(function () { });
            };
            /**
             * Loads a glTF animation.
             * @param context The context when loading the asset
             * @param animation The glTF animation property
             * @returns A promise that resolves with the loaded Babylon animation group when the load is complete
             */
            GLTFLoader.prototype.loadAnimationAsync = function (context, animation) {
                var promise = this._extensionsLoadAnimationAsync(context, animation);
                if (promise) {
                    return promise;
                }
                var babylonAnimationGroup = new BABYLON.AnimationGroup(animation.name || "animation" + animation.index, this.babylonScene);
                animation._babylonAnimationGroup = babylonAnimationGroup;
                var promises = new Array();
                ArrayItem.Assign(animation.channels);
                ArrayItem.Assign(animation.samplers);
                for (var _i = 0, _a = animation.channels; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    promises.push(this._loadAnimationChannelAsync(context + "/channels/" + channel.index, context, animation, channel, babylonAnimationGroup));
                }
                return Promise.all(promises).then(function () {
                    babylonAnimationGroup.normalize(0);
                    return babylonAnimationGroup;
                });
            };
            GLTFLoader.prototype._loadAnimationChannelAsync = function (context, animationContext, animation, channel, babylonAnimationGroup) {
                var _this = this;
                if (channel.target.node == undefined) {
                    return Promise.resolve();
                }
                var targetNode = ArrayItem.Get(context + "/target/node", this.gltf.nodes, channel.target.node);
                // Ignore animations that have no animation targets.
                if ((channel.target.path === "weights" /* WEIGHTS */ && !targetNode._numMorphTargets) ||
                    (channel.target.path !== "weights" /* WEIGHTS */ && !targetNode._babylonTransformNode)) {
                    return Promise.resolve();
                }
                var sampler = ArrayItem.Get(context + "/sampler", animation.samplers, channel.sampler);
                return this._loadAnimationSamplerAsync(animationContext + "/samplers/" + channel.sampler, sampler).then(function (data) {
                    var targetPath;
                    var animationType;
                    switch (channel.target.path) {
                        case "translation" /* TRANSLATION */: {
                            targetPath = "position";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "rotation" /* ROTATION */: {
                            targetPath = "rotationQuaternion";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            break;
                        }
                        case "scale" /* SCALE */: {
                            targetPath = "scaling";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "weights" /* WEIGHTS */: {
                            targetPath = "influence";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                            break;
                        }
                        default: {
                            throw new Error(context + "/target/path: Invalid value (" + channel.target.path + ")");
                        }
                    }
                    var outputBufferOffset = 0;
                    var getNextOutputValue;
                    switch (targetPath) {
                        case "position": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "rotationQuaternion": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Quaternion.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 4;
                                return value;
                            };
                            break;
                        }
                        case "scaling": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "influence": {
                            getNextOutputValue = function () {
                                var value = new Array(targetNode._numMorphTargets);
                                for (var i = 0; i < targetNode._numMorphTargets; i++) {
                                    value[i] = data.output[outputBufferOffset++];
                                }
                                return value;
                            };
                            break;
                        }
                    }
                    var getNextKey;
                    switch (data.interpolation) {
                        case "STEP" /* STEP */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue(),
                                interpolation: BABYLON.AnimationKeyInterpolation.STEP
                            }); };
                            break;
                        }
                        case "LINEAR" /* LINEAR */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue()
                            }); };
                            break;
                        }
                        case "CUBICSPLINE" /* CUBICSPLINE */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                inTangent: getNextOutputValue(),
                                value: getNextOutputValue(),
                                outTangent: getNextOutputValue()
                            }); };
                            break;
                        }
                    }
                    var keys = new Array(data.input.length);
                    for (var frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                        keys[frameIndex] = getNextKey(frameIndex);
                    }
                    if (targetPath === "influence") {
                        var _loop_1 = function (targetIndex) {
                            var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                            var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                            babylonAnimation.setKeys(keys.map(function (key) { return ({
                                frame: key.frame,
                                inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                value: key.value[targetIndex],
                                outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                            }); }));
                            _this._forEachPrimitive(targetNode, function (babylonMesh) {
                                var morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                                var babylonAnimationClone = babylonAnimation.clone();
                                morphTarget.animations.push(babylonAnimationClone);
                                babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                            });
                        };
                        for (var targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                            _loop_1(targetIndex);
                        }
                    }
                    else {
                        var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        targetNode._babylonTransformNode.animations.push(babylonAnimation);
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonTransformNode);
                    }
                });
            };
            GLTFLoader.prototype._loadAnimationSamplerAsync = function (context, sampler) {
                if (sampler._data) {
                    return sampler._data;
                }
                var interpolation = sampler.interpolation || "LINEAR" /* LINEAR */;
                switch (interpolation) {
                    case "STEP" /* STEP */:
                    case "LINEAR" /* LINEAR */:
                    case "CUBICSPLINE" /* CUBICSPLINE */: {
                        break;
                    }
                    default: {
                        throw new Error(context + "/interpolation: Invalid value (" + sampler.interpolation + ")");
                    }
                }
                var inputAccessor = ArrayItem.Get(context + "/input", this.gltf.accessors, sampler.input);
                var outputAccessor = ArrayItem.Get(context + "/output", this.gltf.accessors, sampler.output);
                sampler._data = Promise.all([
                    this._loadFloatAccessorAsync("/accessors/" + inputAccessor.index, inputAccessor),
                    this._loadFloatAccessorAsync("/accessors/" + outputAccessor.index, outputAccessor)
                ]).then(function (_a) {
                    var inputData = _a[0], outputData = _a[1];
                    return {
                        input: inputData,
                        interpolation: interpolation,
                        output: outputData,
                    };
                });
                return sampler._data;
            };
            GLTFLoader.prototype._loadBufferAsync = function (context, buffer) {
                if (buffer._data) {
                    return buffer._data;
                }
                if (!buffer.uri) {
                    throw new Error(context + "/uri: Value is missing");
                }
                buffer._data = this.loadUriAsync(context + "/uri", buffer.uri);
                return buffer._data;
            };
            /**
             * Loads a glTF buffer view.
             * @param context The context when loading the asset
             * @param bufferView The glTF buffer view property
             * @returns A promise that resolves with the loaded data when the load is complete
             */
            GLTFLoader.prototype.loadBufferViewAsync = function (context, bufferView) {
                if (bufferView._data) {
                    return bufferView._data;
                }
                var buffer = ArrayItem.Get(context + "/buffer", this.gltf.buffers, bufferView.buffer);
                bufferView._data = this._loadBufferAsync("/buffers/" + buffer.index, buffer).then(function (data) {
                    try {
                        return new Uint8Array(data.buffer, data.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                });
                return bufferView._data;
            };
            GLTFLoader.prototype._loadIndicesAccessorAsync = function (context, accessor) {
                if (accessor.type !== "SCALAR" /* SCALAR */) {
                    throw new Error(context + "/type: Invalid value " + accessor.type);
                }
                if (accessor.componentType !== 5121 /* UNSIGNED_BYTE */ &&
                    accessor.componentType !== 5123 /* UNSIGNED_SHORT */ &&
                    accessor.componentType !== 5125 /* UNSIGNED_INT */) {
                    throw new Error(context + "/componentType: Invalid value " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var bufferView = ArrayItem.Get(context + "/bufferView", this.gltf.bufferViews, accessor.bufferView);
                accessor._data = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
                });
                return accessor._data;
            };
            GLTFLoader.prototype._loadFloatAccessorAsync = function (context, accessor) {
                // TODO: support normalized and stride
                var _this = this;
                if (accessor.componentType !== 5126 /* FLOAT */) {
                    throw new Error("Invalid component type " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
                var length = numComponents * accessor.count;
                if (accessor.bufferView == undefined) {
                    accessor._data = Promise.resolve(new Float32Array(length));
                }
                else {
                    var bufferView = ArrayItem.Get(context + "/bufferView", this.gltf.bufferViews, accessor.bufferView);
                    accessor._data = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                        return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                    });
                }
                if (accessor.sparse) {
                    var sparse_1 = accessor.sparse;
                    accessor._data = accessor._data.then(function (data) {
                        var indicesBufferView = ArrayItem.Get(context + "/sparse/indices/bufferView", _this.gltf.bufferViews, sparse_1.indices.bufferView);
                        var valuesBufferView = ArrayItem.Get(context + "/sparse/values/bufferView", _this.gltf.bufferViews, sparse_1.values.bufferView);
                        return Promise.all([
                            _this.loadBufferViewAsync("/bufferViews/" + indicesBufferView.index, indicesBufferView),
                            _this.loadBufferViewAsync("/bufferViews/" + valuesBufferView.index, valuesBufferView)
                        ]).then(function (_a) {
                            var indicesData = _a[0], valuesData = _a[1];
                            var indices = GLTFLoader._GetTypedArray(context + "/sparse/indices", sparse_1.indices.componentType, indicesData, sparse_1.indices.byteOffset, sparse_1.count);
                            var values = GLTFLoader._GetTypedArray(context + "/sparse/values", accessor.componentType, valuesData, sparse_1.values.byteOffset, numComponents * sparse_1.count);
                            var valuesIndex = 0;
                            for (var indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                                var dataIndex = indices[indicesIndex] * numComponents;
                                for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                                    data[dataIndex++] = values[valuesIndex++];
                                }
                            }
                            return data;
                        });
                    });
                }
                return accessor._data;
            };
            GLTFLoader.prototype._loadVertexBufferViewAsync = function (bufferView, kind) {
                var _this = this;
                if (bufferView._babylonBuffer) {
                    return bufferView._babylonBuffer;
                }
                bufferView._babylonBuffer = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                    return new BABYLON.Buffer(_this.babylonScene.getEngine(), data, false);
                });
                return bufferView._babylonBuffer;
            };
            GLTFLoader.prototype._loadVertexAccessorAsync = function (context, accessor, kind) {
                var _this = this;
                if (accessor._babylonVertexBuffer) {
                    return accessor._babylonVertexBuffer;
                }
                if (accessor.sparse) {
                    accessor._babylonVertexBuffer = this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                        return new BABYLON.VertexBuffer(_this.babylonScene.getEngine(), data, kind, false);
                    });
                }
                // HACK: If byte offset is not a multiple of component type byte length then load as a float array instead of using Babylon buffers.
                else if (accessor.byteOffset && accessor.byteOffset % BABYLON.VertexBuffer.GetTypeByteLength(accessor.componentType) !== 0) {
                    BABYLON.Tools.Warn("Accessor byte offset is not a multiple of component type byte length");
                    accessor._babylonVertexBuffer = this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                        return new BABYLON.VertexBuffer(_this.babylonScene.getEngine(), data, kind, false);
                    });
                }
                else {
                    var bufferView_1 = ArrayItem.Get(context + "/bufferView", this.gltf.bufferViews, accessor.bufferView);
                    accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync(bufferView_1, kind).then(function (babylonBuffer) {
                        var size = GLTFLoader._GetNumComponents(context, accessor.type);
                        return new BABYLON.VertexBuffer(_this.babylonScene.getEngine(), babylonBuffer, kind, false, false, bufferView_1.byteStride, false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
                    });
                }
                return accessor._babylonVertexBuffer;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessPropertiesAsync = function (context, properties, babylonMaterial) {
                if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                    throw new Error(context + ": Material type not supported");
                }
                var promises = new Array();
                if (properties) {
                    if (properties.baseColorFactor) {
                        babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                        babylonMaterial.alpha = properties.baseColorFactor[3];
                    }
                    else {
                        babylonMaterial.albedoColor = BABYLON.Color3.White();
                    }
                    babylonMaterial.metallic = properties.metallicFactor == undefined ? 1 : properties.metallicFactor;
                    babylonMaterial.roughness = properties.roughnessFactor == undefined ? 1 : properties.roughnessFactor;
                    if (properties.baseColorTexture) {
                        promises.push(this.loadTextureInfoAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                            texture.name = babylonMaterial.name + " (Base Color)";
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.metallicRoughnessTexture) {
                        promises.push(this.loadTextureInfoAsync(context + "/metallicRoughnessTexture", properties.metallicRoughnessTexture, function (texture) {
                            texture.name = babylonMaterial.name + " (Metallic Roughness)";
                            babylonMaterial.metallicTexture = texture;
                        }));
                        babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                        babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                        babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                    }
                }
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                if (assign === void 0) { assign = function () { }; }
                var extensionPromise = this._extensionsLoadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign);
                if (extensionPromise) {
                    return extensionPromise;
                }
                material._data = material._data || {};
                var babylonData = material._data[babylonDrawMode];
                if (!babylonData) {
                    this.logOpen(context + " " + (material.name || ""));
                    var babylonMaterial = this.createMaterial(context, material, babylonDrawMode);
                    babylonData = {
                        babylonMaterial: babylonMaterial,
                        babylonMeshes: [],
                        promise: this.loadMaterialPropertiesAsync(context, material, babylonMaterial)
                    };
                    material._data[babylonDrawMode] = babylonData;
                    GLTFLoader.AddPointerMetadata(babylonMaterial, context);
                    this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    this.logClose();
                }
                babylonData.babylonMeshes.push(babylonMesh);
                babylonMesh.onDisposeObservable.addOnce(function () {
                    var index = babylonData.babylonMeshes.indexOf(babylonMesh);
                    if (index !== -1) {
                        babylonData.babylonMeshes.splice(index, 1);
                    }
                });
                assign(babylonData.babylonMaterial);
                return babylonData.promise.then(function () {
                    return babylonData.babylonMaterial;
                });
            };
            GLTFLoader.prototype._createDefaultMaterial = function (name, babylonDrawMode) {
                var babylonMaterial = new BABYLON.PBRMaterial(name, this.babylonScene);
                babylonMaterial.sideOrientation = this.babylonScene.useRightHandedSystem ? BABYLON.Material.CounterClockWiseSideOrientation : BABYLON.Material.ClockWiseSideOrientation;
                babylonMaterial.fillMode = babylonDrawMode;
                babylonMaterial.enableSpecularAntiAliasing = true;
                babylonMaterial.useRadianceOverAlpha = !this._parent.transparencyAsCoverage;
                babylonMaterial.useSpecularOverAlpha = !this._parent.transparencyAsCoverage;
                babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                return babylonMaterial;
            };
            /**
             * Creates a Babylon material from a glTF material.
             * @param context The context when loading the asset
             * @param material The glTF material property
             * @param babylonDrawMode The draw mode for the Babylon material
             * @returns The Babylon material
             */
            GLTFLoader.prototype.createMaterial = function (context, material, babylonDrawMode) {
                var extensionPromise = this._extensionsCreateMaterial(context, material, babylonDrawMode);
                if (extensionPromise) {
                    return extensionPromise;
                }
                var name = material.name || "material" + material.index;
                var babylonMaterial = this._createDefaultMaterial(name, babylonDrawMode);
                return babylonMaterial;
            };
            /**
             * Loads properties from a glTF material into a Babylon material.
             * @param context The context when loading the asset
             * @param material The glTF material property
             * @param babylonMaterial The Babylon material
             * @returns A promise that resolves when the load is complete
             */
            GLTFLoader.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                var extensionPromise = this._extensionsLoadMaterialPropertiesAsync(context, material, babylonMaterial);
                if (extensionPromise) {
                    return extensionPromise;
                }
                var promises = new Array();
                promises.push(this.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                if (material.pbrMetallicRoughness) {
                    promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context + "/pbrMetallicRoughness", material.pbrMetallicRoughness, babylonMaterial));
                }
                this.loadMaterialAlphaProperties(context, material, babylonMaterial);
                return Promise.all(promises).then(function () { });
            };
            /**
             * Loads the normal, occlusion, and emissive properties from a glTF material into a Babylon material.
             * @param context The context when loading the asset
             * @param material The glTF material property
             * @param babylonMaterial The Babylon material
             * @returns A promise that resolves when the load is complete
             */
            GLTFLoader.prototype.loadMaterialBasePropertiesAsync = function (context, material, babylonMaterial) {
                if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                    throw new Error(context + ": Material type not supported");
                }
                var promises = new Array();
                babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.twoSidedLighting = true;
                }
                if (material.normalTexture) {
                    promises.push(this.loadTextureInfoAsync(context + "/normalTexture", material.normalTexture, function (texture) {
                        texture.name = babylonMaterial.name + " (Normal)";
                        babylonMaterial.bumpTexture = texture;
                    }));
                    babylonMaterial.invertNormalMapX = !this.babylonScene.useRightHandedSystem;
                    babylonMaterial.invertNormalMapY = this.babylonScene.useRightHandedSystem;
                    if (material.normalTexture.scale != undefined) {
                        babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }
                if (material.occlusionTexture) {
                    promises.push(this.loadTextureInfoAsync(context + "/occlusionTexture", material.occlusionTexture, function (texture) {
                        texture.name = babylonMaterial.name + " (Occlusion)";
                        babylonMaterial.ambientTexture = texture;
                    }));
                    babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength != undefined) {
                        babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }
                if (material.emissiveTexture) {
                    promises.push(this.loadTextureInfoAsync(context + "/emissiveTexture", material.emissiveTexture, function (texture) {
                        texture.name = babylonMaterial.name + " (Emissive)";
                        babylonMaterial.emissiveTexture = texture;
                    }));
                }
                return Promise.all(promises).then(function () { });
            };
            /**
             * Loads the alpha properties from a glTF material into a Babylon material.
             * Must be called after the setting the albedo texture of the Babylon material when the material has an albedo texture.
             * @param context The context when loading the asset
             * @param material The glTF material property
             * @param babylonMaterial The Babylon material
             */
            GLTFLoader.prototype.loadMaterialAlphaProperties = function (context, material, babylonMaterial) {
                if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                    throw new Error(context + ": Material type not supported");
                }
                var alphaMode = material.alphaMode || "OPAQUE" /* OPAQUE */;
                switch (alphaMode) {
                    case "OPAQUE" /* OPAQUE */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                        break;
                    }
                    case "MASK" /* MASK */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
                        babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                        }
                        break;
                    }
                    case "BLEND" /* BLEND */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                            babylonMaterial.useAlphaFromAlbedoTexture = true;
                        }
                        break;
                    }
                    default: {
                        throw new Error(context + "/alphaMode: Invalid value (" + material.alphaMode + ")");
                    }
                }
            };
            /**
             * Loads a glTF texture info.
             * @param context The context when loading the asset
             * @param textureInfo The glTF texture info property
             * @param assign A function called synchronously after parsing the glTF properties
             * @returns A promise that resolves with the loaded Babylon texture when the load is complete
             */
            GLTFLoader.prototype.loadTextureInfoAsync = function (context, textureInfo, assign) {
                var _this = this;
                if (assign === void 0) { assign = function () { }; }
                var extensionPromise = this._extensionsLoadTextureInfoAsync(context, textureInfo, assign);
                if (extensionPromise) {
                    return extensionPromise;
                }
                this.logOpen("" + context);
                var texture = ArrayItem.Get(context + "/index", this.gltf.textures, textureInfo.index);
                var promise = this._loadTextureAsync("/textures/" + textureInfo.index, texture, function (babylonTexture) {
                    babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
                    GLTFLoader.AddPointerMetadata(babylonTexture, context);
                    _this._parent.onTextureLoadedObservable.notifyObservers(babylonTexture);
                    assign(babylonTexture);
                });
                this.logClose();
                return promise;
            };
            GLTFLoader.prototype._loadTextureAsync = function (context, texture, assign) {
                var _this = this;
                if (assign === void 0) { assign = function () { }; }
                var promises = new Array();
                this.logOpen(context + " " + (texture.name || ""));
                var sampler = (texture.sampler == undefined ? GLTFLoader._DefaultSampler : ArrayItem.Get(context + "/sampler", this.gltf.samplers, texture.sampler));
                var samplerData = this._loadSampler("/samplers/" + sampler.index, sampler);
                var image = ArrayItem.Get(context + "/source", this.gltf.images, texture.source);
                var url = null;
                if (image.uri) {
                    if (BABYLON.Tools.IsBase64(image.uri)) {
                        url = image.uri;
                    }
                    else if (this.babylonScene.getEngine().textureFormatInUse) {
                        // If an image uri and a texture format is set like (eg. KTX) load from url instead of blob to support texture format and fallback
                        url = this._rootUrl + image.uri;
                    }
                }
                var deferred = new BABYLON.Deferred();
                var babylonTexture = new BABYLON.Texture(url, this.babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, function () {
                    if (!_this._disposed) {
                        deferred.resolve();
                    }
                }, function (message, exception) {
                    if (!_this._disposed) {
                        deferred.reject(new Error(context + ": " + ((exception && exception.message) ? exception.message : message || "Failed to load texture")));
                    }
                });
                promises.push(deferred.promise);
                if (!url) {
                    promises.push(this.loadImageAsync("/images/" + image.index, image).then(function (data) {
                        var name = image.uri || _this._fileName + "#image" + image.index;
                        var dataUrl = "data:" + _this._uniqueRootUrl + name;
                        babylonTexture.updateURL(dataUrl, new Blob([data], { type: image.mimeType }));
                    }));
                }
                babylonTexture.wrapU = samplerData.wrapU;
                babylonTexture.wrapV = samplerData.wrapV;
                assign(babylonTexture);
                this.logClose();
                return Promise.all(promises).then(function () {
                    return babylonTexture;
                });
            };
            GLTFLoader.prototype._loadSampler = function (context, sampler) {
                if (!sampler._data) {
                    sampler._data = {
                        noMipMaps: (sampler.minFilter === 9728 /* NEAREST */ || sampler.minFilter === 9729 /* LINEAR */),
                        samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler),
                        wrapU: GLTFLoader._GetTextureWrapMode(context + "/wrapS", sampler.wrapS),
                        wrapV: GLTFLoader._GetTextureWrapMode(context + "/wrapT", sampler.wrapT)
                    };
                }
                return sampler._data;
            };
            /**
             * Loads a glTF image.
             * @param context The context when loading the asset
             * @param image The glTF image property
             * @returns A promise that resolves with the loaded data when the load is complete
             */
            GLTFLoader.prototype.loadImageAsync = function (context, image) {
                if (!image._data) {
                    this.logOpen(context + " " + (image.name || ""));
                    if (image.uri) {
                        image._data = this.loadUriAsync(context + "/uri", image.uri);
                    }
                    else {
                        var bufferView = ArrayItem.Get(context + "/bufferView", this.gltf.bufferViews, image.bufferView);
                        image._data = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView);
                    }
                    this.logClose();
                }
                return image._data;
            };
            /**
             * Loads a glTF uri.
             * @param context The context when loading the asset
             * @param uri The base64 or relative uri
             * @returns A promise that resolves with the loaded data when the load is complete
             */
            GLTFLoader.prototype.loadUriAsync = function (context, uri) {
                var _this = this;
                var extensionPromise = this._extensionsLoadUriAsync(context, uri);
                if (extensionPromise) {
                    return extensionPromise;
                }
                if (!GLTFLoader._ValidateUri(uri)) {
                    throw new Error(context + ": '" + uri + "' is invalid");
                }
                if (BABYLON.Tools.IsBase64(uri)) {
                    var data = new Uint8Array(BABYLON.Tools.DecodeBase64(uri));
                    this.log("Decoded " + uri.substr(0, 64) + "... (" + data.length + " bytes)");
                    return Promise.resolve(data);
                }
                this.log("Loading " + uri);
                return this._parent.preprocessUrlAsync(this._rootUrl + uri).then(function (url) {
                    return new Promise(function (resolve, reject) {
                        if (!_this._disposed) {
                            var request_1 = BABYLON.Tools.LoadFile(url, function (fileData) {
                                if (!_this._disposed) {
                                    var data = new Uint8Array(fileData);
                                    _this.log("Loaded " + uri + " (" + data.length + " bytes)");
                                    resolve(data);
                                }
                            }, function (event) {
                                if (!_this._disposed) {
                                    if (request_1) {
                                        request_1._lengthComputable = event.lengthComputable;
                                        request_1._loaded = event.loaded;
                                        request_1._total = event.total;
                                    }
                                    if (_this._state === BABYLON.GLTFLoaderState.LOADING) {
                                        try {
                                            _this._onProgress();
                                        }
                                        catch (e) {
                                            reject(e);
                                        }
                                    }
                                }
                            }, _this.babylonScene.offlineProvider, true, function (request, exception) {
                                if (!_this._disposed) {
                                    reject(new BABYLON.LoadFileError(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""), request));
                                }
                            });
                            _this._requests.push(request_1);
                        }
                    });
                });
            };
            GLTFLoader.prototype._onProgress = function () {
                if (!this._progressCallback) {
                    return;
                }
                var lengthComputable = true;
                var loaded = 0;
                var total = 0;
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    if (request._lengthComputable === undefined || request._loaded === undefined || request._total === undefined) {
                        return;
                    }
                    lengthComputable = lengthComputable && request._lengthComputable;
                    loaded += request._loaded;
                    total += request._total;
                }
                this._progressCallback(new BABYLON.SceneLoaderProgressEvent(lengthComputable, loaded, lengthComputable ? total : 0));
            };
            /**
             * Adds a JSON pointer to the metadata of the Babylon object at `<object>.metadata.gltf.pointers`.
             * @param babylonObject the Babylon object with metadata
             * @param pointer the JSON pointer
             */
            GLTFLoader.AddPointerMetadata = function (babylonObject, pointer) {
                var metadata = (babylonObject.metadata = babylonObject.metadata || {});
                var gltf = (metadata.gltf = metadata.gltf || {});
                var pointers = (gltf.pointers = gltf.pointers || []);
                pointers.push(pointer);
            };
            GLTFLoader._GetTextureWrapMode = function (context, mode) {
                // Set defaults if undefined
                mode = mode == undefined ? 10497 /* REPEAT */ : mode;
                switch (mode) {
                    case 33071 /* CLAMP_TO_EDGE */: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case 33648 /* MIRRORED_REPEAT */: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case 10497 /* REPEAT */: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default:
                        BABYLON.Tools.Warn(context + ": Invalid value (" + mode + ")");
                        return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            GLTFLoader._GetTextureSamplingMode = function (context, sampler) {
                // Set defaults if undefined
                var magFilter = sampler.magFilter == undefined ? 9729 /* LINEAR */ : sampler.magFilter;
                var minFilter = sampler.minFilter == undefined ? 9987 /* LINEAR_MIPMAP_LINEAR */ : sampler.minFilter;
                if (magFilter === 9729 /* LINEAR */) {
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.LINEAR_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.LINEAR_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + "/minFilter: Invalid value (" + minFilter + ")");
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== 9728 /* NEAREST */) {
                        BABYLON.Tools.Warn(context + "/magFilter: Invalid value (" + magFilter + ")");
                    }
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.NEAREST_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.NEAREST_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + "/minFilter: Invalid value (" + minFilter + ")");
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
                }
            };
            GLTFLoader._GetTypedArray = function (context, componentType, bufferView, byteOffset, length) {
                var buffer = bufferView.buffer;
                byteOffset = bufferView.byteOffset + (byteOffset || 0);
                try {
                    switch (componentType) {
                        case 5120 /* BYTE */: return new Int8Array(buffer, byteOffset, length);
                        case 5121 /* UNSIGNED_BYTE */: return new Uint8Array(buffer, byteOffset, length);
                        case 5122 /* SHORT */: return new Int16Array(buffer, byteOffset, length);
                        case 5123 /* UNSIGNED_SHORT */: return new Uint16Array(buffer, byteOffset, length);
                        case 5125 /* UNSIGNED_INT */: return new Uint32Array(buffer, byteOffset, length);
                        case 5126 /* FLOAT */: return new Float32Array(buffer, byteOffset, length);
                        default: throw new Error("Invalid component type " + componentType);
                    }
                }
                catch (e) {
                    throw new Error(context + ": " + e);
                }
            };
            GLTFLoader._GetNumComponents = function (context, type) {
                switch (type) {
                    case "SCALAR": return 1;
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                }
                throw new Error(context + ": Invalid type (" + type + ")");
            };
            GLTFLoader._ValidateUri = function (uri) {
                return (BABYLON.Tools.IsBase64(uri) || uri.indexOf("..") === -1);
            };
            GLTFLoader._GetDrawMode = function (context, mode) {
                if (mode == undefined) {
                    mode = 4 /* TRIANGLES */;
                }
                switch (mode) {
                    case 0 /* POINTS */: return BABYLON.Material.PointListDrawMode;
                    case 1 /* LINES */: return BABYLON.Material.LineListDrawMode;
                    case 2 /* LINE_LOOP */: return BABYLON.Material.LineLoopDrawMode;
                    case 3 /* LINE_STRIP */: return BABYLON.Material.LineStripDrawMode;
                    case 4 /* TRIANGLES */: return BABYLON.Material.TriangleFillMode;
                    case 5 /* TRIANGLE_STRIP */: return BABYLON.Material.TriangleStripDrawMode;
                    case 6 /* TRIANGLE_FAN */: return BABYLON.Material.TriangleFanDrawMode;
                }
                throw new Error(context + ": Invalid mesh primitive mode (" + mode + ")");
            };
            GLTFLoader.prototype._compileMaterialsAsync = function () {
                var _this = this;
                this._parent._startPerformanceCounter("Compile materials");
                var promises = new Array();
                if (this.gltf.materials) {
                    for (var _i = 0, _a = this.gltf.materials; _i < _a.length; _i++) {
                        var material = _a[_i];
                        if (material._data) {
                            for (var babylonDrawMode in material._data) {
                                var babylonData = material._data[babylonDrawMode];
                                for (var _b = 0, _c = babylonData.babylonMeshes; _b < _c.length; _b++) {
                                    var babylonMesh = _c[_b];
                                    // Ensure nonUniformScaling is set if necessary.
                                    babylonMesh.computeWorldMatrix(true);
                                    var babylonMaterial = babylonData.babylonMaterial;
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                    if (this._parent.useClipPlane) {
                                        promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                    }
                                }
                            }
                        }
                    }
                }
                return Promise.all(promises).then(function () {
                    _this._parent._endPerformanceCounter("Compile materials");
                });
            };
            GLTFLoader.prototype._compileShadowGeneratorsAsync = function () {
                var _this = this;
                this._parent._startPerformanceCounter("Compile shadow generators");
                var promises = new Array();
                var lights = this.babylonScene.lights;
                for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
                    var light = lights_1[_i];
                    var generator = light.getShadowGenerator();
                    if (generator) {
                        promises.push(generator.forceCompilationAsync());
                    }
                }
                return Promise.all(promises).then(function () {
                    _this._parent._endPerformanceCounter("Compile shadow generators");
                });
            };
            GLTFLoader.prototype._forEachExtensions = function (action) {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_4 = _a[_i];
                    var extension = this._extensions[name_4];
                    if (extension.enabled) {
                        action(extension);
                    }
                }
            };
            GLTFLoader.prototype._applyExtensions = function (property, actionAsync) {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_5 = _a[_i];
                    var extension = this._extensions[name_5];
                    if (extension.enabled) {
                        var loaderProperty = property;
                        loaderProperty._activeLoaderExtensions = loaderProperty._activeLoaderExtensions || {};
                        var activeLoaderExtensions = loaderProperty._activeLoaderExtensions;
                        if (!activeLoaderExtensions[name_5]) {
                            activeLoaderExtensions[name_5] = true;
                            try {
                                var result = actionAsync(extension);
                                if (result) {
                                    return result;
                                }
                            }
                            finally {
                                delete activeLoaderExtensions[name_5];
                            }
                        }
                    }
                }
                return null;
            };
            GLTFLoader.prototype._extensionsOnLoading = function () {
                this._forEachExtensions(function (extension) { return extension.onLoading && extension.onLoading(); });
            };
            GLTFLoader.prototype._extensionsOnReady = function () {
                this._forEachExtensions(function (extension) { return extension.onReady && extension.onReady(); });
            };
            GLTFLoader.prototype._extensionsLoadSceneAsync = function (context, scene) {
                return this._applyExtensions(scene, function (extension) { return extension.loadSceneAsync && extension.loadSceneAsync(context, scene); });
            };
            GLTFLoader.prototype._extensionsLoadNodeAsync = function (context, node, assign) {
                return this._applyExtensions(node, function (extension) { return extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign); });
            };
            GLTFLoader.prototype._extensionsLoadCameraAsync = function (context, camera, assign) {
                return this._applyExtensions(camera, function (extension) { return extension.loadCameraAsync && extension.loadCameraAsync(context, camera, assign); });
            };
            GLTFLoader.prototype._extensionsLoadVertexDataAsync = function (context, primitive, babylonMesh) {
                return this._applyExtensions(primitive, function (extension) { return extension._loadVertexDataAsync && extension._loadVertexDataAsync(context, primitive, babylonMesh); });
            };
            GLTFLoader.prototype._extensionsLoadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                return this._applyExtensions(material, function (extension) { return extension._loadMaterialAsync && extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign); });
            };
            GLTFLoader.prototype._extensionsCreateMaterial = function (context, material, babylonDrawMode) {
                return this._applyExtensions({}, function (extension) { return extension.createMaterial && extension.createMaterial(context, material, babylonDrawMode); });
            };
            GLTFLoader.prototype._extensionsLoadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                return this._applyExtensions(material, function (extension) { return extension.loadMaterialPropertiesAsync && extension.loadMaterialPropertiesAsync(context, material, babylonMaterial); });
            };
            GLTFLoader.prototype._extensionsLoadTextureInfoAsync = function (context, textureInfo, assign) {
                return this._applyExtensions(textureInfo, function (extension) { return extension.loadTextureInfoAsync && extension.loadTextureInfoAsync(context, textureInfo, assign); });
            };
            GLTFLoader.prototype._extensionsLoadAnimationAsync = function (context, animation) {
                return this._applyExtensions(animation, function (extension) { return extension.loadAnimationAsync && extension.loadAnimationAsync(context, animation); });
            };
            GLTFLoader.prototype._extensionsLoadUriAsync = function (context, uri) {
                return this._applyExtensions({}, function (extension) { return extension._loadUriAsync && extension._loadUriAsync(context, uri); });
            };
            /**
             * Helper method called by a loader extension to load an glTF extension.
             * @param context The context when loading the asset
             * @param property The glTF property to load the extension from
             * @param extensionName The name of the extension to load
             * @param actionAsync The action to run
             * @returns The promise returned by actionAsync or null if the extension does not exist
             */
            GLTFLoader.LoadExtensionAsync = function (context, property, extensionName, actionAsync) {
                if (!property.extensions) {
                    return null;
                }
                var extensions = property.extensions;
                var extension = extensions[extensionName];
                if (!extension) {
                    return null;
                }
                return actionAsync(context + "/extensions/" + extensionName, extension);
            };
            /**
             * Helper method called by a loader extension to load a glTF extra.
             * @param context The context when loading the asset
             * @param property The glTF property to load the extra from
             * @param extensionName The name of the extension to load
             * @param actionAsync The action to run
             * @returns The promise returned by actionAsync or null if the extra does not exist
             */
            GLTFLoader.LoadExtraAsync = function (context, property, extensionName, actionAsync) {
                if (!property.extras) {
                    return null;
                }
                var extras = property.extras;
                var extra = extras[extensionName];
                if (!extra) {
                    return null;
                }
                return actionAsync(context + "/extras/" + extensionName, extra);
            };
            /**
             * Increments the indentation level and logs a message.
             * @param message The message to log
             */
            GLTFLoader.prototype.logOpen = function (message) {
                this._parent._logOpen(message);
            };
            /**
             * Decrements the indentation level.
             */
            GLTFLoader.prototype.logClose = function () {
                this._parent._logClose();
            };
            /**
             * Logs a message
             * @param message The message to log
             */
            GLTFLoader.prototype.log = function (message) {
                this._parent._log(message);
            };
            /**
             * Starts a performance counter.
             * @param counterName The name of the performance counter
             */
            GLTFLoader.prototype.startPerformanceCounter = function (counterName) {
                this._parent._startPerformanceCounter(counterName);
            };
            /**
             * Ends a performance counter.
             * @param counterName The name of the performance counter
             */
            GLTFLoader.prototype.endPerformanceCounter = function (counterName) {
                this._parent._endPerformanceCounter(counterName);
            };
            GLTFLoader._DefaultSampler = { index: -1 };
            GLTFLoader._ExtensionNames = new Array();
            GLTFLoader._ExtensionFactories = {};
            return GLTFLoader;
        }());
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader._CreateGLTFLoaderV2 = function (parent) { return new GLTFLoader(parent); };
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map



//# sourceMappingURL=babylon.glTFLoaderExtension.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "MSFT_lod";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
                 */
                var MSFT_lod = /** @class */ (function () {
                    /** @hidden */
                    function MSFT_lod(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        /**
                         * Maximum number of LODs to load, starting from the lowest LOD.
                         */
                        this.maxLODsToLoad = Number.MAX_VALUE;
                        /**
                         * Observable raised when all node LODs of one level are loaded.
                         * The event data is the index of the loaded LOD starting from zero.
                         * Dispose the loader to cancel the loading of the next level of LODs.
                         */
                        this.onNodeLODsLoadedObservable = new BABYLON.Observable();
                        /**
                         * Observable raised when all material LODs of one level are loaded.
                         * The event data is the index of the loaded LOD starting from zero.
                         * Dispose the loader to cancel the loading of the next level of LODs.
                         */
                        this.onMaterialLODsLoadedObservable = new BABYLON.Observable();
                        this._nodeIndexLOD = null;
                        this._nodeSignalLODs = new Array();
                        this._nodePromiseLODs = new Array();
                        this._materialIndexLOD = null;
                        this._materialSignalLODs = new Array();
                        this._materialPromiseLODs = new Array();
                        this._loader = loader;
                    }
                    /** @hidden */
                    MSFT_lod.prototype.dispose = function () {
                        delete this._loader;
                        this._nodeIndexLOD = null;
                        this._nodeSignalLODs.length = 0;
                        this._nodePromiseLODs.length = 0;
                        this._materialIndexLOD = null;
                        this._materialSignalLODs.length = 0;
                        this._materialPromiseLODs.length = 0;
                        this.onMaterialLODsLoadedObservable.clear();
                        this.onNodeLODsLoadedObservable.clear();
                    };
                    /** @hidden */
                    MSFT_lod.prototype.onReady = function () {
                        var _this = this;
                        var _loop_1 = function (indexLOD) {
                            var promise = Promise.all(this_1._nodePromiseLODs[indexLOD]).then(function () {
                                if (indexLOD !== 0) {
                                    _this._loader.endPerformanceCounter("Node LOD " + indexLOD);
                                }
                                _this._loader.log("Loaded node LOD " + indexLOD);
                                _this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);
                                if (indexLOD !== _this._nodePromiseLODs.length - 1) {
                                    _this._loader.startPerformanceCounter("Node LOD " + (indexLOD + 1));
                                    if (_this._nodeSignalLODs[indexLOD]) {
                                        _this._nodeSignalLODs[indexLOD].resolve();
                                    }
                                }
                            });
                            this_1._loader._completePromises.push(promise);
                        };
                        var this_1 = this;
                        for (var indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
                            _loop_1(indexLOD);
                        }
                        var _loop_2 = function (indexLOD) {
                            var promise = Promise.all(this_2._materialPromiseLODs[indexLOD]).then(function () {
                                if (indexLOD !== 0) {
                                    _this._loader.endPerformanceCounter("Material LOD " + indexLOD);
                                }
                                _this._loader.log("Loaded material LOD " + indexLOD);
                                _this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);
                                if (indexLOD !== _this._materialPromiseLODs.length - 1) {
                                    _this._loader.startPerformanceCounter("Material LOD " + (indexLOD + 1));
                                    if (_this._materialSignalLODs[indexLOD]) {
                                        _this._materialSignalLODs[indexLOD].resolve();
                                    }
                                }
                            });
                            this_2._loader._completePromises.push(promise);
                        };
                        var this_2 = this;
                        for (var indexLOD = 0; indexLOD < this._materialPromiseLODs.length; indexLOD++) {
                            _loop_2(indexLOD);
                        }
                    };
                    /** @hidden */
                    MSFT_lod.prototype.loadNodeAsync = function (context, node, assign) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
                            var firstPromise;
                            var nodeLODs = _this._getLODs(extensionContext, node, _this._loader.gltf.nodes, extension.ids);
                            _this._loader.logOpen("" + extensionContext);
                            var _loop_3 = function (indexLOD) {
                                var nodeLOD = nodeLODs[indexLOD];
                                if (indexLOD !== 0) {
                                    _this._nodeIndexLOD = indexLOD;
                                    _this._nodeSignalLODs[indexLOD] = _this._nodeSignalLODs[indexLOD] || new BABYLON.Deferred();
                                }
                                var assign_1 = function (babylonTransformNode) { babylonTransformNode.setEnabled(false); };
                                var promise = _this._loader.loadNodeAsync("#/nodes/" + nodeLOD.index, nodeLOD, assign_1).then(function (babylonMesh) {
                                    if (indexLOD !== 0) {
                                        // TODO: should not rely on _babylonMesh
                                        var previousNodeLOD = nodeLODs[indexLOD - 1];
                                        if (previousNodeLOD._babylonTransformNode) {
                                            previousNodeLOD._babylonTransformNode.dispose();
                                            delete previousNodeLOD._babylonTransformNode;
                                            _this._disposeUnusedMaterials();
                                        }
                                    }
                                    babylonMesh.setEnabled(true);
                                    return babylonMesh;
                                });
                                if (indexLOD === 0) {
                                    firstPromise = promise;
                                }
                                else {
                                    _this._nodeIndexLOD = null;
                                }
                                _this._nodePromiseLODs[indexLOD] = _this._nodePromiseLODs[indexLOD] || [];
                                _this._nodePromiseLODs[indexLOD].push(promise);
                            };
                            for (var indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                                _loop_3(indexLOD);
                            }
                            _this._loader.logClose();
                            return firstPromise;
                        });
                    };
                    /** @hidden */
                    MSFT_lod.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                        var _this = this;
                        // Don't load material LODs if already loading a node LOD.
                        if (this._nodeIndexLOD) {
                            return null;
                        }
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
                            var firstPromise;
                            var materialLODs = _this._getLODs(extensionContext, material, _this._loader.gltf.materials, extension.ids);
                            _this._loader.logOpen("" + extensionContext);
                            var _loop_4 = function (indexLOD) {
                                var materialLOD = materialLODs[indexLOD];
                                if (indexLOD !== 0) {
                                    _this._materialIndexLOD = indexLOD;
                                }
                                var promise = _this._loader._loadMaterialAsync("#/materials/" + materialLOD.index, materialLOD, babylonMesh, babylonDrawMode, function (babylonMaterial) {
                                    if (indexLOD === 0) {
                                        assign(babylonMaterial);
                                    }
                                }).then(function (babylonMaterial) {
                                    if (indexLOD !== 0) {
                                        assign(babylonMaterial);
                                        // TODO: should not rely on _data
                                        var previousDataLOD = materialLODs[indexLOD - 1]._data;
                                        if (previousDataLOD[babylonDrawMode]) {
                                            previousDataLOD[babylonDrawMode].babylonMaterial.dispose();
                                            delete previousDataLOD[babylonDrawMode];
                                        }
                                    }
                                    return babylonMaterial;
                                });
                                if (indexLOD === 0) {
                                    firstPromise = promise;
                                }
                                else {
                                    _this._materialIndexLOD = null;
                                }
                                _this._materialPromiseLODs[indexLOD] = _this._materialPromiseLODs[indexLOD] || [];
                                _this._materialPromiseLODs[indexLOD].push(promise);
                            };
                            for (var indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                                _loop_4(indexLOD);
                            }
                            _this._loader.logClose();
                            return firstPromise;
                        });
                    };
                    /** @hidden */
                    MSFT_lod.prototype._loadUriAsync = function (context, uri) {
                        var _this = this;
                        // Defer the loading of uris if loading a material or node LOD.
                        if (this._materialIndexLOD !== null) {
                            this._loader.log("deferred");
                            var previousIndexLOD = this._materialIndexLOD - 1;
                            this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new BABYLON.Deferred();
                            return this._materialSignalLODs[previousIndexLOD].promise.then(function () {
                                return _this._loader.loadUriAsync(context, uri);
                            });
                        }
                        else if (this._nodeIndexLOD !== null) {
                            this._loader.log("deferred");
                            var previousIndexLOD = this._nodeIndexLOD - 1;
                            this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new BABYLON.Deferred();
                            return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(function () {
                                return _this._loader.loadUriAsync(context, uri);
                            });
                        }
                        return null;
                    };
                    /**
                     * Gets an array of LOD properties from lowest to highest.
                     */
                    MSFT_lod.prototype._getLODs = function (context, property, array, ids) {
                        if (this.maxLODsToLoad <= 0) {
                            throw new Error("maxLODsToLoad must be greater than zero");
                        }
                        var properties = new Array();
                        for (var i = ids.length - 1; i >= 0; i--) {
                            properties.push(GLTF2.ArrayItem.Get(context + "/ids/" + ids[i], array, ids[i]));
                            if (properties.length === this.maxLODsToLoad) {
                                return properties;
                            }
                        }
                        properties.push(property);
                        return properties;
                    };
                    MSFT_lod.prototype._disposeUnusedMaterials = function () {
                        // TODO: should not rely on _data
                        var materials = this._loader.gltf.materials;
                        if (materials) {
                            for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
                                var material = materials_1[_i];
                                if (material._data) {
                                    for (var drawMode in material._data) {
                                        var data = material._data[drawMode];
                                        if (data.babylonMeshes.length === 0) {
                                            data.babylonMaterial.dispose(false, true);
                                            delete material._data[drawMode];
                                        }
                                    }
                                }
                            }
                        }
                    };
                    return MSFT_lod;
                }());
                Extensions.MSFT_lod = MSFT_lod;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new MSFT_lod(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_lod.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "MSFT_minecraftMesh";
                /** @hidden */
                var MSFT_minecraftMesh = /** @class */ (function () {
                    function MSFT_minecraftMesh(loader) {
                        this.name = NAME;
                        this.enabled = true;
                        this._loader = loader;
                    }
                    MSFT_minecraftMesh.prototype.dispose = function () {
                        delete this._loader;
                    };
                    MSFT_minecraftMesh.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtraAsync(context, material, this.name, function (extraContext, extra) {
                            if (extra) {
                                if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                                    throw new Error(extraContext + ": Material type not supported");
                                }
                                var promise = _this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
                                if (babylonMaterial.needAlphaBlending()) {
                                    babylonMaterial.forceDepthWrite = true;
                                    babylonMaterial.separateCullingPass = true;
                                }
                                babylonMaterial.backFaceCulling = babylonMaterial.forceDepthWrite;
                                babylonMaterial.twoSidedLighting = true;
                                return promise;
                            }
                            return null;
                        });
                    };
                    return MSFT_minecraftMesh;
                }());
                Extensions.MSFT_minecraftMesh = MSFT_minecraftMesh;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new MSFT_minecraftMesh(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_minecraftMesh.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "MSFT_sRGBFactors";
                /** @hidden */
                var MSFT_sRGBFactors = /** @class */ (function () {
                    function MSFT_sRGBFactors(loader) {
                        this.name = NAME;
                        this.enabled = true;
                        this._loader = loader;
                    }
                    MSFT_sRGBFactors.prototype.dispose = function () {
                        delete this._loader;
                    };
                    MSFT_sRGBFactors.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtraAsync(context, material, this.name, function (extraContext, extra) {
                            if (extra) {
                                if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                                    throw new Error(extraContext + ": Material type not supported");
                                }
                                var promise = _this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
                                if (!babylonMaterial.albedoTexture) {
                                    babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor);
                                }
                                if (!babylonMaterial.reflectivityTexture) {
                                    babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor);
                                }
                                return promise;
                            }
                            return null;
                        });
                    };
                    return MSFT_sRGBFactors;
                }());
                Extensions.MSFT_sRGBFactors = MSFT_sRGBFactors;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new MSFT_sRGBFactors(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_sRGBFactors.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "MSFT_audio_emitter";
                /**
                 * [Specification](https://github.com/najadojo/glTF/tree/MSFT_audio_emitter/extensions/2.0/Vendor/MSFT_audio_emitter)
                 */
                var MSFT_audio_emitter = /** @class */ (function () {
                    /** @hidden */
                    function MSFT_audio_emitter(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    MSFT_audio_emitter.prototype.dispose = function () {
                        delete this._loader;
                        delete this._clips;
                        delete this._emitters;
                    };
                    /** @hidden */
                    MSFT_audio_emitter.prototype.onLoading = function () {
                        var extensions = this._loader.gltf.extensions;
                        if (extensions && extensions[this.name]) {
                            var extension = extensions[this.name];
                            this._clips = extension.clips;
                            this._emitters = extension.emitters;
                            GLTF2.ArrayItem.Assign(this._clips);
                            GLTF2.ArrayItem.Assign(this._emitters);
                        }
                    };
                    /** @hidden */
                    MSFT_audio_emitter.prototype.loadSceneAsync = function (context, scene) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, scene, this.name, function (extensionContext, extension) {
                            var promises = new Array();
                            promises.push(_this._loader.loadSceneAsync(context, scene));
                            for (var _i = 0, _a = extension.emitters; _i < _a.length; _i++) {
                                var emitterIndex = _a[_i];
                                var emitter = GLTF2.ArrayItem.Get(extensionContext + "/emitters", _this._emitters, emitterIndex);
                                if (emitter.refDistance != undefined || emitter.maxDistance != undefined || emitter.rolloffFactor != undefined ||
                                    emitter.distanceModel != undefined || emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                                    throw new Error(extensionContext + ": Direction or Distance properties are not allowed on emitters attached to a scene");
                                }
                                promises.push(_this._loadEmitterAsync(extensionContext + "/emitters/" + emitter.index, emitter));
                            }
                            return Promise.all(promises).then(function () { });
                        });
                    };
                    /** @hidden */
                    MSFT_audio_emitter.prototype.loadNodeAsync = function (context, node, assign) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
                            var promises = new Array();
                            return _this._loader.loadNodeAsync(extensionContext, node, function (babylonMesh) {
                                var _loop_1 = function (emitterIndex) {
                                    var emitter = GLTF2.ArrayItem.Get(extensionContext + "/emitters", _this._emitters, emitterIndex);
                                    promises.push(_this._loadEmitterAsync(extensionContext + "/emitters/" + emitter.index, emitter).then(function () {
                                        for (var _i = 0, _a = emitter._babylonSounds; _i < _a.length; _i++) {
                                            var sound = _a[_i];
                                            sound.attachToMesh(babylonMesh);
                                            if (emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                                                sound.setLocalDirectionToMesh(BABYLON.Vector3.Forward());
                                                sound.setDirectionalCone(2 * BABYLON.Tools.ToDegrees(emitter.innerAngle == undefined ? Math.PI : emitter.innerAngle), 2 * BABYLON.Tools.ToDegrees(emitter.outerAngle == undefined ? Math.PI : emitter.outerAngle), 0);
                                            }
                                        }
                                    }));
                                };
                                for (var _i = 0, _a = extension.emitters; _i < _a.length; _i++) {
                                    var emitterIndex = _a[_i];
                                    _loop_1(emitterIndex);
                                }
                                assign(babylonMesh);
                            }).then(function (babylonMesh) {
                                return Promise.all(promises).then(function () {
                                    return babylonMesh;
                                });
                            });
                        });
                    };
                    /** @hidden */
                    MSFT_audio_emitter.prototype.loadAnimationAsync = function (context, animation) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, animation, this.name, function (extensionContext, extension) {
                            return _this._loader.loadAnimationAsync(context, animation).then(function (babylonAnimationGroup) {
                                var promises = new Array();
                                GLTF2.ArrayItem.Assign(extension.events);
                                for (var _i = 0, _a = extension.events; _i < _a.length; _i++) {
                                    var event_1 = _a[_i];
                                    promises.push(_this._loadAnimationEventAsync(extensionContext + "/events/" + event_1.index, context, animation, event_1, babylonAnimationGroup));
                                }
                                return Promise.all(promises).then(function () {
                                    return babylonAnimationGroup;
                                });
                            });
                        });
                    };
                    MSFT_audio_emitter.prototype._loadClipAsync = function (context, clip) {
                        if (clip._objectURL) {
                            return clip._objectURL;
                        }
                        var promise;
                        if (clip.uri) {
                            promise = this._loader.loadUriAsync(context, clip.uri);
                        }
                        else {
                            var bufferView = GLTF2.ArrayItem.Get(context + "/bufferView", this._loader.gltf.bufferViews, clip.bufferView);
                            promise = this._loader.loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView);
                        }
                        clip._objectURL = promise.then(function (data) {
                            return URL.createObjectURL(new Blob([data], { type: clip.mimeType }));
                        });
                        return clip._objectURL;
                    };
                    MSFT_audio_emitter.prototype._loadEmitterAsync = function (context, emitter) {
                        var _this = this;
                        emitter._babylonSounds = emitter._babylonSounds || [];
                        if (!emitter._babylonData) {
                            var clipPromises = new Array();
                            var name_1 = emitter.name || "emitter" + emitter.index;
                            var options_1 = {
                                loop: false,
                                autoplay: false,
                                volume: emitter.volume == undefined ? 1 : emitter.volume,
                            };
                            var _loop_2 = function (i) {
                                var clipContext = "#/extensions/" + this_1.name + "/clips";
                                var clip = GLTF2.ArrayItem.Get(clipContext, this_1._clips, emitter.clips[i].clip);
                                clipPromises.push(this_1._loadClipAsync(clipContext + "/" + emitter.clips[i].clip, clip).then(function (objectURL) {
                                    var sound = emitter._babylonSounds[i] = new BABYLON.Sound(name_1, objectURL, _this._loader.babylonScene, null, options_1);
                                    sound.refDistance = emitter.refDistance || 1;
                                    sound.maxDistance = emitter.maxDistance || 256;
                                    sound.rolloffFactor = emitter.rolloffFactor || 1;
                                    sound.distanceModel = emitter.distanceModel || 'exponential';
                                    sound._positionInEmitterSpace = true;
                                }));
                            };
                            var this_1 = this;
                            for (var i = 0; i < emitter.clips.length; i++) {
                                _loop_2(i);
                            }
                            var promise = Promise.all(clipPromises).then(function () {
                                var weights = emitter.clips.map(function (clip) { return clip.weight || 1; });
                                var weightedSound = new BABYLON.WeightedSound(emitter.loop || false, emitter._babylonSounds, weights);
                                if (emitter.innerAngle) {
                                    weightedSound.directionalConeInnerAngle = 2 * BABYLON.Tools.ToDegrees(emitter.innerAngle);
                                }
                                if (emitter.outerAngle) {
                                    weightedSound.directionalConeOuterAngle = 2 * BABYLON.Tools.ToDegrees(emitter.outerAngle);
                                }
                                if (emitter.volume) {
                                    weightedSound.volume = emitter.volume;
                                }
                                emitter._babylonData.sound = weightedSound;
                            });
                            emitter._babylonData = {
                                loaded: promise
                            };
                        }
                        return emitter._babylonData.loaded;
                    };
                    MSFT_audio_emitter.prototype._getEventAction = function (context, sound, action, time, startOffset) {
                        switch (action) {
                            case "play" /* play */: {
                                return function (currentFrame) {
                                    var frameOffset = (startOffset || 0) + (currentFrame - time);
                                    sound.play(frameOffset);
                                };
                            }
                            case "stop" /* stop */: {
                                return function (currentFrame) {
                                    sound.stop();
                                };
                            }
                            case "pause" /* pause */: {
                                return function (currentFrame) {
                                    sound.pause();
                                };
                            }
                            default: {
                                throw new Error(context + ": Unsupported action " + action);
                            }
                        }
                    };
                    MSFT_audio_emitter.prototype._loadAnimationEventAsync = function (context, animationContext, animation, event, babylonAnimationGroup) {
                        var _this = this;
                        if (babylonAnimationGroup.targetedAnimations.length == 0) {
                            return Promise.resolve();
                        }
                        var babylonAnimation = babylonAnimationGroup.targetedAnimations[0];
                        var emitterIndex = event.emitter;
                        var emitter = GLTF2.ArrayItem.Get("#/extensions/" + this.name + "/emitters", this._emitters, emitterIndex);
                        return this._loadEmitterAsync(context, emitter).then(function () {
                            var sound = emitter._babylonData.sound;
                            if (sound) {
                                var babylonAnimationEvent = new BABYLON.AnimationEvent(event.time, _this._getEventAction(context, sound, event.action, event.time, event.startOffset));
                                babylonAnimation.animation.addEvent(babylonAnimationEvent);
                                // Make sure all started audio stops when this animation is terminated.
                                babylonAnimationGroup.onAnimationGroupEndObservable.add(function () {
                                    sound.stop();
                                });
                                babylonAnimationGroup.onAnimationGroupPauseObservable.add(function () {
                                    sound.pause();
                                });
                            }
                        });
                    };
                    return MSFT_audio_emitter;
                }());
                Extensions.MSFT_audio_emitter = MSFT_audio_emitter;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new MSFT_audio_emitter(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_audio_emitter.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_draco_mesh_compression";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
                 */
                var KHR_draco_mesh_compression = /** @class */ (function () {
                    /** @hidden */
                    function KHR_draco_mesh_compression(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = BABYLON.DracoCompression.DecoderAvailable;
                        this._loader = loader;
                    }
                    /** @hidden */
                    KHR_draco_mesh_compression.prototype.dispose = function () {
                        if (this._dracoCompression) {
                            this._dracoCompression.dispose();
                            delete this._dracoCompression;
                        }
                        delete this._loader;
                    };
                    /** @hidden */
                    KHR_draco_mesh_compression.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, primitive, this.name, function (extensionContext, extension) {
                            if (primitive.mode != undefined) {
                                if (primitive.mode !== 5 /* TRIANGLE_STRIP */ &&
                                    primitive.mode !== 4 /* TRIANGLES */) {
                                    throw new Error(context + ": Unsupported mode " + primitive.mode);
                                }
                                // TODO: handle triangle strips
                                if (primitive.mode === 5 /* TRIANGLE_STRIP */) {
                                    throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                                }
                            }
                            var attributes = {};
                            var loadAttribute = function (name, kind) {
                                var uniqueId = extension.attributes[name];
                                if (uniqueId == undefined) {
                                    return;
                                }
                                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                                    babylonMesh._delayInfo.push(kind);
                                }
                                attributes[kind] = uniqueId;
                            };
                            loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                            loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                            loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                            loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                            loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                            loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                            loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                            loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind);
                            var bufferView = GLTF2.ArrayItem.Get(extensionContext, _this._loader.gltf.bufferViews, extension.bufferView);
                            if (!bufferView._dracoBabylonGeometry) {
                                bufferView._dracoBabylonGeometry = _this._loader.loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                                    if (!_this._dracoCompression) {
                                        _this._dracoCompression = new BABYLON.DracoCompression();
                                    }
                                    return _this._dracoCompression.decodeMeshAsync(data, attributes).then(function (babylonVertexData) {
                                        var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, _this._loader.babylonScene);
                                        babylonVertexData.applyToGeometry(babylonGeometry);
                                        return babylonGeometry;
                                    }).catch(function (error) {
                                        throw new Error(context + ": " + error.message);
                                    });
                                });
                            }
                            return bufferView._dracoBabylonGeometry;
                        });
                    };
                    return KHR_draco_mesh_compression;
                }());
                Extensions.KHR_draco_mesh_compression = KHR_draco_mesh_compression;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new KHR_draco_mesh_compression(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_draco_mesh_compression.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_materials_pbrSpecularGlossiness";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
                 */
                var KHR_materials_pbrSpecularGlossiness = /** @class */ (function () {
                    /** @hidden */
                    function KHR_materials_pbrSpecularGlossiness(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    KHR_materials_pbrSpecularGlossiness.prototype.dispose = function () {
                        delete this._loader;
                    };
                    /** @hidden */
                    KHR_materials_pbrSpecularGlossiness.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
                            var promises = new Array();
                            promises.push(_this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                            promises.push(_this._loadSpecularGlossinessPropertiesAsync(extensionContext, material, extension, babylonMaterial));
                            _this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
                            return Promise.all(promises).then(function () { });
                        });
                    };
                    KHR_materials_pbrSpecularGlossiness.prototype._loadSpecularGlossinessPropertiesAsync = function (context, material, properties, babylonMaterial) {
                        if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                            throw new Error(context + ": Material type not supported");
                        }
                        var promises = new Array();
                        babylonMaterial.metallic = null;
                        babylonMaterial.roughness = null;
                        if (properties.diffuseFactor) {
                            babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.diffuseFactor);
                            babylonMaterial.alpha = properties.diffuseFactor[3];
                        }
                        else {
                            babylonMaterial.albedoColor = BABYLON.Color3.White();
                        }
                        babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : BABYLON.Color3.White();
                        babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;
                        if (properties.diffuseTexture) {
                            promises.push(this._loader.loadTextureInfoAsync(context + "/diffuseTexture", properties.diffuseTexture, function (texture) {
                                texture.name = babylonMaterial.name + " (Diffuse)";
                                babylonMaterial.albedoTexture = texture;
                            }));
                        }
                        if (properties.specularGlossinessTexture) {
                            promises.push(this._loader.loadTextureInfoAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, function (texture) {
                                texture.name = babylonMaterial.name + " (Specular Glossiness)";
                                babylonMaterial.reflectivityTexture = texture;
                            }));
                            babylonMaterial.reflectivityTexture.hasAlpha = true;
                            babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                        }
                        return Promise.all(promises).then(function () { });
                    };
                    return KHR_materials_pbrSpecularGlossiness;
                }());
                Extensions.KHR_materials_pbrSpecularGlossiness = KHR_materials_pbrSpecularGlossiness;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new KHR_materials_pbrSpecularGlossiness(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_materials_unlit";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
                 */
                var KHR_materials_unlit = /** @class */ (function () {
                    /** @hidden */
                    function KHR_materials_unlit(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    KHR_materials_unlit.prototype.dispose = function () {
                        delete this._loader;
                    };
                    /** @hidden */
                    KHR_materials_unlit.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, material, this.name, function () {
                            return _this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
                        });
                    };
                    KHR_materials_unlit.prototype._loadUnlitPropertiesAsync = function (context, material, babylonMaterial) {
                        if (!(babylonMaterial instanceof BABYLON.PBRMaterial)) {
                            throw new Error(context + ": Material type not supported");
                        }
                        var promises = new Array();
                        babylonMaterial.unlit = true;
                        var properties = material.pbrMetallicRoughness;
                        if (properties) {
                            if (properties.baseColorFactor) {
                                babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                                babylonMaterial.alpha = properties.baseColorFactor[3];
                            }
                            else {
                                babylonMaterial.albedoColor = BABYLON.Color3.White();
                            }
                            if (properties.baseColorTexture) {
                                promises.push(this._loader.loadTextureInfoAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                                    texture.name = babylonMaterial.name + " (Base Color)";
                                    babylonMaterial.albedoTexture = texture;
                                }));
                            }
                        }
                        if (material.doubleSided) {
                            babylonMaterial.backFaceCulling = false;
                            babylonMaterial.twoSidedLighting = true;
                        }
                        this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
                        return Promise.all(promises).then(function () { });
                    };
                    return KHR_materials_unlit;
                }());
                Extensions.KHR_materials_unlit = KHR_materials_unlit;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new KHR_materials_unlit(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_unlit.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_lights_punctual";
                var LightType;
                (function (LightType) {
                    LightType["DIRECTIONAL"] = "directional";
                    LightType["POINT"] = "point";
                    LightType["SPOT"] = "spot";
                })(LightType || (LightType = {}));
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/blob/1048d162a44dbcb05aefc1874bfd423cf60135a6/extensions/2.0/Khronos/KHR_lights_punctual/README.md) (Experimental)
                 */
                var KHR_lights = /** @class */ (function () {
                    /** @hidden */
                    function KHR_lights(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    KHR_lights.prototype.dispose = function () {
                        delete this._loader;
                        delete this._lights;
                    };
                    /** @hidden */
                    KHR_lights.prototype.onLoading = function () {
                        var extensions = this._loader.gltf.extensions;
                        if (extensions && extensions[this.name]) {
                            var extension = extensions[this.name];
                            this._lights = extension.lights;
                        }
                    };
                    /** @hidden */
                    KHR_lights.prototype.loadNodeAsync = function (context, node, assign) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
                            return _this._loader.loadNodeAsync(context, node, function (babylonMesh) {
                                var babylonLight;
                                var light = GLTF2.ArrayItem.Get(extensionContext, _this._lights, extension.light);
                                var name = light.name || babylonMesh.name;
                                switch (light.type) {
                                    case LightType.DIRECTIONAL: {
                                        babylonLight = new BABYLON.DirectionalLight(name, BABYLON.Vector3.Backward(), _this._loader.babylonScene);
                                        break;
                                    }
                                    case LightType.POINT: {
                                        babylonLight = new BABYLON.PointLight(name, BABYLON.Vector3.Zero(), _this._loader.babylonScene);
                                        break;
                                    }
                                    case LightType.SPOT: {
                                        var babylonSpotLight = new BABYLON.SpotLight(name, BABYLON.Vector3.Zero(), BABYLON.Vector3.Backward(), 0, 1, _this._loader.babylonScene);
                                        babylonSpotLight.angle = ((light.spot && light.spot.outerConeAngle) || Math.PI / 4) * 2;
                                        babylonSpotLight.innerAngle = ((light.spot && light.spot.innerConeAngle) || 0) * 2;
                                        babylonLight = babylonSpotLight;
                                        break;
                                    }
                                    default: {
                                        throw new Error(extensionContext + ": Invalid light type (" + light.type + ")");
                                    }
                                }
                                babylonLight.falloffType = BABYLON.Light.FALLOFF_GLTF;
                                babylonLight.diffuse = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.White();
                                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                                babylonLight.range = light.range == undefined ? Number.MAX_VALUE : light.range;
                                babylonLight.parent = babylonMesh;
                                GLTF2.GLTFLoader.AddPointerMetadata(babylonLight, extensionContext);
                                assign(babylonMesh);
                            });
                        });
                    };
                    return KHR_lights;
                }());
                Extensions.KHR_lights = KHR_lights;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new KHR_lights(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_lights_punctual.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_texture_transform";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform/README.md)
                 */
                var KHR_texture_transform = /** @class */ (function () {
                    /** @hidden */
                    function KHR_texture_transform(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    KHR_texture_transform.prototype.dispose = function () {
                        delete this._loader;
                    };
                    /** @hidden */
                    KHR_texture_transform.prototype.loadTextureInfoAsync = function (context, textureInfo, assign) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, textureInfo, this.name, function (extensionContext, extension) {
                            return _this._loader.loadTextureInfoAsync(context, textureInfo, function (babylonTexture) {
                                if (!(babylonTexture instanceof BABYLON.Texture)) {
                                    throw new Error(extensionContext + ": Texture type not supported");
                                }
                                if (extension.offset) {
                                    babylonTexture.uOffset = extension.offset[0];
                                    babylonTexture.vOffset = extension.offset[1];
                                }
                                // Always rotate around the origin.
                                babylonTexture.uRotationCenter = 0;
                                babylonTexture.vRotationCenter = 0;
                                if (extension.rotation) {
                                    babylonTexture.wAng = -extension.rotation;
                                }
                                if (extension.scale) {
                                    babylonTexture.uScale = extension.scale[0];
                                    babylonTexture.vScale = extension.scale[1];
                                }
                                if (extension.texCoord != undefined) {
                                    babylonTexture.coordinatesIndex = extension.texCoord;
                                }
                                assign(babylonTexture);
                            });
                        });
                    };
                    return KHR_texture_transform;
                }());
                Extensions.KHR_texture_transform = KHR_texture_transform;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new KHR_texture_transform(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_texture_transform.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Loader;
        (function (Loader) {
            var Extensions;
            (function (Extensions) {
                var NAME = "EXT_lights_image_based";
                /**
                 * [Specification](https://github.com/KhronosGroup/glTF/blob/eb3e32332042e04691a5f35103f8c261e50d8f1e/extensions/2.0/Khronos/EXT_lights_image_based/README.md) (Experimental)
                 */
                var EXT_lights_image_based = /** @class */ (function () {
                    /** @hidden */
                    function EXT_lights_image_based(loader) {
                        /** The name of this extension. */
                        this.name = NAME;
                        /** Defines whether this extension is enabled. */
                        this.enabled = true;
                        this._loader = loader;
                    }
                    /** @hidden */
                    EXT_lights_image_based.prototype.dispose = function () {
                        delete this._loader;
                        delete this._lights;
                    };
                    /** @hidden */
                    EXT_lights_image_based.prototype.onLoading = function () {
                        var extensions = this._loader.gltf.extensions;
                        if (extensions && extensions[this.name]) {
                            var extension = extensions[this.name];
                            this._lights = extension.lights;
                        }
                    };
                    /** @hidden */
                    EXT_lights_image_based.prototype.loadSceneAsync = function (context, scene) {
                        var _this = this;
                        return GLTF2.GLTFLoader.LoadExtensionAsync(context, scene, this.name, function (extensionContext, extension) {
                            var promises = new Array();
                            promises.push(_this._loader.loadSceneAsync(context, scene));
                            _this._loader.logOpen("" + extensionContext);
                            var light = GLTF2.ArrayItem.Get(extensionContext + "/light", _this._lights, extension.light);
                            promises.push(_this._loadLightAsync("#/extensions/" + _this.name + "/lights/" + extension.light, light).then(function (texture) {
                                _this._loader.babylonScene.environmentTexture = texture;
                            }));
                            _this._loader.logClose();
                            return Promise.all(promises).then(function () { });
                        });
                    };
                    EXT_lights_image_based.prototype._loadLightAsync = function (context, light) {
                        var _this = this;
                        if (!light._loaded) {
                            var promises = new Array();
                            this._loader.logOpen("" + context);
                            var imageData_1 = new Array(light.specularImages.length);
                            var _loop_1 = function (mipmap) {
                                var faces = light.specularImages[mipmap];
                                imageData_1[mipmap] = new Array(faces.length);
                                var _loop_2 = function (face) {
                                    var specularImageContext = context + "/specularImages/" + mipmap + "/" + face;
                                    this_1._loader.logOpen("" + specularImageContext);
                                    var index = faces[face];
                                    var image = GLTF2.ArrayItem.Get(specularImageContext, this_1._loader.gltf.images, index);
                                    promises.push(this_1._loader.loadImageAsync("#/images/" + index, image).then(function (data) {
                                        imageData_1[mipmap][face] = data;
                                    }));
                                    this_1._loader.logClose();
                                };
                                for (var face = 0; face < faces.length; face++) {
                                    _loop_2(face);
                                }
                            };
                            var this_1 = this;
                            for (var mipmap = 0; mipmap < light.specularImages.length; mipmap++) {
                                _loop_1(mipmap);
                            }
                            this._loader.logClose();
                            light._loaded = Promise.all(promises).then(function () {
                                var babylonTexture = new BABYLON.RawCubeTexture(_this._loader.babylonScene, null, light.specularImageSize);
                                light._babylonTexture = babylonTexture;
                                if (light.intensity != undefined) {
                                    babylonTexture.level = light.intensity;
                                }
                                if (light.rotation) {
                                    var rotation = BABYLON.Quaternion.FromArray(light.rotation);
                                    // Invert the rotation so that positive rotation is counter-clockwise.
                                    if (!_this._loader.babylonScene.useRightHandedSystem) {
                                        rotation = BABYLON.Quaternion.Inverse(rotation);
                                    }
                                    BABYLON.Matrix.FromQuaternionToRef(rotation, babylonTexture.getReflectionTextureMatrix());
                                }
                                var sphericalHarmonics = BABYLON.SphericalHarmonics.FromArray(light.irradianceCoefficients);
                                sphericalHarmonics.scale(light.intensity);
                                sphericalHarmonics.convertIrradianceToLambertianRadiance();
                                var sphericalPolynomial = BABYLON.SphericalPolynomial.FromHarmonics(sphericalHarmonics);
                                // Compute the lod generation scale to fit exactly to the number of levels available.
                                var lodGenerationScale = (imageData_1.length - 1) / BABYLON.Scalar.Log2(light.specularImageSize);
                                return babylonTexture.updateRGBDAsync(imageData_1, sphericalPolynomial, lodGenerationScale);
                            });
                        }
                        return light._loaded.then(function () {
                            return light._babylonTexture;
                        });
                    };
                    return EXT_lights_image_based;
                }());
                Extensions.EXT_lights_image_based = EXT_lights_image_based;
                GLTF2.GLTFLoader.RegisterExtension(NAME, function (loader) { return new EXT_lights_image_based(loader); });
            })(Extensions = Loader.Extensions || (Loader.Extensions = {}));
        })(Loader = GLTF2.Loader || (GLTF2.Loader = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=EXT_lights_image_based.js.map

    

    return BABYLON;
});

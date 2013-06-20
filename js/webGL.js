var canvas, gl, FBO, shaderPrograms = {}, vertexArrays = {},
    frontBuffer = false, identityMatrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function resizeCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    FBO.width = canvas.width*controls.resolution.value;
    FBO.height = canvas.height*controls.resolution.value;
    for(var i in FBO.colorBuffers) {
        var colorBuffer = FBO.colorBuffers[i];
        gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, FBO.width, FBO.height, 0, gl.RGB, gl.FLOAT, null);
    }
    for(var i in shaderPrograms) {
        var program = shaderPrograms[i];
        gl.useProgram(program);
        var uniform = gl.getUniformLocation(program, 'pixelSize');
        if(!uniform) continue;
        gl.uniform2f(uniform, 1.0/FBO.width, 1.0/FBO.height);
    }
}

function addColorBuffer(name) {
    var colorBuffer = FBO.colorBuffers[name] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function addVertexArray(name, data) {
    vertexArrays[name] = {'verticesCount': data.length/2};
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexArrays[name].buffer = gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
}

function init() {
    canvas = document.getElementById('canvas');
    var webGl = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'],
        webGlOptions = {'alpha':false, 'depth':false, 'antialias':false, 'preserveDrawingBuffer': true};
    for(var i = 0; i < webGl.length; i ++) {
        try {
            gl = canvas.getContext(webGl[i], webGlOptions);
            if(gl) break;
        } catch(e) { }
    }
    document.body.onresize = resizeCanvas;
    initControls();

    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.getExtension('OES_texture_float');

    FBO = gl.createFramebuffer();
    FBO.colorBuffers = [];
    addColorBuffer('impulseA');
    addColorBuffer('impulseB');
    addColorBuffer('pressure');
    addColorBuffer('densityA');
    addColorBuffer('densityB');

    var circleVertices = [];
    for(var a = 0; a < Math.PI*2.0; a += Math.PI*0.05) {
        circleVertices.push(Math.sin(a));
        circleVertices.push(Math.cos(a));
    }
    addVertexArray('circle', circleVertices);
    addVertexArray('triangle', [-0.866, -0.5, 0.0, 1.0, 0.866, -0.5]);
    addVertexArray('rect', [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]);

    var loadedShaders = {}, shadersToLoad = 0, programs = {
        'circularForce': {'shaders': ['kernel.vertex', 'circularForce.frag'], 'attributes': ['vertex']},
        'radialForce': {'shaders': ['kernel.vertex', 'radialForce.frag'], 'attributes': ['vertex']},
        'advect': {'shaders': ['kernel.vertex', 'advect.frag'], 'attributes': ['vertex']},
        'pressure': {'shaders': ['kernel.vertex', 'pressure.frag'], 'attributes': ['vertex']},
        'density': {'shaders': ['kernel.vertex', 'density.frag'], 'attributes': ['vertex']},
        'diffusion': {'shaders': ['kernel.vertex', 'diffusion.frag'], 'attributes': ['vertex']},
        'visualize': {'shaders': ['kernel.vertex', 'visualize.frag'], 'attributes': ['vertex']},
        'monochrome': {'shaders': ['kernel.vertex', 'monochrome.frag'], 'attributes': ['vertex']},
        'textured': {'shaders': ['kernel.vertex', 'textured.frag'], 'attributes': ['vertex']}
    };

    function loadShader() {
        shadersToLoad --;
    
        var shader = loadedShaders[this.name] = gl.createShader(this.type);
        gl.shaderSource(shader, this.response);
        gl.compileShader(shader);
    
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(shader));

        if(shadersToLoad <= 0) {
            for(var i in programs) {
                var program = shaderPrograms[i] = gl.createProgram();

                for(var j = 0; j < programs[i].shaders.length; j ++)
                    gl.attachShader(program, loadedShaders[programs[i].shaders[j]]);
                
                for(var j = 0; j < programs[i].attributes; j ++)
                    gl.bindAttribLocation(program, i, programs[i].attributes[j]);
                
                gl.linkProgram(program);
                if(!gl.getProgramParameter(program, gl.LINK_STATUS))
                    console.log(gl.getProgramInfoLog(program));

                gl.useProgram(program);
                for(var i = 0; true; i ++) {
                    var uniform = gl.getUniformLocation(program, 'texture'+i);
                    if(!uniform) break;
                    gl.uniform1i(uniform, i);
                }
            }

            startTicks();
        }
    }

    for(var i in programs)
        for(var j = 0; j < programs[i].shaders.length; j ++)
            loadedShaders[programs[i].shaders[j]] = null;

    for(var i in loadedShaders) {
        shadersToLoad ++;

        var request = new XMLHttpRequest();
        if(i.substr(-5) == '.frag')
            request.type = gl.FRAGMENT_SHADER;
        else if(i.substr(-7) == '.vertex')
            request.type = gl.VERTEX_SHADER;
        else {
            console.log('ERROR: Invalid shader type: '+i);
            return;
        }

        request.name = i;
        request.open('GET', 'glsl/'+i, true);
        request.onload = loadShader;
        request.onerror = function(err) {
            programs.shadersToLoad --;
            console.log('ERROR: Could not load shader: '+i);
        };
        request.send();
    }
}

function clearBuffers() {
    gl.viewport(0, 0, FBO.width, FBO.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FBO.colorBuffers['impulseA'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FBO.colorBuffers['densityA'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function drawPolygon(programName, sources, target, uniforms, blending, form, drawType) {
    var program = shaderPrograms[programName];
    gl.useProgram(program);

    for(var i = 0; i < sources.length; i ++) {
        gl.activeTexture(gl.TEXTURE0+i);
        gl.bindTexture(gl.TEXTURE_2D, (sources[i] == null) ? null : FBO.colorBuffers[sources[i]]);
    }

    if(target == null) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }else{
        gl.viewport(0, 0, FBO.width, FBO.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FBO.colorBuffers[target], 0);
    }

    if(uniforms != null)
        for(var i in uniforms) {
            var uniform = gl.getUniformLocation(program, i);
            if(!uniform) continue;
            switch(uniforms[i].type) {
                case 'mat3':
                gl.uniformMatrix3fv(uniform, false, uniforms[i].value);
                break;
                case 'vec3':
                gl.uniform3fv(uniform, uniforms[i].value);
                break;
                case 'vec2':
                gl.uniform2fv(uniform, uniforms[i].value);
                break;
                case 'float':
                gl.uniform1f(uniform, uniforms[i].value);
                break;
            }
        }

    switch(blending) {
        case 'add':
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
        break;
        case 'scale':
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        break;
        case 'blend':
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        break;
        default:
            gl.disable(gl.BLEND);
    }

    form = form || 'rect';
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexArrays[form].buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
    gl.drawArrays(drawType || gl.TRIANGLE_FAN, 0, vertexArrays[form].verticesCount);
}
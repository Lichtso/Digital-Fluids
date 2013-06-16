function startTicks() {
    var animationFrame = ['webkit', 'moz'];
    for(var x = 0; x < animationFrame.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[animationFrame[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[animationFrame[x]+'CancelAnimationFrame'] ||
                                    window[animationFrame[x]+'CancelRequestAnimationFrame'];
    }
    resizeCanvas();
    tick();
}

function transformationOf(rotation, size, position) {
    var sin = Math.sin(rotation), cos = Math.cos(rotation),
        aspect = canvas.width/canvas.height;
    return [size[0]*cos, -size[0]*sin*aspect, 0,
            size[1]*sin, size[1]*cos*aspect, 0,
            position[0], position[1], 1];
}

function drawArrow(transform) {
    drawPolygon('monochrome', [], null, {
                    'transform': {'type': 'mat3', 'value': transform},
                    'color': {'type': 'vec3', 'value': [1.0, 1.0, 1.0]}
                }, null, 'triangle', gl.LINE_STRIP);
}

function tick(currentTime) {
    if(controlsMode == 'stir')
        canvas.onmousemove();

    drawPolygon('advect', ['impulseA', 'impulseA'], 'impulseB', {
        'transform': {'type': 'mat3', 'value': identityMatrix3},
        'pixelSize': {'type': 'vec2', 'value': [momentum/FBO.width, momentum/FBO.height]},
        'factor': {'type': 'float', 'value': kineticDamping}
    });

    drawPolygon('monochrome', [], 'impulseB', {
        'transform': {'type': 'mat3', 'value': [1.0-1.0/FBO.width, 0, 0, 0, 1.0-1.0/FBO.height, 0, 0, 0, 1]},
        'color': {'type': 'vec3', 'value': [0.0, 0.0, 0.0]}
    }, null, 'rect', gl.LINE_LOOP);

    for(var i = 0; i < objects.length; i ++) {
        var forceScale = (objects[i].forceFreq == 0) ? 1.0 : Math.cos(currentTime*objects[i].forceFreq);
        switch(objects[i].type) {
            case 'rect':
            case 'triangle':
            case 'circle':
                drawPolygon('monochrome', [], 'impulseB', {
                    'transform': {'type': 'mat3', 'value': transformationOf(objects[i].rotation, objects[i].size, objects[i].position)},
                    'color': {'type': 'vec3', 'value': [objects[i].force[0]*forceScale, objects[i].force[1]*forceScale, 0.0]}
                }, (objects[i].force[0] != 0.0 || objects[i].force[1] != 0.0) ? 'add' : null, objects[i].type);
            break;
            case 'gradient':
                drawPolygon('circularForce', [], 'impulseB', {
                    'transform': {'type': 'mat3', 'value': transformationOf(objects[i].rotation, objects[i].size, objects[i].position)},
                    'force': {'type': 'vec2', 'value': [objects[i].force[0]*forceScale, objects[i].force[1]*forceScale]}
                }, 'add');
            break;
            case 'radial':
                drawPolygon('radialForce', [], 'impulseB', {
                    'transform': {'type': 'mat3', 'value': transformationOf(objects[i].rotation, objects[i].size, objects[i].position)},
                    'force': {'type': 'vec2', 'value': [objects[i].force[0]*forceScale, objects[i].force[1]*forceScale]}
                }, 'add');
            break;
        }
    }

    var diffusionBuffer = 'pressure';
    drawPolygon('pressure', ['impulseB'], diffusionBuffer, {
        'transform': {'type': 'mat3', 'value': identityMatrix3}
    });
    
    for(var i = 0; i < iterations; i ++) {
        diffusionBuffer = (i%2 == 0) ? 'densityB' : 'densityA';
        drawPolygon('density', [(i%2 == 0) ? 'densityA' : 'densityB', 'pressure'],
            diffusionBuffer, {
            'transform': {'type': 'mat3', 'value': identityMatrix3}
        });
    }

    drawPolygon('diffusion', [diffusionBuffer, 'impulseB'], 'impulseA', {
        'transform': {'type': 'mat3', 'value': identityMatrix3},
        'factor': {'type': 'float', 'value': pressureDamping}
    });

    drawPolygon('visualize', [(showImpulse) ? 'impulseA' : null, (showDensity) ? diffusionBuffer : null], null, {
        'transform': {'type': 'mat3', 'value': identityMatrix3}
    });

    for(var i = 0; i < objects.length; i ++) {
        switch(objects[i].type) {
            case 'rect':
            case 'triangle':
            case 'circle':
                drawPolygon('monochrome', [], null, {
                    'transform': {'type': 'mat3', 'value': transformationOf(objects[i].rotation,
                        objects[i].size, objects[i].position)},
                    'color': {'type': 'vec3', 'value': [1.0, 1.0, 1.0]}
                }, null, objects[i].type, gl.LINE_LOOP);

            case 'gradient':
                if(objects[i].force[0] != 0.0 || objects[i].force[1] != 0.0)
                    drawArrow(transformationOf(Math.atan2(objects[i].force[0], objects[i].force[1]),
                        [0.05, 0.05], objects[i].position));
                if(objects[i].type != 'gradient') break;

            case 'radial':
                drawPolygon('monochrome', [], null, {
                    'transform': {'type': 'mat3', 'value': transformationOf(objects[i].rotation,
                        objects[i].size, objects[i].position)},
                    'color': {'type': 'vec3', 'value': [1.0, 1.0, 1.0]}
                }, null, 'circle', gl.LINE_LOOP);
                if(objects[i].type == 'gradient') break;

                var sin = Math.sin(objects[i].rotation), cos = Math.cos(objects[i].rotation),
                    rot = Math.atan2(objects[i].force[0], objects[i].force[1])+objects[i].rotation;
                for(var a = 0; a < Math.PI*2.0; a += Math.PI*0.25) {
                    var posX = Math.sin(a)*objects[i].size[0],
                        posY = Math.cos(a)*objects[i].size[1];
                    drawArrow(transformationOf(rot+a,
                        [0.01, 0.01], [objects[i].position[0]+posX*cos+posY*sin,
                        objects[i].position[1]+(posY*cos-posX*sin)*canvas.width/canvas.height]));
                }
            break;
        }
    }

    prevMousePos = mousePos;
    window.requestAnimationFrame(tick);
}
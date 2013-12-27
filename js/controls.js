var controls = { }, grabbedObject, mousePos = [0, 0], prevMousePos, objects = [];

function getMousePosition(event) {
    mousePos = [event.pageX/canvas.width*2.0-1.0, (1.0-event.pageY/canvas.height*2.0)*canvas.height/canvas.width];
}

function selectObject(object) {
    grabbedObject = object;
    if(object) {
        controls.objectType.value = object.type;
        controls.objectFreq.value = object.forceFreq;
    }else
        controls.mode.value = 'none';
    controls.mode.disabled = (object == null);
    spawnButton.value = (object == null) ? 'Create' : 'Remove';
}

function initControls() {
    document.body.style.padding = '0px';
    document.body.style.margin = '0px';

    controls.element = document.getElementById('controls');
    controls.element.style.position = 'absolute';
    controls.element.style.top = '10px';
    controls.element.style.left = '10px';
    controls.element.style.border = '1px solid black';
    controls.element.style.background = 'white';
    controls.element.style.padding = '5px';
    controls.element.style.display = 'block';

    controls.closeControls = document.getElementById('closeControls');
    controls.closeControls.type = 'button';
    controls.closeControls.value = 'Close';
    controls.closeControls.onclick = function() {
        controls.element.style.display = 'none';
    };

    controls.showImpulse = document.getElementById('showImpulse');
    controls.showImpulse.type = 'checkbox';
    controls.showImpulse.checked = true;

    controls.showDensity = document.getElementById('showDensity');
    controls.showDensity.type = 'checkbox';
    controls.showDensity.checked = true;

    controls.clearButton = document.getElementById('clearButton');
    controls.clearButton.type = 'button';
    controls.clearButton.value = 'Clear';
    controls.clearButton.onclick = clearBuffers;

    controls.momentum = document.getElementById('momentum');
    controls.momentum.type = 'range';
    controls.momentum.min = 0.1;
    controls.momentum.max = 2.0;
    controls.momentum.step = 0.1;

    controls.kineticDamping = document.getElementById('kineticDamping');
    controls.kineticDamping.type = 'range';
    controls.kineticDamping.min = 0.95;
    controls.kineticDamping.max = 1.0;
    controls.kineticDamping.step = 0.002;

    controls.pressureDamping = document.getElementById('pressureDamping');
    controls.pressureDamping.type = 'range';
    controls.pressureDamping.min = 0.25;
    controls.pressureDamping.max = 1.0;
    controls.pressureDamping.step = 0.01;

    controls.iterations = document.getElementById('iterations');
    controls.iterations.type = 'range';
    controls.iterations.min = 1;
    controls.iterations.max = 32;
    controls.iterations.step = 1;

    controls.resolution = document.getElementById('resolution');
    controls.resolution.type = 'range';
    controls.resolution.min = 0.125;
    controls.resolution.max = 2.0;
    controls.resolution.step = 0.125;
    controls.resolution.onchange = resizeCanvas;

    controls.spawnButton = document.getElementById('spawnButton');
    controls.spawnButton.type = 'button';
    controls.spawnButton.value = 'Create';
    controls.spawnButton.onclick = function() {
        if(grabbedObject == null) {
            controls.mode.value = 'position';
            selectObject({
                'type': controls.objectType.value,
                'position': [0.0, 0.0],
                'rotation': 0.0,
                'size': [0.1, 0.1],
                'force': [0.0, 0.0],
                'forceFreq': controls.objectFreq.value
            });
            objects.push(grabbedObject);
        }else
            for(var i = 0; i < objects.length; i ++)
                if(objects[i] == grabbedObject) {
                    objects.splice(i, 1);
                    selectObject(null);
                    return;
                }
    };

    controls.objectType = document.getElementById('objectType');
    controls.objectType.onchange = function() {
        if(grabbedObject)
            grabbedObject.type = controls.objectType.value;
    };
    var objectTypes = ['rect', 'textured', 'triangle', 'circle', 'cone', 'radial'];
    for(var i = 0; i < objectTypes.length; i ++) {
        var option = document.createElement('option');
        option.value = option.innerText = objectTypes[i];
        controls.objectType.appendChild(option);
    }

    controls.objectFreq = document.getElementById('objectFreq');
    controls.objectFreq.type = 'range';
    controls.objectFreq.min = 0.0;
    controls.objectFreq.max = 0.02;
    controls.objectFreq.step = 0.0001;
    controls.objectFreq.onchange = function() {
        if(grabbedObject)
            grabbedObject.forceFreq = controls.objectFreq.value;
    };

    controls.mode = document.getElementById('controlsMode');
    controls.mode.disabled = true;
    var modi = ['none', 'position', 'rotation', 'size', 'force', 'stir'];
    for(var i = 0; i < modi.length; i ++) {
        var option = document.createElement('option');
        option.value = option.innerText = modi[i];
        controls.mode.appendChild(option);
    }

    canvas.onclick = function(event) {
        getMousePosition(event);
        controls.element.style.display = 'block';

        if(controlsMode.value == 'none') {
            var minDist, object;
            for(var i = 0; i < objects.length; i ++) {
                var distX = objects[i].position[0]-mousePos[0],
                    distY = objects[i].position[1]-mousePos[1],
                    dist = Math.sqrt(distX*distX+distY*distY);
                if(minDist == null || dist < minDist) {
                    minDist = dist;
                    object = objects[i];
                }
            }

            if(minDist < 0.2)
                selectObject(object);
            else
                selectObject(null);
        }else{
            controlsMode.value = 'none';
            selectObject(grabbedObject);
        }
    };

    canvas.onmousemove = function(event) {
        if(event)
            getMousePosition(event);

        switch(controls.mode.value) {
            case 'stir':
            grabbedObject.force = [(mousePos[0]-prevMousePos[0])*100, (mousePos[1]-prevMousePos[1])*100];
            case 'position':
            grabbedObject.position = mousePos;
            break;
            case 'rotation':
            grabbedObject.rotation = Math.atan2(mousePos[0]-grabbedObject.position[0], mousePos[1]-grabbedObject.position[1]);
            break;
            case 'size':
            grabbedObject.size = [Math.abs(mousePos[0]-grabbedObject.position[0]), Math.abs(mousePos[1]-grabbedObject.position[1])];
            break;
            case 'force':
            grabbedObject.force = [mousePos[0]-grabbedObject.position[0], mousePos[1]-grabbedObject.position[1]];
            break;
        }
    };
}
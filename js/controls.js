var momentum, kineticDamping, pressureDamping, iterations, resolution, showImpulse, showDensity,
    controlsDiv, controlsMode = 'none', grabbedObject, mousePos = [0, 0], prevMousePos, objects = [];

function getMousePosition(event) {
    mousePos = [event.pageX/canvas.width*2.0-1.0, 1.0-event.pageY/canvas.height*2.0];
}

function initControls() {
    momentum = document.getElementById('momentum').value;
    kineticDamping = document.getElementById('kineticDamping').value;
    pressureDamping = document.getElementById('pressureDamping').value;
    iterations = document.getElementById('iterations').value;
    resolution = document.getElementById('resolution').value;
    showImpulse = document.getElementById('kineticDamping').value;
    showDensity = document.getElementById('showDensity').value;
    controlsDiv = document.getElementById('controlsDiv');

    canvas.onclick = function(event) {
        getMousePosition(event);
        controlsDiv.style.display = 'block';

        if(controlsMode == 'none') {
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
            controlsMode = 'none';
            selectObject(grabbedObject);
        }
    };

    canvas.onmousemove = function(event) {
        if(event)
            getMousePosition(event);

        switch(controlsMode) {
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

function setObjectType(element) {
    if(grabbedObject)
        grabbedObject.type = element.value;
}

function setObjectFreq(element) {
    if(grabbedObject)
        grabbedObject.forceFreq = element.value;
}

function selectObject(object) {
    grabbedObject = object;
    if(object)
        document.getElementById('objectType').value = object.type;
    else
        controlsMode = 'none';
    document.getElementById('controlsMode').value = controlsMode;
    document.getElementById('controlsMode').disabled = (object == null);
    document.getElementById('spawnObject').value = (object == null) ? 'Create' : 'Remove';
}

function spawnObject() {
    if(grabbedObject == null) {
        controlsMode = 'position';
        selectObject({
            'type': document.getElementById('objectType').value,
            'position': [0.0, 0.0],
            'rotation': 0.0,
            'size': [0.1, 0.1],
            'force': [0.0, 0.0],
            'forceFreq': document.getElementById('objectFreq').value
        });
        objects.push(grabbedObject);
    }else
        for(var i = 0; i < objects.length; i ++)
            if(objects[i] == grabbedObject) {
                objects.splice(i, 1);
                selectObject(null);
                return;
            }
}
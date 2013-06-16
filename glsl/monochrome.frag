precision highp float;

uniform vec3 color;
varying vec2 uv;

void main() {
    gl_FragColor.rgb = color;
}
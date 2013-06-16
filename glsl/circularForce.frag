precision highp float;

uniform vec2 force;
varying vec2 uv;

void main() {
    gl_FragColor.xy = force*max(0.0, 0.5-length(uv-vec2(0.5)));
}
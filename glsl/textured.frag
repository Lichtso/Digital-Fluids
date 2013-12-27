precision highp float;

uniform sampler2D texture0;
uniform vec3 color;
varying vec2 uv;

void main() {
    gl_FragColor.rgb = color;
    gl_FragColor.a = texture2D(texture0, uv).r;
}
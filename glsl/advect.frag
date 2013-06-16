precision highp float;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 pixelSize;
uniform float factor;
varying vec2 uv;

void main() {
    gl_FragColor.xy = texture2D(texture0, uv-texture2D(texture1, uv).xy*pixelSize).xy*factor;
}
precision highp float;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 pixelSize;
uniform float factor;
varying vec2 uv;

void main() {
	float x0 = texture2D(texture0, uv-vec2(pixelSize.x, 0)).x;
    float x1 = texture2D(texture0, uv+vec2(pixelSize.x, 0)).x;
    float y0 = texture2D(texture0, uv-vec2(0, pixelSize.y)).x;
    float y1 = texture2D(texture0, uv+vec2(0, pixelSize.y)).x;
    gl_FragColor.xy = texture2D(texture1, uv).xy-(vec2(x1, y1)-vec2(x0, y0))*factor;
}
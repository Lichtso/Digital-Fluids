precision highp float;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 pixelSize;
varying vec2 uv;

void main() {
	gl_FragColor.x  = texture2D(texture0, uv-vec2(pixelSize.x, 0.0)).x;
    gl_FragColor.x += texture2D(texture0, uv+vec2(pixelSize.x, 0.0)).x;
    gl_FragColor.x += texture2D(texture0, uv-vec2(0.0, pixelSize.y)).x;
    gl_FragColor.x += texture2D(texture0, uv+vec2(0.0, pixelSize.y)).x;
    gl_FragColor.x -= texture2D(texture1, uv).x;
    gl_FragColor.x *= 0.25;
}
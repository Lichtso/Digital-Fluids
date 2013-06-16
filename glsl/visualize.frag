precision highp float;

uniform sampler2D texture0;
uniform sampler2D texture1;
varying vec2 uv;

void main() {
	gl_FragColor.xyz = vec3(texture2D(texture0, uv).xy, texture2D(texture1, uv).x);
    gl_FragColor.xyz = clamp(gl_FragColor.xyz, vec3(-10.0), vec3(10.0))*0.05+vec3(0.5);
}
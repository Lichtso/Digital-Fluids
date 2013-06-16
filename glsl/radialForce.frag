precision highp float;

uniform vec2 force;
varying vec2 uv;

void main() {
	vec2 centerVec = uv-vec2(0.5);
	vec2 tangetVec = vec2(centerVec.y, -centerVec.x);

	gl_FragColor.xy = tangetVec*force.x + centerVec*force.y;
    gl_FragColor.xy *= step(length(centerVec), 0.49);
}
// GLSL chunk: CIE XYZ (Illuminant C) 0-100 <-> ANLAB (Adams-Nickerson, L 0-100, a/b ±100).
// L/a/b built on the Newhall 1943 Munsell value function V(Y); Y<-V is inverted by
// fixed-iteration Newton (anlab.js runs <=40 with a 1e-9 early-out — the fixed loop
// here always runs 40, converging to float64 precision well before that).
export default {
	name: 'anlab',
	edges: { xyz: ['xyz_anlab', 'anlab_xyz'] },
	code: `
float anlab_valuetoy_(float v) {
	float v2 = v * v; float v3 = v2 * v; float v4 = v3 * v; float v5 = v4 * v;
	return 1.2219 * v - 0.23111 * v2 + 0.23951 * v3 - 0.021009 * v4 + 0.0008404 * v5;
}
float anlab_ytovalue_(float y) {
	float y0 = y; if (y0 < 0.0) { y0 = 0.0; }
	float v = 10.0 * cbrt_(y0 / 100.0);
	for (int i = 0; i < 40; i++) {
		float f = anlab_valuetoy_(v) - y;
		float v2 = v * v; float v3 = v2 * v; float v4 = v3 * v;
		float d = 1.2219 - 0.46222 * v + 0.71853 * v2 - 0.084036 * v3 + 0.004202 * v4;
		v = v - f / d;
	}
	return v;
}
vec3 xyz_anlab(vec3 c) {
	float vx = anlab_ytovalue_(100.0 * c.x / 98.074);
	float vy = anlab_ytovalue_(100.0 * c.y / 100.0);
	float vz = anlab_ytovalue_(100.0 * c.z / 118.232);
	return vec3(9.2 * vy, 40.0 * (vx - vy), 16.0 * (vy - vz));
}
vec3 anlab_xyz(vec3 c) {
	float vy = c.x / 9.2; float vx = vy + c.y / 40.0; float vz = vy - c.z / 16.0;
	return vec3(
		98.074 * anlab_valuetoy_(vx) / 100.0,
		100.0 * anlab_valuetoy_(vy) / 100.0,
		118.232 * anlab_valuetoy_(vz) / 100.0);
}`,
}

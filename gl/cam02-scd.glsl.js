// GLSL chunk: CIECAM02 (J, M, h) <-> CAM02-SCD (J', a', b'). Mirrors cam02-scd.js's
// log compression exactly (c1 = 0.007, c2 = 0.0363 — small-difference tuning).
export default {
	name: 'cam02-scd',
	edges: { ciecam02: ['ciecam02_cam02scd', 'cam02scd_ciecam02'] },
	code: /* glsl */ `
vec3 ciecam02_cam02scd(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float Jp = (1.0 + 100.0 * 0.007) * J / (1.0 + 0.007 * J);
	float Mp = log(1.0 + 0.0363 * M) / 0.0363;
	float hr = h * 0.017453292519943295;
	return vec3(Jp, Mp * cos(hr), Mp * sin(hr));
}
vec3 cam02scd_ciecam02(vec3 c) {
	float Jp = c.x; float ap = c.y; float bp = c.z;
	float Mp = sqrt(ap * ap + bp * bp);
	float M = (exp(0.0363 * Mp) - 1.0) / 0.0363;
	float J = Jp / ((1.0 + 100.0 * 0.007) - 0.007 * Jp);
	float h = atan2_(bp, ap) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(J, M, h);
}`,
}

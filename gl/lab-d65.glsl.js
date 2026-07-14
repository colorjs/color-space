// GLSL chunk: CIE XYZ D65 0-100 <-> CIELAB reanchored to D65 (no Bradford step).
// Mirrors lab-d65.js exactly.
import xyz from './xyz.glsl.js'
export default {
	name: 'lab-d65',
	deps: [xyz],
	edges: { xyz: ['xyz_labd65', 'labd65_xyz'] },
	code: /* glsl */ `
float labd65_labf_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float labd65_labfinv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
vec3 xyz_labd65(vec3 c) {
	float fx = labd65_labf_(c.x / 100.0 / 0.9504559270516716);
	float fy = labd65_labf_(c.y / 100.0);
	float fz = labd65_labf_(c.z / 100.0 / 1.0890577507598784);
	return vec3(116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz));
}
vec3 labd65_xyz(vec3 c) {
	float fy = (c.x + 16.0) / 116.0;
	float fx = c.y / 500.0 + fy;
	float fz = fy - c.z / 200.0;
	return vec3(
		labd65_labfinv_(fx) * 0.9504559270516716 * 100.0,
		labd65_labfinv_(fy) * 100.0,
		labd65_labfinv_(fz) * 1.0890577507598784 * 100.0);
}`,
}

// GLSL chunk: CIE XYZ D65 0-100 <-> Hunter Lab. Mirrors labh.js exactly (kx/kz literals
// are the JS source's own rounded Xn/Zn ratios, not this library's full-precision D65).
export default {
	name: 'labh',
	edges: { xyz: ['xyz_labh', 'labh_xyz'] },
	code: `
vec3 xyz_labh(vec3 c) {
	float y12 = sqrt(c.y);
	float l = y12 * 10.0;
	float a = 0.0;
	float b = 0.0;
	if (c.y != 0.0) {
		a = 17.5 * (((100.0 / 95.047) * c.x - c.y) / y12);
		b = 7.0 * ((c.y - (100.0 / 108.883) * c.z) / y12);
	}
	return vec3(l, a, b);
}
vec3 labh_xyz(vec3 c) {
	float yh = c.x / 10.0;
	float xh = c.y / 17.5 * yh;
	float zh = c.z / 7.0 * yh;
	float y = yh * yh;
	return vec3((xh + y) / (100.0 / 95.047), y, (y - zh) / (100.0 / 108.883));
}`,
}

// GLSL chunk: CIE XYZ D65 0-100 <-> CIELUV. Mirrors luv.js (xyz.luv / luv.xyz) and
// wasm/batch.js xyz_luv/luv_xyz exactly (D65 2° whitepoint hardcoded, as the JS default).
export default {
	name: 'luv',
	edges: { xyz: ['xyz_luv', 'luv_xyz'] },
	code: `
float luv_labf_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float luv_labfinv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
vec3 xyz_luv(vec3 c) {
	float xn = 95.04559270516717; float yn = 100.0; float zn = 108.90577507598783;
	float dn = xn + 15.0 * yn + 3.0 * zn;
	float un = 4.0 * xn / dn; float vn = 9.0 * yn / dn;
	float denom = c.x + 15.0 * c.y + 3.0 * c.z;
	float up = 0.0; float vp = 0.0;
	if (denom != 0.0) { up = (4.0 * c.x) / denom; vp = (9.0 * c.y) / denom; }
	float l = 116.0 * luv_labf_(c.y / yn) - 16.0;
	return vec3(l, 13.0 * l * (up - un), 13.0 * l * (vp - vn));
}
vec3 luv_xyz(vec3 c) {
	float xn = 95.04559270516717; float yn = 100.0; float zn = 108.90577507598783;
	float dn = xn + 15.0 * yn + 3.0 * zn;
	float un = 4.0 * xn / dn; float vn = 9.0 * yn / dn;
	float l = c.x;
	if (l == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float up = c.y / (13.0 * l) + un;
	float vp = c.z / (13.0 * l) + vn;
	float y = yn * luv_labfinv_((l + 16.0) / 116.0);
	float x = y * 9.0 * up / (4.0 * vp);
	float z = y * (12.0 - 3.0 * up - 20.0 * vp) / (4.0 * vp);
	return vec3(x, y, z);
}`,
}

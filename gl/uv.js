// GLSL chunk: CIE XYZ D65 0-100 <-> u'v'Y (CIE 1976 UCS chromaticity + luminance).
// Mirrors uv.js: xyz.uv guards d===0 -> [0,0,0]; uv.xyz guards v===0 -> [0,0,0].
export default {
	name: 'uv',
	edges: { xyz: ['xyz_uv', 'uv_xyz'] },
	code: `
vec3 xyz_uv(vec3 c) {
	float d = c.x + 15.0 * c.y + 3.0 * c.z;
	if (d == 0.0) { return vec3(0.19783000664283679, 0.46831999493879101, 0.0); }   // achromatic: the D65 white's u'v'
	return vec3(4.0 * c.x / d, 9.0 * c.y / d, c.y);
}
vec3 uv_xyz(vec3 c) {
	float u = c.x; float v = c.y; float Y = c.z;
	if (v == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float d = 9.0 * Y / v;
	float X = u * d / 4.0;
	return vec3(X, Y, (d - X - 15.0 * Y) / 3.0);
}`,
}

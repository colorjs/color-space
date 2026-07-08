// GLSL chunk: linear sRGB 0-1 <-> CIE XYZ D65 0-100.
// Matrices mirror xyz.js M_LRGB and its derived inverse (same literals as wasm/batch.js).
export default {
	name: 'xyz',
	edges: { lrgb: ['lrgb_xyz', 'xyz_lrgb'] },
	code: /* glsl */ `
vec3 lrgb_xyz(vec3 c) {
	return vec3(
		100.0 * (0.41239079926595 * c.x + 0.35758433938387 * c.y + 0.18048078840183 * c.z),
		100.0 * (0.21263900587151 * c.x + 0.71516867876775 * c.y + 0.072192315360733 * c.z),
		100.0 * (0.019330818715591 * c.x + 0.11919477979462 * c.y + 0.95053215224966 * c.z));
}
vec3 xyz_lrgb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		3.2409699419046056 * x - 1.537383177570116 * y - 0.4986107602930043 * z,
		-0.969243636280911 * x + 1.875967501507741 * y + 0.04155505740717699 * z,
		0.055630079696992636 * x - 0.20397695888896836 * y + 1.0569715142428788 * z);
}`,
}

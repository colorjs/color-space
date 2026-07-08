// GLSL chunk: CIE RGB (white E, Bradford-adapted to D65) 0-1 <-> CIE XYZ D65
// 0-100. No transfer curve — the primaries are already linear-light.
// Mirrors cie-rgb.js M / inv3(M).
export default {
	name: 'cie-rgb',
	edges: { xyz: ['xyz_ciergb', 'ciergb_xyz'] },
	code: /* glsl */ `
vec3 ciergb_xyz(vec3 c) {
	return vec3(
		100.0 * (0.46229840 * c.x + 0.27412836 * c.y + 0.21402917 * c.z),
		100.0 * (0.16323997 * c.x + 0.82414259 * c.y + 0.01261744 * c.z),
		100.0 * (0.00074240 * c.x + 0.00922993 * c.y + 1.07908542 * c.z));
}
vec3 xyz_ciergb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		2.449705827603399 * x - 0.8094916489194164 * y - 0.47641714287584086 * z,
		-0.4852570610242998 * x + 1.3738916708608 * y + 0.08018287401574227 * z,
		0.0024652609047829156 * x - 0.011194625676130858 * y + 0.9263526234767465 * z);
}`,
}

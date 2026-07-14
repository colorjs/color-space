// GLSL chunk: sRGB 0-255 <-> Ohta I1I2I3 opponent decorrelation. Mirrors ohta.js.
export default {
	name: 'ohta',
	edges: { rgb: ['rgb_ohta', 'ohta_rgb'] },
	code: /* glsl */ `
vec3 rgb_ohta(vec3 c) {
	return vec3(
		(c.x + c.y + c.z) / 3.0,
		(c.x - c.z) / 2.0,
		(2.0 * c.y - c.x - c.z) / 4.0);
}
vec3 ohta_rgb(vec3 c) {
	float i1 = c.x; float i2 = c.y; float i3 = c.z;
	return vec3(
		i1 + i2 - 2.0 * i3 / 3.0,
		i1 + 4.0 * i3 / 3.0,
		i1 - i2 - 2.0 * i3 / 3.0);
}`,
}

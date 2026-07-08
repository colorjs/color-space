// GLSL chunk: sRGB 0-255 <-> YES (Y luminance, E/S chrominance). Mirrors yes.js.
export default {
	name: 'yes',
	edges: { rgb: ['rgb_yes', 'yes_rgb'] },
	code: /* glsl */ `
vec3 rgb_yes(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	return vec3(
		r * 0.253 + g * 0.684 + b * 0.063,
		r * 0.5 + g * (-0.5) + b * 0.0,
		r * 0.25 + g * 0.25 + b * (-0.5));
}
vec3 yes_rgb(vec3 c) {
	float y = c.x; float e = c.y; float s = c.z;
	return vec3(
		(y * 1.0 + e * 1.431 + s * 0.126) * 255.0,
		(y * 1.0 + e * (-0.569) + s * 0.126) * 255.0,
		(y * 1.0 + e * 0.431 + s * (-1.874)) * 255.0);
}`,
}

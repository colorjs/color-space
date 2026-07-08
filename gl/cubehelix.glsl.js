// GLSL chunk: cubehelix (fraction 0-1) -> sRGB 0-255. Dave Green's spiral colormap.
// Mirrors cubehelix.js cubehelix.rgb with its default params (start=0, rotation=0.5,
// hue=1, gamma=1) baked in as consts. One-way: rgb.cubehelix throws in the JS lib
// (an arbitrary RGB is not generally on the helix), so there is no inverse edge.
export default {
	name: 'cubehelix',
	dim: 1,
	edges: { rgb: [null, 'cubehelix_rgb'] },
	code: /* glsl */ `
vec3 cubehelix_rgb(float fraction) {
	// defaults baked in: start=0.0, rotation=0.5, hue=1.0, gamma=1.0
	float angle = 6.283185307179586 * (1.0 + 0.5 * fraction);
	float f = fraction;
	float amp = f * (1.0 - f) / 2.0;
	float r = f + amp * (-0.14861 * cos(angle) + 1.78277 * sin(angle));
	float g = f + amp * (-0.29227 * cos(angle) - 0.90649 * sin(angle));
	float b = f + amp * (1.97294 * cos(angle));
	r = min(max(r, 0.0), 1.0);
	g = min(max(g, 0.0), 1.0);
	b = min(max(b, 0.0), 1.0);
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}

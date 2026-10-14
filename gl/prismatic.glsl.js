// GLSL chunk: sRGB 0-255 <-> Prismatic (L, ρ, γ, β; all 0-1), Shirley & Hart 2015:
// L = max(R,G,B), (ρ,γ,β) = (R,G,B)/(R+G+B); inverse L·(ρ,γ,β)/max(ρ,γ,β). Black sits at
// the neutral point (1/3, 1/3, 1/3). Mirrors prismatic.js.
export default {
	name: 'prismatic',
	dim: 4,
	edges: { rgb: ['rgb_prismatic', 'prismatic_rgb'] },
	code: /* glsl */ `
vec4 rgb_prismatic(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float s = r + g + b;
	if (s == 0.0) { return vec4(0.0, 1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0); }
	return vec4(max(r, max(g, b)), r / s, g / s, b / s);
}
vec3 prismatic_rgb(vec4 c) {
	float m = max(c.y, max(c.z, c.w));
	if (m == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float k = c.x / m * 255.0;
	return vec3(c.y * k, c.z * k, c.w * k);
}`,
}

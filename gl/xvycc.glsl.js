// GLSL chunk: YPbPr (Y 0-1, Pb/Pr ±0.5) <-> xvYCC (IEC 61966-2-4), full 8-bit
// range. Mirrors xvycc.js xvycc.ypbpr / ypbpr.xvycc — same digital<->analog
// rescaling as ycbcr (this library computes xvYCC identically to YCbCr; the
// separate module exists for gamut semantics, not different arithmetic), and
// xvycc.js itself composes rgb<->xvycc through ypbpr, so this chunk mirrors that.
export default {
	name: 'xvycc',
	edges: { ypbpr: ['ypbpr_xvycc', 'xvycc_ypbpr'] },
	code: /* glsl */ `
vec3 ypbpr_xvycc(vec3 c) {
	return vec3(
		c.x * (235.0 - 16.0) + 16.0,
		c.y * (240.0 - 16.0) + 128.0,
		c.z * (240.0 - 16.0) + 128.0);
}
vec3 xvycc_ypbpr(vec3 c) {
	return vec3(
		(c.x - 16.0) / (235.0 - 16.0),
		(c.y - 128.0) / (240.0 - 16.0),
		(c.z - 128.0) / (240.0 - 16.0));
}`,
}

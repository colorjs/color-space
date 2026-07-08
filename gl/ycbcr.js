// GLSL chunk: YPbPr (Y 0-1, Pb/Pr ±0.5) <-> YCbCr digital studio range
// (Y 16-235, Cb/Cr 16-240), ITU-R BT.709/BT.601. Mirrors ycbcr.js ycbcr.ypbpr /
// ypbpr.ycbcr — the primitive edge is the digital<->analog rescaling; ycbcr.js
// itself composes rgb<->ycbcr through ypbpr, so this chunk mirrors that choice.
export default {
	name: 'ycbcr',
	edges: { ypbpr: ['ypbpr_ycbcr', 'ycbcr_ypbpr'] },
	code: `
vec3 ypbpr_ycbcr(vec3 c) {
	return vec3(
		c.x * (235.0 - 16.0) + 16.0,
		c.y * (240.0 - 16.0) + 128.0,
		c.z * (240.0 - 16.0) + 128.0);
}
vec3 ycbcr_ypbpr(vec3 c) {
	return vec3(
		(c.x - 16.0) / (235.0 - 16.0),
		(c.y - 128.0) / (240.0 - 16.0),
		(c.z - 128.0) / (240.0 - 16.0));
}`,
}

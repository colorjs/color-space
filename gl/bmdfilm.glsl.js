// GLSL chunk: Blackmagic Film (Gen5) <-> CIE XYZ D65 0-100. Linear toe + natural-log
// highlight segment; matrix is BMD Wide Gamut Gen5 linear -> XYZ. Mirrors bmdfilm.js
// enc/dec (vendor constants A-E, LC) and M/inv3(M).
export default {
	name: 'bmdfilm',
	edges: { xyz: ['xyz_bmdfilm', 'bmdfilm_xyz'] },
	code: /* glsl */ `
float bmdfilm_enc_(float l) {
	if (l < 0.005) { return 8.283605932402494 * l + 0.09246575342465753; }
	return 0.08692876065491224 * log(l + 0.005494072432257808) + 0.5300133392291939;
}
float bmdfilm_dec_(float v) {
	float logc = 8.283605932402494 * 0.005 + 0.09246575342465753;
	if (v < logc) { return (v - 0.09246575342465753) / 8.283605932402494; }
	return exp((v - 0.5300133392291939) / 0.08692876065491224) - 0.005494072432257808;
}
vec3 bmdfilm_xyz(vec3 c) {
	float r = bmdfilm_dec_(c.x); float g = bmdfilm_dec_(c.y); float b = bmdfilm_dec_(c.z);
	return vec3(
		100.0 * (0.6065383683 * r + 0.2204127353 * g + 0.1235048234 * b),
		100.0 * (0.2679929401 * r + 0.8327484091 * g - 0.1007413492 * b),
		100.0 * (-0.0294425542 * r - 0.0866124303 * g + 1.2051127352 * b));
}
vec3 xyz_bmdfilm(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.8663577355474374 * x - 0.5183905087079547 * y - 0.2346067164768635 * z;
	float g = -0.6003298545521913 * x + 1.3781199506116673 * y + 0.17672810985349613 * z;
	float b = 0.0024514811060755946 * x + 0.08638160935268568 * y + 0.8367677153157205 * z;
	return vec3(bmdfilm_enc_(r), bmdfilm_enc_(g), bmdfilm_enc_(b));
}`,
}

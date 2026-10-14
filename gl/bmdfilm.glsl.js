// GLSL chunk: Blackmagic Film (Gen5) <-> CIE XYZ D65 0-100, via BMD Wide Gamut Gen5.
// Linear toe + natural-log highlight segment. Mirrors bmdfilm.js enc/dec (vendor
// constants A-E, LC); the matrix comes from bmdwg.glsl.js (requires: ['bmdwg']).
import xyz from './xyz.glsl.js'
import bmdwg from './bmdwg.glsl.js'
export default {
	name: 'bmdfilm',
	deps: [xyz, bmdwg],
	edges: { xyz: ['xyz_bmdfilm', 'bmdfilm_xyz'] },
	requires: ['bmdwg'],
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
	return bmdwg_xyz(vec3(bmdfilm_dec_(c.x), bmdfilm_dec_(c.y), bmdfilm_dec_(c.z)));
}
vec3 xyz_bmdfilm(vec3 c) {
	vec3 l = xyz_bmdwg(c);
	return vec3(bmdfilm_enc_(l.x), bmdfilm_enc_(l.y), bmdfilm_enc_(l.z));
}`,
}

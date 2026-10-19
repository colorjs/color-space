// GLSL chunk: ADX16 code/65535 <-> ACES2065-1 (AP0, linear). Mirrors adx16.js: cdd =
// (code − 1520)/8000, then ADX10's density steps (reuses adx10's helpers, requires: ['adx10']).
import aces2065_1 from './aces2065-1.glsl.js'
import adx10 from './adx10.glsl.js'
export default {
	name: 'adx16',
	deps: [aces2065_1, adx10],
	edges: { 'aces2065-1': ['aces20651_adx16', 'adx16_aces20651'] },
	requires: ['adx10'],
	code: /* glsl */ `
vec3 adx16_aces20651(vec3 c) {
	return adx10_aces_((c.x * 65535.0 - 1520.0) / 8000.0, (c.y * 65535.0 - 1520.0) / 8000.0, (c.z * 65535.0 - 1520.0) / 8000.0);
}
vec3 aces20651_adx16(vec3 c) {
	vec3 d = adx10_cdd_(c);
	return vec3((d.x * 8000.0 + 1520.0) / 65535.0, (d.y * 8000.0 + 1520.0) / 65535.0, (d.z * 8000.0 + 1520.0) / 65535.0);
}`,
}

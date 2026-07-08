// GLSL chunk: ACES2065-1 (AP0, archival/interchange) <-> ACEScg (AP1). Mirrors aces2065-1.js
// M_AP0_AP1 / M_AP1_AP0 — same ACES white on both sides, no chromatic adaptation.
export default {
	name: 'aces2065-1',
	edges: { acescg: ['acescg_aces20651', 'aces20651_acescg'] },
	code: /* glsl */ `
vec3 aces20651_acescg(vec3 c) {
	return vec3(
		1.4514393161 * c.x - 0.2365107469 * c.y - 0.2149285693 * c.z,
		-0.0765537734 * c.x + 1.1762296998 * c.y - 0.0996759264 * c.z,
		0.0083161484 * c.x - 0.0060324498 * c.y + 0.9977163014 * c.z);
}
vec3 acescg_aces20651(vec3 c) {
	return vec3(
		0.6954522414 * c.x + 0.1406786965 * c.y + 0.1638690622 * c.z,
		0.0447945634 * c.x + 0.8596711185 * c.y + 0.0955343182 * c.z,
		-0.0055258826 * c.x + 0.0040252103 * c.y + 1.0015006723 * c.z);
}`,
}

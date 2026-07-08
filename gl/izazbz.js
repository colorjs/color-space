// GLSL chunk: CIE XYZ D65 0-100 <-> IzAzBz (native: Iz 0-1, az/bz ±0.5) — Safdar et al.
// 2017's opponent stage before Jzazbz's final Iz->Jz hyperbolic compression. Same Yw=203,
// matrices and modified-PQ as jzazbz (izazbz.js uses identical constants), so this chunk
// reuses jzazbz's XYZ<->Iab helpers rather than duplicating them (requires: ['jzazbz'],
// per the chunk contract's allowance for chunks that share another chunk's math exactly).
export default {
	name: 'izazbz',
	edges: { xyz: ['xyz_izazbz', 'izazbz_xyz'] },
	requires: ['jzazbz'],
	code: `
vec3 xyz_izazbz(vec3 c) {
	return jzazbz_xyz_iab_(c);
}
vec3 izazbz_xyz(vec3 c) {
	return jzazbz_iab_xyz_(c);
}`,
}

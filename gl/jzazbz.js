// GLSL chunk: CIE XYZ D65 0-100 <-> JzAzBz (native: Jz 0-1, az/bz ±0.5), Safdar et al.
// 2017. XYZ -> modified-XYZ -> LMS -> JzAzBz's modified ST 2084 PQ (p = 1.7*m2) -> Iab,
// then Iz is hyperbolically compressed to Jz. Mirrors jzazbz.js exactly (Yw=203,
// b=1.15, g=0.66, d=-0.56, d0). The XYZ<->Iab helpers are shared with izazbz.js's
// GLSL twin (gl/izazbz.js, requires: ['jzazbz']) since izazbz is the same pipeline
// stopped one step earlier (Iz, not Jz).
export default {
	name: 'jzazbz',
	edges: { xyz: ['xyz_jzazbz', 'jzazbz_xyz'] },
	code: `
float jzazbz_pq_enc_(float val) {
	float v = val / 10000.0;
	float vn = spow_(v, 2610.0 / 16384.0);
	float num = 3424.0 / 4096.0 + 2413.0 / 128.0 * vn;
	float denom = 1.0 + 2392.0 / 128.0 * vn;
	return spow_(num / denom, 1.7 * 2523.0 / 32.0);
}
float jzazbz_pq_dec_(float val) {
	float vp = spow_(val, 32.0 / (1.7 * 2523.0));
	float num = 3424.0 / 4096.0 - vp;
	float denom = 2392.0 / 128.0 * vp - 2413.0 / 128.0;
	return spow_(num / denom, 16384.0 / 2610.0) * 10000.0;
}
vec3 jzazbz_xyz_iab_(vec3 c) {
	float xa = c.x / 100.0 * 203.0;
	float ya = c.y / 100.0 * 203.0;
	float za = c.z / 100.0 * 203.0;
	float xm = 1.15 * xa - 0.15 * za;
	float ym = 0.66 * ya + 0.34 * xa;
	float l = jzazbz_pq_enc_(0.41478972 * xm + 0.579999 * ym + 0.0146480 * za);
	float m = jzazbz_pq_enc_(-0.2015100 * xm + 1.120649 * ym + 0.0531008 * za);
	float s = jzazbz_pq_enc_(-0.0166008 * xm + 0.264800 * ym + 0.6684799 * za);
	float iz = 0.5 * l + 0.5 * m + 0.0 * s;
	float az = 3.524000 * l - 4.066708 * m + 0.542708 * s;
	float bz = 0.199076 * l + 1.096799 * m - 1.295875 * s;
	return vec3(iz, az, bz);
}
vec3 jzazbz_iab_xyz_(vec3 c) {
	float iz = c.x; float az = c.y; float bz = c.z;
	float pl = jzazbz_pq_dec_(iz + 0.13860504327153927 * az + 0.05804731615611883 * bz);
	float pm = jzazbz_pq_dec_(iz - 0.1386050432715393 * az - 0.058047316156118904 * bz);
	float ps = jzazbz_pq_dec_(iz - 0.09601924202631895 * az - 0.811891896056039 * bz);
	float xm = 1.9242264357876067 * pl - 1.0047923125953657 * pm + 0.037651404030618 * ps;
	float ym = 0.35031676209499907 * pl + 0.7264811939316552 * pm - 0.06538442294808501 * ps;
	float za = -0.09098281098284752 * pl - 0.3127282905230739 * pm + 1.5227665613052603 * ps;
	float xa = (xm + 0.15 * za) / 1.15;
	float ya = (ym - 0.34 * xa) / 0.66;
	return vec3(xa / 203.0 * 100.0, ya / 203.0 * 100.0, za / 203.0 * 100.0);
}
vec3 xyz_jzazbz(vec3 c) {
	vec3 iab = jzazbz_xyz_iab_(c);
	float jz = (0.44 * iab.x) / (1.0 - 0.56 * iab.x) - 1.6295499532821566e-11;
	return vec3(jz, iab.y, iab.z);
}
vec3 jzazbz_xyz(vec3 c) {
	float jz0 = c.x + 1.6295499532821566e-11;
	float iz = jz0 / (0.44 + 0.56 * jz0);
	return jzazbz_iab_xyz_(vec3(iz, c.y, c.z));
}`,
}

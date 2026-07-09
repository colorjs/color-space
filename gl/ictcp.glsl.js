// GLSL chunk: CIE XYZ D65 0-100 <-> ICtCp (native: I 0-1, Ct/Cp ±0.5) — Dolby's HDR
// opponent space from ITU-R BT.2100: XYZ -> LMS -> standard ST 2084 PQ -> IPT-style
// matrix. Mirrors ictcp.js (Yw=203, M_XYZ_LMS/M_LMS_XYZ/M_LMS_IPT/M_IPT_LMS).
import xyz from './xyz.glsl.js'
export default {
	name: 'ictcp',
	deps: [xyz],
	edges: { xyz: ['xyz_ictcp', 'ictcp_xyz'] },
	code: /* glsl */ `
float ictcp_pq_enc_(float absNits) {
	float x = absNits / 10000.0;
	if (x < 0.0) { x = 0.0; }
	float v = pow(x, 2610.0 / 16384.0);
	return pow((3424.0 / 4096.0 + 2413.0 / 128.0 * v) / (1.0 + 2392.0 / 128.0 * v), 2523.0 / 32.0);
}
float ictcp_pq_dec_(float signal) {
	float vp = pow(signal, 32.0 / 2523.0);
	float num = vp - 3424.0 / 4096.0;
	if (num < 0.0) { num = 0.0; }
	return 10000.0 * pow(num / (2413.0 / 128.0 - 2392.0 / 128.0 * vp), 16384.0 / 2610.0);
}
vec3 xyz_ictcp(vec3 c) {
	float xa = c.x / 100.0 * 203.0;
	float ya = c.y / 100.0 * 203.0;
	float za = c.z / 100.0 * 203.0;
	float l = 0.3592832590121217 * xa + 0.6976051147779502 * ya - 0.0358915932320290 * za;
	float m = -0.1920808463704993 * xa + 1.1004767970374321 * ya + 0.0753748658519118 * za;
	float s = 0.0070797844607479 * xa + 0.0748396662186362 * ya + 0.8433265453898765 * za;
	float pl = ictcp_pq_enc_(l);
	float pm = ictcp_pq_enc_(m);
	float ps = ictcp_pq_enc_(s);
	float i = (2048.0 / 4096.0) * pl + (2048.0 / 4096.0) * pm + 0.0 * ps;
	float ct = (6610.0 / 4096.0) * pl - (13613.0 / 4096.0) * pm + (7003.0 / 4096.0) * ps;
	float cp = (17933.0 / 4096.0) * pl - (17390.0 / 4096.0) * pm - (543.0 / 4096.0) * ps;
	return vec3(i, ct, cp);
}
vec3 ictcp_xyz(vec3 c) {
	float pl = c.x + 0.0086090370379328 * c.y + 0.1110296250030260 * c.z;
	float pm = c.x - 0.0086090370379328 * c.y - 0.1110296250030259 * c.z;
	float ps = c.x + 0.5600313357106791 * c.y - 0.3206271749873188 * c.z;
	float l = ictcp_pq_dec_(pl);
	float m = ictcp_pq_dec_(pm);
	float s = ictcp_pq_dec_(ps);
	float xa = 2.0701522183894223 * l - 1.3263473389671563 * m + 0.2066510476294053 * s;
	float ya = 0.3647385209748072 * l + 0.6805660249472273 * m - 0.0453045459220347 * s;
	float za = -0.0497472075358123 * l - 0.0492609666966131 * m + 1.1880659249923042 * s;
	return vec3(xa / 203.0 * 100.0, ya / 203.0 * 100.0, za / 203.0 * 100.0);
}`,
}

// GLSL chunk: CIE XYZ (absolute) <-> ZCAM (J, M, h), Safdar/Hardeberg/Luo 2021. Baked
// to zcam.js's canonical reference conditions (white XYZ_w [256,264,202], La = 264,
// Yb = 100, average surround, Fs = 0.69) — D, Fb, FL, Izw and the Qp/Qm/Qzw
// brightness-scale constants are condition-derived and computed once. Mirrors
// zcam.js's own (not izazbz.js's) Izazbz substrate exactly: the ST 2084 PQ encode/
// decode, the XYZ->modified-XYZ->LMS->Iab matrices, and the Zhai (2018) two-step CAT02
// adaptation (zhai) that both directions route XYZ through — forward adapts the
// baked white down to the D65 tristimulus reference, the inverse adapts back up.
// Input/output XYZ is absolute (0-100-ish per channel is not assumed); chaining from
// rgb (which is relative 0-100) lands inside this absolute frame, i.e. "ZCAM of a dim
// sample" per zcam.js's own note.
export default {
	name: 'zcam',
	edges: { xyz: ['xyz_zcam', 'zcam_xyz'] },
	code: /* glsl */ `
const float ZCAM_D_ = 0.9900184890466177;
const float ZCAM_FL02_ = 1.0186839974692363;
const float ZCAM_FB01_IZW078_ = 0.4867709141324333;
const float ZCAM_QP_ = 1.1702140524455826;
const float ZCAM_QM_ = 0.35326979130862846;
const float ZCAM_QZW_ = 348.33528514452655;

float zcam_pq_enc_(float val) {
	float v = max(val, 0.0) / 10000.0;
	float vn = pow(v, 2610.0 / 16384.0);
	float num = 3424.0 / 4096.0 + 2413.0 / 128.0 * vn;
	float denom = 1.0 + 2392.0 / 128.0 * vn;
	return pow(num / denom, 1.7 * 2523.0 / 32.0);
}
float zcam_pq_dec_(float val) {
	float vp = pow(max(val, 0.0), 32.0 / (1.7 * 2523.0));
	float num = max(vp - 3424.0 / 4096.0, 0.0);
	float denom = 2413.0 / 128.0 - 2392.0 / 128.0 * vp;
	return pow(num / denom, 16384.0 / 2610.0) * 10000.0;
}
vec3 zcam_toizazbz_(vec3 c) {
	float xm = 1.15 * c.x - 0.15 * c.z;
	float ym = 0.66 * c.y + 0.34 * c.x;
	float l = zcam_pq_enc_(0.41478972 * xm + 0.579999 * ym + 0.0146480 * c.z);
	float m = zcam_pq_enc_(-0.2015100 * xm + 1.120649 * ym + 0.0531008 * c.z);
	float s = zcam_pq_enc_(-0.0166008 * xm + 0.264800 * ym + 0.6684799 * c.z);
	float iz = m;
	float az = 3.524 * l - 4.066708 * m + 0.542708 * s;
	float bz = 0.199076 * l + 1.096799 * m - 1.295875 * s;
	return vec3(iz - 3.7035226210190005e-11, az, bz);
}
vec3 zcam_fromizazbz_(vec3 c) {
	float izd = c.x + 3.7035226210190005e-11;
	float l = zcam_pq_dec_(izd + 0.2772100865430786 * c.y + 0.11609463231223774 * c.z);
	float m = zcam_pq_dec_(izd);
	float s = zcam_pq_dec_(izd + 0.042585801245220344 * c.y - 0.75384457989992 * c.z);
	float xp = 1.924226435787607 * l - 1.004792312595366 * m + 0.037651404030618014 * s;
	float yp = 0.3503167620949992 * l + 0.7264811939316554 * m - 0.06538442294808504 * s;
	float za = -0.09098281098284759 * l - 0.31272829052307405 * m + 1.5227665613052608 * s;
	float xa = (xp + 0.15 * za) / 1.15;
	float ya = (yp - 0.34 * xa) / 0.66;
	return vec3(xa, ya, za);
}
vec3 zcam_zhai_(vec3 c, vec3 wb, vec3 wd) {
	float rb0 = 0.7328 * c.x + 0.4296 * c.y - 0.1624 * c.z;
	float rb1 = -0.7036 * c.x + 1.6975 * c.y + 0.0061 * c.z;
	float rb2 = 0.0030 * c.x + 0.0136 * c.y + 0.9834 * c.z;
	float rwb0 = 0.7328 * wb.x + 0.4296 * wb.y - 0.1624 * wb.z;
	float rwb1 = -0.7036 * wb.x + 1.6975 * wb.y + 0.0061 * wb.z;
	float rwb2 = 0.0030 * wb.x + 0.0136 * wb.y + 0.9834 * wb.z;
	float rwd0 = 0.7328 * wd.x + 0.4296 * wd.y - 0.1624 * wd.z;
	float rwd1 = -0.7036 * wd.x + 1.6975 * wd.y + 0.0061 * wd.z;
	float rwd2 = 0.0030 * wd.x + 0.0136 * wd.y + 0.9834 * wd.z;
	float drb0 = ZCAM_D_ * (wb.y / 100.0) * (100.0 / rwb0) + 1.0 - ZCAM_D_;
	float drb1 = ZCAM_D_ * (wb.y / 100.0) * (100.0 / rwb1) + 1.0 - ZCAM_D_;
	float drb2 = ZCAM_D_ * (wb.y / 100.0) * (100.0 / rwb2) + 1.0 - ZCAM_D_;
	float drd0 = ZCAM_D_ * (wd.y / 100.0) * (100.0 / rwd0) + 1.0 - ZCAM_D_;
	float drd1 = ZCAM_D_ * (wd.y / 100.0) * (100.0 / rwd1) + 1.0 - ZCAM_D_;
	float drd2 = ZCAM_D_ * (wd.y / 100.0) * (100.0 / rwd2) + 1.0 - ZCAM_D_;
	float y0 = rb0 * (drb0 / drd0);
	float y1 = rb1 * (drb1 / drd1);
	float y2 = rb2 * (drb2 / drd2);
	return vec3(
		1.096123820835514 * y0 - 0.2788690002182872 * y1 + 0.18274517938277304 * y2,
		0.45436904197535916 * y0 + 0.4735331543074117 * y1 + 0.0720978037172291 * y2,
		-0.009627608738429353 * y0 - 0.005698031216113419 * y1 + 1.0153256399545427 * y2);
}
vec3 xyz_zcam(vec3 c) {
	vec3 adapted = zcam_zhai_(c, vec3(256.0, 264.0, 202.0), vec3(0.95046, 1.0, 1.08906));
	vec3 iab = zcam_toizazbz_(adapted);
	float az = iab.y; float bz = iab.z;
	float h = atan2_(bz, az) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	float ez = 1.015 + cos((89.038 + h) * 0.017453292519943295);
	float J = 100.0 * (2700.0 * spow_(iab.x, ZCAM_QP_) * ZCAM_QM_) / ZCAM_QZW_;
	float M = 100.0 * pow(az * az + bz * bz, 0.37) * (spow_(ez, 0.068) * ZCAM_FL02_) / ZCAM_FB01_IZW078_;
	return vec3(J, M, h);
}
vec3 zcam_xyz(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float ez = 1.015 + cos((89.038 + h) * 0.017453292519943295);
	float Iz = spow_(J * ZCAM_QZW_ / 100.0 / (2700.0 * ZCAM_QM_), 1.0 / ZCAM_QP_);
	float rArg = M * ZCAM_FB01_IZW078_ / (100.0 * spow_(ez, 0.068) * ZCAM_FL02_);
	float r = sqrt(pow(rArg, 1.0 / 0.37));
	float hr = h * 0.017453292519943295;
	vec3 back = zcam_fromizazbz_(vec3(Iz, r * cos(hr), r * sin(hr)));
	return zcam_zhai_(back, vec3(0.95046, 1.0, 1.08906), vec3(256.0, 264.0, 202.0));
}`,
}

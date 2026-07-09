// GLSL chunk: CIE XYZ 0-100 <-> OSA-UCS Ljg (MacAdam 1974). Forward is closed-form
// (signed cube roots + the modified-luminance factor K). Inverse has no closed form:
// recovers L' and the lightness root t by bisection, then the free cube-root
// variable w exactly as osaucs.js does — scan a window around the seed w=t for
// sign-change brackets, bisect each, reject poles (X+Y+Z crossing 0 blows up K),
// prefer physical roots (XYZ ≥ 0) nearest the seed. Y0(w) has several roots, so a
// free Newton can land on a non-physical one — and is fragile in f32 anyway.
import xyz from './xyz.glsl.js'
export default {
	name: 'osaucs',
	deps: [xyz],
	edges: { xyz: ['xyz_osaucs', 'osaucs_xyz'] },
	code: /* glsl */ `
float osaucs_k_(float x, float y) {
	return 4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.56439 * y + 1.8103;
}
float osaucs_cg_(float a, float b, float w) {
	return 0.06943947311904933 * a - 0.028634834275896633 * b + 1.0000000000000002 * w;
}
float osaucs_cb_(float a, float b, float w) {
	return 0.05726966855179327 * a - 0.1267091416708426 * b + 1.0000000000000002 * w;
}
float osaucs_mx_(float r, float g, float bl) {
	return 1.0626182651259473 * r - 0.4120917485671994 * g + 0.297517984916228 * bl;
}
float osaucs_my_(float r, float g, float bl) {
	return 0.359926645484816 * r + 0.6400721081119282 * g - 0.00002618304892337664 * bl;
}
float osaucs_mz_(float r, float g, float bl) {
	return -0.00008963014585108618 * r - 0.36902345244568985 * g + 1.4423901018042944 * bl;
}
float osaucs_f_(float a, float b, float w, float Y0) {
	float cg = osaucs_cg_(a, b, w);
	float cb = osaucs_cb_(a, b, w);
	float R = w * w * w;
	float G = cg * cg * cg;
	float B = cb * cb * cb;
	float X = osaucs_mx_(R, G, B);
	float Y = osaucs_my_(R, G, B);
	float Z = osaucs_mz_(R, G, B);
	float s = X + Y + Z;
	if (s == 0.0) { return -Y0; }
	return osaucs_k_(X / s, Y / s) * Y - Y0;
}
vec3 xyz_osaucs(vec3 c) {
	float X = c.x; float Y = c.y; float Z = c.z;
	float sum = X + Y + Z;
	float x = 0.31272; float y = 0.32903;
	if (sum != 0.0) { x = X / sum; y = Y / sum; }
	float Y0 = osaucs_k_(x, y) * Y;
	float cr0 = cbrt_(Y0);
	float L_ = 5.9 * (cr0 - 2.0 / 3.0 + 0.042 * cbrt_(Y0 - 30.0));
	float L = (L_ - 14.3993) / 1.4142135623730951;
	float C = L_ / (5.9 * (cr0 - 2.0 / 3.0));
	float R = cbrt_(0.799 * X + 0.4194 * Y - 0.1648 * Z);
	float G = cbrt_(-0.4493 * X + 1.3265 * Y + 0.0927 * Z);
	float B = cbrt_(-0.1149 * X + 0.3394 * Y + 0.717 * Z);
	float a = -13.7 * R + 17.7 * G - 4.0 * B;
	float b = 1.7 * R + 8.0 * G - 9.7 * B;
	return vec3(L, C * b, C * a);
}
vec3 osaucs_xyz(vec3 c) {
	float L = c.x; float j = c.y; float g = c.z;
	float L_ = L * 1.4142135623730951 + 14.3993;
	float u = L_ / 5.9 + 2.0 / 3.0;
	float tLo = 0.0;
	float tHi = u + 1.0;
	if (tHi < 2.0) { tHi = 2.0; }
	float t = 0.0;
	for (int i = 0; i < 80; i++) {
		t = (tLo + tHi) / 2.0;
		if (t + 0.042 * cbrt_(t * t * t - 30.0) < u) { tLo = t; } else { tHi = t; }
	}
	t = (tLo + tHi) / 2.0;
	float Y0 = t * t * t;
	float C = L_ / (5.9 * (t - 2.0 / 3.0));
	float a = g / C;
	float b = j / C;

	// scan a window around the seed; bisect every sign-change bracket, reject poles,
	// prefer physical roots nearest the seed (mirrors osaucs.js)
	float lo = t - 12.0;
	float prevW = lo;
	float prevF = osaucs_f_(a, b, lo, Y0);
	float wF = lo;
	float bestF = abs(prevF);
	float wB = 0.0;
	float bestScore = 1e30;
	for (int k = 1; k <= 48; k++) {
		float wk = lo + float(k) * 0.5;
		float fk = osaucs_f_(a, b, wk, Y0);
		if (abs(fk) < bestF) { bestF = abs(fk); wF = wk; }
		if ((prevF <= 0.0) != (fk <= 0.0)) {
			float bLo = prevW;
			float bHi = wk;
			float fLo = prevF;
			float wm = wk;
			float fm = fk;
			for (int i2 = 0; i2 < 32; i2++) {
				wm = (bLo + bHi) / 2.0;
				fm = osaucs_f_(a, b, wm, Y0);
				if ((fLo <= 0.0) == (fm <= 0.0)) { bLo = wm; fLo = fm; } else { bHi = wm; }
			}
			if (abs(fm) <= 1e-3 * max(1.0, abs(Y0))) {   // a sign change can also be a POLE of f
				float cg2 = osaucs_cg_(a, b, wm);
				float cb2 = osaucs_cb_(a, b, wm);
				float R2 = wm * wm * wm;
				float G2 = cg2 * cg2 * cg2;
				float B2 = cb2 * cb2 * cb2;
				float score = abs(wm - t);
				if (osaucs_mx_(R2, G2, B2) < -1e-4 || osaucs_my_(R2, G2, B2) < -1e-4 || osaucs_mz_(R2, G2, B2) < -1e-4) { score = score + 1000.0; }
				if (score < bestScore) { bestScore = score; wB = wm; }
			}
		}
		prevW = wk;
		prevF = fk;
	}
	float w = wF;
	if (bestScore < 1e29) { w = wB; }

	float cr = w;
	float cg = osaucs_cg_(a, b, w);
	float cb = osaucs_cb_(a, b, w);
	float R = cr * cr * cr;
	float G = cg * cg * cg;
	float B = cb * cb * cb;
	return vec3(osaucs_mx_(R, G, B), osaucs_my_(R, G, B), osaucs_mz_(R, G, B));
}`,
}

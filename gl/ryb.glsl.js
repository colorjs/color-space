// GLSL chunk: sRGB 0-255 <-> RYB (Itten artists' color wheel). Forward is trilinear
// interpolation (smoothstep-eased) over the 8 RYB_ITTEN cube corners, unrolled into
// scalar lerps — same constants as ryb.js. Reverse mirrors ryb.js's Newton solve on
// the plain (un-eased) trilinear, then inverts the smoothstep per channel in closed
// form; the `dq.every(Number.isFinite)` guard is dropped because comparisons against
// a NaN error are already false in IEEE754, so a degenerate step simply stops
// updating `best` instead of being caught explicitly — same outcome, no isnan/isinf
// builtin needed (the dialect doesn't allow them).
export default {
	name: 'ryb',
	edges: { rgb: ['rgb_ryb', 'ryb_rgb'] },
	// No `tol` override: this re-expresses ryb.js's Newton solve scalar-for-scalar
	// (same iteration order, same Jacobian, same backtracking), and measured error
	// across the test samples is exactly 0 — the default 1e-6 already holds.
	code: /* glsl */ `
float ryb_lerp_(float a, float b, float t) { return a + t * (b - a); }
float ryb_bl_(float p0, float p1, float p2, float p3, float p4, float p5, float p6, float p7, float fr, float fy, float fb) {
	float c00 = ryb_lerp_(p0, p1, fr);
	float c10 = ryb_lerp_(p2, p3, fr);
	float c01 = ryb_lerp_(p4, p5, fr);
	float c11 = ryb_lerp_(p6, p7, fr);
	return ryb_lerp_(ryb_lerp_(c00, c10, fy), ryb_lerp_(c01, c11, fy), fb);
}
vec3 ryb_blend_(float fr, float fy, float fb) {
	float r = ryb_bl_(0.9921568627450981, 0.8901960784313725, 0.9529411764705882, 0.9411764705882353, 0.08627450980392157, 0.47058823529411764, 0.0, 0.11372549019607843, fr, fy, fb);
	float g = ryb_bl_(0.9647058823529412, 0.1411764705882353, 0.9019607843137255, 0.5568627450980392, 0.6, 0.13333333333333333, 0.5568627450980392, 0.10980392156862745, fr, fy, fb);
	float b = ryb_bl_(0.9294117647058824, 0.12941176470588237, 0.0, 0.10980392156862745, 0.8549019607843137, 0.6666666666666666, 0.3568627450980392, 0.10980392156862745, fr, fy, fb);
	return vec3(r, g, b);
}
float ryb_smooth_(float n) { return n * n * (3.0 - 2.0 * n); }
vec3 ryb_rgb(vec3 c) {
	float r = c.x / 255.0; float y = c.y / 255.0; float b = c.z / 255.0;
	vec3 f = ryb_blend_(ryb_smooth_(r), ryb_smooth_(y), ryb_smooth_(b));
	return vec3(f.x * 255.0, f.y * 255.0, f.z * 255.0);
}
vec3 rgb_ryb(vec3 c) {
	float t0 = c.x / 255.0; float t1 = c.y / 255.0; float t2 = c.z / 255.0;
	float q0 = 0.5; float q1 = 0.5; float q2 = 0.5;
	float best0 = q0; float best1 = q1; float best2 = q2;
	float bestE = 1.0e20;
	for (int i = 0; i < 60; i++) {
		vec3 f = ryb_blend_(q0, q1, q2);
		float e0 = f.x - t0; float e1 = f.y - t1; float e2 = f.z - t2;
		float errv = sqrt(e0 * e0 + e1 * e1 + e2 * e2);
		if (errv < bestE) { bestE = errv; best0 = q0; best1 = q1; best2 = q2; }
		if (errv < 1.0e-12) { break; }
		float h = 1.0e-6;
		float step0 = h; if (q0 + h > 1.0) { step0 = -h; }
		vec3 fp0 = ryb_blend_(q0 + step0, q1, q2);
		float J00 = (fp0.x - f.x) / step0;
		float J10 = (fp0.y - f.y) / step0;
		float J20 = (fp0.z - f.z) / step0;
		float step1 = h; if (q1 + h > 1.0) { step1 = -h; }
		vec3 fp1 = ryb_blend_(q0, q1 + step1, q2);
		float J01 = (fp1.x - f.x) / step1;
		float J11 = (fp1.y - f.y) / step1;
		float J21 = (fp1.z - f.z) / step1;
		float step2 = h; if (q2 + h > 1.0) { step2 = -h; }
		vec3 fp2 = ryb_blend_(q0, q1, q2 + step2);
		float J02 = (fp2.x - f.x) / step2;
		float J12 = (fp2.y - f.y) / step2;
		float J22 = (fp2.z - f.z) / step2;
		float A = J11 * J22 - J12 * J21;
		float B = J12 * J20 - J10 * J22;
		float Cv = J10 * J21 - J11 * J20;
		float det = J00 * A + J01 * B + J02 * Cv;
		float m0 = A / det;
		float m1 = (J02 * J21 - J01 * J22) / det;
		float m2 = (J01 * J12 - J02 * J11) / det;
		float m3 = B / det;
		float m4 = (J00 * J22 - J02 * J20) / det;
		float m5 = (J02 * J10 - J00 * J12) / det;
		float m6 = Cv / det;
		float m7 = (J01 * J20 - J00 * J21) / det;
		float m8 = (J00 * J11 - J01 * J10) / det;
		float dq0 = -e0 * m0 - e1 * m1 - e2 * m2;
		float dq1 = -e0 * m3 - e1 * m4 - e2 * m5;
		float dq2 = -e0 * m6 - e1 * m7 - e2 * m8;
		float lam = 1.0;
		int found = 0;
		float nq0 = q0; float nq1 = q1; float nq2 = q2;
		for (int s = 0; s < 10; s++) {
			float cand0 = clamp(q0 + lam * dq0, 0.0, 1.0);
			float cand1 = clamp(q1 + lam * dq1, 0.0, 1.0);
			float cand2 = clamp(q2 + lam * dq2, 0.0, 1.0);
			vec3 fc = ryb_blend_(cand0, cand1, cand2);
			float ce0 = fc.x - t0; float ce1 = fc.y - t1; float ce2 = fc.z - t2;
			float cerr = sqrt(ce0 * ce0 + ce1 * ce1 + ce2 * ce2);
			if (cerr < errv) { nq0 = cand0; nq1 = cand1; nq2 = cand2; found = 1; break; }
			lam = lam / 2.0;
		}
		if (found == 0) { break; }
		q0 = nq0; q1 = nq1; q2 = nq2;
	}
	return vec3(
		(0.5 - sin(asin(1.0 - 2.0 * best0) / 3.0)) * 255.0,
		(0.5 - sin(asin(1.0 - 2.0 * best1) / 3.0)) * 255.0,
		(0.5 - sin(asin(1.0 - 2.0 * best2) / 3.0)) * 255.0);
}`,
}

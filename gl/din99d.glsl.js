// GLSL chunk: CIE XYZ D65 0-100 <-> DIN99d (Cui, Luo, Rigg, Roesler & Witt 2002).
// Mirrors din99d.js and wasm/batch.js xyz_din99d/din99d_xyz exactly (X-corrected
// white per the original paper; log1p/expm1 reimplemented — no GLSL builtin).
export default {
	name: 'din99d',
	edges: { xyz: ['xyz_din99d', 'din99d_xyz'] },
	code: /* glsl */ `
float din99d_labf_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float din99d_labfinv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
float din99d_log1p_(float x) { return log(1.0 + x); }
float din99d_expm1_(float x) { return exp(x) - 1.0; }
float din99d_theta_() { return 50.0 * 3.141592653589793 / 180.0; }
float din99d_xcw_() { return 1.12 * 95.04559270516716 - 0.12 * 108.90577507598784; }
vec3 xyz_din99d(vec3 c) {
	float theta = din99d_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float Xcw = din99d_xcw_();
	float Xc = 1.12 * c.x - 0.12 * c.z;
	float fx = din99d_labf_(Xc / Xcw);
	float fy = din99d_labf_(c.y / 100.0);
	float fz = din99d_labf_(c.z / 108.90577507598784);
	float L = 116.0 * fy - 16.0;
	float a = 500.0 * (fx - fy);
	float b = 200.0 * (fy - fz);
	float e = a * costheta + b * sintheta;
	float f = 1.14 * (b * costheta - a * sintheta);
	float G = sqrt(e * e + f * f);
	float L99 = 325.22 * din99d_log1p_(0.0036 * L);
	if (G == 0.0) { return vec3(L99, 0.0, 0.0); }
	float h = atan2_(f, e) + theta;
	float C99 = 22.5 * din99d_log1p_(0.06 * G);
	return vec3(L99, C99 * cos(h), C99 * sin(h));
}
vec3 din99d_xyz(vec3 c) {
	float theta = din99d_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float Xcw = din99d_xcw_();
	float L = din99d_expm1_(c.x / 325.22) / 0.0036;
	float C99 = sqrt(c.y * c.y + c.z * c.z);
	float fy = (L + 16.0) / 116.0;
	if (C99 == 0.0) {
		float yr = din99d_labfinv_(fy);
		return vec3(yr * 95.04559270516716, yr * 100.0, yr * 108.90577507598784);
	}
	float h = atan2_(c.z, c.y) - theta;
	float G = din99d_expm1_(C99 / 22.5) / 0.06;
	float e = G * cos(h);
	float fv = G * sin(h);
	float a = e * costheta - (fv / 1.14) * sintheta;
	float b = e * sintheta + (fv / 1.14) * costheta;
	float fx = a / 500.0 + fy;
	float fz = fy - b / 200.0;
	float xr = din99d_labfinv_(fx);
	float yr = din99d_labfinv_(fy);
	float zr = din99d_labfinv_(fz);
	float Xc = xr * Xcw;
	float Y = yr * 100.0;
	float Z = zr * 108.90577507598784;
	return vec3((Xc + 0.12 * Z) / 1.12, Y, Z);
}`,
}

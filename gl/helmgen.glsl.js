// GLSL chunk: CIE XYZ D65 0-100 <-> HelmGen Lab (Helmlab GenSpace, Yıldız 2026). XYZ ->
// M1 (Bradford to Helmlab's ASTM D65 folded in) -> depressed cubic y³ + 0.021y = x
// (Cardano, hyperbolic form + one Halley step) -> near-neutral snap -> M2 -> C^0.978 ->
// piecewise-linear L -> L-gated Gaussian hue twist at 264.5° (Halley-inverted).
// Matrices mirror helmgen.js M1 / M2 and their derived inverses; PW mirrors its table.
import xyz from './xyz.glsl.js'
export default {
	name: 'helmgen',
	deps: [xyz],
	edges: { xyz: ['xyz_helmgen', 'helmgen_xyz'] },
	code: /* glsl */ `
const float HELMGEN_PW_[21] = float[21](0.0, 0.009494013522189627, 0.02564569838030986, 0.055259661658689105, 0.10574901531227408, 0.16055853320726027, 0.21405964892993756, 0.26786230508811226, 0.3220435246104499, 0.3739052098520243, 0.43020997780918835, 0.4835465162128873, 0.5399824670411353, 0.5956710081330342, 0.6542161666450478, 0.7115380216519989, 0.7702762412711669, 0.8293313467712837, 0.889406386197059, 0.9462829573474728, 1.0);

float helmgen_cubic_(float x) {
	float s = 0.0836660026534076;
	float t = x / (2.0 * s * s * s);
	float u = log(t + sqrt(t * t + 1.0)) / 3.0;
	float y = s * (exp(u) - exp(-u));
	float f = y * y * y + 0.021 * y - x;
	float d = 3.0 * y * y + 0.021;
	float q = 2.0 * d * d - f * 6.0 * y;
	if (abs(q) > 1e-30) { y = y - 2.0 * f * d / q; }
	return y;
}
vec3 helmgen_neutral_(vec3 v) {
	float m = (v.x + v.y + v.z) / 3.0;
	float s = (max(max(v.x, v.y), v.z) - min(min(v.x, v.y), v.z)) / max(abs(m), 1e-30) / 1e-5;
	float w = exp(-(s * s));
	return vec3(v.x + w * (m - v.x), v.y + w * (m - v.y), v.z + w * (m - v.z));
}
vec3 helmgen_chroma_(vec3 c, float p) {
	float C = sqrt(c.y * c.y + c.z * c.z);
	if (C <= 1e-12) { return c; }
	float k = pow(C, p) / C;
	return vec3(c.x, c.y * k, c.z * k);
}
float helmgen_gate_(float L) {
	float g = sin(3.141592653589793 * clamp((L - 0.37) / 0.63, 0.0, 1.0));
	return g * g;
}
float helmgen_wrap_(float d) {
	return d - floor(d / 6.283185307179586 + 0.5) * 6.283185307179586;
}
vec3 helmgen_twist_(vec3 c, float inv) {
	float C = sqrt(c.y * c.y + c.z * c.z);
	float t = helmgen_gate_(c.x);
	if (C < 1e-12 || t < 1e-12) { return c; }
	float g = 0.058 * t;
	float h0 = atan2_(c.z, c.y);
	float h = h0;
	if (inv < 0.5) {
		float d = helmgen_wrap_(h0 - 4.616395871525001) / 0.7;
		h = h0 + g * exp(-0.5 * d * d);
	} else {
		for (int i = 0; i < 8; i++) {
			float d = helmgen_wrap_(h - 4.616395871525001);
			float e = g * exp(-0.5 * d * d / 0.49);
			float F = h + e - h0;
			float F1 = 1.0 - e * d / 0.49;
			float F2 = e * (d * d / 0.49 - 1.0) / 0.49;
			float q = 2.0 * F1 * F1 - F * F2;
			if (abs(q) > 1e-30) { h = h - 2.0 * F * F1 / q; }
		}
	}
	return vec3(c.x, C * cos(h), C * sin(h));
}
float helmgen_lfwd_(float L) {
	if (L <= 0.0 || L >= 1.0) { return L; }
	int i = int(min(floor(L * 20.0), 19.0));
	float t = L * 20.0 - float(i);
	return HELMGEN_PW_[i] + t * (HELMGEN_PW_[i + 1] - HELMGEN_PW_[i]);
}
float helmgen_linv_(float L) {
	if (L <= 0.0 || L >= 1.0) { return L; }
	int k = 0;
	for (int i = 0; i < 19; i++) { if (HELMGEN_PW_[i + 1] <= L) { k = i + 1; } }
	return (float(k) + (L - HELMGEN_PW_[k]) / (HELMGEN_PW_[k + 1] - HELMGEN_PW_[k])) / 20.0;
}

vec3 xyz_helmgen(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = 0.8154832155940707 * x + 0.36033406153858283 * y - 0.12434135574228214 * z;
	float m = 0.03301008352744848 * x + 0.9292865057066174 * y + 0.036121927165754485 * z;
	float s = 0.048188273564565204 * x + 0.2642841575338434 * y + 0.6334971784195539 * z;
	vec3 n = helmgen_neutral_(vec3(helmgen_cubic_(max(l, 0.0)), helmgen_cubic_(max(m, 0.0)), helmgen_cubic_(max(s, 0.0))));
	vec3 p = helmgen_chroma_(vec3(
		0.21193779684470104 * n.x + 0.7992121834263127 * n.y - 0.00410075161564345 * n.z,
		2.4672018828033475 * n.x - 2.9877348024830788 * n.y + 0.520532919679731 * n.z,
		-0.11390787868068575 * n.x + 1.3932982808117473 * n.y - 1.279390402131062 * n.z), 0.978);
	return helmgen_twist_(vec3(helmgen_lfwd_(p.x), p.y, p.z), 0.0);
}
vec3 helmgen_xyz(vec3 c) {
	vec3 t = helmgen_twist_(c, 1.0);
	vec3 p = helmgen_chroma_(vec3(helmgen_linv_(t.x), t.y, t.z), 1.0 / 0.978);
	vec3 n = helmgen_neutral_(vec3(
		0.9930001151336142 * p.x + 0.3259932725305229 * p.y + 0.12945085631713918 * p.z,
		0.9930001151336141 * p.x - 0.08708353111074627 * p.y - 0.03861361743004929 * p.z,
		0.9930001151336136 * p.x - 0.12386097008215022 * p.y - 0.8351991365871062 * p.z));
	float l = n.x * n.x * n.x + 0.021 * n.x;
	float m = n.y * n.y * n.y + 0.021 * n.y;
	float s = n.z * n.z * n.z + 0.021 * n.z;
	return vec3(
		(1.232594797503266 * l - 0.5557590239287522 * m + 0.2736201534771582 * s) * 100.0,
		(-0.04080132787421612 * l + 1.1122288637386537 * m - 0.07142753586443792 * s) * 100.0,
		(-0.07673825928337769 * l - 0.42172784577108563 * m + 1.587523855814341 * s) * 100.0);
}`,
}

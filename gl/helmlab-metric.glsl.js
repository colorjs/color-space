// GLSL chunk: CIE XYZ D65 0-100 <-> Helmlab MetricSpace (Yıldız 2026, v21). XYZ -> M1
// (Bradford to Helmlab's ASTM D65 folded in) -> signed power per cone -> M2 -> Fourier
// hue rotation -> H-K boost -> cubic L -> dark L -> chroma ×S(h), C^p(h), ×T(L), ×HLC(h, L)
// -> L ×exp(g(h)) -> neutral correction -> rotation by -28.2°; the inverse undoes each
// stage, the L and hue steps by the author's fixed Newton counts. Matrices mirror
// helmlab-metric.js M1 / M2 and their derived inverses; the neutral-correction knots and
// PCHIP slopes are read from helmlab-metric.js, which builds them from the pipeline itself.
import xyz from './xyz.glsl.js'
import { neutral } from '../spaces/helmlab-metric.js'

const f = (x) => { const s = String(x); return /[.]/.test(s) ? s : /e/.test(s) ? s.replace('e', '.0e') : s + '.0' }
const table = (name, v) => `const float HELMLABMETRIC_${name}_[${v.length}] = float[${v.length}](${v.map(f).join(', ')});`
const N = neutral.L.length

export default {
	name: 'helmlab-metric',
	deps: [xyz],
	edges: { xyz: ['xyz_helmlabmetric', 'helmlabmetric_xyz'] },
	code: /* glsl */ `
${table('NL', neutral.L)}
${table('NA', neutral.a)}
${table('NB', neutral.b)}
${table('NDA', neutral.da)}
${table('NDB', neutral.db)}

float helmlabmetric_hue_(float b, float a) {
	if (a == 0.0 && b == 0.0) { return 0.0; }
	return atan2_(b, a);
}
float helmlabmetric_four_(float h, float c1, float s1, float c2, float s2, float c3, float s3, float c4, float s4) {
	return c1 * cos(h) + s1 * sin(h) + c2 * cos(2.0 * h) + s2 * sin(2.0 * h) + c3 * cos(3.0 * h) + s3 * sin(3.0 * h) + c4 * cos(4.0 * h) + s4 * sin(4.0 * h);
}
float helmlabmetric_delta_(float h) {
	return helmlabmetric_four_(h, -0.02833024015436984, -0.21131429516166544, 0.2189784817615645, -0.06871898981942523, 0.005506053349515315, -0.0641329861299175, -0.053592461436994296, -0.00954137464208059);
}
float helmlabmetric_ddelta_(float h) {
	return 0.02833024015436984 * sin(h) - 0.21131429516166544 * cos(h) - 2.0 * 0.2189784817615645 * sin(2.0 * h) + 2.0 * -0.06871898981942523 * cos(2.0 * h) - 3.0 * 0.005506053349515315 * sin(3.0 * h) + 3.0 * -0.0641329861299175 * cos(3.0 * h) - 4.0 * -0.053592461436994296 * sin(4.0 * h) + 4.0 * -0.00954137464208059 * cos(4.0 * h);
}
float helmlabmetric_hk_(float a, float b) {
	float C = sqrt(a * a + b * b);
	if (C <= 0.0) { return 0.0; }
	float h = helmlabmetric_hue_(b, a);
	return 0.2676231133101982 * pow(C, 0.8934892185255707) * (1.0 + helmlabmetric_four_(h, 0.7173169828841472, 0.6915224124600773, 0.48647127559605596, 0.9853124591201782, 0.0, 0.0, 0.0, 0.0));
}
float helmlabmetric_lh_(float h) {
	return helmlabmetric_four_(h, -0.4963251525324449, -0.09564696283240552, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
}
float helmlabmetric_dk_(float h) {
	return -0.029053748937210654 + helmlabmetric_four_(h, 1.3346761652952872, -0.1698908144723919, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
}
float helmlabmetric_cs_(float h) {
	return exp(helmlabmetric_four_(h, -0.195370576218515, 0.5330819227283227, 0.08863325582067766, 0.9365540137751136, 0.13789738139719568, 0.061650260197979936, 0.0641970862504494, -0.027401052793571013));
}
float helmlabmetric_cp_(float h) {
	return 1.0 + helmlabmetric_four_(h, -0.09900209889026965, 0.059635520647228726, -0.013586499967803128, 0.2253393118474472, 0.0, 0.0, 0.0, 0.0);
}
float helmlabmetric_tl_(float L) {
	float d = L - 0.5;
	return exp(clamp(-1.5239477450767043 * d + -1.751157310240011 * d * d, -30.0, 30.0));
}
float helmlabmetric_hlc_(float h, float L) {
	return exp(clamp((L - 0.5) * helmlabmetric_four_(h, -0.43576378069144767, 1.060094063845983, 0.47931193034584496, -0.2622579649434462, 0.0, 0.0, 0.0, 0.0), -30.0, 30.0));
}
float helmlabmetric_hl_(float h) {
	return exp(helmlabmetric_four_(h, 0.13610794232685908, 0.1168702235362288, -0.01617739641422492, 0.038145638815030566, 0.0, 0.0, 0.0, 0.0));
}
// neutral correction: PCHIP over the gray ramp's (L, a, b), flat beyond its knots
vec2 helmlabmetric_offset_(float L) {
	if (L <= HELMLABMETRIC_NL_[0]) { return vec2(HELMLABMETRIC_NA_[0], HELMLABMETRIC_NB_[0]); }
	if (L >= HELMLABMETRIC_NL_[${N - 1}]) { return vec2(HELMLABMETRIC_NA_[${N - 1}], HELMLABMETRIC_NB_[${N - 1}]); }
	int lo = 0;
	int hi = ${N - 1};
	for (int i = 0; i < 9; i++) {
		if (hi - lo > 1) {
			int mid = int(float(lo + hi) * 0.5);
			if (HELMLABMETRIC_NL_[mid] <= L) { lo = mid; } else { hi = mid; }
		}
	}
	float w = HELMLABMETRIC_NL_[lo + 1] - HELMLABMETRIC_NL_[lo];
	float t = (L - HELMLABMETRIC_NL_[lo]) / w;
	float t2 = t * t;
	float t3 = t2 * t;
	float h00 = 2.0 * t3 - 3.0 * t2 + 1.0;
	float h10 = w * (t3 - 2.0 * t2 + t);
	float h01 = -2.0 * t3 + 3.0 * t2;
	float h11 = w * (t3 - t2);
	return vec2(
		HELMLABMETRIC_NA_[lo] * h00 + HELMLABMETRIC_NDA_[lo] * h10 + HELMLABMETRIC_NA_[lo + 1] * h01 + HELMLABMETRIC_NDA_[lo + 1] * h11,
		HELMLABMETRIC_NB_[lo] * h00 + HELMLABMETRIC_NDB_[lo] * h10 + HELMLABMETRIC_NB_[lo + 1] * h01 + HELMLABMETRIC_NDB_[lo + 1] * h11);
}

vec3 xyz_helmlabmetric(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = spow_(0.7213433934064374 * x + 0.4534564705831267 * y - 0.19288668750182472 * z, 0.47229813098762524);
	float m = spow_(-0.7881980656521419 * x + 1.7952093247587897 * y + 0.08760612054244236 * z, 0.5149184096354483);
	float s = spow_(-0.0917719343077979 * x + 0.457666327294077 * y + 1.2919251802677139 * z, 0.5113233386366979);
	float L = -0.26355622180094096 * l + 0.4168322883703174 * m + 0.4926763141656403 * s;
	float a = 1.8897570508777322 * l - 3.1212232034205774 * m + 1.0421666921060384 * s;
	float b = 0.3585108617962056 * l + 1.7694028193790368 * m - 1.4120626067695372 * s;
	float h = helmlabmetric_hue_(b, a);
	float C = sqrt(a * a + b * b);
	float hn = h + helmlabmetric_delta_(h);
	a = C * cos(hn);
	b = C * sin(hn);
	h = helmlabmetric_hue_(b, a);
	L = L + helmlabmetric_hk_(a, b);
	float tc = L * (1.0 - L);
	L = L + 0.5385456675962418 * tc + 0.12508858146241716 * tc * (0.5 - L) + 0.6768950256217603 * tc * tc + tc * helmlabmetric_lh_(h);
	float o = 0.0;
	if (L < 1.0) { o = 1.0 - L; }
	L = L * exp(clamp(helmlabmetric_dk_(h) * L * o * o, -30.0, 30.0));
	float cs = helmlabmetric_cs_(h);
	a = a * cs;
	b = b * cs;
	h = helmlabmetric_hue_(b, a);
	C = sqrt(a * a + b * b);
	float Cn = 0.0;
	if (C > 0.0) { Cn = pow(C, helmlabmetric_cp_(h)); }
	float T = helmlabmetric_tl_(L);
	a = Cn * cos(h) * T;
	b = Cn * sin(h) * T;
	float S = helmlabmetric_hlc_(helmlabmetric_hue_(b, a), L);
	a = a * S;
	b = b * S;
	L = L * helmlabmetric_hl_(helmlabmetric_hue_(b, a));
	vec2 e = helmlabmetric_offset_(L);
	a = a - e.x;
	b = b - e.y;
	return vec3(L, a * 0.8813034520649922 + b * 0.472550764869054, a * -0.472550764869054 + b * 0.8813034520649922);
}
vec3 helmlabmetric_xyz(vec3 c) {
	float L = c.x;
	vec2 e = helmlabmetric_offset_(L);
	float a = c.y * 0.8813034520649922 - c.z * 0.472550764869054 + e.x;
	float b = c.y * 0.472550764869054 + c.z * 0.8813034520649922 + e.y;
	L = L / helmlabmetric_hl_(helmlabmetric_hue_(b, a));
	float T = helmlabmetric_hlc_(helmlabmetric_hue_(b, a), L) * helmlabmetric_tl_(L);
	a = a / T;
	b = b / T;
	float h = helmlabmetric_hue_(b, a);
	float C = sqrt(a * a + b * b);
	float Co = 0.0;
	if (C > 0.0) { Co = pow(C, 1.0 / helmlabmetric_cp_(h)); }
	float cs = helmlabmetric_cs_(h);
	a = Co * cos(h) / cs;
	b = Co * sin(h) / cs;
	h = helmlabmetric_hue_(b, a);
	float k = helmlabmetric_dk_(h);
	float Ld = L;
	for (int i = 0; i < 12; i++) {
		float o = 0.0;
		if (L < 1.0) { o = 1.0 - L; }
		float eg = exp(clamp(k * L * o * o, -30.0, 30.0));
		float fp = eg * (1.0 + L * k * o * (1.0 - 3.0 * L));
		if (abs(fp) < 1e-10) { fp = 1.0; }
		L = L - (L * eg - Ld) / fp;
	}
	float lh = helmlabmetric_lh_(h);
	float L1 = L;
	for (int i = 0; i < 15; i++) {
		float t = L * (1.0 - L);
		float dt = 1.0 - 2.0 * L;
		float fp = 1.0 + (0.5385456675962418 + lh) * dt + 0.12508858146241716 * (dt * (0.5 - L) - t) + 0.6768950256217603 * 2.0 * t * dt;
		if (abs(fp) < 1e-10) { fp = 1.0; }
		L = L - (L + (0.5385456675962418 + lh) * t + 0.12508858146241716 * t * (0.5 - L) + 0.6768950256217603 * t * t - L1) / fp;
	}
	L = L - helmlabmetric_hk_(a, b);
	C = sqrt(a * a + b * b);
	float hr = h;
	for (int i = 0; i < 8; i++) {
		float fp = 1.0 + helmlabmetric_ddelta_(hr);
		if (abs(fp) < 1e-10) { fp = 1.0; }
		hr = hr - (hr + helmlabmetric_delta_(hr) - h) / fp;
	}
	a = C * cos(hr);
	b = C * sin(hr);
	float l = spow_(0.918389782281502 * L + 0.5232051237088666 * a + 0.7065804598090855 * b, 2.1173067060606283);
	float m = spow_(1.0899090574433026 * L + 0.07005324849041905 * a + 0.4319776874787043 * b, 1.9420552485353544);
	float s = spow_(1.5988957292642088 * L + 0.2206185006877023 * a + 0.012506037355220928 * b, 1.9557096741686448);
	return vec3(
		(1.065047747935379 * l - 0.3150072964434838 * m + 0.18037429943599495 * s) * 100.0,
		(0.4720851386926018 * l + 0.42720948625079463 * m + 0.04151383817813634 * s) * 100.0,
		(-0.09158113909727097 * l - 0.17371611676983714 * m + 0.7721451890124726 * s) * 100.0);
}`,
}

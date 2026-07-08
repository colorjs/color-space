// GLSL chunk: Oklab <-> OkHSV (Ottosson 2021 color-picker model) — HSV-style cone
// fit exactly inside the sRGB gamut. Mirrors okhsv.js exactly: findCusp/toSt/
// oklabToLinearRGB reused from okhsl's family, duplicated here with the chunk's
// own prefix (same constants as okhsl.js's toSRGBLinear/LabtoLMS_M/RGBCoeff).
export default {
	name: 'okhsv',
	edges: { oklab: ['oklab_okhsv', 'okhsv_oklab'] },
	code: /* glsl */ `
const float OKHSV_TAU_ = 6.283185307179586;
const float OKHSV_K1_ = 0.206;
const float OKHSV_K2_ = 0.03;
const float OKHSV_K3_ = (1.0 + OKHSV_K1_) / (1.0 + OKHSV_K2_);

float okhsv_toe_(float x) {
	float k = OKHSV_K3_ * x - OKHSV_K1_;
	return 0.5 * (k + sqrt(k * k + 4.0 * OKHSV_K2_ * OKHSV_K3_ * x));
}
float okhsv_toeinv_(float x) {
	return (x * x + OKHSV_K1_ * x) / (OKHSV_K3_ * (x + OKHSV_K2_));
}

vec3 okhsv_lab_to_rgb_(vec3 c) {
	float l_ = c.x + 0.3963377773761749 * c.y + 0.2158037573099136 * c.z;
	float m_ = c.x - 0.1055613458156586 * c.y - 0.0638541728258133 * c.z;
	float s_ = c.x - 0.0894841775298119 * c.y - 1.2914855480194092 * c.z;
	float l = l_ * l_ * l_;
	float m = m_ * m_ * m_;
	float s = s_ * s_ * s_;
	return vec3(
		4.0767416360759583 * l - 3.3077115392580629 * m + 0.2309699031821043 * s,
		-1.2684379732850315 * l + 2.6097573492876882 * m - 0.3413193760026570 * s,
		-0.0041960761386756 * l - 0.7034186179359362 * m + 1.7076146940746117 * s);
}

float okhsv_max_saturation_(float a, float b) {
	float k0 = 0.0; float k1 = 0.0; float k2 = 0.0; float k3 = 0.0; float k4 = 0.0;
	float wl = 0.0; float wm = 0.0; float ws = 0.0;
	if (-1.8817031 * a - 0.80936501 * b > 1.0) {
		k0 = 1.19086277; k1 = 1.76576728; k2 = 0.59662641; k3 = 0.75515197; k4 = 0.56771245;
		wl = 4.0767416360759583; wm = -3.3077115392580629; ws = 0.2309699031821043;
	} else if (1.8144408 * a - 1.19445267 * b > 1.0) {
		k0 = 0.73956515; k1 = -0.45954404; k2 = 0.08285427; k3 = 0.12541073; k4 = -0.14503204;
		wl = -1.2684379732850315; wm = 2.6097573492876882; ws = -0.3413193760026570;
	} else {
		k0 = 1.35733652; k1 = -0.00915799; k2 = -1.1513021; k3 = -0.50559606; k4 = 0.00692167;
		wl = -0.0041960761386756; wm = -0.7034186179359362; ws = 1.7076146940746117;
	}
	float sat = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;
	float kl = 0.3963377773761749 * a + 0.2158037573099136 * b;
	float km = -0.1055613458156586 * a - 0.0638541728258133 * b;
	float ks = -0.0894841775298119 * a - 1.2914855480194092 * b;
	float l_ = 1.0 + sat * kl;
	float m_ = 1.0 + sat * km;
	float s_ = 1.0 + sat * ks;
	float l = l_ * l_ * l_;
	float m = m_ * m_ * m_;
	float s = s_ * s_ * s_;
	float lds = 3.0 * kl * l_ * l_;
	float mds = 3.0 * km * m_ * m_;
	float sds = 3.0 * ks * s_ * s_;
	float lds2 = 6.0 * kl * kl * l_;
	float mds2 = 6.0 * km * km * m_;
	float sds2 = 6.0 * ks * ks * s_;
	float f = wl * l + wm * m + ws * s;
	float f1 = wl * lds + wm * mds + ws * sds;
	float f2 = wl * lds2 + wm * mds2 + ws * sds2;
	return sat - (f * f1) / (f1 * f1 - 0.5 * f * f2);
}

vec2 okhsv_find_cusp_(float a, float b) {
	float sCusp = okhsv_max_saturation_(a, b);
	vec3 rgb = okhsv_lab_to_rgb_(vec3(1.0, sCusp * a, sCusp * b));
	float lCusp = spow_(1.0 / max(max(rgb.x, rgb.y), rgb.z), 1.0 / 3.0);
	return vec2(lCusp, lCusp * sCusp);
}

vec3 okhsv_oklab(vec3 c) {
	float h = c.x / 360.0;
	float s = c.y / 100.0;
	float v = c.z / 100.0;
	h = mod_(h, 1.0);
	float l = okhsv_toeinv_(v);
	float a = 0.0;
	float b = 0.0;
	if (l != 0.0 && s != 0.0) {
		float a_ = cos(OKHSV_TAU_ * h);
		float b_ = sin(OKHSV_TAU_ * h);
		vec2 cusp = okhsv_find_cusp_(a_, b_);
		float sMax = cusp.y / cusp.x;
		float tMax = cusp.y / (1.0 - cusp.x);
		float s0 = 0.5;
		float k = 1.0 - s0 / sMax;
		float lv = 1.0 - (s * s0) / (s0 + tMax - tMax * k * s);
		float cv = (s * tMax * s0) / (s0 + tMax - tMax * k * s);
		l = v * lv;
		float cc = v * cv;
		float lvt = okhsv_toeinv_(lv);
		float cvt = (cv * lvt) / lv;
		float lNew = okhsv_toeinv_(l);
		cc = (cc * lNew) / l;
		l = lNew;
		vec3 rgb = okhsv_lab_to_rgb_(vec3(lvt, a_ * cvt, b_ * cvt));
		float scaleL = spow_(1.0 / max(max(rgb.x, rgb.y), max(rgb.z, 0.0)), 1.0 / 3.0);
		l = l * scaleL;
		cc = cc * scaleL;
		a = cc * a_;
		b = cc * b_;
	}
	return vec3(l, a, b);
}

vec3 oklab_okhsv(vec3 c) {
	float l = c.x; float a = c.y; float b = c.z;
	float L = l;
	float s = 0.0;
	float v = okhsv_toe_(L);
	float chroma = sqrt(a * a + b * b);
	float h = 0.5 + atan2_(-b, -a) / OKHSV_TAU_;
	if (L != 0.0 && L != 1.0 && chroma != 0.0) {
		float a_ = a / chroma;
		float b_ = b / chroma;
		vec2 cusp = okhsv_find_cusp_(a_, b_);
		float sMax = cusp.y / cusp.x;
		float tMax = cusp.y / (1.0 - cusp.x);
		float s0 = 0.5;
		float k = 1.0 - s0 / sMax;
		float t = tMax / (chroma + L * tMax);
		float lv = t * L;
		float cv = t * chroma;
		float lvt = okhsv_toeinv_(lv);
		float cvt = (cv * lvt) / lv;
		vec3 rgb = okhsv_lab_to_rgb_(vec3(lvt, a_ * cvt, b_ * cvt));
		float scaleL = spow_(1.0 / max(max(rgb.x, rgb.y), max(rgb.z, 0.0)), 1.0 / 3.0);
		L = L / scaleL;
		chroma = chroma / scaleL;
		chroma = (chroma * okhsv_toe_(L)) / L;
		L = okhsv_toe_(L);
		v = L / lv;
		s = ((s0 + tMax) * cv) / (tMax * s0 + tMax * k * cv);
	}
	if (abs(s) < 1.0e-4 || v == 0.0) {
		h = 0.0;
	} else {
		h = mod_(h, 1.0);
	}
	return vec3(h * 360.0, s * 100.0, v * 100.0);
}`,
}

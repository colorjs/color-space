// GLSL chunk: Oklab <-> OkHSL (Ottosson 2021 color-picker model). Oklab's a,b are
// re-parameterized as hue + gamut-relative saturation so 100% saturation always
// lands on the sRGB gamut boundary. Mirrors okhsl.js exactly: computeMaxSaturation
// / findCusp / findGamutIntersection / getCs (cusp-finding machinery) plus the Lr
// toe, using okhsl.js's own LabtoLMS_M / toSRGBLinear / RGBCoeff constants.
export default {
	name: 'okhsl',
	edges: { oklab: ['oklab_okhsl', 'okhsl_oklab'] },
	code: /* glsl */ `
const float OKHSL_TAU_ = 6.283185307179586;
const float OKHSL_K1_ = 0.206;
const float OKHSL_K2_ = 0.03;
const float OKHSL_K3_ = (1.0 + OKHSL_K1_) / (1.0 + OKHSL_K2_);
const float OKHSL_FLTMAX_ = 3.4028235e38;

float okhsl_toe_(float x) {
	float k = OKHSL_K3_ * x - OKHSL_K1_;
	return 0.5 * (k + sqrt(k * k + 4.0 * OKHSL_K2_ * OKHSL_K3_ * x));
}
float okhsl_toeinv_(float x) {
	return (x * x + OKHSL_K1_ * x) / (OKHSL_K3_ * (x + OKHSL_K2_));
}

vec3 okhsl_lab_to_rgb_(vec3 c) {
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

float okhsl_max_saturation_(float a, float b) {
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

vec2 okhsl_find_cusp_(float a, float b) {
	float sCusp = okhsl_max_saturation_(a, b);
	vec3 rgb = okhsl_lab_to_rgb_(vec3(1.0, sCusp * a, sCusp * b));
	float lCusp = spow_(1.0 / max(max(rgb.x, rgb.y), rgb.z), 1.0 / 3.0);
	return vec2(lCusp, lCusp * sCusp);
}

float okhsl_find_gamut_intersection_(float a, float b, float l1, float c1, float l0, vec2 cusp) {
	float t = 0.0;
	if ((l1 - l0) * cusp.y - (cusp.x - l0) * c1 <= 0.0) {
		t = (cusp.y * l0) / (c1 * cusp.x + cusp.y * (l0 - l1));
	} else {
		t = (cusp.y * (l0 - 1.0)) / (c1 * (cusp.x - 1.0) + cusp.y * (l0 - l1));
		float dl = l1 - l0;
		float dc = c1;
		float kl = 0.3963377773761749 * a + 0.2158037573099136 * b;
		float km = -0.1055613458156586 * a - 0.0638541728258133 * b;
		float ks = -0.0894841775298119 * a - 1.2914855480194092 * b;
		float ldt_ = dl + dc * kl;
		float mdt_ = dl + dc * km;
		float sdt_ = dl + dc * ks;
		float L = l0 * (1.0 - t) + t * l1;
		float C = t * c1;
		float l_ = L + C * kl;
		float m_ = L + C * km;
		float s_ = L + C * ks;
		float l = l_ * l_ * l_;
		float m = m_ * m_ * m_;
		float s = s_ * s_ * s_;
		float ldt = 3.0 * ldt_ * l_ * l_;
		float mdt = 3.0 * mdt_ * m_ * m_;
		float sdt = 3.0 * sdt_ * s_ * s_;
		float ldt2 = 6.0 * ldt_ * ldt_ * l_;
		float mdt2 = 6.0 * mdt_ * mdt_ * m_;
		float sdt2 = 6.0 * sdt_ * sdt_ * s_;
		float r_ = 4.0767416360759583 * l - 3.3077115392580629 * m + 0.2309699031821043 * s - 1.0;
		float r1 = 4.0767416360759583 * ldt - 3.3077115392580629 * mdt + 0.2309699031821043 * sdt;
		float r2 = 4.0767416360759583 * ldt2 - 3.3077115392580629 * mdt2 + 0.2309699031821043 * sdt2;
		float ur = r1 / (r1 * r1 - 0.5 * r_ * r2);
		float tr = -r_ * ur;
		float g_ = -1.2684379732850315 * l + 2.6097573492876882 * m - 0.3413193760026570 * s - 1.0;
		float g1 = -1.2684379732850315 * ldt + 2.6097573492876882 * mdt - 0.3413193760026570 * sdt;
		float g2 = -1.2684379732850315 * ldt2 + 2.6097573492876882 * mdt2 - 0.3413193760026570 * sdt2;
		float ug = g1 / (g1 * g1 - 0.5 * g_ * g2);
		float tg = -g_ * ug;
		float b_ = -0.0041960761386756 * l - 0.7034186179359362 * m + 1.7076146940746117 * s - 1.0;
		float b1 = -0.0041960761386756 * ldt - 0.7034186179359362 * mdt + 1.7076146940746117 * sdt;
		float b2 = -0.0041960761386756 * ldt2 - 0.7034186179359362 * mdt2 + 1.7076146940746117 * sdt2;
		float ub = b1 / (b1 * b1 - 0.5 * b_ * b2);
		float tb = -b_ * ub;
		if (ur < 0.0) { tr = OKHSL_FLTMAX_; }
		if (ug < 0.0) { tg = OKHSL_FLTMAX_; }
		if (ub < 0.0) { tb = OKHSL_FLTMAX_; }
		t = t + min(tr, min(tg, tb));
	}
	return t;
}

vec2 okhsl_st_mid_(float a, float b) {
	float s = 0.11516993 + 1.0 / (
		7.44778970 + 4.15901240 * b +
		a * (-2.19557347 + 1.75198401 * b +
			a * (-2.13704948 - 10.02301043 * b +
				a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a))));
	float t = 0.11239642 + 1.0 / (
		1.61320320 - 0.68124379 * b +
		a * (0.40370612 + 0.90148123 * b +
			a * (-0.27087943 + 0.61223990 * b +
				a * (0.00299215 - 0.45399568 * b - 0.14661872 * a))));
	return vec2(s, t);
}

vec3 okhsl_get_cs_(float l, float a_, float b_) {
	vec2 cusp = okhsl_find_cusp_(a_, b_);
	float cMax = okhsl_find_gamut_intersection_(a_, b_, l, 1.0, l, cusp);
	float sMax = cusp.y / cusp.x;
	float tMax = cusp.y / (1.0 - cusp.x);
	float k = cMax / min(l * sMax, (1.0 - l) * tMax);
	vec2 stMid = okhsl_st_mid_(a_, b_);
	float ca = l * stMid.x;
	float cb = (1.0 - l) * stMid.y;
	float cMid = 0.9 * k * sqrt(sqrt(1.0 / (1.0 / (ca * ca * ca * ca) + 1.0 / (cb * cb * cb * cb))));
	ca = l * 0.4;
	cb = (1.0 - l) * 0.8;
	float c0 = sqrt(1.0 / (1.0 / (ca * ca) + 1.0 / (cb * cb)));
	return vec3(c0, cMid, cMax);
}

vec3 okhsl_oklab(vec3 c) {
	float h = c.x / 360.0;
	float s = c.y / 100.0;
	float l = c.z / 100.0;
	float L = okhsl_toeinv_(l);
	float a = 0.0;
	float b = 0.0;
	h = mod_(h, 1.0);
	if (L != 0.0 && L != 1.0 && s != 0.0) {
		float a_ = cos(OKHSL_TAU_ * h);
		float b_ = sin(OKHSL_TAU_ * h);
		vec3 cs = okhsl_get_cs_(L, a_, b_);
		float c0 = cs.x; float cMid = cs.y; float cMax = cs.z;
		float mid = 0.8;
		float midInv = 1.25;
		float t = 0.0; float k0 = 0.0; float k1 = 0.0; float k2 = 0.0;
		if (s < mid) {
			t = midInv * s;
			k0 = 0.0;
			k1 = mid * c0;
			k2 = 1.0 - k1 / cMid;
		} else {
			t = 5.0 * (s - 0.8);
			k0 = cMid;
			k1 = (0.2 * cMid * cMid * midInv * midInv) / c0;
			k2 = 1.0 - k1 / (cMax - cMid);
		}
		float cc = k0 + (t * k1) / (1.0 - k2 * t);
		a = cc * a_;
		b = cc * b_;
	}
	return vec3(L, a, b);
}

vec3 oklab_okhsl(vec3 c) {
	float l = c.x; float a = c.y; float b = c.z;
	float L = l;
	float s = 0.0;
	float lp = okhsl_toe_(L);
	float chroma = sqrt(a * a + b * b);
	float h = 0.5 + atan2_(-b, -a) / OKHSL_TAU_;
	if (lp != 0.0 && lp != 1.0 && chroma != 0.0) {
		float a_ = a / chroma;
		float b_ = b / chroma;
		vec3 cs = okhsl_get_cs_(L, a_, b_);
		float c0 = cs.x; float cMid = cs.y; float cMax = cs.z;
		float mid = 0.8;
		float midInv = 1.25;
		float k0 = 0.0; float k1 = 0.0; float k2 = 0.0; float t = 0.0;
		if (chroma < cMid) {
			k1 = mid * c0;
			k2 = 1.0 - k1 / cMid;
			t = chroma / (k1 + k2 * chroma);
			s = t * mid;
		} else {
			k0 = cMid;
			k1 = (0.2 * cMid * cMid * midInv * midInv) / c0;
			k2 = 1.0 - k1 / (cMax - cMid);
			t = (chroma - k0) / (k1 + k2 * (chroma - k0));
			s = mid + 0.2 * t;
		}
	}
	if (abs(s) < 1.0e-4) {
		h = 0.0;
	} else if (lp == 0.0) {
		h = 0.0;
		s = 0.0;
	} else if (abs(1.0 - lp) < 1.0e-7) {
		h = 0.0;
		s = 0.0;
	} else {
		h = mod_(h, 1.0);
	}
	return vec3(h * 360.0, s * 100.0, lp * 100.0);
}`,
}

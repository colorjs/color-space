// GLSL chunk: CIE xyY <-> DSH (dominant wavelength d, excitation purity s, luminance
// Y). CIE 1931 2° spectral locus embedded at 5 nm (same table as dsh.js LOCUS,
// x/(x+y+z) already applied). Forward casts the ray white->color against the closed
// boundary (spectral arc + line of purples); purples get a negative complementary
// wavelength. Inverse is exact: color = white + purity*(locus(d) - white). Mirrors
// dsh.js xyy.dsh / dsh.xyy exactly (same D65 2° white 0.3127,0.3290).
import xyy from './xyy.glsl.js'
export default {
	name: 'dsh',
	deps: [xyy],
	edges: { xyy: ['xyy_dsh', 'dsh_xyy'] },
	code: /* glsl */ `
const float DSH_LX_[69] = float[69](0.17556, 0.17516, 0.17482, 0.17451, 0.17411, 0.17401, 0.1738, 0.17356, 0.17334, 0.17302, 0.17258, 0.17209, 0.17141, 0.1703, 0.16888, 0.1669, 0.16441, 0.1611, 0.15664, 0.15099, 0.14396, 0.1355, 0.12412, 0.10959, 0.09129, 0.06871, 0.04539, 0.02346, 0.00817, 0.00386, 0.01387, 0.03885, 0.0743, 0.11416, 0.15472, 0.19288, 0.22962, 0.26578, 0.3016, 0.33736, 0.3731, 0.40874, 0.44406, 0.47877, 0.51249, 0.54479, 0.57515, 0.60293, 0.62704, 0.64823, 0.66576, 0.68008, 0.6915, 0.70061, 0.70792, 0.71403, 0.71903, 0.72303, 0.72599, 0.72827, 0.72997, 0.73109, 0.73199, 0.73272, 0.73342, 0.73405, 0.73439, 0.73459, 0.73469);
const float DSH_LY_[69] = float[69](0.00529, 0.00526, 0.00522, 0.00518, 0.00496, 0.00498, 0.00492, 0.00492, 0.0048, 0.00478, 0.0048, 0.00483, 0.0051, 0.00579, 0.0069, 0.00856, 0.01086, 0.01379, 0.0177, 0.02274, 0.0297, 0.03988, 0.0578, 0.08684, 0.1327, 0.20072, 0.29498, 0.4127, 0.53842, 0.65482, 0.75019, 0.81202, 0.8338, 0.82621, 0.80586, 0.78163, 0.75433, 0.72432, 0.69231, 0.65885, 0.62445, 0.58961, 0.55471, 0.5202, 0.48659, 0.45443, 0.42423, 0.3965, 0.37249, 0.35139, 0.33401, 0.31975, 0.30834, 0.2993, 0.29203, 0.28593, 0.28093, 0.27695, 0.27401, 0.27173, 0.27003, 0.26891, 0.26801, 0.26728, 0.26658, 0.26595, 0.26561, 0.26541, 0.26531);

// t (>0) of the nearest hit of ray (white + t*(dx,dy)) with the closed boundary
// (69-segment polygon: spectral arc + the line-of-purples closing edge)
float dsh_castt_(float dx, float dy) {
	float bestT = 0.0;
	int bestI = -1;
	for (int i = 0; i < 69; i++) {
		float ax = DSH_LX_[i]; float ay = DSH_LY_[i];
		int j = i + 1; if (j >= 69) { j = 0; }
		float bx = DSH_LX_[j]; float by = DSH_LY_[j];
		float ex = bx - ax; float ey = by - ay;
		float denom = dx * ey - dy * ex;
		if (abs(denom) > 1.0e-15) {
			float fx = ax - 0.3127; float fy = ay - 0.329;
			float t = (fx * ey - fy * ex) / denom;
			float u = (fx * dy - fy * dx) / denom;
			if (t > 1.0e-9 && u >= -1.0e-9 && u <= 1.0 + 1.0e-9) {
				if (bestI < 0 || t < bestT) { bestT = t; bestI = i; }
			}
		}
	}
	return bestT;
}

// signed dominant wavelength of the cast: positive on the spectral arc, negative
// complementary wavelength when the ray exits through the line of purples. Tracks
// the winning segment's wavelength (bestWl0) as a running float in step with the
// loop, alongside the segment index — no float->int cast needed.
float dsh_castwl_(float dx, float dy) {
	float bestT = 0.0;
	int bestI = -1;
	float bestU = 0.0;
	float bestWl0 = 0.0;
	float wl0 = 360.0;
	for (int i = 0; i < 69; i++) {
		float ax = DSH_LX_[i]; float ay = DSH_LY_[i];
		int j = i + 1; if (j >= 69) { j = 0; }
		float bx = DSH_LX_[j]; float by = DSH_LY_[j];
		float ex = bx - ax; float ey = by - ay;
		float denom = dx * ey - dy * ex;
		if (abs(denom) > 1.0e-15) {
			float fx = ax - 0.3127; float fy = ay - 0.329;
			float t = (fx * ey - fy * ex) / denom;
			float u = (fx * dy - fy * dx) / denom;
			if (t > 1.0e-9 && u >= -1.0e-9 && u <= 1.0 + 1.0e-9) {
				if (bestI < 0 || t < bestT) { bestT = t; bestI = i; bestU = u; bestWl0 = wl0; }
			}
		}
		wl0 = wl0 + 5.0;
	}
	if (bestI == 68) {
		float ndx = -dx; float ndy = -dy;
		float bestT2 = 0.0;
		int bestI2 = -1;
		float bestU2 = 0.0;
		float bestWl02 = 0.0;
		float wl02 = 360.0;
		for (int i = 0; i < 69; i++) {
			float ax = DSH_LX_[i]; float ay = DSH_LY_[i];
			int j = i + 1; if (j >= 69) { j = 0; }
			float bx = DSH_LX_[j]; float by = DSH_LY_[j];
			float ex = bx - ax; float ey = by - ay;
			float denom = ndx * ey - ndy * ex;
			if (abs(denom) > 1.0e-15) {
				float fx = ax - 0.3127; float fy = ay - 0.329;
				float t = (fx * ey - fy * ex) / denom;
				float u = (fx * ndy - fy * ndx) / denom;
				if (t > 1.0e-9 && u >= -1.0e-9 && u <= 1.0 + 1.0e-9) {
					if (bestI2 < 0 || t < bestT2) { bestT2 = t; bestI2 = i; bestU2 = u; bestWl02 = wl02; }
				}
			}
			wl02 = wl02 + 5.0;
		}
		return -(bestWl02 + 5.0 * bestU2);
	}
	return bestWl0 + 5.0 * bestU;
}

// spectral locus x at wavelength wl (360-700, evenly spaced 5 nm; no float->int cast:
// the bracket index and its lower-bound wavelength advance together through the loop)
float dsh_locusat_x_(float wlIn) {
	float wl = wlIn;
	if (wl < 360.0) { wl = 360.0; }
	if (wl > 700.0) { wl = 700.0; }
	int i = 0;
	float wl0 = 360.0;
	float next = 365.0;
	for (int k = 0; k < 68; k++) {
		if (next < wl) { i = k + 1; wl0 = next; }
		next = next + 5.0;
	}
	float f = (wl - wl0) / 5.0;
	return DSH_LX_[i] + f * (DSH_LX_[i + 1] - DSH_LX_[i]);
}
float dsh_locusat_y_(float wlIn) {
	float wl = wlIn;
	if (wl < 360.0) { wl = 360.0; }
	if (wl > 700.0) { wl = 700.0; }
	int i = 0;
	float wl0 = 360.0;
	float next = 365.0;
	for (int k = 0; k < 68; k++) {
		if (next < wl) { i = k + 1; wl0 = next; }
		next = next + 5.0;
	}
	float f = (wl - wl0) / 5.0;
	return DSH_LY_[i] + f * (DSH_LY_[i + 1] - DSH_LY_[i]);
}

vec3 xyy_dsh(vec3 c) {
	float x = c.x; float y = c.y; float Y = c.z;
	float dx = x - 0.3127; float dy = y - 0.329;
	float mag = sqrt(dx * dx + dy * dy);
	if (mag < 1.0e-10) { return vec3(0.0, 0.0, Y); }
	float t = dsh_castt_(dx, dy);
	float wl = dsh_castwl_(dx, dy);
	return vec3(wl, 1.0 / t, Y);
}

vec3 dsh_xyy(vec3 c) {
	float d = c.x; float s = c.y; float Y = c.z;
	if (s == 0.0 || d == 0.0) { return vec3(0.3127, 0.329, Y); }
	if (d > 0.0) {
		float lx = dsh_locusat_x_(d);
		float ly = dsh_locusat_y_(d);
		return vec3(0.3127 + s * (lx - 0.3127), 0.329 + s * (ly - 0.329), Y);
	}
	float cx = dsh_locusat_x_(-d);
	float cy = dsh_locusat_y_(-d);
	float ddx = 0.3127 - cx; float ddy = 0.329 - cy;
	float t = dsh_castt_(ddx, ddy);
	float px = 0.3127 + t * ddx; float py = 0.329 + t * ddy;
	return vec3(0.3127 + s * (px - 0.3127), 0.329 + s * (py - 0.329), Y);
}`,
}

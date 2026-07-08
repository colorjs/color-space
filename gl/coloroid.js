// GLSL chunk: CIE xyY <-> Coloroid A,T,V (Nemcsics 1980 / MSZ 7300). V = 10*sqrt(Y);
// hue A comes from casting the ray white->color against the 48-grade limit-color
// polygon (embedded twice: grade-sorted for the backward bracket search, angle-sorted
// for the forward polygon walk — same data, see coloroid.js's `table` vs `TABLE`); T
// is the projection onto the white->limit-color line. Mirrors coloroid.js
// xyy.coloroid / coloroid.xyy exactly (same D65 2° white 0.3127,0.3290 as `dsh`).
export default {
	name: 'coloroid',
	edges: { xyy: ['xyy_coloroid', 'coloroid_xyy'] },
	code: `
const float COLOROID_A_[48] = float[48](10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0);
const float COLOROID_X_[48] = float[48](0.44988, 0.46249, 0.47452, 0.48602, 0.49578, 0.50791, 0.51874, 0.5298, 0.54065, 0.55368, 0.5668, 0.57166, 0.59766, 0.61652, 0.63896, 0.66619, 0.70061, 0.63926, 0.55963, 0.50341, 0.46042, 0.42386, 0.38992, 0.35586, 0.32196, 0.28657, 0.22203, 0.15664, 0.12738, 0.10816, 0.09418, 0.08255, 0.07211, 0.05791, 0.04357, 0.03302, 0.02242, 0.0121, 0.00426, 0.011, 0.0768, 0.20262, 0.28892, 0.34423, 0.3784, 0.40292, 0.42137, 0.43648);
const float COLOROID_Y_[48] = float[48](0.54894, 0.53641, 0.52445, 0.51298, 0.50325, 0.49116, 0.48036, 0.46934, 0.45855, 0.44559, 0.43255, 0.42775, 0.40176, 0.38295, 0.36062, 0.33358, 0.2993, 0.26754, 0.22632, 0.19721, 0.17496, 0.15604, 0.13846, 0.12084, 0.10329, 0.08497, 0.05155, 0.0177, 0.05224, 0.09013, 0.12497, 0.15747, 0.18945, 0.24095, 0.30362, 0.35685, 0.41965, 0.50523, 0.60326, 0.73546, 0.83451, 0.77472, 0.70377, 0.6523, 0.6193, 0.59534, 0.57716, 0.56223);
const float COLOROID_TA_[48] = float[48](61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 60.0);
const float COLOROID_TX_[48] = float[48](0.03302, 0.02242, 0.0121, 0.00426, 0.011, 0.0768, 0.20262, 0.28892, 0.34423, 0.3784, 0.40292, 0.42137, 0.43648, 0.44988, 0.46249, 0.47452, 0.48602, 0.49578, 0.50791, 0.51874, 0.5298, 0.54065, 0.55368, 0.5668, 0.57166, 0.59766, 0.61652, 0.63896, 0.66619, 0.70061, 0.63926, 0.55963, 0.50341, 0.46042, 0.42386, 0.38992, 0.35586, 0.32196, 0.28657, 0.22203, 0.15664, 0.12738, 0.10816, 0.09418, 0.08255, 0.07211, 0.05791, 0.04357);
const float COLOROID_TY_[48] = float[48](0.35685, 0.41965, 0.50523, 0.60326, 0.73546, 0.83451, 0.77472, 0.70377, 0.6523, 0.6193, 0.59534, 0.57716, 0.56223, 0.54894, 0.53641, 0.52445, 0.51298, 0.50325, 0.49116, 0.48036, 0.46934, 0.45855, 0.44559, 0.43255, 0.42775, 0.40176, 0.38295, 0.36062, 0.33358, 0.2993, 0.26754, 0.22632, 0.19721, 0.17496, 0.15604, 0.13846, 0.12084, 0.10329, 0.08497, 0.05155, 0.0177, 0.05224, 0.09013, 0.12497, 0.15747, 0.18945, 0.24095, 0.30362);

vec3 xyy_coloroid(vec3 c) {
	float x = c.x; float y = c.y; float Y = c.z;
	float V = 10.0 * sqrt(Y);
	float ux = x - 0.3127; float uy = y - 0.329;
	if (ux == 0.0 && uy == 0.0) { ux = 1.0; uy = 0.0; }
	float A = COLOROID_TA_[0]; float xl = COLOROID_TX_[0]; float yl = COLOROID_TY_[0];
	for (int i = 0; i < 48; i++) {
		float Pa = COLOROID_TA_[i]; float Px = COLOROID_TX_[i]; float Py = COLOROID_TY_[i];
		int j = i + 1; if (j >= 48) { j = 0; }
		float Na = COLOROID_TA_[j]; float Nx = COLOROID_TX_[j]; float Ny = COLOROID_TY_[j];
		float vx = Px - 0.3127; float vy = Py - 0.329;
		float dx2 = Nx - Px; float dy2 = Ny - Py;
		float det = ux * -dy2 - uy * -dx2;
		if (det != 0.0) {
			float t = (vx * -dy2 - vy * -dx2) / det;
			float s = (ux * vy - uy * vx) / det;
			if (t > 0.0 && s >= 0.0 && s < 1.0) {
				float gap = 1.0;
				if (Na > Pa) { gap = Na - Pa; }
				A = Pa + s * gap;
				xl = Px + s * dx2;
				yl = Py + s * dy2;
				break;
			}
		}
	}
	float dx = xl - 0.3127; float dy = yl - 0.329;
	float T = 100.0 * ((x - 0.3127) * dx + (y - 0.329) * dy) / (dx * dx + dy * dy);
	return vec3(A, T, V);
}

vec3 coloroid_xyy(vec3 c) {
	float A = c.x; float T = c.y; float V = c.z;
	int i = 47;
	for (int k = 0; k < 47; k++) {
		if (A >= COLOROID_A_[k] && A < COLOROID_A_[k + 1]) { i = k; break; }
	}
	int j = i + 1; if (j >= 48) { j = 0; }
	float gap = 1.0;
	if (COLOROID_A_[j] > COLOROID_A_[i]) { gap = COLOROID_A_[j] - COLOROID_A_[i]; }
	float s = (A - COLOROID_A_[i]) / gap;
	if (s < 0.0) { s = 0.0; }
	if (s > 1.0) { s = 1.0; }
	float xl = COLOROID_X_[i] + s * (COLOROID_X_[j] - COLOROID_X_[i]);
	float yl = COLOROID_Y_[i] + s * (COLOROID_Y_[j] - COLOROID_Y_[i]);
	float Y = (V / 10.0) * (V / 10.0);
	float t = T / 100.0;
	return vec3(0.3127 + t * (xl - 0.3127), 0.329 + t * (yl - 0.329), Y);
}`,
}

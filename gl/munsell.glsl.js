// GLSL chunk: Munsell HVC <-> CIE xyY (Illuminant C). The renotation is a measured
// dataset, not a formula — the chunk declares it as a `lut` (see the contract):
// spaces/munsell-renotation.js bakes the 1943 table onto its own regular lattice
// (hue 40 × value 9 × chroma 20, column 0 = the illuminant-C white, short cells
// replicating their measured rim), the composer emits the `munsell_ren_` accessor,
// and the host binds the texture. Interpolation lives HERE, scalar, mirroring
// spaces/munsell.js step for step — texelFetch is exact, so JS and GPU read the
// very same numbers. Forward is trilinear; the inverse recovers V by Newton on the
// Newhall quintic, then hue/chroma by coarse lattice search + a damped 2D Newton
// (fixed iteration counts; convergence guards replace JS breaks).
import xyy from './xyy.glsl.js'
import { grid } from '../spaces/munsell-renotation.js'

export default {
	name: 'munsell',
	deps: [xyy],
	edges: { xyy: ['xyy_munsell', 'munsell_xyy'] },
	lut: { name: 'munsell_ren_', w: 40, h: 180, data: grid },
	// texels are float32 (what the GPU reads — the evaluator mirrors it): ~4e-8 xy
	// quantization, amplified ~2000× through xyY→XYZ→rgb (×Y/y², ×255 code scale).
	// Well under half a code value — invisible; the tol names the real bound.
	tol: 2e-4,
	code: /* glsl */ `
float munsell_y_(float V) {
	return 1.2219 * V - 0.23111 * V * V + 0.23951 * V * V * V - 0.021009 * V * V * V * V + 0.0008404 * V * V * V * V * V;
}
// chroma-lerped xy of one (hue, value) lattice column — replicated texels bake in
// the rim clamp, column 0 the white blend, so this IS cellXY
vec2 munsell_cell_(int hi, int vi, int c0, int c1, float tc) {
	vec4 A = munsell_ren_(hi, vi * 20 + c0);
	vec4 B = munsell_ren_(hi, vi * 20 + c1);
	return vec2(A.x + (B.x - A.x) * tc, A.y + (B.y - A.y) * tc);
}
vec3 munsell_xyy(vec3 c) {
	float H = c.x; float V = c.y; float C = c.z;
	float Y = munsell_y_(V);
	if (C <= 0.0) { return vec3(0.31006, 0.31616, Y); }
	float vif = clamp(floor(V) - 1.0, 0.0, 8.0);
	int vi0 = int(vif);
	int vi1 = min(vi0 + 1, 8);
	float tv = clamp(V - 1.0 - vif, 0.0, 1.0);
	float hf = mod_(H - 1e-9, 100.0) / 2.5 - 1.0;
	int h0 = int(mod_(floor(hf), 40.0));
	int h1 = h0 + 1;
	if (h1 == 40) { h1 = 0; }
	float th = hf - floor(hf);
	float cf = clamp(C * 0.5, 0.0, 19.0);
	int c0 = int(floor(cf));
	int c1 = min(c0 + 1, 19);
	float tc = cf - float(c0);
	vec2 q00 = munsell_cell_(h0, vi0, c0, c1, tc);
	vec2 q10 = munsell_cell_(h1, vi0, c0, c1, tc);
	vec2 q01 = munsell_cell_(h0, vi1, c0, c1, tc);
	vec2 q11 = munsell_cell_(h1, vi1, c0, c1, tc);
	float x0 = q00.x + (q10.x - q00.x) * th;
	float y0 = q00.y + (q10.y - q00.y) * th;
	float x1 = q01.x + (q11.x - q01.x) * th;
	float y1 = q01.y + (q11.y - q01.y) * th;
	return vec3(x0 + (x1 - x0) * tv, y0 + (y1 - y0) * tv, Y);
}
vec3 xyy_munsell(vec3 c) {
	float x = c.x; float y = c.y; float Y = c.z;
	float V = 10.0 * cbrt_(max(Y, 0.0) / 100.0);
	for (int i = 0; i < 40; i++) {
		float f = munsell_y_(V) - Y;
		float d = 1.2219 - 0.46222 * V + 0.71853 * V * V - 0.084036 * V * V * V + 0.004202 * V * V * V * V;
		V = V - f / d;
	}
	float dx = x - 0.31006; float dy = y - 0.31616;
	if (sqrt(dx * dx + dy * dy) < 1e-4) { return vec3(0.0, V, 0.0); }
	// coarse: nearest renotation node on this value plane
	float bH = 5.0; float bC = 2.0; float bD = 1e30;
	for (int hi = 0; hi < 40; hi++) {
		for (int k = 1; k <= 19; k++) {
			vec3 f = munsell_xyy(vec3(2.5 * float(hi + 1), V, 2.0 * float(k)));
			float d = (f.x - x) * (f.x - x) + (f.y - y) * (f.y - y);
			if (d < bD) { bD = d; bH = 2.5 * float(hi + 1); bC = 2.0 * float(k); }
		}
	}
	float H = bH; float C = bC;
	float live = 1.0;   // a vanishing Jacobian ends refinement for good (the JS break)
	for (int it = 0; it < 60; it++) {
		vec3 f = munsell_xyy(vec3(H, V, C));
		float ex = f.x - x; float ey = f.y - y;
		if (live > 0.5 && sqrt(ex * ex + ey * ey) >= 1e-8) {
			vec3 fh = munsell_xyy(vec3(H + 0.05, V, C));
			vec3 fc = munsell_xyy(vec3(H, V, C + 0.05));
			float j00 = (fh.x - f.x) / 0.05; float j01 = (fc.x - f.x) / 0.05;
			float j10 = (fh.y - f.y) / 0.05; float j11 = (fc.y - f.y) / 0.05;
			float det = j00 * j11 - j01 * j10;
			if (abs(det) < 1e-12) { live = 0.0; }
			if (live > 0.5) {
				float sH = (j11 * (0.0 - ex) - j01 * (0.0 - ey)) / det;
				float sC = ((0.0 - j10) * (0.0 - ex) + j00 * (0.0 - ey)) / det;
				H = mod_(H + clamp(sH, -5.0, 5.0), 100.0);
				C = max(0.0, C + clamp(sC, -5.0, 5.0));
			}
		}
	}
	return vec3(H, V, C);
}`,
}

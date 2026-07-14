/**
 * Nayatani95 — Yoshinobu Nayatani's 1995 colour appearance model, the culmination of
 * a line of research focused on illuminant-level effects: how the Hunt effect
 * (colourfulness grows with luminance) and the Stevens effect (lightness contrast
 * grows with luminance) reshape colour as adapting illuminance changes. Built on a
 * von Kries cone stage with logarithmic opponent responses, it predicts brightness,
 * lightness, chroma, colourfulness and saturation for related colours. Alongside
 * Hunt's model it fed the CIE effort that became CIECAM97s.
 *
 * @see {@link https://doi.org/10.1002/col.5080200305} Nayatani et al. 1995
 * @year 1995
 * @by Yoshinobu Nayatani
 * @use Historical appearance model of illuminant-level (Hunt/Stevens) effects; folded into the CIECAM97s lineage.
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 190 Chroma
 * @channel {h} 0 360 Hue
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the published worked example's conditions (colour-science doctest): D65
// white [95.05, 100, 108.88], background Y_o = 20, adapting illuminance E_o = 5000 lx,
// normalising illuminance E_or = 1000 lx, noise n = 1. The achromatic/tritanopic/
// protanopic responses Q,t,p are LINEAR in the three log cone signals except for two
// threshold switches (e_R, e_G ∈ {1, 1.758}), so the inverse solves the 3×3 log system
// in each of the 4 regimes and keeps the self-consistent one — exact, no iteration.
// Output is (L*_N, C, θ): the NORMALISED achromatic lightness 100·B_r/B_rw (white → 100,
// black → 0 — a usable lightness axis), the chroma (L*_P/50)^0.7·S, and the hue angle.
// Nayatani's other lightness correlate L*_P = Q + 50 puts black at −19 and only serves as
// the chroma anchor here, so it stays internal.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const nayatani95 = { name: 'nayatani95', range: [[0, 100], [0, 190], [0, 360]] };

// von Kries cone matrix (CIE 1994 / Nayatani)
const M = [0.40024, 0.70760, -0.08081, -0.22630, 1.16532, 0.04570, 0, 0, 0.91822];
const MI = inv3(M);

// baked viewing conditions
const XYZn = [95.05, 100, 108.88], Yo = 20, Eo = 5000, Eor = 1000, n = 1;
const sn = XYZn[0] + XYZn[1] + XYZn[2], xo = XYZn[0] / sn, yo = XYZn[1] / sn;
const xi = (0.48105 * xo + 0.78841 * yo - 0.08081) / yo;
const eta = (-0.27200 * xo + 1.11962 * yo + 0.04570) / yo;
const zeta = 0.91822 * (1 - xo - yo) / yo;
const beta1 = x => { const p = Math.pow(x, 0.4495); return (6.362 * p + 6.469) / (p + 6.469); };
const beta2 = x => { const p = Math.pow(x, 0.5128); return 0.7844 * (8.091 * p + 8.414) / (p + 8.414); };
const Lo = Yo * Eo / (100 * Math.PI); // adapting luminance scale
const bRo = beta1(Lo * xi), bGo = beta1(Lo * eta), bBo = beta2(Lo * zeta);
const bLor = beta1(Yo * Eor / (100 * Math.PI));
const dR = 20 * xi + n, dG = 20 * eta + n, dB = 20 * zeta + n; // log denominators

// normalised achromatic lightness L*_N = 100·B_r/B_rw (white → 100, black → 0), which
// this space reports as its lightness channel. L*_P (= Q + 50, black at −19) is Nayatani's
// other lightness correlate and is still used internally to scale chroma.
const brTerm = (50 / bLor) * ((2 / 3) * bRo + (1 / 3) * bGo); // constant part of B_r
const Brw = ((2 / 3) * bRo * 1.758 * Math.log10((100 * xi + n) / dR) + (1 / 3) * bGo * 1.758 * Math.log10((100 * eta + n) / dG)) * 41.69 / bLor + brTerm;

// chromatic strength E_s(θ), θ in radians (Nayatani 1995 harmonics)
const Es = t => 0.9394 - 0.2478 * Math.sin(t) - 0.0743 * Math.sin(2 * t) + 0.0666 * Math.sin(3 * t) - 0.0186 * Math.sin(4 * t)
	- 0.0055 * Math.cos(t) - 0.0521 * Math.cos(2 * t) - 0.0573 * Math.cos(3 * t) - 0.0061 * Math.cos(4 * t);

// the 4 (e_R, e_G) regime matrices for [Q, t, p] = M_e · [logR', logG', logB']
const regime = [];
for (const eR of [1, 1.758]) for (const eG of [1, 1.758]) regime.push({
	eR, eG,
	inv: inv3([(2 / 3) * bRo * eR, (1 / 3) * bGo * eG, 0, bRo, -(12 / 11) * bGo, (1 / 11) * bBo, (1 / 9) * bRo, (1 / 9) * bGo, -(2 / 9) * bBo])
});

xyz.nayatani95 = (X, Y, Z) => {
	const [R, G, B] = mat3(M, X, Y, Z);
	const lr = Math.log10((R + n) / dR), lg = Math.log10((G + n) / dG), lb = Math.log10((B + n) / dB);
	const eR = R >= 20 * xi ? 1.758 : 1, eG = G >= 20 * eta ? 1.758 : 1;
	const Q = ((2 / 3) * bRo * eR * lr + (1 / 3) * bGo * eG * lg) * 41.69 / bLor;
	const t = bRo * lr - (12 / 11) * bGo * lg + (1 / 11) * bBo * lb;
	const p = (1 / 9) * bRo * lr + (1 / 9) * bGo * lg - (2 / 9) * bBo * lb;
	const Lp = Q + 50; // L*_P — anchors the chroma scale
	const th = Math.atan2(p, t);
	const S = 488.93 / bLor * Es(th) * Math.hypot(t, p);
	const h = (th * 180 / Math.PI + 360) % 360;
	return [100 * (brTerm + Q) / Brw, Math.pow(Math.max(Lp, 0) / 50, 0.7) * S, h];
};

nayatani95.xyz = (L, C, h) => {
	// L is L*_N; recover L*_P (Q + 50) which drives the chroma inverse and the regime solve
	const Qs = L * Brw / 100 - brTerm, Lp = Qs + 50;
	const Q = Qs * bLor / 41.69, th = h * Math.PI / 180;
	const S = Lp > 0 ? C / Math.pow(Lp / 50, 0.7) : 0;
	const mag = S * bLor / (488.93 * Es(th));
	const t = mag * Math.cos(th), p = mag * Math.sin(th);
	// try each threshold regime; keep the self-consistent solve
	let best = null, bestErr = Infinity;
	for (const rg of regime) {
		const [lr, lg, lb] = mat3(rg.inv, Q, t, p);
		const R = dR * Math.pow(10, lr) - n, G = dG * Math.pow(10, lg) - n, B = dB * Math.pow(10, lb) - n;
		const okR = (R >= 20 * xi) === (rg.eR === 1.758), okG = (G >= 20 * eta) === (rg.eG === 1.758);
		const err = (okR ? 0 : 1) + (okG ? 0 : 1);
		if (err < bestErr) { bestErr = err; best = [R, G, B]; if (!err) break; }
	}
	return mat3(MI, ...best);
};

export default nayatani95;

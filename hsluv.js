/**
 * HSLuv color space
 *
 * Human-friendly cylindrical form of CIELUV (LCHuv) — the chroma is rescaled so
 * S=100 is the sRGB gamut boundary at each (L, H). L and H pass straight through
 * to LCHuv; only S↔C differs. Reuses the library's `lchuv` (→ luv → xyz → rgb)
 * and XYZ→linear-sRGB matrix; only the gamut-boundary math lives here.
 *
 * @see {@link https://www.hsluv.org/}
 * @see {@link https://github.com/hsluv/hsluv}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
 * @channel {L} 0 100 Lightness percentage
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lchuv from './lchuv.js';
import { M_LRGB_INV } from './xyz.js';
import { ε as EPSILON, κ as KAPPA } from './cie.js';

// The six sRGB-gamut boundary lines at lightness L, each as [slope, intercept] in
// the chroma plane. Derived (hsluv reference) by setting each linear-sRGB channel
// to 0 or 1; the matrix is the library's XYZ→linear-sRGB (single source of truth).
function getBounds(L) {
	const bounds = [];
	const sub1 = Math.pow(L + 16, 3) / 1560896;
	const sub2 = sub1 > EPSILON ? sub1 : L / KAPPA;
	for (let c = 0; c < 3; c++) {
		const m1 = M_LRGB_INV[c * 3], m2 = M_LRGB_INV[c * 3 + 1], m3 = M_LRGB_INV[c * 3 + 2];
		for (let t = 0; t < 2; t++) {
			const top1 = (284517 * m1 - 94839 * m3) * sub2;
			const top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
			const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
			bounds.push([top1 / bottom, top2 / bottom]);
		}
	}
	return bounds;
}

// max chroma at (L, H) before crossing the gamut — nearest ray-from-origin hit (HSLuv)
export function maxChromaForLH(L, H) {
	const hrad = H / 360 * 2 * Math.PI;
	let min = Infinity;
	for (const [slope, intercept] of getBounds(L)) {
		const len = intercept / (Math.sin(hrad) - slope * Math.cos(hrad));
		if (len >= 0) min = Math.min(min, len);
	}
	return min;
}

// max chroma at L over ALL hues — nearest boundary line to origin (HPLuv pastel bound)
export function maxSafeChromaForL(L) {
	let min = Infinity;
	for (const [slope, intercept] of getBounds(L)) {
		min = Math.min(min, Math.abs(intercept) / Math.sqrt(slope * slope + 1));
	}
	return min;
}

const hsluv = {
	name: 'hsluv',
	range: [[0, 360], [0, 100], [0, 100]]
};

// HSLuv (H,S,L) <-> LCHuv (L,C,H): S = 100·C / maxChroma(L,H)
hsluv.lchuv = (h, s, l) => {
	if (l > 99.9999999) return [100, 0, h];
	if (l < 1e-8) return [0, 0, h];
	return [l, maxChromaForLH(l, h) / 100 * s, h];
};
lchuv.hsluv = (l, c, h) => {
	if (l > 99.9999999) return [h, 0, 100];
	if (l < 1e-8) return [h, 0, 0];
	return [h, c / maxChromaForLH(l, h) * 100, l];
};

export default hsluv;

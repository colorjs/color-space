/**
 * HSLuv is Alexei Boronine's human-friendly cylindrical form of CIELUV, built to
 * fix a longstanding frustration with HSL: at full saturation, different hues
 * reach wildly different actual vividness, so pure yellow at S=100 looks nothing
 * like pure blue at S=100. HSLuv rescales chroma per hue and lightness so that
 * S=100 always lands exactly on the sRGB gamut boundary, giving a saturation
 * slider that behaves consistently across every hue. Lightness and hue pass
 * through unchanged from LCHuv, and the result is popular in design tools and
 * palette generators that want HSL's familiar interface without its uneven color
 * behavior.
 *
 * @see {@link https://www.hsluv.org/}
 * @see {@link https://github.com/hsluv/hsluv}
 * @wiki {@link https://en.wikipedia.org/wiki/HSLuv}
 * @year 2012
 * @by Alexei Boronine
 * @use Perceptually even saturation across hues for design/palette tools; current, actively maintained (renamed from HUSL in 2018).
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

/**
 * HPLuv color space
 *
 * Pastel variant of HSLuv: the chroma is bounded by the LARGEST circle that fits
 * inside the sRGB gamut at each lightness (so every hue stays in gamut), at the
 * cost of S exceeding 100 for vivid colours. L and H pass through to LCHuv; only
 * S↔C differs. Reuses the library's `lchuv` chain and HSLuv's gamut-bound math.
 *
 * @see {@link https://www.hsluv.org/}
 * @see {@link https://github.com/hsluv/hsluv}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage (pastel gamut; exceeds 100 outside it)
 * @channel {L} 0 100 Lightness percentage
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lchuv from './lchuv.js';
import { maxSafeChromaForL } from './hsluv.js';

const hpluv = {
	name: 'hpluv',
	range: [[0, 360], [0, 100], [0, 100]]
};

// HPLuv (H,S,L) <-> LCHuv (L,C,H): S = 100·C / maxSafeChroma(L)
hpluv.lchuv = (h, s, l) => {
	if (l > 99.9999999) return [100, 0, h];
	if (l < 1e-8) return [0, 0, h];
	return [l, maxSafeChromaForL(l) / 100 * s, h];
};
lchuv.hpluv = (l, c, h) => {
	if (l > 99.9999999) return [h, 0, 100];
	if (l < 1e-8) return [h, 0, 0];
	return [h, c / maxSafeChromaForL(l) * 100, l];
};

export default hpluv;

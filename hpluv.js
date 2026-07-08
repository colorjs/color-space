/**
 * HPLuv is the pastel counterpart to HSLuv, from the same project by Alexei
 * Boronine. Instead of fitting saturation to the sRGB gamut boundary at each
 * individual hue, it uses the single largest circle that fits inside the gamut at
 * a given lightness, so every hue stays reachable across the full saturation
 * range — at the cost of never reaching fully vivid colors, since S=100 only means
 * as saturated as the least colorful hue at that lightness allows. Lightness and
 * hue pass through unchanged from LCHuv, just as in HSLuv; only the chroma mapping
 * differs.
 *
 * @see {@link https://www.hsluv.org/}
 * @see {@link https://github.com/hsluv/hsluv}
 * @year 2012
 * @by Alexei Boronine
 * @use Guaranteed-in-gamut pastel companion to HSLuv for palette tools; current, maintained alongside HSLuv.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
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

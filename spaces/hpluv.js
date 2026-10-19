/**
 * HPLuv is the pastel counterpart to HSLuv, from the same project by Alexei Boronine. Where
 * HSLuv fits saturation to the sRGB gamut edge at each hue, HPLuv uses the largest circle that
 * fits inside the gamut at each lightness, so every hue reaches the full saturation range.
 * Lightness and hue come unchanged from LCHuv, as in HSLuv.
 *
 * @see {@link https://www.hsluv.org/}
 * @see {@link https://github.com/hsluv/hsluv}
 * @aka HUSLp
 * @year 2012
 * @by Alexei Boronine
 * @use Always-in-gamut pastel palettes; maintained alongside HSLuv.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
 * @channel {L} 0 100 Lightness percentage
 * @method cylindrical
 * @encoding perceptual
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

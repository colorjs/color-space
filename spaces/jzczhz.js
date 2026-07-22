/**
 * JzCzHz — the cylindrical form of JzAzBz, trading the az/bz opponent axes for polar
 * chroma (Cz) and hue (Hz). It shares JzAzBz's 2017 Safdar et al. foundation for HDR
 * perceptual uniformity, but makes hue and saturation directly readable, which suits
 * gamut mapping and color grading. It's one of the HDR color spaces proposed in the CSS
 * Color HDR module.
 *
 * @see {@link https://www.w3.org/TR/css-color-hdr/#JzCzHz}
 * @year 2017
 * @by Safdar et al.
 * @use HDR hue/chroma editing and gamut mapping; current, proposed in the CSS Color HDR module.
 * @channel {Jz} 0 1 Lightness
 * @channel {Cz} 0 0.5 Chroma
 * @channel {Hz} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import jzazbz from './jzazbz.js';
import { cartToPolar, polarToCart } from '../util.js';

const jzczhz = {
	name: 'jzczhz',
	// Cz 0-0.5 — the radial bound of the az/bz ±0.5 box, the same polar convention as
	// oklch (C = oklab's ±0.4 axis). Measured ceiling: Rec.2020 at the 10 000-nit PQ
	// maximum reaches Cz 0.436, so 0.5 contains everything the space can mean; the
	// colorjs refRange of 1.0 leaves the upper half of the axis unreachable by any
	// light. (CSS Color HDR's 100% ↔ 0.26 is an SDR-typical reference, not a range —
	// HDR content exceeds it.)
	range: [[0, 1], [0, 0.5], [0, 360]]
};

// jzazbz uses native ranges (Jz 0-1, az/bz ±0.5), so this is a pure
// rectangular<->polar transform with no rescaling.
jzczhz.jzazbz = (Jz, Cz, hz) => polarToCart(Jz, Cz, hz);

jzazbz.jzczhz = (Jz, az, bz) => cartToPolar(Jz, az, bz);

export default jzczhz;

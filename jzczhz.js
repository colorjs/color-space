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
 * @use Cylindrical JzAzBz for HDR hue/chroma editing and gamut mapping; current, proposed in the CSS Color HDR module.
 * @channel {Jz} 0 1 Lightness
 * @channel {Cz} 0 1 Chroma
 * @channel {Hz} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @referred display
 * @dynamic hdr
 */
import jzazbz from './jzazbz.js';
import { cartToPolar, polarToCart } from './util.js';

const jzczhz = {
	name: 'jzczhz',
	// Cz 0-1 — colorjs.io reference range (az/bz corners reach hypot(0.5, 0.5) ≈ 0.71)
	range: [[0, 1], [0, 1], [0, 360]]
};

// jzazbz uses native ranges (Jz 0-1, az/bz ±0.5), so this is a pure
// rectangular<->polar transform with no rescaling.
jzczhz.jzazbz = (Jz, Cz, hz) => polarToCart(Jz, Cz, hz);

jzazbz.jzczhz = (Jz, az, bz) => cartToPolar(Jz, az, bz);

export default jzczhz;

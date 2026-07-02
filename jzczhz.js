/**
 * JzCzHz color space
 *
 * Cylindrical variant of JzAzBz for HDR
 * Uses chroma and hue instead of rectangular coordinates
 *
 * @see {@link https://www.w3.org/TR/css-color-hdr/#JzCzHz}
 * @channel {Jz} 0 1 Lightness
 * @channel {Cz} 0 0.5 Chroma
 * @channel {Hz} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic hdr
 */
import jzazbz from './jzazbz.js';
import { cartToPolar, polarToCart } from './util.js';

const jzczhz = {
	name: 'jzczhz',
	range: [[0, 1], [0, 0.5], [0, 360]]
};

// jzazbz uses native ranges (Jz 0-1, az/bz ±0.5), so this is a pure
// rectangular<->polar transform with no rescaling.
jzczhz.jzazbz = (Jz, Cz, hz) => polarToCart(Jz, Cz, hz);

jzazbz.jzczhz = (Jz, az, bz) => cartToPolar(Jz, az, bz);

export default jzczhz;

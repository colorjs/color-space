/**
 * JzCzHz color space
 *
 * Cylindrical variant of JzAzBz for HDR
 * Uses chroma and hue instead of rectangular coordinates
 *
 * @see {@link https://www.w3.org/TR/css-color-hdr/#JzCzHz}
 * @channel {Jz} 0 100 Lightness
 * @channel {Cz} 0 50 Chroma
 * @channel {Hz} 0 360 Hue angle in degrees
 */
import jzazbz from './jzazbz.js';

const jzczhz = {
	name: 'jzczhz'
};

// jzazbz already uses conventional ranges (Jz 0-100, az/bz ±50), so this is a
// pure rectangular<->polar transform with no rescaling.
jzczhz.jzazbz = function(Jz, Cz, hz) {
	const h = hz / 360 * 2 * Math.PI;
	return [Jz, Cz * Math.cos(h), Cz * Math.sin(h)];
};

jzazbz.jzczhz = function(Jz, az, bz) {
	let h = Math.atan2(bz, az) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [Jz, Math.sqrt(az * az + bz * bz), h];
};

export default jzczhz;

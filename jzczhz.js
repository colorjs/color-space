/**
 * JzCzHz color space
 *
 * Cylindrical variant of JzAzBz for HDR
 * Uses chroma and hue instead of rectangular coordinates
 *
 * @channel {Jz} 0 100 Lightness
 * @channel {Cz} 0 50 Chroma
 * @channel {Hz} 0 360 Hue angle in degrees
 */
import jzazbz from './jzazbz.js';

const jzczhz = {
	name: 'jzczhz'
};

jzczhz.jzazbz = function(Jz, Cz, hz) {
	// Normalize from conventional ranges
	Jz = Jz / 100;
	Cz = Cz / 100;
	hz = hz / 360;

	let h = hz * 2 * Math.PI;
	return [
		Jz,
		Cz * Math.cos(h),
		Cz * Math.sin(h)
	];
};

jzazbz.jzczhz = function(Jz, az, bz) {
	let h = Math.atan2(bz, az) / (2 * Math.PI);
	if (h < 0) {
		h += 1;
	}
	// Scale to conventional ranges
	return [
		Jz * 100,
		Math.sqrt(az * az + bz * bz) * 100,
		h * 360
	];
};

export default jzczhz;

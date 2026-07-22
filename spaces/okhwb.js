/**
 * OkHWB is the whiteness-blackness counterpart to OkHSV, extending Björn Ottosson's
 * 2021 family of Oklab-based color pickers. Like the classic HWB model, it describes
 * any color as a pure hue mixed with some amount of white and some amount of black —
 * a way of thinking about color closer to how painters mix tints and shades than
 * hue/saturation/lightness sliders allow. Built directly on OkHSV, it inherits that
 * space's perceptual evenness while staying bounded to the sRGB gamut.
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/#okhwb}
 * @year 2021
 * @by Björn Ottosson
 * @use Perceptually even whiteness/blackness color picker built on OkHSV; current but niche next to OkHSL/OkHSV.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {W} 0 100 Whiteness percentage
 * @channel {B} 0 100 Blackness percentage
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import okhsv from './okhsv.js';

const okhwb = {
	name: 'okhwb',
	range: [[0, 360], [0, 100], [0, 100]]
};

// Okhsv (H, S, V) -> Okhwb (H, W, B)   (W = (1-S)V, B = 1-V)
okhsv.okhwb = (h, s, v) => {
	s /= 100; v /= 100;
	return [h, (1 - s) * v * 100, (1 - v) * 100];
};

// Okhwb (H, W, B) -> Okhsv (H, S, V)
okhwb.okhsv = (h, w, b) => {
	w /= 100; b /= 100;
	if (w + b >= 1) { const g = w / (w + b); return [h, 0, g * 100]; } // achromatic
	const v = 1 - b;
	const s = 1 - w / v;
	return [h, s * 100, v * 100];
};

export default okhwb;

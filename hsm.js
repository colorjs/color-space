/**
 * http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428
 *
 * @module color-space/hsl
 */
import rgb from './rgb.js';

var hsm = {
	name: 'hsm',
	min: [0,0,0],
	max: [1,1,1],
	channel: ['hue', 'saturation', 'mixture'],
	alias: ['HSM']
};

export default hsm


/**
 * HSM to RGB
 *
 * @param {Array<number>} hsm Channel values
 *
 * @return {Array<number>} RGB channel values
 */
hsm.rgb = function ([h, s, m]) {
	// Calculate red (r)
	const r = (3 / 41) * s * Math.cos(h * 2 * Math.PI) + m - (4 / 861) * Math.sqrt(861 * s ** 2 * (1 - Math.cos(h * 2 * Math.PI) ** 2));

	// Calculate green (g)
	const g = (Math.sqrt(41) * s * Math.cos(h * 2 * Math.PI) + 23 * m - 19 * r) / 4;

	// Calculate blue (b)
	const b = (11 * r - 9 * m - Math.sqrt(41) * s * Math.cos(h * 2 * Math.PI)) / 2;

	// Denormalize RGB values to the range [0, 255]
	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	]
};


/**
 * RGB to HSM
 *
 * @param {Array<number>} rgb Channel values
 *
 * @return {Array<number>} HSM channel values
 */
rgb.hsm = function ([r, g, b]) {
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Calculate mixture value (m)
    const m = (4 * r + 2 * g + b) / 7;

    // Calculate hue (h)
    const numerator = 3 * (r - m) - 4 * (g - m) - 4 * (b - m);
    const denominator = Math.sqrt(41) * Math.sqrt((r - m) ** 2 + (g - m) ** 2 + (b - m) ** 2);
    const theta = Math.acos(numerator / denominator);
    let omega = theta;
    if (b > g) {
        omega = 2 * Math.PI - theta;
    }
    const h = omega / (2 * Math.PI);

    // Calculate saturation (s)
    const s = Math.sqrt((r - m) ** 2 + (g - m) ** 2 + (b - m) ** 2) / Math.sqrt((0 - m) ** 2 + (0 - m) ** 2 + (7 - m) ** 2);

    return [h, s, m]
};

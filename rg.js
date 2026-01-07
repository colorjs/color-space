/**
 * RG Chromaticity
 * https://en.wikipedia.org/wiki/Rg_chromaticity
 *
 * Normalized RG color space - a 2D chromaticity space
 * where r + g + b = 1, so blue can be derived
 *
 * @module color-space/rg
 */
import rgb from './rgb.js';

const rg = {
	name: 'rg',
};

/**
 * RG to RGB
 * Since r + g + b = 1, we have b = 1 - r - g
 * We normalize to get actual RGB values
 */
rg.rgb = (r, g) => {
	const b = 1 - r - g;
	// Normalize so max component is 1
	const max = Math.max(r, g, b);
	if (max === 0) return [0, 0, 0];
	return [r / max, g / max, b / max];
};

/**
 * RGB to RG chromaticity
 * Normalize RGB so that r + g + b = 1
 */
rgb.rg = (r, g, b) => {
	const sum = r + g + b;
	if (sum === 0) return [0, 0];
	return [r / sum, g / sum];
};

export default rg;

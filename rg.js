/**
 * RG Chromaticity color space
 *
 * Normalized 2D chromaticity space (r + g + b = 1)
 * Used for color matching and chromaticity analysis
 * Blue component can be derived as 1 - r - g
 *
 * @see {@link https://en.wikipedia.org/wiki/Chromaticity}
 * @channel {r} 0 1 Red chromaticity coordinate
 * @channel {g} 0 1 Green chromaticity coordinate
 */
import rgb from './rgb.js';

const rg = {
	name: 'rg'
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
	// Scale to RGB 0-255
	return [(r / max) * 255, (g / max) * 255, (b / max) * 255];
};

/**
 * RGB to RG chromaticity
 * Normalize RGB so that r + g + b = 1
 */
rgb.rg = (r, g, b) => {
	// Normalize from 0-255 to 0-1 first
	r = r / 255;
	g = g / 255;
	b = b / 255;

	const sum = r + g + b;
	if (sum === 0) return [0, 0];
	return [r / sum, g / sum];
};

export default rg;

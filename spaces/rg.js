/**
 * rg chromaticity — the RGB analog of CIE xy: red, green and blue are normalized by
 * their sum, discarding overall intensity and leaving only the relative color
 * proportions. Because it factors out brightness, it's a long-standing technique in
 * color matching and computer vision for describing a surface's color in a way that's
 * more robust to lighting changes than raw RGB.
 *
 * @see {@link https://en.wikipedia.org/wiki/Chromaticity}
 * @wiki {@link https://en.wikipedia.org/wiki/Rg_chromaticity}
 * @channel {r} 0 1 Red chromaticity coordinate
 * @channel {g} 0 1 Green chromaticity coordinate
 * @method chromaticity
 * @encoding chromaticity
 * @referred display
 * @loss projective Chromaticity only — overall intensity is discarded.
 * @dynamic sdr
 */
// Implementation notes:
// Normalized so r + g + b = 1; the blue component can be derived as 1 - r - g.
import rgb from './rgb.js';

const rg = {
	name: 'rg',
	range: [[0, 1], [0, 1]]
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
	// black carries no chromaticity — it sits at the neutral point (r = g = b), not the blue corner
	if (sum === 0) return [1 / 3, 1 / 3];
	return [r / sum, g / sum];
};

export default rg;

/**
 * OkLrab color space
 *
 * Modified version of Oklab using toe mapping
 * Optimized for color picker gamut mapping
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/}
 * @channel {L} 0 1 Lightness
 * @channel {a} -0.4 0.4 Green-Red axis
 * @channel {b} -0.4 0.4 Blue-Yellow axis
 * @referred display
 * @dynamic sdr
 */
// Oklrab
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import { toe, toeInv } from './okhsl.js';

var oklrab = {
	name: 'oklrab',
	range: [[0, 1], [-0.4, 0.4], [-0.4, 0.4]]
};

oklrab.oklab = function (l, a, b) {
	// Native Oklab/OKLrab: L 0-1, a/b ±0.4 (toe/toeInv work on 0-1)
	return [toeInv(l), a, b];
};

oklab.oklrab = function (l, a, b) {
	// Native Oklab/OKLrab: L 0-1, a/b ±0.4 (toe/toeInv work on 0-1)
	return [toe(l), a, b];
};

export default oklrab;

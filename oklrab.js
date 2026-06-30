/**
 * OkLrab color space
 *
 * Modified version of Oklab using toe mapping
 * Optimized for color picker gamut mapping
 *
 * @channel {L} 0 100 Lightness
 * @channel {a} -40 40 Green-Red axis
 * @channel {b} -40 40 Blue-Yellow axis
 * @referred display
 * @dynamic sdr
 */
// Oklrab
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import { toe, toeInv } from './okhsl.js';

var oklrab = {
	name: 'oklrab'
};

oklrab.oklab = function (l, a, b) {
	// OKLrab: L 0-100, a/b ±40
	// Oklab: L 0-100, a/b ±40
	// toe/toeInv work on 0-1 scale
	return [toeInv(l / 100) * 100, a, b];
};

oklab.oklrab = function (l, a, b) {
	// Oklab: L 0-100, a/b ±40
	// OKLrab: L 0-100, a/b ±40
	// toe/toeInv work on 0-1 scale
	return [toe(l / 100) * 100, a, b];
};

export default oklrab;

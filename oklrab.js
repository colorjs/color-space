/**
 * OkLrab is Björn Ottosson's 2021 adjustment to Oklab's lightness channel, applying
 * a toe curve that compresses near-black values closer to how the eye actually
 * perceives them. Plain Oklab's lightness diverges from CIELAB at the dark end,
 * making blacks read as lighter than they should; the toe mapping corrects this
 * while leaving the a and b axes untouched. It's used mainly for gamut mapping and
 * lightness comparisons where accurate dark-tone behavior matters more than strict
 * fidelity to the original Oklab formulation.
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/}
 * @year 2021
 * @by Björn Ottosson
 * @use Toe-corrected Oklab lightness for accurate dark-tone gamut mapping; current, niche/technical tooling use.
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

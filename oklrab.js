// Oklrab
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import { toe, toeInv } from './okhsl.js';

var oklrab = {
	name: 'oklrab',
	channel: ['l', 'a', 'b'],
	range: [[0, 100], [-40, 40], [-40, 40]]
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

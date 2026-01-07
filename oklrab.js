// Oklrab
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import { toe, toeInv } from './okhsl.js';

var oklrab = {
	name: 'oklrab',
	channel: ['l', 'a', 'b']
};

oklrab.oklab = function (l, a, b) {
	return [toeInv(l), a, b];
};

oklab.oklrab = function (l, a, b) {
	return [toe(l), a, b];
};

export default oklrab;

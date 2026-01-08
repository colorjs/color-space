import rgb from './rgb.js';

const cmy = {
	name: 'cmy',
	channel: ['cyan', 'magenta', 'yellow'],
	range: [[0, 100], [0, 100], [0, 100]]
};

cmy.rgb = (c, m, y) => {
	// Input: CMY 0-100, Output: RGB 0-255
	return [
		(100 - c) / 100 * 255,
		(100 - m) / 100 * 255,
		(100 - y) / 100 * 255
	];
};

rgb.cmy = (r, g, b) => {
	// Input: RGB 0-255, Output: CMY 0-100
	return [
		(1 - r / 255) * 100 || 0,
		(1 - g / 255) * 100 || 0,
		(1 - b / 255) * 100 || 0
	];
};


export default cmy;

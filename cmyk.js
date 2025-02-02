import rgb from './rgb.js';

const cmyk = {
	name: 'cmyk',
	channel: ['cyan', 'magenta', 'yellow', 'black']
};

cmyk.rgb = (c, m, y, k) => [
	1 - Math.min(1, c * (1 - k) + k),
	1 - Math.min(1, m * (1 - k) + k),
	1 - Math.min(1, y * (1 - k) + k)
]

rgb.cmyk = (r, g, b) => {
	let c, m, y, k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c, m, y, k];
};

export default cmyk;

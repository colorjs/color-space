import rgb from './rgb.js';

const cmy = {
	name: 'cmy',
	channel: ['cyan', 'magenta', 'yellow']
};

cmy.rgb = (c, m, y) => [
	(1 - c),
	(1 - m),
	(1 - y)
];

rgb.cmy = (r, g, b) => [
	(1 - r) || 0,
	(1 - g) || 0,
	(1 - b) || 0
];


export default cmy;

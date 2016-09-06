/**
 * Cylindrical CIE LAB
 *
 * @module color-space/lchab
 */

var lab = require('./lab');
var xyz = require('./xyz');

//cylindrical lab
var lchab = module.exports = {
	name: 'lchab',
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['LCHab', 'cielch', 'LCH', 'HLC', 'LSH'],
	min: [0, 0, 0],
	max: [100, 100, 360],

	lab: function(lch) {
		var l = lch[0],
		c = lch[1],
		h = lch[2],
		a, b, hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);
		return [l, a, b];
	},

	xyz: function(arg) {
		return lab.xyz(lchab.lab(arg));
	}
};


//extend lab
lab.lchab = function(lab) {
	var l = lab[0],
	a = lab[1],
	b = lab[2],
	hr, h, c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}
	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

xyz.lchab = function(arg) {
	return lab.lchab(xyz.lab(arg));
};

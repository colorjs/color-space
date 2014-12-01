/**
 * A responsivity of cones color space.
 * Used for CAT - chromatic adaptation transform.
 *
 * http://en.wikipedia.org/wiki/LMS_color_space
 *
 * @todo xyz -> lms
 * @todo  tests
 *
 * @module color-space/lms
 */

var xyz = require('./xyz');

var lms = module.exports = {
	name: 'lms',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['long', 'medium', 'short'],

	//transform matrices
	transform: {
		// hunt–pointer–estevez
		rlab: [
			0.38971, 0.68898,-0.07868,
		   -0.22981, 1.18340, 0.04641,
			0.00000, 0.00000, 1.00000],
		rlabD65: [
			0.4002, 0.7076, -0.0808,
		   -0.2263, 1.1653,  0.0457,
			0.00000,0.00000, 0.9182],
		cmccat97: [
			0.8951, 0.2664,-0.1614,
		   -0.7502, 1.7135,	0.0367,
			0.0389,-0.0686, 1.0296],
		cat97: [
			0.8562, 0.3372,-0.1934,
		   -0.8360, 1.8327, 0.0033,
			0.0357,-0.00469,1.0112],
		cat00: [
			0.7982, 0.3389,-0.1371,
		   -0.5918, 1.5512, 0.0406,
			0.0008, 0.0239, 0.9753],
		cat02: [
			0.7328, 0.4296,-0.1624,
		   -0.7036, 1.6975, 0.0061,
			0.0030, 0.0136, 0.9834]
	},

	//m - a matrix
	xyz: function(arg, m){
		var x = arg[0], y = arg[1], z = arg[2];

		if (!m) {
			m = lms.transform[cat02];
		}

		return [
			x * m[0] + y * m[1] + z * m[2],
			x * m[3] + y * m[4] + z * m[5],
			x * m[6] + y * m[7] + z * m[8]
		];
	}
};

xyz.lms = function(arg, i, o) {
	//TODO

	return [l, u, v];
};
/**
 * A responsivity of cones color space.
 * Used for CAT - chromatic adaptation transform.
 *
 * http://en.wikipedia.org/wiki/LMS_color_space
 *
 * @todo xyz→lms
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
			 .38971, .68898, -.07868,
			-.22981, 1.18340, .04641,
			 .00000, .00000, 1.00000],
		rlabD65: [
			 .4002,  .7076, -.0808,
			-.2263, 1.1653,  .0457,
			 .00000, .00000, .9182],
		cmccat97: [
			 .8951,  .2664, -.1614,
			-.7502, 1.7135,	 .0367,
			 .0389, -.0686, 1.0296],
		cat97: [
			 .8562,  .3372, -.1934,
			-.8360, 1.8327,  .0033,
			 .0357, -.00469, 1.0112],
		cat00: [
			 .7982,  .3389, -.1371,
			-.5918, 1.5512,  .0406,
			 .0008,  .0239,  .9753],
		cat02: [
			 .7328,  .4296, -.1624,
			-.7036, 1.6975,  .0061,
			 .0030,  .0136,  .9834]
	},

	//m - a matrix
	xyz: function(arg, m){
		x = arg[0], y = arg[1], z = arg[2];

		if (!m) m = lms.transform[cat02];

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
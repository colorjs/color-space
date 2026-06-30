/**
 * Cubehelix color space
 *
 * Perceptually uniform single-hue color scheme
 * Designed for scientific visualization
 * Reference: Green, D. A. (2011) A colour scheme for the display of astronomical intensity images
 *
 * @see {@link https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/}
 * @channel {fraction} 0 1 Interpolation fraction along helix (0-1)
 */
import rgb from './rgb.js';

var defaults = {
	// 0..3
	start: 0,
	// -10..10
	rotation: 0.5,
	// 0..1+
	hue: 1,
	// 0..2
	gamma: 1
};

var cubehelix = {
	name: 'cubehelix',
	channel: ['fraction'],
	range: [[0, 1]],
	defaults
};


/**
 * Transform cubehelix level to RGB
 *
 * @param {number|Array<number>} fraction 0..1 cubehelix level
 * @param {Object<string, number>} options Mapping options, overrides defaults
 * @return {Array<number>} rgb tuple 0-255
 */
cubehelix.rgb = function (fraction, options = {}) {
	var start = options.start !== undefined ? options.start : defaults.start;
	var rotation = options.rotation !== undefined ? options.rotation : defaults.rotation;
	var gamma = options.gamma !== undefined ? options.gamma : defaults.gamma;
	var hue = options.hue !== undefined ? options.hue : defaults.hue;

	var angle = 2 * Math.PI * (start / 3 + 1.0 + rotation * fraction);

	fraction = Math.pow(fraction, gamma);

	var amp = hue * fraction * (1 - fraction) / 2.0;

	var r = fraction + amp * (-0.14861 * Math.cos(angle) + 1.78277 * Math.sin(angle));
	var g = fraction + amp * (-0.29227 * Math.cos(angle) - 0.90649 * Math.sin(angle));
	var b = fraction + amp * (+1.97294 * Math.cos(angle));

	r = Math.max(0, Math.min(r, 1));
	g = Math.max(0, Math.min(g, 1));
	b = Math.max(0, Math.min(b, 1));

	// Scale to 0-255
	return [r * 255, g * 255, b * 255];
};
/**
 * RGB to cubehelix is one-way: cubehelix is a one-parameter colormap, so an
 * arbitrary RGB is not generally on the helix and cannot be inverted to it.
 */
rgb.cubehelix = function (r, g, b) {
	throw new Error('rgb.cubehelix: cubehelix is a forward-only colormap (one-way conversion)');
};


export default cubehelix;

/**
 * Cubehelix http://astron-soc.in/bulletin/11June/289392011.pdf
 *
 * @module color-space/cubehelix
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
	defaults
};


/**
 * Transform cubehelix level to RGB
 *
 * @param {number|Array<number>} fraction 0..1 cubehelix level
 * @param {Object<string, number>} options Mapping options, overrides defaults
 * @return {Array<number>} rgb tuple
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

        return [r, g, b];
};
/**
 * RGB to cubehelix
 *
 * @param {Array<number>} rgb RGB values
 * @return {Array<number>} cubehelix fraction(s)
 */
rgb.cubehelix = function (rgb) {
	//TODO - there is no backwise conversion yet
	throw new Error('rgb.cubehelix conversion is not implemented yet');
};


export default cubehelix;

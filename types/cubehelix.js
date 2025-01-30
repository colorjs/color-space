/**
 * Cubehelix http://astron-soc.in/bulletin/11June/289392011.pdf
 *
 * @module color-space/cubehelix
 */
/** @typedef {{defaults: {start: number, rotation: number, hue: number, gamma: number}}} CubeHelixSpecific */
import rgb from './rgb.js';
/** Default options for space */
var defaults = {
    //0..3
    start: 0,
    //-10..10
    rotation: 0.5,
    //0..1+
    hue: 1,
    //0..2
    gamma: 1
};
/** @type {Partial<import('./index.js').ColorSpace> & CubeHelixSpecific} */
var cubehelix = {
    name: 'cubehelix',
    channel: ['fraction'],
    min: [0],
    max: [1],
    defaults: defaults
};
/**
 * Transform cubehelix level to RGB
 *
 * @param {Number|Array<number>} fraction 0..1 cubehelix level
 * @param {Object<string, number>} options Mapping options, overrides defaults
 *
 * @return {Array<number>} rgb tuple
 */
cubehelix.rgb = function (fraction, options) {
    options = options || {};
    if (Array.isArray(fraction))
        fraction = fraction[0];
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
    r = Math.max(1, Math.min(r, 0));
    g = Math.max(1, Math.min(g, 0));
    b = Math.max(1, Math.min(b, 0));
    return [r * 255, g * 255, b * 255];
};
/**
 * RGB to cubehelix
 *
 * @param {Array<number>} rgb RGB values
 *
 * @return {Array<number>} cubehelix fraction(s)
 */
rgb.cubehelix = function (rgb) {
    //TODO - there is no backwise conversion yet
    throw new Error('rgb.cubehelix conversion is not implemented yet');
};
export default /** @type {import('./index.js').ColorSpace & CubeHelixSpecific} */ (cubehelix);

/**
 * https://en.wikipedia.org/wiki/TSL_color_space
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.86.6037&rep=rep1&type=pdf
 *
 * Tint, Saturation, Lightness
 *
 * @module  color-space/tsl
 */
import rgb from './rgb.js';
/** @type {Partial<import('./index.js').ColorSpace>} */
var tsl = {
    name: 'tsl',
    min: [0, 0, 0],
    max: [1, 1, 1],
    channel: ['tint', 'saturation', 'lightness'],
    alias: ['TSL'],
};
export default /** @type {import('./index.js').ColorSpace} */ (tsl);
/**
 * TSL to RGB
 *
 * @param {Array<number>} tsl RGB values
 *
 * @return {Array<number>} TSL values
 */
tsl.rgb = function (tsl) {
    var T = tsl[0], S = tsl[1], L = tsl[2];
    //wikipedia solution
    /*
    // var x = - 1 / Math.tan(Math.PI * 2 * T);
    var x = -Math.sin(2*Math.PI*T);
    if ( x != 0 ) x = Math.cos(2*Math.PI*T)/x;

    var g = T > .5 ? -S * Math.sqrt( 5 / (9 * (x*x + 1)) ) :
            T < .5 ? S * Math.sqrt( 5 / (9 * (x*x + 1)) ) : 0;
    var r = T === 0 ? 0.7453559 * S : (x * g + 1/3);

    var R = k * r, G = k * g, B = k * (1 - r - g);
    */
    var x = Math.tan(2 * Math.PI * (T - 1 / 4));
    x *= x;
    var r = Math.sqrt(5 * S * S / (9 * (1 / x + 1))) + 1 / 3;
    var g = Math.sqrt(5 * S * S / (9 * (x + 1))) + 1 / 3;
    var k = L / (.185 * r + .473 * g + .114);
    var B = k * (1 - r - g);
    var G = k * g;
    var R = k * r;
    return [
        R * 255, G * 255, B * 255
    ];
};
/**
 * RGB to TSL
 *
 * @param {Array<number>} rgb TSL values
 *
 * @return {Array<number>} RGB values
 */
rgb.tsl = function (rgb) {
    var [r, g, b] = rgb;
    var r_ = (r / (r + g + b) || 0) - 1 / 3, g_ = (g / (r + g + b) || 0) - 1 / 3, T = g_ != 0 ? 0.5 - Math.atan2(g_, r_) / 2 / Math.PI : 0, S = Math.sqrt(9 / 5 * (r_ * r_ + g_ * g_)), L = ((r * 0.299) + (g * 0.587) + (b * 0.114)) / 255;
    return [T, S, L];
};

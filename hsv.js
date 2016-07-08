/**
 * @module color-space/hsv
 */

var rgb = require('./rgb');
var hsl = require('./hsl');

module.exports = {
    name: 'hsv',
    min: [0,0,0],
    max: [360,100,100],
    channel: ['hue', 'saturation', 'value'],
    alias: ['HSV', 'HSB'],

    rgb: function(hsv) {
        let mod = (a, n) => ((a % n) + n) % n;
        let [h, s, v] = [hsv[0] / 60, hsv[1] / 100, hsv[2] / 100], c = s * v;
        let [q, m] = [c * (1 - Math.abs((h % 2) - 1)), v - c];
        let [md, arr] = [Math.floor(h) % 6, [c, q, 0, 0, q, c]];
        let [r, g, b] = [arr[mod(md, 6)], arr[mod(md - 2, 6)], arr[mod(md - 4, 6)]];
        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    },

    hsl: function(hsv) {
        let [s, v] = [hsv[1] / 100, hsv[2] / 100];
        let l = (2 - s) * v, sl = s * v; sl /= (l <= 1) ? l : 2 - l, sl = sl || 0;
        return [hsv[0], sl * 100, l * 50];
    }
};


//append rgb
rgb.hsv = function(rgb) {
    let [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    let [min, max] = [Math.min(r, g, b), Math.max(r, g, b)];
    let [h, c, v] = [0, max - min, max], s = c / v;
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, s * 100, v * 100];
};

//extend hsl
hsl.hsv = function(hsl) {
    let [s, l] = [hsl[1] / 100, hsl[2] / 50];
    s *= (l <= 1) ? l : 2 - l;
    let v = (l + s) / 2, sv = 0;
    if (l > 0) sv = (2 * s) / (l + s);
    return [hsl[0], sv * 100, v * 100];
};

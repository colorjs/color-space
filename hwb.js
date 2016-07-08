/**
 * @module color-space/hwb
 */

var rgb = require('./rgb');
var hsv = require('./hsv');
var hsl = require('./hsl');
var mod = require('mumath/mod');

var hwb = module.exports = {
    name: 'hwb',
    min: [0, 0, 0],
    max: [360, 100, 100],
    channel: ['hue', 'whiteness', 'blackness'],
    alias: ['HWB'],

    // http://dev.w3.org/csswg/css-color/#hwb-to-rgb
    rgb: function rgb(hwb) {
        var h = hwb[0] / 60;
        var w = hwb[1] / 100;
        var bl = hwb[2] / 100;
        var ra = w + bl;
        if (ra > 1) {
            w /= ra;
            bl /= ra;
        }
        var c = 1 - w - bl;
        var q = c * (1 - Math.abs(h % 2 - 1));
        var m = w;
        var md = Math.floor(h) % 6;
        var arr = [c, q, 0, 0, q, c];
        var r = arr[mod(md, 6)];
        var g = arr[mod(md - 2, 6)];
        var b = arr[mod(md - 4, 6)];

        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    },

    // http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
    hsv: function hsv(hwb) {
        var w = hwb[1] / 100;
        var b = hwb[2] / 100;

        var cn = w + b >= 1,
            v = cn ? w / (w + b) : 1 - b,
            s = cn || b >= 1 ? 0 : 1 - w / (1 - b);
        return [hwb[0], 100 * s, 100 * v];
    },

    hsl: function hsl(arg) {
        return hsv.hsl(hwb.hsv(arg));
    }
};

//extend rgb
rgb.hwb = function (rgb) {
    var r = rgb[0] / 255;
    var g = rgb[1] / 255;
    var b = rgb[2] / 255;
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var h = 0;
    var c = max - min;
    var w = Math.min(r, g, b);
    var bl = 1 - Math.max(r, g, b);
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, w * 100, bl * 100];
};

//keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function (hsv) {
    var s = hsv[1] / 100;
    var v = hsv[2] / 100;

    return [hsv[0], (1 - s) * v * 100, (1 - v) * 100];
};

//extend hsl with proper conversions
hsl.hwb = function (arg) {
    return hsv.hwb(hsl.hsv(arg));
};

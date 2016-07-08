/**
 * @module color-space/hcg
 */

var rgb = require('./rgb');
var hsl = require('./hsl');
var hsv = require('./hsv');
var hwb = require('./hwb');
var mod = require('mumath/mod');

module.exports = {
    name: 'hcg',
    min: [0, 0, 0],
    max: [360, 100, 100],
    channel: ['hue', 'chroma', 'gray'],
    alias: ['HCG', 'HSG'],

    rgb: function rgb(hcg) {
        var h = hcg[0] / 60;
        var c = hcg[1] / 100;
        var gr = hcg[2] / 100;

        if (c <= 0) return [gr * 255, gr * 255, gr * 255];
        var q = c * (1 - Math.abs(h % 2 - 1));
        var m = (1 - c) * gr;
        var md = Math.floor(h) % 6;
        var arr = [c, q, 0, 0, q, c];
        var r = arr[mod(md, 6)];
        var g = arr[mod(md - 2, 6)];
        var b = arr[mod(md - 4, 6)];

        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    },

    hsl: function hsl(hcg) {
        var c = hcg[1] / 100;
        var gr = hcg[2] / 100;
        var l = gr * (1 - c) + 0.5 * c;
        var s = 0;
        if (l > 0 && l < 1) s = c / (1 - Math.abs(2 * l - 1));
        return [hcg[0], s * 100, l * 100];
    },

    hsv: function hsv(hcg) {
        var c = hcg[1] / 100;
        var g = hcg[2] / 100;
        var v = c + g * (1 - c);
        var s = 0;
        if (v > 0) s = c / v;
        return [hcg[0], s * 100, v * 100];
    },

    hwb: function hwb(hcg) {
        var c = hcg[1] / 100;
        var g = hcg[2] / 100;
        var v = c + g * (1 - c);
        return [hcg[0], (v - c) * 100, (1 - v) * 100];
    }
};

//append rgb
rgb.hcg = function (rgb) {
    var r = rgb[0] / 255;
    var g = rgb[1] / 255;
    var b = rgb[2] / 255;
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var h = 0;
    var c = max - min;
    var gr = 0;

    if (c < 1) gr = min / (1 - c);
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, c * 100, gr * 100];
};

//extend hsl
hsl.hcg = function (hsl) {
    var s = hsl[1] / 100;
    var l = hsl[2] / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var gr = 0;
    if (c < 1) gr = (l - 0.5 * c) / (1 - c);
    return [hsl[0], c * 100, gr * 100];
};

//extend hsv
hsv.hcg = function (hsv) {
    var s = hsv[1] / 100;
    var v = hsv[2] / 100;
    var c = s * v;
    var gr = 0;
    if (c < 1) gr = (v - c) / (1 - c);
    return [hsv[0], c * 100, gr * 100];
};

//extend hwb
hwb.hcg = function (hwb) {
    var w = hwb[1] / 100;
    var b = hwb[2] / 100;
    var r = w + b;
    if (r >= 1) {w /= r; b /= r;}
    var c = 1 - b - w, g = 0;
    if (c < 1) g = w / (1 - c);
    return [hwb[0], c * 100, g * 100];
};

/**
 * @module color-space/hsl
 */

var rgb = require('./rgb');
var mod = require('mumath/mod');

module.exports = {
    name: 'hsl',
    min: [0, 0, 0],
    max: [360, 100, 100],
    channel: ['hue', 'saturation', 'lightness'],
    alias: ['HSL'],

    rgb: function rgb(hsl) {
        var h = hsl[0] / 60;
        var s = hsl[1] / 100;
        var l = hsl[2] / 100;
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var q = c * (1 - Math.abs(h % 2 - 1));
        var m = l - c / 2;
        var md = Math.floor(h) % 6;
        var arr = [c, q, 0, 0, q, c];
        var r = arr[mod(md, 6)];
        var g = arr[mod(md - 2, 6)];
        var b = arr[mod(md - 4, 6)];

        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }
};

//extend rgb
rgb.hsl = function (rgb) {
    var r = rgb[0] / 255;
    var g = rgb[1] / 255;
    var b = rgb[2] / 255;
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var h = 0;
    var c = max - min;
    var l = (min + max) / 2;
    var s = 0;
    if (l > 0 && l < 1) s = c / (1 - Math.abs(2 * l - 1));
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, s * 100, l * 100];
};

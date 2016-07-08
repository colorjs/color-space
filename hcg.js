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
    min: [0,0,0],
    max: [360,100,100],
    channel: ['hue', 'chroma', 'gray'],
    alias: ['HCG', 'HSG'],

    rgb: function(hcg) {
        let mod = (a, n) => ((a % n) + n) % n;
        let [h, c, gr] = [hcg[0] / 60, hcg[1] / 100, hcg[2] / 100];
        if (c <= 0) return [gr * 255, gr * 255, gr * 255];
        let [q, m] = [c * (1 - Math.abs((h % 2) - 1)), (1 - c) * gr];
        let [md, arr] = [Math.floor(h) % 6, [c, q, 0, 0, q, c]];
        let [r, g, b] = [arr[mod(md, 6)], arr[mod(md - 2, 6)], arr[mod(md - 4, 6)]];
        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    },

    hsl: function(hcg) {
        let [c, gr] = [hcg[1] / 100, hcg[2] / 100], l = gr * (1 - c) + 0.5 * c, s = 0;
        if (l > 0 && l < 1) s = c / (1 - Math.abs(2 * l - 1));
        return [hcg[0], s * 100, l * 100];
    },

    hsv: function(hcg){
        let [c, g] = [hcg[1] / 100, hcg[2] / 100], v = c + g * (1 - c), s = 0;
        if (v > 0) s = c / v;
        return [hcg[0], s * 100, v * 100];
    },

    hwb: function(hcg){
        let [c, g] = [hcg[1] / 100, hcg[2] / 100], v = c + g * (1 - c);
        return [hcg[0], (v - c) * 100, (1 - v) * 100];
    }
};


//append rgb
rgb.hcg = function(rgb) {
    let [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    let [min, max] = [Math.min(r, g, b), Math.max(r, g, b)];
    let [h, c, gr] = [0, max - min, 0];
    if (c < 1) gr = min / (1 - c);
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, c * 100, gr * 100];
};

//extend hsl
hsl.hcg = function(hsl) {
    let [s, l] = [hsl[1] / 100, hsl[2] / 100], c = (1 - Math.abs(2 * l - 1)) * s, gr = 0;
    if (c < 1) gr = (l - 0.5 * c) / (1 - c);
    return [hsl[0], c * 100, gr * 100];
};

//extend hsv
hsv.hcg = function(hsv){
    let [s, v] = [hsv[1] / 100, hsv[2] / 100], c = s * v, gr = 0;
    if (c < 1) gr = (v - c) / (1 - c);
    return [hsv[0], c * 100, gr * 100];
}

//extend hwb
hwb.hcg = function(hwb){
    let [w, b] = [hwb[1] / 100, hwb[2] / 100];
    let v = 1 - b, c = v - w, g = 0;
    if (c < 1) g = (v - c) / (1 - c);
    return [hwb[0], c * 100, g * 100];
}

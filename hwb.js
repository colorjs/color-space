/**
 * @module color-space/hwb
 */

var rgb = require('./rgb');
var hsv = require('./hsv');
var hsl = require('./hsl');


var hwb = module.exports = {
    name: 'hwb',
    min: [0,0,0],
    max: [360,100,100],
    channel: ['hue', 'whiteness', 'blackness'],
    alias: ['HWB'],

    // http://dev.w3.org/csswg/css-color/#hwb-to-rgb
    rgb: function(hwb) {
        let mod = (a, n) => ((a % n) + n) % n;
        let [h, w, bl] = [hwb[0] / 60, hwb[1] / 100, hwb[2] / 100], ra = w + bl;
        if (ra > 1) {w /= ra; bl /= ra;}
        let c = 1 - w - bl;
        let [q, m] = [c * (1 - Math.abs((h % 2) - 1)), w];
        let [md, arr] = [Math.floor(h) % 6, [c, q, 0, 0, q, c]];
        let [r, g, b] = [arr[mod(md, 6)], arr[mod(md - 2, 6)], arr[mod(md - 4, 6)]];
        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    },

    // http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
    hsv: function(hwb){
        let [w, b] = [hwb[1] / 100, hwb[2] / 100];
        let cn = w + b >= 1, v = cn ? w/(w+b) : (1 - b), s = (cn || b >= 1) ? 0 : (1 - w / (1 - b));
        return [hwb[0], 100 * s, 100 * v];
    },

    hsl: function(arg){
        return hsv.hsl(hwb.hsv(arg));
    }
};


//extend rgb
rgb.hwb = function(rgb) {
    let [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    let [min, max] = [Math.min(r, g, b), Math.max(r, g, b)];
    let [h, c] = [0, max - min], w = Math.min(r, g, b), bl = 1 - Math.max(r, g, b);
    if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
    return [h * 60, w * 100, bl * 100];
};

//keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function(hsv){
    let [s, v] = [hsv[1] / 100, hsv[2] / 100];
    return [hsv[0], (1 - s) * v * 100, (1 - v) * 100];
};


//extend hsl with proper conversions
hsl.hwb = function(arg){
    return hsv.hwb(hsl.hsv(arg));
};

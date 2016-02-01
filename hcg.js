/**
 * @module color-space/hcg
 */

var rgb = require('./rgb');
var hsl = require('./hsl');
var hsv = require('./hsv');

module.exports = {
	name: 'hcg',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'chroma', 'gray'],
	alias: ['HCG', 'HST'],

	rgb: function(hcg) {
		var h = hcg[0] / 360;
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		
		if(c == 0.0) return [g * 255, g * 255, g * 255];
		var hi = h.mod(1) * 6;
		var v = hi.mod(1);
		var pure = [0, 0, 0];
		var w = 1 - v;
		switch(Math.floor(hi)) {
			case 0 : pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1 : pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2 : pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3 : pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4 : pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default: pure[0] = 1; pure[1] = 0; pure[2] = w;
		}
		var mg = (1.0 - c) * g;
		var rgb = [
			(c * pure[0] + mg) * 255, 
			(c * pure[1] + mg) * 255, 
			(c * pure[2] + mg) * 255 
		];
		return rgb;
	},

	hsl: function(hcg) {
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		var l = g * (1.0 - c) + 0.5 * c;
		var s = 0;
		if(l < 1.0 && l > 0.0){
			if(l < 0.5){
				s = c / (2 * l);
			} else {
				s = c / (2 * (1 - l));
			}
		}
		return [hcg[0], s * 100, l * 100];
	}, 
	
	hsv: function(hcg){
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		var v = c + g * (1.0 - c);
		if(v > 0.0){
			var f = c / v;
			return [hcg[0], f * 100, v * 100];
		} else {
			return [hcg[0], 0, v * 100];
		}
	}
};


//append rgb
rgb.hcg = function(rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	
	var max = Math.max(r, g, b);
	var min = Math.min(r, g, b);
	var chroma = (max - min);
	var grayscale, hue;
	if(chroma < 1){
		grayscale = min / (1 - chroma);
	} else grayscale = 0;
	if(chroma > 0){
		hue = (
			(max == r ? ((g - b) / chroma).mod(6) : 
			(max == g ? ((b - r) / chroma) + 2 : 
						((r - g) / chroma) + 4)
			) / 6).mod(1);
	} else hue = 0;
	return [hue * 360, chroma * 100, grayscale * 100];
};

//extend hsl
hsl.hcg = function(hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 0;
	if(l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}
	if(c < 1.0){
		var f = (l - 0.5 * c) / (1.0 - c);
		return [hsl[0], c * 100, f * 100];
	} else {
		return [hsl[0], c * 100, 0];
	}
};

//extend hsv
hsv.hcg = function(hsv){
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var c = s * v;
	if(c < 1.0){
		var f = (v - c) / (1 - c);
		return [hsv[0], c * 100, f * 100];
	} else {
		return [hsv[0], c * 100, 0];
	}
}
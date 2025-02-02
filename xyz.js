import rgb from './rgb.js';
import lrgb from './lrgb.js';

const xyz = {
	name: 'xyz',
	channel: ['X', 'Y', 'Z']
};

// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
xyz.lrgb = (x, y, z) => [
  (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293),
  (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175),
	(x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878)
]

lrgb.xyz = (r, g, b) => [
	(r * 0.41239079926595) + (g * 0.35758433938387) + (b * 0.18048078840183),
	(r * 0.21263900587151) + (g * 0.71516867876775) + (b * 0.072192315360733),
	(r * 0.019330818715591) + (g * 0.11919477979462) + (b * 0.95053215224966)
]

rgb.xyz = (r, g, b) => lrgb.xyz(...rgb.lrgb(r, g, b))
xyz.rgb = (r, g, b) => lrgb.rgb(...xyz.lrgb(r, g, b))

export default xyz;

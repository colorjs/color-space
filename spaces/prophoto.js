/**
 * ProPhoto RGB — Kodak's working space for high-end digital photography, also known as ROMM
 * RGB. Its primaries reach beyond human vision, giving it one of the largest gamuts of any
 * standard RGB space, with a D50 white point.
 *
 * @see {@link https://www.color.org/ROMMRGB.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space}
 * @year 1999
 * @by Kodak
 * @use High-end digital photography and raw processing; a common working space.
 * @aka ROMM RGB
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut prophoto
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import prophotoLinear from './prophoto-linear.js';
import xyz from './xyz.js';

const prophoto = {
	name: 'prophoto',
	range: [[0, 1], [0, 1], [0, 1]]
};

const Et = 1 / 512;
const Et2 = 16 / 512;

function toLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs < Et2) {
		return val / 16;
	}
	return sign * Math.pow(abs, 1.8);
}

function fromLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs >= Et) {
		return sign * Math.pow(abs, 1 / 1.8);
	}
	return 16 * val;
}

prophoto.xyz = (r, g, b) => {
	return prophotoLinear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.prophoto = (x, y, z) => {
	const [lr, lg, lb] = xyz['prophoto-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default prophoto;

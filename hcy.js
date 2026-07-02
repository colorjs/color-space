/**
 * HCY — Hue, Chroma, Luma, a cylindrical color model devised by Kuzma Shapran and
 * popularized by Chilliant for real-time shader use. Unlike HSI or HSL, its Y channel
 * is the color's actual Rec. 601 luma rather than an average or extremum of the RGB
 * channels, and chroma is normalized against the maximum luma the current hue can
 * carry. The result is that two colors with equal Y always read as equally bright, a
 * property neither HSL nor HSV guarantees.
 *
 * @see {@link http://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {C} 0 100 Chroma percentage
 * @channel {Y} 0 100 Luma percentage
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const hcy = {
	name: 'hcy',
	range: [[0, 360], [0, 100], [0, 100]]
};

const wr = 0.299, wg = 0.587, wb = 0.114; // Rec.601 luma weights
const luma = (r, g, b) => wr * r + wg * g + wb * b;

// pure hue (H in 0-1) -> rgb in 0-1, the hexagonal hue ramp
const hueRgb = (H) => [
	Math.min(1, Math.max(0, Math.abs(H * 6 - 3) - 1)),
	Math.min(1, Math.max(0, 2 - Math.abs(H * 6 - 2))),
	Math.min(1, Math.max(0, 2 - Math.abs(H * 6 - 4))),
];

hcy.rgb = (H, C, Y) => {
	H = H / 360; C = C / 100; Y = Y / 100;

	const [hr, hg, hb] = hueRgb(H);
	const Z = luma(hr, hg, hb); // luma of the pure hue
	// renormalize chroma so it can't push any channel out of [0,1] for this Y
	if (Y < Z) { if (Z !== 0) C *= Y / Z; }
	else if (Z < 1) C *= (1 - Y) / (1 - Z);

	return [
		((hr - Z) * C + Y) * 255,
		((hg - Z) * C + Y) * 255,
		((hb - Z) * C + Y) * 255,
	];
};

rgb.hcy = (r, g, b) => {
	r = r / 255; g = g / 255; b = b / 255;

	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let C = max - min;
	let H = 0;
	if (C !== 0) {
		if (max === r) H = ((g - b) / C % 6 + 6) % 6;
		else if (max === g) H = (b - r) / C + 2;
		else H = (r - g) / C + 4;
		H /= 6;
	}

	const Y = luma(r, g, b);
	const Z = luma(...hueRgb(H));
	// invert the chroma renormalization
	if (C !== 0) {
		if (Y < Z) C *= Z / Y;
		else C *= (1 - Z) / (1 - Y);
	}

	return [H * 360, C * 100, Y * 100];
};

export default hcy;

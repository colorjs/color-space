/**
 * RYB color space (red-yellow-blue artists' model)
 *
 * The traditional painter's wheel — where blue + yellow makes green, not the additive
 * RGB grey. Implemented as Johannes Itten's chromatic cube (meodai/rybitten's
 * `RYB_ITTEN`): the 8 RYB corners carry hand-picked RGB anchors and any colour is a
 * smoothstep-eased trilinear blend between them. (0,0,0) = no pigment ≈ white,
 * (255,255,255) = all three ≈ black. RGB→RYB is the numerical (Newton) inverse and
 * best-fits colours outside the artists' gamut.
 *
 * @see {@link https://github.com/meodai/rybitten}
 * @channel {R} 0 255 Red pigment
 * @channel {Y} 0 255 Yellow pigment
 * @channel {B} 0 255 Blue pigment
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import { mat3, inv3 } from './util.js';

const ryb = { name: 'ryb', range: [[0, 255], [0, 255], [0, 255]] };

// Itten chromatic-circle cube (meodai/rybitten RYB_ITTEN); corner index = r + 2y + 4b, RGB 0-1
const CUBE = [
	[0.9921568627450981, 0.9647058823529412, 0.9294117647058824],   // 000 white
	[0.8901960784313725, 0.1411764705882353, 0.12941176470588237],  // 100 red
	[0.9529411764705882, 0.9019607843137255, 0],                    // 010 yellow
	[0.9411764705882353, 0.5568627450980392, 0.10980392156862745],  // 110 orange
	[0.08627450980392157, 0.6, 0.8549019607843137],                 // 001 blue
	[0.47058823529411764, 0.13333333333333333, 0.6666666666666666], // 101 violet
	[0, 0.5568627450980392, 0.3568627450980392],                    // 011 green
	[0.11372549019607843, 0.10980392156862745, 0.10980392156862745] // 111 black
];

const smooth = n => n * n * (3 - 2 * n);
const lerp = (a, b, t) => a + t * (b - a);

// trilinear blend of the cube at eased factors -> rgb 0-1
const blend = (fr, fy, fb) => [0, 1, 2].map(c => {
	const c00 = lerp(CUBE[0][c], CUBE[1][c], fr), c10 = lerp(CUBE[2][c], CUBE[3][c], fr);
	const c01 = lerp(CUBE[4][c], CUBE[5][c], fr), c11 = lerp(CUBE[6][c], CUBE[7][c], fr);
	return lerp(lerp(c00, c10, fy), lerp(c01, c11, fy), fb);
});
const fwd = p => blend(smooth(p[0]), smooth(p[1]), smooth(p[2])); // ryb 0-1 -> rgb 0-1

ryb.rgb = (r, y, b) => fwd([r / 255, y / 255, b / 255]).map(v => v * 255);

rgb.ryb = (R, G, B) => {
	const t = [R / 255, G / 255, B / 255];
	let p = [0.5, 0.5, 0.5];
	for (let i = 0; i < 40; i++) {
		const f = fwd(p), e = [f[0] - t[0], f[1] - t[1], f[2] - t[2]];
		if (Math.hypot(...e) < 1e-7) break;
		const h = 1e-4, J = new Array(9);          // numeric Jacobian, df_r / dp_c
		for (let c = 0; c < 3; c++) {
			const pp = p.slice(), step = pp[c] + h <= 1 ? h : -h;
			pp[c] += step;
			const fp = fwd(pp);
			for (let r = 0; r < 3; r++) J[r * 3 + c] = (fp[r] - f[r]) / step;
		}
		const Ji = inv3(J);
		const dp = mat3(Ji, -e[0], -e[1], -e[2]);
		if (!dp.every(Number.isFinite)) break;     // singular near a cube corner -> keep best fit
		p = p.map((v, k) => Math.min(1, Math.max(0, v + dp[k])));
	}
	return p.map(v => v * 255);
};

export default ryb;

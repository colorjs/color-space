/**
 * RYB is the traditional artists' color wheel built on red, yellow and blue as
 * primaries, the model taught in painting and design education long before RGB or
 * CMYK existed. It captures how pigments actually mix on a palette rather than how
 * light combines — blue and yellow mixed as paint make green, not the grey that
 * additive red and green light would produce — matching painters' lived experience of
 * color instead of colorimetric physics. The version implemented here follows Johannes
 * Itten's chromatic color wheel from his Bauhaus color theory, still a standard
 * reference for teaching color harmony in art and design.
 *
 * @see {@link https://github.com/meodai/rybitten}
 * @channel {R} 0 255 Red pigment
 * @channel {Y} 0 255 Yellow pigment
 * @channel {B} 0 255 Blue pigment
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Implemented as Johannes Itten's chromatic cube (meodai/rybitten's `RYB_ITTEN`): the
// 8 RYB corners carry hand-picked RGB anchors and any color is a smoothstep-eased
// trilinear blend between them. (0,0,0) = no pigment ≈ white, (255,255,255) = all
// three ≈ black. RGB→RYB is the numerical (Newton) inverse and best-fits colors
// outside the artists' gamut.
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
	// fwd factors as trilerp∘smoothstep, so invert in q = smooth(p) space: Newton on
	// the PLAIN trilinear (whose Jacobian never degenerates at corners — smoothstep's
	// zero end-slopes made corner targets like saturated red come back white), then
	// invert smoothstep per channel in closed form: n = ½ − sin(asin(1−2q)/3).
	let q = [0.5, 0.5, 0.5], best = q, bestE = Infinity;
	for (let i = 0; i < 60; i++) {
		const f = blend(...q), e = [f[0] - t[0], f[1] - t[1], f[2] - t[2]];
		const err = Math.hypot(...e);
		if (err < bestE) { bestE = err; best = q; }
		if (err < 1e-12) break;
		const h = 1e-6, J = new Array(9);          // numeric Jacobian, df_r / dq_c
		for (let c = 0; c < 3; c++) {
			const qq = q.slice(), step = qq[c] + h <= 1 ? h : -h;
			qq[c] += step;
			const fp = blend(...qq);
			for (let r = 0; r < 3; r++) J[r * 3 + c] = (fp[r] - f[r]) / step;
		}
		const dq = mat3(inv3(J), -e[0], -e[1], -e[2]);
		if (!dq.every(Number.isFinite)) break;
		// backtracking: halve the step until the residual shrinks
		let lam = 1, qNew = null;
		for (let s = 0; s < 10; s++) {
			const cand = q.map((v, k) => Math.min(1, Math.max(0, v + lam * dq[k])));
			const fc = blend(...cand);
			if (Math.hypot(fc[0] - t[0], fc[1] - t[1], fc[2] - t[2]) < err) { qNew = cand; break; }
			lam /= 2;
		}
		if (!qNew) break; // stationary: out-of-cube target, keep best fit
		q = qNew;
	}
	return best.map(v => (0.5 - Math.sin(Math.asin(1 - 2 * v) / 3)) * 255);
};

export default ryb;

/**
 * Filmic Pro 6 Log color space
 *
 * The Filmic Pro v6 iOS log curve — y = 0.371(√t + 0.28257·ln t + 1.69542), a mixed
 * square-root/log law with y(1) = 1 by construction. No closed-form inverse: decoding
 * runs a Newton solve (colour-science interpolates a LUT). Linear input clamps at the
 * value encoding to 0, keeping black finite. No published gamut — a transfer over
 * `lrgb`. 18% grey → 0.6066.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmicPro6.html}
 * @channel {R} 0 1 Red (Filmic Pro 6)
 * @channel {G} 0 1 Green (Filmic Pro 6)
 * @channel {B} 0 1 Blue (Filmic Pro 6)
 * @referred scene
 * @dynamic hdr
 */
import lrgb from './lrgb.js';

const filmicpro = { name: 'filmicpro', range: [[0, 1], [0, 1], [0, 1]] };

const curve = t => 0.371 * (Math.sqrt(t) + 0.28257 * Math.log(t) + 1.69542);
const slope = t => 0.371 * (0.5 / Math.sqrt(t) + 0.28257 / t);

// floor: the t where curve(t) = 0, found once by bisection (Newton overshoots negative here)
let t0 = 0;
for (let lo = 1e-9, hi = 0.18, i = 0; i < 60; i++) {
	t0 = (lo + hi) / 2;
	if (curve(t0) < 0) lo = t0; else hi = t0;
}

const enc = t => curve(Math.max(t, t0));
const dec = y => {
	let t = 0.18;
	for (let i = 0; i < 40; i++) {
		const e = curve(t) - y;
		if (Math.abs(e) < 1e-12) break;
		t = Math.max(t0 / 2, t - e / slope(t));
	}
	return t;
};

lrgb.filmicpro = (r, g, b) => [enc(r), enc(g), enc(b)];
filmicpro.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default filmicpro;

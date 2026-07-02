/**
 * Filmic Pro 6 Log — the log curve from Filmic Pro, a third-party iOS cinema camera
 * app that gave iPhone footage a flat, grading-ready image years before Apple Log
 * existed natively. Its curve blends a square-root term and a natural-log term into
 * one mixed law, built so a full-scale input maps back to a full-scale output. Like
 * the smartphone-maker log formats that followed it, it has no published native
 * color gamut and is treated as a curve over linear RGB.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmicPro6.html}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// y = 0.371(√t + 0.28257·ln t + 1.69542), y(1) = 1 by construction. No closed-form
// inverse: decoding runs a Newton solve (colour-science interpolates a LUT). Linear
// input clamps at the value encoding to 0, keeping black finite. 18% grey → 0.6066.
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

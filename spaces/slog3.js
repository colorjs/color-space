/**
 * S-Log3 — Sony's current-generation log curve, designed to mimic the tonal
 * placement of film-scanning logs like Cineon for more intuitive grading than the
 * earlier S-Log curves offered. It pairs with the S-Gamut3 primaries and is the
 * recommended acquisition setting across Sony's modern CineAlta, Venice, and Alpha
 * cinema-line cameras. S-Gamut3 has a companion variant, S-Gamut3.Cine, with
 * narrower primaries closer to DCI-P3 for productions that skip a full grade — a
 * separate color space from this one.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2014
 * @by Sony
 * @use Log curve for Sony CineAlta/Venice/Alpha cameras with S-Gamut3; current recommended acquisition setting.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Sony "Technical Summary for S-Gamut3/S-Log3".
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const slog3 = {
	name: 'slog3',
	range: [[0, 1], [0, 1], [0, 1]]
};

const breakpoint = 171.2102946929 / 1023; // encoded-domain linear/log boundary

// S-Log3 -> scene-linear reflectance
const decode = (v) => v >= breakpoint
	? Math.pow(10, (v * 1023 - 420) / 261.5) * 0.19 - 0.01
	: (v * 1023 - 95) * 0.01125 / (171.2102946929 - 95);

// scene-linear -> S-Log3
const encode = (l) => l >= 0.01125
	? (420 + Math.log10((l + 0.01) / 0.19) * 261.5) / 1023
	: (l * (171.2102946929 - 95) / 0.01125 + 95) / 1023;

// S-Gamut3 linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7064827132, 0.1288010498, 0.1151721641,
	0.2709796708, 0.7866064112, -0.0575860820,
	-0.0096778454, 0.0046000375, 1.0941355587
];
const MI = inv3(M);

slog3.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.slog3 = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default slog3;

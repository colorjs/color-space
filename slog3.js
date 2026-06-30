/**
 * Sony S-Log3 / S-Gamut3 color space
 *
 * Sony's S-Log3 transfer over the S-Gamut3 primaries. Per-channel S-Log3 curve
 * to scene-linear, then the S-Gamut3→XYZ(D65) matrix. Sony "Technical Summary
 * for S-Gamut3/S-Log3". (S-Gamut3.Cine uses different primaries — not this space.)
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html}
 * @channel {R} 0 1 Red (S-Log3 encoded)
 * @channel {G} 0 1 Green (S-Log3 encoded)
 * @channel {B} 0 1 Blue (S-Log3 encoded)
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

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

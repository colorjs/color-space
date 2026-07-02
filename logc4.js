/**
 * LogC4 — ARRI's fourth-generation logarithmic encoding, introduced with the
 * ALEXA 35 in 2022. It compresses the sensor's 17 stops into a curve that keeps
 * grading response uniform from deep shadow to specular highlight, paired with the
 * ARRI Wide Gamut 4 primaries — the current standard for ARRI cinema workflows.
 *
 * @see {@link https://www.arri.com/resource/blob/278790/dc29f7399c1dc9553d329e27f1409a89/2022-05-arri-logc4-specification-data.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// EI-independent encoding. ARRI LogC4 Specification (2025-01-23).
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const logc4 = {
	name: 'logc4',
	range: [[0, 1], [0, 1], [0, 1]]
};

// LogC4 curve constants (ARRI LogC4 Spec, Eq 1b/1c/2a/2b/2c) — exact rationals
const a = (Math.pow(2, 18) - 16) / 117.45;
const b = (1023 - 95) / 1023;
const c = 95 / 1023;
const s = (7 * Math.LN2 * Math.pow(2, 7 - 14 * c / b)) / (a * b);
const t = (Math.pow(2, 14 * (-c / b) + 6) - 64) / a;

// LogC4 -> scene-linear (Eq 3)
const decode = (v) => v >= 0
	? (Math.pow(2, 14 * (v - c) / b + 6) - 64) / a
	: v * s + t;

// scene-linear -> LogC4 (Eq 2)
const encode = (v) => v >= t
	? (Math.log2(a * v + 64) - 6) / 14 * b + c
	: (v - t) / s;

// AWG4 linear RGB -> XYZ (D65, Y 0..1), ARRI LogC4 Spec Eq 5a
const M = [
	0.704858320407232064, 0.129760295170463003, 0.115837311473976537,
	0.254524176404027025, 0.781477732712002049, -0.036001909116029039,
	0.000000000000000000, 0.000000000000000000, 1.089057750759878429
];
const MI = inv3(M);

logc4.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.logc4 = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default logc4;

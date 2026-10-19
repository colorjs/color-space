/**
 * Log3G10 — RED Digital Cinema's current log curve, introduced in 2017 with the
 * REDWideGamutRGB primaries as part of RED's IPP2 image pipeline. It encodes the sensor's wide
 * dynamic range logarithmically, leaving grading latitude in both highlights and shadows.
 *
 * @see {@link https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2017
 * @by RED Digital Cinema
 * @use RED's default acquisition curve on Komodo, V-Raptor and Monstro/Helium cameras.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut rwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// RED whitepaper 915-0187 Rev-C. Gamut: REDWideGamutRGB, matrix in rwg.js.
import xyz from './xyz.js';
import rwg from './rwg.js';

const log3g10 = {
	name: 'log3g10',
	range: [[0, 1], [0, 1], [0, 1]]
};

// Log3G10 v3 constants (RED whitepaper 915-0187 Rev-C)
const A = 0.224282;     // log scale
const Bm = 155.975327;  // linear stretch
const off = 0.01;       // black offset
const slope = 15.1927;  // sub-zero linear slope (= A*Bm/ln10, C1-continuous at 0)

// Log3G10 -> RWG scene-linear
const decode = (v) => v >= 0
	? (Math.pow(10, v / A) - 1) / Bm - off
	: v / slope - off;

// RWG scene-linear -> Log3G10
const encode = (l) => {
	const x = l + off;
	return x < 0 ? x * slope : A * Math.log10(x * Bm + 1);
};

log3g10.xyz = (r, g, b) => rwg.xyz(decode(r), decode(g), decode(b));

xyz.log3g10 = (x, y, z) => {
	const [r, g, b] = xyz.rwg(x, y, z);
	return [encode(r), encode(g), encode(b)];
};

export default log3g10;

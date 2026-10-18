/**
 * S-Gamut3 – Sony's wide camera RGB, introduced in 2014 alongside the S-Log3 curve.
 * It carries the same primaries as the original S-Gamut that S-Log and S-Log2
 * recorded, so one matrix serves all three Sony logs here; the narrower S-Gamut3.Cine
 * variant is a separate space (sgamut3cine). This is the scene-linear form, before
 * the log curve, with highlights above 1.0.
 *
 * @see {@link https://github.com/aces-aswf/aces-input-and-colorspaces/blob/main/sony/CSC.Sony.SLog3_SGamut3_to_ACES.ctl}
 * @year 2014
 * @by Sony
 * @use Scene-linear camera gamut beneath S-Log3 (and S-Log/S-Log2 on S-Gamut) for Sony footage in VFX and grading; current.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut sgamut3
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Primaries R(0.730, 0.280) G(0.140, 0.855) B(0.100, -0.050), white D65 (0.3127, 0.3290):
// Sony's vendor-supplied ACES CSC (SONY_SGAMUT3_PRI); colour-science 0.4.7 lists the same
// for 'S-Gamut' and 'S-Gamut3'. M is Sony's 10-decimal matrix (S-Gamut3_S-Gamut3Cine_
// Matrix.xlsx, as colour-science carries it exactly), within 5e-11 of the normalized
// primary matrix. MI = inv3(M). The single owner of this matrix: slog.js, slog2.js and
// slog3.js compose their curves with these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const sgamut3 = {
	name: 'sgamut3',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// S-Gamut3 (= S-Gamut) linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7064827132, 0.1288010498, 0.1151721641,
	0.2709796708, 0.7866064112, -0.0575860820,
	-0.0096778454, 0.0046000375, 1.0941355587
];
const MI = inv3(M);

sgamut3.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.sgamut3 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default sgamut3;

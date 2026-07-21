/**
 * S-Gamut3.Cine — Sony's cinema variant of S-Gamut3, carried here with its paired
 * S-Log3 curve the way cameras record it (menu name "S-Gamut3.Cine/S-Log3"). Its
 * primaries are pulled in toward DCI-P3 — a gamut designed after negative film,
 * slightly wider than the P3 target — so footage grades to DCI-P3 or Rec.709 with
 * less correction than full S-Gamut3 needs. That convenience made it the common
 * pick on Alpha and FX-line cameras when a production skips a heavy grade; full
 * S-Gamut3 (see slog3) remains the wide-archive choice.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.RGB_COLOURSPACE_S_GAMUT3_CINE.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2014
 * @by Sony
 * @use S-Log3 recording on the narrower S-Gamut3.Cine primaries; Sony's common cine setting for P3/709-bound grades.
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
// Sony "Technical Summary for S-Gamut3.Cine/S-Log3 and S-Gamut3/S-Log3":
// primaries R(0.766, 0.275) G(0.225, 0.800) B(0.089, -0.087), white D65.
// Curve is S-Log3 (see slog3.js); matrix matches colour-science
// RGB_COLOURSPACE_S_GAMUT3_CINE.matrix_RGB_to_XYZ to 1e-10.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const sgamut3cine = {
	name: 'sgamut3cine',
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

// S-Gamut3.Cine linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.5990839208, 0.2489255161, 0.1024464902,
	0.2150758201, 0.8850685017, -0.1001443219,
	-0.0320658495, -0.0276583907, 1.1487819910
];
const MI = inv3(M);

sgamut3cine.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.sgamut3cine = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default sgamut3cine;

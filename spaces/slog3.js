/**
 * S-Log3 — Sony's current log curve, modeled on the tonal placement of film-scan logs like
 * Cineon, so it grades more intuitively than the earlier S-Log curves. It pairs with S-Gamut3;
 * the narrower S-Gamut3.Cine variant, closer to DCI-P3 for productions that skip a full grade,
 * is a separate color space.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2014
 * @by Sony
 * @use Sony CineAlta, Venice and Alpha cameras with S-Gamut3; the recommended acquisition setting.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut sgamut3
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Sony "Technical Summary for S-Gamut3/S-Log3". Gamut: S-Gamut3, matrix in sgamut3.js.
import xyz from './xyz.js';
import sgamut3 from './sgamut3.js';

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

slog3.xyz = (r, g, b) => sgamut3.xyz(decode(r), decode(g), decode(b));

xyz.slog3 = (x, y, z) => {
	const [r, g, b] = xyz.sgamut3(x, y, z);
	return [encode(r), encode(g), encode(b)];
};

export default slog3;

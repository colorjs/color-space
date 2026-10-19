/**
 * S-Log2 — Sony's second log curve, a rescaled S-Log that captures more of the camera's
 * dynamic range and improves shadows. It shares the S-Gamut primaries with S-Log and S-Log3.
 * Sony offers it beside S-Log3, not replaced by it, on many cameras, for finer gradation in
 * the mid-to-high tones.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog2.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2012
 * @by Sony
 * @use Sony's second-generation cinema log (F65, F55 and F5 era).
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
// No @successor: Sony's S-Gamut3.Cine/S-Log3 technical FAQ (2014) answers "No" to S-Log3 succeeding
// S-Log2, and its current support pages still offer both (Sony support article 00145908).
// S-Gamut shares S-Gamut3's primaries; matrix in sgamut3.js. Wraps base S-Log with a
// 155/219 scene scaling and the in-reflection (÷0.9) + legal-range code-value
// convention. 18% grey → 0.3395.
import xyz from './xyz.js';
import sgamut3 from './sgamut3.js';

const slog2 = { name: 'slog2', range: [[0, 1], [0, 1], [0, 1]] };

// base S-Log (raw IRE) <-> linear, then 155/219 scaling + legal-range code value
const raw = t => t >= 0 ? 0.432699 * Math.log10(t + 0.037584) + 0.646596 : t * 5 + 0.030001222851889303;
const rawInv = y => y >= 0.030001222851889303 ? Math.pow(10, (y - 0.646596) / 0.432699) - 0.037584 : (y - 0.030001222851889303) / 5;
const enc = x => ((raw((x / 0.9) * 155 / 219)) * 876 + 64) / 1023;
const dec = cv => rawInv((cv * 1023 - 64) / 876) * 0.9 * 219 / 155;

slog2.xyz = (r, g, b) => sgamut3.xyz(dec(r), dec(g), dec(b));
xyz.slog2 = (x, y, z) => { const [r, g, b] = xyz.sgamut3(x, y, z); return [enc(r), enc(g), enc(b)]; };

export default slog2;

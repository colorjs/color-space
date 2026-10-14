/**
 * S-Log — Sony's first logarithmic gamma curve, introduced on the F35 and F3
 * cameras to capture more dynamic range than conventional video gammas allowed.
 * Paired with the S-Gamut primaries, it was designed for scene-referred acquisition
 * ahead of color grading, but its tonal placement was quickly refined by S-Log2 and
 * then S-Log3. It survives mainly for compatibility with archival footage shot in
 * that era.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2008
 * @by Sony
 * @use Sony's first cinema log curve (F35/F3 cameras); legacy, kept for archival-footage compatibility.
 * @successor slog2 S-Log2 rescaled it to hold more of the sensor's range
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
// S-Gamut shares S-Gamut3's primaries; matrix in sgamut3.js. In-reflection (÷0.9) +
// 10-bit legal-range code-value convention. 18% grey → 0.3850.
import xyz from './xyz.js';
import sgamut3 from './sgamut3.js';

const slog = { name: 'slog', range: [[0, 1], [0, 1], [0, 1]] };

const raw = t => t >= 0 ? 0.432699 * Math.log10(t + 0.037584) + 0.646596 : t * 5 + 0.030001222851889303;
const rawInv = y => y >= 0.030001222851889303 ? Math.pow(10, (y - 0.646596) / 0.432699) - 0.037584 : (y - 0.030001222851889303) / 5;
const enc = x => (raw(x / 0.9) * 876 + 64) / 1023;
const dec = cv => rawInv((cv * 1023 - 64) / 876) * 0.9;

slog.xyz = (r, g, b) => sgamut3.xyz(dec(r), dec(g), dec(b));
xyz.slog = (x, y, z) => xyz.sgamut3(x, y, z).map(enc);

export default slog;

/**
 * S-Log — Sony's first logarithmic gamma curve, introduced on the F35 and F3
 * cameras to capture more dynamic range than conventional video gammas allowed.
 * Paired with the S-Gamut primaries, it was designed for scene-referred acquisition
 * ahead of color grading, but its tonal placement was quickly refined by S-Log2 and
 * then S-Log3. It survives mainly for compatibility with archival footage shot in
 * that era.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog.html}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Same primaries/matrix as S-Gamut3 (see slog3.js). In-reflection (÷0.9) + 10-bit
// legal-range code-value convention. 18% grey → 0.3850.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const slog = { name: 'slog', range: [[0, 1], [0, 1], [0, 1]] };

const raw = t => t >= 0 ? 0.432699 * Math.log10(t + 0.037584) + 0.646596 : t * 5 + 0.030001222851889303;
const rawInv = y => y >= 0.030001222851889303 ? Math.pow(10, (y - 0.646596) / 0.432699) - 0.037584 : (y - 0.030001222851889303) / 5;
const enc = x => (raw(x / 0.9) * 876 + 64) / 1023;
const dec = cv => rawInv((cv * 1023 - 64) / 876) * 0.9;

// S-Gamut linear RGB -> XYZ (D65, Y 0..1) — same primaries as S-Gamut3 (see slog3.js)
const M = [
	0.7064827132, 0.1288010498, 0.1151721641,
	0.2709796708, 0.7866064112, -0.0575860820,
	-0.0096778454, 0.0046000375, 1.0941355587
];
const MI = inv3(M);

slog.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.slog = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default slog;

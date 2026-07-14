/**
 * S-Log2 — Sony's second-generation log curve, refining the original S-Log with a
 * scaling adjustment that captures more of the camera's dynamic range and improves
 * shadow reproduction. It shares the S-Gamut primaries with S-Log and S-Log3,
 * sitting between them chronologically and in capability, before Sony moved to
 * S-Log3 as its recommended acquisition curve. It still appears in workflows built
 * around older Sony camera firmware.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog2.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2012
 * @by Sony
 * @use Sony's second-generation cinema log curve (F5/F55 era); legacy, superseded by S-Log3.
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
// Same primaries/matrix as S-Gamut3 (see slog3.js). Wraps base S-Log with a 155/219
// scene scaling and the in-reflection (÷0.9) + legal-range code-value convention.
// 18% grey → 0.3395.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const slog2 = { name: 'slog2', range: [[0, 1], [0, 1], [0, 1]] };

// base S-Log (raw IRE) <-> linear, then 155/219 scaling + legal-range code value
const raw = t => t >= 0 ? 0.432699 * Math.log10(t + 0.037584) + 0.646596 : t * 5 + 0.030001222851889303;
const rawInv = y => y >= 0.030001222851889303 ? Math.pow(10, (y - 0.646596) / 0.432699) - 0.037584 : (y - 0.030001222851889303) / 5;
const enc = x => ((raw((x / 0.9) * 155 / 219)) * 876 + 64) / 1023;
const dec = cv => rawInv((cv * 1023 - 64) / 876) * 0.9 * 219 / 155;

// S-Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7064827132, 0.1288010498, 0.1151721641,
	0.2709796708, 0.7866064112, -0.0575860820,
	-0.0096778454, 0.0046000375, 1.0941355587
];
const MI = inv3(M);

slog2.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.slog2 = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default slog2;

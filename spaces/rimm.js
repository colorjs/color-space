/**
 * RIMM RGB — the scene-referred counterpart to Kodak's ProPhoto (ROMM) RGB, standardized in
 * ISO 22028-3. It keeps ProPhoto's very wide primaries and D50 white with a camera-style curve
 * that has headroom above diffuse white, so scene exposures that would otherwise clip survive
 * the pipeline until output-referred rendering.
 *
 * @see {@link https://www.iso.org/standard/58005.html} ISO 22028-3
 * @year 2000
 * @by Kodak
 * @use Unrendered imaging pipelines (ISO 22028-3); niche.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut prophoto
 * @illuminant D50
 * @observer 2
 * @referred scene
 * @dynamic sdr
 */
// Implementation notes:
// Matrix = ProPhoto (ROMM) primaries, Bradford-adapted D50->D65. OETF clips at
// E_clip = 2.0 (one stop above diffuse white), which encodes to ~0.713.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const rimm = { name: 'rimm', range: [[0, 1], [0, 1], [0, 1]] };

// ProPhoto (ROMM) primaries (D50) -> XYZ, Bradford-adapted to D65 (Y 0..1)
const M = [
	0.75556080, 0.11276679, 0.08212834,
	0.26831908, 0.71513042, 0.01655051,
	0.00391375, -0.01293165, 1.09807565
];
const MI = inv3(M);

// RIMM OETF: scene-linear exposure E in [0, E_clip] -> [0,1]
const Eclip = 2.0;
const Vclip = 1.099 * Math.pow(Eclip, 0.45) - 0.099; // 1.4023
const enc = (E) => E <= 0 ? 0 : E >= Eclip ? 1 : (E < 0.018 ? 4.5 * E : 1.099 * Math.pow(E, 0.45) - 0.099) / Vclip;
const dec = (Ep) => { const v = Ep * Vclip; return v < 0.081 ? v / 4.5 : Math.pow((v + 0.099) / 1.099, 1 / 0.45); };

rimm.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.rimm = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default rimm;

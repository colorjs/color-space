/**
 * V-Gamut – Panasonic's camera RGB primaries, introduced in 2014 with the VARICAM 35
 * and paired with the V-Log curve. Panasonic reached it by tuning the on-chip color
 * filters of the camera's Super 35 sensor and positioned it as a master-archive space,
 * converted to DCI-P3 or BT.709 in post. This is the scene-linear form, before V-Log,
 * with highlights above 1.0.
 *
 * @see {@link https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf}
 * @year 2014
 * @by Panasonic
 * @use Scene-linear gamut under V-Log for VFX and grading of Panasonic VARICAM and cinema footage.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut vgamut
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Panasonic "V-Log/V-Gamut Reference Manual" (2014-11-28) §4.1: primaries R(0.730,
// 0.280) G(0.165, 0.840) B(0.100, -0.030), white D65 (0.3127, 0.3290). M is their
// normalized primary matrix at full precision; §4.2 and colour-science 0.4.7
// RGB_COLOURSPACES['V-Gamut'] print it to 6 decimals (agree to 5e-7). MI = inv3(M).
// The single owner of this matrix: vlog.js composes its curve with these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const vgamut = {
	name: 'vgamut',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// V-Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6796444698784739, 0.1522114124397545, 0.1186000447334430,
	0.2606855500903736, 0.7748944633296593, -0.0355800134200329,
	-0.0093101982175133, -0.0046124670436289, 1.1029804160210204
];
const MI = inv3(M);

vgamut.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.vgamut = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default vgamut;

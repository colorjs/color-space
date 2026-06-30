/**
 * Panasonic V-Log / V-Gamut color space
 *
 * Panasonic's V-Log transfer over the V-Gamut primaries (VARICAM; not the V-Log L
 * variant). Per-channel V-Log curve to scene-linear, then V-Gamut→XYZ(D65).
 * Panasonic V-Log/V-Gamut Reference Manual (2014).
 *
 * @see {@link https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf}
 * @channel {R} 0 1 Red (V-Log encoded)
 * @channel {G} 0 1 Green (V-Log encoded)
 * @channel {B} 0 1 Blue (V-Log encoded)
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const vlog = {
	name: 'vlog',
	range: [[0, 1], [0, 1], [0, 1]]
};

const B = 0.00873, C = 0.241514, D = 0.598206;

// V-Log -> V-Gamut scene-linear (cut2 = 0.181 in the encoded domain)
const decode = (v) => v < 0.181
	? (v - 0.125) / 5.6
	: Math.pow(10, (v - D) / C) - B;

// V-Gamut scene-linear -> V-Log (cut1 = 0.01 in the linear domain)
const encode = (l) => l < 0.01
	? 5.6 * l + 0.125
	: C * Math.log10(l + B) + D;

// V-Gamut linear RGB -> XYZ (D65, Y 0..1)
// NPM recomputed full-precision from V-Gamut primaries R(.730,.280) G(.165,.840)
// B(.100,-.030) + D65 (matches Panasonic's published 6-decimal matrix, maps white exactly)
const M = [
	0.6796444698784739, 0.1522114124397545, 0.1186000447334430,
	0.2606855500903736, 0.7748944633296593, -0.0355800134200329,
	-0.0093101982175133, -0.0046124670436289, 1.1029804160210204
];
const MI = inv3(M);

vlog.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.vlog = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default vlog;

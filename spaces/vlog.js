/**
 * V-Log — Panasonic's log curve, introduced in 2014 with the VARICAM 35 cinema camera to hold
 * the sensor's full dynamic range for grading. It pairs with the wide V-Gamut primaries, built
 * to enclose spaces like Rec. 2020 with room to spare. Panasonic's mirrorless GH bodies use a
 * lighter variant, V-Log L, matched to a narrower 12-stop range.
 *
 * @see {@link https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2014
 * @by Panasonic
 * @use Panasonic VARICAM and cinema cameras, with V-Gamut.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut vgamut
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Panasonic V-Log/V-Gamut Reference Manual (2014). Gamut: V-Gamut, matrix in vgamut.js.
import xyz from './xyz.js';
import vgamut from './vgamut.js';

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

vlog.xyz = (r, g, b) => vgamut.xyz(decode(r), decode(g), decode(b));

xyz.vlog = (x, y, z) => {
	const [r, g, b] = xyz.vgamut(x, y, z);
	return [encode(r), encode(g), encode(b)];
};

export default vlog;

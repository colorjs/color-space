/**
 * ACES2065-1 — the Academy Color Encoding System's archival and interchange master
 * format, built on the AP0 primaries, wide enough to enclose the entire visible
 * gamut, with ACES's characteristic white point near D60. Like ACEScg it stores
 * scene-referred light linearly, with values reaching far past nominal white to hold
 * highlight detail for later grading or rendering. AMPAS designed it as the
 * long-term, camera-agnostic exchange format for finished ACES masters, distinct from
 * ACEScg's smaller AP1 primaries used for day-to-day rendering.
 *
 * @see {@link https://docs.acescentral.com/encodings/aces2065-1/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACES2065-1}
 * @year 2012
 * @by Academy (AMPAS)
 * @use Archival/interchange master encoding for finished ACES film and TV masters; current long-term storage format (SMPTE ST 2065-1).
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut ap0
 * @referred scene
 * @dynamic hdr
 */
import acescg from './acescg.js';
import { mat3 } from '../util.js';

const aces2065 = {
	name: 'aces2065-1',
	range: [[0, 1], [0, 1], [0, 1]]
};

// AP0 -> AP1 (ACES spec, same ACES white — no chromatic adaptation needed)
const M_AP0_AP1 = [
	1.4514393161, -0.2365107469, -0.2149285693,
	-0.0765537734, 1.1762296998, -0.0996759264,
	0.0083161484, -0.0060324498, 0.9977163014
];
// AP1 -> AP0
const M_AP1_AP0 = [
	0.6954522414, 0.1406786965, 0.1638690622,
	0.0447945634, 0.8596711185, 0.0955343182,
	-0.0055258826, 0.0040252103, 1.0015006723
];

aces2065.acescg = (r, g, b) => mat3(M_AP0_AP1, r, g, b);
acescg[aces2065.name] = (r, g, b) => mat3(M_AP1_AP0, r, g, b);

export default aces2065;

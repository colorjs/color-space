/**
 * ACES2065-1 color space (AP0 primaries)
 *
 * The ACES archival / interchange encoding: linear, AP0 primaries (which enclose
 * the entire visible gamut), ACES white (~D60). Connects to acescg (AP1) via the
 * published AP0↔AP1 matrix; everything else chains through there.
 *
 * @see {@link https://docs.acescentral.com/specifications/aces2065-1/}
 * @channel {R} 0 1 Red (linear; extends to 65504 half-float)
 * @channel {G} 0 1 Green (linear; extends to 65504 half-float)
 * @channel {B} 0 1 Blue (linear; extends to 65504 half-float)
 * @referred scene
 * @dynamic hdr
 */
import acescg from './acescg.js';
import { mat3 } from './util.js';

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

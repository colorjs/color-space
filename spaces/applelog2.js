/**
 * Apple Log 2 — Apple's second log encoding for iPhone video, specified in Apple's
 * September 2025 white paper. It keeps the Apple Log transfer function unchanged, a
 * log2 curve that rolls into a parabola near black to better hold negative noise
 * values, so 18% grey still lands at 0.4883. What changes is the gamut: instead of
 * the BT.2020 container Apple Log records into, Apple Log 2 encodes Apple Wide Gamut,
 * a D65 primary set Apple optimized for its camera sensors in scene-referred work.
 *
 * @see {@link https://github.com/aces-aswf/aces-input-and-colorspaces/blob/main/apple/CSC.Apple.AppleLog2_to_ACES.ctl}
 * @see {@link https://developer.apple.com/download/all/?q=Apple%20log%202}
 * @year 2025
 * @by Apple
 * @use Log capture on iPhone in Apple's own wide gamut for grading and VFX; Apple's current log encoding (white paper Sept 2025).
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
// Apple Log 2 White Paper (Sept 2025, part 028-00834 v1.1; developer-gated): the
// curve is Apple Log's, constants unchanged (see applelog.js); its table reads
// 0% → 0.150477, 18% → 0.488272, 90% → 0.681686, 1200% → 1.0. Apple Wide Gamut
// primaries R(0.725, 0.301) G(0.221, 0.814) B(0.068, -0.076), white D65 — the same
// in the ACES CSC (aces-input-and-colorspaces PR #20) and OCIO's AppleCameras.cpp.
// All three primaries lie outside the spectral locus, and BT.2020's green falls
// outside the gamut, so this is not a superset of Apple Log's container.
import xyz from './xyz.js';
import { enc, dec } from './applelog.js';
import { mat3, inv3 } from '../util.js';

const applelog2 = { name: 'applelog2', range: [[0, 1], [0, 1], [0, 1]] };

// Apple Wide Gamut linear RGB -> XYZ (D65, Y 0..1) — normalized primary matrix of
// the white paper's chromaticities
const M = [
	0.6514914801673072, 0.2215531132940402, 0.07741133359032426,
	0.2704812903867027, 0.81603725892013, -0.08651854930683298,
	-0.023363832392206848, -0.03508759712801534, 1.1475091802801007
];
const MI = inv3(M);

applelog2.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.applelog2 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default applelog2;

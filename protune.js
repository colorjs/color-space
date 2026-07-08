/**
 * Protune — GoPro's flat color profile for its Hero action camera line, designed to
 * minimize in-camera sharpening, saturation, and contrast so footage keeps more
 * headroom for color correction afterward. It applies a single natural-log curve
 * across the tonal range — simpler than the multi-segment curves cinema cameras
 * use — over the Protune Native primaries.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Protune.html}
 * @year 2012
 * @by GoPro
 * @use Flat log color profile for GoPro Hero action cameras; current, still used on modern Hero output.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// y = ln(x·112 + 1)/ln(113). 18% grey → 0.6456.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const protune = { name: 'protune', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => Math.log1p(x * 112) / Math.log(113);
const dec = y => (Math.pow(113, y) - 1) / 112;

// Protune Native linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.5022571888838522, 0.2929667107237154, 0.1552320274441038,
	0.1387997591578935, 0.9108414623976787, -0.0496412215555725,
	0.0780142594902075, -0.3148325109509678, 1.3258760022206386
];
const MI = inv3(M);

protune.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.protune = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default protune;

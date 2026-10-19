/**
 * Venice S-Gamut3 – S-Gamut3 as Sony's Venice cinema camera records it, under S-Log3. In 2020
 * Sony gave the Academy a separate Venice input transform, whose matrix to ACES differs from
 * the generic S-Gamut3 one (slog3) by up to 0.054 per coefficient. Sony prints only that
 * matrix; the primaries here are derived from it at a D65 white. Their triangle covers 8% more
 * xy area than generic S-Gamut3's without enclosing it.
 *
 * @see {@link https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3.ctl}
 * @see {@link https://colour.readthedocs.io/en/v0.4.7/generated/colour.models.RGB_COLOURSPACE_VENICE_S_GAMUT3.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2020
 * @by Sony
 * @use Footage from Sony's Venice camera recorded in S-Log3/S-Gamut3, through its own ACES input transform.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut sgamut3-venice
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Sony's IDT.Sony.Venice_SLog3_SGamut3.ctl (vendor-supplied, aces-dev v1.3): S-Log3 (slog3.js),
// then the 10-decimal "VENICE S-Gamut3 to AP0" matrix; it prints no primaries and no white.
// Primaries R(0.740464264304292, 0.279364374750660) G(0.089241145423286, 0.893809528608105)
// B(0.110488236673827, -0.052579333080476), white D65: colour-science 0.4.7, derived from that
// matrix; with CAT02 to the ACES white, Sony's IDT convention, they rebuild it to 1e-10. M is
// their normalized primary matrix as colour-science computes it. The hub adapts to ACES by
// Bradford, within 4.2e-3 of Sony's CAT02 matrix (test/aces-vendor.js measures both).
import xyz from './xyz.js';
import { enc, dec } from './slog3.js';
import { mat3, inv3 } from '../math.js';

const sgamut3venice = { name: 'sgamut3-venice', range: [[0, 1], [0, 1], [0, 1]] };

// Venice S-Gamut3 linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7442229872874919, 0.07790652183263243, 0.12832641793154728,
	0.28078247599697626, 0.7802857216190829, -0.06106819761605925,
	-0.019929292611017217, 0.014796572000041662, 1.094190471370854
];
const MI = inv3(M);

sgamut3venice.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz['sgamut3-venice'] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default sgamut3venice;

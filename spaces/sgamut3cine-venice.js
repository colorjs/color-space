/**
 * Venice S-Gamut3.Cine – S-Gamut3.Cine as Sony's Venice cinema camera records it, under
 * S-Log3. Its 2020 Academy input transform, a pair with Venice S-Gamut3's, carries a matrix to
 * ACES that differs from the generic S-Gamut3.Cine one (sgamut3cine) by up to 0.052 per
 * coefficient. Sony prints only that matrix; the primaries here are derived from it at a D65
 * white. Their triangle covers 7% more xy area than generic S-Gamut3.Cine's without enclosing it.
 *
 * @see {@link https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3Cine.ctl}
 * @see {@link https://colour.readthedocs.io/en/v0.4.7/generated/colour.models.RGB_COLOURSPACE_VENICE_S_GAMUT3_CINE.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2020
 * @by Sony
 * @use Footage from Sony's Venice camera recorded in S-Log3/S-Gamut3.Cine, through its own ACES input transform.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut sgamut3cine-venice
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Sony's IDT.Sony.Venice_SLog3_SGamut3Cine.ctl (vendor-supplied, aces-dev v1.3): S-Log3
// (slog3.js), then the 10-decimal "VENICE S-Gamut3.Cine To AP0" matrix; no primaries, no white.
// Primaries R(0.775901871567345, 0.274502392854799) G(0.188682902773355, 0.828684937020288)
// B(0.101337382499301, -0.089187517306263), white D65: colour-science 0.4.7, derived from that
// matrix; with CAT02 to the ACES white they rebuild it to 3e-11. M is their normalized primary
// matrix as colour-science computes it. The hub adapts to ACES by Bradford, within 4.6e-3 of
// Sony's CAT02 matrix (test/aces-vendor.js measures both).
import xyz from './xyz.js';
import { enc, dec } from './slog3.js';
import { mat3, inv3 } from '../math.js';

const sgamut3cinevenice = { name: 'sgamut3cine-venice', range: [[0, 1], [0, 1], [0, 1]] };

// Venice S-Gamut3.Cine linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6322608372499656, 0.20037000819568965, 0.11782508160601625,
	0.22368435892918212, 0.8800140615912109, -0.10369842052039296,
	-0.04107303203192153, -0.018443611745648313, 1.1485743945374483
];
const MI = inv3(M);

sgamut3cinevenice.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz['sgamut3cine-venice'] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default sgamut3cinevenice;

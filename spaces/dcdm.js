/**
 * DCDM — the Digital Cinema Distribution Master encoding inside every DCP (Digital Cinema
 * Package) shipped to theatres, standardized by SMPTE under the DCI specification. It encodes
 * CIE XYZ directly with a 2.6 power-law gamma rather than an RGB transfer curve, tying
 * relative white to the DCI reference projector's calibrated luminance. It is display-referred
 * and deliverable-only: mastering into DCDM is the last step before packaging.
 *
 * @see {@link https://ieeexplore.ieee.org/document/7290729} SMPTE ST 428-1
 * @year 2006
 * @by SMPTE/DCI
 * @use Theatrical DCP mastering, where it is mandatory (SMPTE ST 428-1).
 * @channel {X} 0 1 X′
 * @channel {Y} 0 1 Y′
 * @channel {Z} 0 1 Z′
 * @method transfer
 * @encoding gamma
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// X′ = (X/52.37)^(1/2.6) (SMPTE ST 428-1). SMPTE ST 431-1 reference projector white:
// relative Y=100 ≡ 48 cd/m², so D65 white → ≈[0.948, 0.967, 0.976]. Negative XYZ
// clamps to 0.
import xyz from './xyz.js';

const dcdm = { name: 'dcdm', range: [[0, 1], [0, 1], [0, 1]] };

const k = 48 / 52.37 / 100; // relative XYZ (0-100) -> absolute/52.37, white at 48 cd/m²
const enc = v => Math.pow(Math.max(0, v * k), 1 / 2.6);
const dec = v => Math.pow(Math.max(0, v), 2.6) / k;

xyz.dcdm = (x, y, z) => [enc(x), enc(y), enc(z)];
dcdm.xyz = (x, y, z) => [dec(x), dec(y), dec(z)];

export default dcdm;

/**
 * DCDM X′Y′Z′ color space
 *
 * The Digital Cinema Distribution Master encoding inside every DCP: gamma-2.6-encoded
 * CIE XYZ, X′ = (X/52.37)^(1/2.6) (SMPTE ST 428-1), with the SMPTE ST 431-1 reference
 * projector white — relative Y=100 ≡ 48 cd/m² — baked in, so D65 white → ≈[0.948,
 * 0.967, 0.976]. Negative XYZ clamps to 0.
 *
 * @see {@link https://ieeexplore.ieee.org/document/7290729} SMPTE ST 428-1
 * @channel {X} 0 1 X′
 * @channel {Y} 0 1 Y′
 * @channel {Z} 0 1 Z′
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

const dcdm = { name: 'dcdm', range: [[0, 1], [0, 1], [0, 1]] };

const k = 48 / 52.37 / 100; // relative XYZ (0-100) -> absolute/52.37, white at 48 cd/m²
const enc = v => Math.pow(Math.max(0, v * k), 1 / 2.6);
const dec = v => Math.pow(Math.max(0, v), 2.6) / k;

xyz.dcdm = (x, y, z) => [enc(x), enc(y), enc(z)];
dcdm.xyz = (x, y, z) => [dec(x), dec(y), dec(z)];

export default dcdm;

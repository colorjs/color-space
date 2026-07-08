/**
 * ICaCb — an HDR opponent space designed by Fröhlich in 2017, built in the same mold as
 * ICtCp but re-optimized for just-noticeable-difference uniformity and straighter hue
 * lines. XYZ passes through a dedicated cone matrix and the PQ (ST 2084) non-linearity
 * before the opponent mix, giving I as intensity and Ca/Cb as red-green and yellow-blue
 * chroma.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/icacb.py}
 * @year 2017
 * @by Julian Fröhlich
 * @use HDR/wide-gamut opponent space re-optimized for JND uniformity versus ICtCp; research use, not broadly adopted industrially.
 * @channel {I} 0 1 Intensity
 * @channel {Ca} -0.5 0.5 Red-Green
 * @channel {Cb} -0.5 0.5 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Media white is 203 cd/m² (Yw) — the same absolute scaling as ictcp.js and jzazbz.js
// (ITU-R BT.2100/BT.2408 reference white), so SDR white lands at I ≈ 0.58 like ICtCp
// instead of deep in the PQ toe. colour-science's XYZ_to_ICaCb feeds relative XYZ
// straight into PQ (1 unit = 1 cd/m²) and differs by exactly that scaling.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { pqST2084Encode, pqST2084Decode } from './transfers.js';

const icacb = { name: 'icacb', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

const M1 = [0.37613, 0.70431, -0.05675, -0.21649, 1.14744, 0.05356, 0.02567, 0.16713, 0.74235];
const M1i = inv3(M1);
const M2 = [0.4949, 0.5037, 0.0015, 4.2854, -4.5462, 0.2609, 0.3605, 1.1499, -1.5105];
const M2i = inv3(M2);

const Yw = 203; // absolute luminance of media white, cd/m² — same as jzazbz.js/ictcp.js

xyz.icacb = (X, Y, Z) => mat3(M2, ...mat3(M1, X / 100 * Yw, Y / 100 * Yw, Z / 100 * Yw).map(pqST2084Encode));
icacb.xyz = (I, a, b) => mat3(M1i, ...mat3(M2i, I, a, b).map(pqST2084Decode)).map(v => v / Yw * 100);

export default icacb;

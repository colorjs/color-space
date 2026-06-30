/**
 * ICaCb color space
 *
 * Fröhlich (2017) HDR opponent space: an ICtCp-style encoding tuned for JND
 * uniformity and hue linearity, using a different XYZ→LMS matrix and a PQ (ST 2084)
 * non-linearity before the opponent mix. I = intensity, Ca/Cb = chroma.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/icacb.py}
 * @channel {I} 0 1 Intensity
 * @channel {Ca} -0.5 0.5 Red-Green
 * @channel {Cb} -0.5 0.5 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { pqST2084Encode, pqST2084Decode } from './transfers.js';

const icacb = { name: 'icacb', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

const M1 = [0.37613, 0.70431, -0.05675, -0.21649, 1.14744, 0.05356, 0.02567, 0.16713, 0.74235];
const M1i = inv3(M1);
const M2 = [0.4949, 0.5037, 0.0015, 4.2854, -4.5462, 0.2609, 0.3605, 1.1499, -1.5105];
const M2i = inv3(M2);

xyz.icacb = (X, Y, Z) => mat3(M2, ...mat3(M1, X / 100, Y / 100, Z / 100).map(pqST2084Encode));
icacb.xyz = (I, a, b) => mat3(M1i, ...mat3(M2i, I, a, b).map(pqST2084Decode)).map(v => v * 100);

export default icacb;

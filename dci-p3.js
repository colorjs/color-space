/**
 * DCI-P3 (theatrical) color space
 *
 * Digital-cinema P3: the P3 primaries with the DCI white point (x 0.314, y 0.351)
 * and a pure gamma-2.6 curve (SMPTE RP 431-2). Distinct from display-p3 (repo `p3`,
 * which is D65 + sRGB curve). The DCI→D65 Bradford adaptation is baked into the matrix.
 *
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant DCI (adapted to D65)
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const dciP3 = {
	name: 'dci-p3',
	range: [[0, 1], [0, 1], [0, 1]]
};

// signed power (pure gamma 2.6, no linear segment) — SMPTE RP 431-2
const spow = (v, e) => v < 0 ? -Math.pow(-v, e) : Math.pow(v, e);

// DCI-P3 linear (DCI white, Bradford-adapted to D65) -> XYZ (D65, Y 0..1)
const M = [
	0.459251654991986669, 0.295791787505722437, 0.195412484553962068,
	0.215150512464308469, 0.709133636649875609, 0.0757158508858156443,
	0.000272005543731242562, 0.0469395140885821294, 1.04184623112756491
];
const MI = inv3(M);

dciP3.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, spow(r, 2.6), spow(g, 2.6), spow(b, 2.6));
	return [x * 100, y * 100, z * 100];
};

xyz[dciP3.name] = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [spow(r, 1 / 2.6), spow(g, 1 / 2.6), spow(b, 1 / 2.6)];
};

export default dciP3;

/**
 * IzAzBz — the opponent-color stage inside Safdar et al.'s 2017 derivation of Jzazbz,
 * taken before the final hyperbolic lightness compression that turns Iz into Jz. Iz is
 * the raw, uncompressed achromatic response from the PQ-encoded LMS signal, while az and
 * bz carry the same red-green and yellow-blue chroma as Jzazbz. It went on to become the
 * structural foundation of the ZCAM color appearance model.
 *
 * @see {@link https://doi.org/10.1364/OE.25.015131} Safdar et al. 2017
 * @year 2017
 * @by Safdar et al.
 * @use Intermediate opponent stage of the Jzazbz HDR derivation; research/internal use, foundation of the ZCAM appearance model.
 * @channel {Iz} 0 1 Achromatic
 * @channel {az} -0.5 0.5 Red-Green
 * @channel {bz} -0.5 0.5 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// Media white is 203 cd/m² (Yw), the same absolute scaling as jzazbz and colorjs.io, so
// az/bz here equal jzazbz's az/bz exactly. colour-science's XYZ_to_Izazbz instead feeds
// relative XYZ straight into the PQ (1 cd/m² white), so its values differ by that
// scaling. Ranges follow jzazbz: the [0,1] Iz spans up to the 10 000 cd/m² PQ peak (SDR
// white lands at Iz ≈ 0.394).
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const izazbz = { name: 'izazbz', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

// Jzazbz/Safdar perceptual quantizer (modified ST 2084, m2 = 1.7·2523/32)
const m1 = 2610 / 16384, m2 = 1.7 * 2523 / 32, c1 = 3424 / 4096, c2 = 2413 / 128, c3 = 2392 / 128;
const pqE = L => { const v = Math.pow(Math.max(L, 0) / 10000, m1); return Math.pow((c1 + c2 * v) / (1 + c3 * v), m2); };
const pqD = V => { const vp = Math.pow(Math.max(V, 0), 1 / m2); return Math.pow(Math.max(vp - c1, 0) / (c2 - c3 * vp), 1 / m1) * 10000; };

const M_XL = [0.41478972, 0.579999, 0.0146480, -0.2015100, 1.120649, 0.0531008, -0.0166008, 0.264800, 0.6684799];
const M_XLi = inv3(M_XL);
const M_LI = [0.5, 0.5, 0, 3.524, -4.066708, 0.542708, 0.199076, 1.096799, -1.295875]; // Safdar 2017
const M_LIi = inv3(M_LI);
const b = 1.15, g = 0.66;
const Yw = 203; // absolute luminance of media white, cd/m² — same as jzazbz.js

xyz.izazbz = (X, Y, Z) => {
	X = X / 100 * Yw; Y = Y / 100 * Yw; Z = Z / 100 * Yw;
	const lmsp = mat3(M_XL, b * X - (b - 1) * Z, g * Y - (g - 1) * X, Z).map(pqE);
	return mat3(M_LI, ...lmsp);
};

izazbz.xyz = (Iz, az, bz) => {
	const lms = mat3(M_LIi, Iz, az, bz).map(pqD);
	const [Xp, Yp, Z] = mat3(M_XLi, ...lms);
	const X = (Xp + (b - 1) * Z) / b;
	return [X / Yw * 100, (Yp + (g - 1) * X) / g / Yw * 100, Z / Yw * 100];
};

export default izazbz;

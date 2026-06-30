/**
 * RED Log3G10 / REDWideGamutRGB color space
 *
 * RED's Log3G10 (v3) transfer over the REDWideGamutRGB primaries. Per-channel
 * Log3G10 curve to scene-linear, then RWG→XYZ(D65). RED whitepaper 915-0187 Rev-C.
 *
 * @channel {R} 0 1 Red (Log3G10 encoded)
 * @channel {G} 0 1 Green (Log3G10 encoded)
 * @channel {B} 0 1 Blue (Log3G10 encoded)
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const log3g10 = {
	name: 'log3g10',
	range: [[0, 1], [0, 1], [0, 1]]
};

// Log3G10 v3 constants (RED whitepaper 915-0187 Rev-C)
const A = 0.224282;     // log scale
const Bm = 155.975327;  // linear stretch
const off = 0.01;       // black offset
const slope = 15.1927;  // sub-zero linear slope (= A*Bm/ln10, C1-continuous at 0)

// Log3G10 -> RWG scene-linear
const decode = (v) => v >= 0
	? (Math.pow(10, v / A) - 1) / Bm - off
	: v / slope - off;

// RWG scene-linear -> Log3G10
const encode = (l) => {
	const x = l + off;
	return x < 0 ? x * slope : A * Math.log10(x * Bm + 1);
};

// REDWideGamutRGB linear RGB -> XYZ (D65, Y 0..1)
// NPM recomputed full-precision from RWG primaries R(.780308,.304253)
// G(.121595,1.493994) B(.095612,-.084589) + D65 (matches RED's published 6-decimal matrix)
const M = [
	0.7352752459058587, 0.0686094106139610, 0.1465712705318520,
	0.2866940994999349, 0.8429791340169754, -0.1296732335169103,
	-0.0796808568783677, -0.3473432169944297, 1.5160818246326759
];
const MI = inv3(M);

log3g10.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.log3g10 = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default log3g10;

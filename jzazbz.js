/**
 * JzAzBz color space
 *
 * High dynamic range color space based on PQ (Perceptual Quantizer)
 * Used for HDR content and next-generation color imaging
 *
 * @see {@link https://doi.org/10.1364/OE.25.015131}
 * @channel {Jz} 0 100 Lightness
 * @channel {az} -50 50 Green-Red axis
 * @channel {bz} -50 50 Blue-Yellow axis
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { spow } from './util.js';

const jzazbz = {
	name: 'jzazbz'
};

const b_param = 1.15;
const g_param = 0.66;
const d = -0.56;
const d0 = 1.6295499532821566e-11;
const Yw = 203; // absolute luminance of media white in cd/m^2

// JzAzBz's modified ST 2084 PQ constants (Safdar 2017: exponent p = 1.7·m2, not m2)
const n_val = 2610 / 16384;
const ninv = 16384 / 2610;
const c1 = 3424 / 4096;
const c2 = 2413 / 128; // 2413 / 2^7
const c3 = 2392 / 128; // 2392 / 2^7
const p = 1.7 * 2523 / 32; // (1.7 * 2523) / 2^5
const pinv = 32 / (1.7 * 2523);

/**
 * Matrix multiplication
 */
function mm(v, m) {
	return [
		v[0] * m[0][0] + v[1] * m[0][1] + v[2] * m[0][2],
		v[0] * m[1][0] + v[1] * m[1][1] + v[2] * m[1][2],
		v[0] * m[2][0] + v[1] * m[2][1] + v[2] * m[2][2]
	];
}

// Matrices
const XYZtoCone_M = [
    [  0.41478972, 0.579999,  0.0146480 ],
    [ -0.2015100,  1.120649,  0.0531008 ],
    [ -0.0166008,  0.264800,  0.6684799 ],
];

const ConetoXYZ_M = [
    [  1.9242264357876067,  -1.0047923125953657,  0.037651404030618   ],
    [  0.35031676209499907,  0.7264811939316552, -0.06538442294808501 ],
    [ -0.09098281098284752, -0.3127282905230739,  1.5227665613052603  ],
];

const ConetoIab_M = [
    [  0.5,       0.5,       0        ],
    [  3.524000, -4.066708,  0.542708 ],
    [  0.199076,  1.096799, -1.295875 ],
];

const IabtoCone_M = [
    [ 1,                   0.13860504327153927,   0.05804731615611883 ],
    [ 1,                  -0.1386050432715393,   -0.058047316156118904 ],
    [ 1,                  -0.09601924202631895,  -0.81189189605603900  ],
];


// XYZ -> Jzazbz
xyz.jzazbz = function(x, y, z) {
    // XYZ in 0-100 range, normalize to 0-1 for computation
    x = x / 100;
    y = y / 100;
    z = z / 100;

    // 1. Scale to absolute luminance
    let Xa = x * Yw;
    let Ya = y * Yw;
    let Za = z * Yw;

    // 2. Modify X, Y
    let Xm = b_param * Xa - (b_param - 1) * Za;
    let Ym = g_param * Ya - (g_param - 1) * Xa;

    // 3. XYZ -> LMS
    // Note: implementation in reference does matrix multiply of [Xm, Ym, Za] with XYZtoCone
    let LMS = mm([Xm, Ym, Za], XYZtoCone_M);

    // 4. PQ encode LMS
    let PQLMS = LMS.map(val => {
        // map value / 10000
        let v = val / 10000;
        let num = c1 + c2 * spow(v, n_val);
        let denom = 1 + c3 * spow(v, n_val);
        return spow(num / denom, p);
    });

    // 5. PQLMS -> Iab (Iz, az, bz)
    let [Iz, az, bz] = mm(PQLMS, ConetoIab_M);

    // 6. Iz -> Jz
    let Jz = ((1 + d) * Iz) / (1 + d * Iz) - d0;

    // Scale to conventional ranges
    return [Jz * 100, az * 100, bz * 100];
};

// Jzazbz -> XYZ
jzazbz.xyz = function(Jz, az, bz) {
    // Normalize from conventional ranges
    Jz = Jz / 100;
    az = az / 100;
    bz = bz / 100;

    // 1. Jz -> Iz
    let Iz = (Jz + d0) / (1 + d - d * (Jz + d0));

    // 2. Iab -> PQLMS
    let PQLMS = mm([Iz, az, bz], IabtoCone_M);

    // 3. PQLMS -> LMS (Linear)
    let LMS = PQLMS.map(val => {
        let num = c1 - spow(val, pinv);
        let denom = c3 * spow(val, pinv) - c2;
        let x = spow(num / denom, ninv);
        return x * 10000;
    });

    // 4. LMS -> XYZ modified
    let [Xm, Ym, Za] = mm(LMS, ConetoXYZ_M);

    // 5. Un-modify X, Y
    let Xa = (Xm + (b_param - 1) * Za) / b_param;
    let Ya = (Ym + (g_param - 1) * Xa) / g_param;

    // 6. Abs XYZ -> Rel XYZ (scale to 0-100)
    return [Xa / Yw * 100, Ya / Yw * 100, Za / Yw * 100];
};

export default jzazbz;

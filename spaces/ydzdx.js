/**
 * Y′D′zD′x is the luma and color-difference form of PQ-encoded CIE XYZ, standardized by SMPTE
 * as ST 2085 in 2015 and listed in ITU-T H.273 as matrix coefficients 11. Absolute X, Y, Z are
 * each encoded with the SMPTE ST 2084 (PQ) inverse EOTF; Y′ passes through and D′z, D′x are
 * weighted differences of Z′ and X′ against Y′, tuned so D65 at 500 cd/m² has zero color
 * difference.
 *
 * @see {@link https://doi.org/10.5594/SMPTE.ST2085.2015} SMPTE ST 2085:2015
 * @year 2015
 * @by SMPTE
 * @use HDR masters; niche, non-broadcast.
 * @channel {Y} 0 1 Y′, PQ-encoded luminance
 * @channel {Dz} -0.5 0.5 D′z, Z′ − Y′ difference
 * @channel {Dx} -0.5 0.5 D′x, X′ − Y′ difference
 * @method luma-chroma
 * @encoding pq
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// SMPTE ST 2085:2015 §4-5 (https://pub.smpte.org/latest/st2085/st2085-2015.pdf):
// D′z = (c1·Z′ − Y′)/2, D′x = (X′ − c2·Y′)/2, c1 = 0.986566, c2 = 0.991902; inverse
// X′ = 2D′x + c2·Y′, Z′ = (2D′z + Y′)/c1; ranges Y′ 0-1, D′z/D′x -0.5..0.5. The same equations
// and constants appear in ITU-T H.273 (07/2024) eq. 76-78 (D′z in the Cb slot, D′x in Cr) and
// in the JCT-VC HDRTools reference software, ColorSpaceMatrix.H FWD_TRANSFORM[19]
// (gitlab.com/standards/HDRTools @ 432c8915). X′Y′Z′ = ST 2084 inverse EOTF of absolute XYZ in
// cd/m² (ST 2085 Introduction, Annex B), so the edge starts from xyz-abs-d65: the hub's Y = 100
// sits at 203 cd/m² (BT.2100 HDR reference white). c1, c2 make D65 neutral only at 500 cd/m²
// (Annex B); D65 at 203 cd/m² gives D′z = 5.1e-4, D′x = −3.0e-4.
import xyzAbsD65 from './xyz-abs-d65.js';
import { pqST2084Encode as pq, pqST2084Decode as ipq } from '../transfers.js';

const ydzdx = { name: 'ydzdx', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

const c1 = 0.986566, c2 = 0.991902;

xyzAbsD65.ydzdx = (X, Y, Z) => {
	const x = pq(X), y = pq(Y), z = pq(Z);
	return [y, (c1 * z - y) / 2, (x - c2 * y) / 2];
};

ydzdx['xyz-abs-d65'] = (y, dz, dx) => [ipq(2 * dx + c2 * y), ipq(y), ipq((2 * dz + y) / c1)];

export default ydzdx;

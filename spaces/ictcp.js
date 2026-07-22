/**
 * ICtCp — Dolby's HDR opponent space, standardized in ITU-R BT.2100 for HDR
 * television. Intensity rides the PQ curve while Ct and Cp carry blue-yellow and
 * red-green chroma, keeping hue stable under big luminance changes — the space HDR
 * colorists grade in and the basis of the ΔE-ITP difference metric.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @wiki {@link https://en.wikipedia.org/wiki/ICtCp}
 * @year 2016
 * @by Dolby (BT.2100)
 * @use HDR television color grading and the dE-ITP difference metric; current ITU-R BT.2100 standard for HDR broadcast/streaming.
 * @channel {I} 0 1 Intensity
 * @channel {Ct} -0.5 0.5 Tritan chroma
 * @channel {Cp} -0.5 0.5 Protanopia chroma
 * @method opponent
 * @encoding pq
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3 } from '../util.js';
import { pqST2084Encode, pqST2084Decode } from '../transfers.js';

const ictcp = {
	name: 'ictcp',
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};

const Yw = 203; // nits

const M_XYZ_LMS = [
	0.3592832590121217, 0.6976051147779502, -0.0358915932320290,
	-0.1920808463704993, 1.1004767970374321, 0.0753748658519118,
	0.0070797844607479, 0.0748396662186362, 0.8433265453898765
];

const M_LMS_XYZ = [
	2.0701522183894223, -1.3263473389671563, 0.2066510476294053,
	0.3647385209748072, 0.6805660249472273, -0.0453045459220347,
	-0.0497472075358123, -0.0492609666966131, 1.1880659249923042
];

const M_LMS_IPT = [
	2048 / 4096, 2048 / 4096, 0,
	6610 / 4096, -13613 / 4096, 7003 / 4096,
	17933 / 4096, -17390 / 4096, -543 / 4096
];

const M_IPT_LMS = [
	1.0, 0.0086090370379328, 0.1110296250030260,
	1.0, -0.0086090370379328, -0.1110296250030259,
	1.0, 0.5600313357106791, -0.3206271749873188
];

// LMS (absolute nits) -> ICtCp: PQ-encode each cone, then the LMS->IPT matrix
function LMStoICtCp(l, m, s) {
	const [pl, pm, ps] = [l, m, s].map(pqST2084Encode);
	return mat3(M_LMS_IPT, pl, pm, ps);
}

// ICtCp -> LMS (absolute nits): IPT->LMS matrix, then PQ-decode each cone
function ICtCptoLMS(i, ct, cp) {
	return mat3(M_IPT_LMS, i, ct, cp).map(pqST2084Decode);
}

xyz.ictcp = (x, y, z) => {
	// XYZ in 0-100 range, normalize to 0-1 for computation
	x = x / 100;
	y = y / 100;
	z = z / 100;

	// XYZ Relative -> XYZ Abs
	const xa = x * Yw;
	const ya = y * Yw;
	const za = z * Yw;
	// XYZ Abs -> LMS Abs
	const [l, m, s] = mat3(M_XYZ_LMS, xa, ya, za);
	// LMS Abs -> ICtCp (native: I 0-1, Ct/Cp ±0.5 — matches colorjs.io / BT.2100)
	const [i, ct, cp] = LMStoICtCp(l, m, s);
	return [i, ct, cp];
}

ictcp.xyz = (i, ct, cp) => {
	// Input: native ICtCp (I 0-1, Ct/Cp ±0.5)
	// ICtCp -> LMS Abs
	const [l, m, s] = ICtCptoLMS(i, ct, cp);
	// LMS Abs -> XYZ Abs
	const [xa, ya, za] = mat3(M_LMS_XYZ, l, m, s);
	// XYZ Abs -> XYZ Relative (scale to 0-100)
	return [xa / Yw * 100, ya / Yw * 100, za / Yw * 100];
}

export default ictcp;

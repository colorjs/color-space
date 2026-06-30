/**
 * Standard opto-electronic transfer functions (gamma / OETF-EOTF curves), shared
 * by the RGB working spaces that encode with the same curve. Each is sign-extended
 * (odd-symmetric) so out-of-gamut negatives survive a round-trip. The matrices and
 * primaries stay in the per-space files; only the 1-D transfer lives here.
 */

const sgn = (v) => (v < 0 ? -1 : 1);

/**
 * sRGB / IEC 61966-2-1 (also used by Display-P3). Linear ⇄ encoded.
 * @see {@link https://www.w3.org/TR/css-color-4/#valdef-color-srgb}
 */
export const srgbToLinear = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a > 0.04045 ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92);
};
export const linearToSrgb = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a > 0.0031308 ? 1.055 * Math.pow(a, 1 / 2.4) - 0.055 : a * 12.92);
};

/**
 * ITU-R BT.709 / BT.601 OETF (4-significant-figure constants). Linear ⇄ signal.
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 */
export const bt709Encode = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a < 0.018 ? 4.5 * a : 1.099 * Math.pow(a, 0.45) - 0.099);
};
export const bt709Decode = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a < 0.081 ? a / 4.5 : Math.pow((a + 0.099) / 1.099, 1 / 0.45));
};

/**
 * ITU-R BT.2020 OETF (Table 4, full-precision constants). Linear ⇄ signal.
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 */
const A2020 = 1.09929682680944;
const B2020 = 0.018053968510807;
export const bt2020Encode = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a < B2020 ? 4.5 * a : A2020 * Math.pow(a, 0.45) - (A2020 - 1));
};
export const bt2020Decode = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a < B2020 * 4.5 ? a / 4.5 : Math.pow((a + (A2020 - 1)) / A2020, 1 / 0.45));
};

/**
 * SMPTE ST 2084 (PQ). `encode` maps absolute linear nits → PQ signal; `decode`
 * the reverse. Callers that work in relative light scale by the reference white
 * (e.g. ×203 nits) at the call site.
 * @see {@link https://ieeexplore.ieee.org/document/7291452}
 */
const PQ_M1 = 2610 / 16384, PQ_M2 = 2523 / 32;
const PQ_C1 = 3424 / 4096, PQ_C2 = 2413 / 128, PQ_C3 = 2392 / 128;
export const pqST2084Encode = (absNits) => {
	const v = Math.pow(Math.max(absNits / 10000, 0), PQ_M1);
	return Math.pow((PQ_C1 + PQ_C2 * v) / (1 + PQ_C3 * v), PQ_M2);
};
export const pqST2084Decode = (signal) => {
	const vp = Math.pow(signal, 1 / PQ_M2);
	return 10000 * Math.pow(Math.max(vp - PQ_C1, 0) / (PQ_C2 - PQ_C3 * vp), 1 / PQ_M1);
};

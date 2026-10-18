/**
 * LogLuv is Greg Ward Larson's high-dynamic-range pixel encoding, developed at Silicon
 * Graphics and published in 1998 as the SGILOG codec of LibTIFF. It stores luminance as a
 * base-2 logarithm and chromaticity as CIE 1976 u′v′, so 32 bits cover 38 orders of
 * magnitude in 0.27% luminance steps and the whole visible gamut. Here it is the
 * continuous conversion behind the 32-bit format: Le = 256·(log2 Y + 64), ue = 410·u′,
 * ve = 410·v′, whose integer parts are the stored codes.
 *
 * @see {@link https://doi.org/10.1080/10867651.1998.10487485} Larson 1998, J. Graphics Tools 3(1):15-31
 * @year 1998
 * @by Larson (SGI)
 * @use HDR image storage in TIFF (SGILOG compression, 32-bit LogLuv); legacy, still read and written by LibTIFF.
 * @aka LogLuv TIFF; TIFF
 * @channel {Le} 12288 17408 Log luminance, 256·log₂Y + 16384
 * @channel {ue} 0 255 u′ chromaticity × 410
 * @channel {ve} 0 255 v′ chromaticity × 410
 * @method chromaticity
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Larson 1998 eq. 1a/1b, 2a-2d (author copy: http://www.anyhere.com/gward/papers/jgtpap1.pdf);
// LibTIFF libtiff/tif_luv.c (gitlab.com/libtiff/libtiff @ f59876694fc2), LogL16fromY (l.803-814),
// LogL16toY (l.789-798), LogLuv32fromXYZ (l.1298-1330), LogLuv32toXYZ (l.1273-1293):
//   code Le = trunc(256·(log2 Y + 64)), decode Y = 2^((Le + 0.5)/256 − 64); Le = 0 is exactly 0
//   code ue = trunc(410·u′), ve = trunc(410·v′) with u′ = 4X/(X + 15Y + 3Z), v′ = 9Y/(…);
//   decode u′ = (ue + 0.5)/410, v′ = (ve + 0.5)/410.
// The channels here are the unrounded values, so the pair is exact: LibTIFF's code is
// floor(channel) and its decode equals this decode at code + 0.5 (no @loss, as rgb 0-255 is
// not rounded either). Y scale: LibTIFF stores relative "sample" values where 1.0 displays
// at the output device's maximum, and absolute cd/m² = Y × TIFFTAG_STONITS, a per-file tag
// (tif_luv.c l.46-49; Larson 1998 §3 and §4.2). So the hub's Y = 100 maps to Y = 1 (Le = 16384);
// STONITS is not modeled. XYZ is stored as given (D65 here); LibTIFF records the white in
// TIFFTAG_WHITEPOINT rather than adapting. Black and degenerate chromaticities (X + 15Y + 3Z
// <= 0) take LibTIFF's U_NEU/V_NEU, the equal-energy point (4/19, 9/19), printed in tif_luv.c
// (l.752-753) as 0.210526316/0.473684211. Negative Y encodes as Le = 0: LibTIFF keeps a sign
// bit, but LogLuv32toXYZ (l.1278-1282) decodes L <= 0 as black. LibTIFF also clamps ue/ve
// codes to 0-255 and Le below 2^-64 to 0; only the latter is applied here.
// Range: Le 12288-17408 is 16 stops below to 4 stops above reference white, the working
// window of a camera log; the 15-bit code itself spans 0-32767 (2^±64), which every
// conversion still accepts.
import xyz from './xyz.js';

const logluv = { name: 'logluv', range: [[12288, 17408], [0, 255], [0, 255]] };

const UN = 4 / 19, VN = 9 / 19;

xyz.logluv = (X, Y, Z) => {
	const Le = Y > 0 ? Math.max(0, 256 * (Math.log2(Y / 100) + 64)) : 0;
	const s = X + 15 * Y + 3 * Z;
	if (Le === 0 || s <= 0) return [Le, 410 * UN, 410 * VN];
	return [Le, 410 * 4 * X / s, 410 * 9 * Y / s];
};

logluv.xyz = (Le, ue, ve) => {
	if (Le <= 0 || ve <= 0) return [0, 0, 0];
	const Y = 100 * Math.pow(2, Le / 256 - 64), u = ue / 410, v = ve / 410;
	return [Y * 9 * u / (4 * v), Y, Y * (12 - 3 * u - 20 * v) / (4 * v)];
};

export default logluv;

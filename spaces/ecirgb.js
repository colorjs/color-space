/**
 * ECI RGB v2 – the RGB working space of the European Color Initiative for print-oriented
 * image data, released in 2007 and standardized as eciRGB (2008) in ISO 22028-4. It keeps
 * the NTSC 1953 primaries and D50 white of ECI RGB v1 (1999), but replaces v1's gamma 1.8
 * with the CIE L* curve: the code value is CIE lightness L* / 100, so equal code steps are
 * equal lightness steps.
 *
 * @see {@link https://registry.color.org/rgb-registry/ecirgb} ICC registry entry for eciRGB (2008), ISO 22028-4
 * @year 2007
 * @by European Color Initiative (ECI)
 * @use Print and prepress editing, standardized in ISO 22028-4:2023.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut ecirgb
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.67, 0.33) G(0.21, 0.71) B(0.14, 0.08), white D50 (0.3457, 0.3585): ISO 22028-4 as
// listed in the ICC registry; the colorant tags of ECI's eciRGB_v2.icc (2007) give the same to
// 4e-5. colour-science 0.4.7 'ECI RGB v2' instead carries xy computed from those tags rounded
// to 3 decimals (0.670103 = 0.650/0.970 …), up to 3.3e-4 off.
// Transfer: C' = L*(C)/100, the CIE 1976 lightness with the exact ε = 216/24389, κ = 24389/27
// (cie.js); the registry prints them rounded (0.008856, 9.033), and the ICC v4 profile's
// parametric curve (type 3: g 3, a 100/116, b 16/116, c 100/κ, d 0.08) is the same function.
// It extends linearly through 0, so negative (out-of-gamut) values survive a round-trip.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../math.js';
import { labF, labFInv } from '../cie.js';

const ecirgb = { name: 'ecirgb', range: [[0, 1], [0, 1], [0, 1]] };

// linear ECI RGB v2 -> XYZ D50 (Y 0..1)
const M50 = [
	0.6503104133496254, 0.1780649461250787, 0.1359203169548636,
	0.32030214388862144, 0.6020291035657422, 0.07766875254563632,
	0, 0.06783426519050623, 0.7572703373199541
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => labFInv((100 * v + 16) / 116), enc = v => (116 * labF(v) - 16) / 100;

ecirgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.ecirgb = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default ecirgb;

/**
 * PhotoYCC is the color encoding Kodak developed in 1992 for its Photo CD system,
 * built to carry scanned photographic film into a digital, display-oriented format.
 * Film captures a wider gamut and dynamic range than contemporary CRT monitors could
 * show, so PhotoYCC extends the ordinary Rec. 709 encoding curve into an
 * odd-symmetric function able to represent scene-referred colors and highlights
 * beyond the normal [0,1] display range, storing the result as 8-bit luma (Yc) and
 * two chroma channels (C1, C2). This let photofinishing labs scan a roll of film once
 * and derive prints, monitor previews, and digital copies from a single
 * scene-referred master.
 *
 * @see {@link https://www.ilkeratalay.com/colorspacesfaq.php} Bourgin Color Spaces FAQ §8.10
 * @wiki {@link https://en.wikipedia.org/wiki/Photo_CD#Encoding}
 * @year 1992
 * @by Kodak
 * @use Kodak Photo CD scene-referred scan encoding; historical, obsolete since Photo CD's discontinuation.
 * @channel {Yc} 0 255 Luma
 * @channel {C1} 0 255 Blue chroma
 * @channel {C2} 0 255 Red chroma
 * @method luma-chroma
 * @encoding gamma
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic sdr
 */
// Implementation notes:
// Uses BT.709 primaries and D65 white but BT.601 luma coefficients (0.299/0.587/
// 0.114). The 8-bit storage form places neutral at C1=156, C2=137 — asymmetric
// because the encodable film gamut is asymmetric in B-Y/R-Y. Scene reference white
// (linear 1,1,1) maps to luma 182 (Poynton's widely-cited "189" is a typo, corrected
// to 182 in his own 1996 errata: 255/1.402 = 181.88).
import lrgb from './lrgb.js';

const photoycc = { name: 'photoycc',
	range: [[0, 255], [0, 255], [0, 255]] };

// Rec.709 OETF, odd-extended to negative scene light (the wider-than-display film gamut)
const oetf = (v) =>
	v >= 0.018 ? 1.099 * Math.pow(v, 0.45) - 0.099 :
	v <= -0.018 ? -1.099 * Math.pow(-v, 0.45) + 0.099 :
	4.5 * v;
const oetfInv = (v) =>
	v >= 0.081 ? Math.pow((v + 0.099) / 1.099, 1 / 0.45) :
	v <= -0.081 ? -Math.pow((-v + 0.099) / 1.099, 1 / 0.45) :
	v / 4.5;

/**
 * Linear scene RGB (0-1, BT.709 primaries) -> PhotoYCC 8-bit storage form
 */
lrgb.photoycc = (r, g, b) => {
	const R = oetf(r), G = oetf(g), B = oetf(b);
	const Y = 0.299 * R + 0.587 * G + 0.114 * B;
	return [(255 / 1.402) * Y, 111.40 * (B - Y) + 156, 135.64 * (R - Y) + 137];
};

/**
 * PhotoYCC 8-bit storage form -> linear scene RGB (0-1) — exact inverse of the encode
 */
photoycc.lrgb = (yc, c1, c2) => {
	const Y = yc * (1.402 / 255);
	const B = Y + (c1 - 156) / 111.40; // C1' = B' - Y'
	const R = Y + (c2 - 137) / 135.64; // C2' = R' - Y'
	const G = (Y - 0.299 * R - 0.114 * B) / 0.587;
	return [oetfInv(R), oetfInv(G), oetfInv(B)];
};

export default photoycc;

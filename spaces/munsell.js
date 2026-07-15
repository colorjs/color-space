/**
 * The Munsell color system was devised by the American painter and art teacher
 * Albert Munsell around 1905 as a way to organize colors by how they actually look,
 * rather than by how pigments mix or lights combine. It arranges every color along
 * three perceptually spaced axes — hue, value (lightness) and chroma (saturation) —
 * notated like "5R 5/10" for hue 5R, value 5, chroma 10, so that equal numerical
 * steps in any one axis look equally spaced to the eye. The system was later refined
 * through extensive visual experiments into the 1943 Munsell Renotation, the dataset
 * still used today as its authoritative reference. It remains a standard for
 * perceptually meaningful color specification in fields such as soil science,
 * geology, and paint and pigment matching.
 *
 * @see {@link https://www.rit.edu/science/munsell-color-science-lab-educational-resources}
 * @see {@link https://onlinelibrary.wiley.com/doi/10.1002/col.20715} Centore 2012 (inversion)
 * @wiki {@link https://en.wikipedia.org/wiki/Munsell_color_system}
 * @year 1905
 * @by Albert H. Munsell (renotation OSA)
 * @use Perceptual color-order system for soil, geology, and pigment/paint specification; still an active industry standard.
 * @channel {H} 0 100 Hue
 * @channel {V} 0 10 Value
 * @channel {C} 0 38 Chroma
 * @method system
 * @encoding perceptual
 * @illuminant C
 * @observer 2
 * @referred display
 * @loss lookup Renotation-table interpolation with an iterative inverse; exact only at table nodes.
 * @dynamic sdr
 */
// Implementation notes:
// Hue runs 0-100 on the ASTM circle (10RP=0/100, 2.5R=2.5, 5R=5, 10R=10, 5YR=15, ...,
// advancing R->YR->Y->GY->G->BG->B->PB->P->RP); achromatic ("N") is chroma 0. Built on
// the Newhall-Nickerson-Judd 1943 renotation (RIT MCSL "real" dataset, 2734 colors
// within the MacAdam limits), embedded packed below; forward is exact at grid points
// plus trilinear interpolation (H,V,C), inverse is iterative (coarse grid search + 2D
// Newton), round-tripping xy to ~1e-10.
//
// CAUTION — illuminant: the renotation is defined for CIE Illuminant C / 2° observer,
// so munsell<->xyy is Illuminant-C-referenced (matching colour-science). Chaining on to
// rgb/xyz (which are D65 here) carries a C->D65 white-point mismatch unless you
// chromatically adapt; convert through xyy and adapt yourself for display-accurate
// sRGB. Value's Y uses the 1943 (MgO) value function, so V=10 ideal white is Y=102.57.
import xyy from './xyy.js';
import { WC, cellXY, lerp2 } from './munsell-renotation.js';

const munsell = { name: 'munsell',
	range: [[0, 100], [0, 10], [0, 38]] };

// Newhall 1943 value function V->Y (matches the renotation table's Y column)
const valueToY = V => 1.2219 * V - 0.23111 * V ** 2 + 0.23951 * V ** 3 - 0.021009 * V ** 4 + 0.0008404 * V ** 5;
const YtoValue = Y => {
	let V = 10 * Math.cbrt(Math.max(Y, 0) / 100);
	for (let i = 0; i < 40; i++) {
		const f = valueToY(V) - Y;
		const d = 1.2219 - 0.46222 * V + 0.71853 * V ** 2 - 0.084036 * V ** 3 + 0.004202 * V ** 4;
		V -= f / d; if (Math.abs(f) < 1e-9) break;
	}
	return V;
};

// Munsell H,V,C -> xyY (Illuminant C)
const toXyY = (H, V, C) => {
	const Y = valueToY(V);
	if (C <= 0) return [WC[0], WC[1], Y];
	const vi0 = Math.max(0, Math.min(8, Math.floor(V) - 1)), vi1 = Math.min(8, vi0 + 1);
	const tv = Math.max(0, Math.min(1, (V - 1) - vi0));
	const hf = ((((H - 1e-9) % 100) + 100) % 100) / 2.5 - 1;
	const h0 = ((Math.floor(hf) % 40) + 40) % 40, h1 = (h0 + 1) % 40, th = hf - Math.floor(hf);
	const corner = (hi, vi) => cellXY(hi, vi, C) || cellXY(hi === h0 ? h1 : h0, vi, C) || WC.slice();
	const cv0 = lerp2(corner(h0, vi0), corner(h1, vi0), th);
	const cv1 = lerp2(corner(h0, vi1), corner(h1, vi1), th);
	const [x, y] = lerp2(cv0, cv1, tv);
	return [x, y, Y];
};

// xyY (Illuminant C) -> Munsell H,V,C
const toHVC = (x, y, Y) => {
	const V = YtoValue(Y);
	if (Math.hypot(x - WC[0], y - WC[1]) < 1e-4) return [0, V, 0];
	let best = null; // coarse search over the hue×chroma grid at this value
	for (let hi = 0; hi < 40; hi++) for (let C = 2; C <= 38; C += 2) {
		const f = toXyY(2.5 * (hi + 1), V, C), d = (f[0] - x) ** 2 + (f[1] - y) ** 2;
		if (!best || d < best.d) best = { H: 2.5 * (hi + 1), C, d };
	}
	let H = best.H, C = best.C; // 2D Newton refine on (H,C)
	for (let it = 0; it < 60; it++) {
		const f = toXyY(H, V, C), ex = f[0] - x, ey = f[1] - y;
		if (Math.hypot(ex, ey) < 1e-8) break;
		const fh = toXyY(H + 0.05, V, C), fc = toXyY(H, V, C + 0.05);
		const j00 = (fh[0] - f[0]) / 0.05, j01 = (fc[0] - f[0]) / 0.05;
		const j10 = (fh[1] - f[1]) / 0.05, j11 = (fc[1] - f[1]) / 0.05;
		const det = j00 * j11 - j01 * j10; if (Math.abs(det) < 1e-12) break;
		const sH = (j11 * -ex - j01 * -ey) / det, sC = (-j10 * -ex + j00 * -ey) / det;
		H = ((H + Math.max(-5, Math.min(5, sH))) % 100 + 100) % 100;
		C = Math.max(0, C + Math.max(-5, Math.min(5, sC)));
	}
	return [H, V, C];
};

xyy.munsell = (x, y, Y) => toHVC(x, y, Y);
munsell.xyy = (H, V, C) => toXyY(H, V, C);

export default munsell;

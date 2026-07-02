/**
 * DIN99d color space
 *
 * Improved DIN99 uniform space (Cui, Luo, Rigg, Roesler & Witt 2002). Unlike
 * din99o, canonical DIN99d applies the redness pre-correction Xc = 1.12·X − 0.12·Z
 * to the D65 tristimulus *before* CIELab (with the corrected white Xcw), then a 50°
 * hue rotation and log compression. It connects via xyz because the correction
 * precedes the Lab step. (colour-science's DIN99d omits the X-correction; the paper
 * form here is the canonical one.)
 *
 * @see {@link https://doi.org/10.1002/col.10118}
 * @channel {L} 0 100 Lightness
 * @channel {a} -50 50 Green-Red axis
 * @channel {b} -50 50 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { labF, labFInv } from './cie.js';

const din99d = {
	name: 'din99d',
	range: [[0, 100], [-50, 50], [-50, 50]]
};

// DIN99d constants (Cui et al. 2002)
const c1 = 325.22, c2 = 0.0036, c5 = 22.5, c6 = 0.06, scale = 1.14;
const θ = 50 * Math.PI / 180;
const cosθ = Math.cos(θ), sinθ = Math.sin(θ);

// the X-corrected D65 white
const Xw = 95.04559270516716, Yw = 100, Zw = 108.90577507598784;
const Xcw = 1.12 * Xw - 0.12 * Zw; // ≈ 93.382

// XYZ (D65, 0-100) -> DIN99d
xyz.din99d = (X, Y, Z) => {
	const Xc = 1.12 * X - 0.12 * Z;
	const fx = labF(Xc / Xcw), fy = labF(Y / Yw), fz = labF(Z / Zw);
	const L = 116 * fy - 16, a = 500 * (fx - fy), b = 200 * (fy - fz);
	const e = a * cosθ + b * sinθ;
	const f = scale * (b * cosθ - a * sinθ);
	const G = Math.sqrt(e * e + f * f);
	const L99 = c1 * Math.log1p(c2 * L);
	if (G === 0) return [L99, 0, 0];
	const h = Math.atan2(f, e) + θ;
	const C99 = c5 * Math.log1p(c6 * G);
	return [L99, C99 * Math.cos(h), C99 * Math.sin(h)];
};

// DIN99d -> XYZ (D65, 0-100)
din99d.xyz = (L99, a99, b99) => {
	const L = Math.expm1(L99 / c1) / c2;
	const C99 = Math.hypot(a99, b99);
	const fy = (L + 16) / 116;
	if (C99 === 0) {
		const yr = labFInv(fy); // neutral: xr = yr -> X = Xw·yr
		return [yr * Xw, yr * Yw, yr * Zw];
	}
	const h = Math.atan2(b99, a99) - θ;
	const G = Math.expm1(C99 / c5) / c6;
	const e = G * Math.cos(h), fv = G * Math.sin(h);
	const a = e * cosθ - (fv / scale) * sinθ;
	const b = e * sinθ + (fv / scale) * cosθ;
	const fx = a / 500 + fy, fz = fy - b / 200;
	const xr = labFInv(fx), yr = labFInv(fy), zr = labFInv(fz);
	const Xc = xr * Xcw, Y = yr * Yw, Z = zr * Zw;
	return [(Xc + 0.12 * Z) / 1.12, Y, Z];
};

export default din99d;

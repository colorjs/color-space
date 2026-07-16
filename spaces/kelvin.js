/**
 * Kelvin — correlated color temperature (CCT), the familiar scale for describing a
 * light source's warmth or coolness by comparing it to an ideal black-body radiator:
 * roughly 2700 K for a warm incandescent candle-like glow, up to 6500 K and beyond for
 * cool daylight. It's the white-balance axis used throughout photography, lighting
 * design and display calibration, mapping a single temperature value to a point on the
 * Planckian locus.
 *
 * @see {@link https://doi.org/10.1002/col.5080100109} Krystek 1985 (CCT→uv locus)
 * @wiki {@link https://en.wikipedia.org/wiki/Planckian_locus}
 * @year 1931
 * @by Raymond Davis; CIE (Judd)
 * @use White-balance / CCT axis for photography, lighting and display calibration via the Planckian locus.
 * @channel {T} 1000 25000 Temperature
 * @method spectral
 * @encoding chromaticity
 * @illuminant D65
 * @observer 2
 * @referred display
 * @loss projective Any color projects to its nearest Planckian-locus CCT; only on-locus colors round-trip.
 * @dynamic sdr
 */
// Implementation notes:
// CCT→xy uses Krystek's (1985) rational approximation of the locus. xy→CCT is the
// CCT definition itself (CIE 15): the nearest point on that locus in the CIE 1960
// UCS — bracketed by a geometric scan, refined by golden section — so the pair
// round-trips exactly on the locus over the whole 1000–25000 K range. A 1-channel
// space (like `gray`); off-locus colours project to their nearest CCT — lossy.
import xyz from './xyz.js';

const kelvin = { name: 'kelvin', range: [[1000, 25000]] };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Planckian locus in CIE 1960 uv (Krystek 1985). Exported for the complete
// CCT+Duv coordinate, which offsets along this curve's oriented normal.
export const planckianUv = (T) => {
	T = clamp(T, 1000, 25000);
	return [
		(0.860117757 + 1.54118254e-4 * T + 1.28641212e-7 * T * T) / (1 + 8.42420235e-4 * T + 7.08145163e-7 * T * T),
		(0.317398726 + 4.22806245e-5 * T + 4.20481691e-8 * T * T) / (1 - 2.89741816e-5 * T + 1.61456053e-7 * T * T),
	];
};

// Unit normal in CIE 1960 uv, oriented so positive distance lies above the
// Planckian locus (the positive/green Duv convention).
export const planckianNormal = (T) => {
	T = clamp(T, 1000, 25000);
	const dt = Math.max(0.01, T * 1e-5);
	const [u0, v0] = planckianUv(T - dt), [u1, v1] = planckianUv(T + dt);
	const du = u1 - u0, dv = v1 - v0, n = Math.hypot(du, dv);
	return [dv / n, -du / n];
};

// Nearest Planckian-locus CCT for one CIE 1960 uv chromaticity.
export const nearestCct = (u0, v0) => {
	const f = (T) => { const [u, v] = planckianUv(T); return (u - u0) ** 2 + (v - v0) ** 2 };
	const N = 32, r = (25000 / 1000) ** (1 / N);
	let bi = 0, bf = Infinity;
	for (let i = 0; i <= N; i++) { const fi = f(1000 * r ** i); if (fi < bf) { bf = fi; bi = i } }
	let lo = 1000 * r ** Math.max(bi - 1, 0), hi = 1000 * r ** Math.min(bi + 1, N);
	const φ = (Math.sqrt(5) - 1) / 2;
	let a = hi - φ * (hi - lo), b = lo + φ * (hi - lo), fa = f(a), fb = f(b);
	while (hi - lo > 1e-3) {
		if (fa < fb) { hi = b; b = a; fb = fa; a = hi - φ * (hi - lo); fa = f(a) }
		else { lo = a; a = b; fa = fb; b = lo + φ * (hi - lo); fb = f(b) }
	}
	return (lo + hi) / 2;
};

// CCT (kelvin) -> CIE 1960 uv -> xy
kelvin.xyz = (T) => {
	const [u, v] = planckianUv(T);
	const d = 2 * u - 8 * v + 4, x = 3 * u / d, y = 2 * v / d;
	return [x * 100 / y, 100, (1 - x - y) * 100 / y]; // XYZ at Y = 100
};

// XYZ -> nearest CCT: minimize uv distance to the locus — coarse geometric scan
// to bracket the minimum (mired-like spacing), then golden-section refinement
xyz.kelvin = (X, Y, Z) => {
	const s = X + Y + Z;
	if (s === 0) return [6504];
	const x = X / s, y = Y / s;
	const d = -2 * x + 12 * y + 3, u0 = 4 * x / d, v0 = 6 * y / d;
	return [nearestCct(u0, v0)];
};

export default kelvin;

/**
 * Kelvin — correlated color temperature (CCT), the familiar scale for describing a
 * light source's warmth or coolness by comparing it to an ideal black-body radiator:
 * roughly 2700 K for a warm incandescent candle-like glow, up to 6500 K and beyond for
 * cool daylight. It's the white-balance axis used throughout photography, lighting
 * design and display calibration, mapping a single temperature value to a point on the
 * Planckian locus.
 *
 * @see {@link https://en.wikipedia.org/wiki/Planckian_locus}
 * @see {@link https://doi.org/10.1002/col.5080170211} McCamy 1992 (xy→CCT)
 * @wiki {@link https://en.wikipedia.org/wiki/Planckian_locus}
 * @channel {T} 1000 25000 Temperature
 * @method spectral
 * @encoding chromaticity
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// CCT→xy uses Krystek's (1985) rational approximation of the locus; xy→CCT uses
// McCamy's (1992) cubic. A 1-channel space (like `gray`); the inverse returns the
// nearest CCT, so it round-trips on the locus but is lossy for off-locus colours.
import xyz from './xyz.js';

const kelvin = { name: 'kelvin', range: [[1000, 25000]] };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// CCT (kelvin) -> CIE 1960 uv (Krystek 1985) -> xy
kelvin.xyz = (T) => {
	T = clamp(T, 1000, 25000);
	const u = (0.860117757 + 1.54118254e-4 * T + 1.28641212e-7 * T * T) / (1 + 8.42420235e-4 * T + 7.08145163e-7 * T * T);
	const v = (0.317398726 + 4.22806245e-5 * T + 4.20481691e-8 * T * T) / (1 - 2.89741816e-5 * T + 1.61456053e-7 * T * T);
	const d = 2 * u - 8 * v + 4, x = 3 * u / d, y = 2 * v / d;
	return [x * 100 / y, 100, (1 - x - y) * 100 / y]; // XYZ at Y = 100
};

// XYZ -> nearest CCT (McCamy 1992)
xyz.kelvin = (X, Y, Z) => {
	const s = X + Y + Z;
	if (s === 0) return [6504];
	const n = (X / s - 0.3320) / (0.1858 - Y / s);
	return [clamp(437 * n ** 3 + 3601 * n ** 2 + 6861 * n + 5517.8, 1000, 25000)];
};

export default kelvin;

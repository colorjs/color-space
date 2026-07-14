/**
 * CCT + Duv — the lighting industry's two-coordinate description of near-white
 * chromaticity. Correlated colour temperature locates the nearest point on the
 * Planckian locus; Duv is the signed perpendicular distance from that locus in
 * the CIE 1960 uv diagram (positive above the locus, conventionally greener;
 * negative below it, conventionally pinker). Unlike CCT alone, the pair preserves
 * both dimensions of chromaticity around the white-light region.
 *
 * @see {@link https://doi.org/10.1080/15502724.2014.839020} Ohno 2014
 * @see {@link https://www.energy.gov/sites/default/files/2023-09/ssl-smet-etal-2023_method-cct-duv-light-source.pdf} Smet et al. 2023
 * @wiki {@link https://en.wikipedia.org/wiki/Color_temperature#Correlated_color_temperature}
 * @year 2014
 * @by Yoshi Ohno / ANSI
 * @use Lighting specification and LED binning: CCT says warm–cool, Duv says green–pink; current companion coordinates for white-light chromaticity.
 * @channel {T} 1000 25000 Correlated colour temperature in kelvin
 * @channel {Duv} -0.05 0.05 Signed distance from the Planckian locus in CIE 1960 uv
 * @method chromaticity
 * @encoding chromaticity
 * @observer 2
 * @referred display
 * @loss projective Chromaticity only: luminance is discarded; the inverse reconstructs XYZ at Y=100.
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { nearestCct, planckianNormal, planckianUv } from './kelvin.js';

const cctDuv = {
	name: 'cct-duv',
	range: [[1000, 25000], [-0.05, 0.05]]
};

// CCT,Duv -> CIE 1960 uv -> XYZ with conventional reference luminance Y=100.
cctDuv.xyz = (T, Duv) => {
	const [u0, v0] = planckianUv(T);
	const [nu, nv] = planckianNormal(T);
	const u = u0 + Duv * nu, v = v0 + Duv * nv;
	if (v === 0) return [0, 0, 0];
	const d = 2 * u - 8 * v + 4, x = 3 * u / d, y = 2 * v / d;
	return [x * 100 / y, 100, (1 - x - y) * 100 / y];
};

// XYZ -> CIE 1960 uv; nearest locus point gives CCT and its oriented normal
// gives the signed Euclidean Duv. Black has no chromaticity, so use neutral D65.
xyz[cctDuv.name] = (X, Y, Z) => {
	const d = X + 15 * Y + 3 * Z;
	if (d === 0) return [6504, 0];
	const u = 4 * X / d, v = 6 * Y / d;
	const T = nearestCct(u, v);
	const [u0, v0] = planckianUv(T), [nu, nv] = planckianNormal(T);
	return [T, (u - u0) * nu + (v - v0) * nv];
};

export default cctDuv;

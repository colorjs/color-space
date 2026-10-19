/**
 * IaPbP is a uniform color space for HDR and wide-gamut images published by Huang et
 * al. in 2024. It keeps IPT's layout (cone matrix, per-cone nonlinearity, opponent
 * matrix) but makes both matrices 4×4 projective transforms in homogeneous coordinates
 * and replaces the power law with SA-PQ, a PQ-shaped curve fitted to a surround-aware
 * contrast sensitivity function for a 500 lx room. The parameters were optimized
 * jointly for uniformity, hue linearity and low crosstalk between lightness and chroma.
 *
 * @see {@link https://doi.org/10.1364/OE.530213} Huang et al. 2024, Opt. Express 32(17), 30742-30755
 * @year 2024
 * @by Huang, Xu, Zhang, Hu, Deng & Li
 * @use Tone mapping and color difference in HDR/WCG imaging; research.
 * @channel {I} 0 1 Lightness
 * @channel {ap} -1 1 Blue-Yellow
 * @channel {bp} -1 1 Red-Cyan
 * @method opponent
 * @encoding pq
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// Huang et al. 2024 (open access, https://opg.optica.org/oe/fulltext.cfm?uri=oe-32-17-30742):
// XYZ normalized by the reference white (Sec. 2.1), here the hub D65, so white -> 1;
// [L M S] = T_homog(M1·[X Y Z 1]ᵀ) (Eq. 2), SA-PQ per cone (Eqs. 3, 6: c1' 0.7707,
// c2' 44.4561, c3' 44.2269, m' 0.2926, n' 78.2171), [I ap bp] = T_homog(M2·[L' M' S' 1]ᵀ)
// (Eq. 4), with M1, M2 from Eqs. 20–21. Both matrices have last column [0 0 0 1]ᵀ
// (Eq. 17), so each is a 3×3 block A plus a denominator row d: u = A·v / (1 + d·v); the
// inverse has the same form with A⁻¹ and −d·A⁻¹. The paper gives no inverse, no
// worked example and no code, and never states the reference white in cd/m²; HDR use
// that maps white to 1 should keep saturated BT.2020 greens below ≈ 4× white, where the
// M1 denominator reaches zero. The printed coefficients meet the white constraints of
// Eq. 18 only to ≈ 1e-3 (white -> I 0.9986, ap 0.0012, bp 0.0010). SA-PQ is extended
// point-symmetrically about f(0) = c1'^n' for negative cone signals (not in the paper).
// Ranges: sRGB spans ap −0.55..0.72, bp −0.34..0.60; BT.2020 −0.75..0.83, hence ±1. The paper
// does not name the axes; the names say where sRGB primaries land (ap: blue +0.63, yellow
// −0.47; bp: red +0.60, cyan −0.34) – the axes are rotated against IPT's P/T.
import xyz from './xyz.js';
import whitepoint from '../whitepoints.js';
import { mat3, inv3, spow } from '../math.js';

const iapbp = { name: 'iapbp', range: [[0, 1], [-1, 1], [-1, 1]] };

const W = whitepoint[2].D65;
const A1 = [0.490978, 1.045001, 0.482481, 0.517558, 1.256543, 0.240489, 1.587132, 0.553389, -0.124257];
const d1 = [1.967421, -0.807475, -0.143517];
const A2 = [-0.011823, 0.248826, -0.106030, 5.055264, -5.937734, 0.881421, 1.247189, -3.372989, 2.125450];
const d2 = [-0.741126, 1.127297, -1.255019];
const invD = (d, Ai) => [0, 1, 2].map(j => -(d[0] * Ai[j] + d[1] * Ai[3 + j] + d[2] * Ai[6 + j]));
const A1i = inv3(A1), d1i = invD(d1, A1i), A2i = inv3(A2), d2i = invD(d2, A2i);

// projective map T_homog(M·T_cart(v)) for M = [A 0; d 1]
const proj = (A, d, x, y, z) => {
	const w = 1 + d[0] * x + d[1] * y + d[2] * z, v = mat3(A, x, y, z);
	return [v[0] / w, v[1] / w, v[2] / w];
};

const c1 = 0.7707, c2 = 44.4561, c3 = 44.2269, m = 0.2926, n = 78.2171;
const f0 = Math.pow(c1, n);
const sapq = v => { const t = Math.pow(Math.abs(v), m); return f0 + Math.sign(v) * (Math.pow((c1 + c2 * t) / (1 + c3 * t), n) - f0); };
const sapqInv = v => { const t = Math.pow(f0 + Math.abs(v - f0), 1 / n); return Math.sign(v - f0) * spow((t - c1) / (c2 - c3 * t), 1 / m); };

xyz.iapbp = (X, Y, Z) => proj(A2, d2, ...proj(A1, d1, X / W[0], Y / W[1], Z / W[2]).map(sapq));

iapbp.xyz = (I, a, b) => {
	const [x, y, z] = proj(A1i, d1i, ...proj(A2i, d2i, I, a, b).map(sapqInv));
	return [x * W[0], y * W[1], z * W[2]];
};

export default iapbp;

/**
 * oRGB is an opponent color space for computer graphics, published by Margarita
 * Bratkova, Solomon Boulos and Peter Shirley in 2009. A fixed matrix turns
 * gamma-encoded R′G′B′ into luma plus two chroma axes, then a piecewise rotation of
 * the hue angle puts yellow opposite blue and red opposite green, following Hering's
 * opponent model. It keeps HSV-like simplicity while giving axes suited to color
 * adjustment, cool-to-warm shading and color transfer.
 *
 * @see {@link https://doi.org/10.1109/MCG.2009.13} Bratkova, Boulos & Shirley 2009, IEEE CG&A 29(1):42-55
 * @year 2009
 * @by Bratkova, Boulos & Shirley
 * @use Opponent-axis color adjustment and color transfer on R′G′B′ in graphics; research niche.
 * @channel {L} 0 1 Luma
 * @channel {Cyb} -1 1 Yellow-blue chroma
 * @channel {Crg} -1 1 Red-green chroma
 * @method opponent
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Bratkova et al. 2009 §3 (author copy: https://graphics.stanford.edu/~boulos/papers/orgb_sig.pdf).
// Eq. 3: R′G′B′ -> L′C′1C′2 matrix as printed (0.8660 is √3/2 to 4 decimals, kept as printed,
// as coloraide 8.13 does); the inverse is derived (eq. 4 prints it to 4 decimals). Eq. 5: hue
// angle θ = atan2(C′2, C′1) remaps to θo = 3/2·θ below π/3, π/2 + 3/4·(θ − π/3) above, mirrored
// for θ < 0; eq. 6 rotates the chroma pair to θo; eq. 7 is the inverse remap. Ranges per §3.3:
// L′ 0-1, Cyb and Crg -1..1. Input is the library's sRGB (0-255), the paper's R′G′B′.
import rgb from './rgb.js';
import { mat3, inv3 } from '../math.js';

const orgb = { name: 'orgb', range: [[0, 1], [-1, 1], [-1, 1]] };

const M = [0.299, 0.587, 0.114, 0.5, 0.5, -1, 0.866, -0.866, 0];
const MI = inv3(M);

const fwd = (t) => { const a = Math.abs(t); return Math.sign(t) * (a < Math.PI / 3 ? 1.5 * a : Math.PI / 2 + 0.75 * (a - Math.PI / 3)) };
const inv = (t) => { const a = Math.abs(t); return Math.sign(t) * (a < Math.PI / 2 ? a * 2 / 3 : Math.PI / 3 + 4 / 3 * (a - Math.PI / 2)) };

rgb.orgb = (r, g, b) => {
	const [l, c1, c2] = mat3(M, r / 255, g / 255, b / 255);
	const c = Math.hypot(c1, c2), t = fwd(Math.atan2(c2, c1));
	return [l, c * Math.cos(t), c * Math.sin(t)];
};

orgb.rgb = (l, cyb, crg) => {
	const c = Math.hypot(cyb, crg), t = inv(Math.atan2(crg, cyb));
	const [r, g, b] = mat3(MI, l, c * Math.cos(t), c * Math.sin(t));
	return [r * 255, g * 255, b * 255];
};

export default orgb;

/**
 * IHLS, Improved HLS, is a 3D-polar remapping of RGB introduced by Allan Hanbury in 2003,
 * building on a 2002 technical report with Jean Serra. Hue is the exact angle in the chromatic
 * plane, saturation is max(R,G,B) − min(R,G,B) and brightness is Rec. 709 weighted luma.
 * Saturation therefore stays small for every near-gray and does not depend on brightness,
 * whereas HLS divides by lightness and can call a near-black color fully saturated.
 *
 * @see {@link https://doi.org/10.1007/3-540-45103-X_107} Hanbury 2003, Image Analysis (SCIA 2003, Springer LNCS), 804-811
 * @year 2003
 * @by Hanbury
 * @use Image analysis and color morphology; research niche.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {Y} 0 1 Luma
 * @channel {S} 0 1 Saturation (max − min)
 * @method cylindrical
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Hanbury & Serra, PRIP-TR-077, TU Wien, 2002 (https://www.prip.tuwien.ac.at/pripfiles/trs/tr77.pdf), §10:
// eq. 59 Y = 0.2126R + 0.7152G + 0.0722B (Rec. 709 weights, eq. 1); eq. 63 C1 = R − G/2 − B/2,
// C2 = (√3/2)(B − G); eq. 65 hue = arccos(C1/C), reflected to 360° − that when C2 > 0, written
// here as atan2(−C2, C1) (same angle, no precision loss near 0°/180°; achromatic → 0); eq. 60
// S = max − min; inverse eq. 67-71: H* = H − 60°·floor(H/60°), C = √3·S / (2 sin(120° − H*)),
// C1 = C cos H, C2 = −C sin H, then the derived inverse of eq. 63. The report's eq. 63 prints
// 0.2125/0.7154/0.0721 (and eq. 71 an inverse of those); eq. 59's Rec. 709 weights are used for
// both directions, as colour-science 0.4.7 does. The report computes Y as luminance from linear
// RGB; here the input is gamma-encoded sRGB like the other HLS-family spaces, so Y is luma Y′
// (§10 allows any amplitude measure that is a linear combination of R, G, B).
import rgb from './rgb.js';
import { mat3, inv3 } from '../math.js';

const ihls = { name: 'ihls', range: [[0, 360], [0, 1], [0, 1]] };

const k = Math.sqrt(3) / 2;
const M = [0.2126, 0.7152, 0.0722, 1, -0.5, -0.5, 0, -k, k];
const MI = inv3(M);

rgb.ihls = (r, g, b) => {
	r /= 255, g /= 255, b /= 255;
	const [y, c1, c2] = mat3(M, r, g, b);
	const h = c1 === 0 && c2 === 0 ? 0 : Math.atan2(-c2, c1) * 180 / Math.PI;
	return [h < 0 ? h + 360 : h, y, Math.max(r, g, b) - Math.min(r, g, b)];
};

ihls.rgb = (h, y, s) => {
	const hs = h - 60 * Math.floor(h / 60), hr = h * Math.PI / 180;
	const c = Math.sqrt(3) * s / (2 * Math.sin((120 - hs) * Math.PI / 180));
	const [r, g, b] = mat3(MI, y, c * Math.cos(hr), -c * Math.sin(hr));
	return [r * 255, g * 255, b * 255];
};

export default ihls;

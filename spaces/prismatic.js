/**
 * Prismatic is a four-channel remapping of RGB by Peter Shirley and David Hart, written up in
 * 2015 after they used it for color edits in the iPhone photo app Subjective. Hue is the
 * Maxwell color triangle in barycentric form, (ρ, γ, β) = (R, G, B) / (R + G + B), and
 * lightness is HSV's V = max(R, G, B), so every cross-section is the same triangle and the
 * whole volume is a prism. Because a mix of two RGB colors lands on the straight line between
 * their hues, hue mixing, saturation edits (s = 1 − 3·min(ρ, γ, β)) and palette clamping stay
 * simple arithmetic.
 *
 * @see {@link https://web.archive.org/web/20170301014117/http://www.cs.utah.edu/~shirley/papers/prismatic.pdf} Shirley & Hart 2015, Purity LLC Tech Report #1
 * @year 2015
 * @by Shirley & Hart
 * @use Palette reduction in photo apps; niche.
 * @channel {L} 0 1 Lightness, max of R, G, B
 * @channel {r} 0 1 Red barycentric (ρ)
 * @channel {g} 0 1 Green barycentric (γ)
 * @channel {b} 0 1 Blue barycentric (β)
 * @method chromaticity
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Shirley & Hart, "The Prismatic Color Space for RGB Computations", Purity LLC Tech Report #1,
// 2015-10-28, §3: (ρ, γ, β) = (R, G, B)/(R + G + B), L = max(R, G, B); inverse (R, G, B) =
// L·(ρ, γ, β)/max(ρ, γ, β). The report leaves the RGB encoding open; the input here is the
// library's gamma-encoded sRGB, as in colour-science 0.4.7 and coloraide 8.13. ρ + γ + β = 1, so
// the four channels carry three degrees of freedom. Black (sum 0) sits at the neutral point
// (1/3, 1/3, 1/3), as rg.js does; colour-science and coloraide return (0, 0, 0) there.
import rgb from './rgb.js';

const prismatic = { name: 'prismatic', range: [[0, 1], [0, 1], [0, 1], [0, 1]] };

rgb.prismatic = (r, g, b) => {
	r /= 255, g /= 255, b /= 255;
	const s = r + g + b;
	if (s === 0) return [0, 1 / 3, 1 / 3, 1 / 3];
	return [Math.max(r, g, b), r / s, g / s, b / s];
};

prismatic.rgb = (l, r, g, b) => {
	const m = Math.max(r, g, b);
	if (m === 0) return [0, 0, 0];
	const k = l / m * 255;
	return [r * k, g * k, b * k];
};

export default prismatic;

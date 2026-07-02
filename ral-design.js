/**
 * RAL Design System+ color space
 *
 * RAL Design (≈1825 colours) is — unlike sample-defined RAL Classic — defined *by
 * construction* in CIELAB cylindrical coordinates. A code "RAL HHH L CC" maps to
 * CIE L*C*h directly: hue angle H (0-360°), lightness L = L*, chroma C = C*ab, so
 * L* = L, a* = C·cos H, b* = C·sin H. This is the published *definition*, not a
 * fitted approximation or a copied swatch table, which is what makes it a legitimate
 * algorithmic conversion here.
 *
 * CAUTIONS:
 * - "RAL" is a trademark of RAL gGmbH. This implements only the public coordinate
 *   definition (H/L/C ↔ CIELAB); it does NOT embed RAL's proprietary colour data, and
 *   RAL Classic (sample-defined, no open Lab) is deliberately NOT included.
 * - White point: neighbour `lab` (D50/2°), matching the freieFarbe HLC Colour Atlas —
 *   the open, CC-licensed reference for these hue/lightness/chroma colours, defined
 *   under D50/2°. The H,L,C→L*a*b* identity is itself white-point-independent; only a
 *   later Lab→RGB step depends on the illuminant. (RAL's own measurement white is not
 *   openly documented; D50/2° is chosen to agree with the citable reference dataset.)
 * - Real RAL Design codes are quantised (hue in 10° steps, etc.); this transform is
 *   continuous and does not snap to the nearest catalogued chip.
 *
 * @see {@link https://en.wikipedia.org/wiki/RAL_colour_standard}
 * @see {@link https://www.freiefarbe.de/en/colour-atlas/} freieFarbe HLC Colour Atlas (D50/2°, CC)
 * @channel {H} 0 360 Hue (CIELAB hue angle, degrees)
 * @channel {L} 0 100 Lightness (CIELAB L*)
 * @channel {C} 0 100 Chroma (CIELAB C*ab)
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lab from './lab.js';

const raldesign = { name: 'ral-design',
	range: [[0, 360], [0, 100], [0, 100]] };

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

// RAL Design H,L,C -> CIE Lab (D50): the published cylindrical definition
raldesign.lab = (H, L, C) => [L, C * Math.cos(H * D2R), C * Math.sin(H * D2R)];

// CIE Lab (D50) -> RAL Design H,L,C  (bracket key: space name is hyphenated)
lab['ral-design'] = (L, a, b) => [(Math.atan2(b, a) * R2D + 360) % 360, L, Math.hypot(a, b)];

export default raldesign;

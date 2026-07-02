/**
 * RAL Design System+ is a color specification system of roughly 1,825 colors,
 * maintained by RAL gGmbH and widely used across Europe to specify paints, coatings
 * and architectural finishes. Unlike the older RAL Classic system, whose colors are
 * defined only by physical sample swatches, RAL Design colors are defined
 * algorithmically as cylindrical coordinates in CIELAB space — a hue angle, a
 * lightness, and a chroma — making every RAL Design code a directly computable point
 * in a standard, device-independent color space rather than a color that has to be
 * matched by eye against a physical chip.
 *
 * @see {@link https://en.wikipedia.org/wiki/RAL_colour_standard}
 * @see {@link https://www.freiefarbe.de/en/colour-atlas/} freieFarbe HLC Colour Atlas (D50/2°, CC)
 * @channel {H} 0 360 Hue
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 100 Chroma
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// "RAL" is a trademark of RAL gGmbH. This implements only the public coordinate
// definition (H/L/C ↔ CIELAB); it does not embed RAL's proprietary color data, and
// RAL Classic (sample-defined, no open Lab) is deliberately not included. White
// point: matches the neighboring `lab` module (D50/2°), aligning with the freieFarbe
// HLC Colour Atlas, the open CC-licensed reference for these hue/lightness/chroma
// colors (RAL's own measurement white is not openly documented). Real RAL Design
// codes are quantised (hue in 10° steps, etc.); this transform is continuous and does
// not snap to the nearest catalogued chip.
import lab from './lab.js';

const raldesign = { name: 'ral-design',
	range: [[0, 360], [0, 100], [0, 100]] };

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

// RAL Design H,L,C -> CIE Lab (D50): the published cylindrical definition
raldesign.lab = (H, L, C) => [L, C * Math.cos(H * D2R), C * Math.sin(H * D2R)];

// CIE Lab (D50) -> RAL Design H,L,C  (bracket key: space name is hyphenated)
lab['ral-design'] = (L, a, b) => [(Math.atan2(b, a) * R2D + 360) % 360, L, Math.hypot(a, b)];

export default raldesign;

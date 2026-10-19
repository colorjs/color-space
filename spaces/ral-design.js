/**
 * RAL Design System+ is RAL gGmbH's system of about 1,825 colors, each defined by a CIELAB hue
 * angle, lightness and chroma. The older RAL Classic colors exist only as physical swatches;
 * every RAL Design code is a point you can compute, with no chip to match by eye.
 *
 * @see {@link https://www.freiefarbe.de/en/thema-farbe/hlc-colour-atlas/} freieFarbe HLC Colour Atlas (D50/2°, CC)
 * @wiki {@link https://en.wikipedia.org/wiki/RAL_colour_standard#RAL_Design}
 * @year 1993
 * @by RAL gGmbH
 * @use European paint, coatings and architectural color specification; an active standard.
 * @channel {H} 0 360 Hue
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 100 Chroma
 * @method system
 * @encoding perceptual
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

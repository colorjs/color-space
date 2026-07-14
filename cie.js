/**
 * CIE 1976 perceptual companding — the cube-root toe shared by every space built
 * on L* (CIELAB, CIELUV, DIN99d, HCT, HSLuv). Single source of truth for the two
 * constants and the f/f⁻¹ pair, so no space carries its own (differently-rounded) copy.
 *
 * @see {@link http://www.brucelindbloom.com/index.html?LContinuity.html}
 */
export const ε = 216 / 24389;   // (6/29)³   intersection of the toe and the cube root
export const ε3 = 24 / 116;     // 6/29      same threshold in f-space (∛ε)
export const κ = 24389 / 27;    // (29/3)³   the linear toe's slope·116

/** Forward companding f(t): normalised tristimulus ratio → lightness space. */
export const labF = (t) => t > ε ? Math.cbrt(t) : (κ * t + 16) / 116;

/** Inverse companding f⁻¹(ft): lightness space → normalised tristimulus ratio. */
export const labFInv = (ft) => ft > ε3 ? ft ** 3 : (116 * ft - 16) / κ;

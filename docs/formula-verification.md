# Formula Verification

color-space v3 validates conversions through two complementary methods: a differential cross-library suite against the CSS Color 4 reference implementation, and per-space roundtrip + primary-source checks for spaces that reference lacks.

---

## 1. Differential suite against colorjs.io

[colorjs.io](https://colorjs.io) is the implementation written by the CSS Color 4/5 spec editors (Lea Verou, Chris Lilley). Where color-space and colorjs share a space, colorjs is the oracle.

### Method

For each space S, 14 sRGB samples spanning primaries, secondaries, white, black, gray, and mid-tones are run through two independent paths and compared in sRGB code values (0–255):

**Direction A** — color-space forward, colorjs inverse:
`rgb → [color-space] → S → [colorjs] → sRGB ≈ original`

**Direction B** — colorjs forward, color-space inverse:
`sRGB → [colorjs] → S → [color-space] → rgb ≈ original`

Comparing in sRGB means hue-wrap and achromatic-point ambiguity never inflate the error. More importantly, checking both directions through the *correct* counterpart (not just a plain A→B→A roundtrip) catches self-cancelling forward/inverse bugs — the kind where a wrong linearization in `rgb→S` is exactly undone by the same wrong linearization in `S→rgb`, making the roundtrip appear perfect while the actual values are wrong. (This is how the oklab linearization bug survived undetected until this suite was written.)

### Covered spaces (29)

| color-space name | colorjs id |
|---|---|
| `lrgb` | `srgb-linear` |
| `p3` | `p3` |
| `p3-linear` | `p3-linear` |
| `rec2020` | `rec2020` |
| `rec2020-linear` | `rec2020-linear` |
| `a98rgb` | `a98rgb` |
| `a98rgb-linear` | `a98rgb-linear` |
| `prophoto` | `prophoto` |
| `prophoto-linear` | `prophoto-linear` |
| `xyz` | `xyz-d65` |
| `xyz-d50` | `xyz-d50` |
| `lab` | `lab` (D50 / ICC PCS / CSS Color 4) |
| `lab-d65` | `lab-d65` |
| `lchab` | `lch` (D50 polar) |
| `luv` | `luv` |
| `lchuv` | `lchuv` |
| `oklab` | `oklab` |
| `oklch` | `oklch` |
| `hsl` | `hsl` |
| `hsv` | `hsv` |
| `hwb` | `hwb` |
| `jzazbz` | `jzazbz` |
| `jzczhz` | `jzczhz` |
| `ictcp` | `ictcp` |
| `acescg` | `acescg` |
| `acescc` | `acescc` |
| `cam16` | `cam16-jmh` |
| `rec2100-pq` | `rec2100pq` |
| `rec2100-hlg` | `rec2100hlg` |

### Tolerance

The tolerance is **1.0 sRGB code value** (i.e. 1/255 ≈ 0.4%). Typical agreement is 1e-5 to 1e-14. The gap between typical and the tolerance cap exists to absorb float noise that colorjs itself introduces at achromatic points — for example, colorjs reports Cz ≈ 2e-4 for white in JzCzhz, which a faithful inverse turns into roughly 0.5 sRGB units of error. Every real conversion bug found during the v3 audit produced errors of 20–1330 code values, so the 1.0 ceiling has large margin against false passes while being sub-perceptual.

The suite runs as part of `npm test` via `test/reference.js`.

---

## 2. Bona-fide cited values ([test/bonafide.js](../test/bonafide.js))

Every space the differential suite does not cover is pinned by at least one **bona-fide reference value** — an authoritative input→output pair, never a self-referential roundtrip. The 2026-07 audit recomputed every entry from its cited source and attached the authoritative deep link (each entry's `url` field): **135 cited points across 135 space labels** (`test/refs.js` — the counts in `test/bonafide.js` derive from it at run time). Together with the differential suite this covers **all 162 graph spaces — zero gaps**.

A cited anchor is exactly that — an anchor: it pins the formula at one (occasionally a few) points, which cannot exercise every nonlinear branch or boundary the way the differential grid does. The tier each space sits in is stated here so the guarantee is never stronger than the evidence.

Oracles, in order of preference:

- **colour-science 0.4.7** (Python) — cinema/camera logs, CAM02/CAM16 families and their UCS/LCD/SCD variants, ZCAM, Hellwig2022, OSA-UCS (forward and Newton inverse), IPT, IgPgTg, Yrg, hdr-CIELab/hdr-IPT, DIN99…
- **colorjs.io v0.5.2** — HCT, CAM16-JMh, HSLuv/HPLuv, sRGB↔XYZ anchors
- **culori v4** — XYB, Okhsl/Okhsv, LCh(D65)
- **Printed spec constants, hand-computed** — ITU-R BT.470/601/709/2020/2100, ITU-T T.871/H.273, SMPTE RP 431-2 / ST 2084 / 240M, IEC 61966, CIE 1960/1964/1976, ACES S-2013-001/S-2016-001, Xerox YES, Kodak PhotoYCC, Hunter Lab, vendor log-curve whitepapers (ARRI, Sony, Canon, Fujifilm, Nikon, Leica, DJI, Blackmagic, RED, Panasonic, Apple, GoPro, Xiaomi, OPPO)…

Appearance models (CIECAM02/CAM16 + variants, ZCAM, Hellwig2022, HCT) are validated under the library's exact declared viewing conditions; the conditions are named in each entry's `src` so the number is reproducible.

**Coloroid** is pinned to Nemcsics's published A=70, T=70, V=60 example (Nemcsics 1980, *Color Res. Appl.* 5(2):113–120, [doi:10.1002/col.5080050214](https://doi.org/10.1002/col.5080050214)). No compared JavaScript library implements it, so its corrected limit-color table and fractional-grade interpolation are also guarded by exact ATV↔xyY round-trips and the defining V = 10√Y invariant.

### Reference-link audit

All unique `@see` links across the space files (121 across 161 files at this revision — Wikipedia citations now live in `@wiki`, one canonical article per space) were liveness-checked and content-verified (2026-07). 15 dead or mis-attributed citations were fixed: the four `docs.acescentral.com/specifications/…` → `…/encodings/…` moves, Ottosson's restructured colorpicker anchors (okhsl/okhsv/okhwb), the DIN99d and Coloroid DOIs (both resolved to unrelated papers), the Xerox YES attribution (previously credited to an unrelated 2007 paper; the matrix is Xerox XNSS 289005, 1989), two colour-science readthedocs pages that no longer exist (→ pinned source files), the freieFarbe HLC atlas path, the Leica L-Log manual path, and the German-Wikipedia DIN99 link.

---

## 3. Shader backends (gl/)

The GLSL/WGSL chunks ship the same formulas for the GPU; three layers pin them:

1. **Float64 differential** — chunks are written in a restricted GLSL dialect that transforms mechanically to JS, so every declared edge and every composed rgb↔space path is evaluated in float64 and compared to the scalar library at 1e-6 normalized tolerance ([test/gl.js](../test/gl.js)).
2. **WebGL2 compile** — all 590 edge and rgb↔space sources compile as fragment shaders through a browser WebGL2 implementation (ANGLE/SwiftShader in CI) via [test/gl-gpu.html](../test/gl-gpu.html). This includes the LUT-backed Munsell chunk.
3. **WGSL grammar** — the same 590 sources, mechanically translated, parse clean under the full `wgsl_reflect` grammar in CI ([test/wgsl.js](../test/wgsl.js)); the browser page additionally validates them on a live WebGPU device when one is available.

---

## 4. Known limitations

**Coloroid has no independent cross-library oracle.** The limit-color chromaticities and A=70 published example are sourced to Nemcsics, and fractional A values now interpolate along the limit-color polygon so in-domain ATV↔xyY round-trips are exact. The system still has only 48 named hue grades; interpolation between them is geometric, not additional measured swatch data.

**okhsl S may marginally exceed 100 at the blue gamut boundary.** This is a known property of the smooth-cusp approximation in the Björnsson specification, shared by culori. It is not clamped, because clamping would break the roundtrip. The overshoot is small (~3 S units at the extreme corner) and documented in the `@channel` JSDoc.

---

## Camera-Log Verification Against Official ACES Transforms

Seven camera-log conversions are differential-tested against the Academy's official
vendor transforms — the CTL files camera makers supplied to or the Academy published in
[ampas/aces-dev v1.3](https://github.com/ampas/aces-dev/tree/v1.3/transforms/ctl/csc).
The decode curves and matrix recipes are transcribed verbatim from the CTLs; each pair
is sampled on a 5³ grid of encoded triplets and compared as `log → aces2065-1` through
color-space's hub. The suite runs on every `npm test` ([test/aces-vendor.js](../test/aces-vendor.js)).

### Measured agreement

Deviation is the max channel error relative to the point's dominant official component
(floored at 0.18 mid grey), over the full grid:

| color-space | Official transform (ampas/aces-dev v1.3) | CAT in CTL | Max deviation |
|---|---|---|---:|
| `slog3` | [ACEScsc.Academy.SLog3_SGamut3_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/sony/ACEScsc.Academy.SLog3_SGamut3_to_ACES.ctl) | CAT02 | 4.1e-3 |
| `sgamut3cine` | [ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/sony/ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES.ctl) | CAT02 | 4.2e-3 |
| `logc3` | [ACEScsc.Academy.LogC_EI800_AWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/arri/ACEScsc.Academy.LogC_EI800_AWG_to_ACES.ctl) | CAT02 | 4.3e-3 |
| `clog2` | [ACEScsc.Academy.CLog2_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog2_CGamut_to_ACES.ctl) | CAT02 | 4.9e-3 |
| `clog3` | [ACEScsc.Academy.CLog3_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog3_CGamut_to_ACES.ctl) | CAT02 | 4.9e-3 |
| `vlog` | [ACEScsc.Academy.VLog_VGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/panasonic/ACEScsc.Academy.VLog_VGamut_to_ACES.ctl) | Bradford | 3.0e-4 |
| `log3g10` | [ACEScsc.Academy.Log3G10_RWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/red/ACEScsc.Academy.Log3G10_RWG_to_ACES.ctl) | Bradford | 3.0e-4 |

The two Sony matrices are additionally pinned to the digits Sony itself typed into
[IDT.Sony.SLog3_SGamut3.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3.ctl) /
[IDT.Sony.SLog3_SGamut3Cine.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3Cine.ctl):
the Academy's matrix recipe (primaries + CAT02) reproduces Sony's published matrices to
**5e-11**, and color-space's own matrices are derived from the same vendor primaries.

### Why not zero

The residuals are two documented conventions, not formula error:

- **Chromatic adaptation transform.** The Sony/ARRI/Canon CTLs adapt the camera's D65
  white to the ACES white with **CAT02**; color-space routes through its XYZ D65 hub and
  adapts with **Bradford**, matching colorjs.io and the CSS Color 4 convention (the
  Panasonic and RED CTLs also default to Bradford — and agree to 3e-4). Swapping
  Bradford into a CAT02 recipe collapses its residual to the same 3e-4. The remaining
  difference peaks at ~0.5% of a point's dominant component at gamut extremes.
- **D65 white digits.** The ~3e-4 floor is the CSS-convention D65 white point versus the
  CTL library's chromaticity-derived white — a digit convention, sub-perceptual.
- **Canon reflection factor.** Canon's Log v1.2 paper, Canon's vendor IDTs, and
  colour-science define scene reflectance as IRE-linear × 0.9; the Academy *container*
  CSC omits that factor. color-space follows Canon's reflectance convention; the test
  bridges with the documented 0.9 so curve + matrix + adaptation are what's compared.

### Conversion, not look

Everything here — and every `.cube` exported by [`color-space/lut`](../lut.js) — is a
**colorimetric conversion**: pure math from one encoding to another, no tone mapping,
no highlight rolloff, no look. Vendor "to Rec.709" LUTs (ARRI LogC2Video, Sony s709,
Panasonic V-709) are **display renders** that include tone mapping and creative
decisions; a colorimetric conversion will not and should not match them. Use these
LUTs to move between encodings — normalization, monitoring, pipeline QC, batch
`ffmpeg` work — and grade the look on top.

Each generated `.cube` also states its own accuracy: the header carries the measured
deviation of the interpolated lattice against the direct conversion at random
off-lattice points ([details](../lut.js)).

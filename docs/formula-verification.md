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

## 2. Spaces without a colorjs counterpart

Spaces not in colorjs are validated by exact roundtrip plus primary-source reference values.

### okhsl / okhsv

Validated against **culori** (which implements the same Björnsson specification). H and L match exactly; S may marginally exceed 100 at the blue gamut corner due to the smooth-cusp approximation shared by both libraries (see Known Limitations).

**Primary source:** Björnsson, B. (2021). *A perceptual color space for image processing.* https://bottosson.github.io/posts/colorpicker/

### Video / luma-based spaces

`ycbcr`, `ypbpr`, `yuv`, `yiq`, `ydbdr` — validated by exact roundtrip across all primaries, secondaries, white, black, and gray, plus component values for primary colors checked against the relevant ITU-R standard.

**Primary sources:**
- ITU-R BT.601 (YCbCr / YPbPr SD)
- ITU-R BT.709 (HDTV luma coefficients)
- ITU-R BT.2020 (UHD luma coefficients)
- ITU-R BT.2100 (PQ / HLG transfer functions)
- FCC NTSC (YIQ / YDbDr)

### din99o-lab / din99o-lch

Validated by exact roundtrip; pinned to `lab-d65` as the input space per DIN 6176.

**Primary source:** DIN 6176 (din99o colour metric).

### hcy

Implemented as Chilliant's luma-based HCY (Rec.601 coefficients: R 0.299, G 0.587, B 0.114). Validated by exact roundtrip.

**Primary source:** Chilliant. *Colour spaces for game programmers.* https://www.chilliant.com/rgb2hsv.html

### hsi, hcg, hpluv, hsluv

Exact roundtrip over full hue sweep. hsluv/hpluv additionally use the reference values from the official hsluv snapshot (https://www.hsluv.org/math/).

### gray

CIE relative luminance (linearised sRGB Y row). Exact roundtrip; white maps to 100, black to 0.

### osaucs

Forward path validated by exact roundtrip where the inverse is defined. The `osaucs → xyz` direction is one-way (no closed-form inverse exists); calling it throws a clear error.

### coloroid

See Known Limitations.

---

## 3. Known limitations

**coloroid is EXPERIMENTAL.** The bundled hue table (Nemcsics) is internally inconsistent: each row's stored angle disagrees with its own chromaticity coordinates (xλ, yλ) by up to 14°. The T saturation formula does not round-trip: `rgb → coloroid → rgb` recovers T only approximately (~219/255 on a test sample). No external implementation exists to cross-validate against (colorjs and culori both lack coloroid). Tests assert only formula-verifiable invariants: V = 10√Y exactly, white → T = 0, valid hue grade, no NaN or crash. The A (hue angle) and T (saturation) values should be treated as provisional until the authoritative MSZ 7300 / Nemcsics table and ATV ↔ xyY formulas are sourced.

**osaucs.xyz and rgb.cubehelix are one-way.** OSA-UCS has no known closed-form inverse. Cubehelix is a parametric colormap whose inverse requires numerical root-finding; neither is currently implemented. Both throw descriptive errors if called in the unsupported direction.

**okhsl S may marginally exceed 100 at the blue gamut boundary.** This is a known property of the smooth-cusp approximation in the Björnsson specification, shared by culori. It is not clamped, because clamping would break the roundtrip. The overshoot is small (~3 S units at the extreme corner) and documented in the `@channel` JSDoc.

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

Every space the differential suite does not cover is pinned by at least one **bona-fide reference value** — an authoritative input→output pair, never a self-referential roundtrip. The 2026-07 audit recomputed every entry from its cited source and attached the authoritative deep link (each entry's `url` field; the six camera logs added 2026-10 — Apple Log 2, F-Log2 C, GP-Log2, KineLOG3, Samsung Log, Insta360 I-Log — were computed the same way, colour-science 0.4.7 cross-checked in Node; Samsung Log is also pinned to entries of Samsung's own log-to-linear 1D LUT; the 35 spaces added 2026-10-14 – HelmGen, nine camera gamuts, O-Log2, ten RGB working spaces, DIN99/DIN99c, Hunter Rd,a,b, Msh, sCAM, Kim 2009, IPT Ragoo 2021, ICtCp HLG, IPT-PQ-C2, IaPbP, oRGB, IHLS, Prismatic, LogLuv, Y′D′zD′x – each cite the reference their row was computed with: colour-science 0.4.7, coloraide 8.13, colorjs.io 0.7.1, LibTIFF tif_luv.c, SMPTE ST 2085/2128, OPPO's O-Log2 CTL, or the paper's own equations where no implementation exists; on 2026-10-18 eight more rows anchored HCT, HSLuv, HPLuv and HelmGen to their authors' own reference data): **216 cited points across 178 space labels** (`test/refs.js` — the counts in `test/bonafide.js` derive from it at run time). Together with the differential suite this covers **all 205 graph spaces — zero gaps**. Each row states its `kind` – published (printed by the source, or its author's reference data: 85), implementation (computed by the named implementation from the cited definition: 117), computed (plain arithmetic from the definition: 14) – and the whole set ships as `conformance.json` for other libraries' tests.

Tolerance: each channel within 1e-4 of its span (`TOL` in `test/refs.js`: 0.01 L*, a tenth of a 10-bit code), so an error visible in a 12-bit encoding fails; the largest gap between faithful sources is 3.6e-5 of span (DJI's 4-decimal D-Gamut inverse). Until 2026-10-18 the rule was 0.01 + 0.2 % of the value in channel units, which on small-range channels checked almost nothing (23 % of XYB's X span). Three rows carry their own wider `tol`, each with its reason in `src`: DIN99o LCh against DIN99b's rounded factors, dsh's wavelength against colour-science's 1 nm sampling, kelvin against exact Planck. The tighter rule found one library defect: hdr-CIELAB and hdr-IPT omitted the 0.02 lightness offset Fairchild & Wyble specify (2010, p. 322); fixed 2026-10-18 in the JS and the GLSL.

A cited anchor is exactly that — an anchor: it pins the formula at one (occasionally a few) points, which cannot exercise every nonlinear branch or boundary the way the differential grid does. The tier each space sits in is stated here so the guarantee is never stronger than the evidence.

Oracles, in order of preference:

- **colour-science 0.4.7** (Python) — cinema/camera logs, CAM02/CAM16 families and their UCS/LCD/SCD variants, ZCAM, Hellwig2022, OSA-UCS (forward and Newton inverse), IPT, IgPgTg, Yrg, hdr-CIELab/hdr-IPT, DIN99…, Hunter Lab and Rd,a,b (D65 Ka/Kb)
- **The authors' own reference data** — HSLuv/HPLuv (the hsluv project's snapshot-rev4.json), HCT (Google material-color-utilities' hct_test.ts), HelmGen (helmlab's reference-1.0.json)
- **colorjs.io v0.5.2** — HCT, CAM16-JMh, HSLuv/HPLuv, sRGB↔XYZ anchors
- **colorjs.io v0.7.1** – HelmGen / HelmGen LCh (Helmlab GenSpace), cross-checked against the author's helmlab 1.0.0 to 1e-13 on the same Bradford-adapted XYZ; `test/index.js` pins eight sRGB points both directions at 1e-9
- **culori v4** — XYB, Okhsl/Okhsv, LCh(D65)
- **Printed spec constants, hand-computed** — ITU-R BT.470/601/709/2020/2100, ITU-T T.871/H.273, SMPTE RP 431-2 / ST 2084 / 240M, IEC 61966, CIE 1960/1964/1976, ACES S-2013-001/S-2016-001, Xerox YES, Kodak PhotoYCC, vendor log-curve whitepapers (ARRI, Sony, Canon, Fujifilm, Nikon, Leica, DJI, Blackmagic, RED, Panasonic, Apple, GoPro, Kinefinity, Xiaomi, OPPO)…

Appearance models (CIECAM02/CAM16 + variants, ZCAM, Hellwig2022, HCT) are validated under the library's exact declared viewing conditions; the conditions are named in each entry's `src` so the number is reproducible.

**Coloroid** is pinned to Nemcsics's published A=70, T=70, V=60 example (Nemcsics 1980, *Color Res. Appl.* 5(2):113–120, [doi:10.1002/col.5080050214](https://doi.org/10.1002/col.5080050214)). No compared JavaScript library implements it, so its corrected limit-color table and fractional-grade interpolation are also guarded by exact ATV↔xyY round-trips and the defining V = 10√Y invariant.

### CIECAM16 and CIECAM97s (added 2026-10-19)

**CIECAM16** (CIE 248:2022) is pinned to colour-science 0.4.7 (`XYZ_to_CIECAM16` / `CIECAM16_to_XYZ`, which cites CIE 248) under the CIE reference conditions ciecam02 and hellwig2022 use (D65 [95.05, 100, 108.88], L_A 318.31, Y_b 20, average): eight rows. Two sit inside the 0.26–150 band of the adapted cone signals, where CIECAM16 equals CAM16 under the same conditions (colour's docstring example J 41.7312, and sRGB red). Six exercise the f_e extension, forward and inverse, where CAM16 under the same conditions differs: XYZ [0.1901, 0.2, 0.2178] gives J 2.6615 (CAM16 3.2600), [300, 200, 60] gives J 156.6755 (CAM16 151.5865). Every row agrees to 4e-11; round trips hold to 1e-13; the GLSL chunk matches the JS to 4e-15 on both extension branches, beyond what the sRGB-cube GL tests reach. CIE 248 itself is sold by the CIE and was not read: the thresholds q_L = 0.26, q_U = 150 and the form of f_e come from colour-science's implementation. colour-science's own test file also carries an unattributed 4-decimal case (XYZ [60.70, 49.60, 10.29], white [96.46, 100, 108.62], L_A 40, Y_b 16 → J 70.4406) that may be CIE 248's worked example; its origin could not be confirmed, so it is not cited.

**CIECAM97s** (CIE 131-1998) is pinned to the worked example of the CIE TC1-34 final draft that became CIE 131 (Table 4.1, [markfairchild.org/PDFs/CIECAM97s_TC_Draft.pdf](http://markfairchild.org/PDFs/CIECAM97s_TC_Draft.pdf)): Case 1 is the library's own conditions (published row: J 42.44, M 0.49, h 219.4); `test/index.js` checks J, Q, h, C and M of all four cases (two whites, two L_A) to one unit of the printed last digit, and the exact inverse on each. No independent implementation was usable: colour-science, coloraide and colorjs.io have no CIECAM97s; Little CMS 1.19's `cmscam97.c` interpolates the eccentricity between the hue-quadrature values 0/100/200/300 instead of the unique-hue angles, so it was not used. Fairchild's spreadsheet of the table (AppModEx.xls, sheet CIECAM97s, saved 2021-08-27) was decompiled formula by formula: given its two choices – the 4-decimal print of M_B⁻¹ and an eccentricity split at 360° – the shipped pipeline reproduces all of its J, Q, h, C, M and s, four cases, to 9e-13 relative. The library keeps the exact inverse of M_B and eq. 2.21 instead, because the report's own Table 4.1 agrees with them (Case 1 h 219.4: exact inverse 219.43, 4-decimal print 212.28). The inverse is exact: the report's §4.2 approximates Y; here Y is solved by Newton's method (3 steps to 1e-15 over the sRGB cube).

### ACES 2.0 JMh and Hellwig 2022 H–K (added 2026-10-19)

**ACES 2.0 JMh** (`aces2-jmh`) hangs off ACES2065-1, as the ACES 2.0 output transform does: the reference CTL builds its input model with `init_JMhParams(AP0)` (aces-core [Lib.Academy.OutputTransform.ctl](https://github.com/aces-aswf/aces-core/blob/2d7af39344725aaa8ac3bf1746693c9a1d6c4792/lib/Lib.Academy.OutputTransform.ctl), the commit pinned by release v2.0.0+2025.04.04; the 2024-09-05 release's `XYZ_to_Hellwig2022_JMh` states the same model step by step: D = 1, M = 43·N_c·|a,b| with no eccentricity, CAM16_PRI cone matrix, L_A 100, Y_b 20, dim surround, 1.0 = 100 cd/m²). Seven rows pin it to OpenColorIO 2.6.0's `FIXED_FUNCTION_ACES_RGB_TO_JMH_20` with the AP0 primaries and ACES white, run on the CPU both ways in float32: five forward (among them 18% grey → J 44.938602 and scene light at 4× the reference white → J 158.82) and two inverse. A float64 transcription of the CTL agrees with OCIO to 2e-6 relative and with the library to 1e-10. The same transcription shows that the CTL's CAM16_PRI white (0.333, 0.333) cancels under full adaptation (the library builds the cone matrix with white E: identical to 12 digits), and that AP1 input with the AP1 primaries gives the same JMh as the same light through AP0. By design the library is unclamped: the CTL returns JMh 0 for A ≤ 0 and caps the adapted response at 0.99 of its asymptote on the inverse; here A < 0 reads as a negative J and the round trip stays exact.

**Hellwig 2022 H–K** (`hellwig2022-hk`) adds J_HK = J + f(h)·C^0.587, C = 35·M/A_w, to hellwig2022.js under its conditions (Hellwig, Stolitzka & Fairchild 2022, *Color Res. Appl.* 47(5):1096–1104, [doi:10.1002/col.22793](https://doi.org/10.1002/col.22793)). The paper is paywalled and was not read: the formula and its coefficients come from two independent implementations that agree to 1e-10, colour-science 0.4.7 (`XYZ_to_Hellwig2022`, J_HK) and coloraide 8.13.1 (`hellwig` with `hk=True`, its Environment built from the white xy of [95.05, 100, 108.88], L_A 318.31, Y_b 20, average). Three forward rows come from colour-science, two inverse rows from coloraide; colour-science's inverse is right only when C is passed (see errata). The inverse is closed-form, since C depends on M alone. The Python tab's colour-science snippet passes scripts/verify-python.py at 7.3e-14.

Both GLSL chunks match the JS in test/gl.js's float64 tier to ≤ 2.6e-16 and stay finite in its float32 tier.

### Helmlab MetricSpace and Cubehelix (added 2026-10-19)

- **helmlab 1.0.0** (npm, the author's, MIT) – Helmlab MetricSpace (`helmlab-metric`, v21): the author's `new Helmlab().metric.space` (neutral correction and −28.2° rotation on, the coordinates its Helmlab class reports), fed the library's XYZ Bradford-adapted to Helmlab's ASTM D65, agrees with the library to 7e-13 forward and 1.4e-12 inverse; the npm build reproduces the author's reference-1.0.json (its Python reference) to 8e-13, and the library reproduces it within 6e-5 (helmlab maps sRGB with Lindbloom's matrix, the library with CSS Color 4's then Bradford); the neutral-correction knots the library rebuilds from the pipeline match helmlab's neutral-lut.json to its 12 printed decimals (5e-13). colorjs.io 0.7.1 and coloraide 8.13.1 `helmlab-metric` agree with each other to 1e-13 and with the library to 1e-12 once the rotated neutral-correction offset is added back (2,000 random sRGB colors): both leave out the paper's Stage 10. `test/index.js` pins eight sRGB points and two off-cube XYZ both directions at 1e-9.
- **d3-color 3.1.0** – Cubehelix (`cubehelix`, H, S, L): the library's forward and inverse agree with d3's `cubehelix()` / `.rgb()` to 6e-14 and 1e-12 (of 0–255) over 5,000 random colors each; culori 4.0.2 likewise, coloraide 8.13.1 to 6e-14 on 11 fixed colors both ways. Grays return H = S = 0 (d3: NaN hue, culori: undefined, coloraide: 0). Green 2011's Appendix A Fortran is reproduced to 1e-9 at four fractions of three schemes through H = 120·start − 120 + 360·rotations·λ, S = hue/2, L = λ^γ (`test/index.js`), and one row is computed from it (Fig. 1's scheme at λ = 0.25).

### Venice S-Gamut3 and S-Gamut3.Cine (added 2026-10-19)

Sony's Venice input transforms ([IDT.Sony.Venice_SLog3_SGamut3](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3.ctl), [IDT.Sony.Venice_SLog3_SGamut3Cine](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3Cine.ctl), vendor-supplied, aces-dev v1.3) print an S-Log3 decode and a 10-decimal matrix to AP0, and no primaries or white. OpenColorIO 2.6's `SONY_SLOG3-SGAMUT3(.CINE)-VENICE_to_ACES2065-1` carry the same digits ("Primaries were not provided for this case, only the matrix", SonyCameras.cpp). color-space converts through the primaries colour-science 0.4.7 derived from those matrices at a D65 white. The Academy recipe (primaries + CAT02 to the ACES white) rebuilds Sony's digits to **9.8e-11** and **5.0e-11**; with Bradford it misses by 4.2e-3 and 4.6e-3. So the derivation is consistent with D65 + CAT02, Sony's convention in its other IDTs, but that white is an assumption: Sony does not state it.

| color-space | Official transform (ampas/aces-dev v1.3) | CAT in CTL | Max deviation |
|---|---|---|---:|
| `sgamut3-venice` | [IDT.Sony.Venice_SLog3_SGamut3](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3.ctl) | CAT02 (typed matrix) | 4.3e-3 |
| `sgamut3cine-venice` | [IDT.Sony.Venice_SLog3_SGamut3Cine](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3Cine.ctl) | CAT02 (typed matrix) | 4.5e-3 |

With Bradford swapped into the recipe, both collapse to 1.0e-10. Against colour-science 0.4.7's `RGB_COLOURSPACE_VENICE_S_GAMUT3(_CINE)`: 4.6e-15 of Y, code to XYZ and back. Its Python snippets pass `scripts/verify-python.py` at 7.3e-15 and 8.7e-15. Against OpenColorIO 2.6.0's builtins, the library re-adapted by CAT02 agrees to 2.3e-6 (OCIO's float32 CPU path), and the OCIO inverse returns the code to 3.7e-6.

### ADX10 and ADX16 (added 2026-10-19)

[SMPTE ST 2065-3:2020](https://pub.smpte.org/doc/st2065-3/20200909-pub/st2065-3-2020.pdf) defines the codes from Academy Printing Density (Eqs. 1 and 2) and ADX16 = 16·ADX10 (Eq. 3). It defines no conversion to ACES. That conversion is the Academy's [ACEScsc.Academy.ADX10_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/ADX/ACEScsc.Academy.ADX10_to_ACES.ctl) / [ADX16_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/ADX/ACEScsc.Academy.ADX16_to_ACES.ctl). [test/aces-vendor.js](../test/aces-vendor.js) transcribes it verbatim, with `interpolate1D` as the CTL Manual defines it. Over an 11³ code grid the library matches it **bit for bit** (0 deviation). Wherever the CTL is one to one, the inverse returns the code to 1.9e-12 (ADX10) and 4.7e-13 (ADX16 at ADX10's densities). In 30 of those grid codes, CDD_TO_CID's negative term takes a channel below the table's −0.19, and the CTL holds that channel's log exposure at −6. There the inverse returns a code the CTL decodes to the same color (≤ 1.6e-14). Past ADX10's densities, float64 limits ADX16's code round trip where one channel sits at the table's foot and another is 16 decades brighter: [0.5, 0, 1] comes back 6.8e-4 of the span off, though it still decodes to the same color.

OpenColorIO 2.6.0's `ADX10_to_ACES2065-1` (a half-domain LUT, float32) agrees to 3.3e-6, and its inverse returns the code to 1.7e-6. `ADX16_to_ACES2065-1` agrees to 3.8e-6 below its cap. OCIO clamps log exposure at log10(65504), the half-float maximum, which it reaches near neutral code 31600 of 65535 (density 3.76, 18.5 stops above 18% grey). Below −0.19 it also extends the table's first segment, down to log exposure −10, where the CTL holds at −6 ([ACES.cpp](https://github.com/AcademySoftwareFoundation/OpenColorIO/blob/v2.6.0/src/OpenColorIO/transforms/builtins/ACES.cpp)). color-space follows the CTL in both places.

### Display-referred RGB, YyCxCz and Poirson–Wandell (added 2026-10-19)

- **rec709-display, rec2020-display:** ITU-R BT.1886 (03/2011) Annex 1 with Lb = 0, Lw = 1 (a = 1, b = 0, γ = 2.40): L = V^2.4, extended past 0–1 sign-symmetrically as CSS Color 4's `lin_2020` / `gam_2020` (Editor's Draft 2026-10-09, §19). Pinned to colour-science 0.4.7 `eotf_BT1886` / `eotf_inverse_BT1886` (positive inputs; colour clamps V + b at 0), coloraide 8.13.1 `rec709` / `rec2020` (both BT.1886 display-referred, sign-symmetric), colorjs.io 0.7.1 `rec2020`, and two values CSS Color 4 prints in §10.1: color(rec2020 0.42053 0.979780 0.00579) = lch(85.9017% 166.116 138.207) = color(display-p3 −0.350289 1.00707 −0.144209). All agree to 1e-10, or to the printed digits.
- **rgb-display:** sRGB primaries and D65 with the reference display's pure 2.2 power (IEC 61966-2-1:1999 Introduction, "the simple exponent value of 2,2"; the public 4WD draft of 1998, §2.1 eq. 1, V = (V′ + 0,0)^2,2). Pinned to colour-science 0.4.7 `gamma_function(…, 2.2, 'Mirror')` with the primaries-derived BT.709 matrix, and to 0.1^2.2 = 0.00631 (the piecewise decode gives 0.01002). The 1999 clause 4.1 text itself was not seen; see the space file's notes.
- **ycxcz:** Yy = 116·Y/Yn − 16, Cx = 500·(X/Xn − Y/Yn), Cz = 200·(Y/Yn − Z/Zn), D65 (Monga, Geisler & Evans 2003, eq. 11–13, after Flohr et al. 1993). Pinned by exact rational arithmetic and by NVIDIA FLIP's own `XYZToYCxCz` / `YCxCzToXYZ` (src/cpp/FLIP.h @ d3ab02a4, compiled and run in float32 with the library's D65 passed as its illuminant): agreement to float32 precision, ≤ 4e-6.
- **poirson-wandell:** Xuemei Zhang's S-CIELAB `xyz2opp` matrix for the 2° observer (cmatrix.m, ISETCam @ 17146a9f). Its rows are exact rational arithmetic on that matrix: the MATLAB code was not run (no MATLAB or Octave). A least-squares check, Poirson & Wandell's `lms2opp` times per-cone-scaled Smith–Pokorny cones, reproduces all nine entries within 0.007.
- **Python equivalents:** the colour-science snippets for rec709-display, rec2020-display and rgb-display pass `scripts/verify-python.py` (colour-science 0.4.7, numpy 2.4.3, 14 samples; worst 3.4e-13 of range). colour has no YyCxCz or Poirson–Wandell transform.

### Log-compressed OSA-UCS (added 2026-10-19)

**Log-compressed OSA-UCS (`osaucs-ee`, added 2026-10-19).** The defining paper, Oleari, Melgosa & Huertas, "Euclidean color-difference formula for small–medium color differences in log-compressed OSA-UCS space", JOSA A 26(1):121–134 (2009), [doi:10.1364/JOSAA.26.000121](https://doi.org/10.1364/JOSAA.26.000121), is paywalled and was not read. The formula comes from two full restatements that agree on every constant: Simone, Pedersen, Farup & Oleari, EURASIP J. Image Video Process. 2013:39, eqs. 1–9 (open access, Oleari a co-author, [doi:10.1186/1687-5281-2013-39](https://doi.org/10.1186/1687-5281-2013-39)), and Pant & Farup, "Riemannian formulation and comparison of color difference formulas", Color Res. Appl. 37(6), 2012, eqs. 39–51 (accepted manuscript, [NTNU Open](https://hdl.handle.net/11250/2448324)). Its G, J are Oleari's log-ratio opponent coordinates (the form of JOSA A 21:677, 2004), not MacAdam's cube-root j, g. The rows are `computed`: L_OSA from colour-science 0.4.7 `XYZ_to_OSA_UCS` (the same lightness: offset 14.4, K's y coefficient 2.5643), G, J and the two log compressions by plain arithmetic in a Python transcription written from the papers, not from this library. Two checks do not depend on the library. The D65 10° white's A/B = 0.93662 and B/C = 0.98074 reproduce the printed normalizers 0.9366 and 0.9807. Oleari's G, J agree in sign with colour-science's MacAdam g, j at the sRGB primaries and secondaries, and within 3.4 units. No printed L_E, G_E, J_E or ΔE_E value was accessible, so there is no `published` row.

### Reference-link audit

All unique `@see` links across the space files (121 across 161 files at this revision — Wikipedia citations now live in `@wiki`, one canonical article per space) were liveness-checked and content-verified (2026-07). 15 dead or mis-attributed citations were fixed: the four `docs.acescentral.com/specifications/…` → `…/encodings/…` moves, Ottosson's restructured colorpicker anchors (okhsl/okhsv/okhwb), the DIN99d and Coloroid DOIs (both resolved to unrelated papers), the Xerox YES attribution (previously credited to an unrelated 2007 paper; the matrix is Xerox XNSS 289005, 1989), two colour-science readthedocs pages that no longer exist (→ pinned source files), the freieFarbe HLC atlas path, the Leica L-Log manual path, and the German-Wikipedia DIN99 link.

---

## 3. Shader backends (gl/)

The GLSL/WGSL chunks ship the same formulas for the GPU; four layers pin them:

1. **Float64 differential** — chunks are written in a restricted GLSL dialect that transforms mechanically to JS, so every declared edge and every composed rgb↔space path is evaluated in float64 and compared to the scalar library at 1e-6 normalized tolerance ([test/gl.js](../test/gl.js)).
2. **WebGL2 compile** — all 618 edge and rgb↔space sources compile as fragment shaders through a browser WebGL2 implementation (ANGLE/SwiftShader in CI) via [test/gl-gpu.html](../test/gl-gpu.html). This includes the LUT-backed Munsell chunk.
3. **WGSL grammar** — the same 618 sources, mechanically translated, parse clean under the full `wgsl_reflect` grammar in CI ([test/wgsl.js](../test/wgsl.js)); the browser page additionally validates them on a live WebGPU device when one is available.
4. **Float32 stress** — the same dialect re-evaluated with every operation rounded to binary32, under round-to-nearest, contracted multiply-add and both directed roundings. Every source must stay finite at black, white and the six primaries and secondaries, and ryb and cct-duv must stay within 1e-3 of range ([test/gl.js](../test/gl.js)).

### GPU float32

GPUs run these chunks in float32 (WebGL2 `highp`, WGSL `f32`). A 2026-10 run of all 610 sources on lavapipe (Mesa's CPU Vulkan driver, via wgpu) found defects that float64 cannot show, and the float32 stress above found one more. These five were fixed in the chunks; the scalar library is unchanged.

- **CAM02 (ciecam02, cam02-ucs/lcd/scd) gave NaN at black.** The achromatic signal A cancels to a few ulps below zero, and `pow` of a negative base is NaN. A is now floored at 0, which changes nothing where the scalar library is defined.
- **HSLuv and HPLuv gave NaN/Inf at white.** The 1e-7 white margin (`99.9999999`) rounds to exactly 100.0 in float32, so the guard never fired. The chunk margin is now 1e-4, about 13 float32 ulps at 100.
- **OkHSL's 1e-7 white margin was under two ulps.** The directed-rounding stress found it, not lavapipe. It is now 1e-6.
- **ryb missed out-of-cube targets.** Its 1e-6 Jacobian step left about 6% error in float32 (magenta B came out 0 instead of 62.1). The step is now 1/16, which is exact because the trilinear is linear along each axis.
- **cct-duv's normal tilted.** The secant subtracted two locus points 10–250 mK apart (Duv at #0000ff read −0.0090 instead of −0.0283). It is now written in a cancellation-free closed form that matches the float64 secant to about 2e-8.

Some limits remain and are documented rather than guarded:

- **OkHSL, OkHSV and OkHWB at pure blue.** Blue sits on a branch test inside Ottosson's `computeMaxSaturation` within half a float32 ulp, so the GPU can take the other branch. rgb→okhsl S reads 100 instead of 102.92, rgb→okhsv S reads 92.40 instead of 108.74, and the inverse at the float64 S leaves the gamut.
- **Hue at an achromatic input** (for example cam16 at black) takes whatever angle float32 noise points to. It is undefined in float64 too.
- **PQ-based spaces and kelvin's CCT search keep small float32 errors.** Jzazbz→rgb and ICtCp→rgb miss a zero channel of a saturated primary by up to 1.5e-3 of range (0.39 of 255), and kelvin's golden-section CCT is off by up to 2.4e-4 of range.

### HLSL and MSL

`color-space/gl/hlsl` and `color-space/gl/msl` are not separate formulas. [naga](https://github.com/gfx-rs/wgpu/tree/trunk/naga) 30.0.1 (npm `naga-wasm` 30.2.0, pinned) parses and validates the WGSL above and writes HLSL and MSL with the backends wgpu runs on DirectX and Metal; upstream compiles those backends' output with DXC, FXC and `xcrun metal` in CI. [gl/naga.js](../gl/naga.js) only renames: naga appends `_` to a function name ending in a digit (the name is restored when free), and the shared helpers whose trailing `_` naga strips become `colorspace_cbrt`, `colorspace_spow`, `colorspace_atan2` and `colorspace_mod`. HLSL and MSL output does not depend on the shader model (5_0–6_2) or Metal version (1.0–3.0) setting, apart from MSL's `// language:` header line (checked over every source).

- **Tier 1, in `npm test`** ([test/hlsl.js](../test/hlsl.js)): every source above (618 on 2026-10-03) translates to both languages; each entry and digit-ending function keeps its name; no output contains `fmod`, `%`, `mul()`, a matrix type or naga's integer div/mod helpers, so GLSL's floored `mod` survives as `colorspace_mod`. The Munsell LUT keeps its texture (HLSL `register(t0)`, an extra MSL entry parameter). rgb→oklch and slog3→rec709 are pinned by hash. The vendored site copy of naga-wasm must be byte-identical to the pinned package and write the same MSL.
- **Executed once (2026-10-03, not in CI):** the shipped HLSL, wrapped in a one-thread compute entry, was compiled by glslang 15.1.0 (Khronos's HLSL front end) to SPIR-V and run on lavapipe (llvmpipe, LLVM 20.1.2). Each source ran on 14 inputs and was compared with the float64 library, range-relative. The tolerance counts below leave out the four achromatic inputs (black, white and two grays), where hue is undefined.
  - 600 of the 614 non-LUT sources ran. The other 14 are the const-table spaces coloroid, dsh, ostwald and wavelength: glslang rejects naga's `ConstructarrayN` initializer, and it also rejects upstream naga's own DXC/FXC-validated snapshot of that construct.
  - No output was NaN or Inf at any input, including black, white and the grays.
  - 592 of 600 are within 1e-2 of range, 588 within 1e-3, 576 within 1e-4 and 423 within 1e-6.
  - Everything above 1e-3 is a limit already listed above: OkHSL, OkHSV and OkHWB at pure blue (8 sources, up to 0.44 of range — okhsl→rgb G reads −110.9 instead of 0), and ictcp, jzazbz, jzczhz and izazbz → rgb (1.1e-3 to 1.5e-3).

  So HLSL inherits exactly the float32 limits documented above and no new ones; the five fixed defects are fixed in it too. MSL is written from the same validated module but was not executed: there is no Metal device here.
- **Tier 3, not a deploy gate** ([.github/workflows/shaders.yml](../.github/workflows/shaders.yml), [test/shader-compile.js](../test/shader-compile.js)): every source is compiled with DXC `cs_6_0` as HLSL 2018 and 2021, with FXC `cs_5_0`, and with `xcrun metal` at naga's header std and at the SDK default. This follows upstream naga's recipe, and it is unverified until its first run.
- **Metal compiles with fast math by default.** Apple documents `MTLCompileOptions.fastMathEnabled` as defaulting to `true` (now `mathMode`); `.fast` makes "aggressive, potentially lossy assumptions about floating-point math" ([Apple: fastMathEnabled](https://developer.apple.com/documentation/metal/mtlcompileoptions/fastmathenabled), [MTLMathMode](https://developer.apple.com/documentation/metal/mtlmathmode)). The float32 figures above assume IEEE-honoring math, so use `mathMode = .safe` to rely on them.

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
| `sgamut3cine` | [ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/sony/ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES.ctl) | CAT02 | 4.4e-3 |
| `logc3` | [ACEScsc.Academy.LogC_EI800_AWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/arri/ACEScsc.Academy.LogC_EI800_AWG_to_ACES.ctl) | CAT02 | 4.3e-3 |
| `clog2` | [ACEScsc.Academy.CLog2_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog2_CGamut_to_ACES.ctl) | CAT02 | 4.8e-3 |
| `clog3` | [ACEScsc.Academy.CLog3_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog3_CGamut_to_ACES.ctl) | CAT02 | 4.9e-3 |
| `vlog` | [ACEScsc.Academy.VLog_VGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/panasonic/ACEScsc.Academy.VLog_VGamut_to_ACES.ctl) | Bradford | 1.0e-10 |
| `log3g10` | [ACEScsc.Academy.Log3G10_RWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/red/ACEScsc.Academy.Log3G10_RWG_to_ACES.ctl) | Bradford | 1.0e-10 |

The two Sony matrices are additionally pinned to the digits Sony itself typed into
[IDT.Sony.SLog3_SGamut3.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3.ctl) /
[IDT.Sony.SLog3_SGamut3Cine.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3Cine.ctl):
the Academy's matrix recipe (primaries + CAT02) reproduces Sony's published matrices to
**5e-11**, and color-space's own matrices are derived from the same vendor primaries.

### Why not zero

The residuals are documented conventions, not formula error:

- **Chromatic adaptation transform.** The Sony/ARRI/Canon CTLs adapt the camera's D65
  white to the ACES white with **CAT02**; color-space routes through its XYZ D65 hub and
  adapts with **Bradford**, matching colorjs.io and the CSS Color 4 convention, derived
  from the two white points (D65 x 0.3127, y 0.3290 → ACES x 0.32168, y 0.33767) the way
  the CTL library's `calculate_cat_matrix` does. The Panasonic and RED CTLs default to
  Bradford and agree to 1.0e-10. Swapping Bradford into a CAT02 recipe collapses its
  residual to the vendor-curve floor: 1.5e-10 (S-Log3, S-Gamut3.Cine), 1.0e-10 (C-Log3),
  5.3e-9 (C-Log2), 7.1e-6 (LogC3 — the 6-decimal EI 800 curve constants in
  `spaces/logc3.js` versus the CTL's 10-decimal ones). The CAT02-vs-Bradford difference itself peaks at ~0.5% of
  a point's dominant component at gamut extremes.
- **AP1→AP0 digits.** The 1.0e-10 floor is the 10-decimal AP1→AP0 matrix color-space
  carries (≤ 4.8e-11 per element from the exact primaries-derived one).
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

## Python equivalents

The site's Python tab ([web/js/python.js](../web/js/python.js)) shows colour-science and
OpenCV code that reproduces color-space's numbers. A snippet ships only after it has been
run and compared against color-space itself; a space with no equivalent gets no snippet.

### Method

[scripts/verify-python.py](../scripts/verify-python.py) has node import `index.js` and
`web/js/python.js`, so it checks the snippets exactly as the page shows them. Each one runs
after its preamble with only the sample swapped in (`rgb`, `v`, or the `cv2.imread()` image).

- **Samples:** 14 sRGB colors (primaries, secondaries, gray, white, mid-tones, near-black).
  OpenCV routes add black, the sRGB linear toe and 24 seeded random colors (43 in all).
- **Error:** max |Python − color-space| ÷ the channel's range from `data.json`. Hue channels
  are compared on the circle and skipped on grays. Inverse snippets (space → sRGB) are
  scored in sRGB code values ÷ 255.
- **Pass:** ≤ 1e-3 of range. An entry over that must carry a one-line caveat in the module.
  A caveat on an entry that now passes is reported as stale. Either one exits 1.
- It is not part of `npm test`, because it needs Python:

  ```sh
  python3 -m venv .venv && .venv/bin/pip install colour-science==0.4.7 numpy scipy opencv-python-headless
  .venv/bin/python scripts/verify-python.py
  ```

The harness is a condensed version of the 2026-10-02 research harnesses. Those also swept
the OpenCV routes over all 16,777,216 8-bit colors against a numpy port of the library.
lch-d65 and lchuv were swept through their Lab and Luv input; their polar step is plain numpy.

### Measured (2026-10-02)

Versions: colour-science 0.4.7, OpenCV 5.0.0 (opencv-python-headless 5.0.0.93), numpy 2.4.6,
color-space 3.1.0.

| | snippets | pass | caveat |
|---|---|---|---|
| colour-science, rgb → space | 130 | 127 | 3: cct-duv, wavelength, munsell |
| colour-science, space → sRGB | 35 | 32 | 3: oklab, oklch (≤ 0.94 code value), prophoto (≤ 0.49) |
| OpenCV `cvtColor`, rgb → space | 10 | 10 | — |

- **No equivalent in colour-science 0.4.7 (32 spaces):** checked against the installed
  package source, so these spaces get no snippet. yuv still gets an OpenCV route.
  The six camera logs added after this run (applelog2, flog2c, gplog2, kinelog3,
  samsunglog, ilog) have not been checked yet, so they have no snippet either.
- **85 of the 127 passing rgb → space snippets agree to better than 1e-10.** 18 sit between
  1e-5 and 8.3e-4. Several of those trace to colour's own data: it ships the rounded
  published ProPhoto/RIMM and DJI D-Gamut matrices, Ottosson's original XYZ→LMS matrix for
  Oklab, a `+ 0.02` in Fairchild's hdr-CIELab/hdr-IPT lightness, and rounded DIN99o
  constants (303.67 and 23.0).
- **Caveats:**
  - **cct-duv:** matches to 7.9e-9 inside the defined CCT domain (1000–25000 K, |Duv| ≤ 0.05).
    Outside it, color-space clamps T and colour's Krystek solver diverges.
  - **wavelength:** matches to 7.1e-4 except on purples. There colour returns −(complementary
    wavelength), while color-space snaps to 380 or 700 nm.
  - **munsell:** value matches. Hue and chroma interpolate the renotation data differently,
    and colour raises on 4 of the 14 samples.
- **acescg:** the research run found color-space's D65 → ACES matrix 3e-4 off the ACES white
  (white came out as B = 1.0003). That made the acescg and acescct inverses and the acesproxy
  forward snippet convention-diffs. `spaces/acescg.js` now derives Bradford D65 → ACES white
  (x 0.32168, y 0.33767), and all three agree exactly: 3e-13, or the same 10-bit code. The
  harness flagged the stale caveats, and they were removed.

### Added (2026-10-14)

Versions: colour-science 0.4.7, OpenCV 5.0.0, numpy 2.5.4, color-space 3.2.0 with the 3.3.0 spaces.

- **29 snippets for spaces added in 3.3.0, all pass:** nine scene-linear camera gamuts
  (awg3, awg4, dwg, rwg, bmdwg, vgamut, sgamut3, dgamut, egamut), ten RGB working spaces
  (ecirgb, widegamut, colormatch, brucergb, betargb, bestrgb, donrgb4, ektaspace, russellrgb,
  dci-p3-plus), din99, din99c, hunter-rdab, msh, scam, kim2009, ipt-ragoo, ictcp-hlg (plus its
  inverse), ihls and prismatic. 13 agree to better than 1e-10, and the worst is dgamut at 8.9e-5,
  from colour's printed D-Gamut matrices.
- **The full re-run passes:** 159 rgb → space, 36 space → sRGB and 10 OpenCV snippets, with the
  same 6 caveats as above.
- **No equivalent (7 more spaces):** helmgen and helmgenlch (Helmlab, 2026), orgb, iapbp, iptpqc2
  (SMPTE ST 2128), ydzdx (colour lists SMPTE ST 2085 only as a label in its H.273 tables) and
  logluv. colour has none of them. logluv and ydzdx can be composed from colour's u′v′ and PQ
  (both match to 1e-14), but only by hand-coding each format's own constants. yuv and oklrab
  are left out for the same reason.

### What the snippets encode

colour-science conventions:

- The preamble decodes sRGB and converts through `'ITU-R BT.709'`, whose matrix colour
  derives from the primaries, as CSS Color 4 and color-space do. colour's `'sRGB'`
  colourspace carries the rounded 4-decimal IEC matrix, which costs about 1e-4.
- Bradford is passed explicitly, because colour defaults to CAT02.
- `colour.convert` is never used: it needs networkx and returns the 0–1 reference scale.
- DIN99d applies Cui et al.'s X′ = 1.12X − 0.12Z step, which colour's `DIN99d` method leaves out.
  DIN99c applies X′ = 1.1X − 0.1Z the same way.
- ECI RGB v2, Best RGB, Don RGB 4, Ekta Space PS 5 and Russell RGB are built as
  `RGB_Colourspace` from color-space's primaries (and Russell's 5500 K white). colour derives
  the first four from colorant XYZ rounded to 3 decimals (0.670103 for ECI red), and gives Russell
  RGB a CIE D55 white. Its stock datasets would be off by up to 4.9e-3. Bruce RGB, which colour
  lacks, is built the same way.
- Kim2009 takes absolute XYZ: the relative white is placed at L_w = 64/π cd/m², 5× the
  adapting luminance, as in `spaces/kim2009.js`.
- HCT is composed from CAM16 under Material's viewing conditions plus CIE L*, because colour
  has no HCT.
- Munsell scales Y by 0.975, because color-space's value uses the 1943 Newhall (MgO = 100)
  polynomial.
- kelvin, cct-duv, wavelength, dsh and munsell also need scipy; the requirement line adds it.

OpenCV (`cvtColor`) rules:

- `cv2.imread` returns BGR, so the preamble flips it to RGB.
- Inputs are float32 in 0–1. float64 is rejected, and 0–255 floats silently clip in Lab.
- cv2 Lab and Luv are D65, so they map to `lab-d65` and `luv` only; `lab` (D50) has no
  cv2 route.
- The float sRGB `RGB2Lab` path interpolates a 33³ table and is off by up to 0.0019 of
  range, so the snippet linearizes first and uses `LRGB2Lab`.
- `RGB2GRAY` is BT.601 luma, not color-space's `gray` (luminance); `gray` uses the Y row
  of `RGB2XYZ` on linear input.
- uint8 YUV clips V for saturated colors, so only the float route is offered.
- Oklab exists only on OpenCV's unreleased 5.x branch, not in 5.0.0, so it gets no snippet.

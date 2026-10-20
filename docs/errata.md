# Errata in published color sources

These are errors that color-space found or confirmed while implementing published sources: papers, books, vendor specifications, application notes and reference implementations. Each entry gives the value as printed, the correct value and the reason. It also points to two places in this repository: the code comment that records the error, and the test that pins the correct value. Entries without a pinning test say so. Sources that are online were re-read on 2026-10-18, and an entry says when one was not. Where an author published their own correction, the entry credits it. To report an erratum, or to dispute one, open an issue at https://github.com/colorjs/color-space/issues and give the source, its page or table, and the value as printed.

## Errors in published sources

### Nemcsics 1979: Coloroid basic colours, Table I

- **Source:** A. Nemcsics, "Colour Dynamic Requirements and the Coloroid System", *Periodica Polytechnica Architecture* 23(1), 1979. Table I is on pp. 66–67: "The 48 basic colours and basic hues of COLOROID expressed in CIE units" ([scan](https://pp.bme.hu/ar/article/view/2395)).
- **How each row checks itself:** eλ = x̄λ + ȳλ + z̄λ, xλ = x̄λ/eλ and yλ = ȳλ/eλ. Each angle φ comes with its tg φ or ctg φ. φ is measured from the Illuminant C white (row 10 gives 59.0°).

| A | Column | As printed | Correct | Why |
|---|---|---|---|---|
| 14 | tg φ | 0.9330 | 0.9930 | tg 44.8° (the row's φ); the row's ctg φ, 1.0070, is its reciprocal |
| 15 | yλ | 0.49052 | 0.49116 | ȳλ/eλ = 0.876749/1.785074 |
| 16 | yλ | 0.43035 | 0.48036 | ȳλ/eλ = 0.860368/1.791104 |
| 24 | ȳλ | 0.774014 | 0.744014 | the row's own eλ 1.779484, xλ 0.58128 and yλ 0.41811 follow from 0.744014 to 1e-5; the CIE 1931 table gives ȳ ≈ 0.744 at 591.06 nm |
| 34 | xλ | 0.53962 | 0.55963 | x̄λ/eλ = 0.689620/1.232286; this puts the point on the purple line through rows 32 (625 nm) and 50 (450 nm) at the printed yλ 0.22631 |
| 40 to 45 | φ | 43.2, 54.6, 65.8, 76.8, 86.8, 95.8 | −43.2, −54.6, −65.8, −76.8, −86.8, −95.8 | the rows' own tg φ or ctg φ signs and their chromaticities give negative angles; rows 33 to 35 and 46 print the sign |
| 62 | φ | 125.4 | 160.2 | the row's own tg φ, −0.3600, is tg 160.2°; 125.4 is row 65's angle |
| 73 | xλ | 1.37838 | 0.37840 | x̄λ/eλ = 0.606873/1.603793 |

- **Proof:** the table in `spaces/coloroid.js` derives each row's xλ and yλ from x̄λ, ȳλ and z̄λ (comment at `spaces/coloroid.js:55-60`; rows 15, 16, 24, 34 and 73 are at lines 68, 69, 74, 81 and 107). The test `coloroid: corrected Nemcsics table (ATV exact)` pins Nemcsics's A=70, T=70, V=60 example, an ATV↔xyY round trip and row 24. It does not pin every row. φ, tg φ and ctg φ do not enter the conversion, because hue is found from xλ and yλ (`spaces/coloroid.js:24-29`). The library's unused φ column still reads 152.4 for row 62.
- **Fixed 2026-10-18:** row 24 had been rebuilt from the misprinted ȳλ (xλ 0.57166, yλ 0.42775), 0.0136 in xy from the printed limit color; it now holds the printed xλ, yλ and eλ, in the JS and the GLSL chunk.
- **Status:** found here. The 2015 port recorded the φ signs, row 62 and row 73. The 2026 audit recomputed rows 15, 16 and 34, and rows 14 and 24 were found in 2026-10. Not reported. Re-checked online against the scan.

### Bourgin 1995: Color spaces FAQ, §8.10 Kodak Photo CD YCC

- **Source:** David Bourgin, "Color spaces FAQ", Usenet comp.graphics and news.answers, posted 1995-04-08 (last updated 1995-03-06), §8.10. Copies: [1995 posting](https://discmaster.textfiles.com/view/10567/HPAVC%20CD-ROM.iso/pc/FAQSYS18.ZIP/FAQS.DAT/COLORS.FAQ), [ilkeratalay.com](https://www.ilkeratalay.com/colorspacesfaq.php).
- **As printed:** `f(t)=1.099*t^0.45-0.999 if t>=0.018` and `f(t)=-1.099*abs(t)^0.45+0.999 if t<=-0.018`.
- **Correct:** the offset is 0.099, as in the Rec. 709 curve 1.099·t^0.45 − 0.099, so that f(1) = 1. As printed, f(1) = 0.1, and reference white encodes to luma 18 instead of 182.
- **Proof:** `spaces/photoycc.js:34-35` (the note) and `:41-44` (the curve). The test `bona-fide reference values` (entry `photoycc`: linear white → Yc 181.883) pins the positive branch.
- **Status:** found here (2026-10). Not reported: according to [Poynton's note](https://web.archive.org/web/20250731160806/https://poynton.ca/notes/Timo/Concerning_Bourgin.html), Bourgin agreed to withdraw the FAQ in favour of Poynton's GammaFAQ and ColorFAQ. Copies remain online. Re-checked online in both copies.

### Poynton 1996: *A Technical Introduction to Digital Video*, p. 178

- **Source:** Charles Poynton, *A Technical Introduction to Digital Video*, Wiley, 1996, first printing, p. 178, section "Kodak PhotoYCC", and Eq. 9.12.
- **As printed:** 189, the 8-bit luma code of reference white.
- **Correct:** 182. Yc = (255/1.402)·Y′, which is 181.88 at Y′ = 1.
- **Proof:** `spaces/photoycc.js:31-33`. The test `bona-fide reference values` (entry `photoycc`: linear white → Yc 181.883) pins it.
- **Status:** confirmed. Poynton corrected it himself in his errata to the first printing, in an entry dated 1998-10-16: "change 189 to 182 … In Eq. 9.12, change the subscript 189 to 182" ([errata, archived](https://web.archive.org/web/20250802212221/https://poynton.ca/notes/TIDV/Errata/Errata_1.html)). The errata page was re-checked online. The book was not.

### HunterLab: Application Note AN 1016, Hunter Rd,a,b

- **Source:** HunterLab, "Hunter Rd, a, b Color Scale – History and Application": AN 1016.00 ([PDF](https://www.hunterlab.com/media/documents/duplicate-of-an-1016-rdab.pdf), Figure 1, p. 2) and its 2012 update AN 1016.01 ([PDF](https://hunterlabdotcom.files.wordpress.com/2012/07/an-1016-hunter-rd-a-b-color-scale-update-12-07-03.pdf), p. 3). Both versions print both errors below.
- **As printed (1):** bRd = Kb·f(Y)·(Y/Yn − Y/Yn), which is zero for every color.
  **Correct:** bRd = Kb·f(Y)·(Y/Yn − Z/Zn), the counterpart of aRd = Ka·f(Y)·(X/Xn − Y/Yn). colour-science 0.4.7 implements it this way.
- **As printed (2):** f(Y) = 0.51·(21 + 0.2·Y)/(1 + 0.21·Y).
  **Correct (probable):** f(Y) = 0.51·(21 + 0.2·Y)/(1 + 0.2·Y). With the numerator's coefficient, f(100) = 0.9957 ≈ 1. With 0.21, f(100) = 0.950. colour-science 0.4.7 also uses 0.2. Hunter's original definition was not re-checked.
- **Proof:** `spaces/hunter-rdab.js:25-28`. The test `bona-fide reference values` (entries `hunter-rdab`) pins b = 17.475 and a = 57.09 for colour-science's docstring XYZ. With 0.21, a would be 55.14.
- **Status:** noted here. colour-science already implements both correctly, without comment. Reported to HunterLab support by email (2026-10-20). Re-checked online in both PDFs.

### Kinefinity 2025: KineLOG3 Technical Specifications

- **Source:** Kinefinity, "KineLOG3 Technical Specifications", 2025-09-24: the [web page](https://kinefinity.com/kinelog3-technical-specifications) and two PDF versions ([copies](https://github.com/thatcherfreeman/dwg-transforms/tree/master/specs)).
- **As printed (1):** "the 0% reflectance value corresponds to an IRE of 0.09".
  **Correct:** 9.29 IRE. A 0% input encodes to d = 0.092864. The same sentence's 39.2 (18%) and 57.2 (90%) are code × 100, so 0.09 is the code value, not IRE.
  **Status:** found here. The live page and both PDF versions still print it. Reported to Kinefinity support by email (2026-10-20).
- **As printed (2), first PDF version only:** the Kinefinity Wide Gamut blue primary has y = −0.2282, the red primary's y with a minus sign.
  **Correct:** −0.2236, as printed in the revised version and on the live page. It agrees with all three published 4-decimal matrices to 5e-5.
  **Status:** confirmed. Kinefinity corrected it in the revised specification.
- **Proof:** `spaces/kinelog3.js:25-34`. The test `kinelog3: KineLOG3 / Kinefinity Wide Gamut (revised spec)` pins 0% → 9.3 IRE, the revised primaries to 1e-9 and the KWG → XYZ matrix to 5e-5.
- Re-checked online: the live page, and both PDF versions in the copies linked above. Their byte identity with Kinefinity's originals is not verified.

### colour-science: DIN99c and DIN99d from XYZ

- **Source:** colour-science 0.4.7 and develop (2026-10-18), `colour.XYZ_to_DIN99(XYZ, method='DIN99c' | 'DIN99d')` ([source](https://github.com/colour-science/colour/blob/develop/colour/models/din99.py)). Its docstring cites Cui et al. (2002).
- **As implemented:** XYZ → CIELAB → `Lab_to_DIN99`. The X′ step is missing.
- **Correct:** Cui et al. 2002 ([doi:10.1002/col.10066](https://doi.org/10.1002/col.10066)) apply X′ = 1.1·X − 0.1·Z (DIN99c) or X′ = 1.12·X − 0.12·Z (DIN99d) to the sample and to the white before CIELAB. As implemented, sRGB blue's DIN99c a99 is 31.86 instead of 14.29. For the docstring's XYZ, DIN99d a99 is 31.42 instead of 35.07.
- **Proof:** `spaces/din99d.js:27-30` and `spaces/din99c.js:24-31`. The tests `din99d: DIN99d (Cui 2002, with X-correction)` and `bona-fide reference values` (entries `din99c`, `din99d`) pin it.
- **Status:** found here. Reported: [colour-science/colour#1424](https://github.com/colour-science/colour/issues/1424) (2026-10-19). The colour-science source was re-checked online and 0.4.7 was run. Cui et al. 2002 is paywalled and was not re-checked online; the X′ step is also described in [de.wikipedia's DIN99 article](https://de.wikipedia.org/wiki/DIN99-Farbraum).

### colour-science: ECI RGB v2, Best RGB, Don RGB 4 and Ekta Space PS 5 primaries

- **Source:** colour-science 0.4.7 and develop, `RGB_COLOURSPACES` ([datasets](https://github.com/colour-science/colour/tree/develop/colour/models/rgb/datasets)).
- **As implemented:** primaries are xy computed from colorant XYZ rounded to 3 decimals. For example, the ECI red is 0.670103 = 0.650/0.970.
- **Correct:** the designers' values. eciRGB uses R(0.67, 0.33) G(0.21, 0.71) B(0.14, 0.08), the [ICC registry](https://registry.color.org/rgb-registry/ecirgb) values per ISO 22028-4. The other three use the values that [Lindbloom's table](http://www.brucelindbloom.com/WorkingSpaceInfo.html) prints and that the profiles' colorant tags give. The largest xy errors are 3.3e-4 for ECI RGB v2, 8.4e-4 for Best RGB, 4.3e-4 for Don RGB 4 and 4.8e-4 for Ekta Space PS 5.
- **Proof:** `spaces/ecirgb.js:24-27`, `spaces/bestrgb.js:24-28`, `spaces/donrgb4.js:24-27` and `spaces/ektaspace.js:24-28` hold the designers' values. The `bona-fide reference values` entries for these spaces were computed from them. Their tolerance (0.01 + 0.2%) would also pass colour-science's stock values for three of the four spaces, so no test pins the difference yet.
- **Status:** found here. Reported: [colour-science/colour#1425](https://github.com/colour-science/colour/issues/1425) (2026-10-19). The colour-science sources, Lindbloom's table and the ICC registry were re-checked online. The ICC profile tags were not.

### CIE TC1-34 1998 / Fairchild: CIECAM97s Table 4.1 and its spreadsheet, eccentricity and hue quadrature from blue to red

- **Source:** CIE TC1-34, "The CIE 1997 Interim Colour Appearance Model (Simple Version), CIECAM97s", final draft, April 1998 (published as CIE 131-1998), §2.3 eqs. 2.21–2.22 and Appendix Table 4.1 ([PDF](http://markfairchild.org/PDFs/CIECAM97s_TC_Draft.pdf)); M. D. Fairchild, AppModEx.xls, sheet CIECAM97s, the spreadsheet of those examples the report points to ([xls](http://markfairchild.org/files/AppModEx.xls), saved 2021-08-27).
- **As computed:** for hues between blue (237.53°) and red (20.14° + 360°) the spreadsheet does not apply eqs. 2.21–2.22 across the interval; it splits it at 360° with e = 0.856 and H = 385.9 there. Table 4.1 prints Case 4's H as 307 (the spreadsheet's 306.87). The spreadsheet also uses the 4-decimal print of M_B⁻¹ (eq. 2.2) in eq. 2.13, which turns the near-neutral Case 1 to h 212.28, C 0.498, against the table's 219.4 and 0.47.
- **Correct:** eq. 2.21 gives e = 0.85649 at 360° and eq. 2.22 gives H = 380.21 (385.9 is what eq. 2.22 gives at 360° with red's e of 0.8 replaced by blue's 1.2); Case 4's H is 306.42, which rounds to 306. The rounded e lowers C and M by up to 0.04 % in that interval (Case 2, the spreadsheet's matrices held: C 61.9618 against 61.9628 by eq. 2.21). With the exact inverse of M_B, Case 1 gives h 219.43 and C 0.474, as the table prints. Table 4.1's s for Cases 2 and 4 (146.98, 180.56) is not reproduced by any of these variants; the equations give 147.00 and 180.58.
- **Proof:** `spaces/ciecam97s.js` (implementation notes). The test `ciecam97s: CIE TC1-34 Table 4.1 (CIE 131), all four cases` pins J, Q, h, C and M of the four cases to the table, and Case 1 in the space; the bona-fide row pins Case 1's h 219.4. H is not computed by color-space, so no test pins it.
- **Status:** found here (2026-10). Reported to Mark Fairchild by email (2026-10-20). Re-checked online against the PDF and the spreadsheet.

### colour-science: Hellwig 2022 inverse from J_HK and M

- **Source:** colour-science 0.4.7 and develop (2026-10-19), `colour.Hellwig2022_to_XYZ` ([source](https://github.com/colour-science/colour/blob/develop/colour/appearance/hellwig2022.py)). It cites Hellwig, Stolitzka & Fairchild (2022) for the J_HK correlate.
- **As implemented:** when the specification gives J_HK, it computes J = J_HK − f(h)·spow(C, 0.587) from the specification's own C, before C is derived from M. Given only M, C is NaN, colour's `spow` returns 0 for it, and J = J_HK: the Helmholtz–Kohlrausch term is dropped without a warning.
- **Correct:** C = 35·M/A_w first (it depends on M alone), then J = J_HK − f(h)·C^0.587. Under hellwig2022.js's conditions, sRGB red (XYZ 41.23908, 21.263901, 1.933082 → J_HK 53.540234, M 86.355273, h 27.402503) inverts to XYZ (50.913, 27.829, 4.031) instead of the input; with C passed as well, it returns the input to 1e-13. The docstring's own example passes C, so it does not show the fault.
- **Proof:** `spaces/hellwig2022-hk.js` (implementation notes) inverts in closed form. The test `bona-fide reference values` (entries `hellwig2022-hk`, hellwig2022-hk → xyz) pins the inverse against coloraide 8.13.1, which derives C from M first.
- **Status:** found here. Reported: [colour-science/colour#1423](https://github.com/colour-science/colour/issues/1423) (2026-10-19); a fix is proposed on a fork ([Rahul-cs50/colour@de3c637](https://github.com/Rahul-cs50/colour/commit/de3c63797e8d945a2115e01a4e6bf8fd06c217a8)), checked here to round-trip. colour-science 0.4.7 was run, and the develop source was re-checked online on 2026-10-19.

### Yıldız 2026: Helmlab, §3.1 Stage 10 (neutral correction)

- **Source:** G. Yıldız, "Helmlab: A Data-Driven Analytical Color Space for UI Design Systems", arXiv:2602.23010v3 (2026-05-06), §3.1 Stage 10 and §2 "Achromatic integrity" ([arXiv](https://arxiv.org/abs/2602.23010)); the same text is in the repository's paper/helmlab.tex at the helmlab 1.0.0 release ([a0d7389](https://github.com/Grkmyldz148/helmlab/blob/a0d7389df929eb6b303673276019a7fcea58584c/paper/helmlab.tex)).
- **As printed:** the correction's PCHIP curve runs "384 gray levels (Y ∈ [0.001, 2.59])" through stages 1–9, "with constant clamping beyond the gray-axis L peak (L_peak ≈ 1.29)"; grays keep chroma < 1e-5 on the 21-step ramp, "worst-case ≈ 3 × 10⁻⁵ for grays at L < 0.05".
- **As released:** helmlab 1.0.0 (Python `MetricSpace._build_neutral_lut`, npm `neutral-lut.json` from `scripts/generate-nc-lut.py`, the code the author's reference values come from) samples Y = 0, ten steps 0.001–0.01, twenty 0.01–0.1 and 226 from 0.1 to 2.0 (255 distinct levels). Gray L rises monotonically with Y – 1.341 at Y = 2, 1.574 at Y = 2.6 – so there is no peak; the curve is held flat from L 1.341 to 2.59. Past black, the first sample is Y = 0.001 (L 0.067), as in the printed range, so between L 0 and 0.067 the curve only interpolates.
- **Consequence:** grays keep up to 3.3e-5 of chroma for Y 0.01–1, 9e-5 for Y 0.001–0.01, 8e-4 below Y = 0.001 (6.3e-4 at sRGB 1/255) and up to 0.073 above Y = 2, where the flat tail no longer follows the gray axis.
- **Proof:** `spaces/helmlab-metric.js` rebuilds the curve as released (implementation notes) and matches neutral-lut.json to 5e-13 and the author's npm MetricSpace to 7e-13; the test `helmlab-metric: vs helmlab 1.0.0, both directions` pins grays from 10/255 up to under 5e-5 of chroma. The residuals above were measured with it.
- **Status:** found here, 2026-10-19. The library follows the released code, since the author's reference values come from it. Reported: [Grkmyldz148/helmlab#4](https://github.com/Grkmyldz148/helmlab/issues/4) (2026-10-19).

### Johnson & Fairchild 2003: S-CIELAB opponent matrix, eq. 1

- **Source:** G. M. Johnson and M. D. Fairchild, "A top down description of S-CIELAB and CIEDE2000", *Color Research & Application* 28(6):425–435, 2003, eq. 1 ([doi:10.1002/col.10195](https://doi.org/10.1002/col.10195); [author copy](https://www.cis.rit.edu/people/faculty/johnson/pub/ciede_scielab.pdf)).
- **As printed:** A = 0.297X + 0.72Y − 0.107Z and C1 = −0.449X + 0.29Y − 0.077Z.
- **Correct:** 0.279 (0.2787336) and +0.077 (+0.0771569), as in Xuemei Zhang's S-CIELAB code, cmatrix.m `'xyz2opp'` ([ISETCam @ 17146a9f](https://github.com/ISET/isetcam/blob/17146a9f0470cc89b58d583851f680187268506d/metrics/scielab/cmatrix.m)). The other seven coefficients match the code to the printed digits.
- **Why:** the XYZ matrix is Poirson & Wandell's cone-opponent matrix (printed beside it as the second matrix of eq. 1) applied to Smith–Pokorny cones. A least-squares scale per cone reproduces all nine code entries within 0.007 and predicts 0.282 and +0.081; 0.297 is 0.015 off and −0.077 has the wrong sign.
- **Proof:** `spaces/poirson-wandell.js` (implementation notes). The bona-fide rows for `poirson-wandell` are computed from the code's matrix; the paper's values are not pinned.
- **Status:** found here (2026-10-19). Reported to Mark Fairchild by email (2026-10-20). Zhang & Wandell's 1996 SID digest, which first printed the matrix, was not checked (not available online).

### CSS Color 4 (Editor's Draft, 2026-10-09): §2 leaf example, the rec2020 value

- **Source:** CSS Color Module Level 4, Editor's Draft of 9 October 2026, §2 "Color Terminology", the example of a leaf measured as lch(51.2345% 21.2 130) and written in five RGB spaces ([draft](https://drafts.csswg.org/css-color-4/#terminology)).
- **As printed:** color(rec2020 0.6295 0.9657 0.3633).
- **Correct:** color(rec2020 0.47428 0.52316 0.41425), by the draft's own §19 sample code (`lin_2020`/`gam_2020`, gamma 2.4) and colorjs.io 0.7.1. The printed green, 0.9657, is a near-saturated value for a color of chroma 21. The example's sRGB, display-p3, a98-rgb and prophoto-rgb values agree with the sample code to 5e-5.
- **Proof:** none pinned in this library; `rec2020-display` is pinned to the same draft's §10.1 lime example instead.
- **Status:** found here (2026-10-19). Reported: [w3c/csswg-drafts#14631](https://github.com/w3c/csswg-drafts/issues/14631).

## Citation fixes

The 2026-07 link audit ([formula-verification](formula-verification.md#reference-link-audit), CHANGELOG 3.0.0) corrected 15 references in this library:

- **Mis-attributed (3):** the Xerox YES matrix had been credited to an unrelated 2007 paper; its source is Xerox XNSS 289005 (1989). The DIN99d and Coloroid DOIs resolved to unrelated papers; they are now [10.1002/col.10066](https://doi.org/10.1002/col.10066) (Cui et al. 2002) and [10.1002/col.5080050214](https://doi.org/10.1002/col.5080050214) (Nemcsics 1980).
- **Moved or dead (12):** four ACES pages (`docs.acescentral.com/specifications/…` moved to `…/encodings/…`), Ottosson's colorpicker anchors for Okhsl, Okhsv and Okhwb, two colour-science readthedocs pages (replaced by pinned source files), the freieFarbe HLC atlas, the Leica L-Log manual and the German Wikipedia DIN99 article.

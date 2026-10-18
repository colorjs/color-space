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
- **Status:** noted here. colour-science already implements both correctly, without comment. Not reported to HunterLab. Re-checked online in both PDFs.

### Kinefinity 2025: KineLOG3 Technical Specifications

- **Source:** Kinefinity, "KineLOG3 Technical Specifications", 2025-09-24: the [web page](https://kinefinity.com/kinelog3-technical-specifications) and two PDF versions ([copies](https://github.com/thatcherfreeman/dwg-transforms/tree/master/specs)).
- **As printed (1):** "the 0% reflectance value corresponds to an IRE of 0.09".
  **Correct:** 9.29 IRE. A 0% input encodes to d = 0.092864. The same sentence's 39.2 (18%) and 57.2 (90%) are code × 100, so 0.09 is the code value, not IRE.
  **Status:** found here. The live page and both PDF versions still print it. Not reported.
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
- **Status:** found here. Not reported. The colour-science source was re-checked online and 0.4.7 was run. Cui et al. 2002 is paywalled and was not re-checked online; the X′ step is also described in [de.wikipedia's DIN99 article](https://de.wikipedia.org/wiki/DIN99-Farbraum).

### colour-science: ECI RGB v2, Best RGB, Don RGB 4 and Ekta Space PS 5 primaries

- **Source:** colour-science 0.4.7 and develop, `RGB_COLOURSPACES` ([datasets](https://github.com/colour-science/colour/tree/develop/colour/models/rgb/datasets)).
- **As implemented:** primaries are xy computed from colorant XYZ rounded to 3 decimals. For example, the ECI red is 0.670103 = 0.650/0.970.
- **Correct:** the designers' values. eciRGB uses R(0.67, 0.33) G(0.21, 0.71) B(0.14, 0.08), the [ICC registry](https://registry.color.org/rgb-registry/ecirgb) values per ISO 22028-4. The other three use the values that [Lindbloom's table](http://www.brucelindbloom.com/WorkingSpaceInfo.html) prints and that the profiles' colorant tags give. The largest xy errors are 3.3e-4 for ECI RGB v2, 8.4e-4 for Best RGB, 4.3e-4 for Don RGB 4 and 4.8e-4 for Ekta Space PS 5.
- **Proof:** `spaces/ecirgb.js:24-27`, `spaces/bestrgb.js:24-28`, `spaces/donrgb4.js:24-27` and `spaces/ektaspace.js:24-28` hold the designers' values. The `bona-fide reference values` entries for these spaces were computed from them. Their tolerance (0.01 + 0.2%) would also pass colour-science's stock values for three of the four spaces, so no test pins the difference yet.
- **Status:** found here. Not reported. The colour-science sources, Lindbloom's table and the ICC registry were re-checked online. The ICC profile tags were not.

## Citation fixes

The 2026-07 link audit ([formula-verification](formula-verification.md#reference-link-audit), CHANGELOG 3.0.0) corrected 15 references in this library:

- **Mis-attributed (3):** the Xerox YES matrix had been credited to an unrelated 2007 paper; its source is Xerox XNSS 289005 (1989). The DIN99d and Coloroid DOIs resolved to unrelated papers; they are now [10.1002/col.10066](https://doi.org/10.1002/col.10066) (Cui et al. 2002) and [10.1002/col.5080050214](https://doi.org/10.1002/col.5080050214) (Nemcsics 1980).
- **Moved or dead (12):** four ACES pages (`docs.acescentral.com/specifications/…` moved to `…/encodings/…`), Ottosson's colorpicker anchors for Okhsl, Okhsv and Okhwb, two colour-science readthedocs pages (replaced by pinned source files), the freieFarbe HLC atlas, the Leica L-Log manual and the German Wikipedia DIN99 article.

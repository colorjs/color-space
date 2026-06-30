# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/gh-pages/logo.png" width="100%" height="150"/>

Open collection of color spaces.


## Usage

```js
import space from 'color-space';

// convert lab to lch (the CIE Lab polar form is `lchab`)
const result = space.lab.lchab(80, 50, 60);
```

Spaces can be imported separately:

```js
import rgb from 'color-space/rgb.js';
import hsl from 'color-space/hsl.js';

// convert rgb to hsl
rgb.hsl(200, 230, 100);
```

## API

```js
<fromSpace>.<toSpace>(...channels);
<space>.name //space name
<space>.range //natural channel ranges
```

### Metadata

`meta.js` carries per-space metadata generated from the JSDoc (`npm run meta`):

```js
import meta from 'color-space/meta.js';

meta.oklab;
// { description, channels: [{symbol, min, max, name}], range,
//   illuminant: 'D65', observer: '2',
//   referred: 'display' | 'scene',   // display- vs scene-referred (ACES/camera logs)
//   dynamic:  'sdr' | 'hdr' }        // bounded display vs extended/HDR
```

## Design: Conventional Ranges

Unlike most JavaScript color libraries (culori, colorjs.io) which normalize all values to 0-1, color-space uses **conventional ranges** that match [CSS Color Module Level 4/5](https://drafts.csswg.org/css-color/) specifications:

```js
import lab from 'color-space/lab.js';
import oklch from 'color-space/oklch.js';
import hsl from 'color-space/hsl.js';

// Conventional ranges - matches CSS and color science literature:
lab.rgb(50, -25, 40);      // L: 0-100, a/b: -125 to 125
oklch.rgb(65, 25, 180);    // L: 0-100, C: 0-40, H: 0-360°
hsl.rgb(180, 75, 50);      // H: 0-360°, S/L: 0-100%
```

**Benefits:**
- ✅ Matches CSS color specifications exactly
- ✅ Self-documenting: `oklch.rgb(50, 20, 180)` is clear as L:50%, C:20, H:180°
- ✅ Direct use in design tools, documentation, CSS output
- ✅ Matches scientific literature and color standards
- ✅ HDR support: values beyond conventional ranges work naturally

**Comparison with normalized (0-1) libraries:**
| Aspect | This library (conventional) | Others (normalized) |
|--------|----------------------------|---------------------|
| CSS compatibility | Direct match | Requires conversion |
| Readability | `lab.rgb(50, 0, 0)` | `lab.rgb(0.5, 0, 0)` |
| GPU/WebGL use | Needs conversion | Direct use |
| User intuition | Natural | Mental math needed |

See [docs/library-comparison.md](docs/library-comparison.md) for detailed analysis vs culori, colorjs.io, and texel/color.

### Notes on alpha & gamut

- **Alpha is not a channel.** color-space converts colour channels only; carry alpha yourself (it is unchanged by any conversion). This keeps the kernel a pure colour transform.
- **Out-of-gamut.** Conversions into `rgb` clamp to 0–255 (the sRGB display gamut), so `xyz → rgb → xyz` does **not** round-trip for colours outside sRGB. For unbounded/HDR work convert through `lrgb`, `xyz`, or a wide-gamut space (`rec2020`, `p3`, `acescg`, …) instead, which don't clamp.

## Spaces

### Display & Web
* [x] [RGB](https://www.w3.org/TR/css-color-4/#numeric-srgb) — sRGB, the web standard. ([IEC 61966-2-1](https://webstore.iec.ch/publication/6169))
* [x] [LRGB](https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear) — linear-light sRGB for physically correct blending, gradients, resizing.
* [x] [scRGB](https://en.wikipedia.org/wiki/ScRGB) — linear sRGB with the extended IEC 61966-2-2 range (−0.5…7.5) for wide-gamut/HDR. (IEC 61966-2-2)
* [x] [Display P3](https://www.w3.org/TR/css-color-4/#predefined-display-p3) — wide gamut for Apple/modern displays, 25% larger than sRGB.
* [x] [DCI-P3](https://en.wikipedia.org/wiki/DCI-P3) — theatrical digital cinema: P3 primaries, DCI white, gamma 2.6. (SMPTE RP 431-2)
* [x] [Rec. 2020](https://www.itu.int/rec/R-REC-BT.2020) — UHDTV/4K standard, covers 75% of visible spectrum. (ITU-R BT.2020)
* [x] [Rec. 709](https://www.itu.int/rec/R-REC-BT.709) — HDTV standard: sRGB primaries with the BT.709 camera transfer (OETF). (ITU-R BT.709)
* [x] [Adobe 98 RGB](https://en.wikipedia.org/wiki/Adobe_RGB_color_space) — photography standard, wider gamut for print reproduction.
* [x] [ProPhoto RGB](https://www.color.org/ROMMRGB.pdf) — widest practical gamut for photography workflows. (ROMM RGB, ICC)
* [x] [RIMM RGB](https://www.iso.org/standard/58005.html) — scene-referred ProPhoto counterpart (ISO 22028-3), BT.709-shaped OETF, extended exposure headroom.
* [x] [CIE RGB](https://en.wikipedia.org/wiki/CIE_1931_color_space) — the original 1931 Wright-Guild RGB (700/546.1/435.8 nm, white E) that defined XYZ.
* [x] [NTSC RGB (1953)](https://www.itu.int/rec/R-REC-BT.470) — the founding FCC broadcast primaries (Illuminant C); a ubiquitous gamut benchmark.
* [x] [PAL / SECAM RGB](https://www.itu.int/rec/R-REC-BT.470) — European 625-line primaries (EBU 3213), distinct from Rec.709.
* [x] [Apple RGB](http://www.brucelindbloom.com/WorkingSpaceInfo.html) — classic Mac/Photoshop working space (Trinitron, γ1.8).
* [x] [SMPTE-240M](https://ieeexplore.ieee.org/document/7291461) — interim HDTV (SMPTE-C primaries + the 240M OETF).

### User-Friendly Cylindrical
* [x] [HSL](https://www.w3.org/TR/css-color-4/#the-hsl-notation) — hue/saturation/lightness for CSS and color pickers.
* [x] [HSV, HSB](https://en.wikipedia.org/wiki/HSL_and_HSV) — hue/saturation/value, preferred in graphics software (Photoshop, etc).
* [x] [HWB](https://www.w3.org/TR/css-color-4/#the-hwb-notation) — hue/whiteness/blackness, intuitive for paint mixing mental model.
* [x] [HSI](https://ieeexplore.ieee.org/document/6185466) — hue/saturation/intensity, decouples chrominance for computer vision.
* [x] [HCG](https://github.com/acterhd/hcg-legacy) — hue/chroma/gray, alternative cylindrical model.
* [x] [HCL](http://www.chilliant.com/rgb2hsv.html) — hue/chroma/luminance, attempt at perceptual cylindrical.
* [x] [HSP](http://alienryderflex.com/hsp.html) — perceived brightness weighting (0.299R + 0.587G + 0.114B).
* [x] [HCY](http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html) — luma-based cylindrical for shader programming.
* [x] [HSM](https://doi.org/10.22456/2175-2745.17323) — hue/saturation/mixture for image segmentation.

### Perceptual Uniform (Modern)
* [x] [OKLAB](https://bottosson.github.io/posts/oklab/) — best current perceptual uniformity, simple and fast. Recommended for gradients, gamut mapping.
* [x] [OKLCH](https://www.w3.org/TR/css-color-4/#ok-lab) — polar OKLAB with intuitive hue angle. CSS Color 4 standard.
* [x] [OKHSL](https://bottosson.github.io/posts/okhsv/) — perceptually uniform HSL alternative, bounded to sRGB gamut.
* [x] [OKHSV](https://bottosson.github.io/posts/okhsv/) — perceptually uniform HSV alternative, bounded to sRGB gamut.
* [x] [Okhwb](https://bottosson.github.io/posts/okhsv/) — hue/whiteness/blackness analog of Okhsv, bounded to sRGB gamut.
* [x] [OKLRAB](https://bottosson.github.io/posts/colorpicker/) — linear-lightness OKLAB for advanced color pickers.
* [x] [OKLRCH](https://bottosson.github.io/posts/colorpicker/) — polar OKLRAB.
* [x] [HCT](https://material.io/blog/science-of-color-design) — Google Material's hue/chroma/tone, combines CAM16 hue with L* lightness.
* [x] [sUCS](https://doi.org/10.1364/OE.510196) — uniform space of sCAM (Li & Luo 2024); CAM16-UCS-class uniformity from a simple LMS-power pipeline.
* [x] [proLab](https://arxiv.org/abs/2012.07653) — projective (line-preserving) perceptual space; a 4×4-homography alternative to CIELAB. ([Konovalenko et al. 2021](https://arxiv.org/abs/2012.07653))

### Perceptual Uniform (CIE Classic)
* [x] [LAB](https://www.w3.org/TR/css-color-4/#cie-lab) — CIE 1976 L\*a\*b\*, the standard for perceptual uniformity. **D50** reference white (ICC/CSS Color 4 convention); use `lab-d65` for display-native. ([CIE 15:2004](https://cie.co.at/publications/colorimetry-4th-edition))
* [x] [LCH<sub>ab</sub>](https://www.w3.org/TR/css-color-4/#cie-lab) — polar LAB, intuitive hue/chroma. CSS Color 4 standard.
* [x] [LCH<sub>D65</sub>](https://cie.co.at/publications/colorimetry-4th-edition) — polar `lab-d65` with the display-native D65 white. (CIE 15:2004)
* [x] [LUV](https://en.wikipedia.org/wiki/CIELUV) — CIE 1976 L\*u\*v\*, uniform for additive color mixing (displays, lighting).
* [x] [LCH<sub>uv</sub>](http://www.brucelindbloom.com/index.html?Eqn_Luv_to_LCH.html) — polar LUV.
* [x] [HSL<sub>uv</sub>](http://www.hsluv.org/) — human-friendly LCH<sub>uv</sub> stretched to sRGB gamut boundary.
* [x] [HPL<sub>uv</sub>](http://www.hsluv.org/) — pastel-only HSLuv variant, always in gamut.
* [x] [LAB<sub>H</sub>](http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_HunterLab.html) — Hunter Lab (1948), predecessor to CIE LAB.
* [x] [UCS](https://en.wikipedia.org/wiki/CIE_1960_color_space) — CIE 1960 uniform chromaticity scale, precursor to LUV.
* [x] [UVW](http://www.brucelindbloom.com/index.html?Eqn_UVW_to_XYZ.html) — CIE 1964, attempted uniform color space.
* [x] [DIN99o](https://en.wikipedia.org/wiki/DIN99) — DIN 6176 Euclidean color-difference space (Lab and LCh forms).
* [x] [DIN99d](https://doi.org/10.1002/col.10066) — improved DIN99 with the redness X-correction. (Cui et al. 2002)

### HDR & Wide Gamut
* [x] [Jzazbz](https://observablehq.com/@jrus/jzazbz) — perceptually uniform for HDR, handles 10,000+ nits. ([Safdar et al. 2017](https://doi.org/10.1364/OE.25.015131))
* [x] [JzCzHz](https://www.w3.org/TR/css-color-hdr/#JzCzHz) — polar Jzazbz for HDR hue/chroma work. CSS Color HDR draft.
* [x] [Rec. 2100 PQ](https://www.itu.int/rec/R-REC-BT.2100) — HDR with perceptual quantizer (Dolby), 10,000 nits. (ITU-R BT.2100)
* [x] [Rec. 2100 HLG](https://www.itu.int/rec/R-REC-BT.2100) — HDR with hybrid log-gamma (BBC/NHK), backwards compatible.
* [x] [ICTCP](https://www.itu.int/rec/R-REC-BT.2100) — perceptual HDR space, constant hue/luminance lines. (ITU-R BT.2100)
* [x] [IPT](https://doi.org/10.1002/(SICI)1520-6378(199812)23:6%3C385::AID-COL6%3E3.0.CO;2-J) — Ebner & Fairchild (1998) opponent space, the structural ancestor of ICtCp.
* [x] [Rec. 2100 Linear](https://www.itu.int/rec/R-REC-BT.2100) — linear-light BT.2100 HDR (BT.2020 primaries; 1.0 = 203 cd/m²). (ITU-R BT.2100)

### Colorimetry Foundation
* [x] [XYZ](https://www.w3.org/TR/css-color-4/#cie-xyz) — CIE 1931, the foundation of all colorimetry. Device-independent reference. ([CIE 15:2004](https://cie.co.at/publications/colorimetry-4th-edition))
* [x] [XYY (xyY)](http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html) — chromaticity diagram coordinates, separates luminance from chromaticity.
* [x] [LMS](https://www.sciencedirect.com/science/article/pii/S0042698999000887) — cone response space (long/medium/short wavelength), basis for chromatic adaptation. (matrices: HPE, Bradford, CAT02/16, von Kries, Stockman-Sharpe 2000)
* [x] [CIE 1976 UCS (u′v′)](https://en.wikipedia.org/wiki/CIELUV#The_CIE_1976_UCS_diagram) — the modern uniform chromaticity diagram (LED binning, Δu′v′, CCT).
* [x] [MacLeod-Boynton](https://doi.org/10.1364/JOSA.69.001183) — cone-excitation ls chromaticity (Smith-Pokorny), foundation of DKL/vision science.
* [x] [Izazbz](https://doi.org/10.1364/OE.25.015131) — the absolute opponent stage Jzazbz/ZCAM build on (Safdar 2017).
* [x] [Gray](https://www.w3.org/TR/css-color-4/#grays) — single-channel luminance.

### Video & Broadcast
* [x] [YUV](https://www.itu.int/rec/R-REC-BT.601) — luma + chrominance, analog PAL/SECAM encoding. (ITU-R BT.601)
* [x] [YIQ](https://en.wikipedia.org/wiki/YIQ) — analog NTSC encoding, I/Q chosen for bandwidth efficiency.
* [x] [YC<sub>b</sub>C<sub>r</sub>](https://www.itu.int/rec/R-REC-BT.601) — digital video standard (BT.601/709), JPEG/MPEG/H.264. (ITU-R BT.601)
* [x] [Y<sub>c</sub>C<sub>bc</sub>C<sub>rc</sub>](https://www.itu.int/rec/R-REC-BT.2020) — constant-luminance YCbCr for BT.2020/HDR. (ITU-R BT.2020)
* [x] [YP<sub>b</sub>P<sub>r</sub>](https://en.wikipedia.org/wiki/YPbPr) — analog component video (DVD players, projectors).
* [x] [YD<sub>b</sub>D<sub>r</sub>](https://en.wikipedia.org/wiki/YDbDr) — SECAM analog encoding (France, Russia, Africa).
* [x] [YC<sub>g</sub>C<sub>o</sub>](https://www.microsoft.com/en-us/research/publication/the-h-264-advanced-video-coding-standard/) — lossless/low-cost video compression, integer-only transforms.
* [x] [JPEG](https://www.w3.org/Graphics/JPEG/jfif3.pdf) — full-range YCbCr for JPEG/JFIF compression.
* [x] [XvYCC](https://www.itu.int/rec/R-REC-BT.1361) — extended-gamut video, allows out-of-range RGB values. (IEC 61966-2-4)
* [x] [SMPTE-C](https://en.wikipedia.org/wiki/NTSC#SMPTE_C) — 525-line NTSC broadcast (SMPTE 170M primaries, D65, BT.601 transfer).

### Film & Professional
* [x] [ACEScg](https://docs.acescentral.com/specifications/acescg/) — Academy Color Encoding, linear working space for CGI compositing.
* [x] [ACEScc](https://docs.acescentral.com/specifications/acescc/) — Academy Color Encoding, logarithmic for grading with more shadow detail.
* [x] [ACEScct](https://docs.acescentral.com/specifications/acescct/) — ACES log grading with a linear toe near black, for lift/gamma/gain controls.
* [x] [ACES2065-1](https://docs.acescentral.com/specifications/aces2065-1/) — AP0 archival/interchange master format, enclosing the entire visible gamut.
* [x] [ARRI LogC4](https://www.arri.com/resource/blob/278790/dc29f7399c1dc9553d329e27f1409a89/2022-05-arri-logc4-specification-data.pdf) — ARRI's 2023 camera log + Wide Gamut 4. (ARRI LogC4 spec)
* [x] [Sony S-Log3](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html) — Sony camera log + S-Gamut3. (Sony technical summary)
* [x] [Panasonic V-Log](https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf) — Panasonic VARICAM log + V-Gamut.
* [x] [RED Log3G10](https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf) — RED camera log + REDWideGamutRGB. (RED whitepaper 915-0187)
* [x] [Canon Log 2](https://en.wikipedia.org/wiki/Log_profile) — Canon Log 2 (v1.2) + Cinema Gamut. (Canon Input Transform)
* [x] [Cineon](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html) — Kodak printing-density film-scan log (SMPTE 268M/DPX) over linear RGB.
* [x] [ARRI LogC3](https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf) — LogC3 (EI 800) + ALEXA Wide Gamut 3.
* [x] [Sony S-Log2](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog2.html) — S-Log2 + S-Gamut.
* [x] [Canon Log](https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf) / [Canon Log 3](https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf) — Canon Log 1 & 3 (v1.2) + Cinema Gamut.
* [x] [Fujifilm F-Log](https://dl.fujifilm-x.com/support/lut/F-Log_DataSheet_E_Ver.1.1.pdf) / [F-Log2](https://dl.fujifilm-x.com/support/lut/F-Log2_DataSheet_E_Ver.1.0.pdf) — F-Log & F-Log2 over F-Gamut (= BT.2020).
* [x] [Nikon N-Log](https://download.nikonimglib.com/archive3/hDCmK00m9JDI03RPruD74xpoU905/N-Log_Specification_(En)01.pdf) — cube-root toe + ln highlight over N-Gamut (= BT.2020).
* [x] [Apple Log](https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/apple_log_profile.py) — iPhone 15 Pro+ log (quadratic toe + log2) over BT.2020.
* [x] [Blackmagic Film Gen5](https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/blackmagic_design.py) — BMD Gen5 curve + BMD Wide Gamut.
* [x] [DJI D-Log](https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf) — D-Log + D-Gamut (cinema cameras).

### Color Appearance
* [x] [CAM16](https://doi.org/10.1002/col.22131) — CIE color appearance model, handles viewing conditions (lighting, surround). ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [CAM16-UCS](https://doi.org/10.1002/col.22131) — uniform CAM16 (J′a′b′) for ΔE and gamut mapping. ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [CIECAM02](https://doi.org/10.1002/col.10125) — predecessor to CAM16, still used in ICC v4 profiles. ([Moroney et al. 2002](https://doi.org/10.2352/CIC.2002.10.1.art00006))
* [x] [CAM02-UCS](https://doi.org/10.1002/col.20227) — uniform CIECAM02 (J′a′b′) for ΔE. ([Luo, Cui & Li 2006](https://doi.org/10.1002/col.20227))
* [x] [CAM02-LCD / SCD](https://doi.org/10.1002/col.20227) — CIECAM02 uniform spaces tuned for large / small colour differences. ([Luo, Cui & Li 2006](https://doi.org/10.1002/col.20227))
* [x] [CAM16-LCD / SCD](https://doi.org/10.1002/col.22131) — CAM16 large / small colour-difference variants. ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [Hellwig 2022](https://doi.org/10.1002/col.22792) — CIE-recommended CAM16 successor (CIECAM16 basis): linearised brightness + Helmholtz-Kohlrausch. ([Hellwig & Fairchild 2022](https://doi.org/10.1002/col.22792))
* [x] [ZCAM](https://doi.org/10.1364/OE.413659) — HDR-native colour appearance model built on the absolute Izazbz space. ([Safdar et al. 2021](https://doi.org/10.1364/OE.413659))

### Print & Physical
* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive printing (cyan/magenta/yellow/black). Device-dependent.
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive primaries without black separation.
* [x] [Munsell](https://munsell.com/about-munsell-color/) — artist hue/value/chroma; bidirectional via the 1943 renotation (Illuminant C). ([RIT MCSL](https://www.rit.edu/science/munsell-color-science-lab-educational-resources))
* [x] [RAL Design](https://en.wikipedia.org/wiki/RAL_colour_standard) — systematic CIELAB hue/lightness/chroma; the HLC code *is* L\*C\*h by construction (D50/2°). Distinct from sample-defined RAL Classic.
* [ ] [US Federal Standard 595](https://en.wikipedia.org/wiki/Federal_Standard_595) — US government spec; **public-domain** (FED-STD-595C), the one viable catalog candidate if a named-lookup layer is added.
* ~~[NCS](https://ncscolour.com/)~~ — declined: proprietary atlas, no open analytic NCS→CIE map (Derefeldt & Sahlin 1986).
* ~~[PMS / Pantone](https://www.pantone.com/)~~ — declined: trademarked + licensed (Adobe dropped it in 2022); values not openly redistributable.
* ~~[RAL Classic](https://www.ral-farben.de/)~~ — declined: sample-defined, no open authoritative Lab (RAL gGmbH licenses its data).
* ~~[HKS](https://en.wikipedia.org/wiki/HKS_(colour_system))~~ — declined: proprietary spot inks (PDFlib even ships a build without it).
* ~~[British Standard Colour](http://www.britishstandardcolour.com/)~~ — declined: BSI-copyrighted; only disclaimed approximate hex circulates.
* ~~[Toyo](http://mytoyocolor.com/)~~ — declined: ICC-profile licence forbids redistribution.

> **Why these are out:** proprietary named-swatch catalogs (trademark + EU database rights, sample-defined with no open CIE data) — not continuous color spaces, and a formula can't cure the IP or the missing data. Distinct from RAL **Design** above, whose codes *are* CIELAB by construction and carry no proprietary data.

### Specialty & Research
* [x] [Coloroid](http://hej.sze.hu/ARC/ARC-030520-A/arc030520a.pdf) — Hungarian aesthetic color system for architecture (MSZ 7300). Perceptually uniform hue/saturation/luminosity.
* [x] [OSA-UCS](https://www.osapublishing.org/josa/abstract.cfm?uri=josa-64-12-1691) — Optical Society uniform color scales; now bidirectional (1D-Newton inverse, [Schlömer 2019](https://arxiv.org/abs/1911.08323)).
* [x] [TSL](https://ieeexplore.ieee.org/document/400568) — tint/saturation/lightness, designed for face detection skin-color clustering. ([Terrillon & Akamatsu 1999](https://doi.org/10.1109/ICIP.1999.817178))
* [x] [YES](https://doi.org/10.2991/isaebd.2012.23) — luminance/chrominance for fast face recognition.
* [x] [Cubehelix](https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) — monotonic lightness colormaps for scientific visualization. ([Green 2011](https://doi.org/10.1071/AS11033))
* [x] [RG chromaticity](http://www.brucelindbloom.com/) — normalized r=R/(R+G+B), illumination-invariant for vision.
* [x] [CIE DSH](https://en.wikipedia.org/wiki/Dominant_wavelength) — Helmholtz coordinates: dominant wavelength + excitation purity from CIE 1931 xy (D65); purples carry a negative complementary wavelength.
* [ ] ~~[RG / RGK](https://en.wikipedia.org/wiki/RG_color_space) — red-green dichromat simulation~~ — declined: the linked page is a formula-less historical 2-primary print model, and "dichromat simulation" is a one-way filter (Viénot/Brettel), not a color space.
* [x] [PhotoYCC](https://en.wikipedia.org/wiki/PhotoYCC) — Kodak Photo CD encoding, extended gamut (BT.709 primaries, BT.601 luma, odd-function OETF).
* [x] [Ohta I₁I₂I₃](https://doi.org/10.1016/0146-664X(80)90047-7) — decorrelated RGB opponent space for image segmentation (Ohta 1980).
* [x] [ANLAB](https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x) — Adams-Nickerson chromatic-valence space (1942/1950), the direct precursor of CIELAB.


## Motivation

The purpose is to have a _complete_ collection of color spaces with _minimal_, _consistent_ and _clean_ API, _verified_ formulas and _cases_.
While alternatives focus on digital color spaces, this project takes broader perspective, covering historical and cross-disciplinary spaces as well.

Some side effects:
* Verifying and correcting papers.
* Visualising and educating about color spaces.
* Providing test cases for JS to WASM compilers ([porffor](https://github.com/CanadaHonk/porffor), [jz](https://github.com/dy/jz)).

## Comparison

color-space offers a unique approach among JavaScript color libraries:

| Feature | color-space | culori | colorjs.io | texel/color |
|---------|-------------|--------|------------|-------------|
| **Color spaces** | **123** | 25 | 40 | 16 |
| **API ranges** | Conventional (CSS-matching) | Normalized (0-1) | Normalized (0-1) | Normalized (0-1) |
| **Target use** | General purpose, education | CSS/web, design | W3C standard ref | Creative coding, WebGL |
| **Specialty spaces** | ✅ (coloroid, munsell, video) | ❌ | Some | ❌ |
| **Bundle size** | Tree-shakeable, minimal | Medium | Large | Minimal |
| **Test coverage** | differential vs colorjs.io + cited refs (123 spaces) | ~2,000 tests | ~1,500 tests | ~50 tests |

**Key differences:**
- **Conventional ranges**: color-space uses `rgb(255, 128, 0)` and `lab(50, 25, -30)` like in CSS specs, while others use normalized `rgb(1, 0.5, 0)` and `lab(0.5, 0.2, -0.24)`
- **Most comprehensive**: 123 color spaces including specialty domains (video encoding, architecture, face recognition, perceptual uniformity)
- **Verified accuracy**: See [docs/formula-verification.md](docs/formula-verification.md) - all formulas verified against CSS Color spec editors (colorjs.io) and original papers
- **Performance**: See [benchmark/README.md](benchmark/README.md) - run `npm run benchmark` to compare vs culori, colorjs.io, and texel/color

## Credits

Thanks to everyone who contribute to color science – researchers, scientists, color theorists, specifiers, implementors, developers, and users.

Special thanks to libraries that informed this implementation: [culori](https://github.com/Evercoder/culori), [colorjs.io](https://colorjs.io/) (CSS Color spec editors), [color-api](https://github.com/LeaVerou/color-api) (W3C WICG), [texel/color](https://github.com/texel-org/color).

## Changes in v3

* **Conventional ranges**: Changed from normalized 0-1 to conventional ranges (RGB: 0-255, HSL H:0-360° S/L:0-100%, Lab L:0-100 a/b:±125, etc.)
* **Matches CSS specs**: All ranges now match CSS Color Module Level 4/5 exactly
* **Breaking change**: Update calls like `lab.rgb(0.5, 0, 0)` → `lab.rgb(50, 0, 0)`
* No `min`, `max` properties. <!-- Channel limits are conventional, not theoretical, and can be picked in use cases. -->
* Added `range` property documenting natural/conventional channel ranges (e.g., Lab L: 0-100, HSL H: 0-360) — these are the ranges the API itself uses.
* No `alias`. <!-- Synonymic names can be learned from docs, no need to clutter code & inflate bundle. -->
* Flat arguments, eg. `rgb.lab([10, 20, 30])` -> `rgb.lab(10, 20, 30)`


<p align="center"><a href="https://github.com/krsnzd/license/">ॐ</a></p>

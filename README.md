# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/gh-pages/logo.png" width="100%" height="150"/>

Open collection of color spaces.


## Usage

```js
import space from 'color-space';

// convert lab to lch
const result = space.lab.lch(80, 50, 60);
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
<space>.channel //channel names
<space>.range //natural channel ranges
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

## Spaces

### Display & Web
* [x] [RGB](https://www.w3.org/TR/css-color-4/#numeric-srgb) — sRGB, the web standard. ([IEC 61966-2-1](https://webstore.iec.ch/publication/6169))
* [x] [LRGB](https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear) — linear-light sRGB for physically correct blending, gradients, resizing.
* [x] [Display P3](https://www.w3.org/TR/css-color-4/#predefined-display-p3) — wide gamut for Apple/modern displays, 25% larger than sRGB.
* [x] [Rec. 2020](https://www.itu.int/rec/R-REC-BT.2020) — UHDTV/4K standard, covers 75% of visible spectrum. (ITU-R BT.2020)
* [x] [Adobe 98 RGB](https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf) — photography standard, wider gamut for print reproduction.
* [x] [ProPhoto RGB](https://www.color.org/ROMMRGB.pdf) — widest practical gamut for photography workflows. (ROMM RGB, ICC)

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
* [x] [OKLRAB](https://bottosson.github.io/posts/colorpicker/) — linear-lightness OKLAB for advanced color pickers.
* [x] [OKLRCH](https://bottosson.github.io/posts/colorpicker/) — polar OKLRAB.
* [x] [HCT](https://material.io/blog/science-of-color-design) — Google Material's hue/chroma/tone, combines CAM16 hue with L* lightness.

### Perceptual Uniform (CIE Classic)
* [x] [LAB](https://www.w3.org/TR/css-color-4/#cie-lab) — CIE 1976 L\*a\*b\*, the historical standard for perceptual uniformity. ([CIE 15:2004](https://cie.co.at/publications/colorimetry-4th-edition))
* [x] [LCH<sub>ab</sub>](https://www.w3.org/TR/css-color-4/#cie-lab) — polar LAB, intuitive hue/chroma. CSS Color 4 standard.
* [x] [LUV](https://en.wikipedia.org/wiki/CIELUV) — CIE 1976 L\*u\*v\*, uniform for additive color mixing (displays, lighting).
* [x] [LCH<sub>uv</sub>](http://www.brucelindbloom.com/index.html?Eqn_Luv_to_LCH.html) — polar LUV.
* [x] [HSL<sub>uv</sub>](http://www.hsluv.org/) — human-friendly LCH<sub>uv</sub> stretched to sRGB gamut boundary.
* [x] [HPL<sub>uv</sub>](http://www.hsluv.org/) — pastel-only HSLuv variant, always in gamut.
* [x] [LAB<sub>H</sub>](http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_HunterLab.html) — Hunter Lab (1948), predecessor to CIE LAB.
* [x] [UCS](https://en.wikipedia.org/wiki/CIE_1960_color_space) — CIE 1960 uniform chromaticity scale, precursor to LUV.
* [x] [UVW](http://www.brucelindbloom.com/index.html?Eqn_UVW_to_XYZ.html) — CIE 1964, attempted uniform color space.

### HDR & Wide Gamut
* [x] [Jzazbz](https://observablehq.com/@jrus/jzazbz) — perceptually uniform for HDR, handles 10,000+ nits. ([Safdar et al. 2017](https://doi.org/10.1364/OE.25.015131))
* [x] [JzCzHz](https://www.w3.org/TR/css-color-hdr/#JzCzHz) — polar Jzazbz for HDR hue/chroma work. CSS Color HDR draft.
* [x] [Rec. 2100 PQ](https://www.itu.int/rec/R-REC-BT.2100) — HDR with perceptual quantizer (Dolby), 10,000 nits. (ITU-R BT.2100)
* [x] [Rec. 2100 HLG](https://www.itu.int/rec/R-REC-BT.2100) — HDR with hybrid log-gamma (BBC/NHK), backwards compatible.
* [x] [ICTCP](https://www.itu.int/rec/R-REC-BT.2100) — perceptual HDR space, constant hue/luminance lines. (ITU-R BT.2100)

### Colorimetry Foundation
* [x] [XYZ](https://www.w3.org/TR/css-color-4/#cie-xyz) — CIE 1931, the foundation of all colorimetry. Device-independent reference. ([CIE 15:2004](https://cie.co.at/publications/colorimetry-4th-edition))
* [x] [XYY (xyY)](http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html) — chromaticity diagram coordinates, separates luminance from chromaticity.
* [x] [LMS](https://www.sciencedirect.com/science/article/pii/S0042698999000887) — cone response space (long/medium/short wavelength), basis for chromatic adaptation.
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

### Film & Professional
* [x] [ACEScg](https://docs.acescentral.com/specifications/acescg/) — Academy Color Encoding, linear working space for CGI compositing.
* [x] [ACEScc](https://docs.acescentral.com/specifications/acescc/) — Academy Color Encoding, logarithmic for grading with more shadow detail.

### Color Appearance
* [x] [CAM16](https://doi.org/10.1002/col.22131) — CIE color appearance model, handles viewing conditions (lighting, surround). ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [ ] [CIECAM02](https://doi.org/10.1002/col.10125) — predecessor to CAM16, widely used in ICC profiles.

### Print & Physical
* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive printing (cyan/magenta/yellow/black). Device-dependent.
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive primaries without black separation.
* [ ] [Munsell](https://munsell.com/about-munsell-color/) — artist color system, perceptually uniform hue/value/chroma notation.
* [ ] [NCS](https://ncscolour.com/) — Natural Color System, based on opponent-color theory (Sweden).
* [ ] [PMS](https://www.pantone.com/) — Pantone Matching System, spot color standard for print.
* [ ] [RAL](https://www.ral-farben.de/) — European industrial color standard (paint, coatings).
* [ ] [HKS](https://en.wikipedia.org/wiki/HKS_(colour_system)) — German spot color system for print.
* [ ] [British Standard Colour](http://www.britishstandardcolour.com/) — UK industrial color standard.
* [ ] [US Federal Standard 595](https://en.wikipedia.org/wiki/Federal_Standard_595) — US government color specification.
* [ ] [Toyo](http://mytoyocolor.com/) — Japanese spot color system.

### Specialty & Research
* [x] [Coloroid](http://hej.sze.hu/ARC/ARC-030520-A/arc030520a.pdf) — Hungarian aesthetic color system for architecture (MSZ 7300). Perceptually uniform hue/saturation/luminosity.
* [ ] [OSA-UCS](https://www.osapublishing.org/josa/abstract.cfm?uri=josa-64-12-1691) — Optical Society uniform color scales, 12 equidistant neighbors per color.
* [x] [TSL](https://ieeexplore.ieee.org/document/400568) — tint/saturation/lightness, designed for face detection skin-color clustering. ([Terrillon & Akamatsu 1999](https://doi.org/10.1109/ICIP.1999.817178))
* [x] [YES](https://doi.org/10.2991/isaebd.2012.23) — luminance/chrominance for fast face recognition.
* [x] [Cubehelix](https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) — monotonic lightness colormaps for scientific visualization. ([Green 2011](https://doi.org/10.1071/AS11033))
* [x] [RG chromaticity](http://www.brucelindbloom.com/) — normalized r=R/(R+G+B), illumination-invariant for vision.
* [ ] [CIE DSH](https://en.wikipedia.org/wiki/Rg_chromaticity) — dominant wavelength/purity representation.
* [ ] [RG](https://en.wikipedia.org/wiki/RG_color_space) / [RGK](https://en.wikipedia.org/wiki/RG_color_space) — red-green dichromat simulation.
* [ ] [PhotoYCC](https://en.wikipedia.org/wiki/PhotoYCC) — Kodak Photo CD encoding, extended gamut.


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
| **Color spaces** | **71** | 25 | 40 | 16 |
| **API ranges** | Conventional (CSS-matching) | Normalized (0-1) | Normalized (0-1) | Normalized (0-1) |
| **Target use** | General purpose, education | CSS/web, design | W3C standard ref | Creative coding, WebGL |
| **Specialty spaces** | ✅ (coloroid, munsell, video) | ❌ | Some | ❌ |
| **Bundle size** | Tree-shakeable, minimal | Medium | Large | Minimal |
| **Test coverage** | 1,371 tests (99.9%) | ~2,000 tests | ~1,500 tests | ~50 tests |

**Key differences:**
- **Conventional ranges**: color-space uses `rgb(255, 128, 0)` and `lab(50, 25, -30)` like in CSS specs, while others use normalized `rgb(1, 0.5, 0)` and `lab(0.5, 0.2, -0.24)`
- **Most comprehensive**: 71 color spaces including specialty domains (video encoding, architecture, face recognition, perceptual uniformity)
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

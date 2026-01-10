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

* [x] [RGB](https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_colour_space) — sRGB
* [x] [LRGB](https://en.wikipedia.org/wiki/SRGB#Transfer_function_("gamma")) – linear light sRGB
* [x] [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV) — cylindrical-coordinates sRGB
* [x] [HSV, HSB](https://en.wikipedia.org/wiki/HSL_and_HSV)
* [x] [HWB](http://dev.w3.org/csswg/css-color/#the-hwb-notation)
* [x] [HSI](https://en.wikipedia.org/wiki/HSL_and_HSV) — used for computer vision due to better separation of shapes in an image, comparing to HSL/HSB.
* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space)
* [x] [XYY (YXY)](https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xy_chromaticity_diagram_and_the_CIE_xyY_color_space)
* [x] [LAB](http://en.wikipedia.org/wiki/Lab_color_space)
* [x] [LCH<sub>ab</sub>](https://en.wikipedia.org/wiki/Lab_color_space#Cylindrical_representation:_CIELCh_or_CIEHLC)
* [x] [LUV](http://en.wikipedia.org/wiki/CIELUV)
* [x] [LCH<sub>uv</sub>](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation)
* [x] [HSL<sub>uv</sub>](http://www.hsluv.org/)
* [x] [HPL<sub>uv</sub>](http://www.hsluv.org/)
* [x] [LAB<sub>H</sub>](http://en.wikipedia.org/wiki/Lab_color_space#Hunter_Lab)
* [x] [YUV](https://en.wikipedia.org/?title=YUV)
* [x] [YIQ](https://en.wikipedia.org/?title=YIQ)
* [x] [YC<sub>g</sub>C<sub>o</sub>](https://en.wikipedia.org/wiki/YCgCo)
* [x] [YD<sub>b</sub>D<sub>r</sub>](https://en.wikipedia.org/wiki/YDbDr)
* [x] [YP<sub>b</sub>P<sub>r</sub>](https://en.wikipedia.org/wiki/YPbPr)
* [x] [YC<sub>b</sub>C<sub>r</sub>](https://en.wikipedia.org/wiki/YCbCr)
* [x] [Y<sub>c</sub>C<sub>bc</sub>C<sub>rc</sub>](https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion)
* [x] [JPEG](https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion)
* [x] [XvYCC](https://en.wikipedia.org/wiki/XvYCC)
* [x] [UCS](https://en.wikipedia.org/wiki/CIE_1960_color_space)
* [x] [UVW](https://en.wikipedia.org/wiki/CIE_1964_color_space)
* [x] [OKLAB](https://bottosson.github.io/posts/oklab/)
* [x] [OKLCH](https://bottosson.github.io/posts/oklab/#the-oklch-color-space)
* [x] [OKHSL](https://bottosson.github.io/posts/okhsl-and-okhsv/)
* [x] [OKHSV](https://bottosson.github.io/posts/okhsl-and-okhsv/)
* [x] [OKLRAB](https://bottosson.github.io/posts/colorpicker/) — linear-lightness Oklab.
* [x] [OKLRCH](https://bottosson.github.io/posts/colorpicker/) — polar form of Oklrab.
* [x] [Jzazbz](https://drafts.csswg.org/css-color-hdr/#Jzazbz) — perceptually uniform HDR color space.
* [x] [JzCzHz](https://drafts.csswg.org/css-color-hdr/#JzCzhz) — polar form of Jzazbz.
* [ ] [Munsell](https://en.wikipedia.org/wiki/Munsell_color_system)
* [ ] [NCS](https://en.wikipedia.org/wiki/Natural_Color_System)
* [ ] [PMS](https://en.wikipedia.org/wiki/Pantone)
* [ ] [RAL](https://en.wikipedia.org/wiki/RAL_colour_standard)
* [x] [TSL](https://en.wikipedia.org/wiki/TSL_color_space) – color space designed for face detection purpose.
* [ ] [RG](https://en.wikipedia.org/wiki/RG_color_space)
* [ ] [RGK](https://en.wikipedia.org/wiki/RG_color_space)
* [x] [Coloroid](https://en.wikipedia.org/wiki/Coloroid) — perceptually uniform aesthetical color space for architects and visual constructors, Hungarian Standard MSZ 7300 since 2000. ([ref](http://hej.sze.hu/ARC/ARC-030520-A/arc030520a.pdf))
* [ ] [OSA-UCS](https://en.wikipedia.org/wiki/OSA-UCS) — accurately reprsenting uniform color differences, developed by the Optical Society of America’s Committee on Uniform Color Scales.
* [ ] [HKS](https://en.wikipedia.org/wiki/HKS_(colour_system))
* [x] [LMS](http://en.wikipedia.org/wiki/LMS_color_space) — represents sensitivity of the human eye to Long, Medium and Short wavelengths.
* [x] [Display P3](https://en.wikipedia.org/wiki/DCI-P3)
* [x] [Rec. 2020](https://en.wikipedia.org/wiki/Rec._2020)
* [x] [Adobe 98 RGB](https://en.wikipedia.org/wiki/Adobe_RGB_color_space)
* [x] [ProPhoto RGB](https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space)
* [x] [ACEScg](https://en.wikipedia.org/wiki/Academy_Color_Encoding_System)
* [x] [ACEScc](https://en.wikipedia.org/wiki/Academy_Color_Encoding_System)
* [x] [Rec. 2100 PQ](https://en.wikipedia.org/wiki/Rec._2100)
* [x] [Rec. 2100 HLG](https://en.wikipedia.org/wiki/Rec._2100)
* [x] [ICTCP](https://en.wikipedia.org/wiki/ICtCp)
* [x] [CAM16](https://en.wikipedia.org/wiki/Color_appearance_model#CIECAM16)
* [x] [HCT](https://material.io/blog/science-of-color-design)
* [x] [Cubehelix](https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) — colormaps for data visualization.
* [x] [Gray](http://dev.w3.org/csswg/css-color/#grays)
* [ ] [CIECAM02](https://en.wikipedia.org/wiki/CIECAM02)
* [ ] [US Federal Standard 595](https://en.wikipedia.org/wiki/Federal_Standard_595)
* [ ] [Toyo](http://mytoyocolor.com/)
* [ ] [PhotoYCC](http://www5.informatik.tu-muenchen.de/lehre/vorlesungen/graphik/info/csc/COL_34.htm)
* [x] [HCG](https://github.com/acterhd/hcg-legacy)
* [x] [HCL](http://www.chilliant.com/rgb2hsv.html)
* [x] [HSP](http://alienryderflex.com/hsp.html)
* [x] [HCY](http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html)
* [x] [YES](http://www.atlantis-press.com/php/download_paper.php?id=198) — computationally effective color space for face recognition.
* [ ] [British Standard Colour](http://www.britishstandardcolour.com/)
* [x] [RG chromacity](https://en.wikipedia.org/wiki/Rg_chromaticity)
* [ ] [CIE DSH](https://en.wikipedia.org/wiki/Rg_chromaticity)
* [x] [HSM](http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428)


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
| **Color spaces** | **72** | 25 | 40 | 16 |
| **API ranges** | Conventional (CSS-matching) | Normalized (0-1) | Normalized (0-1) | Normalized (0-1) |
| **Target use** | General purpose, education | CSS/web, design | W3C standard ref | Creative coding, WebGL |
| **Specialty spaces** | ✅ (coloroid, munsell, video) | ❌ | Some | ❌ |
| **Bundle size** | Tree-shakeable, minimal | Medium | Large | Minimal |
| **Test coverage** | 1,371 tests (99.9%) | ~2,000 tests | ~1,500 tests | ~50 tests |

**Key differences:**
- **Conventional ranges**: color-space uses `rgb(255, 128, 0)` and `lab(50, 25, -30)` like in CSS specs, while others use normalized `rgb(1, 0.5, 0)` and `lab(0.5, 0.2, -0.24)`
- **Most comprehensive**: 71+ color spaces including specialty domains (video encoding, architecture, face recognition, perceptual uniformity)
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
* Added `range` property documenting natural/conventional channel ranges (e.g., Lab L: 0-100, HSL H: 0-360). Values remain normalized to 0-1 in the API.
* No `alias`. <!-- Synonymic names can be learned from docs, no need to clutter code & inflate bundle. -->
* Flat arguments, eg. `rgb.lab([10, 20, 30])` -> `rgb.lab(10, 20, 30)`


<p align="center"><a href="https://github.com/krsnzd/license/">🕉</a></p>

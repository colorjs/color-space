# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/master/web/img/banner.svg" alt="an OKLCh hue sweep shown continuously, in 20 steps, and in 10 steps" width="100%"/>

**An open collection of 161 color spaces.**

From CSS color and camera log to human vision and century-old systems. Convert any space to any other with one small, consistent API — in the ranges people actually use. Every conversion is source-checked; metadata and references travel with it.

**[Interactive atlas →](https://colorjs.github.io/color-space/)**

## 161 spaces

Each published name links to its live atlas dossier. Canonical module names stay in the API and on each dossier.

**Display & web · 19**

[sRGB](https://colorjs.github.io/color-space/rgb) · [Display P3](https://colorjs.github.io/color-space/p3) · [Rec. 2020](https://colorjs.github.io/color-space/rec2020) · [Linear-light sRGB](https://colorjs.github.io/color-space/lrgb) · [Rec. 709](https://colorjs.github.io/color-space/rec709) · [ProPhoto RGB](https://colorjs.github.io/color-space/prophoto) · [Adobe RGB (1998)](https://colorjs.github.io/color-space/a98rgb) · [DCI-P3](https://colorjs.github.io/color-space/dci-p3) · [Linear Display P3](https://colorjs.github.io/color-space/p3-linear) · [Linear Rec. 2020](https://colorjs.github.io/color-space/rec2020-linear) · [Linear Adobe RGB (1998)](https://colorjs.github.io/color-space/a98rgb-linear) · [Linear ProPhoto RGB](https://colorjs.github.io/color-space/prophoto-linear) · [scRGB](https://colorjs.github.io/color-space/scrgb) · [RIMM RGB](https://colorjs.github.io/color-space/rimm) · [CIE RGB](https://colorjs.github.io/color-space/cie-rgb) · [NTSC RGB (1953)](https://colorjs.github.io/color-space/ntsc) · [PAL / SECAM RGB](https://colorjs.github.io/color-space/pal) · [Apple RGB](https://colorjs.github.io/color-space/apple-rgb) · [SMPTE-240M](https://colorjs.github.io/color-space/smpte-240m)

**Cylindrical · 9**

[HSL](https://colorjs.github.io/color-space/hsl) · [HSV / HSB](https://colorjs.github.io/color-space/hsv) · [HWB](https://colorjs.github.io/color-space/hwb) · [HSI](https://colorjs.github.io/color-space/hsi) · [HCG](https://colorjs.github.io/color-space/hcg) · [HCL](https://colorjs.github.io/color-space/hcl) · [HSP](https://colorjs.github.io/color-space/hsp) · [HCY](https://colorjs.github.io/color-space/hcy) · [HSM](https://colorjs.github.io/color-space/hsm)

**Perceptual — modern · 12**

[OKLCH](https://colorjs.github.io/color-space/oklch) · [OKLab](https://colorjs.github.io/color-space/oklab) · [HCT](https://colorjs.github.io/color-space/hct) · [Okhsl](https://colorjs.github.io/color-space/okhsl) · [Okhsv](https://colorjs.github.io/color-space/okhsv) · [Okhwb](https://colorjs.github.io/color-space/okhwb) · [OKLrAB](https://colorjs.github.io/color-space/oklrab) · [OKLrCH](https://colorjs.github.io/color-space/oklrch) · [SRLAB2](https://colorjs.github.io/color-space/srlab2) · [proLab](https://colorjs.github.io/color-space/prolab) · [sUCS](https://colorjs.github.io/color-space/sucs) · [IgPgTg](https://colorjs.github.io/color-space/igpgtg)

**Perceptual — CIE classic · 15**

[CIELAB](https://colorjs.github.io/color-space/lab) · [CIELChab](https://colorjs.github.io/color-space/lchab) · [CIELUV](https://colorjs.github.io/color-space/luv) · [HSLuv](https://colorjs.github.io/color-space/hsluv) · [CIELChuv](https://colorjs.github.io/color-space/lchuv) · [CIELAB D65](https://colorjs.github.io/color-space/lab-d65) · [CIELCh D65](https://colorjs.github.io/color-space/lch-d65) · [HPLuv](https://colorjs.github.io/color-space/hpluv) · [DIN99o Lab](https://colorjs.github.io/color-space/din99o-lab) · [DIN99o LCh](https://colorjs.github.io/color-space/din99o-lch) · [DIN99d](https://colorjs.github.io/color-space/din99d) · [Hunter Lab](https://colorjs.github.io/color-space/labh) · [CIE 1960 UCS](https://colorjs.github.io/color-space/ucs) · [CIE 1964 UVW](https://colorjs.github.io/color-space/uvw) · [Adams–Nickerson Lab](https://colorjs.github.io/color-space/anlab)

**HDR & wide gamut · 11**

[ICtCp](https://colorjs.github.io/color-space/ictcp) · [Jzazbz](https://colorjs.github.io/color-space/jzazbz) · [Rec. 2100 PQ](https://colorjs.github.io/color-space/rec2100-pq) · [Rec. 2100 HLG](https://colorjs.github.io/color-space/rec2100-hlg) · [JzCzHz](https://colorjs.github.io/color-space/jzczhz) · [IPT](https://colorjs.github.io/color-space/ipt) · [Izazbz](https://colorjs.github.io/color-space/izazbz) · [Linear Rec. 2100](https://colorjs.github.io/color-space/rec2100-linear) · [hdr-IPT](https://colorjs.github.io/color-space/hdr-ipt) · [hdr-CIELAB](https://colorjs.github.io/color-space/hdr-cie-lab) · [ICaCb](https://colorjs.github.io/color-space/icacb)

**Colorimetry & vision · 16**

[CIE XYZ (D65)](https://colorjs.github.io/color-space/xyz) · [CIE xyY](https://colorjs.github.io/color-space/xyy) · [LMS](https://colorjs.github.io/color-space/lms) · [CIE XYZ (D50)](https://colorjs.github.io/color-space/xyz-d50) · [CIE 1976 u′v′](https://colorjs.github.io/color-space/uv) · [CCT + Duv](https://colorjs.github.io/color-space/cct-duv) · [Color temperature (Kelvin)](https://colorjs.github.io/color-space/kelvin) · [Maxwell triangle](https://colorjs.github.io/color-space/maxwell) · [Wavelength](https://colorjs.github.io/color-space/wavelength) · [Absolute XYZ D65](https://colorjs.github.io/color-space/xyz-abs-d65) · [MacLeod–Boynton](https://colorjs.github.io/color-space/macboyn) · [DKL](https://colorjs.github.io/color-space/dkl) · [Grayscale](https://colorjs.github.io/color-space/gray) · [Dominant wavelength / DSH](https://colorjs.github.io/color-space/dsh) · [rg chromaticity](https://colorjs.github.io/color-space/rg) · [Yrg (Kirk 2019)](https://colorjs.github.io/color-space/yrg)

**Video & broadcast · 15**

[BT.709 Y′CbCr](https://colorjs.github.io/color-space/ycbcr-bt709) · [BT.2020 Y′CbCr](https://colorjs.github.io/color-space/ycbcr-bt2020) · [BT.601 525-line Y′CbCr](https://colorjs.github.io/color-space/ycbcr-bt601-525) · [BT.601 625-line Y′CbCr](https://colorjs.github.io/color-space/ycbcr-bt601-625) · [YCbCr (parameterized)](https://colorjs.github.io/color-space/ycbcr) · [YUV](https://colorjs.github.io/color-space/yuv) · [YIQ](https://colorjs.github.io/color-space/yiq) · [YPbPr](https://colorjs.github.io/color-space/ypbpr) · [YCgCo](https://colorjs.github.io/color-space/ycgco) · [JPEG YCbCr](https://colorjs.github.io/color-space/jpeg) · [YDbDr](https://colorjs.github.io/color-space/ydbdr) · [YcCbcCrc](https://colorjs.github.io/color-space/yccbccrc) · [xvYCC](https://colorjs.github.io/color-space/xvycc) · [SMPTE-C](https://colorjs.github.io/color-space/smpte-c) · [PhotoYCC](https://colorjs.github.io/color-space/photoycc)

**Film & camera · 36**

[ACEScg](https://colorjs.github.io/color-space/acescg) · [ACEScc](https://colorjs.github.io/color-space/acescc) · [ARRI LogC3](https://colorjs.github.io/color-space/logc3) · [Sony S-Log3](https://colorjs.github.io/color-space/slog3) · [ACES2065-1](https://colorjs.github.io/color-space/aces2065-1) · [ACEScct](https://colorjs.github.io/color-space/acescct) · [ARRI LogC4](https://colorjs.github.io/color-space/logc4) · [Cineon](https://colorjs.github.io/color-space/cineon) · [DaVinci Wide Gamut / Intermediate](https://colorjs.github.io/color-space/davinci) · [Sony S-Log2](https://colorjs.github.io/color-space/slog2) · [Panasonic V-Log](https://colorjs.github.io/color-space/vlog) · [RED Log3G10](https://colorjs.github.io/color-space/log3g10) · [Canon Log](https://colorjs.github.io/color-space/clog) · [Canon Log 2](https://colorjs.github.io/color-space/clog2) · [Canon Log 3](https://colorjs.github.io/color-space/clog3) · [Fujifilm F-Log](https://colorjs.github.io/color-space/flog) · [Fujifilm F-Log2](https://colorjs.github.io/color-space/flog2) · [Nikon N-Log](https://colorjs.github.io/color-space/nlog) · [Apple Log](https://colorjs.github.io/color-space/applelog) · [Blackmagic Film Gen 5](https://colorjs.github.io/color-space/bmdfilm) · [DJI D-Log](https://colorjs.github.io/color-space/dlog) · [FilmLight T-Log / E-Gamut](https://colorjs.github.io/color-space/tlog) · [DCDM X′Y′Z′](https://colorjs.github.io/color-space/dcdm) · [Sony S-Log](https://colorjs.github.io/color-space/slog) · [ACESproxy](https://colorjs.github.io/color-space/acesproxy) · [ERIMM RGB](https://colorjs.github.io/color-space/erimm) · [Leica L-Log](https://colorjs.github.io/color-space/llog) · [GoPro Protune](https://colorjs.github.io/color-space/protune) · [Xiaomi Mi-Log](https://colorjs.github.io/color-space/milog) · [OPPO O-Log](https://colorjs.github.io/color-space/olog) · [REDLog](https://colorjs.github.io/color-space/redlog) · [REDLogFilm](https://colorjs.github.io/color-space/redlogfilm) · [RED Log3G12](https://colorjs.github.io/color-space/log3g12) · [Panalog](https://colorjs.github.io/color-space/panalog) · [ViperLog](https://colorjs.github.io/color-space/viperlog) · [Filmic Pro 6](https://colorjs.github.io/color-space/filmicpro)

**Appearance models · 15**

[CAM16](https://colorjs.github.io/color-space/cam16) · [CIECAM02](https://colorjs.github.io/color-space/ciecam02) · [CAM16-UCS](https://colorjs.github.io/color-space/cam16-ucs) · [ZCAM](https://colorjs.github.io/color-space/zcam) · [CAM02-UCS](https://colorjs.github.io/color-space/cam02-ucs) · [CAM16-LCD](https://colorjs.github.io/color-space/cam16-lcd) · [CAM16-SCD](https://colorjs.github.io/color-space/cam16-scd) · [CAM02-LCD](https://colorjs.github.io/color-space/cam02-lcd) · [CAM02-SCD](https://colorjs.github.io/color-space/cam02-scd) · [Hellwig 2022](https://colorjs.github.io/color-space/hellwig2022) · [RLAB](https://colorjs.github.io/color-space/rlab) · [LLAB](https://colorjs.github.io/color-space/llab) · [Nayatani 95](https://colorjs.github.io/color-space/nayatani95) · [Hunt](https://colorjs.github.io/color-space/hunt) · [ATD95](https://colorjs.github.io/color-space/atd95)

**Print & physical · 7**

[CMYK](https://colorjs.github.io/color-space/cmyk) · [Munsell](https://colorjs.github.io/color-space/munsell) · [RYB](https://colorjs.github.io/color-space/ryb) · [CMY](https://colorjs.github.io/color-space/cmy) · [RAL Design](https://colorjs.github.io/color-space/ral-design) · [Coloroid](https://colorjs.github.io/color-space/coloroid) · [Ostwald](https://colorjs.github.io/color-space/ostwald)

**Specialty & research · 6**

[XYB](https://colorjs.github.io/color-space/xyb) · [OSA-UCS](https://colorjs.github.io/color-space/osaucs) · [TSL](https://colorjs.github.io/color-space/tsl) · [YES](https://colorjs.github.io/color-space/yes) · [Ohta I₁I₂I₃](https://colorjs.github.io/color-space/ohta) · [lαβ](https://colorjs.github.io/color-space/lalphabeta)

## Use

```sh
npm install color-space
```

```js
import space from 'color-space';

space.rgb.oklch(255, 128, 0);        // → [0.732, 0.186, 53] — modern CSS
space.slog3.rec2020(0.5, 0.5, 0.5);  // camera log → UHD wide gamut
const perceptual = space.rgb.oklch(pixels); // the same path over an image buffer
space.lab.range;                            // [[0, 100], [-125, 125], [-125, 125]]
```

The names read left to right: `space.<source>.<target>(...channels)`. Methods accept either channel values or an interleaved typed array; batches return a new `Float64Array`. Outputs stay unclamped.

Import one space when that is all you need:

```js
import oklch from 'color-space/oklch.js';
oklch.rgb(0.65, 0.25, 180);          // matches CSS oklch(0.65 0.25 180)
```

| Import | What ships |
|---|---|
| `color-space` | All 161 interconnected spaces · 55 kB gzip |
| `color-space/lite` | 27-space working set · 9 kB gzip |
| `color-space/<name>.js` | One standalone, tree-shakeable space |

[Upgrading from v2?](docs/migration.md)

## Beyond JavaScript

| Need | Entry point | Result |
|---|---|---|
| Batch / standalone WASM | `color-space/wasm` | 27-space in-place hub; zero-import `.wasm` included |
| GLSL or WGSL | `color-space/gl` | Composed shader source for any conversion |
| LUT | `color-space/lut` | Measured `.cube` files for Resolve, Premiere, OBS, ffmpeg |
| ICC | `color-space/icc` | Matrix + TRC or CLUT profiles |
| Metadata | `color-space/data.json` | Channels, ranges, provenance, references, graph, gamuts |
| Agent tools | `npx color-space-mcp` | `convert`, `space`, `spaces`, and `cube` over MCP |

## Why color-space?

- **Conventional ranges.** RGB is 0–255, Lab is 0–100/±125, hue is degrees, and OKLCH matches CSS — no universal 0–1 wrapper to remember.
- **Verified formulas.** Every space is checked against either colorjs.io in both directions or a cited authoritative value — [zero gaps](docs/formula-verification.md).
- **Broad, not padded.** Camera logs, appearance models, video encodings, colorimetry, and historical systems are first-class conversion nodes, not aliases.
- **Small foundations.** Zero dependencies, ESM, tree-shakeable modules, scalar and typed-array forms.

## Comparison

| Library | Spaces | Ranges | Specialty¹ | Backends |
|---|---:|---|---|---|
| **color-space** | **161** | Conventional | ✅ | JS · WASM · GLSL/WGSL · LUT · ICC |
| culori | ~35 | 0–1 | ❌ | JS |
| colorjs.io | ~40 | 0–1 | some | JS |
| texel/color | ~16 | 0–1 | ❌ | JS |

¹ <sup>Camera logs, appearance models, video encodings, and historical systems. See the factual [library comparison](docs/library-comparison.md); `npm run benchmark` compares performance.</sup>

## Scope

This is a conversion kernel, not a color toolbox. Parsing, interpolation, ΔE, gamut mapping, contrast, palettes, and alpha stay with the application layer.

Pantone, NCS, RAL Classic, HKS, Toyo, and similar systems are proprietary or licensed swatch catalogs rather than open coordinate systems. RAL **Design** is included because its HLC notation is CIELAB by construction.

## Motivation

Color spaces are scattered across standards, papers, industries, and decades. This project keeps their formulas, conventional ranges, provenance, and references together in one open collection, connected by one minimal API.

The interactive atlas, corrections to published formulas, and useful test cases for JS→WASM compilers ([porffor](https://github.com/CanadaHonk/porffor), [jz](https://github.com/dy/jz)) are consequences of maintaining that foundation.

## Credits

Thanks to everyone who contributes to color science — researchers, theorists, specifiers, implementors, and the libraries that informed this one: [culori](https://github.com/Evercoder/culori), [colorjs.io](https://colorjs.io/), [color-api](https://github.com/LeaVerou/color-api), and [texel/color](https://github.com/texel-org/color).

<p align="center"><a href="license.md">CC0</a> · <a href="https://github.com/krsnzd/license/">ॐ</a></p>

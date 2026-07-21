# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/master/web/img/banner.svg" alt="the Ostwald hue circle at full color, shown continuously and in ten steps" width="100%"/>

**An open collection of color spaces.**

Web, print, film, broadcast, photo, art, human vision, science, history. Conversions, metadata, provenance, references.

**[Atlas →](https://color-space.io/)**

## Use

```js
import space from 'color-space';

space.rgb.oklch(255, 128, 0);        // → [0.732, 0.186, 53] — modern CSS
space.slog3.rec2020(0.5, 0.5, 0.5);  // camera log → UHD wide gamut
space.rgb.xyz(300, -10, 0);          // → [59.7, 30.6, 2.8] — out-of-range in, unclamped out

// batch
space.rgb.oklch([255, 128, 0,  0, 255, 128]); // [0.732, 0.186, 53,  0.875, 0.234, 151]

// meta
space.lab.range;                     // [[0, 100], [-125, 125], [-125, 125]]
```

Import individually:

```js
// single space
import oklch from 'color-space/oklch.js';
oklch.rgb(0.65, 0.25, 180);          // matches CSS oklch(0.65 0.25 180)
```

| Import | What ships |
|---|---|
| `color-space` | All 162 interconnected spaces · 55 kB gzip |
| `color-space/<name>.js` | One standalone, tree-shakeable space |
| `color-space/lite` | 27-space working set · 9 kB gzip |
| `color-space/wasm` | lite set WASM version; zero-import `.wasm` included. |
| `color-space/gl` | Composed shader source GLSL/WGSL |
| `color-space/lut` | Measured `.cube` files for Resolve, Premiere, OBS, ffmpeg — [verified vs ACES](docs/lut-verification.md) |
| `color-space/icc` | Matrix + TRC or CLUT profiles |
| `color-space/data.json` | Metadata: channels, ranges, provenance, references, graph, gamuts |
| `npx --yes --package color-space color-space-mcp` | Agent tools: `convert`, `space`, `spaces`, and `cube` over MCP |

[Upgrading from v2?](docs/migration.md)

## Spaces


<table><tr><td valign="top">

**Display & web**<br>
<sub>[sRGB](https://color-space.io/rgb) · [Display P3](https://color-space.io/p3) · [Rec. 2020](https://color-space.io/rec2020) · [Linear-light sRGB](https://color-space.io/lrgb) · [Rec. 709](https://color-space.io/rec709) · [ProPhoto RGB](https://color-space.io/prophoto) · [Adobe RGB (1998)](https://color-space.io/a98rgb) · [DCI-P3](https://color-space.io/dci-p3) · [Linear Display P3](https://color-space.io/p3-linear) · [Linear Rec. 2020](https://color-space.io/rec2020-linear) · [Linear Adobe RGB (1998)](https://color-space.io/a98rgb-linear) · [Linear ProPhoto RGB](https://color-space.io/prophoto-linear) · [scRGB](https://color-space.io/scrgb) · [RIMM RGB](https://color-space.io/rimm) · [CIE RGB](https://color-space.io/cie-rgb) · [NTSC RGB (1953)](https://color-space.io/ntsc) · [PAL / SECAM RGB](https://color-space.io/pal) · [Apple RGB](https://color-space.io/apple-rgb) · [SMPTE-240M](https://color-space.io/smpte-240m)</sub>

**Cylindrical**<br>
<sub>[HSL](https://color-space.io/hsl) · [HSV / HSB](https://color-space.io/hsv) · [HWB](https://color-space.io/hwb) · [HSI](https://color-space.io/hsi) · [HCG](https://color-space.io/hcg) · [HCL](https://color-space.io/hcl) · [HSP](https://color-space.io/hsp) · [HCY](https://color-space.io/hcy) · [HSM](https://color-space.io/hsm)</sub>

**Perceptual — modern**<br>
<sub>[OKLCH](https://color-space.io/oklch) · [OKLab](https://color-space.io/oklab) · [HCT](https://color-space.io/hct) · [Okhsl](https://color-space.io/okhsl) · [Okhsv](https://color-space.io/okhsv) · [Okhwb](https://color-space.io/okhwb) · [OKLrAB](https://color-space.io/oklrab) · [OKLrCH](https://color-space.io/oklrch) · [SRLAB2](https://color-space.io/srlab2) · [proLab](https://color-space.io/prolab) · [sUCS](https://color-space.io/sucs) · [IgPgTg](https://color-space.io/igpgtg)</sub>

**Perceptual — CIE classic**<br>
<sub>[CIELAB](https://color-space.io/lab) · [CIELChab](https://color-space.io/lchab) · [CIELUV](https://color-space.io/luv) · [HSLuv](https://color-space.io/hsluv) · [CIELChuv](https://color-space.io/lchuv) · [CIELAB D65](https://color-space.io/lab-d65) · [CIELCh D65](https://color-space.io/lch-d65) · [HPLuv](https://color-space.io/hpluv) · [DIN99o Lab](https://color-space.io/din99o-lab) · [DIN99o LCh](https://color-space.io/din99o-lch) · [DIN99d](https://color-space.io/din99d) · [Hunter Lab](https://color-space.io/labh) · [CIE 1960 UCS](https://color-space.io/ucs) · [CIE 1964 UVW](https://color-space.io/uvw) · [Adams–Nickerson Lab](https://color-space.io/anlab)</sub>

**HDR & wide gamut**<br>
<sub>[ICtCp](https://color-space.io/ictcp) · [Jzazbz](https://color-space.io/jzazbz) · [Rec. 2100 PQ](https://color-space.io/rec2100-pq) · [Rec. 2100 HLG](https://color-space.io/rec2100-hlg) · [JzCzHz](https://color-space.io/jzczhz) · [IPT](https://color-space.io/ipt) · [Izazbz](https://color-space.io/izazbz) · [Linear Rec. 2100](https://color-space.io/rec2100-linear) · [hdr-IPT](https://color-space.io/hdr-ipt) · [hdr-CIELAB](https://color-space.io/hdr-cie-lab) · [ICaCb](https://color-space.io/icacb)</sub>

**Colorimetry & vision**<br>
<sub>[CIE XYZ (D65)](https://color-space.io/xyz) · [CIE xyY](https://color-space.io/xyy) · [LMS](https://color-space.io/lms) · [CIE XYZ (D50)](https://color-space.io/xyz-d50) · [CIE 1976 u′v′](https://color-space.io/uv) · [CCT + Duv](https://color-space.io/cct-duv) · [Color temperature (Kelvin)](https://color-space.io/kelvin) · [Maxwell triangle](https://color-space.io/maxwell) · [Wavelength](https://color-space.io/wavelength) · [Absolute XYZ D65](https://color-space.io/xyz-abs-d65) · [MacLeod–Boynton](https://color-space.io/macboyn) · [DKL](https://color-space.io/dkl) · [Grayscale](https://color-space.io/gray) · [Dominant wavelength / DSH](https://color-space.io/dsh) · [rg chromaticity](https://color-space.io/rg) · [Yrg (Kirk 2019)](https://color-space.io/yrg)</sub>

</td><td valign="top">

**Video & broadcast**<br>
<sub>[BT.709 Y′CbCr](https://color-space.io/ycbcr-bt709) · [BT.2020 Y′CbCr](https://color-space.io/ycbcr-bt2020) · [BT.601 525-line Y′CbCr](https://color-space.io/ycbcr-bt601-525) · [BT.601 625-line Y′CbCr](https://color-space.io/ycbcr-bt601-625) · [YCbCr (parameterized)](https://color-space.io/ycbcr) · [YUV](https://color-space.io/yuv) · [YIQ](https://color-space.io/yiq) · [YPbPr](https://color-space.io/ypbpr) · [YCgCo](https://color-space.io/ycgco) · [JPEG YCbCr](https://color-space.io/jpeg) · [YDbDr](https://color-space.io/ydbdr) · [YcCbcCrc](https://color-space.io/yccbccrc) · [xvYCC](https://color-space.io/xvycc) · [SMPTE-C](https://color-space.io/smpte-c) · [PhotoYCC](https://color-space.io/photoycc)</sub>

**Film & camera**<br>
<sub>[ACEScg](https://color-space.io/acescg) · [ACEScc](https://color-space.io/acescc) · [ARRI LogC3](https://color-space.io/logc3) · [Sony S-Log3](https://color-space.io/slog3) · [Sony S-Gamut3.Cine](https://color-space.io/sgamut3cine) · [ACES2065-1](https://color-space.io/aces2065-1) · [ACEScct](https://color-space.io/acescct) · [ARRI LogC4](https://color-space.io/logc4) · [Cineon](https://color-space.io/cineon) · [DaVinci Wide Gamut / Intermediate](https://color-space.io/davinci) · [Sony S-Log2](https://color-space.io/slog2) · [Panasonic V-Log](https://color-space.io/vlog) · [RED Log3G10](https://color-space.io/log3g10) · [Canon Log](https://color-space.io/clog) · [Canon Log 2](https://color-space.io/clog2) · [Canon Log 3](https://color-space.io/clog3) · [Fujifilm F-Log](https://color-space.io/flog) · [Fujifilm F-Log2](https://color-space.io/flog2) · [Nikon N-Log](https://color-space.io/nlog) · [Apple Log](https://color-space.io/applelog) · [Blackmagic Film Gen 5](https://color-space.io/bmdfilm) · [DJI D-Log](https://color-space.io/dlog) · [FilmLight T-Log / E-Gamut](https://color-space.io/tlog) · [DCDM X′Y′Z′](https://color-space.io/dcdm) · [Sony S-Log](https://color-space.io/slog) · [ACESproxy](https://color-space.io/acesproxy) · [ERIMM RGB](https://color-space.io/erimm) · [Leica L-Log](https://color-space.io/llog) · [GoPro Protune](https://color-space.io/protune) · [Xiaomi Mi-Log](https://color-space.io/milog) · [OPPO O-Log](https://color-space.io/olog) · [REDLog](https://color-space.io/redlog) · [REDLogFilm](https://color-space.io/redlogfilm) · [RED Log3G12](https://color-space.io/log3g12) · [Panalog](https://color-space.io/panalog) · [ViperLog](https://color-space.io/viperlog) · [Filmic Pro 6](https://color-space.io/filmicpro)</sub>

**Appearance models**<br>
<sub>[CAM16](https://color-space.io/cam16) · [CIECAM02](https://color-space.io/ciecam02) · [CAM16-UCS](https://color-space.io/cam16-ucs) · [ZCAM](https://color-space.io/zcam) · [CAM02-UCS](https://color-space.io/cam02-ucs) · [CAM16-LCD](https://color-space.io/cam16-lcd) · [CAM16-SCD](https://color-space.io/cam16-scd) · [CAM02-LCD](https://color-space.io/cam02-lcd) · [CAM02-SCD](https://color-space.io/cam02-scd) · [Hellwig 2022](https://color-space.io/hellwig2022) · [RLAB](https://color-space.io/rlab) · [LLAB](https://color-space.io/llab) · [Nayatani 95](https://color-space.io/nayatani95) · [Hunt](https://color-space.io/hunt) · [ATD95](https://color-space.io/atd95)</sub>

**Print & physical**<br>
<sub>[CMYK](https://color-space.io/cmyk) · [Munsell](https://color-space.io/munsell) · [RYB](https://color-space.io/ryb) · [CMY](https://color-space.io/cmy) · [RAL Design](https://color-space.io/ral-design) · [Coloroid](https://color-space.io/coloroid) · [Ostwald](https://color-space.io/ostwald)</sub>

**Specialty & research**<br>
<sub>[XYB](https://color-space.io/xyb) · [OSA-UCS](https://color-space.io/osaucs) · [TSL](https://color-space.io/tsl) · [YES](https://color-space.io/yes) · [Ohta I₁I₂I₃](https://color-space.io/ohta) · [lαβ](https://color-space.io/lalphabeta)</sub>

</td></tr></table>


## Motivation

The purpose is to have a complete collection of color spaces with minimal, consistent and clean API, verified formulas and cases. While alternatives focus on digital color spaces, this project takes broader perspective, covering historical and cross-disciplinary spaces as well.

Some side effects:

Verifying and correcting papers.
Visualising and educating about color spaces.
Providing test cases for JS to WASM compilers (porffor, jz).


Color spaces are scattered across standards, papers, industries, and decades. This collection keeps the formulas, conventional ranges, provenance, and references together, behind one minimal API.

- **Conventional ranges.** RGB is 0–255, Lab is 0–100/±125, hue is degrees, and OKLCH matches CSS — no universal 0–1 wrapper to remember.
- **Verified formulas.** All 162 spaces have cited anchor; 29 are additionally differential-tested against colorjs.io in both directions — [methods and limits](docs/formula-verification.md).
- **Broad, not padded.** Camera logs, appearance models, video encodings, colorimetry, and historical systems are first-class conversion nodes, not aliases.
- **Small foundations.** Zero dependencies, ESM, tree-shakeable modules, scalar and typed-array forms.

It is not a color toolbox — parsing, interpolation, ΔE, gamut mapping, contrast, palettes, and alpha stay out. Pantone, NCS, RAL Classic, and similar licensed swatch catalogs aren't open and stay out as well.

## Credits

Thanks to everyone who contributes to color science — researchers, theorists, specifiers, implementors, and the libraries that informed this one.

## Alternatives

| Library | Spaces | Ranges | Specialty | Backends | Speed |
|---|---:|---|---|---|---:|
| **color-space** | **162** | Conventional | ✅ | JS · WASM · GLSL/WGSL · LUT · ICC | **36.4** |
| color-space/wasm | 27 | Conventional | — | WASM | 32.7 (batch) |
| [culori](https://github.com/Evercoder/culori) | ~35 | 0–1 | ❌ | JS | 16.1 |
| [colorjs.io](https://colorjs.io/) | ~40 | 0–1 | some | JS | 0.7 |
| [texel/color](https://github.com/texel-org/color) | ~16 | 0–1 | ❌ | JS | 15.9 |
| [chroma-js](https://github.com/gka/chroma.js) | ~12 | mixed | ❌ | JS | 3.4 |
| [d3-color](https://github.com/d3/d3-color) | 6 | mixed | ❌ | JS | 34.4 |


<p align="center"><a href="license.md">CC0</a> · <a href="https://github.com/krsnzd/license/">ॐ</a></p>

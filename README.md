# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/gh-pages/logo.png" width="100%" height="150"/>

**Any color space.** Web, print, film, broadcast, photo, art, science, history. Conventional ranges, verified formulas, metadata, one tiny API. Zero dependencies, tree-shakeable to 0.4–1.5 kB per space. JS, WASM, GLSL, LUT, ICC.

**[Interactive atlas →](https://colorjs.github.io/color-space/)**

## Use

```sh
npm install color-space
```

```js
import space from 'color-space';       // all 161 spaces          55 kB gz
import space from 'color-space/lite';  // the 27-space working set  9 kB gz
import space from 'color-space/wasm';  // the same 27, prebuilt WASM

space.rgb.hsl(255, 128, 0);          // → [30, 100, 50] — reads as CSS hsl(30 100% 50%)
space.slog3.rec2020(0.5, 0.5, 0.5);  // camera log → broadcast, any of 161 × 160 pairs
space.lab.range;                     // [[0, 100], [-125, 125], [-125, 125]]

space.rgb.oklch(pixels);             // batch form, converts in-place

// one space
import oklch from 'color-space/oklch.js';
oklch.rgb(0.65, 0.25, 180);          // args match CSS oklch(0.65 0.25 180)
```

| import | what |
|---|---|
| `color-space` | all 161 spaces |
| `color-space/<name>.js` | one space |
| `color-space/lite` | 27 main spaces, 9 kB |
| `color-space/wasm` | lite set prebuilt WASM |
| `color-space/gl` | GLSL/WGSL shader |
| `color-space/lut` | `.cube` LUT exporter (Resolve, ffmpeg, …) |
| `color-space/icc` | ICC display-profile exporter |
| `color-space/data.json` | metadata, graph edges, gamuts, whitepoints, CMFs, conformance |
| `color-space/gamuts.js` · `/whitepoints.js` | primary chromaticities · CIE illuminant tables |
| `color-space/hub.js` | the wiring |
| `npx color-space-mcp` | MCP server — the same conversions as agent tools |

**Upgrading from v2?** [Migration guide](docs/migration.md).

## Meta

```js
import data from 'color-space/data.json' with { type: 'json' };
data.spaces.oklab;   // { description, channels, range, refs, wiki, year, by, use,
                     //   method, encoding, referred, dynamic, neighbors }
data.spaces.kelvin.loss;   // 'projective' | 'lookup' | 'quantized'
data.spaces.p3;      // RGB working spaces add: illuminant, observer, gamut, primaries {r,g,b}, white

import whitepoint from 'color-space/whitepoints.js';
whitepoint[2].D50;   // → [96.422, 100, 82.521]

import gamut from 'color-space/gamuts.js';
gamut.srgb;   // { primaries: { r:[0.64,0.33], g:[0.30,0.60], b:[0.15,0.06] }, white: 'D65' }
```

## WASM

```js
import space, { alloc } from 'color-space/wasm';

const buf = alloc(width * height);   // WASM-backed Float64Array, interleaved r,g,b
space.rgb.oklch(buf);                // converts in place — nothing crosses the boundary
```

Covers the `lite` set: the numeric pipeline (rgb/lrgb/xyz · OKLab · Lab/Luv/DIN99 · HDR · camera logs). Device cylinders and lookup/appearance spaces gain nothing from batching — the full catalog carries those.

## GL/WGSL

Every space but `munsell` ships as a GLSL shader chunk with a WGSL translation — plain data (`{ name, deps, edges, code }`, three.js-style), composed into source on demand, no build step. Import the spaces you convert, name the conversion:

```js
import { glsl, wgsl } from 'color-space/gl';
import oklch from 'color-space/gl/oklch';
import p3    from 'color-space/gl/p3';

glsl(oklch, 'rgb');   // GLSL `vec3 oklch_rgb(vec3 c)`  (cf. scalar oklch.rgb(l,c,h))
glsl(oklch);          // both ways: rgb ↔ oklch
glsl(oklch, p3);      // neither end rgb — routed via their shared lrgb
wgsl(oklch);          // the same, as WGSL
```

A chunk import brings only its own dependency chain (~5 kB) and stays pure data — `oklch.code` is its raw GLSL. Runtime `from`/`to` strings: `import { glsl } from 'color-space/gl/all'` routes any of the 160 shader-backed names, byte-identical, at the cost of all chunks (~200 kB min).

## LUT

Any conversion as a `.cube` file — the format the film world reads without JavaScript: DaVinci Resolve, Premiere, Final Cut, OBS, ffmpeg. No code path either: every space's page in the [catalog](https://colorjs.github.io/color-space/) downloads one.

```js
import { cube } from 'color-space/lut';

cube(space.slog3, space.rec709);     // camera log → broadcast, 33³ (17/33/65 via {size})
cube(space.rec709, space.rgb);       // pure transfer — auto-emits 1D, 4096 pt
```

Every file states its own accuracy — the header carries the measured deviation of the lattice against the direct conversion at random off-lattice points:

```
# input: slog3 0–1 · output: rec709 0–1, unclamped
# trilinear lattice vs direct conversion, 1000 off-lattice samples, fractions of full scale: median 4.8e-3, max 8.8e-1 · in-range outputs (2.5% of domain, 1000 samples): median 2.0e-3, max 9.5e-2
```

```sh
ffmpeg -i in.mov -vf lut3d=slog3-to-rec709.cube out.mov
```

The domain is the source's conventional range mapped 0–1 (rgb 0–255 rides as 0–1, like image data); outputs are unclamped. Degenerate corners throw rather than bake a broken file; hue-axed spaces are curated out (hue doesn't survive lattice interpolation), leaving 117 of 161. Keep 3D sizes ≤129 for OpenColorIO. Lower-level exports: `table` · `apply` · `verify` · `channelwise`.

`{ shaper: true }` prepends the conversion's own tone curve as a 1D shaper (Resolve and OCIO read the combined cube; ffmpeg's `lut3d` doesn't). A shaped 33³ beats a plain 65³ for camera-log → display at ⅙ the file size, measured.

## ICC

The color-management analog of the LUT: any matrix×transfer RGB working space as an ICC v2 display profile — Photoshop, macOS/Windows CM, browsers, printers:

```js
import { profile } from 'color-space/icc';

profile(space.p3);         // → Uint8Array — a Display P3 .icc
profile(space.prophoto);   // ROMM RGB; linear spaces emit the identity curve
```

Everything derives from the space's own conversions — colorants from the full-intensity primaries (Bradford-adapted to the D50 PCS), the TRC from the neutral diagonal. A space that isn't empirically matrix×transfer (cylinders, luma/chroma, opponent) throws rather than emit a lying profile. Colorants are pinned to Lindbloom's D50 matrices, the TRC to IEC 61966-2-1, and every profile passes macOS ColorSync in the suite.

## MCP

Color math is what language models hallucinate — plausible matrices, wrong in the third decimal. The zero-dependency MCP server lets agents call the verified conversions instead:

```json
{ "mcpServers": { "color-space": { "command": "npx", "args": ["color-space-mcp"] } } }
```

Tools: `convert` (any pair) · `space` (the dossier: refs, ranges, provenance) · `spaces` · `cube` (a LUT file).

## Spaces

<details><summary><b>Display & Web</b></summary>

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
* [x] [CIE RGB](https://en.wikipedia.org/wiki/CIE_1931_color_space) 🕰️ — the original 1931 Wright-Guild RGB (700/546.1/435.8 nm, white E) that defined XYZ.
* [x] [NTSC RGB (1953)](https://www.itu.int/rec/R-REC-BT.470) 🕰️ — the founding FCC broadcast primaries (Illuminant C); a ubiquitous gamut benchmark.
* [x] [PAL / SECAM RGB](https://www.itu.int/rec/R-REC-BT.470) 🕰️ — European 625-line primaries (EBU 3213), distinct from Rec.709.
* [x] [Apple RGB](http://www.brucelindbloom.com/WorkingSpaceInfo.html) 🕰️ — classic Mac/Photoshop working space (Trinitron, γ1.8).
* [x] [SMPTE-240M](https://ieeexplore.ieee.org/document/7291461) 🕰️ — interim HDTV (SMPTE-C primaries + the 240M OETF).

> **Skipped RGB working spaces** 🕰️ — *Best, Beta, Bruce, Don RGB 4, Ekta Space PS5, ColorMatch, Wide-Gamut RGB* (niche ~2000-era photo-retouching profiles, no current use) and *NTSC-J* (a D93 white-point tweak of NTSC). All are just primaries + white + a gamma, so any can be added in one line via `register()` with the standard matrix method — not worth their own modules.

</details>

<details><summary><b>User-Friendly Cylindrical</b></summary>

* [x] [HSL](https://www.w3.org/TR/css-color-4/#the-hsl-notation) — hue/saturation/lightness for CSS and color pickers.
* [x] [HSV, HSB](https://en.wikipedia.org/wiki/HSL_and_HSV) — hue/saturation/value, preferred in graphics software (Photoshop, etc).
* [x] [HWB](https://www.w3.org/TR/css-color-4/#the-hwb-notation) — hue/whiteness/blackness, intuitive for paint mixing mental model.
* [x] [HSI](https://ieeexplore.ieee.org/document/6185466) — hue/saturation/intensity, decouples chrominance for computer vision.
* [x] [HCG](https://github.com/acterhd/hcg-legacy) — hue/chroma/gray, alternative cylindrical model.
* [x] [HCL](http://www.chilliant.com/rgb2hsv.html) — hue/chroma/luminance, attempt at perceptual cylindrical.
* [x] [HSP](http://alienryderflex.com/hsp.html) — perceived brightness weighting (0.299R + 0.587G + 0.114B).
* [x] [HCY](http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html) — luma-based cylindrical for shader programming.
* [x] [HSM](https://doi.org/10.22456/2175-2745.17323) — hue/saturation/mixture for image segmentation.

</details>

<details><summary><b>Perceptual Uniform — Modern</b></summary>

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
* [x] [SRLAB2](https://www.magnetkern.de/srlab2.html) — "best of CIELAB and CIECAM02": CAT02 adaptation + a CIELAB-like opponent stage (Behrens).
* [x] [IgPgTg](https://doi.org/10.2352/issn.2169-2629.2020.28.13) — IPT-structured uniform space with gamut-relative cone scaling; CAM16-UCS-class hue uniformity from three matrices and a power. (Hensley & Fairchild 2020)

> **Documented variants:** [IPT-Ragoo 2021](https://doi.org/10.2352/issn.2169-2629.2021.29.13) (re-optimised IPT fit — same structure as our `ipt`), [Hunter Rd,a,b](https://doi.org/10.1364/JOSA.32.000509) (the pre-1958 form of `labh`), original [DIN99 / 99b / 99c](https://de.wikipedia.org/wiki/DIN99-Farbraum) (superseded by the shipped DIN99o/DIN99d), [IHLS](https://doi.org/10.1109/ICIP.2003.1246629) (Hanbury's improved HLS — `hsl` with a luma axis), [Prismatic](https://doi.org/10.1016/j.cag.2015.04.007) (max-normalised barycentric rgb — a display trick, not colorimetry).

</details>

<details><summary><b>Perceptual Uniform — CIE Classic</b></summary>

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

</details>

<details><summary><b>HDR & Wide Gamut</b></summary>

* [x] [Jzazbz](https://observablehq.com/@jrus/jzazbz) — perceptually uniform for HDR, handles 10,000+ nits. ([Safdar et al. 2017](https://doi.org/10.1364/OE.25.015131))
* [x] [JzCzHz](https://www.w3.org/TR/css-color-hdr/#JzCzHz) — polar Jzazbz for HDR hue/chroma work. CSS Color HDR draft.
* [x] [Rec. 2100 PQ](https://www.itu.int/rec/R-REC-BT.2100) — HDR with perceptual quantizer (Dolby), 10,000 nits. (ITU-R BT.2100)
* [x] [Rec. 2100 HLG](https://www.itu.int/rec/R-REC-BT.2100) — HDR with hybrid log-gamma (BBC/NHK), backwards compatible.
* [x] [ICTCP](https://www.itu.int/rec/R-REC-BT.2100) — perceptual HDR space, constant hue/luminance lines. (ITU-R BT.2100)
* [x] [IPT](https://doi.org/10.1002/(SICI)1520-6378(199812)23:6%3C385::AID-COL6%3E3.0.CO;2-J) — Ebner & Fairchild (1998) opponent space, the structural ancestor of ICtCp.
* [x] [Rec. 2100 Linear](https://www.itu.int/rec/R-REC-BT.2100) — linear-light BT.2100 HDR (BT.2020 primaries; 1.0 = 203 cd/m²). (ITU-R BT.2100)
* [x] [ICaCb](https://github.com/colour-science/colour/blob/develop/colour/models/icacb.py) — Fröhlich (2017) HDR opponent space (ICtCp-style, PQ-based, JND-tuned).
* [x] [hdr-IPT](https://library.imaging.org/cic/articles/18/1/art00057) — IPT with a luminance-adaptive Michaelis-Menten lightness. ([Fairchild & Wyble 2010](https://library.imaging.org/cic/articles/18/1/art00057))
* [x] [hdr-CIELAB](https://library.imaging.org/cic/articles/18/1/art00057) — CIELAB with the same luminance-adaptive lightness. ([Fairchild & Wyble 2010](https://library.imaging.org/cic/articles/18/1/art00057))

</details>

<details><summary><b>Colorimetry Foundation</b></summary>

* [x] [XYZ](https://www.w3.org/TR/css-color-4/#cie-xyz) — CIE 1931, the foundation of all colorimetry. Device-independent reference. ([CIE 15:2004](https://cie.co.at/publications/colorimetry-4th-edition))
* [x] [XYY (xyY)](http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html) — chromaticity diagram coordinates, separates luminance from chromaticity.
* [x] [LMS](https://www.sciencedirect.com/science/article/pii/S0042698999000887) — cone response space (long/medium/short wavelength), basis for chromatic adaptation. (matrices: HPE, Bradford, CAT02/16, von Kries, Stockman-Sharpe 2000)
* [x] [CIE 1976 UCS (u′v′)](https://en.wikipedia.org/wiki/CIELUV#The_CIE_1976_UCS_diagram) — the modern uniform chromaticity diagram (LED binning, Δu′v′, CCT).
* [x] [MacLeod-Boynton](https://doi.org/10.1364/JOSA.69.001183) — cone-excitation ls chromaticity (Smith-Pokorny), foundation of DKL/vision science.
* [x] [DKL](https://doi.org/10.1113/jphysiol.1984.sp015499) — Derrington-Krauskopf-Lennie cardinal-axis space of early colour vision (luminance / red-green / tritan).
* [x] [Izazbz](https://doi.org/10.1364/OE.25.015131) — the absolute opponent stage Jzazbz/ZCAM build on (Safdar 2017).
* [x] [Kelvin (CCT)](https://en.wikipedia.org/wiki/Planckian_locus) — colour temperature on the Planckian locus (2700 K warm … 6500 K cool); Krystek locus, inverse = nearest locus point in CIE 1960 uv (the CCT definition) — exact round-trip on the locus, projective (lossy) off it.
* [x] [CCT + Duv](https://doi.org/10.1080/15502724.2014.839020) — lighting's two-coordinate white specification: nearest Planckian temperature plus signed green–pink distance in CIE 1960 uv.
* [x] [Maxwell triangle](https://doi.org/10.1017/S1464793102005985) — barycentric trichromatic receptor-catch diagram, anchored to the graph's fixed human LMS observer.
* [x] [Wavelength](https://en.wikipedia.org/wiki/Spectral_color) — the colour of monochromatic light (the spectral locus / rainbow) via the CIE 1931 CMFs.
* [x] [Yrg (Kirk 2019)](https://doi.org/10.2352/issn.2169-2629.2019.27.38) — FilmLight's luminance/cone-chromaticity space on CIE 2006 LMS; the basis of darktable's colour-balance UCS. Exact algebraic inverse.
* [x] [Gray](https://www.w3.org/TR/css-color-4/#grays) — single-channel luminance.

</details>

<details><summary><b>Video & Broadcast</b></summary>

* [x] [YUV](https://www.itu.int/rec/R-REC-BT.601) — luma + chrominance, analog PAL/SECAM encoding. (ITU-R BT.601)
* [x] [YIQ](https://en.wikipedia.org/wiki/YIQ) — analog NTSC encoding, I/Q chosen for bandwidth efficiency.
* [x] [YC<sub>b</sub>C<sub>r</sub>](https://www.itu.int/rec/R-REC-BT.601) — legacy parameterised digital luma/chroma node.
* [x] [BT.601 525-line / 625-line Y′CbCr](https://www.itu.int/rec/R-REC-BT.601) — explicit legal-range SD encodings, separated because NTSC-derived SMPTE-C and PAL/EBU primaries differ.
* [x] [BT.709 Y′CbCr](https://www.itu.int/rec/R-REC-BT.709) — explicit legal-range HDTV encoding with Rec.709 primaries, OETF, and coefficients.
* [x] [BT.2020 Y′CbCr](https://www.itu.int/rec/R-REC-BT.2020) — explicit non-constant-luminance legal-range UHD encoding.
* [x] [Y<sub>c</sub>C<sub>bc</sub>C<sub>rc</sub>](https://www.itu.int/rec/R-REC-BT.2020) — constant-luminance YCbCr for BT.2020/HDR. (ITU-R BT.2020)
* [x] [YP<sub>b</sub>P<sub>r</sub>](https://en.wikipedia.org/wiki/YPbPr) — analog component video (DVD players, projectors).
* [x] [YD<sub>b</sub>D<sub>r</sub>](https://en.wikipedia.org/wiki/YDbDr) — SECAM analog encoding (France, Russia, Africa).
* [x] [YC<sub>g</sub>C<sub>o</sub>](https://www.microsoft.com/en-us/research/publication/the-h-264-advanced-video-coding-standard/) — lossless/low-cost video compression, integer-only transforms.
* [x] [JPEG](https://www.w3.org/Graphics/JPEG/jfif3.pdf) — full-range YCbCr for JPEG/JFIF compression.
* [x] [XvYCC](https://www.itu.int/rec/R-REC-BT.1361) — extended-gamut video, allows out-of-range RGB values. (IEC 61966-2-4)
* [x] [SMPTE-C](https://en.wikipedia.org/wiki/NTSC#SMPTE_C) — 525-line NTSC broadcast (SMPTE 170M primaries, D65, BT.601 transfer).

</details>

<details><summary><b>Film & Professional</b></summary>

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
* [x] [DaVinci Intermediate](https://documents.blackmagicdesign.com/InformationNotes/DaVinci_Resolve_17_Wide_Gamut_Intermediate.pdf) — DaVinci Resolve's default working space: DI log + DaVinci Wide Gamut (whitepaper matrices).
* [x] [FilmLight T-Log / E-Gamut](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmLightTLog.html) — Baselight's working space (w=128, g=16, o=0.075).
* [x] [DCDM X′Y′Z′](https://ieeexplore.ieee.org/document/7290729) — the encoding inside every cinema DCP: gamma-2.6 XYZ (SMPTE ST 428-1, ST 431-1 48 cd/m² white).
* [x] [ACESproxy](https://docs.acescentral.com/specifications/acesproxy/) — the Academy's on-set SDI transport (S-2013-001); quantised to integral code values by design.
* [x] [ERIMM RGB](https://www.iso.org/standard/58005.html) — extended-range log ROMM/RIMM sibling (ISO 22028-3), scene exposures 0.001-316.2.
* [x] [Leica L-Log](https://leica-camera.com/sites/default/files/2021-11/L-Log_Reference_Manual_EN.pdf) — Leica's log (SL2-S+) in a BT.2020 container.
* [x] [GoPro Protune](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Protune.html) — Protune flat profile + Protune Native primaries.
* [x] [Xiaomi Mi-Log](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_MiLog.html) — Mi-Log (14/15 Ultra), Apple-Log-shaped curve, BT.2020 container.
* [x] [OPPO O-Log](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_OPPOOLog.html) — O-Log natural-log profile, BT.2020 container.
* [x] [Sony S-Log (1)](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog.html) 🕰️ — the original F35/F3-era S-Log + S-Gamut.
* [x] [REDLog](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLog.html) / [REDLogFilm](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLogFilm.html) 🕰️ — RED One-era 10-bit log and the Cineon-compatible variant, over REDcolor.
* [x] [RED Log3G12](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log3G12.html) 🕰️ — Log3G10's predecessor (grey → exactly ⅓) over REDWideGamutRGB.
* [x] [Panalog](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Panalog.html) 🕰️ — Panavision Genesis Cineon-style log (black 64 / white 681).
* [x] [ViperLog](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_ViperLog.html) 🕰️ — Thomson Viper FilmStream pure log10 (no black offset — the flaw its successors fixed).
* [x] [Filmic Pro 6](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmicPro6.html) 🕰️ — the iOS app's v6 √+ln hybrid curve (Newton-inverted; y(1)=1 by construction).

> **Documented variants (parameter tweaks of the above, not separate modules):** [Log2 / PLog](https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log2.html) (generic Nuke utility curves), [S-Gamut3.Cine](https://pro.sony/ue_US/technology/s-log) (alternate Sony primaries), REDcolor2-4 / DRAGONcolor (RED primaries generations), [sYCC](https://www.color.org/sycc.pdf) (BT.601 YCbCr over sRGB ≈ our `jpeg`), [YDzDx](https://ieeexplore.ieee.org/document/7290558) (SMPTE ST 2085 XYZ-based mastering signal), [ITP](https://www.itu.int/rec/R-REC-BT.2124) (BT.2124 ΔE scaling of `ictcp`: T = Ct/2), [DICOM GSDF](https://dicom.nema.org/medical/dicom/current/output/chtml/part14/chapter_4.html) (medical grayscale EOTF, not a colour space).

</details>

<details><summary><b>Color Appearance</b></summary>

* [x] [CAM16](https://doi.org/10.1002/col.22131) — CIE color appearance model, handles viewing conditions (lighting, surround). ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [CAM16-UCS](https://doi.org/10.1002/col.22131) — uniform CAM16 (J′a′b′) for ΔE and gamut mapping. ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [CIECAM02](https://doi.org/10.1002/col.10125) — predecessor to CAM16, still used in ICC v4 profiles. ([Moroney et al. 2002](https://doi.org/10.2352/CIC.2002.10.1.art00006))
* [x] [CAM02-UCS](https://doi.org/10.1002/col.20227) — uniform CIECAM02 (J′a′b′) for ΔE. ([Luo, Cui & Li 2006](https://doi.org/10.1002/col.20227))
* [x] [CAM02-LCD / SCD](https://doi.org/10.1002/col.20227) — CIECAM02 uniform spaces tuned for large / small colour differences. ([Luo, Cui & Li 2006](https://doi.org/10.1002/col.20227))
* [x] [CAM16-LCD / SCD](https://doi.org/10.1002/col.22131) — CAM16 large / small colour-difference variants. ([Li et al. 2017](https://doi.org/10.1002/col.22131))
* [x] [Hellwig 2022](https://doi.org/10.1002/col.22792) — CIE-recommended CAM16 successor (CIECAM16 basis): linearised brightness + Helmholtz-Kohlrausch. ([Hellwig & Fairchild 2022](https://doi.org/10.1002/col.22792))
* [x] [ZCAM](https://doi.org/10.1364/OE.413659) — HDR-native colour appearance model built on the absolute Izazbz space. ([Safdar et al. 2021](https://doi.org/10.1364/OE.413659))
* [x] [RLAB](https://doi.org/10.1002/(SICI)1520-6378(199610)21:5<338::AID-COL3>3.0.CO;2-Z) 🕰️ — Fairchild (1996) cross-media appearance model; von Kries adaptation + a CIELAB-like stage.
* [x] [LLAB](https://doi.org/10.1002/(SICI)1520-6378(199612)21:6<412::AID-COL4>3.0.CO;2-Z) 🕰️ — Luo, Lo & Kuo (1996) CIELAB successor candidate; BFD adaptation + log chroma compression. Analytically inverted.
* [x] [Nayatani 95](https://doi.org/10.1002/col.5080200305) 🕰️ — the illuminant-level (Hunt/Stevens effects) appearance model; log-opponent cone stage. Exact 4-regime inverse.
* [x] [Hunt](https://doi.org/10.1002/col.5080190504) 🕰️ — Hunt's flagship Kodak model with cone **and rod** signals — the direct ancestor of CIECAM97s/CIECAM02. Inverted in near-closed form: J, C, h give the correlates directly, only the rod term needs a short 1-D iteration (Fairchild deemed the model non-invertible).
* [x] [ATD95](https://doi.org/10.1117/12.206546) 🕰️ — Guth (1995): the vision-science opponent model (achromatic / tritan / deutan stages) — shipped as its stage-2 coordinates, with its authors' caveat that it models discrimination, not appearance. Analytically inverted.

> With the four above shipped (baked to their published worked-example conditions, doctest-pinned, bidirectional), **every generation of colour appearance modelling is in the library**: Hunt, Nayatani & Guth (the 1990s ancestors) → RLAB/LLAB (the CIELAB-successor era) → CIECAM02/CAM16 families → Hellwig 2022 & ZCAM (current).

</details>

<details><summary><b>Print & Physical</b></summary>

* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive printing (cyan/magenta/yellow/black). Device-dependent.
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model) — subtractive primaries without black separation.
* [x] [RYB](https://en.wikipedia.org/wiki/RYB_color_model) 🕰️ — the painters' red-yellow-blue wheel where blue + yellow makes green; Itten's chromatic cube via smoothstep-eased trilinear blend. ([meodai/rybitten](https://github.com/meodai/rybitten))
* [x] [Munsell](https://munsell.com/about-munsell-color/) — artist hue/value/chroma; bidirectional via the 1943 renotation (Illuminant C). ([RIT MCSL](https://www.rit.edu/science/munsell-color-science-lab-educational-resources))
* [x] [RAL Design](https://en.wikipedia.org/wiki/RAL_colour_standard) — systematic CIELAB hue/lightness/chroma; the HLC code *is* L\*C\*h by construction (D50/2°). Distinct from sample-defined RAL Classic.

Swatch catalogs (Pantone, NCS, RAL Classic, HKS, Toyo, Federal Standard 595…) sit under [What it isn't](#what-it-isnt) — not color spaces.

</details>

<details><summary><b>Specialty & Research</b></summary>

* [x] [Coloroid](http://hej.sze.hu/ARC/ARC-030520-A/arc030520a.pdf) — Hungarian aesthetic color system for architecture (MSZ 7300). Perceptually uniform hue/saturation/luminosity.
* [x] [OSA-UCS](https://www.osapublishing.org/josa/abstract.cfm?uri=josa-64-12-1691) — Optical Society uniform color scales; now bidirectional (1D-Newton inverse, [Schlömer 2019](https://arxiv.org/abs/1911.08323)).
* [x] [TSL](https://ieeexplore.ieee.org/document/400568) — tint/saturation/lightness, designed for face detection skin-color clustering. ([Terrillon & Akamatsu 1999](https://doi.org/10.1109/ICIP.1999.817178))
* [x] [YES](https://doi.org/10.2991/isaebd.2012.23) — luminance/chrominance for fast face recognition.
* [x] [RG chromaticity](http://www.brucelindbloom.com/) — normalized r=R/(R+G+B), illumination-invariant for vision.
* [x] [CIE DSH](https://en.wikipedia.org/wiki/Dominant_wavelength) — Helmholtz coordinates: dominant wavelength + excitation purity from CIE 1931 xy (D65); purples carry a negative complementary wavelength.
* [x] [PhotoYCC](https://en.wikipedia.org/wiki/PhotoYCC) — Kodak Photo CD encoding, extended gamut (BT.709 primaries, BT.601 luma, odd-function OETF).
* [x] [Ohta I₁I₂I₃](https://doi.org/10.1016/0146-664X(80)90047-7) — decorrelated RGB opponent space for image segmentation (Ohta 1980).
* [x] [lαβ (Ruderman)](https://doi.org/10.1109/38.946629) — the decorrelated log-cone space behind classic colour transfer between images (Reinhard et al. 2001; Ruderman 1998).
* [x] [ANLAB](https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x) 🕰️ — Adams-Nickerson chromatic-valence space (1942/1950), the direct precursor of CIELAB.
* [x] [Ostwald](https://doi.org/10.1364/JOSA.34.000361) 🕰️ — the **ideal** Ostwald system: full colours computed as optimal semichromes from the CIE 1931 CMFs under illuminant C — Ostwald's own mathematical definition (Foss 1944), not the licensed atlas samples. Hue / white / black content, exact both ways.
* ~~[RG / RGK](https://en.wikipedia.org/wiki/RG_color_space)~~ — declined: a formula-less historical 2-primary print model; "dichromat simulation" is a one-way filter (Viénot/Brettel), not a color space.
* ~~[DIN 6164](https://en.wikipedia.org/wiki/DIN_6164)~~ 🕰️ — declined: its constant-hue/saturation loci are tabulated in the paywalled DIN Beiblätter (a Munsell-class problem with no open renotation dataset).

</details>

## Motivation

A _complete_ collection of color spaces under a _minimal_, _consistent_ API with _verified_ formulas — where alternatives cover digital spaces, this project takes the broader perspective: historical and cross-disciplinary spaces included. Side effects:

* Verifying and correcting published papers.
* Visualising and educating about color spaces.
* Test cases for JS→WASM compilers ([porffor](https://github.com/CanadaHonk/porffor), [jz](https://github.com/dy/jz)).


### What it isn't

Not parsing, interpolation, ΔE, gamut mapping or color toolbox. Channels only — carry alpha alongside yourself. It leaves models out when they are not fixed channel coordinates with a context-free conversion path:

- **Models without fixed, self-sufficient channels** — animal quantum catches and bee/avian/fly receptor geometries require species-specific sensitivity curves, illuminant, ocular transmission, and adaptation state. Kubelka–Munk pigment mixing, Neugebauer/Yule–Nielsen halftones, and Beer–Lambert colorants require measured spectra, inks or pigments, substrate, concentration, and thickness. These consume variable-length samples and external conditions; they are not universal channel tuples with an honest XYZ inverse.
- **Swatch catalogs** — Pantone, NCS, RAL Classic, HKS, Toyo, British Standard, US Federal Standard 595. Discrete named-sample books, not continuous coordinate systems, and nearly all trademarked or sample-defined with no open CIE data. (RAL **Design** *is* included — its HLC code is CIELAB by construction, no catalog needed.)
- **Colormaps, palettes, gradients** — cubehelix, viridis, turbo, and friends. A single fraction painted to a color, not a space you convert between.
- **Color toolbox** – operations stay out: parsing, mixing, ΔE, gamut mapping, color-vision-deficiency simulation — this is the kernel they build on.

## Comparison

| | color-space | culori | colorjs.io | texel/color |
|---|---|---|---|---|
| **Spaces** | **161** | 25 | 40 | 16 |
| **Ranges** | Conventional (CSS-matching) | 0–1 | 0–1 | 0–1 |
| **Specialty** (camera logs, appearance, video, historical) | ✅ | ❌ | some | ❌ |
| **Backends** | JS · WASM · GLSL/WGSL · .cube LUT | JS | JS | JS |

Details in [library comparison](docs/library-comparison.md); `npm run benchmark` compares performance.

## Credits

Thanks to everyone who contributes to color science — researchers, theorists, specifiers, implementors. Special thanks to the libraries that informed this one: [culori](https://github.com/Evercoder/culori), [colorjs.io](https://colorjs.io/) (CSS Color spec editors), [color-api](https://github.com/LeaVerou/color-api), [texel/color](https://github.com/texel-org/color).

<p align="center"><a href="license.md">Public domain (CC0)</a> · <a href="https://github.com/krsnzd/license/">ॐ</a></p>

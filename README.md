# color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space) [![VS Code](https://img.shields.io/badge/VS_Code-extension-007acc)](https://marketplace.visualstudio.com/items?itemName=colorjs.color-spaces)

<a href="https://color-space.io/"><img src="https://raw.githubusercontent.com/colorjs/color-space/master/web/img/banner.svg" alt="the Ostwald hue circle at full color, shown continuously and in ten steps" width="100%"/></a>

**Open collection of color spaces.** <br/>
* Formulas tested against cited sources
* Conventional ranges
* JS with TypeScript types / WASM / GLSL / LUT / ICC / OCIO

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

Individual spaces:

```js
import oklch from 'color-space/oklch.js';
oklch.rgb(0.65, 0.25, 180);          // matches CSS oklch(0.65 0.25 180)
```

## Imports

* `color-space` – All 221 interconnected spaces. 70 kB gzip
* `color-space/<name>.js` – One standalone space
* `color-space/lite` – 54-space working set. 29 kB gzip
* `color-space/wasm` – lite set as WASM, bare `.wasm` included
* `color-space/gl` – GLSL/WGSL shader source
* `color-space/gl/hlsl` · `color-space/gl/msl` – HLSL (DirectX, Unity, Unreal) and Metal, written by naga from the WGSL. `await hlsl('rgb', 'oklch')`. needs the optional peer `naga-wasm` (it declares Node ≥ 24.12; CI runs it on 22, where npm only warns)
* `color-space/lut` – `.cube` LUTs for Resolve, Premiere, OBS, ffmpeg — [verified vs ACES](docs/formula-verification.md#camera-log-verification-against-official-aces-transforms)
* `color-space/icc` – Matrix + TRC or CLUT profiles
* `color-space/ocio` – OpenColorIO colorspaces for Blender, Nuke, Resolve, Houdini: `colorspace(space.sgamut3cine)`, curve and matrix from native transforms, 55 spaces, each checked against the library to 1e-6
* `color-space/util` – `parse`, `format` CSS colors, `mix`, `gamut`, `visible`, `deltaE`, `contrast` (WCAG), `cvd` (color-vision simulation), `deltaE('rgb', [255, 0, 0], [250, 0, 0])`
* `color-space/data.json` – Channels, ranges, provenance, references, graph, gamuts
* `color-space/conformance.json` – Cited reference conversions, each with its source, to test any color library against
* `npx color-space rgb oklch 255 128 0` – CLI, no install: `convert` (default), `cube`, `icc`, `space`, `spaces`, `mcp` (MCP server for [agents](#agents))

[Upgrading from v2?](docs/migration.md)

## Agents

MCP tools – `convert`, `gamut`, `css`, `space`, `spaces`, `cube`, `shader`, `icc`, `code` – so agents call verified math instead of guessing it. A color goes in as any CSS string (`'#ff8000'`, `'oklch(0.7 0.1 50)'`, `'rebeccapurple'`) or as channel values; `shader` writes the conversion as GLSL, WGSL, HLSL or MSL, `code` gives the JS call and its verified colour-science equivalent.

```sh
claude mcp add color-space -- npx -y color-space mcp                                      # Claude Code
code --add-mcp '{"name":"color-space","command":"npx","args":["-y","color-space","mcp"]}'  # VS Code
```

Claude Desktop `claude_desktop_config.json`, any project `.mcp.json`:

```json
{ "mcpServers": { "color-space": { "command": "npx", "args": ["-y", "color-space", "mcp"] } } }
```

Claude Code plugin (the server plus a skill): `/plugin marketplace add colorjs/color-space`, then `/plugin install color-space@color-space`. Docker: `docker build -t color-space-mcp .` and run it with `docker run -i --rm color-space-mcp`.

Over HTTP (Streamable HTTP, stateless): `npx -y color-space mcp --http 8787` on localhost, or host `fetch` from `color-space/mcp.js` in a Worker, Deno or Bun. Skill for agents that load skills: [`plugins/claude/skills/color-space`](plugins/claude/skills/color-space/SKILL.md).

In the browser: [color-space.io](https://color-space.io/) registers the same tools (but `icc`) through [WebMCP](https://developer.chrome.com/docs/ai/webmcp) where Chrome offers it, plus `show`, which opens a space's dossier or sets the page's color in front of the person.

## Spaces


<table><tr><td valign="top">

**Display & web**<br>
<sub>[sRGB](https://color-space.io/rgb) · [Display P3](https://color-space.io/p3) · [Rec. 2020](https://color-space.io/rec2020) · [Linear-light sRGB](https://color-space.io/lrgb) · [Rec. 709](https://color-space.io/rec709) · [Rec. 709 display](https://color-space.io/rec709-display) · [sRGB 2.2 display](https://color-space.io/rgb-display) · [ProPhoto RGB](https://color-space.io/prophoto) · [Adobe RGB (1998)](https://color-space.io/a98rgb) · [DCI-P3](https://color-space.io/dci-p3) · [Linear Display P3](https://color-space.io/p3-linear) · [Linear Rec. 2020](https://color-space.io/rec2020-linear) · [Rec. 2020 display](https://color-space.io/rec2020-display) · [Linear Adobe RGB (1998)](https://color-space.io/a98rgb-linear) · [Linear ProPhoto RGB](https://color-space.io/prophoto-linear) · [scRGB](https://color-space.io/scrgb) · [RIMM RGB](https://color-space.io/rimm) · [CIE RGB](https://color-space.io/cie-rgb) · [NTSC RGB (1953)](https://color-space.io/ntsc) · [PAL / SECAM RGB](https://color-space.io/pal) · [Apple RGB](https://color-space.io/apple-rgb) · [SMPTE-240M](https://color-space.io/smpte-240m) · [ECI RGB v2](https://color-space.io/ecirgb) · [Adobe Wide Gamut RGB](https://color-space.io/widegamut) · [ColorMatch RGB](https://color-space.io/colormatch) · [Bruce RGB](https://color-space.io/brucergb) · [Beta RGB](https://color-space.io/betargb) · [Best RGB](https://color-space.io/bestrgb) · [Don RGB 4](https://color-space.io/donrgb4) · [Ekta Space PS 5](https://color-space.io/ektaspace) · [Russell RGB](https://color-space.io/russellrgb) · [Prismatic](https://color-space.io/prismatic)</sub>

**Cylindrical**<br>
<sub>[HSL](https://color-space.io/hsl) · [HSV / HSB](https://color-space.io/hsv) · [HWB](https://color-space.io/hwb) · [HSI](https://color-space.io/hsi) · [IHLS](https://color-space.io/ihls) · [HCG](https://color-space.io/hcg) · [HCL](https://color-space.io/hcl) · [HSP](https://color-space.io/hsp) · [HCY](https://color-space.io/hcy) · [Cubehelix](https://color-space.io/cubehelix) · [HSM](https://color-space.io/hsm)</sub>

**Perceptual**<br>
<sub>[OKLCH](https://color-space.io/oklch) · [CIELAB](https://color-space.io/lab) · [CAM16](https://color-space.io/cam16) · [OKLab](https://color-space.io/oklab) · [HCT](https://color-space.io/hct) · [Okhsl](https://color-space.io/okhsl) · [Okhsv](https://color-space.io/okhsv) · [Okhwb](https://color-space.io/okhwb) · [OKLrAB](https://color-space.io/oklrab) · [OKLrCH](https://color-space.io/oklrch) · [SRLAB2](https://color-space.io/srlab2) · [proLab](https://color-space.io/prolab) · [sUCS](https://color-space.io/sucs) · [IgPgTg](https://color-space.io/igpgtg) · [HelmGen](https://color-space.io/helmgen) · [HelmGen LCh](https://color-space.io/helmgenlch) · [Helmlab MetricSpace](https://color-space.io/helmlab-metric) · [Jzazbz](https://color-space.io/jzazbz) · [JzCzHz](https://color-space.io/jzczhz) · [IPT](https://color-space.io/ipt) · [IPT Ragoo 2021](https://color-space.io/ipt-ragoo) · [Izazbz](https://color-space.io/izazbz) · [hdr-IPT](https://color-space.io/hdr-ipt) · [IaPbP](https://color-space.io/iapbp) · [CIELChab](https://color-space.io/lchab) · [CIELUV](https://color-space.io/luv) · [HSLuv](https://color-space.io/hsluv) · [CIELChuv](https://color-space.io/lchuv) · [CIELAB D65](https://color-space.io/lab-d65) · [CIELCh D65](https://color-space.io/lch-d65) · [Msh](https://color-space.io/msh) · [HPLuv](https://color-space.io/hpluv) · [DIN99](https://color-space.io/din99) · [DIN99o Lab](https://color-space.io/din99o-lab) · [DIN99o LCh](https://color-space.io/din99o-lch) · [DIN99c](https://color-space.io/din99c) · [DIN99d](https://color-space.io/din99d) · [Log-compressed OSA-UCS](https://color-space.io/osaucs-ee) · [Hunter Lab](https://color-space.io/labh) · [Hunter Rd,a,b](https://color-space.io/hunter-rdab) · [CIE 1960 UCS](https://color-space.io/ucs) · [CIE 1964 UVW](https://color-space.io/uvw) · [Adams–Nickerson Lab](https://color-space.io/anlab) · [hdr-CIELAB](https://color-space.io/hdr-cie-lab) · [CIECAM02](https://color-space.io/ciecam02) · [CIECAM16](https://color-space.io/ciecam16) · [CIECAM97s](https://color-space.io/ciecam97s) · [CAM16-UCS](https://color-space.io/cam16-ucs) · [ZCAM](https://color-space.io/zcam) · [CAM02-UCS](https://color-space.io/cam02-ucs) · [CAM16-LCD](https://color-space.io/cam16-lcd) · [CAM16-SCD](https://color-space.io/cam16-scd) · [CAM02-LCD](https://color-space.io/cam02-lcd) · [CAM02-SCD](https://color-space.io/cam02-scd) · [Hellwig 2022](https://color-space.io/hellwig2022) · [Hellwig 2022 HK](https://color-space.io/hellwig2022-hk) · [ACES 2.0 JMh](https://color-space.io/aces2-jmh) · [sCAM](https://color-space.io/scam) · [Kim 2009](https://color-space.io/kim2009) · [RLAB](https://color-space.io/rlab) · [LLAB](https://color-space.io/llab) · [Nayatani 95](https://color-space.io/nayatani95) · [Hunt](https://color-space.io/hunt) · [ATD95](https://color-space.io/atd95) · [oRGB](https://color-space.io/orgb)</sub>

**Colorimetry & research**<br>
<sub>[CIE XYZ (D65)](https://color-space.io/xyz) · [CIE xyY](https://color-space.io/xyy) · [LMS](https://color-space.io/lms) · [CIE XYZ (D50)](https://color-space.io/xyz-d50) · [CIE 1976 u′v′](https://color-space.io/uv) · [CCT + Duv](https://color-space.io/cct-duv) · [Color temperature (Kelvin)](https://color-space.io/kelvin) · [Maxwell triangle](https://color-space.io/maxwell) · [Wavelength](https://color-space.io/wavelength) · [Absolute XYZ D65](https://color-space.io/xyz-abs-d65) · [LogLuv](https://color-space.io/logluv) · [MacLeod–Boynton](https://color-space.io/macboyn) · [DKL](https://color-space.io/dkl) · [Grayscale](https://color-space.io/gray) · [Dominant wavelength / DSH](https://color-space.io/dsh) · [rg chromaticity](https://color-space.io/rg) · [Yrg (Kirk 2019)](https://color-space.io/yrg) · [XYB](https://color-space.io/xyb) · [OSA-UCS](https://color-space.io/osaucs) · [TSL](https://color-space.io/tsl) · [YES](https://color-space.io/yes) · [Ohta I₁I₂I₃](https://color-space.io/ohta) · [lαβ](https://color-space.io/lalphabeta) · [YyCxCz](https://color-space.io/ycxcz) · [Poirson–Wandell opponent](https://color-space.io/poirson-wandell)</sub>

</td><td valign="top">

**Video**<br>
<sub>[BT.709 Y′CbCr](https://color-space.io/ycbcr-bt709) · [ICtCp](https://color-space.io/ictcp) · [ICtCp HLG](https://color-space.io/ictcp-hlg) · [IPT-PQ-C2](https://color-space.io/iptpqc2) · [BT.2020 Y′CbCr](https://color-space.io/ycbcr-bt2020) · [BT.601 525-line Y′CbCr](https://color-space.io/ycbcr-bt601-525) · [BT.601 625-line Y′CbCr](https://color-space.io/ycbcr-bt601-625) · [YCbCr (parameterized)](https://color-space.io/ycbcr) · [YUV](https://color-space.io/yuv) · [YIQ](https://color-space.io/yiq) · [YPbPr](https://color-space.io/ypbpr) · [YCgCo](https://color-space.io/ycgco) · [JPEG YCbCr](https://color-space.io/jpeg) · [YDbDr](https://color-space.io/ydbdr) · [YcCbcCrc](https://color-space.io/yccbccrc) · [xvYCC](https://color-space.io/xvycc) · [SMPTE-C](https://color-space.io/smpte-c) · [PhotoYCC](https://color-space.io/photoycc) · [Rec. 2100 PQ](https://color-space.io/rec2100-pq) · [Rec. 2100 HLG](https://color-space.io/rec2100-hlg) · [Linear Rec. 2100](https://color-space.io/rec2100-linear) · [ICaCb](https://color-space.io/icacb) · [Y′D′zD′x](https://color-space.io/ydzdx)</sub>

**Camera**<br>
<sub>[ACEScg](https://color-space.io/acescg) · [ARRI LogC3](https://color-space.io/logc3) · [ARRI Wide Gamut 3](https://color-space.io/awg3) · [ACEScc](https://color-space.io/acescc) · [Sony S-Log3](https://color-space.io/slog3) · [S-Gamut3](https://color-space.io/sgamut3) · [Sony S-Gamut3.Cine](https://color-space.io/sgamut3cine) · [Venice S-Gamut3](https://color-space.io/sgamut3-venice) · [Venice S-Gamut3.Cine](https://color-space.io/sgamut3cine-venice) · [ACES2065-1](https://color-space.io/aces2065-1) · [ACEScct](https://color-space.io/acescct) · [ARRI LogC4](https://color-space.io/logc4) · [ARRI Wide Gamut 4](https://color-space.io/awg4) · [Cineon](https://color-space.io/cineon) · [ADX10](https://color-space.io/adx10) · [ADX16](https://color-space.io/adx16) · [DaVinci Wide Gamut / Intermediate](https://color-space.io/davinci) · [DaVinci Wide Gamut](https://color-space.io/dwg) · [Sony S-Log2](https://color-space.io/slog2) · [Panasonic V-Log](https://color-space.io/vlog) · [V-Gamut](https://color-space.io/vgamut) · [RED Log3G10](https://color-space.io/log3g10) · [REDWideGamutRGB](https://color-space.io/rwg) · [Canon Log](https://color-space.io/clog) · [Canon Log 2](https://color-space.io/clog2) · [Canon Log 3](https://color-space.io/clog3) · [DCI-P3+](https://color-space.io/dci-p3-plus) · [Fujifilm F-Log](https://color-space.io/flog) · [Fujifilm F-Log2](https://color-space.io/flog2) · [Fujifilm F-Log2 C](https://color-space.io/flog2c) · [Nikon N-Log](https://color-space.io/nlog) · [Apple Log](https://color-space.io/applelog) · [Apple Log 2](https://color-space.io/applelog2) · [Blackmagic Film Gen 5](https://color-space.io/bmdfilm) · [Blackmagic Wide Gamut](https://color-space.io/bmdwg) · [DJI D-Log](https://color-space.io/dlog) · [D-Gamut](https://color-space.io/dgamut) · [FilmLight T-Log / E-Gamut](https://color-space.io/tlog) · [E-Gamut](https://color-space.io/egamut) · [Kinefinity KineLOG3](https://color-space.io/kinelog3) · [DCDM X′Y′Z′](https://color-space.io/dcdm) · [Sony S-Log](https://color-space.io/slog) · [ACESproxy](https://color-space.io/acesproxy) · [ERIMM RGB](https://color-space.io/erimm) · [Leica L-Log](https://color-space.io/llog) · [GoPro Protune](https://color-space.io/protune) · [GoPro GP-Log2](https://color-space.io/gplog2) · [Insta360 I-Log](https://color-space.io/ilog) · [Xiaomi Mi-Log](https://color-space.io/milog) · [OPPO O-Log](https://color-space.io/olog) · [O-Log2](https://color-space.io/olog2) · [Samsung Log](https://color-space.io/samsunglog) · [REDLog](https://color-space.io/redlog) · [REDLogFilm](https://color-space.io/redlogfilm) · [RED Log3G12](https://color-space.io/log3g12) · [Panalog](https://color-space.io/panalog) · [ViperLog](https://color-space.io/viperlog) · [Filmic Pro 6](https://color-space.io/filmicpro)</sub>

**Print**<br>
<sub>[CMYK](https://color-space.io/cmyk) · [Munsell](https://color-space.io/munsell) · [RYB](https://color-space.io/ryb) · [CMY](https://color-space.io/cmy) · [RAL Design](https://color-space.io/ral-design) · [Coloroid](https://color-space.io/coloroid) · [Ostwald](https://color-space.io/ostwald)</sub>

</td></tr></table>


## Motivation

A complete collection of color spaces: one minimal API, formulas tested against their sources. While alternatives focus on digital color spaces, this project takes broader perspective, covering historical and cross-disciplinary spaces as well. Side effects: [errata in papers](docs/errata.md), color education, test cases for JS→WASM compilers ([porffor](https://github.com/CanadaHonk/porffor), [jz](https://github.com/dy/jz)).

It is not a color toolbox — gamut mapping, palettes, alpha stay out; the few tools the atlas itself uses (parsing, mixing, ΔE, contrast, color-vision simulation) are `color-space/util`. Pantone, NCS, RAL Classic, and similar licensed swatch catalogs aren't open and stay out as well.

## Contributing

A wrong value or a missing space: [open an issue](https://github.com/colorjs/color-space/issues/new/choose) with the document that defines it. How a space is added and checked: [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Thanks to the researchers, theorists, specifiers, implementors and the libraries that helped this one happen.

| Library | Spaces | Ranges | Camera log · CAM · historic | Backends |
|---|---:|---|---|---|
| **color-space** | **221** | Conventional | ✅ | JS · WASM · GLSL/WGSL · LUT · ICC |
| color-space/lite | 54 | Conventional | logs · HDR · CAM16 | JS · 29 kB gzip |
| color-space/wasm | 54 | Conventional | logs · HDR · CAM16 | WASM |
| [culori](https://github.com/Evercoder/culori) | 30 | 0–1 | ❌ | JS |
| [colorjs.io](https://colorjs.io/) | 51 | 0–1 | some | JS |
| [texel/color](https://github.com/texel-org/color) | ~16 | 0–1 | ❌ | JS |
| [chroma-js](https://github.com/gka/chroma.js) | 11 | mixed | ❌ | JS |
| [d3-color](https://github.com/d3/d3-color) | 6 | mixed | ❌ | JS |



<p align="center"><a href="license.md">CC0</a> · <a href="https://github.com/krsnzd/license/">ॐ</a></p>

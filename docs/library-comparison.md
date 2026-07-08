# color-space vs culori vs colorjs.io vs chroma-js vs @texel/color

A factual comparison of JavaScript color conversion libraries. Each library has a distinct scope; this document maps where they overlap and where they differ so you can pick the right tool.

---

## Summary table

| | color-space | culori | colorjs.io | chroma-js | @texel/color |
|---|---|---|---|---|---|
| **Version compared** | 3.x | 4.x | 0.6.x | 2.x | 0.x |
| **Color spaces** | **151** | ~35 | ~40 | ~15 | ~16 |
| **API value ranges** | Conventional (CSS-matching) | Normalized 0–1 | Normalized 0–1 | Mixed / CSS strings | Normalized 0–1 |
| **CSS string parsing** | No | Yes | Yes | Yes | No |
| **Color mixing / interpolation** | No | Yes | Yes | Yes | No |
| **Gamut mapping** | No | Yes | Yes | No | No |
| **Delta-E (color difference)** | No | Yes | Yes | Yes | No |
| **WCAG contrast** | No | Yes | Yes | Yes | No |
| **Palette generation** | No | No | No | Yes | No |
| **Tree-shakeable ESM** | Yes | Yes | Yes | No | Yes |
| **Zero dependencies** | Yes | Yes | Yes | No | Yes |
| **Differential-tested vs colorjs.io** | 29 spaces, both directions | — | — | — | — |
| **Bundle (full, min+gz)** | ~44 kB¹ | ~22 kB | ~25 kB | ~16 kB | ~12 kB |
| **Batch / typed-array API** | Planned (WASM) | No | No | No | Yes (WebGL/GPU) |

Full-library min+gz, bundlephobia 2026-06 (culori 4.0.2, colorjs.io 0.6.1, chroma-js 3.2.0). ¹color-space's ~44 kB is **all 151 spaces** — naturally larger than the others because it has 3–5× more spaces. But it is tree-shakeable: a single space is **~2 kB** (e.g. `import oklch from 'color-space/oklch.js'` → ~1.8 kB), the figure that matters in practice. culori and colorjs.io are also tree-shakeable — compare like-for-like (single import vs single import), not a single import against a full bundle.

---

## Value ranges — the most consequential API difference

Every library except color-space normalizes all channels to 0–1:

```js
// culori / colorjs.io / @texel/color
lab(0.5, 0, 0)     // L = 0.5  (means 50%)
oklch(0.65, 0.1, 0.5)  // H = 0.5  (means 180°)
rgb(1, 0.5, 0)     // R = 1    (means 255)
```

color-space uses the ranges CSS Color 4/5 specifies and color science literature uses:

```js
// color-space
lab.rgb(50, 0, 0)       // L: 0–100, a/b: –125 to +125
oklch.rgb(65, 10, 180)  // L: 0–100, C: 0–40, H: 0–360°
hsl.rgb(180, 75, 50)    // H: 0–360°, S/L: 0–100%
rgb.hsl(255, 128, 0)    // R/G/B: 0–255
```

Normalized ranges are convenient for GPU shaders and CSS `color-mix()` math; conventional ranges are self-documenting and match CSS output directly. Neither is wrong — the choice has downstream consequences for everything built on top.

---

## Color space coverage

### Spaces all libraries share (or most do)

sRGB, linear sRGB, HSL, HSV, HWB, Lab (CIE 1976), LCH, OKLab, OKLCH, XYZ D65, Display P3, Rec. 2020, A98 RGB, ProPhoto RGB, HWB.

### Spaces color-space covers that others do not

**Video and broadcast** — YUV, YIQ, YCbCr (BT.601), YcCbcCrc (BT.2020 constant-luminance), YPbPr, YDbDr, YCgCo, JPEG full-range YCbCr, xvYCC. None of culori, colorjs.io, chroma-js, or @texel/color include these.

**Film / professional** — ACEScg/cc/cct, ACES2065-1, plus the camera log encodings: ARRI LogC3/LogC4, Sony S-Log2/S-Log3, Panasonic V-Log, RED Log3G10, Canon Log/Log2/Log3, Fujifilm F-Log/F-Log2, Nikon N-Log, Apple Log, Blackmagic Film Gen5, DJI D-Log, Cineon. culori and colorjs.io include ACEScc/cg, but **none** of the compared libraries include the camera log curves — this is color-space's clearest moat.

**HDR** — Jzazbz, JzCzHz, ICtCp, Rec. 2100 PQ, Rec. 2100 HLG. colorjs.io covers most of these; culori covers Jzazbz/JzCzHz and ICtCp; @texel/color and chroma-js largely do not.

**Color appearance** — CAM16, CIECAM02, CAM16-UCS, CAM02-UCS, CAM02/16-LCD & SCD, Hellwig 2022, ZCAM, and HCT (Google Material). colorjs.io has CAM16-JMh; the rest are rarely found in JS libraries.

**Historical CIE** — CIE 1960 UCS, CIE 1964 UVW, Hunter Lab. colorjs.io includes some; culori, chroma-js, and @texel/color do not.

**Cross-disciplinary specialty** — Coloroid (architectural color system, MSZ 7300), TSL (face detection), YES (face recognition), RG chromaticity (illumination-invariant vision), HSI, HCY, HSP, HCG, HCL, HSM, Cubehelix, OSA-UCS. These are absent from all other compared libraries.

**LUV family** — LUV, LCHuv, HSLuv, HPLuv. culori and colorjs.io include HSLuv/HPLuv; @texel/color and chroma-js largely do not cover LUV/LCHuv.

---

## What the other libraries do better

**culori** is the most capable all-around color toolkit for web and design work. It has CSS string parsing, color interpolation (with gamut-mapping modes for CSS `color-mix()` and CSS gradients), deltaE (2000, CMC, ITP), WCAG contrast, and a well-tested API. Its 0–1 normalization is intentional and makes interpolation math uniform across spaces. If you are building a CSS-adjacent tool or a design system, culori is the mature choice.

**colorjs.io** is the reference implementation for the W3C CSS Color specification, co-authored by the spec editors. It is the closest thing to a ground truth for CSS color behavior and is authoritative for specification questions. Its coverage of modern perceptual spaces (OKLab, OKLCH, HDR) is thorough, and it includes relative-color and gamut-mapping features that track the evolving spec. If you need CSS Color 4/5 fidelity or are implementing a browser-level feature, colorjs.io is the right starting point.

**chroma-js** is the most ergonomic library for palette and visualization work. It includes Brewer color scales, palette generation, and a fluent API that makes common tasks (brighten, darken, mix, scale) one-liners. For data visualization tooling or quick color palette code, chroma-js is the most productive library of this group.

**@texel/color** is the fastest library for batch color conversion over typed arrays, and is designed for WebGL and GPU workflows where data stays normalized 0–1. It has the smallest bundle and is the correct choice when throughput over large pixel buffers matters more than space coverage.

---

## Verification

color-space v3 includes a differential test suite (`test/reference.js`) that validates 29 spaces against colorjs.io in both directions through sRGB. This catches self-cancelling round-trip bugs (a forward and inverse error that cancel each other in A→B→A tests). The tolerance is 1/255 (sub-perceptual). Spaces covered: srgb-linear, display-p3 (+ linear), rec2020 (+ linear), a98rgb (+ linear), prophoto (+ linear), xyz-d65, xyz-d50, lab (D50), LUV, LCHuv, OKLab, OKLCH, HSL, HSV, HWB, Jzazbz, JzCzHz, ICtCp, ACEScg, ACEScc, CAM16, Rec. 2100 PQ/HLG.

---

## Choose X if…

**color-space** — you need conversion formulas across a broad or unusual range of spaces (video, film, appearance, historical, research) and want to build your own pipeline on top. You do not need parsing, interpolation, or delta-E — just correct, well-ranged math.

**culori** — you are building CSS-adjacent tooling, color pickers, design system utilities, or gradient engines. You want interpolation, gamut mapping, and delta-E included, with a normalized API that works uniformly across spaces.

**colorjs.io** — you need the authoritative implementation of CSS Color 4/5, are implementing spec behavior, or are doing W3C-level work. Also a good choice when relative-color, gamut-mapping modes, or deltaE 2000 fidelity are required.

**chroma-js** — you are doing data visualization, need palette generation or Brewer scales, or want a fluent API where `chroma('red').brighten(2).hex()` is the right level of abstraction.

**@texel/color** — you are processing pixel buffers in WebGL, compute shaders, or tight JS loops over typed arrays. Throughput and 0–1 normalization matter more than space breadth.

---

## What color-space is not

color-space is a conversion kernel, not a color toolkit. It deliberately omits:

- CSS color string parsing (e.g., `'oklch(65% 0.2 180)'` → channels)
- Color mixing and interpolation
- Gamut mapping and gamut-membership testing
- Delta-E color difference metrics
- WCAG contrast calculation
- Palette and scale generation

These belong to the application layer. culori, colorjs.io, and chroma-js implement them well and could use color-space as a conversion substrate.

---

## Libraries

- **culori** — <https://culorijs.org> · [github.com/Evercoder/culori](https://github.com/Evercoder/culori)
- **colorjs.io** — <https://colorjs.io> · [github.com/color-js/color.js](https://github.com/color-js/color.js)
- **chroma-js** — <https://gka.github.io/chroma.js/> · [github.com/gka/chroma.js](https://github.com/gka/chroma.js)
- **@texel/color** — [github.com/texel-org/color](https://github.com/texel-org/color)
- **d3-color** — [github.com/d3/d3-color](https://github.com/d3/d3-color)
- **CSS Color 4** — <https://www.w3.org/TR/css-color-4/> · **CSS Color 5** — <https://www.w3.org/TR/css-color-5/>

---

*Data current as of June 2026. Library space counts are best estimates from source; exact counts shift as libraries add spaces.*

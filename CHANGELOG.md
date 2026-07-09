# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GLSL/WGSL shader chunks for 155 spaces. A chunk is pure data (`{ name, deps, edges, code }`, like three.js `ShaderChunk`); `color-space/gl` is the engine that composes it — the engine imports the data, never the reverse. Import the spaces you convert and name the conversion: `glsl(oklch, 'rgb')` → `vec3 oklch_rgb(vec3 c)`, the scalar library's shape one level down (cf. `oklch.rgb(l, c, h)`). `glsl(oklch)` bundles both directions; `glsl(oklch, p3)` routes a pair through their shared ancestor.
- Lean by default: a per-space import brings only its own dependency chain (~5 kB minified), not the ~200 kB catalog — and stays pure data (`oklch.code` is its raw GLSL for hand-embedding), so importing a chunk never drags the composer along. Byte-identical to the full catalog.
- Full-catalog tier `color-space/gl/all` routes any space by name — `glsl('rgb', 'oklch')` — for runtime `from`/`to` strings.
- Multi-conversion shaders: `glsl([[a,b], [c,d], …])` emits every entry with shared chunks deduped — paint in one space, gamut-test in another, one source.
- WGSL for WebGPU, mechanically translated from the same chunks (`wgsl(oklch)` lean, `color-space/gl/wgsl` by name).
- GL differential suite: every edge evaluated as JS in float64 against the scalar library (`test/gl.js`), plus a real-GPU compile check page (`test/gl-gpu.html`).
- Complete reference coverage — all 151 spaces pinned to either the colorjs.io differential suite or a cited authoritative value (124 points), each entry carrying its source URL (`test/bonafide.js`).
- Integrity sweep: every composed pair callable as bare functions (catches `this`-bound conversion hops).
- `meta.wiki` — the canonical Wikipedia article per space (90 spaces; per-anchor verified), from a new `@wiki` JSDoc tag.
- `meta.year` / `meta.by` / `meta.use` — provenance (when the space was introduced, by whom) and usage domain + current status for 139 spaces, from new `@year`/`@by`/`@use` JSDoc tags (cross-checked against each file's cited references).
- `color-space/wasm` default export mirroring the scalar API: `space.oklch.rgb(l, c, h)` for scalars, `space.rgb.oklch(buf)` for whole buffers — an `alloc()`'d buffer converts in place (zero-copy), any other array-like returns a converted copy.

### Changed

- **icacb**: PQ now encodes against the 203 cd/m² media white (ITU-R BT.2100/BT.2408), matching ictcp/jzazbz/izazbz — SDR white lands at I ≈ 0.58 like ICtCp instead of deep in the PQ toe. colour-science's `XYZ_to_ICaCb` (1 unit = 1 cd/m²) differs by exactly that scaling.
- **macboyn**: `l` range tightened to [0.4, 1] — the spectrum locus spans l 0.433–0.963 (CVRL Smith-Pokorny MB table; s verified against the same table: peak 1.002 at 405 nm, so [0, 1] is the canonical peak-unity scaling).
- **macboyn, xyy, uv, rg**: achromatic (black) inputs now sit at the white/neutral chromaticity instead of a diagram corner — black carries no chromaticity, and every chromaticity inverts to black at zero luminance.

### Fixed

- Composed conversions routed through `rgb.xyb` or `coloroid.xyy` threw (`this` lost in graph composition).
- 16 dead or mis-attributed `@see` citations: ACES encodings paths, Ottosson colorpicker anchors, DIN99d/Coloroid DOIs, Xerox YES attribution, colour-science doc pages, freieFarbe atlas, Leica L-Log manual, DIN99 wiki.

## [3.0.0] - 2026-06-29

### Breaking Changes

- **CSS-matching channel ranges**: all spaces now use conventional CSS/spec ranges instead of normalized 0–1. RGB channels are 0–255; HSL hue 0–360, saturation/lightness 0–100; Lab L 0–100, a/b ±125. Predefined-RGB spaces (P3, Rec.2020, A98-RGB, ProPhoto) stay 0–1 per the CSS `color()` function. OKLab/OKLCh/OKLrab/OKLrch use their native 0–1 / ±0.4 ranges — the CSS Color 4 & Ottosson convention (`oklch.rgb(0.65, 0.25, 180)` ≡ CSS `oklch(0.65 0.25 180)`). JzAzBz/JzCzHz and ICtCp likewise use their native ranges (Jz/I 0–1, az/bz/Ct/Cp ±0.5), matching colorjs.io / Safdar 2017 / BT.2100.
- **Flat channel arguments**: conversions take individual arguments — `rgb.lab(10, 20, 30)` — not an array `rgb.lab([10, 20, 30])`.
- **Space object shape change**: `.min`, `.max`, `.channel`, and `.alias` properties removed from space objects; replaced by `.range`.
- **Lab/LCHab are now D50** (ICC/CSS convention). `lab-d65` added for display-native D65 Lab; redundant `lab-d50` removed.
- **rec2100-pq / rec2100-hlg renamed** (were previously unhyphenated).

### Added

- Graph-based conversion wiring: shortest-path routing means any space can reach any other; `din99o`, `oklrab`, `oklrch`, and `jzczhz` are now reachable from all other spaces.
- `lab-d65` space for D65-illuminant Lab (display-native, distinct from ICC/CSS D50 Lab).
- Full TypeScript types regenerated and verified tsc-strict clean.
- 29 spaces differentially validated against colorjs.io.
- NaN guards for achromatic/black edge cases across `hsi`, `osaucs`, `lchuv`, `cam16`, and more.

### Fixed

- **oklab**: corrected sRGB linearization (fix also propagates to oklch, okhsl, okhsv).
- **rec2020**: BT.2020 OETF now canonical.
- **hcy**: reimplemented as Chilliant luma-HCY (was incorrect).
- **tsl, hcl, labh, yuv, jzczhz, yiq, acescg, gray, uvw, cam16**: confirmed-correct conversions.
- Fixed `lrgb` → `sRGB` linearization bug (regression from 2.x; closes #65).

### Notes

- `coloroid` is marked experimental (T/table coefficients need Nemcsics reference data).
- `osaucs.xyz` and `rgb.cubehelix` are one-way conversions.

## [2.3.2] - 2024-xx-xx

### Fixed

- Fixed bug in linear sRGB → sRGB conversion (#65).

## [2.3.1] - 2024-xx-xx

### Added

- TypeScript type declarations added (`index.d.ts`).
- Minimal `lrgb` (linear sRGB) space.
- `oklab` RGB conversions.

## [2.3.0] - 2024-xx-xx

### Added

- `hsm` (Hue–Saturation–Mix) space.
- Space metadata (`meta`) field.

### Fixed

- Removed rounding from conversion outputs.

## [2.2.0] - 2024-xx-xx

### Added

- Expanded TypeScript declarations across all spaces.
- Type declaration references in package exports.

## [2.1.2] - 2023-xx-xx

### Added

- Type declaration references on all modules.

## [2.1.1] - 2023-xx-xx

### Fixed

- Fixed `coloroid` typo.

## [2.1.0] - 2023-xx-xx

### Added

- JSDoc-generated TypeScript types (`color-space.d.ts`).

## [2.0.1] - 2022-xx-xx

### Fixed

- `tsl`: L now normalized to 1.
- Simplified HSL formula.
- Added tests.

## [2.0.0] - 2022-xx-xx

Initial 2.x release.

---

[Unreleased]: https://github.com/colorjs/color-space/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/colorjs/color-space/compare/v2.3.2...v3.0.0
[2.3.2]: https://github.com/colorjs/color-space/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/colorjs/color-space/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/colorjs/color-space/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/colorjs/color-space/compare/v2.1.2...v2.2.0
[2.1.2]: https://github.com/colorjs/color-space/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/colorjs/color-space/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/colorjs/color-space/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/colorjs/color-space/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/colorjs/color-space/compare/v1.0.0...v2.0.0

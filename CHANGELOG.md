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
- Complete reference coverage — all 156 spaces pinned to either the colorjs.io differential suite or a cited authoritative value (129 points), each entry carrying its source URL (`test/bonafide.js`).
- Integrity sweep: every composed pair callable as bare functions (catches `this`-bound conversion hops).
- `meta.wiki` — the canonical Wikipedia article per space (90 spaces; per-anchor verified), from a new `@wiki` JSDoc tag.
- `meta.year` / `meta.by` / `meta.use` — provenance (when the space was introduced, by whom) and usage domain + current status for 139 spaces, from new `@year`/`@by`/`@use` JSDoc tags (cross-checked against each file's cited references).
- `color-space/wasm` default export mirroring the scalar API: `space.oklch.rgb(l, c, h)` for scalars, `space.rgb.oklch(buf)` for whole buffers — an `alloc()`'d buffer converts in place (zero-copy), any other array-like returns a converted copy.
- `color-space/lut`: any conversion as a `.cube` LUT — `cube(space.slog3, space.rec709)` — for DaVinci Resolve, Premiere, Final Cut, OBS, ffmpeg. Channelwise pairs (pure transfer curves, e.g. rec709→rgb) auto-emit LUT_1D_SIZE 4096; cross-channel pairs emit LUT_3D_SIZE 33 by default (17/33/65 Resolve convention). Every header carries the measured deviation of the interpolated lattice against the direct conversion at random off-lattice points (median + max, fractions of full scale), so the file states its own accuracy.
- LUT differential suite against the scalar library plus an end-to-end ffmpeg check: the generated `.cube` applied to a float frame by ffmpeg itself must reproduce the library (`test/lut.js`, `test/lut-ffmpeg.js`).
- Shaper LUTs — `cube(from, to, { shaper: true })` prepends the conversion's own tone diagonal as a 1D shaper (Resolve-flavor combined LUT_1D+LUT_3D cube; Resolve/OCIO read it): measured, a shaped 33³ beats a plain 65³ for camera-log → display at ⅙ the size (logc4→rec2020 4.1e-3 vs 5.7e-3); super-range clips at the shaper.
- `color-space/icc` — RGB working spaces as ICC v2 matrix+TRC display profiles: `profile(space.p3)` → `.icc` bytes for Photoshop/OS color management. Colorants and TRC derive mechanically from the space's own conversions (Bradford-adapted to the D50 PCS; empirical matrix×transfer gate refuses spaces a profile would lie about); pinned to Lindbloom's published matrices + the IEC 61966-2-1 formula, and host-verified through macOS ColorSync (`test/icc.js`, `test/icc-colorsync.js`).
- `color-space/data.json` — the registry as one language-neutral artifact: per-space metadata + conventional ranges, conversion-graph edges, gamut primaries, CIE whitepoints, the CIE 1931 2° color-matching functions, and the 129 cited conformance triples the suite pins to (`npm run data`; registry-drift test-pinned like meta.js).
- `color-space-mcp` — zero-dependency MCP server (stdio JSON-RPC) exposing `convert`/`space`/`spaces`/`cube`, so AI agents call verified conversions instead of hallucinating color math; driven end-to-end by `test/mcp.js`.
- Source-only repo, generated site — the website stages into `_site/` (`npm run landing` → `scripts/build-site.js`: web/ sources + runtime modules with root-relative imports + prerendered catalog, 156 per-space reference pages, sitemap/robots/llms) and deploys via GitHub Actions (`pages.yml`, full suite as the deploy gate); `web/` holds the site source, `docs/` only markdowns. All generated artifacts left git too — `meta.js`, `data.json`, `types/*.d.ts`, `dist/`, `wasm/binary.js` are produced by the `prepare` hook (fresh clone: `npm i`; publish tarball carries them; `prepublishOnly` retired into it).
- **Batch calling form on the JS hubs** — every wired pair now also takes an interleaved array-like of pixels and returns a new `Float64Array`: `space.rgb.oklch(pixels)`, for all 156 spaces. Stride follows each space's channel count (`rgb→cmyk` maps 3n→4n, `kelvin→rgb` 1n→3n), trailing params (ycbcr `kb`/`kr`) reach every pixel, and a batch of one is exactly the v2 calling convention — `rgb.lab([50, 50, 50])` is legal again. Batch ≡ scalar pinned bit-for-bit across all 24 180 pairs (`test/batch.js`).
- `color-space/lite` — the compact hub: exactly the WASM-covered 27 spaces (rgb/lrgb/xyz, OKLab family, CIE Lab/Luv + DIN99, HDR, camera logs) in plain JS, ~9 kB gzipped vs the catalog's ~52 kB. Same registry shape, both calling forms, `register()` included — the three hubs (`color-space`, `/lite`, `/wasm`) interchange freely; parity with the wasm space list is test-pinned.
- **WASM scalar kernels are true multi-value exports** — each edge is `rgb_lrgb(r, g, b) → (r′, g′, b′)` (jz multi-value; i64 f64-bit lanes mapped by the `jz:i64exp` custom section), so the module's ABI mirrors the scalar API and scalar calls never touch the working buffer. Batch loops destructure the same kernels per pixel — each formula exists exactly once in `wasm/batch.js` — and the two forms are pinned bit-identical on every pair.
- Migration guide rewritten from verified `v2.3.2` source diffs ([docs/migration.md](docs/migration.md)); linked from the README. The previous guide's central claim — "v2 normalized everything to 0–1" — was false (see the 3.0.0 correction below), and its ×255 conversion recipes would have double-scaled correct v2 code.

### Changed

- `meta.js` folded into `data.json` — one metadata artifact instead of two overlapping ones: `data.spaces` carries everything `meta` did plus `neighbors`, and the file adds gamuts/whitepoints/CMFs/conformance. `import meta from 'color-space/meta.js'` → `import data from 'color-space/data.json' with { type: 'json' }`; the site fetches the same file (one generator, `npm run data`).
- Space modules moved from the repo root into `spaces/` (156 files) — the root now holds only the hubs and tools (`index`/`lite`/`hub`/`lut`/`icc`/`mcp`/`wasm` + shared `util`/`transfers`/`whitepoints`/`cie`/`gamuts`). **Public paths are unchanged**: the exports map routes `color-space/oklch.js` (and `color-space/oklch`) to `spaces/oklch.js`, and every root module keeps its exact-key export — pinned by the exports-map integrity test.

- **icacb**: PQ now encodes against the 203 cd/m² media white (ITU-R BT.2100/BT.2408), matching ictcp/jzazbz/izazbz — SDR white lands at I ≈ 0.58 like ICtCp instead of deep in the PQ toe. colour-science's `XYZ_to_ICaCb` (1 unit = 1 cd/m²) differs by exactly that scaling.
- **macboyn**: `l` range tightened to [0.4, 1] — the spectrum locus spans l 0.433–0.963 (CVRL Smith-Pokorny MB table; s verified against the same table: peak 1.002 at 405 nm, so [0, 1] is the canonical peak-unity scaling).
- **macboyn, xyy, uv, rg**: achromatic (black) inputs now sit at the white/neutral chromaticity instead of a diagram corner — black carries no chromaticity, and every chromaticity inverts to black at zero luminance.

### Fixed

- Composed conversions routed through `rgb.xyb` or `coloroid.xyy` threw (`this` lost in graph composition).
- 16 dead or mis-attributed `@see` citations: ACES encodings paths, Ottosson colorpicker anchors, DIN99d/Coloroid DOIs, Xerox YES attribution, colour-science doc pages, freieFarbe atlas, Leica L-Log manual, DIN99 wiki.

## [3.0.0] - 2026-06-29

### Breaking Changes

- **Channel-range corrections** *(entry corrected 2026-07 — it originally claimed v2 normalized all spaces to 0–1; it did not: v2 already used conventional ranges — rgb 0–255, hsl 0–360/0–100/0–100, cmyk 0–100, ycbcr 16–235 — and those are unchanged)*. Five spaces rescaled to conventional form: `hsm` and `tsl` (were all-0–1), `hsi`/`hcy`/`hsp` third channel 0–255 → 0–100 (`hsp` also no longer rounds its outputs). Declared bounds made truthful where the v2 metadata understated the formula (`lab` a/b ±125, `luv` ±215, …) — metadata only, outputs identical. Spaces new in v3 adopt CSS conventions: predefined-RGB (P3, Rec.2020, A98-RGB, ProPhoto) are 0–1 per the CSS `color()` function; OKLab/OKLCh/OKLrab/OKLrch native 0–1 / ±0.4 (`oklch.rgb(0.65, 0.25, 180)` ≡ CSS `oklch(0.65 0.25 180)`); JzAzBz/JzCzHz and ICtCp native (Jz/I 0–1, az/bz/Ct/Cp ±0.5), matching colorjs.io / Safdar 2017 / BT.2100.
- **Flat channel arguments**: conversions take individual arguments — `rgb.lab(10, 20, 30)` — not an array `rgb.lab([10, 20, 30])`. (Later versions reintroduce the array call as the batch form — see Unreleased.)
- **Space object shape change**: `.min`, `.max`, `.channel`, and `.alias` properties removed from space objects; replaced by `.range`.
- **Lab/LCHab are now D50** (ICC/CSS convention; v2 lab was D65). `lab-d65` added for the v2-equivalent display-native Lab.
- **`ciecam` (`cam`) removed** — the v2 one-way stub is superseded by the full bidirectional `ciecam02`.
- rec2100-pq / rec2100-hlg ship hyphenated *(corrected 2026-07: previously listed as a rename — the unhyphenated files existed only in unreleased dev builds, never in a published v2)*.

See [docs/migration.md](docs/migration.md) for the v2→v3 upgrade path, verified against the v2.3.2 source.

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

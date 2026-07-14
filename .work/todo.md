* [ ] Make the atlas cool.

## Ideas

* [ ] AI-training data / education / visualizations
* [ ] claim https://github.com/js-org/js.org
* [ ] Color atlas - like https://www.artlebedev.ru/susha/ - comparison by size, coverage etc - the variant of main view
* [ ] Main screen configuration - sliders, planes, just a table, CSS values etc
* [ ] Pick a line/shape, not just a point in space
* [ ] Interpolation: compare against the other space
* [ ] In-space configurator: there's multiple flavors of RGB space with different matrices etc.
* [ ] Store space formulas js-independent: worthy of?
* [ ] Hue bar: uncollapses?
* [ ] FAQ: no questions = disinteresting topic
* [x] The barred spaces - add cards, display the limitation on them instead of explainer at the bottom.
* [ ] Full screen color picker.
* [ ] Color picker builder - combine sliders of different shapes
* [ ] Color-map: cubehelix etc (npm package is taken)
  * [ ] README rewrite around the kernel positioning + honest WASM story
  * [ ] Comparison table as the proof asset (71 vs culori 35 / colorjs 40 / texel 16; only conventional-ranges lib; the cross-disciplinary spaces)
  * [ ] Demo: all-spaces color picker / palette renderer with gamut limits (show breadth, don't claim it)
  * [ ] Website (playwright-generated): all spaces, benchmark, alt-analysis

## [ ] CLI — naming take (2026-07)

The bin name decides the docs one-liner. Key mechanic: **`npx color-space …` invokes the package's own bin when the bin name equals the package name** — zero install, zero global-name bikeshed, and that's the form every README/tutorial shows anyway. So:

* **Primary bin: `color-space`** — `npx color-space rgb oklch 255 128 0`. Unambiguous, discoverable, collision-free by construction.
* **Global-install alias: `colr`** (bin map takes both names → same cli.js). Short, pronounceable, low shell-collision. Rejected: `color` (too generic, npm `color` package adjacency, invites PATH surprises), `cs` (2 chars but heavily overloaded — C#, coffeescript-era muscle memory, cryptic in scripts), `cspace` (clear but nobody will guess it).
* **Consolidate `color-space-mcp` into it**: subcommands `convert` (default form: `<from> <to> <values…>`), `cube`, `icc`, `space`, `spaces`, `mcp` — one bin, one door; the separate mcp bin retires at that point.

## LUT file size — not a defect (2026-07)

* [ ] A 65³ `.cube` is 274,625 data lines × ~23 bytes ≈ **6.3 MB — text-format arithmetic**, matching what Resolve itself exports at 65³ (~7 MB). 33³ ≈ 0.9 MB is the industry default; 17³ ≈ 0.1 MB for on-set monitoring. 6-decimal floats are the conventional precision (quantization 5e-7 — far below lattice error, so fewer decimals would save ~15% while making precision the bottleneck; gzip on the wire gets ~70% anyway). The real fix for "need 65³ accuracy, hate 6 MB" is the **shaper LUT** (1D+3D combined): a 33³-with-shaper reaches 65³-class in-range accuracy at ~1 MB.

---

## v3 — the color conversion kernel

**Positioning.** Not a color toolkit — the color *kernel* toolkits build on. The most complete (**89 spaces**, incl. camera-log/cinema/video/film/scientific/historical no one else ships), exactly-CSS-ranged, verified conversion substrate. JS for single colors, WASM for whole buffers.

**Goal.** Seal the kernel — complete, correct, typed, tested, metadata'd (nothing left to take away) — then ship the one edge nobody else has at this breadth: WASM batch conversion.

**Settled design decisions**
  * Flat channel args, not arrays — self-documenting (`lab.rgb(50,0,0)`), resolves 1-channel ambiguity (`gray.rgb(50)`), WASM-native ABI (values in registers, no heap box), matches THREE/chroma. Composition uses spread; the WASM batch path inlines instead.
  * Conventional CSS-matching ranges (RGB 0-255, HSL 0-360/0-100, Lab 0-100/±125…).
  * No `min`/`max`, no `alias`, no `channel` array on the object — `range` + JSDoc `@channel` carry that, single source of truth.
  * Stay a conversion kernel. No parsing, interpolation, gamut-mapping, ΔE, contrast — composable layers culori/colorjs/texel own. We expose the *metadata* (range, gamut class) that lets them build those on top.
  * **Lab illuminant → D50 (DONE).** `lab`/`lchab` are now **D50** (ICC PCS / CSS Color 4 convention), full-precision ε/κ + Bradford. Added `lab-d65` for display-native; removed redundant `lab-d50` (lab is now it); din99o pinned to `lab-d65` (DIN 6176). All three validated in the differential suite (lab↔colorjs `lab`, lab-d65↔`lab-d65`, lchab↔`lch`). Count still 71. Future: `lchab-d65` + a factory for arbitrary illuminants (A/C/F-series already in `whitepoints.js`).

---

## Phase 0 — Make it load (the gate) — DONE

  * [x] Close 35 unclosed object literals (missing `};` after `name:`) — library parses, suite runs
  * [x] Green the test suite; **156 tests, 155 pass, 1 skip, 0 fail**
  * [x] README truth pass: real space count (88), real test number, removed the 0-1 normalization claim

## Phase 1 — Seal the kernel → 3.0

### Correctness audit — DONE (Opus, every finding adversarially re-verified vs colorjs.io / culori / primary sources)
Verdicts: 37 correct · 20 minor · 10 incorrect · 3 broken. All 13 incorrect/broken confirmed (0 cleared).

**Wrong output — confirmed (fix + bona fide reference test each):**
  * [x] **oklab** — `rgb.oklab` skipped sRGB→linear before the M1 matrix; `oklab.rgb` skipped gamma re-encode. Self-cancelled in roundtrip so hidden. Poisoned oklch/okhsl/okhsv too. FIXED by reusing `lrgb` transfer; now matches colorjs to 2e-6. (oklch/okhsl/okhsv auto-fixed.)
  * [x] **rec2020** — FIXED: full-precision BT.2020 OETF (piecewise, α/β from Table 4); 0-1 range. Matches colorjs to 2e-14. `rec2020-oetf` was a byte-identical duplicate of rec2020 (both = BT.2020 OETF) — **removed** (count 90→89).
  * [x] **lab-d50** (broken) — FIXED: ÷100 input / ×100 output; key `xyz['lab-d50']`. Now matches colorjs D50 `lab` to 0.017 (residual = Bradford precision, tracked). Reachable + tested.
  * [x] **tsl** (broken) — FIXED: inverse recovers θ=atan2(g′,r′) via cos/sin (sign preserved); black guarded. Exact roundtrip all colors (red was [124,83,-83]). Tested.
  * [x] **hcl** (broken) — FIXED: inverse uses `frac()` not JS `%` (Chilliant formula). Full 360-hue sweep roundtrips, 0 failures (green was [255,255,0]). Tested.
  * [x] **coloroid** — FIXED (research pass). The limit-color table had its yλ column shifted one row (+ isolated xλ mis-reads); restored the authoritative Nemcsics 1980 values. ATV↔xyY exact; reproduces the A=70,T=70,V=60 worked example; rgb round-trip 61→2/255 (residual = 48-grade hue quantization, inherent — no interpolation).
  * [x] **hcy** — FIXED: reimplemented as Chilliant luma-based HCY (Y = Rec.601 luma: red 29.9/green 58.7/blue 11.4, was 33.3 for all); chroma renormalized by hue-luma; achromatic NaN-safe; exact roundtrip. Tested.
  * [x] **jzczhz** — FIXED: removed the double ×100 (jzazbz already conventional); pure polar transform. Roundtrip 3e-15, hue matches colorjs. Tested.
  * [x] **yuv** — FIXED: inverse blue coeff `2.02311` → `2.03211` = (1−Kb)/Umax. Matrix-consistent roundtrip. Tested.
  * [x] **labh** — FIXED: D65 white-point ratios (kx=100/95.047, kz=100/108.883); white → [100,0,0] (was a=−5.34). Exact roundtrip. Tested.

**Edge / NaN guards:**
  * [x] hsi — achromatic guard (gray was NaN hue); hcy — fixed in reimplementation
  * [x] osaucs — `xyz(0,0,0)` D65-chromaticity guard (was NaN,NaN,NaN → [-12.96,0,0])
  * [x] lchuv — black hue 0 (was 180 from atan2(-0,-0)); hsp — red hue 0 (was 360, `>=`→`>`)
  * [x] all five pinned by a dedicated `edge: achromatic / black` test
  * [x] cam16 — black → [0,0,0] via `zdiv` at Jroot=0 (formula limit, no chroma at zero lightness). Now in differential suite vs colorjs `cam16-jmh` (matches). Removed leftover `channel` prop.
  * [x] uvw — rewrote canonical CIE 1964: **W\* = 25·Y^(1/3) − 17 (Y in 0-100)** (was 0-1 → white W=8, now 99.04); black/W*=0 use white-point chromaticity → U\*=V\*=0 (no NaN). Threw-away `uvw.ucs`/`ucs.uvw` (the auto-chain routes them via xyz). Roundtrip exact.

**Precision (canonical constants) — minor:**
  * [x] D50↔D65 Bradford consolidated into `xyz.js` (`bradford` + `mat3` exports, full precision); xyz-d50/lab-d50/prophoto-linear now share it (was 3 truncated copies). lab-d50 D50 white → full precision. rec2020-oetf α/β → full precision. All verified by the differential test.
  * [x] lab ε→216/24389, κ→24389/27 (both lab & lab-d65 full precision; replaced the old 0.008856/7.787)
  * [x] acescg — exact inverse matrices (roundtrip 3.9e-2→3e-11); rec2100-hlg scale = exact 12/(exp((0.75-c)/a)+b); rec2100 names hyphenated (`rec2100-pq`/`-hlg`) + added to differential (1e-14 / 1e-5 vs colorjs); yiq — canonical FCC matrix + exact inverse (round-trips)

**Range/doc — minor:**
  * [x] p3, a98rgb, rec2020 `@channel` 0-255 → 0-1 (matches CSS `color()` for predefined RGB; sRGB `rgb()` stays 0-255). Confirmed by the differential test (scale [1,1,1]).
  * [x] hsm S>100 FIXED (correct 12-edge D(m); now bounded to 100). okhsl/okhsv (~3 S units at blue corner) + hpluv (pastel-gamut overshoot) left as documented nominal ranges (Ottosson/HSLuv approximation artifacts; clamping would break round-trip).

**Other (from full audit — archived at the task output; sample):**
  * [x] gray — now CIE relative luminance (linearized, exact sRGB Y-row) === XYZ Y/100, not luma. Inverse maps Y→achromatic sRGB; round-trips.
  * [x] din99o-lab/din99o-lch cleaned (rewritten without `alias`/`channel`); cam16 `channel` removed; xyz-d50/lab-d50 `channel` removed
  * [x] S-overflow: hpluv `@channel` notes S exceeds 100 outside the pastel gamut (by design). okhsl/hsm marginally exceed 100 at the gamut boundary (smooth-cusp approximation; okhsl matches culori on H/L exactly, only ~3 S units at the blue corner) — left as documented approximation, not clamped (clamping would break roundtrip).
  * [x] one-way conversions documented: `osaucs.xyz` (no analytical inverse) and `rgb.cubehelix` (parametric colormap) now throw clear one-way errors. `uvw.ucs`/`ucs.uvw` auto-chain.

### Types & metadata
  * [x] Generated `.d.ts` for all **89** spaces via [scripts/generate-types.js](../scripts/generate-types.js) — v3 shape (name/range, flat-arg `Convert`), tsc-strict clean, barrel + util.d.ts. `npm run types`.
  * [x] meta.js generated from `@channel` (channels + range + illuminant). `npm run meta`.
  * [x] **All 90 spaces have @channel headers** (added the 10 that lacked them) + fixed the audit-flagged wrong ranges → full meta coverage.
  * [x] Gamut/encoding metadata per space — per-file @referred (display|scene) + @dynamic (sdr|hdr) JSDoc tags on all 89; generate-meta parses them into meta.js. 9 scene-referred (ACES + camera logs), 17 hdr. Documented in README.

### Defects
  * [x] **Audit pass (43-space Opus audit + self-verification).** Fixed: **hcg** negative-hue wrap (blocker — broke roundtrip); **osaucs** signed-cbrt toe + R-row 0.7790→0.7990 matrix (now matches colour-science); **tsl** g'=0 invertibility; **yiq/yuv** exact matrices (bit-exact roundtrips); **cam16** @channel mislabel ({C}→{M}); all wrong @channel ranges (ucs/uvw/labh/lms/hcl/hct/xyz-abs-d65) + the 10 missing @channel headers → full meta coverage.
  * [x] **All 3 deferred defects FIXED (Opus research pass, each re-derived + reference-validated):**
      - **yccbccrc** — rewritten as true BT.2020 constant-luminance (linear Yc + OETF + piecewise chroma, hub rec2020-linear). Rec.2020 red → [0.503085,-0.259269,0.500116] exact.
      - **hsm** — correct 12-edge D(m); S bounded to 100 (was 106%); red matches Bianconi.
      - **hct** — Material viewing conditions (La=200/π·Y(L*50), Yb=Y(L*50), precise D65); matches colorjs.io exactly (C 112.39 → 113.397).
  * [x] **Wiring: all spaces reachable.** Rewrote `index.js` as a conversion graph: each space declares only its natural-neighbour conversions; `wire()` builds the BFS shortest-path composition for every other pair. din99o-lab/lch rewritten clean (neighbour = lab / din99o-lab; dropped camelCase keys, dead lines, leftover `min`/`max`/`channel`/`alias`); rec2020-oetf & all camelCase hub keys fixed. Integrity test now asserts **0 unreachable** (both directions). No regression (full suite green).
  * [x] One-way conversions documented: `osaucs.xyz` (no analytical inverse) and `rgb.cubehelix` (parametric colormap) throw clear one-way errors; the NaN-safety canary skips the blocked direction.
  * [x] NaN/zero guards: osaucs black ([-13.51,0,0]) + uvw (white-chromaticity at _v=0) — verified NaN-free across the gamut
  * [x] Issue #45 — alpha policy documented (README): alpha is not a channel, carry it yourself; unchanged by conversions.
  * [x] Issue #47 — rgb.js documents D65 (@illuminant D65 + description)
  * [x] Issue #48 — documented (README): rgb clamps to the sRGB gamut; use lrgb/xyz/wide-gamut for unbounded round-trips.
  * [x] Issue #54 — README example fixed to `lab.lchab`
  * [x] HSP/HSI (#38,#39) — NaN-safe on extreme inputs, S bounded to 100 in gamut (verified)
  * [x] hct.js: constrain now imported from cam16 (dedup) + stray comments removed. cam16 matrices consolidated onto util.mat3 (the Phase-2 SIMD/WebGL seam); okhsl left 2D (its matrices are used row-structurally by the Ottosson gamut algorithm — flattening would obscure it). hsluv.js + hpluv.js rewritten fresh from the upstream algorithm, reusing the library lchuv chain + XYZ→linear-sRGB matrix (only the gamut-bounds math is local); white-point precision + lchuv achromatic threshold fixed at the root.

### Tests — bona fide coverage
  * [x] **Authoritative differential suite** ([test/reference.js](../test/reference.js)) — cross-validates against colorjs.io (CSS Color 4 spec editors) in BOTH directions through sRGB (catches self-cancelling fwd/inverse bugs). **25 spaces**. Tol 1.0/255. Runs in `npm test`.
  * [x] **Cited reference points for the 17 v3 spaces** (lch-d65, cam16-ucs, okhwb, aces2065-1, acescct, rec709, logc4, slog3, vlog, log3g10, clog2, dci-p3, smpte-c, ipt, scrgb, rec2100-linear, din99d) — each vs spec / colour-science, plus the white→neutral transpose check.
  * [x] **Bona-fide cited reference values for 42 of the 43 audited spaces** ([test/bonafide.js](../test/bonafide.js), data-driven, scale-aware tol). Each asserts an authoritative input→output (colorjs/colour-science/paper/spec), not a roundtrip.
  * [x] Edge cases — broad NaN/Infinity-safety canary across all 90 spaces (black/white/gray/primaries) + the achromatic/black regression test.
  * [x] README test-coverage claim made honest (was "1,371/99.9%")

### Docs
  * [x] **Reference links in code** — every space file cites its formula source via JSDoc `@see` (CSS Color 4 / Wikipedia / doi / vendor spec / colour-science); test values cite sources (bonafide.js + inline). All URLs verified to resolve.
  * [x] docs/formula-verification.md — differential methodology + 29 colorjs-validated spaces + non-colorjs validation + honest limitations
  * [x] docs/library-comparison.md — vs culori/colorjs.io/chroma-js/@texel (honest, with "choose X if")
  * [x] CHANGELOG.md — 3.0.0 breaking changes + correctness fixes
  * [x] docs/migration.md — v2→v3 guide

## Phase 2 — WASM batch kernel → 3.1 (the headline feature)

  * [x] `mat3 × vec3` primitive — `mat3`/`inv3` in [util.js](../util.js). Now the shared seam for **all** matrix spaces: lrgb (in xyz.js) + the RGB working spaces (p3-linear, rec2020-linear, a98rgb-linear, prophoto-linear), xyz-d50, lab, acescg, ictcp, cam16, the camera logs (logc4/slog3/vlog/log3g10/clog2), dci-p3, smpte-c, ipt, aces2065-1. Each derives its inverse via `inv3(forward)` (single source of truth, bit-exact round-trips). **okhsl/okhsv left 2D on purpose** — their matrices are used row-structurally by the Ottosson analytic gamut-intersection (not v×M), so flattening would obscure the algorithm; they're also not a batch hot-path.

### WASM premise — RE-MEASURED (jz 0.8.1, Node/V8, 1M px, zero-copy buffer-in-WASM, optimize:'speed', checksum-forced)
  * **The flip happened.** jz 0.8.1's transcendental optimizations fixed the cbrt/pow bottleneck that blocked this on 0.8.0 (where rgb→oklab was 0.70× — SLOWER). Reliable (checksum-forced) wins vs the *identical* JS loop: **rgb→xyz 1.7×, rgb→lab 1.5×, rgb→oklab 1.4×, rgb→oklch 1.3×, rgb→hsluv 1.1×** — range **1.1–1.7×**.
  * **CORRECTION:** earlier in-session "~parity matrix-only (1.02×)" + "~1.2× oklab" were a *measurement artifact* — the simple-timing loops let V8 DCE the JS baseline. Forcing the result with a checksum after each timed run shows matrix-heavy is the *biggest* win (rgb→xyz 1.7×), not parity. All WASM perf claims now use the checksum-forced method; the jz `bench/colorconv` harness (separate src/dst + checksum) independently agrees.
  * **Architecture: primitive edges composed like `wire()`.** Measured composed (split) is **1.6× faster than one fused loop** — jz vectorizes cbrt and atan2 better in separate kernels than mixed. So the kernel is a graph of small edges (transfer, matrix, cube-root, one generic cartesian↔cylindrical `polar_fwd/inv` serving every LCh space); `wasm.js` does BFS over it. Drop-in copy path is a single-pass loss (the two copies); `alloc`+`convert` (in-place, no copy) is the primary API.
  * [x] **`color-space/wasm` BUILT — 15 spaces.** [wasm/batch.js](../wasm/batch.js) (jz edge loops, formulas mirror the scalar library, generated+validated vs it) → prebuilt ~12 kB wasm base64-inlined ([scripts/build-wasm.js](../scripts/build-wasm.js)) → [wasm.js](../wasm.js) BFS composer exposes `alloc`/`convert`/`convertBatch`/`spaces`. Self-contained host bridge — jz build-time only, **no runtime dependency**. Covers rgb·lrgb·xyz·oklab·oklch·oklrab·oklrch·lab·lchab·lab-d65·lch-d65·luv·lchuv·hsluv·hpluv. **Pinned to the scalar API** ([test/wasm-batch.js](../test/wasm-batch.js), ≤1e-3) in `npm test`.
  * [x] **Honest claim shipped** (README "Batch conversion (WASM)" + positioning): *same formulas, two backends, verified identical*; 1.1–1.7× zero-copy; edge-graph composition; scalar API stays JS.
  * [x] **Staged the remaining families → 27 spaces.** Added HDR (jzazbz/jzczhz/ictcp), camera logs (logc4/slog3/vlog/log3g10/clog2), ipt, din99d, din99o-lab/lch (workflow-generated + validated edges). All 27 pinned vs scalar (≤4.6e-5). **HCT deferred** (Newton-iteration + array-returning fromCam16 — not expressible in the jz subset; needs a CAM16 primitive hub). jz module-level quirk noted: `Math.cos/sin/log` in a `const` init silently return 0 — angle/log constants must be inlined as literals (`Math.pow` is fine).
  * **Honest perf split (checksum-forced):** cube-root/matrix paths WIN (rgb→xyz 1.7×, lab 1.5×, oklab 1.4×); **PQ/log paths LOSE** (rgb→jzazbz 0.64×, ictcp 0.85×, ipt 0.89×, logc4 0.88×) — jz's `spow`/`pow`/`log10`/`log2` codegen trails V8. Shipped for coverage + WASM-resident pipelines; the gap is a jz-codegen problem, not ours.
  * [ ] **Optimizable cases fed to jz's bench** (per "optimize the tool, not the input"): `bench/colorlch` (fused rgb→oklch parity vs split 1.6×). TODO add: a PQ/spow-heavy case (the jzazbz 0.64× shape — `spow` sign-branch + `**` per channel) and a camera-log case (`Math.pow(10,·)`/`log10`/`log2`). These are the shapes to make jz win.
  * Browser note: the ~12 kB module exceeds the 4 kB main-thread sync-compile cap — instantiation works in Node/Workers; add an async `ready()` or trim for main-thread use.
  * Alternative worth weighing: **WebGL/WebGPU shaders** — GPUs do pow/cbrt in hardware and parallelize massively, a far bigger batch-image win than WASM; the `util.mat3` seam enables it.

## Phase 3 — Prove with nectar

  * [x] **Shaper LUTs** — `cube(from, to, {shaper: true})`: the conversion's own tone diagonal (clamped to the target range) as a 1D shaper before the 3D lattice, Resolve-flavor combined cube (Resolve/OCIO read; ffmpeg's Adobe-strict lut3d doesn't). Measured: shaped 33³ beats plain 65³ for log→display (logc4→rec2020 4.1e-3 vs 5.7e-3, vlog→rec709 1.5e-2 vs 4.2e-2) at ⅙ the size; super-range clips at the shaper (the display-LUT trade). Honest finding kept: per-channel shapers can't fix cross-channel (gamut-edge) curvature, so linear-source pairs barely improve — documented, not oversold.
  * [x] **ICC export (color-space/icc)** — matrix+TRC ICC v2 display profiles, fully mechanical: colorants = XYZ of full-intensity primaries through the D65 hub, Bradford→D50 PCS; TRC = the space's own decode off the neutral diagonal; empirical matrix×transfer gate refuses everything else. Pinned to Lindbloom sRGB/ProPhoto D50 matrices + IEC 61966-2-1; ColorSync applies all profiles end-to-end (test/icc.js + test/icc-colorsync.js, auto-skip off macOS).
  * [x] **data.json (color-space/data.json)** — the registry as one language-neutral artifact: meta + ranges, conversion-graph edges, gamuts, whitepoints, CIE 1931 2° CMFs, 129 cited conformance triples (single-sourced from test/refs.js). Registry-drift test-pinned.
  * [x] **MCP server (color-space-mcp)** — zero-dep stdio JSON-RPC; convert/space/spaces/cube tools; test/mcp.js drives the real process.
  * [x] **Source-only repo + _site** — scripts/build-site.js stages docs sources + runtime modules (imports rewritten to root-relative, guard against escapes) + all generated content into gitignored `_site/`; pages.yml deploys via GitHub Actions with the full suite as deploy gate; docs/ carries sources only (156 pages/llms/sitemap no longer committed). One-time setup: Settings → Pages → Source = GitHub Actions.

  * [x] **LUT export (color-space/lut)** — any conversion as a `.cube` file: channelwise pairs (pure transfer, e.g. rec709→rgb) auto-emit `LUT_1D_SIZE` 4096; cross-channel pairs emit `LUT_3D_SIZE` 33 default (17/33/65 Resolve convention, spec max 256, OCIO caps 129). Self-verifying header: every file carries the measured median/max deviation of the interpolated lattice vs the direct conversion at random off-lattice points, fractions of full scale, split out for in-range outputs when the source is scene-referred (camera logs put most of their domain in super-range highlights). Format pinned to Adobe Cube LUT Specification 1.0 (red-fastest indexing, unclamped values, keywords-before-data) — research pass, 12/12 claims verified against OCIO + ffmpeg parser sources. Differential test suite (test/lut.js: lattice nodes exact, off-lattice bounds, format parse-back, ordering, auto-1D) + test/lut-ffmpeg.js real-host end-to-end (ffmpeg applies the generated .cube to a float frame, must reproduce the library; auto-skips without ffmpeg). Both wired into `npm test`. Docs: catalog filter gained an export facet (wasm · lut chips), space dossier gained a lut section (target picker, 17³/33³/65³, live measured deviation, download), API tabs gained lut.

---

## Uncovered spaces — 19 added (71 → 90), all validated vs cited references
Two deep-research + adversarial-verify passes (Opus). Each connects via an existing hub; matrix spaces derive their inverse from one forward matrix via `util.inv3` (bit-exact roundtrips).
  * [x] **lch-d65** — polar of lab-d65 (→ lab-d65 matches colorjs exactly)
  * [x] **ACES2065-1 / AP0** — AP0↔AP1 matrix, via acescg
  * [x] **ACEScct** — ACES grading log, via acescg
  * [x] **rec709** — BT.709 transfer on sRGB primaries
  * [x] **cam16-ucs** — Li et al. 2017 compression of cam16
  * [x] **okhwb** — Ottosson HWB analog, via okhsv
  * [x] **ARRI LogC4 / AWG4** · **Sony S-Log3 / S-Gamut3** · **Panasonic V-Log / V-Gamut** · **RED Log3G10 / RWG** · **Canon Log 2 / Cinema Gamut** — camera logs (verified vs spec/colour-science reference points; vlog/log3g10 matrices recomputed full-precision NPM from primaries)
  * [x] **dci-p3** — theatrical P3 (DCI white, γ2.6, Bradford→D65) · **smpte-c** — SMPTE 170M NTSC
  * [x] **ipt** — Ebner & Fairchild 1998 (ICtCp's ancestor) · **scrgb** — extended-range linear sRGB · **rec2100-linear** — BT.2100 = BT.2020 linear
  * [x] **din99d** — Cui et al. 2002 *with* the canonical X-correction (Xc=1.12X−0.12Z); hub xyz; L99 cross-checks colour-science, a/b per the paper form (colour-science omits the correction)

  * [x] **CIECAM02 / CAM02-UCS** — CIECAM02 reproduces the Moroney et al. 2002 worked example exactly; CAM02-UCS mirrors cam16-ucs. (predecessor to CAM16, ICC v4 workflows)
  Data-table (need bundled data): Munsell (RIT renotation), NCS, Federal Std 595, BS 4800/5252, AS 2700, RAL (freieFarbe CC data).
  **Skip — proprietary/licensed:** Pantone/PMS, RAL official Lab, HKS, Toyo, DIC, ANPA (IP-enforced; no open authoritative data).

## Future
  * [x] WebGL/WebGPU shader exports (the mat3 seam enables it; bigger batch-image win than WASM — GPUs do pow/cbrt in hardware)
  * [x] CSS Color 5 relative-color syntax hooks (we're the engine, not the polyfill) — note: CC5 adds no new *spaces*, only operations (color-mix, relative color, contrast-color, device-cmyk = our cmyk)
  * [x] Incorporate spaces from https://github.com/meodai/skill.color-expert — RYB added (Itten cube, rybitten); everything else already covered or declined-with-reason (Ostwald/DIN6164/NCS/RAL). OLO is a percept, not a space.

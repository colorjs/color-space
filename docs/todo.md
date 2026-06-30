## v3 — the color conversion kernel

**Positioning.** Not a color toolkit — the color *kernel* toolkits build on. The most complete (**90 spaces**, incl. camera-log/cinema/video/film/scientific/historical no one else ships), exactly-CSS-ranged, verified conversion substrate. JS for single colors, WASM for whole buffers.

**Goal.** Seal the kernel — complete, correct, typed, tested, metadata'd (nothing left to take away) — then ship the one edge nobody else has at this breadth: WASM batch conversion.

**Settled design decisions**
  * Flat channel args, not arrays — self-documenting (`lab.rgb(50,0,0)`), resolves 1-channel ambiguity (`gray.rgb(50)`), WASM-native ABI (values in registers, no heap box), matches THREE/chroma. Composition uses spread; the WASM batch path inlines instead.
  * Conventional CSS-matching ranges (RGB 0-255, HSL 0-360/0-100, Lab 0-100/±125…).
  * No `min`/`max`, no `alias`, no `channel` array on the object — `range` + JSDoc `@channel` carry that, single source of truth.
  * Stay a conversion kernel. No parsing, interpolation, gamut-mapping, ΔE, contrast — composable layers culori/colorjs/texel own. We expose the *metadata* (range, gamut class) that lets them build those on top.
  * **Lab illuminant → D50 (DONE).** `lab`/`lchab` are now **D50** (ICC PCS / CSS Color 4 convention), full-precision ε/κ + Bradford. Added `lab-d65` for display-native; removed redundant `lab-d50` (lab is now it); din99o pinned to `lab-d65` (DIN 6176). All three validated in the differential suite (lab↔colorjs `lab`, lab-d65↔`lab-d65`, lchab↔`lch`). Count still 71. Future: `lchab-d65` + a factory for arbitrary illuminants (A/C/F-series already in `xyz.whitepoint`).

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
  * [x] **rec2020** — FIXED: full-precision BT.2020 OETF (piecewise, α/β from Table 4); 0-1 range. Matches colorjs to 2e-14. `rec2020-oetf` is now redundant (also fixed + reachable) — **recommend removing it** (would make count 70).
  * [x] **lab-d50** (broken) — FIXED: ÷100 input / ×100 output; key `xyz['lab-d50']`. Now matches colorjs D50 `lab` to 0.017 (residual = Bradford precision, tracked). Reachable + tested.
  * [x] **tsl** (broken) — FIXED: inverse recovers θ=atan2(g′,r′) via cos/sin (sign preserved); black guarded. Exact roundtrip all colors (red was [124,83,-83]). Tested.
  * [x] **hcl** (broken) — FIXED: inverse uses `frac()` not JS `%` (Chilliant formula). Full 360-hue sweep roundtrips, 0 failures (green was [255,255,0]). Tested.
  * [~] **coloroid** — PARTIAL. Fixed: crash near −177° + the hue-lookup logic (nearest-angle, no out-of-bounds). But it's **deeper broken than the audit caught**: the bundled hue table is internally inconsistent (each row's stored `angle` vs its own `xλ,yλ` disagree by up to **14°**), and the T saturation formula **does not round-trip** (rgb→coloroid→rgb ≈ 219/255). No reference impl exists (colorjs/culori lack it). Marked EXPERIMENTAL; tests assert only formula-verifiable invariants (V=10√Y exact, white→T=0, valid grade, no NaN/crash). **Needs the authoritative MSZ 7300 / Nemcsics table + ATV↔xyY formulas** — a research task; A/T provisional until then.
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
  * [ ] hsm S can exceed 100; okhsl/okhsv blue S slightly >100; hpluv S max is not 100 (can be 100s) — fix range docs / clamp where spec'd

**Other (from full audit — archived at the task output; sample):**
  * [x] gray — now CIE relative luminance (linearized, exact sRGB Y-row) === XYZ Y/100, not luma. Inverse maps Y→achromatic sRGB; round-trips.
  * [x] din99o-lab/din99o-lch cleaned (rewritten without `alias`/`channel`); cam16 `channel` removed; xyz-d50/lab-d50 `channel` removed
  * [x] S-overflow: hpluv `@channel` notes S exceeds 100 outside the pastel gamut (by design). okhsl/hsm marginally exceed 100 at the gamut boundary (smooth-cusp approximation; okhsl matches culori on H/L exactly, only ~3 S units at the blue corner) — left as documented approximation, not clamped (clamping would break roundtrip).
  * [x] one-way conversions documented: `osaucs.xyz` (no analytical inverse) and `rgb.cubehelix` (parametric colormap) now throw clear one-way errors. `uvw.ucs`/`ucs.uvw` auto-chain.

### Types & metadata
  * [x] Generated `.d.ts` for all **90** spaces via [scripts/generate-types.js](../scripts/generate-types.js) — v3 shape (name/range, flat-arg `Convert`), tsc-strict clean, barrel + util.d.ts. `npm run types`.
  * [x] meta.js generated from `@channel` (channels + range + illuminant). `npm run meta`.
  * [x] **All 90 spaces have @channel headers** (added the 10 that lacked them) + fixed the audit-flagged wrong ranges → full meta coverage.
  * [ ] Add gamut/encoding metadata per space (display-referred vs scene-referred; bounded vs HDR) — not started

### Defects
  * [x] **Audit pass (43-space Opus audit + self-verification).** Fixed: **hcg** negative-hue wrap (blocker — broke roundtrip); **osaucs** signed-cbrt toe + R-row 0.7790→0.7990 matrix (now matches colour-science); **tsl** g'=0 invertibility; **yiq/yuv** exact matrices (bit-exact roundtrips); **cam16** @channel mislabel ({C}→{M}); all wrong @channel ranges (ucs/uvw/labh/lms/hcl/hct/xyz-abs-d65) + the 10 missing @channel headers → full meta coverage.
  * [ ] **Deferred (need spec + verified reference, don't rush):**
      - **yccbccrc** — implemented as non-constant-luminance YPbPr (BT.2020 coeffs) but the name denotes BT.2100/2020 *constant-luminance* (linear-light Yc + piecewise Cbc/Crc). Needs the CL spec + a CL reference value.
      - **hsm** — D(m) normalization lets S exceed 100 (vertex/normalization off for low mixture). Needs the Bianconi et al. exact D(m) + a low-mixture reference.
      - **hct** — borrows cam16's viewing conditions; C is ~1 off vs colorjs (HCT needs Material's own La/Yb). Needs the Material/colorjs viewing-condition constants.
  * [x] **Wiring: all spaces reachable.** Rewrote `index.js` as a conversion graph: each space declares only its natural-neighbour conversions; `wire()` builds the BFS shortest-path composition for every other pair. din99o-lab/lch rewritten clean (neighbour = lab / din99o-lab; dropped camelCase keys, dead lines, leftover `min`/`max`/`channel`/`alias`); rec2020-oetf & all camelCase hub keys fixed. Integrity test now asserts **0 unreachable** (both directions). No regression (full suite green).
  * [~] One-way conversions: `uvw.ucs`/`ucs.uvw` now auto-chain (fixed). Still throw: `osaucs.xyz` (OSA-UCS has no analytical inverse — implement numerically or mark one-way) and `rgb.cubehelix` (reverse needs numerical root-finding). Decide: implement numerically vs document as one-way.
  * [x] NaN/zero guards: osaucs black ([-13.51,0,0]) + uvw (white-chromaticity at _v=0) — verified NaN-free across the gamut
  * [ ] Issue #45 — decide & document alpha policy
  * [x] Issue #47 — rgb.js documents D65 (@illuminant D65 + description)
  * [ ] Issue #48 — XYZ↔RGB roundtrip failure for out-of-sRGB XYZ
  * [x] Issue #54 — README example fixed to `lab.lchab`
  * [x] HSP/HSI (#38,#39) — NaN-safe on extreme inputs, S bounded to 100 in gamut (verified)
  * [ ] Remove duplicate `constrain()` in hct.js; replace minified hsluv.js with readable version

### Tests — bona fide coverage
  * [x] **Authoritative differential suite** ([test/reference.js](../test/reference.js)) — cross-validates against colorjs.io (CSS Color 4 spec editors) in BOTH directions through sRGB (catches self-cancelling fwd/inverse bugs). **25 spaces**. Tol 1.0/255. Runs in `npm test`.
  * [x] **Cited reference points for the 17 v3 spaces** (lch-d65, cam16-ucs, okhwb, aces2065-1, acescct, rec709, logc4, slog3, vlog, log3g10, clog2, dci-p3, smpte-c, ipt, scrgb, rec2100-linear, din99d) — each vs spec / colour-science, plus the white→neutral transpose check.
  * [x] **Bona-fide cited reference values for 42 of the 43 audited spaces** ([test/bonafide.js](../test/bonafide.js), data-driven, scale-aware tol). Each asserts an authoritative input→output (colorjs/colour-science/paper/spec), not a roundtrip.
  * [ ] Edge cases: NaN, Infinity, negative, out-of-gamut
  * [x] README test-coverage claim made honest (was "1,371/99.9%")

### Docs
  * [x] **Reference links in code** — every space file cites its formula source via JSDoc `@see` (CSS Color 4 / Wikipedia / doi / vendor spec / colour-science); test values cite sources (bonafide.js + inline). All URLs verified to resolve.
  * [x] docs/formula-verification.md — differential methodology + 29 colorjs-validated spaces + non-colorjs validation + honest limitations
  * [x] docs/library-comparison.md — vs culori/colorjs.io/chroma-js/@texel (honest, with "choose X if")
  * [x] CHANGELOG.md — 3.0.0 breaking changes + correctness fixes
  * [x] docs/migration.md — v2→v3 guide

## Phase 2 — WASM batch kernel → 3.1 (the headline feature)

  * [~] `mat3 × vec3` primitive — `mat3` in [util.js](../util.js). Used by xyz-d50/lab/prophoto-linear/**acescg/ictcp**. Remaining: cam16/okhsl (array-of-arrays shape), the RGB working spaces.

### WASM premise — MEASURED (jz 0.8.0, Node/V8, 1M px, buffer-in-WASM, optimize:3)
  * matrix-only (lrgb→xyz): WASM **1.14–1.22×** (f32 ~1.18×) — a real but modest win (memory-bound).
  * **rgb→oklab chain (pow + cbrt): WASM 0.70× — SLOWER.** Root cause: **jz's `Math.cbrt` is 3.6× slower than V8's** (jz 36ms vs V8 10ms for 3M cbrt); jz's `pow` ~25% slower.
  * **The flip is achievable (jz's transcendentals, not WASM):** swapping a hand-rolled Newton cbrt into the jz source takes the full sRGB→oklab chain 0.70× → **0.98×** (parity, 3e-5 accuracy), and the *linear* lrgb→oklab path to a **1.17× win** vs V8's fast `Math.cbrt`. Fix jz's cbrt+pow (or SIMD-vectorize them) → the natural code wins.
  * Per "optimize the tool, not the input": **improve jz's cbrt/pow first**, then the kernel using plain `Math.cbrt`/`**` wins. Added a target bench `bench/colorconv/colorconv.js` to the jz repo (sRGB→oklab) — register in jz's `bench.mjs` CASE_NAMES.
  * [ ] `color-space/wasm`: `convertBatch(src, dst, n)` — build **after** jz transcendentals improve (else perceptual conversions lose). Matrix-only paths (xyz↔lrgb, linear working spaces) already win modestly today.
  * [ ] Honest claim once shipped: faster for buffer pipelines on the paths jz wins; scalar API stays JS (per-call WASM is slower).
  * Alternative worth weighing: **WebGL/WebGPU shaders** — GPUs do pow/cbrt in hardware and parallelize massively, a far bigger batch-image win than WASM; the `util.mat3` seam enables it.

## Phase 3 — Prove with nectar

  * [ ] README rewrite around the kernel positioning + honest WASM story
  * [ ] Comparison table as the proof asset (71 vs culori 35 / colorjs 40 / texel 16; only conventional-ranges lib; the cross-disciplinary spaces)
  * [ ] Demo: all-spaces color picker / palette renderer with gamut limits (show breadth, don't claim it)
  * [ ] Website (playwright-generated): all spaces, benchmark, alt-analysis

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

## Future / out of scope for v3
  * [ ] WebGL/WebGPU shader exports (the mat3 seam enables it; bigger batch-image win than WASM — GPUs do pow/cbrt in hardware)
  * [ ] CSS Color 5 relative-color syntax hooks (we're the engine, not the polyfill)
  * [ ] Incorporate spaces from https://github.com/meodai/skill.color-expert
  * [ ] AI-training data / education / visualizations

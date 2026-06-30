## v3 — the color conversion kernel

**Positioning.** Not a color toolkit — the color *kernel* toolkits build on. The most complete (71 spaces, incl. video/film/scientific/historical no one else ships), exactly-CSS-ranged, verified conversion substrate. JS for single colors, WASM for whole buffers.

**Goal.** Seal the kernel — complete, correct, typed, tested, metadata'd (nothing left to take away) — then ship the one edge nobody else has at this breadth: WASM batch conversion.

**Settled design decisions**
  * Flat channel args, not arrays — self-documenting (`lab.rgb(50,0,0)`), resolves 1-channel ambiguity (`gray.rgb(50)`), WASM-native ABI (values in registers, no heap box), matches THREE/chroma. Composition uses spread; the WASM batch path inlines instead.
  * Conventional CSS-matching ranges (RGB 0-255, HSL 0-360/0-100, Lab 0-100/±125…).
  * No `min`/`max`, no `alias`, no `channel` array on the object — `range` + JSDoc `@channel` carry that, single source of truth.
  * Stay a conversion kernel. No parsing, interpolation, gamut-mapping, ΔE, contrast — composable layers culori/colorjs/texel own. We expose the *metadata* (range, gamut class) that lets them build those on top.
  * **Lab illuminant → D50 (DONE).** `lab`/`lchab` are now **D50** (ICC PCS / CSS Color 4 convention), full-precision ε/κ + Bradford. Added `lab-d65` for display-native; removed redundant `lab-d50` (lab is now it); din99o pinned to `lab-d65` (DIN 6176). All three validated in the differential suite (lab↔colorjs `lab`, lab-d65↔`lab-d65`, lchab↔`lch`). Count still 71. Future: `lchab-d65` + a factory for arbitrary illuminants (A/C/F-series already in `xyz.whitepoint`).

---

## Phase 0 — Make it load (the gate)

  * [ ] Close 35 unclosed object literals (missing `};` after `name:`) — library is currently unparseable, **0 tests run**
  * [ ] Green the test suite; capture the real passing assertion count
  * [ ] README truth pass: **71** spaces (not 72), the real test number (not "1,371 / 99.9%"), delete *"Values remain normalized to 0-1 in the API"* (contradicts the whole v3 premise)

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
  * [ ] acescg adapt matrices (not exact inverses — but passes differential); rec2100-hlg scale→3.77412; yiq inverse matrix consistent with forward

**Range/doc — minor:**
  * [x] p3, a98rgb, rec2020 `@channel` 0-255 → 0-1 (matches CSS `color()` for predefined RGB; sRGB `rgb()` stays 0-255). Confirmed by the differential test (scale [1,1,1]).
  * [ ] hsm S can exceed 100; okhsl/okhsv blue S slightly >100; hpluv S max is not 100 (can be 100s) — fix range docs / clamp where spec'd

**Other (from full audit — archived at the task output; sample):**
  * [ ] gray — `rgb.gray` applies Rec.709 luma to gamma-encoded RGB (luma Y′) not linearized RGB (luminance Y); decide which and document (same matrix-on-gamma class as the oklab fix)
  * [ ] din99o-lab/din99o-lch still carry removed v3 props (`alias`, `channel`) — clean up during the wiring fix

### Types & metadata
  * [ ] Generate `.d.ts` from JSDoc `@channel` headers — extend [scripts/generate-meta.js](../scripts/generate-meta.js); kills the 32 missing + 3 wrong-ext + drift
  * [ ] Finish `range` on all 71 (only ~20 have it)
  * [ ] Add gamut/encoding metadata per space (display-referred vs scene-referred; bounded vs HDR)
  * [ ] Delete orphan `types/munsell.d.ts`; remove `min`/`max` from `types/color-space.d.ts`

### Defects
  * [x] **Wiring: all spaces reachable.** Rewrote `index.js` as a conversion graph: each space declares only its natural-neighbour conversions; `wire()` builds the BFS shortest-path composition for every other pair. din99o-lab/lch rewritten clean (neighbour = lab / din99o-lab; dropped camelCase keys, dead lines, leftover `min`/`max`/`channel`/`alias`); rec2020-oetf & all camelCase hub keys fixed. Integrity test now asserts **0 unreachable** (both directions). No regression (full suite green).
  * [ ] `osaucs.xyz()`, `rgb.cubehelix()`, `uvw.ucs()`, `ucs.uvw()` — implement, or honestly mark one-way + document
  * [ ] NaN/zero guards: `osaucs` X+Y+Z=0 (black), `uvw` `_v`=0 denominator
  * [ ] Issue #45 — decide & document alpha policy
  * [ ] Issue #47 — document RGB reference white / illuminant (sRGB D65)
  * [ ] Issue #48 — XYZ↔RGB roundtrip failure for out-of-sRGB XYZ
  * [ ] Issue #54 — README `lab.lch` → actual `lab.lchab` (or alias the path)
  * [ ] HSP/HSI out-of-bounds on extreme inputs (#38, #39)
  * [ ] Remove duplicate `constrain()` in hct.js; replace minified hsluv.js with readable version

### Tests — bona fide coverage
  * [x] **Authoritative differential suite** ([test/reference.js](../test/reference.js)) — cross-validates against colorjs.io (CSS Color 4 spec editors) in BOTH directions through sRGB (catches self-cancelling fwd/inverse bugs). **24 spaces**: srgb-linear, p3(+linear), rec2020(+linear), a98rgb(+linear), prophoto(+linear), xyz-d65/d50, lab-d50, luv, lchuv, oklab, oklch, hsl, hsv, hwb, jzazbz, jzczhz, ictcp, acescg, acescc. Tol 1.0/255 (sub-perceptual; real bugs were 20-1330). Runs in `npm test`. (lchab/lab cs-D65 vs colorjs-D50 excluded; okhsl/okhsv not in colorjs — validated vs culori.)
  * [ ] Per-space reference-value cases (primaries, white, black, gray)
  * [ ] Roundtrip precision (A→B→A error accumulation)
  * [ ] Edge cases: NaN, Infinity, negative, out-of-gamut
  * [ ] cam16/hct viewing-condition variations
  * [ ] Report true count; keep README honest to it

### Docs
  * [ ] docs/library-comparison.md (referenced, missing)
  * [ ] docs/formula-verification.md (referenced, missing)
  * [ ] CHANGELOG.md
  * [ ] v2→v3 migration guide (currently commented out)

## Phase 2 — WASM batch kernel → 3.1 (the headline feature)

  * [ ] `mat3 × vec3` primitive refactor — DRY across all linear spaces, SIMD-friendly, WebGL-friendly, jz-compilable (one refactor serves correctness + reuse + WASM)
  * [ ] `color-space/wasm` (or `/batch`): `convertBatch(src, dst, n)` over typed arrays — whole loop inside one jz-compiled WASM call, zero per-pixel boundary crossings
  * [ ] Start with the matrix-clean paths where WASM actually wins: xyz↔lrgb, Oklab matrix steps, linear working spaces (p3/rec2020/a98/prophoto linear ↔ xyz)
  * [ ] Honest benchmark + claim: **2–5× faster than a JS loop for buffer pipelines on matrix spaces; single-color scalar API stays JS** (per-call WASM is *slower* — never headline "faster than JS" unqualified)
  * [ ] Keep scalar JS API and WASM batch API numerically equivalent (shared test vectors)
  * [ ] Flagship jz corpus: the breadth is jz's best torture-test; jz makes this the only broad-breadth WASM color kernel

## Phase 3 — Prove with nectar

  * [ ] README rewrite around the kernel positioning + honest WASM story
  * [ ] Comparison table as the proof asset (71 vs culori 35 / colorjs 40 / texel 16; only conventional-ranges lib; the cross-disciplinary spaces)
  * [ ] Demo: all-spaces color picker / palette renderer with gamut limits (show breadth, don't claim it)
  * [ ] Website (playwright-generated): all spaces, benchmark, alt-analysis

---

## Future / out of scope for v3
  * [ ] WebGL versions (the mat3 primitive enables this)
  * [ ] CSS Color 5 relative-color syntax hooks (we're the engine, not the polyfill)
  * [ ] Additional spaces: CIECAM02, Munsell, NCS, OSA-UCS inverse, PhotoYCC
  * [ ] Incorporate spaces from https://github.com/meodai/skill.color-expert
  * [ ] AI-training data / education / visualizations

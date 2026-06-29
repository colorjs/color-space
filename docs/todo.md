## v3 — the color conversion kernel

**Positioning.** Not a color toolkit — the color *kernel* toolkits build on. The most complete (71 spaces, incl. video/film/scientific/historical no one else ships), exactly-CSS-ranged, verified conversion substrate. JS for single colors, WASM for whole buffers.

**Goal.** Seal the kernel — complete, correct, typed, tested, metadata'd (nothing left to take away) — then ship the one edge nobody else has at this breadth: WASM batch conversion.

**Settled design decisions**
  * Flat channel args, not arrays — self-documenting (`lab.rgb(50,0,0)`), resolves 1-channel ambiguity (`gray.rgb(50)`), WASM-native ABI (values in registers, no heap box), matches THREE/chroma. Composition uses spread; the WASM batch path inlines instead.
  * Conventional CSS-matching ranges (RGB 0-255, HSL 0-360/0-100, Lab 0-100/±125…).
  * No `min`/`max`, no `alias`, no `channel` array on the object — `range` + JSDoc `@channel` carry that, single source of truth.
  * Stay a conversion kernel. No parsing, interpolation, gamut-mapping, ΔE, contrast — composable layers culori/colorjs/texel own. We expose the *metadata* (range, gamut class) that lets them build those on top.

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
  * [ ] **rec2020** — uses pure power-law `x^2.4`, not the ITU-R BT.2020 OETF (linear segment, α=1.0993). Error 0.107 vs colorjs. (`rec2020-oetf` is the correct transfer — reconcile the two.)
  * [x] **lab-d50** (broken) — FIXED: ÷100 input / ×100 output; key `xyz['lab-d50']`. Now matches colorjs D50 `lab` to 0.017 (residual = Bradford precision, tracked). Reachable + tested.
  * [x] **tsl** (broken) — FIXED: inverse recovers θ=atan2(g′,r′) via cos/sin (sign preserved); black guarded. Exact roundtrip all colors (red was [124,83,-83]). Tested.
  * [x] **hcl** (broken) — FIXED: inverse uses `frac()` not JS `%` (Chilliant formula). Full 360-hue sweep roundtrips, 0 failures (green was [255,255,0]). Tested.
  * [ ] **coloroid** — hue table off by 2 positions (`TABLE[i+1]` vs `TABLE[i]`), T formula missing ×100, crash near −177°.
  * [x] **hcy** — FIXED: reimplemented as Chilliant luma-based HCY (Y = Rec.601 luma: red 29.9/green 58.7/blue 11.4, was 33.3 for all); chroma renormalized by hue-luma; achromatic NaN-safe; exact roundtrip. Tested.
  * [x] **jzczhz** — FIXED: removed the double ×100 (jzazbz already conventional); pure polar transform. Roundtrip 3e-15, hue matches colorjs. Tested.
  * [x] **yuv** — FIXED: inverse blue coeff `2.02311` → `2.03211` = (1−Kb)/Umax. Matrix-consistent roundtrip. Tested.
  * [x] **labh** — FIXED: D65 white-point ratios (kx=100/95.047, kz=100/108.883); white → [100,0,0] (was a=−5.34). Exact roundtrip. Tested.

**Edge / NaN guards — confirmed:**
  * [ ] hsi, hcy — achromatic (r=g=b) → acos(0/0)=NaN hue
  * [ ] cam16 — `cam16.xyz(0,0,0)` → [NaN,NaN,NaN] (÷ Jroot=0)
  * [ ] osaucs — `xyz(0,0,0)` → NaN (X+Y+Z=0 unguarded)
  * [ ] uvw — `xyz(0,0,0)` → [43.72,68.99,−17] (guarded _u/_v=0 but U/V still use them); lchuv black → H=180; hsp red → hue 360 not 0

**Precision (canonical constants) — minor:**
  * [ ] rec2020-oetf α 1.099→1.099296826809443; prophoto/prophoto-linear/acescg Bradford matrices to full precision; lab ε→216/24389; rec2100-hlg scale→3.77412; yiq inverse matrix consistent with forward

**Range/doc — minor:**
  * [ ] p3, a98rgb, rec2020 `@channel` say 0-255 but code uses 0-1 → fix docs to 0-1 (matches CSS `color()` for predefined RGB; sRGB `rgb()` stays 0-255)
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
  * [~] **Wiring: spaces unreachable from rgb.** (a) camelCase/hyphen key mismatch — FIXED for 7 (p3-linear, rec2020-linear, a98rgb-linear, prophoto-linear, xyz-d50, xyz-abs-d65, lab-d50): keys now bracketed-hyphenated, readers updated, reachability pinned by integrity test. **Remaining (6):** din99o-lab, din99o-lch (camelCase `rgb.din99oLab` + entangled internal `lab.din99oLab` refs), rec2020-oetf (no hub-reverse conversion), and (b) oklrab, oklrch, jzczhz — connected only to a non-hub (oklab/jzazbz); `createConverter` routes solely through xyz/rgb. Fix: give these a hub path, or let `createConverter` chain through one intermediate non-hub space. Update the integrity-test canary as each is fixed.
  * [ ] `osaucs.xyz()`, `rgb.cubehelix()`, `uvw.ucs()`, `ucs.uvw()` — implement, or honestly mark one-way + document
  * [ ] NaN/zero guards: `osaucs` X+Y+Z=0 (black), `uvw` `_v`=0 denominator
  * [ ] Issue #45 — decide & document alpha policy
  * [ ] Issue #47 — document RGB reference white / illuminant (sRGB D65)
  * [ ] Issue #48 — XYZ↔RGB roundtrip failure for out-of-sRGB XYZ
  * [ ] Issue #54 — README `lab.lch` → actual `lab.lchab` (or alias the path)
  * [ ] HSP/HSI out-of-bounds on extreme inputs (#38, #39)
  * [ ] Remove duplicate `constrain()` in hct.js; replace minified hsluv.js with readable version

### Tests — bona fide coverage
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

# Positioning — color-space

> Internal source of truth (Dunford's 5 components). External taglines are *derived* from this, never the reverse.
> Built on [audience.md](audience.md). Feeds [surfaces.md](surfaces.md) and [distribution.md](distribution.md).

---

## The positioning statement

> **For developers and color scientists who need to convert between color spaces — especially the ones ordinary libraries skip (camera logs, appearance models, broadcast, historical, Munsell) — and who are stuck hand-porting formulas or stitching libraries together, color-space is the complete, verified color-space conversion kernel: 131 spaces under one tiny API, with values in CSS-native ranges and formulas differentially tested against the CSS spec reference. Unlike culori, colorjs.io, or chroma-js, it covers 3–5× more spaces, matches CSS ranges instead of normalized 0–1, and is public domain.**

---

## The one big idea

**Every color space. One API. Verified.**

Three words, three proofs: *Every* (131, more than any JS library) · *One API* (`from.to(...channels)`, tiny, tree-shakeable) · *Verified* (differential vs colorjs.io + cited papers). Everything else is support.

---

## Dunford's five components

### 1. Competitive alternatives
culori · colorjs.io · chroma-js · @texel/color · color-convert · **hand-rolling matrix math from papers/Wikipedia** (the real status quo) · `colour-science` (Python, not JS).

### 2. Unique attributes (provably absent from the alternatives)
| Attribute | Proof | Absent from alternatives because |
|---|---|---|
| **131 color spaces** | runtime-verified count; categorized + cited in README | others ship ~15–40; none reach the long tail |
| **Camera-log + broadcast + appearance breadth** | S-Log3, LogC4, V-Log, RED Log3G10, Canon Log, Cineon, F-Log, BMD Film; YUV/YCbCr family; CAM16/CIECAM02/CAM-UCS/LCD/SCD, Hellwig 2022, ZCAM, HCT | not in culori/colorjs.io/chroma/texel at all |
| **Munsell, RAL Design, Coloroid, OSA-UCS, TSL, YES** | bidirectional Munsell via 1943 renotation; cited | absent everywhere else in JS |
| **CSS-native value ranges** | `lab(50,…)`, `oklch(65,…)`, `rgb(255,…)` match CSS Color 4 | every other lib normalizes 0–1 |
| **Differential verification** | `test/reference.js`: ~30 spaces both directions vs colorjs.io at 1/255; corrects published-paper errors | others self-test only |
| **WASM batch kernel — *same source*** | `color-space/wasm`: the scalar formulas AOT-compiled to WASM (jz, `optimize:'speed'`), pinned bit-for-bit to the JS API (`test/wasm-batch.js`); zero-copy buffer convert ~1.2× faster than JS on perceptual paths, compounding over a chain | no other JS color lib ships a WASM batch path at all — and none could match "same formulas, verified identical to the scalar path" |
| **Public domain (Unlicense)** | package license | others are MIT/etc. (still permissive, but not PD) |

### 3. Value themes (attribute → outcome, with proof)
1. **Reach any space — even the exotic ones.** *Stop hand-porting formulas from PDFs; the space you need is already here, cited.* (Proof: 131 spaces, the camera-log/appearance/Munsell long tail.)
2. **Trust the numbers.** *Ship color math you didn't have to re-derive or second-guess.* (Proof: differential vs colorjs.io at 1/255; paper corrections.)
3. **Drop-in CSS-native values.** *Read and write the same numbers you put in CSS — no 0–1 mental math, no translation layer.* (Proof: CSS Color 4 ranges.)
4. **Stays small and unencumbered.** *Take one space, ship ~2 kB; no license to read.* (Proof: tree-shakeable ESM, zero deps; ~2 kB per space, ~44 kB for all 131; public domain.)
5. **Scale from one color to a whole image.** *The scalar API for single colors; an opt-in WASM batch kernel for buffers — the same verified formulas, no per-pixel JS overhead.* (Proof: `color-space/wasm`, jz-compiled, ~1.2× faster zero-copy on perceptual paths, pinned to the scalar API.)

### 4. Who cares a lot (best-fit, wedge-first)
Film/video color-pipeline devs in JS (near-zero competition) → color scientists/educators (credibility + citations) → CSS/design-system devs adopting OKLCH/P3 (volume) → creative-coding/viz (adjacent). Full traits in [audience.md](audience.md).

### 5. Market category
**Choice: "big fish, small pond" + kernel framing.** Do *not* compete in the crowded "color toolkit" category (culori/chroma win on parsing/interpolation/ΔE). Instead own a narrower, winnable frame:

> **The complete, verified color-space *conversion* library — the conversion substrate other tools can build on.**

This sets the buyer's yardstick to *space coverage + correctness* (where color-space wins), not *feature count* (where toolkits win). "Conversion kernel, not toolkit" turns the missing features into a deliberate, clean-design virtue rather than a gap.

---

## The "what we are not" — said proudly, on purpose

No CSS string parsing · no interpolation/mixing · no gamut mapping · no ΔE · no WCAG contrast · no palette/scale generation. These are the **application layer**. Omitting them is *why* the kernel stays pure, tiny, and tree-shakeable — and culori/colorjs.io/chroma can sit on top. State this explicitly so toolkit-seekers self-select out instead of bouncing disappointed.

---

## Message hierarchy (use top-down; never bury the lead)

1. **Every color space, one API, verified.** (131 · CSS-native · differential-tested)
2. **The one with the space you need** — camera logs, CAM16, Munsell, broadcast, historical.
3. **Values that match CSS** — no 0–1 translation.
4. **Tiny, zero-dep, public domain.**
5. **A clean conversion kernel** — pair it with culori/chroma for the toolkit layer.

---

## Proof inventory (attach to claims; never assert bare)

- **"131 spaces"** — runtime count; the categorized, source-cited list in the README is itself the proof of completeness.
- **"Verified"** — differential suite vs colorjs.io (CSS spec editors), both directions, 1/255 tolerance; original-paper citations per space; documented paper corrections.
- **"CSS-native"** — side-by-side `lab(50,0,0)` vs others' `lab(0.5,0,0)`.
- **"Tiny / zero-dep"** — **quote the tree-shaken per-space import (~2 kB)**, not the full bundle (all 131 ≈ 44 kB min+gz locally — *larger* than culori/colorjs.io because it has 3–5× the spaces; never call the full library "tiny"). Comparing our per-space import to culori's/colorjs.io's *full* bundle is apples-to-oranges — compare like for like. Measure real per-space numbers once v3 ships to npm. No dependencies. (See [market-data.md](market-data.md).)
- **"Public domain"** — Unlicense.
- **"WASM batch / same source"** — `color-space/wasm` is jz-compiled from the scalar formulas; `test/wasm-batch.js` pins every path to the scalar API bit-for-bit (≤1e-6). Speed claim must stay precise: ~1.2× vs the *identical* JS loop, **zero-copy**, 1M px, **perceptual paths** (rgb↔oklab); ~parity on matrix-only; the drop-in copy API trades the win for convenience. Never a blanket "WASM is faster" — it's specifically whole-buffer perceptual work kept in WASM memory. The durable claim is *same formulas, two backends, verified identical*, not the multiplier.

---

## Headline candidates (derived; test before committing)

Diagnosis (from audience.md): Solution/Product-Aware, Sophistication Level 3–4 → lead with the specific number + mechanism + proof.

- `Every color space. One tiny API. Verified.`
- `131 color spaces in JavaScript — with values that match CSS.`
- `The color-space conversion library with the space you actually need.`
- `Convert any color space to any other — 131 of them, formulas verified against the CSS spec.`
- Wedge (film): `The only JavaScript library that speaks S-Log3, ACES, and Rec.2100.`
- Wedge (science): `CAM16, CIECAM02, Munsell, OSA-UCS — in one verified JS package.`

Avoid: "Open collection of color spaces" (Level-1 plain claim, no number, no proof — undifferentiated in a Level-3 market).

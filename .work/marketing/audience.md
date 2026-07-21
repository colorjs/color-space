# Who uses color-space — audience research

> Marketing's prime directive: *you cannot create desire, only channel desire that already exists.*
> This document pins the desire, the words, the alternatives, and the objections — **before** any copy.
> Everything in [positioning.md](positioning.md), [surfaces.md](surfaces.md), and [distribution.md](distribution.md) derives from here.

---

## The one-sentence answer

People reach for color-space at the exact moment they need to **convert one color space into another and discover their current tool doesn't have that space** — or they don't trust the formula they found. The relief they feel is *"this one actually has it, and it's verified."*

The desire is not "I want a color library." It is **"convert THIS into THAT, correctly, without re-deriving the math myself."** color-space wins by having the space they need (162 of them) and proving the numbers.

---

## The market reality: used, but invisible

color-space already gets **~4.0M monthly npm downloads (935k/wk) — culori-tier (culori: 5.7M/mo)** — but has only **357 GitHub stars** (culori 1,211; chroma-js 10,574). It is used (largely transitively, via colorjs-org packages and 45 dependents) but **under-known, under-starred, under-discussed.** So the job is not "find users from zero" — it's **convert invisible usage into visibility, stars, direct adoption, and word-of-mouth.** Full figures in [market-data.md](market-data.md). This is why [distribution.md](distribution.md) leads with social surfaces and shareable proof rather than cold awareness.

---

## The dominant mass desire (the thing to channel)

Ranked by intensity × reach × how directly color-space satisfies it:

1. **"Just have the space I need."** The acute pain is searching culori/colorjs.io/chroma-js, not finding S-Log3 / CAM16 / Munsell / YCbCr, and facing the prospect of hand-porting a formula from a PDF. color-space is the only JS library that ends this search. **Highest intensity, this is the wedge.**
2. **"Let me trust the number."** Developers who *did* hand-port a formula and now can't tell if it's right. Every space carries an independent cited conformance anchor; 29 are differentially tested against the CSS spec reference (colorjs.io) at 1/255; camera logs are verified against the Academy's official ACES vendor transforms with published deltas (docs/lut-verification.md); and it has corrected errors in published papers. Proof is the moat.
3. **"Stop making me do 0–1 mental math."** Frontend/CSS developers who think in `oklch(65% 0.2 180)` and `rgb(255 128 0)` but whose library wants `oklch(0.65, 0.2, 0.5)`. color-space uses CSS-native ranges — the only one that does.
4. **"Keep it small and unencumbered."** Tree-shakeable, zero deps, public domain — take one space, ship a few hundred bytes, no license to read.

Desire #1 is the headline. Everything else is proof and reassurance.

---

## Segments (situational traits, not demographics)

Dunford's test: not "who they are" but *the trait that makes them see the value instantly.* Listed wedge-first.

### A. Video / film / VFX color pipeline — **the moat**
- **Trait:** working in JS/TS (web tools, Electron grading apps, browser LUT tools, render farms) and needs camera-log ↔ scene-linear ↔ display conversions.
- **Needs:** ACES (cg/cc/cct/2065-1), S-Log3 (S-Gamut3 *and* S-Gamut3.Cine), LogC4, V-Log, RED Log3G10, Canon Log, F-Log, Cineon, BMD Film, Rec.2020/2100 (PQ/HLG), YCbCr family.
- **Alternatives today:** hand-porting from ARRI/Sony/RED whitepapers; the Python `colour-science` lib (not JS); nothing complete in JS.
- **Why they convert instantly:** *no other JS library has these* — and now the proof speaks their language: camera-log conversions are differential-tested against the Academy's official ACES vendor transforms (deltas published), and the atlas hands them verified `.cube` LUTs in-browser, no npm involved. This is "big fish, small pond." Small segment, near-zero competition, intense need.
- **Non-JS extension of this segment — colorists/DITs:** never touch npm; reach them through the atlas LUT downloads and the ffmpeg/Resolve/OBS path. See distribution.md's film track.

### B. Color scientists / researchers / educators — **the credibility anchor**
- **Trait:** needs a *reference* implementation they can cite and verify; values correctness over convenience.
- **Needs:** CAM16, CIECAM02, CAM02/16-UCS/LCD/SCD, Hellwig 2022, ZCAM, OSA-UCS, Munsell (bidirectional), historical CIE (1960 UCS, 1964 UVW, Hunter Lab), DIN99 family.
- **Alternatives:** `colour-science` (Python), MATLAB, raw papers.
- **Why they matter beyond their size:** they generate citations, backlinks, and the "it corrects errors in papers" story (high social currency). They make the *verified* claim believable to everyone else.

### C. CSS / design-system / frontend developers — **the volume**
- **Trait:** adopting OKLCH/P3, building theme tokens, color pickers, dark-mode ramps; thinks in CSS Color 4 syntax.
- **Needs:** rgb ↔ hsl ↔ oklch ↔ lab ↔ p3, in CSS-native ranges; gamut-aware spaces.
- **Alternatives:** culori (the default), colorjs.io, chroma-js, hand-rolled.
- **Why they convert:** CSS-native ranges (no 0–1 translation) + having every modern perceptual space. This is the largest crowd; they're also the most contested.

### D. Data-viz / scientific-viz developers
- **Trait:** building colormaps, needs perceptual uniformity and monotonic-lightness scales.
- **Needs:** OKLab, CAM16-UCS, Cubehelix, LCh, Jzazbz.
- **Alternatives:** d3-color, chroma-js (Brewer scales).
- **Note:** color-space gives correct *conversions*; it deliberately omits scale generation (see "what we are not"). Pairs with, not replaces, chroma/d3 here.

### E. Creative coders / shader / WebGL / generative art
- **Trait:** color math inside GPU pipelines, HDR, wide gamut.
- **Needs:** OKLab, linear-light spaces, P3, Rec.2100 linear, scRGB.
- **Alternatives:** @texel/color (fast, 0–1, GPU-oriented), hand-rolled GLSL.

### F. Cross-disciplinary: print / paint / architecture
- **Trait:** bridging physical color systems into digital.
- **Needs:** Munsell, RAL Design, Coloroid, CMYK/CMY.
- **Why it matters:** uniquely served; strong "whoa, it has Munsell" social-currency moments.

### G. WASM / compiler authors — *users of the code, not the API*
- The project is used as a test corpus for JS→WASM compilers (porffor, jz). Real, but a **side effect**, not a buyer. Mention in "motivation," never lead with it.

### H. AI agents / MCP clients — *emerging, don't lead with it*
- `npx color-space-mcp` exposes `convert`, `space`, `spaces`, `cube` as MCP tools — an agent answering color questions grounds in verified conversions instead of hallucinating matrices. Real and differentiating (no other color lib ships one), but the crowd is young; mention it, measure interest, don't build the pitch on it.

---

## The words they actually use (mirror these in copy)

Use their vocabulary, not ours. Observed terms by segment:

- **CSS/frontend:** "convert hsl to oklch", "P3 / wide gamut", "color tokens", "in gamut / out of gamut", "CSS Color 4", "perceptually uniform".
- **Film/video:** "camera log", "scene-linear", "S-Log3 to Rec.709", "ACES IDT/ODT", "tone mapping", "LUT".
- **Science:** "color appearance model", "viewing conditions", "ΔE / color difference", "chromatic adaptation", "renotation", "tristimulus".
- **General:** "color space conversion", "color math", "round-trip", "matrix".

Avoid our internal words when they aren't theirs: "kernel", "conventional ranges" (say *CSS-native* or *human-readable*), "register a space".

---

## Competitive alternatives (what they'd use if we vanished)

Per Dunford, these are real substitutes from the buyer's decision, not vendors we wish we competed with:

| Alternative | What it is | Where it wins | Where it leaves a gap |
|---|---|---|---|
| **culori** | The mature all-round web color toolkit | parsing, interpolation, gamut-map, ΔE, WCAG | ~3–4× fewer spaces; 0–1 ranges; no video/film/appearance breadth |
| **colorjs.io** | W3C CSS Color spec reference impl | authoritative CSS behavior, modern perceptual | ~25 kB min+gz full; 0–1 ranges; ~3× fewer spaces |
| **chroma-js** | Viz/palette ergonomics | scales, Brewer, fluent API | not tree-shakeable; few spaces; no exotic spaces |
| **@texel/color** | Fast typed-array/GPU conversion | throughput, tiny | ~16 spaces; 0–1; no breadth |
| **color-convert** | The old simple converter | tiny, ubiquitous legacy | handful of spaces; no modern/perceptual |
| **Hand-rolling** | Copy matrix math from Wikipedia / Bruce Lindbloom / a paper | free, exactly what you need | unverified, error-prone, time sink — *this is the status quo to beat* |
| **`colour-science`** | The Python reference | exhaustive, authoritative | not JavaScript |

**The status quo to beat is "hand-roll it from a PDF."** That is what people do for every space the other libraries lack — and it's exactly where color-space removes the most pain.

---

## Objections (and the honest answer)

1. *"Doesn't culori/colorjs.io already do this?"* — For the common spaces, yes. color-space is for **when they don't have your space**, when you want **CSS-native ranges**, or when you need the conversion **verified**. It's a conversion kernel, not a competing toolkit — it can sit *under* them.
2. *"No parsing / interpolation / ΔE / gamut-mapping?"* — Correct, by design. That's the application layer; keeping the kernel pure is why it stays tiny and tree-shakeable. Pair it with culori/chroma for those.
3. *"Is the math right?"* — Every space pinned to an independent cited anchor; 29 differentially tested against colorjs.io (the CSS spec editors' impl) both directions at 1/255; camera logs differential-tested against the Academy's official ACES vendor transforms (deltas published, reruns on every `npm test`); documented cases where it corrects the literature.
4. *"162 spaces — is that just padding?"* — Each is a real, separately-importable transform with cited provenance and an independent conformance anchor. Breadth is the point: the long tail (camera logs, appearance models, Munsell) is exactly what nothing else has.
5. *"Will it bloat my bundle?"* — Import one space, ship 0.4–1.5 kB. The 55 kB figure is *all 162 together* — which nobody imports.
6. *"v3 breaking changes?"* — Ranges moved from 0–1 to CSS-native; there's a migration guide. One-time, mechanical.

---

## Diagnosis → what kind of copy this demands

**Awareness (Schwartz):** mostly **Solution-Aware → Product-Aware.** They know color libraries exist; many know color-space from v1/v2 (it's a long-established package). So copy should *crystallize* "this is the complete, verified one" and *overcome the specific objection* ("isn't culori enough?") — not educate from zero.

**Sophistication (Schwartz): high — Level 3–4.** "Convert colors" is a worn-out claim; three good libraries already make it. A plain claim ("collection of color spaces") lands as undifferentiated. We must lead with **mechanism**: the *number* (162, verified), the *spaces nobody else has*, the *CSS-native ranges*, the *differential verification*. These are the Level-3/4 moves.

**Implications, carried into every surface:**
- Lead with the ownable, ultra-specific number and the proof — never a generic "color library" claim.
- Specificity over superlatives: "162 spaces, every one independently anchored, 29 verified at 1/255 against colorjs.io, camera logs against the official ACES transforms" beats "comprehensive and accurate."
- Proof before promises (skeptical dev market): surface the verification early.
- One reader, one idea per surface: *have every space; trust every number.*

---

*Market-size data (npm downloads, GitHub stars per competitor) is compiled in [market-data.md](market-data.md) to keep this document evergreen.*

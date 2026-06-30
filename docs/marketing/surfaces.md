# Owned surfaces — README, npm, landing page

> The conversion surfaces a prospect actually reads. Derived from [positioning.md](positioning.md).
> Principle: keep the minimalism — cut the *vague*, never the *load-bearing*. Every addition below earns its place by being concrete and non-redundant.

---

## 1. README analysis

**Verdict:** the README is strong and genuinely minimal — but it buries its lead and undersells its single biggest differentiator. The most-read real estate (first screen) currently does the least selling.

### Keep (these are assets — do not touch)
- The **categorized, source-cited space list.** This *is* the proof of "complete," and the citations are credibility most libraries can't match. It's the best thing on the page.
- The **"Conventional Ranges" design section** + comparison table — a real, well-argued differentiator.
- The **declined-spaces list** (NCS, Pantone, RAL Classic…) — rare honesty that builds trust and pre-empts "why no Pantone?"
- **Badges, logo, terse tone.** Minimalism is a feature; the fixes below preserve it.

### Fix (load-bearing gaps, ordered by impact)

1. **The hero doesn't sell, and the count is stale (correctness + marketing).**
   "Open collection of color spaces" is a Level-1 plain claim in a Level-3 market (see [audience.md](audience.md)) — no number, no proof, undifferentiated. Worse: the README says **93** spaces and [library-comparison.md](../library-comparison.md) says **71**, but the library registers **131** at runtime. *We are underselling the moat by 30–50 spaces.* Fix the number everywhere and put it in the first line. (Ogilvy: 5× more people read the headline than the body — a flat first line wastes 80% of the attention.)

2. **No install line up top.** `npm install color-space` is missing from the first screen. Pure friction (REDUCE: remove it).

3. **The proof is buried in a table cell.** "Differential vs colorjs.io" is the trust moat for a skeptical dev audience (Bencivenga: proof before promises). Surface it in the first screen with the specific tolerance (1/255) and the remarkable, shareable fact: *it has corrected errors in published papers.* That's high social currency (Berger).

4. **The "secret" is at line 205.** The Motivation section ("complete, verified, corrects papers, educates") is the actual soul of the project — distill one line of it into the hero.

5. **The first code example undersells.** `lab → lchab` is something every library does. Lead with an example that shows the moat: a CSS-native conversion that reads like CSS, plus a conversion *no other JS library has* (camera log or appearance model).

6. **Make "what it's NOT" explicit and proud.** The no-parse/no-interpolate/no-ΔE fact only appears in the alpha/gamut note. State it near the top so toolkit-seekers self-select out instead of bouncing — framed as deliberate kernel design, not a gap.

7. **~~Correctness flag on "Matches CSS exactly."~~ ✅ RESOLVED.** OKLab/OKLCh/OKLrab/OKLrch were normalized from the non-conventional ×100 scale (L 0–100, C 0–40) to the universal **L 0–1, a/b ±0.4, C 0–0.4** (CSS Color 4 / Ottosson / culori / colorjs.io). `oklch.rgb(0.65, 0.25, 180)` now maps 1:1 to CSS `oklch(0.65 0.25 180)`, so "matches CSS exactly" is now literally true. Verified at 0.000 error against colorjs.io in the differential suite.

### Proposed hero (minimal, load-bearing, drop-in)

```md
# color-space  [badges]

<logo>

**Every color space. One tiny API. Verified.**

**131 color spaces** — 3–5× any other JS library — with values that match CSS,
formulas differentially tested against colorjs.io, zero dependencies, public domain.

```sh
npm install color-space
```

```js
import space from 'color-space'

space.rgb.hsl(255, 128, 0)    // → [30, 100, 50]   — reads straight as CSS hsl(30 100% 50%)
space.slog3.rec2020(r, g, b)  // Sony camera log → broadcast — a conversion no other JS lib has
```

> A pure conversion *kernel*: no parsing, interpolation, ΔE, or gamut-mapping — that's the
> application layer (pair with culori/chroma). This keeps it tiny and tree-shakeable.
```

*(All example outputs above are runtime-verified. Everything below the hero — Usage, API, the cited space list, design rationale, comparison — stays as is, with the count corrected to 131.)*

---

## 2. npm `description` + keywords

The npm description is a headline: it appears in search results and at the top of the package page. Current — "Open collection of color spaces" — is three flat words with no number, no differentiator. npm truncates around ~120 chars; front-load the payload.

**Recommended:**
> `Every color space, one API — 131 of them, in CSS-native ranges, formulas verified against the CSS spec. Zero deps, public domain.`

**Alternates (test):**
- `The most complete color-space conversion library — 131 spaces, CSS-native ranges, differentially verified, zero dependencies.`
- `131 color-space conversions in one tiny, verified, tree-shakeable package — values that match CSS.`

**Keywords** (current list misses the high-intent long-tail that wins npm search). Add:
```json
"oklch", "oklab", "p3", "rec2020", "aces", "cam16", "ciecam02", "munsell",
"slog3", "hdr", "css-color", "color-conversion", "color-science",
"perceptual", "wide-gamut", "chromatic-adaptation"
```
Keep the existing generic ones (color, rgb, hsl, lab, xyz, cmyk…). The long-tail terms are where intent-driven searchers (film, science, OKLCH adopters) actually land.

---

## 3. Landing page — from "tests" to a trust-and-engagement machine

**Current state:** `docs/index.html` is a bare live converter titled *"Color-space tests"* — no positioning, no proof, no install, no CTA. But it contains the project's single best marketing asset: **the live converter.** That's "prove with nectar" — show the working thing, don't pitch it.

**Strategy:** make the converter the hero *interaction*, wrap it in proof and a clear next step, and make the whole page genuinely useful as a **color-space explorer/reference** — because a useful page earns links and shares (STEPPS: practical value + social currency) far better than a brochure.

### Wireframe (top → bottom)

1. **Hero** — `Every color space. One tiny API. Verified.` + subhead (131 · CSS-native · differential-tested) + `npm install color-space` (one-click copy) + buttons: **Browse all 131** · **GitHub** (star).
2. **The converter, elevated** — type any color, watch it propagate **live across all 131 spaces**. Improvements that turn a test page into the magic:
   - **Search/filter** the space list (131 is a lot — let people jump to "oklch", "slog3", "munsell").
   - A **live swatch** that updates as you type (it already tints the title — make it a real, prominent swatch).
   - **"Copy as CSS"** per space where a CSS form exists (`oklch(…)`, `lab(…)`, `color(display-p3 …)`).
   - Channel **ranges shown inline** (already in the `title` attr — surface it visibly).
   - A few **preset colors** (brand orange, a skin tone, a spectral cyan) so a first visitor sees motion immediately.
3. **Trust band** — four concrete proofs, side by side: *131 spaces* · *verified vs colorjs.io at 1/255* · *zero dependencies* · *public domain*. (Concentrated, not dripped — REDUCE: corroborating evidence in one window.)
4. **Comparison strip** — `131` vs culori/colorjs.io/chroma-js/texel, from [library-comparison.md](../library-comparison.md). The number does the arguing.
5. **"Has the space you need"** — the categorized list with **swatches**, grouped (Display/Web · Perceptual · HDR · Film & camera logs · Video/broadcast · Appearance · Print/physical · Research). This doubles as the SEO/reference surface that earns backlinks.
6. **Who it's for** — the segment one-liners from [audience.md](audience.md) (film, science, CSS/design systems, viz, creative coding).
7. **Quickstart** — install + the two-line example + "pair with culori/chroma for the toolkit layer."
8. **Footer CTA** — npm · GitHub star · the ॐ license link.

### Trust + engagement specifics
- **Social/OG meta** (currently absent): `og:title`, `og:description`, `og:image` (use the logo on a swatch field), `twitter:card=summary_large_image`. Right now a shared link unfurls as nothing. This is the cheapest, highest-leverage fix for every share.
- **Rename the page** from "Color-space tests" to the product + tagline.
- **Engagement = the converter.** It's interactive, surprising ("it has *that*?"), and useful — the three things that make people stay and share. Lead with it; don't make people scroll to it.
- **Honesty guardrail** (the Sugarman cautionary tale): the verification claim is real and is the moat — state it precisely (which spaces, which tolerance, which reference), never round it up. Substance first.

### Build note
Keep it a single static `index.html` (no framework) — consistent with the project's minimalism and zero-dep ethos. The converter already works from `dist/`; this is additive markup + styling + meta, not a rewrite.

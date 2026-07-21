# Market data — JS color libraries

> Cited competitive data, kept separate so the strategy docs stay evergreen. All figures observed **2026-07-21** (previous stamp 2026-06-30); sources inline. Re-verify before quoting in public copy.

---

## The headline insight: used, but invisible

color-space gets **~4.0M monthly downloads (935k/week)** — real, culori-tier usage — yet has **357 GitHub stars** vs culori's 1,211 and chroma-js's 10,574. The usage is largely transitive (45 npm dependents, the colorjs-org packages): people use it without knowing, starring, or talking about it.

**This changes the marketing job.** The problem is not "get users" — it's **convert existing, invisible usage into visibility, stars, direct adoption, and word-of-mouth.** Hence the emphasis in [distribution.md](distribution.md) on social surfaces, the launch, and shareable proof — not on "awareness from zero."

⚠️ **Correction (2026-07-21):** the earlier "culori stalled ~9 months" opening is **gone** — culori pushed 2026-07-02 and is active again. Do not use the momentum-gap argument anywhere. The durable differentiators are breadth (162 vs ~35–40), conventional ranges, and verification — not a competitor's absence.

---

## Monthly npm downloads (2026-06-20 → 07-19/20)

Source: `api.npmjs.org/downloads/point/last-month/<pkg>`.

| Package | Monthly DLs | Real signal? |
|---|---:|---|
| color-convert | 1,277M | ❌ transitive via chalk → ansi-styles; not color work |
| d3-color | 271M | ◐ d3 ecosystem sub-module |
| color | 196M | ✓ general manipulation |
| colord | 75M | ✓ tiny; CSS tooling (cssnano, PixiJS) |
| tinycolor2 | 53M | ◐ legacy; no modern spaces |
| colorjs.io | 25.8M | ✓ high — Sass depends on it |
| @ctrl/tinycolor | 16.2M | ✓ TS port of tinycolor2 |
| chroma-js | 10.8M | ✓ data viz / palettes |
| **culori** | **5.7M** | ✓ CSS Color 4 toolkit |
| **color-space** | **4.0M** | ✓ scientific/niche conversion (935k/wk) |

---

## GitHub stars / activity

Source: GitHub GraphQL, 2026-07-21.

| Repo | Stars | Last push | State |
|---|---:|---|---|
| gka/chroma.js | 10,574 | 2026-06-01 | active — **most starred** |
| color-js/color.js (colorjs.io) | 2,266 | 2026-07-20 | very active |
| omgovich/colord | 1,877 | 2026-05-23 | active |
| Evercoder/culori | 1,211 | 2026-07-02 | **active again** (do not quote the old stall) |
| texel-org/color | 526 | 2026-06-01 | active |
| **colorjs/color-space** | **357** | 2026-07-21 | active — v3.0.0 shipped 2026-07 |

**Stars-per-download still tells the story:** chroma ~4.2 stars per 1k weekly DLs; culori ~0.9; color-space ~0.38. Culori-tier usage, a third of the recognition.

---

## Bundle size (minzipped)

npm now serves **v3.0.0**, so v3 numbers are quotable directly:

| Package | Version | Minzipped | Note |
|---|---|---:|---|
| colord | 2.9.3 | ~2.1 kB | core only; Lab/LCH/etc. via plugins |
| color-convert | 3.1.3 | 5.6 kB | few spaces |
| **color-space** (one space) | **3.0.0** | **0.4–1.5 kB** | tree-shaken `color-space/<name>.js` — **this is the number to quote** |
| **color-space** (lite) | 3.0.0 | 9 kB | 27-space working set |
| chroma-js | 3.2.0 | 16.2 kB | |
| culori | 4.0.2 | 22.2 kB | tree-shakeable — subset much smaller |
| colorjs.io | 0.6.1 | 25.4 kB | tree-shakeable — subset much smaller |
| **color-space** (all 162) | 3.0.0 | 55 kB | the full graph — nobody imports this; never call it "tiny" |

Competitor sizes from bundlephobia 2026-06 (see docs/library-comparison.md). **Compare like for like:** our per-space import vs their tree-shaken subset, or full vs full — never our subset vs their full bundle.

---

## Competitor positioning (exact taglines)

- **culori** — *"A comprehensive color library for JavaScript."* Emphasis: full CSS Color 4, tree-shakeable, ΔE, interpolation, gamut mapping.
- **colorjs.io** — *"Let's get serious about color"* · *"by the editors of the CSS Color specifications."* Emphasis: spec authority, wide-gamut, ΔE, adaptation.
- **chroma-js** — *"a small-ish zero-dependency JavaScript library for all kinds of color conversions and color scales."* Emphasis: scales/ColorBrewer (data viz).
- **colord** — *"A tiny yet powerful tool for high-performance color manipulations and conversions."* Emphasis: 2 kB, speed, TS, plugins.
- **@texel/color** — minimal fast wide-gamut conversions, GPU-adjacent.

**What none of them claim, and color-space now owns with proof:** the *number* (162), *breadth into film/broadcast/appearance/historical/Munsell*, *conventional (CSS-matching) ranges*, *per-space cited conformance anchors*, differential testing vs colorjs.io, **camera logs verified against the Academy's official ACES vendor transforms** (docs/lut-verification.md), and non-JS backends (WASM · GLSL/WGSL · .cube LUT · ICC · MCP). The lane is open.

---

## Funding reality (researched 2026-07-21)

Sponsorship money does not follow downloads in this category:

| Author | Library | Monthly DLs | GitHub sponsors |
|---|---|---:|---|
| Lea Verou (W3C CSS WG) | colorjs.io | 25.8M | **1** |
| gka | chroma-js | 10.8M | no listing |
| danburzo | culori | 5.7M | no listing |
| dy | color-space | 4.0M | 0 (listing live) |

- Individual sponsorship follows *audience* (Sindre Sorhus, Anthony Fu — content presence), corporate follows *fear* (security-critical deps). Neither applies here; expect a tip jar, not income.
- **Wiring done 2026-07-21:** `.github/FUNDING.yml` (Sponsor button live), thanks.dev account created. Dependency-graph funds pay small but automatically: Sentry's OSS Pledge distributed $260k/yr; Frontend Masters $50k across 350+ projects (~$140/project/yr avg); Tidelift live. Realistic: tens of $/mo.
- The one door to real money: the colorist market via LUT traffic → named film-tech sponsorship (Colourlab, FilmLight, Frame.io) **after** 3–6 months of demonstrable traffic. See distribution.md.

---

## Verified users (for "trusted by" proof)

- **colorjs.io:** Sass, axe-core (Deque), Open Props. *(colorjs.io homepage)*
- **culori:** tailwindcss-intellisense (the VSCode extension). ⚠️ **"Tailwind v4 uses culori" is FALSE** — do not repeat it.
- **colord:** cssnano/postcss-colormin, PixiJS, Sentry.
- **color-space:** 45 npm dependents (npm search API, 2026-07-21); the colorjs-org packages build on it; niche/scientific use (Munsell naming, LMS vision modeling).

---

## Could-not-verify / corrections (do not publish unchecked)

- colord's self-claimed "1.7 kB" — measured ~2.1 kB ESM gz.
- colorjs.io homepage "229M downloads" — stale vs API cumulative; don't cite their homepage number.
- Competitor *space counts* are estimates from source (culori ~35, colorjs.io ~40, chroma ~15, @texel/color ~16). 162 vs those = **4×+ any other JS library**; recount before quoting an exact multiple.
- ~~culori stalled~~ — **corrected above**, active since 2026-07-02.
- ~~v3 per-space size unmeasurable~~ — resolved; v3.0.0 on npm, quote 0.4–1.5 kB per space.

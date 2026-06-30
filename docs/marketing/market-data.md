# Market data — JS color libraries

> Cited competitive data, kept separate so the strategy docs stay evergreen. All figures observed **2026-06-30**; sources inline. Re-verify before quoting in public copy.

---

## The headline insight: used, but invisible

color-space gets **~1.0M weekly downloads — the same tier as culori (1.3M)** — yet has **356 GitHub stars** vs culori's 1,204 and chroma-js's 10,572. It has real usage (largely transitive, via the colorjs-org packages and 46 npm dependents) but **little mindshare**: people use it without knowing, starring, or talking about it.

**This changes the marketing job.** The problem is not "get users" — it's **convert existing, invisible usage into visibility, stars, direct adoption, and word-of-mouth.** Hence the emphasis in [distribution.md](distribution.md) on social surfaces (OG images, GitHub topics), the launch, and shareable proof — not on "awareness from zero."

A second opening: **culori has not committed in ~9 months** (last push 2025-09-10) while colorjs.io and color-space are actively developed. The "comprehensive CSS color" lane has a momentum gap.

---

## Weekly npm downloads (week of 2026-06-22 → 06-28)

Source: `api.npmjs.org/downloads/point/last-week/<pkg>`; color-space & culori cross-verified via npm-stat.com.

| Package | Weekly DLs | Real signal? |
|---|---:|---|
| color-convert | 321.7M | ❌ transitive via chalk → ansi-styles; not color work |
| d3-color | 67.6M | ◐ d3 ecosystem sub-module |
| color | 46.6M | ✓ general manipulation |
| colord | 18.1M | ✓ tiny; CSS tooling (cssnano, PixiJS) |
| tinycolor2 | 12.9M | ◐ legacy; no modern spaces |
| colorjs.io | 6.2M | ✓ high — Sass depends on it |
| @ctrl/tinycolor | 3.7M | ✓ TS port of tinycolor2 |
| chroma-js | 2.7M | ✓ data viz / palettes |
| **culori** | **1.3M** | ✓ CSS Color 4 toolkit |
| **color-space** | **1.0M** | ✓ scientific/niche conversion |

---

## GitHub stars / activity

Source: GitHub REST API, 2026-06-30.

| Repo | Stars | Last push | State |
|---|---:|---|---|
| gka/chroma.js | 10,572 | 2026-06-01 | active — **most starred** |
| color-js/color.js (colorjs.io) | 2,259 | 2026-06-29 | very active |
| omgovich/colord | 1,874 | 2026-05-23 | active |
| Evercoder/culori | 1,204 | 2025-09-10 | **quiet (~9 mo)** |
| d3/d3-color | 428 | 2024-02-03 | dormant (understated — bundled in d3) |
| **colorjs/color-space** | **356** | 2026-06-30 | active |

**Stars-per-download tells the story:** chroma-js ~4 stars per 1k weekly DLs; culori ~0.9; color-space ~0.36. Same usage as culori, a third of the recognition.

---

## Bundle size (minzipped)

Source: bundlephobia, 2026-06-30 (colord measured from tarball — bundlephobia API defective for it).

| Package | Version | Minzipped | Note |
|---|---|---:|---|
| colord | 2.9.3 | ~2.1 kB | core only; Lab/LCH/etc. via plugins |
| tinycolor2 | 1.6.0 | 5.4 kB | few spaces |
| color-convert | 3.1.3 | 5.6 kB | few spaces |
| color | 5.0.3 | 8.4 kB | |
| **color-space** | **2.3.2** | **10.3 kB** | ⚠️ *all ~50 v2 spaces bundled* |
| chroma-js | 3.2.0 | 16.2 kB | |
| culori | 4.0.2 | 22.2 kB | tree-shakeable — subset much smaller |
| colorjs.io | 0.6.1 | 25.4 kB | tree-shakeable — subset much smaller |

**Size caveats (important for honest copy):**
- **npm still serves color-space v2.3.2** (10.3 kB, ~50 spaces). v3 (this branch) adds a per-file `exports` map → **per-space imports become far smaller**.
- The **local v3 dist of *all 131 spaces* is ~44 kB min+gz** (44,572 bytes; ~2.6× v2 because v3 has ~2.6× the spaces — so the *full* bundle is actually larger than culori/colorjs.io, but nobody imports all 131). **Quote the tree-shaken per-space size (~2 kB), not the full bundle.** Measure and publish real per-space numbers once v3 ships to npm.
- culori and colorjs.io are also tree-shakeable — don't compare our per-space import against their *full* bundle; that's apples-to-oranges. Compare like for like.

---

## Competitor positioning (exact taglines)

- **culori** — *"A comprehensive color library for JavaScript."* / homepage: *"Color functions for JavaScript."* Emphasis: full CSS Color 4, tree-shakeable, ΔE (CIEDE2000), interpolation, gamut mapping.
- **colorjs.io** — *"Let's get serious about color"* · *"by the editors of the CSS Color specifications."* Emphasis: spec authority (Lea Verou, Chris Lilley), wide-gamut, every CSS format, ΔE, gamut mapping, chromatic adaptation.
- **chroma-js** — *"a small-ish zero-dependency JavaScript library for all kinds of color conversions and color scales."* Emphasis: zero deps, size, **color scales / ColorBrewer** (data viz).
- **colord** — *"A tiny yet powerful tool for high-performance color manipulations and conversions."* Emphasis: **2.1 kB**, speed, TS, plugins.
- **color-convert** — *"Plain color conversion functions in JavaScript."* Low-level CLI/ANSI utility.
- **tinycolor2** — *"a small, fast library for color manipulation and conversion."* RGB/HSL/HSV/Hex only; legacy.

**What none of them claim, and color-space can own:** a *number* (space count), *breadth into film/broadcast/appearance/historical/Munsell*, *CSS-native ranges*, and *differential verification against the spec reference*. The lane is open.

---

## Verified users (for "trusted by" proof)

- **colorjs.io:** Sass, axe-core (Deque), Open Props (Adam Argyle). *(colorjs.io homepage)*
- **culori:** tailwindcss-intellisense (the VSCode extension). ⚠️ **"Tailwind v4 uses culori" is FALSE** — framework has no color deps; the claim conflates the extension with the framework. Do not repeat it.
- **chroma-js:** ~1,827 dependents, diffuse across data viz; no single landmark verified.
- **colord:** cssnano/postcss-colormin (the dominant CSS minifier), PixiJS (`@pixi/colord`), Sentry.
- **color-space:** 46 npm dependents / 70 on Libraries.io; the colorjs-org packages (color-parse, color-name) build on it. Niche/scientific use (Munsell naming, LMS vision modeling).

---

## Could-not-verify / corrections (do not publish unchecked)

- colord's self-claimed "1.7 kB" — measured ~2.1 kB ESM gz; older version or different method.
- colorjs.io homepage "229M downloads" — API cumulative ~242M; homepage figure stale.
- color-space v3 per-space bundle size — **not yet measurable on npm** (v3 unpublished). Measure post-release.
- competitor *space counts* are best estimates from source (culori ~25–35, colorjs.io ~40, chroma ~15, @texel/color ~16); they shift as libs add spaces. The "3–5×" claim (131 vs 25–40) holds across that range, but recount before quoting an exact multiple.

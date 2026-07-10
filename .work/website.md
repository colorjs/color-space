## Insights

## What is your favorite color?
  * What would be the scenario?
  * AI: enter a color, get its passport — citizen here, exile there, spelled 151 ways. A color's biography.

## NPM-like
* Search a color, get many spaces for that (like packages)

## Google-like
* Enter a color, get filtered results

## GPT-like
* Enter information with a color

## Encyclopedia of color spaces, the book
*

## Marketing
* Bench vs competitors

## Beauty
* Devs screebshot beauty.
* Beautiful work becomes authoritative.
* Beauty is the distribution.

## Story
* Someone catalogued every color language humans ever invented and verified each one against the source" — you can't retell that without the thing. That's a myth that travels. "A fast color library"
* **Image and story**, fused

## Trust
  * verified against the source, the reference you can rely on

## Remarkability
* The "pour one color through 151 tongues, watch it go into exile" demo is not a feature — it's five spread-levers firing at once: social currency (sharing it makes you look like someone who found something wild), awe (high-arousal emotion, the only kind that spreads), public (it's screenshottable), practical value (it's genuinely a reference), and story

## Color space dossier/card

* When created (year)
* Who created (man, company)
* Why created, what's the idea, how created (desc)
* Usage
  * which domains
  * popularity
  * nowadays
  * Historical?
* Prominent applications
* What it does the best way
* Reference
* The shape of gamut
  * 3d, 2d on the xy plot
* Compare to other spaces
  * How does it interpolate

* How to use: JS, WASM, SHADER

* Gamut image
  * 2D, 3D
  * https://en.wikipedia.org/wiki/Gamut


* Family tree. We literally have the conversion graph. "descends: okhsl → oklab → lrgb → xyz" as clickable crumbs, plus "children: …" (spaces whose path passes through this one). Turns 151 flat pages into a browsable genealogy — the biggest navigational unlock, zero new data.
* Blend duel. The interpolate row exists, but its value appears only in contrast: same two endpoints blended in this space vs oklab vs lrgb, three strips stacked. Instantly shows the space's character (lab bending blue, hsl's gray trench). This is the demo Wikipedia can't have.
* Equal-step honesty strip. Walk N equal-distance steps in this space, render the swatches. In a uniform space the steps look even; in ycbcr they visibly aren't. One strip = the whole "perceptually uniform?" claim, testable by eye.
Compute once at build time

* Reach. "Covers 34% of visible colors · 1.0× sRGB" — computed by sampling, stated per space. The convention is share of CIELAB volume (that's how the published ProPhoto ≈90% / sRGB ≈35% figures are defined — citable and checkable against them). Pairs perfectly with the veil you just got: the picture and the number.
Curation — this is the Wikipedia-grade layer we're missing

* Born line. 1976 · CIE · to make color difference measurable — year, author/body, the one-line problem it was born to solve. Structured meta fields (year, by, origin), not prose. This is the single densest fact row, it's what your website.md outline circles around, and it later gives you a free timeline of color science across the catalog. Cost: 151 rows of real research with sources — but the descriptions already carry half of it informally; this formalizes it.
* Known sin. One line per space: "HSL's L=50 yellow and L=50 blue differ 4× in luminance", "Lab shifts blue hue toward purple in blends", "HWB collapses when W+B>100". Expert judgment is the most entertaining content per word, and it's exactly what Wikipedia buries in "Criticism" sections.
* Meet it in. Upgrade "used for" from categories to named standards: ycbcr → JPEG · MPEG · 4:2:0 subsampling; oklch → CSS Color 4; acescg → ACES render working space. Concrete nouns people recognize.
* Name decode. Why "Jzazbz" reads the way it does, what the primes in Y′CbCr mean, why L* has a star. Two lines of etymology, disproportionate delight.

## One move
> the definitive, beautiful home of every color language — an encyclopedia you can't stop touching. Own the meaning of color spaces, not the feature count. The competitive claim ("every space, verified") lives in one honest line near the install command for the people comparing libraries — and then you never mention competitors again

## From landing-alt (retired 2026-07)
Salvage list from the alt landing experiment (Hallmark almanac/editorial theme) — the ideas, not the markup:

* **Field-guide framing** — "color-space *field guide*" wordmark; hero = one huge tabular number + unit ("156 registered spaces") with count-up animation; stat-led macrostructure.
* **Copy lines that earned their place**: "One color, described every way we know." · "Pour one color through the atlas." · "The families are part of the map." · "What 'complete' and 'verified' mean here." · "The claim is useful only with its limits attached." · "Use the space you need."
* **Specimen flow** — one 2D OKLCH hue×lightness canvas field (drag + arrow keys, real `role=slider` with `aria-valuetext`), CSS-string entry, native picker chip; everything below reads *the same stimulus*.
* **Curated translation sheet** — show *six useful coordinates* for the current color (not all 156), with "N shown · browse all 156 ↗". Curation as the default view; the atlas as the deep end.
* **Taxonomy as control** — family chips don't just filter a list, they *swap which conversions the live specimen shows*. The map edits the instrument.
* **Dossier follows selection** — clicking a conversion row loads that space's dossier in place (class line · name · description · facts `<dl>`).
* **Evidence spec-sheet** — a five-row limits table: Coverage (156) · Routes (**24,180 ordered pairs** — a concrete, computable stat) · Verification (1/255 differential) · Package (0 deps) · Scope (conversion kernel, application layer excluded). Honest-limits framing beats feature lists.
* **Runtime workbench** — one tabbed code panel (JS/WASM/Shaders/LUT) + a single copy button, instead of four scattered snippets.
* **Noscript honesty** — "The live specimen needs JavaScript. The full atlas remains readable without it."
* **Type palette** (if the editorial direction returns): Hanken Grotesk (UI) + IBM Plex Mono (numbers/code) + Newsreader (serif accents); slate-250 anchor hue; sticky section heads with heading + one-line standfirst.

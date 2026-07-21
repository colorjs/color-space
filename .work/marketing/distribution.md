# Distribution — one calendar, two tracks

> Right crowd × right channels × built-in spreadability. Derived from [audience.md](audience.md) and [positioning.md](positioning.md); drafts in [launch/](launch/).
> Open-source library, not a paid product: the channels are discoverability, community, word-of-mouth. No ads, no funnel. The currency is *trust and usefulness*.
> Refreshed 2026-07-21 — merges the original v3 launch plan with the colorist strategy into one sequence.

---

## The starving crowds (where they already gather)

1. **Filmmakers & colorists** — shot log footage, need it normalized *now*: LiftGammaGain, r/davinciresolve, r/SonyAlpha, r/dji, iPhone-filmmaking spaces, ACEScentral. They search exact strings ("slog3 to rec709 lut free", "apple log lut"). *Near-zero competition; the atlas hands them the artifact directly — no npm required.*
2. **OKLCH/P3 adopters** — the CSS color community; OKLCH adoption is the live trend. Large, contested, Solution-Aware.
3. **Color science / academia** — citation-driven; arrive via search ("CAM16 javascript", "Munsell renotation js") and the cited README/dossiers.
4. **Data-viz & creative coding** — Observable, d3, three.js, p5 orbits.

---

## Track 0 — surfaces (prep; do before any post)

| Surface | Status |
|---|---|
| GitHub About + topics | ✅ 2026-07-21 — *"Every color space, one API — 162 of them, conventional ranges, independently verified"*; 14 topics |
| README hero / npm description + keywords | ✅ shipped with v3 (see [surfaces.md](surfaces.md) STATUS) |
| Atlas (162 dossiers, converter, LUT/ICC downloads) | ✅ live at color-space.io |
| ACES vendor verification (the proof asset) | ✅ docs/lut-verification.md; linked from both LUT ledes and `.cube` headers |
| FUNDING.yml + thanks.dev | ✅ wired |
| **OG/social preview image** | ⏳ in progress (`generate-og.js`) — **the only remaining blocker**; every link unfurls blank until it lands |

---

## Track 1 — web (fire first: "v3.0.0 just shipped" is a decaying news hook)

*Audience: Solution/Product-Aware devs. Lead with the number + verification; the converter is the share object. Link the atlas, not the repo.*

- **Day 0 — Show HN** ([launch/show-hn.md](launch/show-hn.md)). HN rewards substance + the "what it isn't" honesty. Answer comments all day; the thread is the asset.
- **Day 2–4 — lobste.rs** (`javascript`, `web`), then **r/javascript** (OKLCH/CSS-native angle) and **r/webdev** ([launch/reddit.md](launch/reddit.md)). Different lead per venue, same product.
- **Ongoing** — front-end newsletters (Frontend Focus, CSS Weekly) get a one-line pitch + atlas link only *after* the HN thread exists to cite.

## Track 2 — film (the moat; start ~1 week after HN, runs indefinitely)

*Audience: Problem-Aware, non-JS. Lead with their camera's pain and the free verified artifact; the library is a footnote.*

- **Week 1 — the scrutiny post on LiftGammaGain** ([launch/lgg-scrutiny.md](launch/lgg-scrutiny.md)): ask, don't pitch — *"free in-browser conversion LUTs for every camera log, differential-tested against the Academy's official ACES transforms; here are the deltas — where is it wrong?"* Inviting refutation disarms reactance; if the thread survives, it's the citable endorsement for everything downstream.
- **Weeks 2+ — one community per week**, each led by that camera's pain: r/davinciresolve → r/SonyAlpha (S-Log3/S-Gamut3.Cine) → iPhone filmmaking (Apple Log — hottest trigger) → r/dji (D-Log) → r/videography. ACES coverage separately to ACEScentral. Never two in one week; answer every comment; each question answered = a dossier improvement.
- **Always — the camera-launch trigger**: new log format announced → support it within days → short post. Every release re-fires the exact-string search demand (the Kit Kat coffee-break mechanic).

## Track 3 — money (runs behind track 2; expectations in [market-data.md](market-data.md))

- The **gratitude moment**: after the LUT download completes — the one point where a human consciously receives value — one quiet line: *"Free and verified. If it saved your grade — sponsor the atlas."* (Footer "Support" link exists; the download-moment line is the only remaining placement. Owner's call on tone.)
- **After 3–6 months of traffic**: take the numbers to film-tech companies (Colourlab, FilmLight, Frame.io/Adobe) for a named sponsorship. Corporations sponsor audiences, not code. Dependency funds (thanks.dev, OSS Pledge, Tidelift) trickle automatically meanwhile.

---

## Dream 100 (merged — audiences already holding our buyers; give first, don't extract)

**Web/CSS circle:** Lea Verou & the colorjs.io/W3C CSS Color orbit · Björn Ottosson (OKLab) · Dan Burzo (culori — the earlier doc's "Andreas Larsen" was a misattribution) · Adam Argyle · front-end newsletters. The honest opener: color-space sits *under* toolkits as a conversion substrate — a real reason for maintainers to care, not competition.

**Color science circle:** the `colour-science` (Python) community · RIT MCSL · color educators. Opener: the verification methodology + paper corrections — citation material.

**Colorist/filmmaker circle:** Cullen Kelly · Darren Mostyn · Waqas Qazi · Color Grading Central · Gerald Undone (measures things — the deltas table is his native language) · per-camera YouTubers whose comments beg for free conversion LUTs weekly. The outreach is a gift: *"your audience asks for S-Log3 LUTs constantly — here's a verified free one you can hand them, deltas vs Sony's official attached."* Follow up — most replies come at touch 3+.

**Film-industry orbit (long game):** ACEScentral regulars · ASWF/OpenColorIO community — visibility here is what makes the track-3 corporate door plausible.

---

## Make it spread (STEPPS, strongest first)

- **Practical value:** the converter, the cited dossiers, and above all the **free verified LUT** — people share tools that save colleagues time. The `.cube` file itself carries provenance in its header — every shared file is a link back (behavioral residue).
- **Social currency:** the shareable facts — *"162 color spaces"* · *"corrects errors in published papers"* · *"camera-log LUTs verified against the Academy's official transforms, deltas published"* · *"it has Munsell, bidirectionally."*
- **Triggers:** every OKLCH/P3 blog post; every "convert X to Y" question; **every camera launch**.
- **Public:** OG image (in progress) → every link unfurls; "Made with color-space" in dependent tools.
- **Stories:** the origin — built the complete verified collection, found the papers disagreed. Brand is load-bearing in the retelling.

---

## Content (give until they ask; low-volume, evergreen)

- **"One space explained"** series — one exotic space per post (CAM16, Munsell, S-Log3, Coloroid), ending at its dossier. Permanent SEO + Dream-100 conversation starters.
- **The verification write-up** — the differential methodology + ACES vendor comparison + paper corrections. Citation bait for the science crowd; docs/lut-verification.md and docs/formula-verification.md are the raw material.
- **The dossiers are the content engine**: 162 pages, each targeting its space's exact-string searches. Improve whichever page each week's community asked questions about.

CTA on every piece: soft — the atlas link. No hard pitch.

---

## Don'ts

No email gates (kills spread and reputation in one move) · no posting before the OG image lands · no creative "look" packs (different product, off-scope) · no simultaneous multi-channel blasts (one HN day, one film community per week) · no quoting a stat without re-verifying it that day.

## Honesty guardrail (non-negotiable)

The verification claim is the entire moat. State it *precisely*: which layer (per-space cited anchors / 29 vs colorjs.io both directions at 1/255 / camera logs vs the Academy's official ACES vendor transforms with published deltas), never rounded up to "100% verified." "162" is a runtime-verified count of separately-importable, individually-anchored transforms. The LUTs are **colorimetric conversions, not looks** — say so before anyone asks (docs/lut-verification.md has the exact framing). One faked or inflated proof point costs more than the whole launch earns. *Truthful, attractive, then famous — in that causal order.*

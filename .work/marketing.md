# color-space — marketing

> Single source of truth. Stamped **2026-07-21** — re-verify any number the day it's quoted publicly.

## Data

**Reach** (npm month 06-20→07-19 · GitHub 07-21): color-space **4.0M DLs · 357★** — culori 5.7M · 1,211★ — colorjs.io 25.8M · 2,266★ — chroma-js 10.8M · 10,574★. Culori-tier usage, ⅓ the recognition, mostly transitive (45 dependents). **The job: convert invisible usage into visibility — not awareness from zero.**

**Quotable claims** (each with its proof; never round up):
- **162 spaces, 4× any JS library** (culori ~35, colorjs.io ~40, texel ~16) — runtime count, cited list in README.
- **Verified, three layers**: every space pinned to an independent cited anchor (135 points, `test/refs.js`) · 29 spaces both directions vs colorjs.io at 1/255 · **camera logs vs the Academy's official ACES vendor transforms** — deltas ≤0.5% (CAT02 pairs, fully attributed to adaptation convention) / 0.03% (Bradford pairs) — [docs/formula-verification.md](../docs/formula-verification.md#camera-log-verification-against-official-aces-transforms), reruns on `npm test`.
- **Fast**: 29.3M scalar calls/s geomean vs culori 16.5, colorjs.io 0.7 (`npm run benchmark`, method footnoted in README).
- **Small**: one space 0.4–1.5 kB; lite 9 kB; full graph 55 kB gz (never call the full bundle "tiny").
- **Beyond JS**: WASM batch · GLSL/WGSL · in-browser `.cube` LUTs with self-verifying headers · ICC · MCP (`color-space-mcp` — no other color lib has one). CC0.

**Audience wedges** (desire: *"convert THIS to THAT, correctly, without re-deriving the math"*): ① film/colorists — the moat, near-zero competition, reached via free LUTs not npm; ② CSS/OKLCH adopters — the volume, contested; ③ color science — the credibility, citations. Objection answers live inside the drafts below.

**Funding reality**: sponsorship ≈ 0 across this whole category (Lea Verou: 1 sponsor at 25.8M DLs/mo). Wired: FUNDING.yml, thanks.dev. Expect tens of $/mo from dependency funds (OSS Pledge, Tidelift). The only real-money door: film-tech named sponsorship (Colourlab, FilmLight, Frame.io) **after** 3–6 months of demonstrable LUT traffic.

**Standing corrections**: culori is active again (never use the old "stalled" line) · "Tailwind v4 uses culori" is false · npm registry text updates on next publish.

## Stance

- **Owned surfaces stay understated** (owner's decision 2026-07-21): hero and npm description say *"An open collection of color spaces"* — no counts, evergreen. The substance (162, verification, benchmark, comparison) sits one scroll below and in docs. **Number-led selling happens in posts, never on owned surfaces.** Don't re-add it.
- **Honesty guardrail**: state verification by its exact layer; LUTs are colorimetric conversions, *not looks* — say it before anyone asks; one inflated proof point costs more than the launch earns.

## Plan

Surfaces are done (atlas live at color-space.io, OG image wired, GitHub About/topics set, FUNDING wired). What remains is posting and repeating:

1. **This week — Show HN** (the "v3 just shipped" hook decays). Draft below; stay in the thread all day.
2. **Days 2–4** — lobste.rs (`javascript, web`), r/javascript (OKLCH angle), r/webdev (atlas-led). One venue per day.
2b. **Day 5–7 — Product Hunt**: launch the *atlas* as a free tool (not "a JS library") — tagline + maker comment below; launches at 12:01 AM PT, own the day, don't overlap HN.
2c. **Passive listings — the posting checklist** (once, evergreen · audited 2026-07-21). Text to reuse everywhere: name `color-space` · one-liner *"An interactive atlas of 162 color spaces — live conversion, provenance, LUT/ICC export. Open source, CC0."* · URL `https://color-space.io` · repo `github.com/colorjs/color-space`:

    - [x] awesome-javascript — PR open: github.com/sorrycc/awesome-javascript/pull/1123
    - [x] awesome-colour (colour-science) — already listed, nothing to do
    - [x] Best of JS — issue open: github.com/michaelrambeau/bestofjs/issues/1168 (their flow is an issue, not a PR — the project DB isn't in the repo)
    - [x] AlternativeTo — alternativeto.net → "Add an item"; then mark as alternative to chroma-js, culori, colorjs.io (that's where switchers search)
    - [x] JS.LibHunt — js.libhunt.com → "Suggest a project" / claim the auto-entry
    - [x] StackShare — stackshare.io → add tool page
    - [x] toools.design — toools.design → "Submit a resource", color category (design crowd, real traffic)
    - [x] devhunt.org — dev-tool launch board, GitHub login, low effort (optional, small)
    - [x] Uneed — uneed.best → submit (PH-lite; schedule a launch day, optional)
    - [ ] Peerlist Launchpad — peerlist.io/launchpad (optional, indie-dev crowd)
    - [ ] Verify the automatic pages look right (nothing to submit): bundlephobia.com/package/color-space · npmtrends.com/color-space-vs-culori-vs-colorjs.io (use as comparison link in posts) · snyk.io Advisor page

    **Skipped, with reasons**: awesome-nodejs / awesome-creative-coding / cg-vfx-pipeline / Awesome-Design-Tools (no fitting category — forced PRs get rejected and smell of spam) · Openbase (dead since 2023) · AI-tool directories (no qualified traffic, spam adjacency) · look-LUT communities like freshluts (creative-LUT culture; conversion LUTs would confuse — reach colorists via the film track instead).
2d. **SEO** (audit 2026-07-21 — foundation is solid: canonicals, prerendered dossier prose, per-page descriptions, sitemap+robots+llms.txt): ① **titles use raw ids** (`sgamut3cine color space — …`) — switch to display names ("S-Gamut3.Cine") from the description's "Name — " prefix in build-site.js; the title tag is the ranking+click surface, ×162 pages, non-visual change. ② camera-log pages never say "LUT" in title/description — add "conversion LUT" for LUTOK spaces (the "slog3 to rec709 lut" intent). ③ register Search Console + Bing Webmaster, submit sitemap — real query data then steers the weekly dossier work (plan §6). Minor/optional: sitemap `<lastmod>`, BreadcrumbList JSON-LD.
3. **Next week — LiftGammaGain scrutiny post** (draft below). If the thread survives, it's the citable proof for the whole film track.
4. **Then one film community per week**, led by that camera's pain, LGG thread cited: r/davinciresolve → r/SonyAlpha (both Sony gamuts) → iPhone-filmmaking (Apple Log, hottest trigger) → r/dji → r/videography (education-led) → ACEScentral (ACES story; bridge to ASWF orbit).
5. **Dream-100 gift outreach alongside** (no ask, 3+ touches): colorists — Cullen Kelly, Darren Mostyn, Waqas Qazi, Color Grading Central, Gerald Undone (deltas table is his language); CSS — Lea Verou orbit, Björn Ottosson, Dan Burzo; newsletters after HN exists to cite.
6. **Always**: new camera log announced → support within days → short post (the recurring trigger). Each community's questions → that week's dossier improvements. Log every post: venue, title, response; kill venues after two silent attempts.
7. **Donation**: optional one-line ask at the LUT download-complete moment (*"Free and verified. If it saved your grade — sponsor the atlas."* — tone is owner's call); at 3–6 months take traffic numbers to film-tech sponsors.

**Don'ts**: no email gates · no look/creative LUT packs · no two posts in one week per track · no stat quoted without same-day re-verification.

## Drafts

### [x] Tweet (v3 announce)

> color-space v3 — 162 color spaces, one small API, verified.
> OKLCH to Munsell to S-Log3, any to any. Or take a .cube LUT, ICC, GLSL, WASM.
> https://color-space.io

Alt, sparer:

> color-space v3 is out. 162 color spaces, one small API, verified.
> https://color-space.io

### Product Hunt (atlas-framed)

- **Name:** color-space · **Tagline:** `An interactive atlas of 162 color spaces` · **Topics:** design tools, developer tools, open source
- **Description:** Every color space — web, print, film, broadcast, vision, history. Live conversion, conventional ranges, provenance, cited references. Export any pair as a .cube LUT or ICC profile, in-browser. Free, public domain.
- **Maker comment:** one paragraph, README register: what it is, verification in one sentence, "not a toolkit" in one sentence, ask for feedback on spaces people actually use.

### Show HN (title ≤80 chars · URL `https://color-space.io/`)

    Show HN: Color-space v3 – 162 color spaces, one small JS API, verified

> 162 color spaces — web, print, film, broadcast, photo, art, human vision, science, history. Convert any space to any other with one small API, in the ranges each field actually uses: RGB 0–255, Lab 0–100, OKLCH as CSS writes it.
>
>     space.rgb.oklch(255, 128, 0)        // → [0.732, 0.186, 53] — modern CSS
>     space.slog3.rec2020(0.5, 0.5, 0.5)  // camera log → UHD wide gamut
>
> Every space carries an independent cited anchor (135 reference points). 29 are differential-tested against colorjs.io — the CSS Color editors' implementation — both directions at 1/255. Camera logs are tested against the Academy's official ACES vendor transforms, deltas published [1]. The process caught real errors, including in published papers.
>
> Not a toolkit: no parsing, interpolation, ΔE, gamut mapping — that layer belongs to culori/colorjs.io, and they can sit on top. One space imports at 0.4–1.5 kB; all 162 are 55 kB gz. The same formulas ship as WASM batch, composed GLSL/WGSL, ICC profiles, and browser-generated .cube LUTs whose headers state their own measured deviation.
>
> Maintained since 2014; v3 is a ground-up rework. Public domain (CC0).
>
> [1] https://github.com/colorjs/color-space/blob/master/docs/formula-verification.md#camera-log-verification-against-official-aces-transforms

Prepared answers: *why-not-culori* (for when they lack your space / conventional ranges / independent verification; kernel they can sit on) · *162 = padding?* (each separately importable, anchored; declined-list in README) · *bundle size* (quote per-space, concede full) · *0–1 is standard!* (conventional = what each field's own literature writes) · *CAT02 vs Bradford* (deltas quantify exactly that; doc has the table).

### LiftGammaGain scrutiny post (film track opener — ask, don't pitch)

    Free conversion LUTs for every camera log, tested against the official ACES transforms — where are they wrong?

> Author disclosure: I build the library behind this (color-space, CC0).
>
> Any camera log → any display, as a .cube generated in the browser. S-Log3 (S-Gamut3 or S-Gamut3.Cine), LogC3/4, V-Log, Log3G10, C-Log 1/2/3, F-Log/2, N-Log, Apple Log, D-Log, BMD Film Gen5, ACES → Rec.709, sRGB, P3, Rec.2020, PQ/HLG. 17³ / 33³ / 65³, or a 4096-point 1D when the pair is transfer-only. No email, no account.
>
> Conversions, not looks: no tone mapping, no rolloff — log → 709 clips above diffuse white by design. Not a replacement for LogC-to-video, s709, or V-709. For normalization, monitoring, QC, batch ffmpeg; grade on top.
>
> The seven pairs with official Academy CSC/IDT transforms are differential-tested against those CTLs (ampas/aces-dev v1.3): worst case ≤0.5% of the dominant component on Sony/ARRI/Canon — the CAT02 vs Bradford adaptation difference, 0.03% once the CAT matches — and 0.03% on Panasonic/RED. Per-pair table: [docs/formula-verification.md, ACES section]. Each .cube header carries its own measured lattice deviation.
>
> Two questions. Where is the math wrong? — the suite is public and reruns on `npm test`. And which missing pair would help your work?
>
> https://color-space.io — LUT export on every camera-log page.

Pre-post: rerun `npm test` same day · verify downloads in Safari/Firefox · have the CAT02 and Canon-×0.9 replies ready · disclose authorship line one · never argue — thank, verify, fix, report back.

### Reddit ladder (titles; body = the LGG skeleton compressed, conversion-not-look always, authorship disclosed, one per week)

- **r/javascript**: `color-space v3 — 162 color spaces, one small API, values that match CSS, verified` (code sample + kernel-not-toolkit + atlas link)
- **r/webdev**: `An atlas of 162 color spaces — live conversion, ranges, provenance, LUT/ICC export`
- **r/davinciresolve**: `Free conversion LUTs for every camera log, tested against the official ACES transforms`
- **r/SonyAlpha**: `Free S-Log3 conversion LUTs — S-Gamut3 and S-Gamut3.Cine, any target, verified`
- **iPhone filmmaking**: `Free Apple Log → Rec.709/P3 conversion LUTs, generated in-browser`
- **r/dji**: `Free D-Log conversion LUTs, any target — in-browser, verified`
- **r/videography**: `An atlas of every camera log — what each is, with instant conversion LUTs`
- **ACEScentral** (tools category): the CSC differential harness + deltas + request for review of the CAT notes.

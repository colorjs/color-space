# color-space — marketing

> Single source of truth. Stamped **2026-07-21**; Search Console block and plan 8–14 **2026-10-02**; space and anchor counts re-taken **2026-10-03** — re-verify any number the day it's quoted publicly.

## Data

**Reach** (npm month 06-20→07-19 · GitHub 07-21): color-space **4.0M DLs · 357★** — culori 5.7M · 1,211★ — colorjs.io 25.8M · 2,266★ — chroma-js 10.8M · 10,574★. Culori-tier usage, ⅓ the recognition, mostly transitive (45 dependents). **The job: convert invisible usage into visibility — not awareness from zero.**

**Search Console** (pulled 2026-10-02; current vs previous period as the report gave them — clicks vs impressions not recorded, note it on the next pull):
- Countries: Brazil 39% · Turkey 15% · Thailand 9% · UK 7% · US 7%
- Queries (current / previous / Δ): `color space` 117/42/+75 · `colorspace` 23/8/+15 · `space color` 7/1/+6 · `color this space` 7/0/+7 · `colour space` 3/0/+3 · `color spaces` 3/7/−4 · `all color spaces` 2/0/+2 · `colorspace, lp` 2/2/0 · `ipt color space` 2/0/+2 · `colorspace labs` 2/1/+1
- Pages: `/` 1,229 · `/sgamut3cine` 190 · `/prophoto` 108 · `/dlog` 102 · `/xyb` 47 · `/labh` 36 · `/hsv` 24 · `/ciecam02` 20 · `/slog3` 19 · `/panalog` 8
- Read: the head term is the generic English *color space* → learners land on `/`, so orientation (what a color space is) and the start-here tour matter most. Film pages (sgamut3cine, dlog, slog3) and prophoto are the second door → the creator flow (camera → target → editor → .cube). Volumes are small, so the country split is noise-prone: localization stays a pilot (pt-BR first), and only after analytics exist.

**Quotable claims** (each with its proof; never round up):
- **166 spaces, 4× any JS library** (culori ~35, colorjs.io ~40, texel ~16) — runtime count on master (published 3.1.0 has 162 until the next release), cited list in README.
- **Verified, three layers**: every space pinned by an independent cited anchor (143 points on master, `test/refs.js`) or both directions vs colorjs.io at 1/255 (29 spaces) — the union is test-pinned, neither alone covers all · **camera logs vs the Academy's official ACES vendor transforms** — deltas ≤0.5% (CAT02 pairs, fully attributed to adaptation convention) / 1e-10 (Bradford pairs) — [docs/formula-verification.md](../docs/formula-verification.md#camera-log-verification-against-official-aces-transforms), reruns on `npm test`.
- **Fast**: 5.52M scalar calls/s geomean vs culori 4.46, colorjs.io 0.23 — the README table's figures, measured 2026-10-03 (`npm run benchmark`, Node 22 / Xeon; method in its footnote). Say *culori's pace or a little ahead, 20×+ colorjs.io*, never "fastest": d3-color and color-convert (on their 4 conversions) and texel (oklab, p3) match or beat it on what they cover. WASM batch: 1.38–4.78× the JS batch API (README footnote ³). The old 29.3 / 36.4 figures timed literal arguments V8 constant-folded — retired, never quote them.
- **Small**: one space 0.4–1.5 kB; lite 9 kB; full graph 55 kB gz (never call the full bundle "tiny").
- **Beyond JS**: WASM batch · GLSL/WGSL · in-browser `.cube` LUTs with self-verifying headers · ICC · MCP (`color-space-mcp` — no other color lib has one). CC0.

**Audience wedges** (desire: *"convert THIS to THAT, correctly, without re-deriving the math"*): ① film/colorists — the moat, near-zero competition, reached via free LUTs not npm; ② CSS/OKLCH adopters — the volume, contested; ③ color science — the credibility, citations. Objection answers live inside the drafts below.

**Funding reality**: sponsorship ≈ 0 across this whole category (Lea Verou: 1 sponsor at 25.8M DLs/mo). Wired: FUNDING.yml, thanks.dev. Expect tens of $/mo from dependency funds (OSS Pledge, Tidelift). The only real-money door: film-tech named sponsorship (Colourlab, FilmLight, Frame.io) **after** 3–6 months of demonstrable LUT traffic.

**Standing corrections**: culori is active again (never use the old "stalled" line) · "Tailwind v4 uses culori" is false · npm registry text updates on next publish · HSL yellow vs blue at L=50 is **~13×** in luminance (sRGB Y 0.928 vs 0.072, computed) — it was mis-stated as 4×.

## Stance

- **Owned surfaces stay understated** (owner's decision 2026-07-21): hero and npm description say *"An open collection of color spaces"* — no counts, evergreen. The substance (166, verification, benchmark, comparison) sits one scroll below and in docs. **Number-led selling happens in posts, never on owned surfaces.** Don't re-add it.
- **Honesty guardrail**: state verification by its exact layer; LUTs are colorimetric conversions, *not looks* — say it before anyone asks; one inflated proof point costs more than the launch earns.

## Plan

Surfaces are done (atlas live at color-space.io, OG image wired, GitHub About/topics set, FUNDING wired). What remains is posting and repeating:

1. [x] **This week — Show HN** (the "v3 just shipped" hook decays). Draft below; stay in the thread all day.
2. [x] **Web reddit** — r/javascript posted 07-27: reddit.com/r/javascript/comments/1v3fgbz — **31↑ · 17K views · few comments** (healthy for a niche library; the author comment carried it). Keep answering; the "papers have bugs — coloroid, OSA-UCS, even oklab" reply is the best social-currency line so far — reuse it. **r/webdev not yet posted — their promo window is Showoff Saturday only → post Sat Aug 1**, atlas-framed, histogram demo lead; doubles as warm-up for PH the next day. Don't lazy-repost the JS post to r/colorists via reddit's nudge — the film track has its own tailored posts (r/colorists joins the ladder after LGG; it skews pro).
2b. [x] **Product Hunt — scheduled Aug 2** (Sunday: lowest traffic, lowest competition — decent top-of-day odds for a free tool; Tue–Thu would maximize raw eyeballs). The *atlas* as a free tool — tagline + maker comment below; 12:01 AM PT.
2c. [x] **Passive listings — the posting checklist** (once, evergreen · audited 2026-07-21). Text to reuse everywhere: name `color-space` · one-liner *"An interactive atlas of 162 color spaces — live conversion, image histograms in any space, LUT/ICC export. Open source, CC0."* · URL `https://color-space.io` · repo `github.com/colorjs/color-space`:

    - [x] awesome-javascript — PR open: github.com/sorrycc/awesome-javascript/pull/1123
    - [x] awesome-colour (colour-science) — already listed, nothing to do
    - [x] Best of JS — issue open: github.com/michaelrambeau/bestofjs/issues/1168 (their flow is an issue, not a PR — the project DB isn't in the repo)
    - [x] AlternativeTo — alternativeto.net → "Add an item"; then mark as alternative to chroma-js, culori, colorjs.io (that's where switchers search)
    - [x] JS.LibHunt — js.libhunt.com → "Suggest a project" / claim the auto-entry
    - [x] StackShare — stackshare.io → add tool page
    - [x] toools.design — toools.design → "Submit a resource", color category (design crowd, real traffic)
    - [x] devhunt.org — dev-tool launch board, GitHub login, low effort (optional, small)
    - [x] Uneed — uneed.best → submit (PH-lite; schedule a launch day, optional)
    - [x] Peerlist Launchpad — peerlist.io/launchpad (optional, indie-dev crowd)
    - [x] Verify the automatic pages look right (nothing to submit): bundlephobia.com/package/color-space · npmtrends.com/color-space-vs-culori-vs-colorjs.io (use as comparison link in posts) · snyk.io Advisor page

    **Skipped, with reasons**: awesome-nodejs / awesome-creative-coding / cg-vfx-pipeline / Awesome-Design-Tools (no fitting category — forced PRs get rejected and smell of spam) · Openbase (dead since 2023) · AI-tool directories (no qualified traffic, spam adjacency) · look-LUT communities like freshluts (creative-LUT culture; conversion LUTs would confuse — reach colorists via the film track instead).
2d. [x] **SEO** (audit 2026-07-21, updated 07-22 — foundation solid: canonicals, prerendered prose, per-page descriptions, sitemap+robots+llms.txt, www→apex 301, colorjs.github.io→domain 301):
    - [x] display-name titles ("S-Gamut3.Cine", not the slug) — shipped, pinned by tests
    - [x] "conversion LUT" in scene-referred titles + the visible CONVERSION LUT dossier block — shipped
    - [x] **register Search Console + Bing Webmaster, submit sitemap** — done; first query data 2026-10-02 (Data → Search Console). It steers the weekly dossier work (§6) and gates the pair-pages call below
    - [x] **per-space OG/indexable images** — shipped 07-22: `generate-og.js spaceCards()` renders a card per space (display name, use line, the space's channel-gradient signature, ranges) into gitignored `web/img/og/` (skip-if-fresh cache, ~8.5 MB JPEG); stamped into each page's og:image + alt, listed in the image sitemap; test-pinned
    - [x] **Dataset JSON-LD** — shipped 07-22: homepage only (stamps strip it), CC0 license, data.json distribution; test-pinned
    - [x] sitemap `<lastmod>` — shipped 07-22: per-space from git history of `spaces/<s>.js` (pages.yml now checks out full history); image-sitemap namespace added
    - [ ] pair pages ("slog3 to rec709") — ONLY if Search Console shows impressions for pair queries; premature = thin-content risk. 2026-10-02: no pair query in the top 10 — not yet
    - marginal, noted not planned: title display-length (139/164 over ~60ch — names front-loaded, truncation eats only boilerplate) · BreadcrumbList JSON-LD
3. [ ] **Next week — LiftGammaGain scrutiny post** (draft below). If the thread survives, it's the citable proof for the whole film track.
4. [ ] **Then one film community per week**, led by that camera's pain, LGG thread cited: r/davinciresolve → r/SonyAlpha (both Sony gamuts) → iPhone-filmmaking (Apple Log, hottest trigger) → r/dji → r/videography (education-led) → ACEScentral (ACES story; bridge to ASWF orbit).
5. [ ] **Dream-100 gift outreach alongside** (no ask, 3+ touches): colorists — Cullen Kelly, Darren Mostyn, Waqas Qazi, Color Grading Central, Gerald Undone (deltas table is his language); CSS — Lea Verou orbit, Björn Ottosson, Dan Burzo; newsletters after HN exists to cite.
6. [ ] **Always**: new camera log announced → support within days → short post (the recurring trigger). Each community's questions → that week's dossier improvements. Log every post: venue, title, response; kill venues after two silent attempts.
7. [ ] **Donation**: optional one-line ask at the LUT download-complete moment (*"Free and verified. If it saved your grade — sponsor the atlas."* — tone is owner's call); at 3–6 months take traffic numbers to film-tech sponsors.

Added 2026-10-02 (Search Console read + research digests):

8. [ ] **Analytics** — Umami Cloud, Hobby plan (free; 100K events/month per umami.is/pricing): cookieless, no backend, custom events, referrer + language + screen, export (GoatCounter signup failed for the owner, 2026-10). Wired but **OFF**: `web/js/track.js` `UMAMI = ''`. To turn on: sign up at cloud.umami.is → Add website (domain `color-space.io`) → copy the website id (the UUID in its tracking code) into `UMAMI` → push. The tracker loads lazily with auto-track off (the atlas's replaceState URL writes would otherwise each count as a pageview), counts only on color-space.io, never under automation, and sends events with no properties (each property bills as an extra event) — the fact rides in the name (`slog3>rec709/davinci-resolve`, `icc-download/p3-mntr`, `embed-copy/oklch`, …, ≤ 50 chars); every call is one event. Ad blockers that block cloud.umami.is drop it (Umami's docs suggest proxying the script; not done). Search Console stays the query source. Gates the localization pilot.
9. [ ] **Creator LUT flow, per editor** (camera → target → editor → download + steps). Interop facts it rests on: editors get a plain 3D 33³ by default (one `LUT_3D_SIZE`, no shaper) · OBS: a 1D cube whose size is a multiple of 1024 (lut.js's 4096-point 1D default; its 1024-entry shaper, since OBS reads only a shaper cube's 1D part) overflows OBS's uint32 allocation to 0 bytes → crash (per its source; not reproduced in a running OBS) · LumaFusion ≤64 points (its 2017 release note) → no 65³ · ffmpeg `lut3d` silently ignores a shaper. Conversions, not looks — same guardrail.
10. [ ] **MCP Registry** — `io.github.colorjs/color-space`; `server.json` + `mcp-publisher` step in `release.yml` (GitHub OIDC, no secrets). Goes live with the next stable npm release, not an rc (release.yml skips the registry for `next`): the registry checks `mcpName` on the *published* version, and 3.1.0 has none.
11. [ ] **Figma plugin** (`plugins/figma/`) — owner publishes; an account action, not code.
12. [ ] **CITATION.cff + Zenodo DOI** — `CITATION.cff` at the root gives GitHub's "Cite this repository" (validated with cffconvert). DOI: owner signs in to Zenodo with GitHub and toggles the repo On (colorjs is an org — the org owner may need to approve the Zenodo app); Zenodo then archives each GitHub release (release.yml creates one) and mints a DOI. Add the DOI to CITATION.cff after the first one. Bump its `version` + `date-released` with each release: release.yml syncs server.json's version, not this file's, and the site's Cite plates (build-site.js) read it. The release's `npm test` (check-site.js) fails while `version` differs from package.json; `date-released` is unchecked.
13. [ ] **New camera logs = the "new log → post" trigger (§6)**: Apple Log 2, F-Log2 C, GP-Log2, KineLOG3 — vendor math checked 2026-10-02. Each one shipped → one short post in its camera's community. Waiting on vendor proof: vivo Log, Huawei H-Log, DJI D-Log2.
14. [ ] **Wikipedia** — Oklab has an article (en; the other-language count could not be checked from the sandbox — verify before quoting). **Never self-insert links to color-space** (COI).

**Don'ts**: no email gates · no look/creative LUT packs · no two posts in one week per track · no stat quoted without same-day re-verification.

## Drafts

### [x] Tweet (v3 announce)

> color-space v3 — 162 color spaces, one small API, verified.
> OKLCH to Munsell to S-Log3, any to any. Or take a .cube LUT, ICC, GLSL, WASM.
> https://color-space.io

Alt, sparer:

> color-space v3 is out. 162 color spaces, one small API, verified.
> https://color-space.io

### [x] Product Hunt (atlas-framed)

- **Name:** color-space · **Tagline:** `An interactive atlas of 162 color spaces` · **Topics:** design tools, developer tools, open source
- **Description:** Every color space — web, print, film, broadcast, vision, history. Live conversion with cited sources. Drop an image — its per-channel histograms in any of the 162 spaces. Export any pair as a .cube LUT or ICC profile, in-browser. Free, public domain.
- **Maker comment:** one paragraph, README register: what it is, verification in one sentence, "not a toolkit" in one sentence, ask for feedback on spaces people actually use.

### [x] Show HN (title ≤80 chars · URL `https://color-space.io/`)

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

### [ ] LiftGammaGain scrutiny post (film track opener — ask, don't pitch)

    Free conversion LUTs for every camera log, tested against the official ACES transforms — where are they wrong?

> Author disclosure: I build the library behind this (color-space, CC0).
>
> Any camera log → any display, as a .cube generated in the browser. S-Log3 (S-Gamut3 or S-Gamut3.Cine), LogC3/4, V-Log, Log3G10, C-Log 1/2/3, F-Log/2, N-Log, Apple Log, D-Log, BMD Film Gen5, ACES → Rec.709, sRGB, P3, Rec.2020, PQ/HLG. 17³ / 33³ / 65³, or a 4096-point 1D when the pair is transfer-only. No email, no account.
>
> Conversions, not looks: no tone mapping, no rolloff — log → 709 clips above diffuse white by design. Not a replacement for LogC-to-video, s709, or V-709. For normalization, monitoring, QC, batch ffmpeg; grade on top.
>
> The seven pairs with official Academy CSC/IDT transforms are differential-tested against those CTLs (ampas/aces-dev v1.3): worst case ≤0.5% of the dominant component on Sony/ARRI/Canon — the CAT02 vs Bradford adaptation difference, ≤7.1e-6 once the CAT matches — and 1e-10 on Panasonic/RED. Per-pair table: [docs/formula-verification.md, ACES section]. Each .cube header carries its own measured lattice deviation.
>
> Two questions. Where is the math wrong? — the suite is public and reruns on `npm test`. And which missing pair would help your work?
>
> https://color-space.io — LUT export on every camera-log page; drop a frame there and it reads back as per-channel histograms in that log's own code values.

Pre-post: rerun `npm test` same day · verify downloads in Safari/Firefox · have the CAT02 and Canon-×0.9 replies ready · disclose authorship line one · never argue — thank, verify, fix, report back.

### [ ] Reddit ladder (titles; body = the LGG skeleton compressed, conversion-not-look always, authorship disclosed, one per week)

- [x] **r/javascript**: `color-space v3 — 162 color spaces, one small API, values that match CSS, verified` (code sample + kernel-not-toolkit + atlas link)
- [ ] **r/webdev**: `An atlas of 162 color spaces — live conversion, ranges, provenance, LUT/ICC export`
- [ ] **r/davinciresolve**: `Free conversion LUTs for every camera log, tested against the official ACES transforms`
- [ ] **r/SonyAlpha**: `Free S-Log3 conversion LUTs — S-Gamut3 and S-Gamut3.Cine, any target, verified`
- [ ] **iPhone filmmaking**: `Free Apple Log → Rec.709/P3 conversion LUTs, generated in-browser`
- [ ] **r/dji**: `Free D-Log conversion LUTs, any target — in-browser, verified`
- [ ] **r/videography**: `An atlas of every camera log — what each is, with instant conversion LUTs`
- [ ] **ACEScentral** (tools category): the CSC differential harness + deltas + request for review of the CAT notes.

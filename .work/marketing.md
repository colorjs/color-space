# color-space — marketing

> Single source of truth. Stamped **2026-07-21** — re-verify any number the day it's quoted publicly.

## Data

**Reach** (npm month 06-20→07-19 · GitHub 07-21): color-space **4.0M DLs · 357★** — culori 5.7M · 1,211★ — colorjs.io 25.8M · 2,266★ — chroma-js 10.8M · 10,574★. Culori-tier usage, ⅓ the recognition, mostly transitive (45 dependents). **The job: convert invisible usage into visibility — not awareness from zero.**

**Quotable claims** (each with its proof; never round up):
- **162 spaces, 4× any JS library** (culori ~35, colorjs.io ~40, texel ~16) — runtime count, cited list in README.
- **Verified, three layers**: every space pinned to an independent cited anchor (135 points, `test/refs.js`) · 29 spaces both directions vs colorjs.io at 1/255 · **camera logs vs the Academy's official ACES vendor transforms** — deltas ≤0.5% (CAT02 pairs, fully attributed to adaptation convention) / 0.03% (Bradford pairs) — [docs/lut-verification.md](../docs/lut-verification.md), reruns on `npm test`.
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
3. **Next week — LiftGammaGain scrutiny post** (draft below). If the thread survives, it's the citable proof for the whole film track.
4. **Then one film community per week**, led by that camera's pain, LGG thread cited: r/davinciresolve → r/SonyAlpha (both Sony gamuts) → iPhone-filmmaking (Apple Log, hottest trigger) → r/dji → r/videography (education-led) → ACEScentral (ACES story; bridge to ASWF orbit).
5. **Dream-100 gift outreach alongside** (no ask, 3+ touches): colorists — Cullen Kelly, Darren Mostyn, Waqas Qazi, Color Grading Central, Gerald Undone (deltas table is his language); CSS — Lea Verou orbit, Björn Ottosson, Dan Burzo; newsletters after HN exists to cite.
6. **Always**: new camera log announced → support within days → short post (the recurring trigger). Each community's questions → that week's dossier improvements. Log every post: venue, title, response; kill venues after two silent attempts.
7. **Donation**: optional one-line ask at the LUT download-complete moment (*"Free and verified. If it saved your grade — sponsor the atlas."* — tone is owner's call); at 3–6 months take traffic numbers to film-tech sponsors.

**Don'ts**: no email gates · no look/creative LUT packs · no two posts in one week per track · no stat quoted without same-day re-verification.

## Drafts

### Show HN (title 70 chars · URL `https://color-space.io/`)

    Show HN: Color-space v3 – 162 color spaces in one verified JS library

> I maintain color-space, a JS library that started in 2014 as a handful of RGB/HSL conversions. v3 is a rewrite I've wanted for years: 162 color spaces — web, print, film, broadcast, photo, human vision, history — under one small API, with the ranges each field actually uses (RGB 0–255, Lab 0–100, OKLCH exactly as CSS writes it — no universal 0–1 wrapper).
>
>     space.rgb.oklch(255, 128, 0)        // → [0.732, 0.186, 53] — matches CSS oklch()
>     space.slog3.rec2020(0.5, 0.5, 0.5)  // Sony camera log → UHD wide gamut
>
> The part I care most about is verification, because color formulas rot in the retelling — papers disagree, Wikipedia drifts, libraries copy each other's bugs. Every space is pinned to an independently cited conformance anchor (135 reference points); 29 are differential-tested against colorjs.io (the CSS Color spec editors' implementation) both directions at 1/255; camera logs are differential-tested against the Academy's official ACES vendor transforms, deltas published [1]. The process caught real errors, including in published papers.
>
> It's deliberately not a color toolkit — no parsing, interpolation, ΔE, gamut mapping. That's the application layer (culori/colorjs.io do it well and can sit on top). One imported space is 0.4–1.5 kB; the full 162-space graph is 55 kB gz — nobody imports that. The same formulas also leave JS: WASM batch, GLSL/WGSL, ICC, and .cube LUTs generated in-browser with self-verifying headers.
>
> The site is the interactive atlas — every space with its ranges, provenance, references, live conversion. Public domain (CC0).
>
> [1] https://github.com/colorjs/color-space/blob/master/docs/lut-verification.md

Prepared answers: *why-not-culori* (for when they lack your space / conventional ranges / independent verification; kernel they can sit on) · *162 = padding?* (each separately importable, anchored; declined-list in README) · *bundle size* (quote per-space, concede full) · *0–1 is standard!* (conventional = what each field's own literature writes) · *CAT02 vs Bradford* (deltas quantify exactly that; doc has the table).

### LiftGammaGain scrutiny post (film track opener — ask, don't pitch)

    Free browser-generated conversion LUTs for every camera log — tested against the official ACES transforms. Where are they wrong?

> Author of an open-source color library here (color-space, CC0). Its camera-log math is on the web as free instantly-generated .cube conversion LUTs — no email, no account: any log (S-Log3 on S-Gamut3 *or* S-Gamut3.Cine, LogC3/4, V-Log, Log3G10, C-Log 1/2/3, F-Log/2, N-Log, Apple Log, D-Log, BMD Film Gen5, ACES…) → any target (709, sRGB, P3, 2020, PQ/HLG), 17³/33³/65³, or 4096-pt 1D when the pair is transfer-only. Before I take this anywhere I'd rather this forum tears the math apart than a client does.
>
> What "tested" means: the seven pairs with official Academy CSC/IDT transforms are differential-tested against those CTLs (ampas/aces-dev v1.3). Worst-case disagreement: ≤0.5% of the dominant component (Sony/ARRI/Canon — fully explained by CAT02-vs-Bradford adaptation; swap the CAT and it collapses to 0.03%), 0.03% (Panasonic/RED). Per-pair table + method: [docs/lut-verification.md]. Each .cube header also states its own measured lattice deviation, so you can judge 33³ vs 65³ before loading.
>
> What these are NOT: display renders. Pure colorimetric conversions — no tone mapping, no rolloff; log→709 clips above diffuse white by design. They will not match LogC-to-video, s709, or V-709 — those are looks. Normalization, monitoring, QC, batch ffmpeg; grade on top.
>
> Two asks: (1) if you know these transforms cold — where is it wrong? The suite is public, reruns on `npm test`. (2) which missing pair would actually help your work?
>
> https://color-space.io — LUT export on every camera-log page.

Pre-post: rerun `npm test` same day · verify downloads in Safari/Firefox · have the CAT02 and Canon-×0.9 replies ready · disclose authorship line one · never argue — thank, verify, fix, report back.

### Reddit ladder (titles; body = the LGG skeleton compressed, conversion-not-look always, authorship disclosed, one per week)

- **r/javascript**: `color-space v3 — 162 color spaces, one tiny API, values that match CSS, conversions independently verified` (code sample + kernel-not-toolkit + atlas link)
- **r/webdev**: `Interactive atlas of 162 color spaces — live conversion, ranges, provenance, downloadable LUTs/ICC`
- **r/davinciresolve**: `Free .cube conversion LUTs for every camera log — generated in-browser, verified against the official ACES transforms`
- **r/SonyAlpha**: `Free verified S-Log3 conversion LUTs — both gamuts (S-Gamut3 and S-Gamut3.Cine), any target`
- **iPhone filmmaking**: `Free Apple Log → Rec.709/P3 conversion LUTs, generated in-browser — no email wall`
- **r/dji**: `Free D-Log conversion LUTs for any target — in-browser, verified, no signup`
- **r/videography**: `A free atlas of every camera log — what each actually is, plus instant conversion LUTs`
- **ACEScentral** (tools category): the CSC differential harness + deltas + request for review of the CAT notes.

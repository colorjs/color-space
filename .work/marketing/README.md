# color-space — marketing strategy

The internal source of truth for how color-space is described, positioned, and spread. Built with the verified direct-response canon (Schwartz, Dunford, Ogilvy, Caples, Berger), research-first. Last full refresh: **2026-07-21** (v3.0.0 shipped, 162 spaces, ACES vendor verification landed).

## The strategy in one paragraph

color-space is **the complete, verified color-space conversion kernel: 162 spaces under one tiny API, in conventional (CSS-matching) ranges, every space independently anchored, 29 differential-tested against the CSS spec reference, camera logs against the Academy's official ACES vendor transforms.** It is not a color *toolkit* (no parsing/interpolation/ΔE — by design) and shouldn't fight culori/chroma on features. It wins a narrower, winnable frame: *the library with the space you actually need, and numbers you can trust* — wedging deep where there's near-zero competition (camera logs → colorists via in-browser `.cube` LUTs, appearance models, Munsell, broadcast) and broad where the trend is live (OKLCH/P3, CSS-native values).

## The one big idea

> **Every color space. One API. Verified.**
> 162 · conventional ranges · per-space cited anchors · differential vs colorjs.io · camera logs vs official ACES transforms

## The documents (read in order)

1. **[audience.md](audience.md)** — who actually uses it, their dominant desire, their words, what they've tried, their objections, and the awareness/sophistication diagnosis that dictates the copy.
2. **[positioning.md](positioning.md)** — Dunford's 5 components, the positioning statement, the category choice, the proof inventory, headline candidates.
3. **[surfaces.md](surfaces.md)** — README/npm/landing analysis. **Prep phase shipped** — see its STATUS block for what diverged.
4. **[distribution.md](distribution.md)** — the two-track launch calendar (web + film), merged Dream 100, STEPPS, content, the honesty guardrail.
5. **[market-data.md](market-data.md)** — cited competitor download/stars/size data + funding reality (restamped 2026-07-21).
6. **[launch/](launch/)** — ready-to-post drafts: Show HN, Reddit variants, the LiftGammaGain scrutiny post.

## The highest-leverage actions (current)

1. **Finish the OG/social image** (`scripts/generate-og.js` — in progress). The last passive surface; every shared link unfurls with it. Do before any launch post.
2. **Fire the web track**: Show HN ([launch/show-hn.md](launch/show-hn.md)) while "v3.0.0 just shipped" is still news; then r/javascript + lobste.rs on following days.
3. **Fire the film track** (week after HN): the LGG scrutiny post ([launch/lgg-scrutiny.md](launch/lgg-scrutiny.md)), then the per-camera subreddit ladder, then Dream-100 outreach. One community per week.
4. **Re-verify every stat the day it's quoted** (market-data.md is stamped; numbers move).
5. **Re-trigger on camera launches**: new log format announced → support within days → short post (the recurring distribution event).

## Done (2026-07)

Count fixed everywhere (162) · README hero rewritten · npm description + keywords sharpened · atlas live at color-space.io (162 dossiers, converter, in-browser LUT/ICC downloads) · GitHub About + topics set · FUNDING.yml + thanks.dev wired · S-Gamut3.Cine added · **camera logs verified vs official ACES vendor transforms** (docs/lut-verification.md, runs in `npm test`) · `.cube` headers self-verify and cite the verification.

## Stance

Substance first: *truthful, attractive, then famous* — in that causal order. The verification claim is the whole moat; state every proof precisely and never round it up. Prove with nectar — show the working converter and the downloadable LUT, not a pitch.

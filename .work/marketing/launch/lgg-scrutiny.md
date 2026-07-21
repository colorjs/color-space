# LiftGammaGain scrutiny post — film track, week 1

> Post AFTER the OG image is live and numbers re-verified. LGG is adversarial and expert — that's the point: we're asking for refutation, not applause. If the thread survives, it becomes the citable proof for the whole film track. Read the forum's self-promo norms first; post in the appropriate technical subforum; disclose being the author in the first line. Never argue in replies — thank, verify, fix, report back. Every correction is a gift and a follow-up post.

## Title

    Free browser-generated conversion LUTs for every camera log — tested against the official ACES transforms. Where are they wrong?

## Body

I'm the author of an open-source color conversion library (color-space, public domain), and I've put its camera-log math on the web as free, instantly generated `.cube` conversion LUTs — no email, no account: pick a source (S-Log3/S-Gamut3 or S-Gamut3.Cine, LogC3/LogC4, V-Log, Log3G10, C-Log 1/2/3, F-Log/F-Log2, N-Log, Apple Log, D-Log, BMD Film Gen5, DaVinci Intermediate, ACES…), pick a target (Rec.709, sRGB, P3, Rec.2020, PQ/HLG…), download at 17³/33³/65³ — or a 4096-point 1D LUT when the pair is transfer-only.

Before I take this anywhere, I'd rather this forum tears the math apart than a client does.

**What "tested" means, precisely:**

- The seven pairs with official Academy CSC/IDT transforms (Sony S-Log3 on both gamuts, ARRI LogC3 EI800, Canon C-Log2/3, Panasonic V-Log, RED Log3G10) are differential-tested against those CTLs, transcribed from ampas/aces-dev v1.3. Measured worst-case disagreement across an encoded grid: **≤0.5% of the dominant component** for the Sony/ARRI/Canon pairs, **0.03%** for Panasonic/RED. The gap is fully explained by chromatic-adaptation convention — those vendor CTLs adapt D65→ACES white with CAT02, the library uses Bradford (the CSS convention); swap the CAT and the residual collapses to 0.03%. Full per-pair table, methodology, and the reflection-convention notes (e.g. Canon's ×0.9): [docs/lut-verification.md]
- Every space in the library is additionally pinned to an independently cited reference value, and the common colorimetric spaces are differential-tested against colorjs.io (the CSS Color spec editors' implementation).
- Each generated `.cube` states its own accuracy: the header carries the measured median/max deviation of the interpolated lattice vs the direct conversion at off-lattice samples, so you can judge whether 33³ is enough for your use before loading it.

**What these are NOT:** display renders. They're pure colorimetric conversions — no tone mapping, no highlight rolloff, no look. A scene-referred log pushed straight to Rec.709 clips above diffuse white, by design. They will not and should not match ARRI's LogC-to-video LUTs, Sony's s709, or V-709 — those are looks. Use these for normalization, monitoring pipelines, QC, and batch ffmpeg work; grade on top.

Two asks:

1. If you know these transforms cold — where is the math wrong? Any pair, any value; the whole test suite is public and reruns on `npm test`.
2. Which missing pair or format would actually help your work? (Next candidates on my list: [current shortlist].)

Site: https://color-space.io (LUT export on every camera-log page). Everything is CC0.

## Pre-post checklist

- [ ] Re-run `npm test` same day; re-read the deltas table — quote only what it says today.
- [ ] Fill `[current shortlist]` honestly (e.g., ARRI LogC4 official CSC when published, Venice variants, RED IPP2 pipeline notes).
- [ ] Confirm the atlas LUT downloads work in Safari/Firefox, not just Chromium.
- [ ] Link check: docs/lut-verification.md renders on GitHub with all CTL links live.
- [ ] Have the CAT02/Bradford explanation and Canon ×0.9 note ready as replies — first questions will be these.

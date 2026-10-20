# Outreach and owner actions

Plan as of 2026-10-19. Each step gives something before it asks anything, and each letter was costed before drafting: what it reveals, how easy it is to refuse, what it commits you to. Facts in the drafts were re-checked against their sources today; anything unverified is marked.

## The order

| # | Step | Blocked by | Time |
|---|---|---|---|
| 0 | Deploy is green and serves the 221 spaces | the check-site pin (color-space-7b) | – |
| 1 | Release 3.5.0 | 0 | 30 min |
| 2 | Watch the five issues filed today; add disclosed links to two | 0 | 5 min, then as replies come |
| 3 | OpenLayers note | 0 | 5 min |
| 4 | polychrome.nvim note | 1 | 5 min |
| 5 | Mark Fairchild: CIECAM97s example and S-CIELAB matrix | – | 10 min |
| 6 | Kinefinity and HunterLab errata | – | 10 min each |
| 7 | culori: cubehelix range (optional) | – | 5 min |

One letter a day reads as care; five in an hour reads as a campaign. Steps 2–7 fit one per day across a week.

## [x] 0. Deploy
Done 2026-10-19.

CI on 12f35fe still fails at test:site (`check-site.js:838`: the phone's display family holds back 27, the pin says 26). color-space-7b is pushing the fix. Done when https://color-space.io/hellwig2022-hk returns 200. Steps 2–4 link to the site, so nothing goes out before this.

## [x] 1. Release 3.5.0
Done 2026-10-19: npm `latest` and `next` = 3.5.0 with provenance, [GitHub release](https://github.com/colorjs/color-space/releases/tag/v3.5.0) with the notes below, MCP Registry updated; v3.4.0 tagged at its published commit (c439994). LobeHub listing updated 3.3.0 → 3.5.0 (c2d325d). Left: the DOI – Zenodo isn't connected to the repo (no webhook, no record), so nothing was minted. Enable colorjs/color-space at zenodo.org/account/settings/github, then archive v3.5.0 by hand (New upload → its release zip) or let the next release mint it; add `doi:` to CITATION.cff after.

Check first: 3.4.0 was published to npm on 2026-10-18 with no git tag and no GitHub release. Either tag `v3.4.0` at the commit that was published, or compare 3.5.0 against v3.3.0. The draft below assumes the tag exists. After the release: `lhm plugin update` (LobeHub), the MCP Registry picks up server.json's description, Zenodo mints the DOI – add it to CITATION.cff.

> - 16 new spaces – 221 in all: CIECAM16, CIECAM97s; ACES 2.0 JMh; Hellwig 2022 H–K; Helmlab MetricSpace; log-compressed OSA-UCS; Cubehelix (H, S, L); Rec. 709, Rec. 2020 and sRGB as displays decode them (γ 2.4, 2.4, 2.2); YyCxCz, Poirson–Wandell; Venice S-Gamut3 and S-Gamut3.Cine; ADX10, ADX16
> - `color-space/conformance.json` – cited reference conversions, each with its source, link and kind
> - `color-space/ocio` – a space as an OpenColorIO 2 colorspace from native transforms; 55 spaces
> - `gamuts.js` `whites` and `matrix`; each gamut's RGB ↔ XYZ matrices in data.json
> - primaries for 34 camera logs; S-Gamut3.Cine, Cinema Gamut, Apple Wide Gamut, F-Gamut C, Kinefinity Wide Gamut
> - `color(rec2020 …)` reads as `rec2020-display`, CSS's 2.4 gamma
> - hdr-CIELAB and hdr-IPT: Fairchild & Wyble's 0.02 lightness offset
> - Coloroid A=24 at its printed limit color
> - XYB's B channel named Blue − Y
>
> **Full Changelog**: https://github.com/colorjs/color-space/compare/v3.4.0...v3.5.0

## [ ] 2. The five issues filed today

[colour#1423](https://github.com/colour-science/colour/issues/1423) (Hellwig H–K inverse), [colour#1424](https://github.com/colour-science/colour/issues/1424) (DIN99c/d X′), [colour#1425](https://github.com/colour-science/colour/issues/1425) (ECI RGB and three more primaries), [w3c/csswg-drafts#14631](https://github.com/w3c/csswg-drafts/issues/14631) (leaf example), [Grkmyldz148/helmlab#4](https://github.com/Grkmyldz148/helmlab/issues/4) (paper vs code). Commits you to answering follow-ups within a few days; Thomas Mansencal usually replies fast.

#1424 and #1425 already end with a disclosed color-space.io link. After step 0, add the same to the other two, as a comment:

> colour#1423: For comparison, a closed-form round trip: https://color-space.io/hellwig2022-hk (color-space, which I maintain).

> helmlab#4: The port, with Stage 10 as released: https://color-space.io/helmlab-metric (color-space, which I maintain).

No link on #14631: a spec-example fix needs none.

## [ ] 3. OpenLayers

Where: a comment on openlayers/openlayers#16601 (merged 2025-02-02); it notifies ahocevar, mike-000 and MoonE.
When: after step 0, and after reading the draft as yours (the apology is your call).

Why: ahocevar opened #58–#62 here (types: two merged, three closed), then removed the dependency: "I found several bugs there that made me doubt the reliability of that library, and the maintainer seemed to be complicated to interact with." No reply since. #57 (types) was MoonE's, also an OpenLayers maintainer; #63 was yours.

Consequences:
- Reveals: nothing private; admits in public that the type PRs went badly, which the threads already show.
- Easy to refuse: yes, it asks nothing; silence is a fine outcome.
- Commits you to: answering if they reply, and fixing any bug they still name.
- Risk: reading as a pitch to re-add the dependency. The "no ask" line and leaving out downloads and feature lists prevent that.

> @ahocevar, a late follow-up. You were right about the types, and I made contributing them harder than it needed to be in colorjs/color-space#58–#62. I'm sorry for the time it cost you.
>
> color-space 3 is a rewrite: it ships TypeScript types checked in CI, and every space is tested against a cited reference value or differentially against colorjs.io. If a bug you found then is still there, I'd like to know.
>
> No ask: dropping the dependency was a sound call for OpenLayers. If your in-house conversion ever needs checking, https://color-space.io/conformance.json has cited reference conversions (CC0). Thank you for pushing on the types.

(The PR range was #57–#62; #57 is MoonE's, so it now reads #58–#62. Whether to thank MoonE too is yours.)

## [ ] 4. polychrome.nvim

Where: an issue at github.com/loganswartz/polychrome.nvim (Discussions are off). Logan Swartz, 26 stars, last commit 2026-08-29.
What they do: `spec/bidirectional_conversions_spec.lua` runs the globally installed `color-space` (`npm install -g`) as the oracle for rgb, hsl, lrgb, p3, p3-linear, xyz, lms, oklab, oklch and cmyk. They call the library, not color-space.io data.
What to give: two facts they can't see from outside. Their spec tracks whatever version npm installs. And conformance.json covers only part of their set: xyz and lrgb have cited rows; hsl, oklab, oklch, p3 and p3-linear are checked differentially against colorjs.io instead. So the honest offer is a question, not the file.

Consequences: reveals nothing; trivially easy to ignore; commits you to keeping the ten conversions they use stable, which you do anyway.

> Hi Logan – I maintain color-space, and found your spec using it as the reference for polychrome's conversions. Thank you; it's the first outside test suite I know of that does.
>
> Two things that may save you a debugging session:
> - The spec runs whatever `npm install -g color-space` installs, so a major release can change your expected values under you. Pinning the version (`color-space@3`) keeps them stable; 3.x won't change the ten conversions you use.
> - If you'd rather not shell out to node, https://color-space.io/conformance.json has cited reference values with their sources. Today it covers xyz and linear sRGB from your set; hsl, oklab, oklch and the P3 pair are verified against colorjs.io rather than printed values.
>
> Would a small pinned fixture for your ten spaces help? Happy to generate one if so.

## [ ] 5. Mark Fairchild (RIT): CIECAM97s worked example, S-CIELAB matrix

Where: email. The address is to find: his RIT directory page or markfairchild.org (no mailto on the site). Cc Garrett Johnson for the 2003 paper.
Why him: he hosts both sources (the TC1-34 draft PDF and AppModEx.xls) and co-wrote the 2003 paper. Both findings are small, checkable, and in his materials.

Consequences:
- Reveals: that color-space now ships CIECAM97s and Poirson–Wandell, nothing else.
- Easy to refuse: yes, it asks nothing.
- Commits you to: answering a question about the numbers if he has one.
- Risk: correcting a senior author reads as presumption unless every number is checkable in a minute. The draft gives the cell, the equation and the expected value.

> Subject: Two small numbers in CIECAM97s Table 4.1 / AppModEx.xls and in Johnson & Fairchild 2003
>
> Dear Prof. Fairchild,
>
> Thank you for keeping the CIECAM97s TC1-34 draft and AppModEx.xls online. They made an exact implementation possible: color-space now reproduces J, Q, h, C and M of all four Table 4.1 cases to the printed last digit. Two things turned up on the way, in case they are useful.
>
> 1. AppModEx.xls, sheet CIECAM97s. For hues between blue (237.53°) and red (20.14° + 360°), the sheet splits the interval at 360°, with e = 0.856 and H = 385.9 there. Eqs. 2.21–2.22 applied across the whole interval give e = 0.85649 and H = 380.21 at 360°; 385.9 is what eq. 2.22 gives with red's e of 0.8 replaced by blue's 1.2. Case 4's H then becomes 306.42 rather than the table's 307 (the sheet's 306.87). Separately, the sheet uses the 4-decimal print of M_B⁻¹ in eq. 2.13, which moves near-neutral Case 1 to h 212.28; with the exact inverse it gives 219.43, the table's 219.4. Table 4.1's s for Cases 2 and 4 (146.98, 180.56) I could not reproduce; the equations give 147.00 and 180.58.
>
> 2. Johnson & Fairchild 2003, "A top down description of S-CIELAB and CIEDE2000", eq. 1: the printed 0.297 (A, X coefficient) and −0.077 (C1, Z coefficient) differ from Xuemei Zhang's cmatrix.m `xyz2opp`, which has 0.2787 and +0.0772. A per-cone least-squares fit of Poirson & Wandell's matrix on Smith–Pokorny cones reproduces the code's nine entries within 0.007, so the code looks right and the print looks like a transposition and a sign slip.
>
> The details and the checks are in https://github.com/colorjs/color-space/blob/master/docs/errata.md. No reply needed. Thank you for the work these rest on.
>
> Dmitry

## [ ] 6. Vendor errata (contact forms)

Short, the wrong value, the right one, the proof. Then mark each entry "reported" in docs/errata.md. Consequences: reveal nothing; easy to ignore; commit you to nothing.

**Kinefinity** (kinefinity.com/contact):

> Subject: KineLOG3 Technical Specifications – one value
>
> Hello, a small correction to the KineLOG3 Technical Specifications (2025-09-24, web page and PDF): "the 0% reflectance value corresponds to an IRE of 0.09" should read 9.29 IRE. A 0% input encodes to 0.092864 by the published formula; 0.09 is the code value. The same sentence's 39.2 (18%) and 57.2 (90%) are code × 100, so they are consistent with 9.29. Thank you for publishing the formula and the revised primaries; they made an exact implementation possible.

**HunterLab** (hunterlab.com contact form):

> Subject: AN 1016 (Hunter Rd, a, b) – two equations
>
> Hello, two corrections to Application Note AN 1016 (both AN 1016.00, Figure 1, and the 2012 update AN 1016.01, p. 3):
> 1. bRd is printed as Kb·f(Y)·(Y/Yn − Y/Yn), which is zero for every color. It should be Kb·f(Y)·(Y/Yn − Z/Zn), the counterpart of aRd.
> 2. f(Y) is printed as 0.51·(21 + 0.2·Y)/(1 + 0.21·Y). With 0.21 in the denominator f(100) = 0.950; with 0.2 it is 0.996 ≈ 1, which matches the numerator and colour-science's implementation. I have not checked Hunter's original definition, so this one is a probable correction.

## [ ] 7. culori: cubehelix saturation range (optional)

Where: an issue at github.com/Evercoder/culori. A one-line metadata nit, useful only if they care. The earlier idea of offering conformance.json is dropped: it holds about ten rows for spaces culori shares (XYB, Okhsl, Okhsv, Okhwb, DIN99o, Cubehelix, YIQ, HSI); oklab, oklch and the CSS spaces are checked differentially, not by cited rows. Revisit when coverage grows.

> `modes.cubehelix.ranges.s` is `[0, 4.614]`, but pure blue and pure yellow convert to s = 4.614386868… (culori 4.0.2: `converter('cubehelix')('#0000ff')`), so the sRGB cube slightly exceeds the declared range. `[0, 4.6144]` (or the exact value) would contain it.

## Not contacted, and why

- Nemcsics 1979 (Coloroid Table I): no living maintainer of the table known (unverified); the errata entry is the record.
- Bourgin 1995: Poynton's note says Bourgin already agreed to the correction.
- Poynton 1996: corrected in his own errata (1998).
- colorjs.io and coloraide on helmlab-metric's Stage 10: wait for the author's answer in helmlab#4; it decides which form is canonical.

## [ ] Owner-only

- Publish the Figma plugin, or strike it from the todo. Its tracked bundle (plugins/figma/ui.html, code.js) still holds 205 spaces until rebuilt.
- Monthly: `npm run signals`; Umami for space-page sessions and LUT/ICC downloads; Search Console clicks (not impressions) per space page.

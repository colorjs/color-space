# Outreach and owner actions (from the 2026-10-18 review)

Ranked by value per hour. Each one gives something before it asks anything.

## [ ] 1. Release 3.5.0 – nothing below reaches anyone until it ships
conformance.json in the package, the gamut matrices and whites, the hdr-CIELAB/hdr-IPT offset fix, Coloroid row 24, XYB's B − Y label, the listing texts. After the release: `lhm plugin update` (LobeHub), the MCP Registry picks up server.json's new description, Zenodo mints the DOI – add it to CITATION.cff.

## [x] 2. colour-science – report the DIN99c/DIN99d bug (20 min, the highest-value contact)
Done 2026-10-19: [colour#1424](https://github.com/colour-science/colour/issues/1424) (DIN99c/DIN99d), [colour#1425](https://github.com/colour-science/colour/issues/1425) (the primaries, below), plus [colour#1423](https://github.com/colour-science/colour/issues/1423) (Hellwig 2022 H–K inverse). Also filed: [w3c/csswg-drafts#14631](https://github.com/w3c/csswg-drafts/issues/14631) (CSS Color 4 leaf example), [Grkmyldz148/helmlab#4](https://github.com/Grkmyldz148/helmlab/issues/4) (paper vs code). Answer follow-ups.
Where: an issue at github.com/colour-science/colour. Thomas Mansencal maintains the field's reference implementation; a correct, reproducible report is the strongest credential this project can earn there.
Consequences: public and technical; easy to verify or refute; commits you to answering follow-ups. Cui et al. 2002 is paywalled – say what you checked it against.

> **XYZ_to_DIN99: methods DIN99c and DIN99d skip the X′ step of Cui et al. (2002)**
>
> `XYZ_to_DIN99(XYZ, method='DIN99c')` (and `'DIN99d'`) converts XYZ → CIELAB → `Lab_to_DIN99`. Cui et al. (2002) define DIN99c and DIN99d with a correction of X applied to the sample and to the white before CIELAB: X′ = 1.1·X − 0.1·Z (DIN99c), X′ = 1.12·X − 0.12·Z (DIN99d) (also in de.wikipedia's DIN99 article).
>
> ```python
> XYZ = colour.sRGB_to_XYZ([0, 0, 1])
> colour.XYZ_to_DIN99(XYZ, method='DIN99c')   # [35.86, 31.86, -40.79]
> # with X′ on the sample and the D65 white first:   [35.86, 14.30, -45.67]
> ```
> (colour 0.4.7 and develop as of 2026-10-18.) Found while testing color-space against colour-science; color-space's DIN99c and DIN99d apply the step (spaces/din99c.js, spaces/din99d.js).

Done ([colour#1425](https://github.com/colour-science/colour/issues/1425)), the second issue: ECI RGB v2, Best RGB, Don RGB 4 and Ekta Space PS 5 primaries are derived from rounded colorant XYZ, up to 8.4e-4 off the designers' values (docs/errata.md has the numbers and sources).

## [ ] 3. OpenLayers – the drafted note (5 min)

Where: a comment on openlayers/openlayers#16601 (merged 2025-02-02), which notifies its participants (ahocevar, mike-000).
When: after the site deploy that serves conformance.json, and after reading the draft as yours (the apology is your call).

Why: ahocevar spent days on types in colorjs/color-space#57–#63, then removed the dependency: "I found several bugs there that made me doubt the reliability of that library, and the maintainer seemed to be complicated to interact with." No reply since.

Consequences, estimated before sending:
- Reveals: nothing private; admits in public that the type PRs went badly, which the threads already show.
- Easy to refuse: yes, it asks nothing; silence is a fine outcome.
- Commits you to: answering if they reply, and fixing any bug they still name.
- Risk: reading as a pitch to re-add the dependency. The "no ask" line and leaving out downloads and feature lists prevent that.

> @ahocevar, a late follow-up. You were right about the types, and I made contributing them harder than it needed to be in colorjs/color-space#57–#62. I'm sorry for the time it cost you.
>
> color-space 3 is a rewrite: it ships TypeScript types checked in CI, and every space is tested against a cited reference value or differentially against colorjs.io. If a bug you found then is still there, I'd like to know.
>
> No ask: dropping the dependency was a sound call for OpenLayers. If your in-house conversion ever needs checking, https://color-space.io/conformance.json has cited reference conversions (CC0). Thank you for pushing on the types.


## [ ] 4. polychrome.nvim – the one outside project that builds tests from color-space.io data (5 min)
Where: an issue or discussion at github.com/loganswartz/polychrome.nvim. Say thanks, point to conformance.json (a stable file with a source, kind and tolerance for every row) and ask what they need from it. This is a real user's feedback, the scarcest signal there is.

## [ ] 5. Errata to the vendors (10 min each)
Kinefinity (KineLOG3 spec: "IRE 0.09" is 9.29 IRE) and HunterLab (AN 1016: bRd printed as Y/Yn − Y/Yn). Contact forms, short, with the correct value and the proof. Mark each entry "reported" in docs/errata.md.

## [ ] 6. culori – offer conformance.json (optional)
A discussion, not a PR: culori shares XYB, Okhsl/Okhsv and the CSS spaces; the rows give it cited cross-checks for free.

## [ ] Owner-only
- Publish the Figma plugin, or strike it from the todo.
- Monthly: `npm run signals`; Umami for space-page sessions and LUT/ICC downloads; Search Console clicks (not impressions) per space page.

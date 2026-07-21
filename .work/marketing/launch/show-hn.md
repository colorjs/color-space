# Show HN draft — web track, day 0

> Post from the personal account, morning US-Eastern, midweek. Link the **atlas**, not the repo (the converter is the demo; the repo is one click away). Stay in the thread all day — the comments are the asset. Re-verify every number the morning of posting (market-data.md).

## Title (70 chars)

    Show HN: Color-space v3 – 162 color spaces in one verified JS library

URL: `https://color-space.io/`

## Body

I maintain color-space, a JS library that started in 2014 as a handful of RGB/HSL conversions. v3 is a rewrite I've wanted for years: 162 color spaces — web, print, film, broadcast, photo, human vision, history — under one small API, with the value ranges each field actually uses (RGB 0–255, Lab 0–100, OKLCH exactly as CSS writes it — no universal 0–1 wrapper).

    import space from 'color-space'
    space.rgb.oklch(255, 128, 0)         // → [0.732, 0.186, 53] — matches CSS oklch()
    space.slog3.rec2020(0.5, 0.5, 0.5)   // Sony camera log → UHD wide gamut

The part I care most about is verification, because color-space formulas rot in the retelling — papers disagree, Wikipedia drifts, and every library quietly copies someone else's bugs. So: every space is pinned to an independently cited conformance anchor (135 reference points, each with a source link); 29 spaces are differential-tested against colorjs.io (the CSS Color spec editors' implementation) in both directions at 1/255; and the camera logs are differential-tested against the Academy's official ACES vendor transforms, with the deltas published [1]. The process caught real errors, including in published papers.

It deliberately isn't a color toolkit — no parsing, interpolation, ΔE, or gamut mapping. That's the application layer; culori or colorjs.io do it well and can sit on top. Keeping it a pure conversion kernel is what keeps one imported space at 0.4–1.5 kB (the full 162-space graph is 55 kB gz — nobody imports that).

The same formulas also leave JavaScript: a WASM batch kernel, composed GLSL/WGSL shader source, ICC profiles, and .cube LUT export — the atlas generates LUTs in the browser for Resolve/Premiere/OBS/ffmpeg, and each file's header carries its own measured deviation.

Site is the interactive atlas: every space has a dossier with its ranges, provenance, references, and live conversion. Public domain (CC0).

[1] https://github.com/colorjs/color-space/blob/master/docs/lut-verification.md

## Prepared answers (don't paste preemptively)

- **"Why not culori/colorjs.io?"** — For common spaces they're great; this is for when they don't have your space (camera logs, appearance models, Munsell, broadcast), when you want conventional ranges, or when you need the conversion independently verified. It's a kernel they could sit on, not a rival toolkit.
- **"162 — padding?"** — Each space is separately importable, cited, and pinned by an anchor; the long tail (36 film/camera spaces, 15 appearance models) is the point. The declined-list (Pantone, NCS, RAL Classic — licensed swatch books, not color spaces) is in the README.
- **"Is the full bundle big?"** — Yes, 55 kB gz for all 162; quote per-space imports (0.4–1.5 kB). Never claim the full graph is tiny.
- **"Ranges are nonstandard!"** — They're the *conventional* ones each field uses (Lab papers write 0–100; CSS writes oklch(0.65 0.25 180); video writes 0–255 or 0–1 by context). The 0–1-everywhere convention is the nonstandard one from the field's perspective.
- **"CAT02 vs Bradford?"** — The ACES vendor CTLs adapt with CAT02 (Sony/ARRI/Canon) or Bradford (Panasonic/RED); color-space uses Bradford per the CSS convention. The published deltas quantify exactly that: ≤0.5% at gamut extremes for CAT02 pairs, 0.03% for Bradford pairs. Details in the doc.

# Reddit drafts — both tracks

> One venue per day (web track) / per week (film track). Read each sub's self-promotion rules the day of posting — several require participation history or ban link posts; where needed, post as text with the link in the body. Disclose authorship in the first line, always. Never post the same text twice — each sub gets its own lead, matched to its pain.

---

## Web track (fire days 2–4 after Show HN)

### r/javascript — the OKLCH/CSS angle

**Title:** `color-space v3 — 162 color spaces, one tiny API, values that match CSS, conversions independently verified`

**Body:**

Author here. v3 of color-space just shipped: 162 spaces (sRGB/P3/Rec.2020, OKLCH/OKLab, CIELAB, CAM16, HCT, Munsell, the full camera-log families, YCbCr/broadcast, historical CIE) behind one API:

    import space from 'color-space'
    space.rgb.oklch(255, 128, 0)   // → [0.732, 0.186, 53] — reads straight as CSS oklch()
    space.oklch.p3(0.65, 0.25, 180)

Two things I think are genuinely different:

- **Conventional ranges.** RGB is 0–255, Lab is 0–100, hue is degrees, OKLCH matches CSS exactly — no 0–1 mental math against every paper and spec you read.
- **Verification.** Every space is pinned to an independently cited reference point; 29 are differential-tested both directions against colorjs.io (the CSS spec editors' implementation) at 1/255; camera logs are tested against the Academy's official ACES vendor transforms with published deltas.

It's deliberately a conversion kernel, not a toolkit — no parsing/interpolation/ΔE (pair it with culori/colorjs.io for that). One imported space is 0.4–1.5 kB. Public domain.

Atlas with live conversion + per-space dossiers: https://color-space.io

### r/webdev — the converter-led angle (shorter)

**Title:** `Interactive atlas of 162 color spaces — live conversion, ranges, provenance, and downloadable LUTs/ICC for each`

**Body:** Author here — built as the reference I wished existed while implementing them: every space's conventional ranges, lineage, cited sources, live converter, and per-space exports (CSS, GLSL, WASM, .cube LUT, ICC). The library under it is open (CC0), tree-shakeable, and independently verified — details on each dossier. Feedback very welcome, especially on spaces you actually use.

### lobste.rs

Story link to `https://color-space.io/`, tags `javascript, web, graphics`. No self-text needed; first comment = the Show HN body's verification paragraph, condensed.

---

## Film track ladder (one per week, after the LGG thread exists to cite)

> Template per sub: lead with THEIR camera's pain in the title; free artifact first, library never mentioned before the last line; "conversion, not look" disclosure always present; cite the LGG thread once it survived. Check each sub's rules — r/davinciresolve and camera subs generally allow genuinely free tools with disclosure.

### Week 2 — r/davinciresolve

**Title:** `Free .cube conversion LUTs for every camera log (S-Log3, LogC3/4, V-Log, C-Log, D-Log, Apple Log…) — generated in-browser, verified against the official ACES transforms`

**Body:**

Author disclosure: I build the open-source library behind this. The site generates technical conversion LUTs in your browser — pick camera log → pick target (Rec.709, sRGB, P3, Rec.2020/PQ/HLG), download 17³/33³/65³. No email, no watermark, public domain.

Honesty first: these are **colorimetric conversions, not looks** — no tone mapping or highlight rolloff, so scene-referred log to Rec.709 clips above diffuse white by design. Use them for normalization, monitoring, QC, and batch work (they load in Resolve's 3D LUT slot, ffmpeg `lut3d`, OBS); grade on top. If you want ARRI's or Sony's rendering, use their look LUTs — different tool.

Accuracy: the seven pairs with official Academy transforms are differential-tested against them (worst case ≤0.5% at gamut extremes, fully explained by the CAT02/Bradford adaptation convention — full table and method linked from every download). Each .cube's header also states its own measured lattice deviation. [LGG scrutiny thread: link]

https://color-space.io — LUT export is on every camera-log page.

### Week 3 — r/SonyAlpha

**Title:** `Free verified S-Log3 conversion LUTs — both gamuts (S-Gamut3 and S-Gamut3.Cine), any target, generated in-browser`

**Body:** same skeleton, Sony-specific: which gamut your camera menu is set to matters and the site has both as separate, correctly labeled sources; deltas vs Sony's own published ACES matrices are 0.5% worst-case (published per pair); conversion-not-look disclosure; link the S-Log3 and S-Gamut3.Cine dossiers directly.

### Week 4 — iPhone filmmaking (r/iPhoneography / mobile-filmmaking subs)

**Title:** `Free Apple Log → Rec.709 (or P3/HDR) conversion LUTs, generated in-browser — no email wall`

Apple Log is the highest-search-velocity trigger; keep the body three sentences: what it is, conversion-not-look, link.

### Week 5 — r/dji

**Title:** `Free D-Log conversion LUTs for any target — in-browser, verified, no signup`

### Week 6 — r/videography (the generalist wrap-up)

**Title:** `A free atlas of every camera log — what each actually is, plus instant conversion LUTs`

Lead with the *reference* value (the dossiers explain each log's curve, gamut, ranges, provenance) — this sub responds to education better than tools.

### ACEScentral (separate, not a ladder rung)

Post in the tools/implementations category: the ACES-side story — 2065-1/cc/cct/cg/proxy as first-class conversion nodes, the CSC differential harness, the deltas table, and an explicit request for review of the CAT-convention notes. This community is the bridge to the ASWF orbit (track 3's corporate door).

---

## Post-mortem discipline (every post)

Log: date, venue, title used, response (upvotes/comments/traffic), questions asked. Each question = a dossier or docs improvement that week. Kill any venue after two attempts with no signal; double down where questions came from working colorists.

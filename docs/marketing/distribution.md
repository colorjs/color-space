# Distribution & social — get color-space in front of the crowd

> Right crowd × right channels × built-in spreadability. Derived from [audience.md](audience.md) and [positioning.md](positioning.md).
> This is an open-source library, not a paid product — so the channels are: discoverability, community, and word-of-mouth. No ads, no funnel. The currency is *trust and usefulness.*

---

## The starving crowd (where they already gather)

Pick the crowd before the channel. color-space's most starving, least-contested crowds:

1. **Film/video color devs** — ACEScentral forums, r/colorists, r/cinematography (tech threads), three.js/Babylon color discussions, the `colour-science` community. *Almost no JS option exists for them — highest relief on first contact.*
2. **Color-science / academia** — citation-driven; they find you via Google ("CAM16 javascript", "Munsell renotation js") and via the cited README.
3. **OKLCH/P3 adopters** — the CSS color community (around colorjs.io, culori, Lea Verou's orbit, the CSS Color spec). Large and active right now — OKLCH adoption is the live trend (Schwartz: "timing").
4. **Data-viz & creative coding** — Observable, d3, three.js, p5 communities.

---

## Fix the social surfaces first (cheapest, highest leverage)

These are passive — they work on every link, forever. Most are currently empty.

| Surface | Current | Fix |
|---|---|---|
| **GitHub repo "About"** | minimal | One-liner: *"Every color space, one API — 151 of them, CSS-native ranges, verified."* + link to landing page |
| **GitHub topics** | sparse | `color`, `color-space`, `color-conversion`, `oklch`, `css-color`, `color-science`, `cam16`, `aces`, `hdr`, `wide-gamut`, `munsell`, `javascript` — topics drive GitHub's own discovery |
| **Repo social preview image** | likely default | Set a social-preview PNG (logo on a spectral swatch field + "151 color spaces, verified") — controls how every GitHub link unfurls |
| **Landing page OG/Twitter meta** | absent | `og:image`, `og:title`, `og:description`, `twitter:card` (see [surfaces.md](surfaces.md)) — right now shared links unfurl blank |
| **npm description + keywords** | flat | see [surfaces.md](surfaces.md) §2 |
| **README hero** | undifferentiated | see [surfaces.md](surfaces.md) §1 |

Do these before any launch — a launch drives traffic into surfaces; empty surfaces waste it.

---

## The launch (v3 is the moment)

v3 is a real "why now": the CSS-native ranges rework + the jump to 151 spaces. That's genuine news (Caples: news headline). Sequence:

1. **Prep:** surfaces fixed (above), CHANGELOG sharp (terse one-liners — see the global release-notes rule), landing page live, examples runtime-verified.
2. **Show HN** — title: *"Show HN: color-space v3 — 151 color spaces in one tree-shakeable JS library, verified against colorjs.io."* Body: the origin (wanted CAM16 + camera logs + oklch in one place with CSS ranges), the verification story (corrects paper errors), what it deliberately *isn't* (kernel not toolkit), link to the live converter. HN rewards substance + the "what it's not" honesty.
3. **Reddit:** r/javascript, r/webdev (lead with OKLCH/CSS-native angle); r/colorists, r/cinematography (lead with camera-log/ACES angle — different headline per subreddit, same product).
4. **lobste.rs** (`web`, `javascript`), **the CSS/color community** (colorjs.io/culori discussions, CSS-Tricks/front-end newsletters).
5. **The live converter is the share object** — it's the demo that makes the post. Lead links with it, not the repo.

Match the message to the subreddit's awareness: web crowds are Solution-Aware on color libs (differentiate vs culori); film crowds are Problem-Aware with no JS solution (lead with "finally, in JS").

---

## Dream 100 (audiences already holding our buyers)

Get in front of audiences someone else already gathered. Targets (give value first, don't extract):
- **CSS/color:** Lea Verou & the colorjs.io / W3C CSS Color circle; Andreas Larsen (Evercoder/culori); Björn Ottosson (OKLab); Adam Argyle (CSS); front-end newsletters (Frontend Focus, CSS Weekly).
- **Color science:** the `colour-science` community; RIT MCSL; color-science educators.
- **Film/video:** ACEScentral; camera-LUT tool authors; three.js color maintainers.
- **Data-viz/creative:** Observable, Nadieh Bremer, the d3/three.js/p5 orbits.

The relationship is collaborative, not competitive: color-space can sit *under* culori/colorjs.io/chroma as a conversion substrate — that's a genuine reason for those maintainers to care.

---

## Make it spread (STEPPS levers, strongest first)

- **Social currency (strong):** the remarkable facts people share to look in-the-know — *"151 color spaces"*, *"it corrects errors in published color-science papers"*, *"convert S-Log3 to Rec.2020 in the browser"*, *"it has Munsell, bidirectionally."*
- **Practical value (strong):** the live converter and the cited reference list are genuinely useful — people share tools that save colleagues time.
- **Stories:** the origin story (built a complete, verified collection; found the papers disagreed) — brand is load-bearing, survives retelling.
- **Public:** the converter is shareable/embeddable; "Made with color-space" in dependent tools.
- **Triggers:** tie to recurring cues — every OKLCH/P3 blog post, every "how do I convert X to Y" question is a trigger to mention it.

Weakest lever to shore up: **public visibility** — there's no social preview, no embeddable widget yet. Fix the OG image first.

---

## Content (give until they ask)

Low-volume, high-value, evergreen — fits a library project (not a daily-posting brand):
- **"One space explained" series:** short posts/threads, each taking one exotic space (CAM16, Munsell, S-Log3, OSA-UCS, Coloroid) — what it is, why it exists, a live-converter link. Each is permanent SEO + a Dream-100 conversation starter + practical value. Give away the *understanding*; the library is the implementation.
- **The verification write-up:** the differential-testing methodology and the paper corrections — pure credibility content for the science crowd; the kind of thing that gets cited.
- **Comparison content** already exists ([library-comparison.md](../library-comparison.md)) — keep it honest and current (it's at 71/93; update to 151). Honest comparisons rank and get linked.

CTA on every piece: soft — "it's all in `npm i color-space`, live converter here." No hard pitch; the audience is trained to reward value.

---

## Honesty guardrail (non-negotiable)

The verification claim is the entire moat. State it *precisely* — which spaces, which reference (colorjs.io / CSS spec editors), which tolerance (1/255), which directions — never rounded up to "100% verified." Same for "151": it's a runtime-verified count of real, separately-importable transforms, each cited. Substance first; *truthful, attractive, then famous* — in that causal order. One faked proof point would cost more than the whole launch earns.

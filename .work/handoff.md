# Handoff — 2026-10-03

State of the marketing/integrations push, for whoever picks it up next. Verified research
(primary sources, skeptic-checked) lives in `.work/research/*.md`; `<session-scratch>` paths in
those files pointed at throwaway harness scripts and are gone.

## Live on master (deployed)

Name views orbit like the index; clean dossier URLs; ACEScg Bradford fix; four camera logs
(Apple Log 2, F-Log2 C, GP-Log2, KineLOG3); editor-aware LUT export; PY + EMBED tabs, `?embed`,
vision lens, Cite; MCP server (annotations, structured output, gamut + css tools, server.json);
Figma plugin source; CITATION.cff; workbench prototypes at `/workbench/`.

## In the open PR (branch `claude/hopeful-wright-hzzfs4`)

- Samsung Log (`samsunglog`) and Insta360 I-Log (`ilog`) from the owner's vendor documents —
  anchors cite Table 1 / the 1D LUT / the I-Log table; vendor files are NOT in the repo
  (redistribution isn't ours to grant). 168 spaces.
- HLSL + MSL: `gl/naga.js`, `gl/hlsl.js`, `gl/msl.js` translate the verified WGSL with naga.
  `naga-wasm` is an OPTIONAL peer (package keeps zero install deps) + exact devDependency;
  `web/vendor/naga-wasm/` follows the libheif vendoring idiom (test pins it byte-identical).
  `.github/workflows/shaders.yml` (DXC/FXC/Metal) passed on its first PR run.
- Follow-ups: one CSS serializer (`css.js`) for site + MCP + workbench; display names from one
  source; Umami analytics (OFF until `UMAMI` in `web/js/track.js` holds the website id);
  guarded storage for embeds; stale counts in third.html.
- GL harness: NaN outputs now fail the float comparator (the old one passed NaN as 'not worse');
  `dkl` verified against the JS. Benchmark: `benchmark/compare.js` passed a channel count to
  `wasm.alloc()` (which takes pixels), so WASM rates were computed over a third of the work —
  fixed; README/marketing/library-comparison now quote measured figures unrounded.
- rec2020 in the CSS tab: CSS Color 4's `rec2020` uses a pure 2.4 gamma (BT.1886 — css-color-4
  Overview.bs + conversions.js), the library's `rec2020` uses the BT.2020 OETF, so the tab says
  CSS can't name it directly instead of emitting a `color(rec2020 …)` that decodes differently.
- Atlas workshop: the header is decided – the Drawer (`top-drawer.js/.css`: Studio's masthead over the Drawer's
  cells; the other four headers are retired, in git history before this round) – and the hero is the workshop:
  `web/workbench/atlas.html?hero=<key>`, nine variants (`hero-<key>.js/.css`, contract at the top of `atlas.js`,
  shared helpers in `hero.js`; the chooser at `/workbench/` lists them). On a page wide enough for the ladder the
  masthead and every hero hang on the catalog's grid: identity and labels in the ladder column, the color and the
  hero's text where the spaces start. The ladder's foot carries Family · Purpose · Era (index.html's tabs); the View
  menu repeats them for narrow pages. Menus: options borderless (as Draw's); Runs in has icons (CSS braces, GLSL
  mesh, WASM's notched square, a LUT lattice); Vision is its own cell, each option a hue wheel seen through that
  lens (phones fold it into View's menu). Grid columns are fixed – N featured over N + 1 tiles, 3 · 4 on a desktop,
  2 · 3 docked or at ~1100 px, 1 · 2 on phones – the size dial is gone (it never reached rows or the list). The
  List (spec sheet) is one table per shelf beside its title, columns fixed so they line up; narrower pages drop
  channels/white, then maker/shape, then curve/runs. The dock loads `index.html?s=<space>&embed` (index.html now
  accepts that address for embed and keeps the rest of the query when it normalizes `?s=`), so it works from the
  source tree too – the stamped `/<space>` pages exist only in a build.
- Atlas, second round (owner's notes of 2026-10-03, quoted below): the hero is no search – Palette is retired,
  Promise (one promise, the facts, the catalog as the way in) is the default. The workshop panel has three
  studies, each in the URL: Hero (nine), Shelves (where Family · Purpose · Era sits – the ladder's foot, its
  head, or "168 spaces by Family ▾" in the masthead) and Swatch (rhombus · circle · square · chip – one shape
  for every mark of a color: the masthead's color and swatches, slider thumbs, plane cursors, the menus' dots,
  a hero's marks; `--mk-*` tokens in atlas.css, the contract in atlas.js). Only the masthead pins: the cells wait
  under it once the page scrolls and come down while the header is pointed at, focused or has a menu open (CSS
  – the cells' sticky top moves). The color value shows whole, at the catalog's precision; Try becomes Recent
  once a person has picked colors (the ones before the current, this browser only). The featured row is the
  layout's – as many per shelf as the grid has columns, starred first. Purpose tips are sentence case; every
  menu's options are as compact as Draw's. Search: Esc clears, then leaves. The ladder no longer stacks
  titles: the waiting pile stays out until it fits, and at the catalog's end the titles fade before they would
  meet (a view timeline on #cat). After the catalog: index.html's API (its tabs, the LUT and ICC exporters
  live) and its questions, borrowed from index.html at runtime – one source of their words – on the hanging
  grid; their #space links open the dossier, #color links set the color; ॐ joins the legal row. `boot()`
  fires one `wb:color` with the arrival color, so a hero needs no first-frame workaround.
- Atlas, third round (owner's notes of 2026-10-04, quoted below): the hero is the owner's Search – one field for a
  color or a space over a conic burst of every hue at the current color's lightness and chroma, turned so the
  current hue points up (a registered `--hs-h` eases the turn); Enter, a chip, the eyedropper or the picker move
  the page into the atlas – the masthead, clear over the burst at the top, fills with the color as the page
  scrolls, and its search and swatches step aside while the field is on screen (scroll-driven: `scroll(root)` and
  the field's view timeline via `timeline-scope`). Words go to the masthead's search – one search, two places.
  The Drawer's cells moved under the hero: they open the atlas and tuck under the masthead past it. Each family's
  description sits under its name in the ladder column; the content starts with the spaces (the ladder's fit now
  counts the first description, measured as --tip0). Every card's channel values are index.html's fields: type
  over them, ↑ ↓ and the spinners step one displayed unit (held, they repeat), Enter takes, Esc puts back; the
  strip pointed at or dragged lights its field in the current color, a focused field lights its strip's thumb, and
  the cursor steps aside while a strip is dragged (shared in variants-catalog.js, used by variants.html too). The
  dossier opens as the site's modal by default – the 56rem card over the lit page, the header live above it, the
  page held still, a click beside it closes; the bar names the neighbours (‹ HSM · OKLCH · CIELAB ›) – with the
  side dock one study away (?dossier=side). The modal shadow is a token now (`--modal-shadow`), the site's .mbox
  uses it too.
- Atlas, fourth round (owner's notes of 2026-10-05): the swatch is a rhombus and the shelves' cut sits at the
  ladder's foot (both studies retired); the dossier is the modal only – its card at its natural height (the frame
  grows to the dossier), the page layer scrolling it, the site's footer bar (« family · ‹ prev · next › · family »)
  pinned to its foot, the card over the cells, ✕ in its corner. Each family's description sticks under its title
  while the family is on screen. Lineage left the heroes: it is the section after the atlas (lineage.js/.css). An
  image dropped or pasted anywhere is a source, as on the site: every strip wears its histogram (image.js; the
  catalog's painters take extra lane painters through `lanes`). The search hero: "Every color space." and the
  promise; a quiet field – the color itself as the picker, "Any color or space", a color off the screen; recent
  colors when there are some, else five to try; the facts as wide as their words; the burst is the real OKLCH
  hue × chroma slice at the current lightness (sRGB's gamut at that L, the hue up, the color a rhombus at its
  chroma, captioned) or rays (?burst=rays); centered or left (?lay=left). Enter floods the color out from the
  field, then the atlas slides up over the pinned hero (a curtain; the hero settles back as it goes).
- Dossier bake (`scripts/bake-dossiers.js`): it had baked another space's dossier into 132 of 168 name
  views – the ambient hue orbit repainted the open dossier every frame (software GL in headless Chrome),
  starving the idle slices that wire catalog rows, so clicks on unwired rows were no-ops and the previous
  dossier was captured. Now: reduced motion (no orbit – the DEFAULT state hydration rebuilds, and builds
  are deterministic), a click repeated until the router names that space, and a failing build otherwise;
  `check-site.js` asserts each baked name view carries its own source link.
- Translations: `wip/i18n` merged; the page's text is wired (1260 keys); pt-BR, es, tr translated by AI
  in three passes, 1260/1260 current each; the build stamps `/<lang>/` + 168 space pages per language,
  `noindex` and unlisted until `@meta.reviewed` names a native reader. Their reads caught errors in the
  English: 15 facts fixed at the source with citations (commit b9ed2cc), then the FAQ's grouping wording and
  a stale palette name. Side-contents titles wrap (balanced) when a translation outgrows the rail.
  Verified with JS off: a `/<lang>/` page shares no prose with English beyond names, files and URLs.

## Owner decisions (verbatim where quoted)

- Prototypes first: "I want to prototype designs, not to have thorough detailed view, to select the
  design from. And then invest time into full version."
- Atlas is the direction: "organic iteration of current design … after lots of adjustments".
  No 2px gaps between strips (visual noise). Side panel must keep the current dossier's layout and
  features. Quantization = dropdown with every kind. Keep the view switch incl. slider kinds.
  Hero + options bar was "a chaotic mess – needs workshop of variants"; likes the Studio top panel;
  likes Search's minimalism and side display but it was "too collapsed".
- GP-Log2: "whatever would be the least confusing" → scene linear (0.18 = middle grey), like
  every other log here; GoPro's clip-relative 0.0517 is noted in the dossier.
- Zenodo enabled; the DOI is minted by the next `release.yml` run (it creates the GitHub Release).
- Header (2026-10-03, on `/variants.html`): "studio look for header is pretty good there, except for
  selectors can be dropdowns to be shorter"; "the drawer style is pretty good as well – it has nice icons
  but could have not the full-width dropdowns" → Atlas · Drawer. The owner picks the variant for the site.
- Atlas, 2026-10-03: "hero cannot be search I think – besides it's strange when hero opens some modal for
  search instead of inviting to the main page"; featured spaces: "favor layout there (as current website
  does) rather than semantics – just display last 3/2/1 (depending on media) featured spaces"; "keep filters
  row showable on-hover in sticky mode"; "replace [Try] with recent colors once we have selected something";
  "workshop picker style everywhere - rhombus vs circle vs square vs what else?"; the FAQ must not go missing.
- Atlas, 2026-10-04: "the category descriptions should come under the category names, not in the content. Content
  should start with color-space sliders right away"; "Slider inputs should have the number spinners and react to
  up/down"; "when we drag slider we can hide cursor"; the channel highlight "as in the current website"; the side
  info "in modal – to make sure we didn't lose anything from the current website … the 3d shape should not be
  damaged"; on the hero: "I feel like we're trying to force something into uncertain user scenarios. One very
  prominent scenario was search indeed … we enter the color or space, and we get scrolled into the "atlas" view
  where the header same-color fill is the chosen color - and the conic gradient gets rotated and changed to the
  selected color."
- Atlas, 2026-10-05: "the section description should stay sticky under the section title"; "keep swatch rhombus,
  shelves ladder foot"; "lineage chart can be a section after the atlas"; the hero: "Every color space" with the
  Promise line, "the search bar is too noisy … placeholder must be much shorter … maybe just picker right away …
  user can also drop an image", recent swatches if persisted else samples, a conic "more justified, not pure
  visual", a more effectful search → atlas transition ("search gets overlapped with the scrolled-on content");
  "I'd pick modal view" – with its footer, over the selector bar, the page scrolling, not the modal; facts "not
  full-width"; workbench left and center layouts and line-drawn bursts.
- "i18n should be done during the build, so that search engines hook up right pages right away without
  JS" – it is: stamped documents carry the translated markup, catalog, head and baked dossier; the
  runtime table only serves what the app renders after load (menus, tooltips, toasts).

## Not done — pick up here

1. **Atlas workshop** – the header is done and the hero is chosen: Search (the other variants stay in the study
   bar for comparison until the owner drops them). Two studies await the owner's pick: the hero's layout (center ·
   left) and its burst (hue × chroma · rays). Then port the Drawer header (with its tucking
   cells), the chosen hero, the cut, the shape, the ladder (with its fit rules) and the grouped list into
   `web/index.html` (the workshop's `[data-wb]` hosts map onto the page's existing controls; `atlas.js`
   documents the contract).
2. ~~**Shader tabs on the site**~~ – done: GLSL · WGSL · HLSL · MSL in the dossier's GL tab, naga lazy on
   the first HLSL/MSL pick, check-site pins each language's entry name and the on-demand load.
3. **Translations (pt-BR, es, tr)** – built, wired, translated; not yet reviewed. To promote a language:
   a native speaker reads `/<lang>/` (served locally after `npm run landing`), settles the open questions at
   the end of `web/i18n/GLOSSARY.md`, then sets `"@meta": { "reviewed": "<name, date>" }` in
   `web/i18n/<lang>.json` – the build then indexes it, adds hreflang + sitemap alternates, and lists it in
   the English select. An English edit marks its key stale: `node scripts/i18n-extract.js --todo <lang>`
   prints what a language still needs. Known gaps: descriptive display names ("Maxwell triangle", "Gray",
   "Wavelength") come from data.json and stay English in titles and cards; `ui.palette.near` names the
   palette by its id; Turkish decade labels read "{d} yılları" (one template can't carry 1990’lar / 2000’ler).
4. **Smaller** – done: the WASM tab quotes 1.38–4.78×; `variants-data.js` reads CSS capability from
   css.js and alt.html drops rec2020; the dead USES fallback is deleted (a test requires `@use`);
   `paintBarGL` takes the palette metric (check-site samples per metric); culori is 30 spaces with no
   HSLuv (culori 4.0.2's registered modes); README notes naga-wasm's Node ≥ 24.12 engines field.
   third.html's CSS notation already came from css.js – nothing left there.

## Owner actions

- Umami Cloud (free Hobby, 100k events/month, custom events): create the site, put its id in
  `web/js/track.js` → `UMAMI`. Cloudflare Web Analytics is the pageview-only fallback.
- Figma: desktop app → Plugins › Development › Import plugin from manifest
  (`plugins/figma/manifest.json`), test in an sRGB and a Display P3 file, publish from the
  development menu; Figma assigns the real id (replace the placeholder in manifest.json).
- Next npm release via `release.yml`: publishes npm, the GitHub Release (→ Zenodo DOI) and, after
  npm, the MCP registry entry (`io.github.colorjs/color-space`).

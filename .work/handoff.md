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
- Atlas, fifth round (owner's notes of 2026-10-05): the burst is rays – the plane and its study retired. Thicker
  rays (ninety, soft-edged), solid and fullest at the centre, thinning into the page; the hint and the swatches'
  label read in body ink over it. The masthead takes the burst's wheel at the same centre (hero-search.js
  measures the field into `--hs-x/--hs-y` on <html>, where `--hs-h` lives now too): scrolling, the wheel comes in
  over the hero, then every hue turns to the current color (`--hs-in`, `--hs-fold`). The masthead's icon buttons
  no longer transition color (it chased the scroll-driven ink every frame and left the theme button dark-on-dark).
  The API block keeps index.html's halves as long as the site does – it takes the label column below 86rem of
  row and stacks under 63.5rem – with index.html's pill icon and gap. The channel spinners hug their numbers.
- Atlas, sixth round (owner's notes of 2026-10-05): Family · Purpose · Era at a card title's size. The search
  hero's field takes a color only – the picker on the left (EyeDropper where the browser has it, else the color
  dialog), an image on the right; words no longer search spaces. Recents keep images too (image.js keeps the image
  at 256 px, the sampler's size, as a data URL; a recent image reads again, squared – a rhombus marks a color). The
  masthead's color value sits on the rhombus's centre (#cval's underline has a transparent twin above). The masthead
  search is an icon beside the language that opens into a field on the color (focus or words; '/' too); phones put
  it on the color's line. Russian: ru.json (AI, three passes against the glossary's new ru column), Inter's Cyrillic
  subset vendored (Google Fonts v20, as the others); the Purpose tab reads «Задача» so the ladder's foot fits its rail.
- Atlas, seventh round (owner's notes of 2026-10-05): the hero is Search and centered – the eight other heroes and the
  left layout retired with their code (git history has them); the workshop bar keeps one study, how the page moves
  into the atlas (?move= curtain · scroll · band – band paints the docked cells in the masthead's color). The field
  reads «Any color or image», no hint until there is something to say, 48 px targets. The burst is 360 rays of one
  width (an svg, non-scaling strokes): crowded into a hue cloud at the centre, parted and faded outward. The
  language select wears the masthead's underline, not a ring. CMYK's maker line is «Eagle Printing Ink Co.».
  Dragging measured ~30 fps: paint is ~4 ms a frame, style ~35 ms and layout ~15 ms – the color is a custom
  property on :root, so each change restyles every element (4–7k). Off-screen tiles and sections now skip their
  work (content-visibility): ~48 fps. The rest needs the color set only where it is drawn, not on :root – a
  single WebGL canvas for the strips would remove the gradient building (~10 ms JS), not the restyle.
- Atlas, eighth round (owner's notes of 2026-10-05): the move is scroll (curtain and band retired). Three studies in
  the workshop bar: head (?head= color · strip · chip · split – what stays pinned: the colored masthead, the cells'
  row, the row led by the color, or a second row of color + drawing + search while the facets scroll away;
  top-drawer.js place() moves the hosts), cells (?cells= rules · plain · underline; a row is a scroll-state
  container, so plain rows take paper only when stuck) and burst (?burst= fine · rays · bold · conic). The burst is a
  WebGL fragment shader now (burst.js): rays of one width, the same centre cloud for each weight (n·w/2π), fading out
  before the hero's foot. The ladder's foot tabs are gone (the View menu's "Arrange by" cuts the shelves). The image
  in use sits in the field as a removable token. The label column narrows on tablets (16rem at 1024 px). Dragging:
  the color reaches :root at most every 160 ms (wb.js ROOT_MS); the pinned rows ([data-cur-live]) and the painted
  entries (.sp carries its own --cur) follow every frame – ~48 → ~110 fps measured, p90 25 ms (the :root catch-up).
- Atlas, ninth round (owner's notes of 2026-10-05): the burst is fine (480 rays × 2 px; studies: dense 720 × 2, thick
  480 × 3); the cells keep their rules – a panel with a hair above and below and short hairs between cells; head
  defaults to chip. Arrange (family · purpose · era) is the row's first cell; For and Age left the row (arranging
  covers them); View is the layout alone; Vision's menu is one column. The first screen ends with the cells' row
  (#hero's height minus --cells-h); the five facts moved to the closing, where the site has its pills. A featured
  space switches sliders ⇄ planes itself (the icon above its preview's right end, on hover; variants-catalog.js
  PVFLIP). The list view drops the star and its tables' last hair (one line between families). Spent spinners hide
  until hovered. On a tablet the questions and the footer take the full width in two columns.
- Atlas, tenth round (owner's notes of 2026-10-06): head settled on chip – the masthead is plain and stays with the
  hero, one row pins (the color, Arrange, the facets, the drawing, the search); the other heads and the masthead's
  wheel retired. The burst is dense (720 × 2 px), its strength a study (?burst= soft · medium · strong, light and dark
  each); how the row draws the color a study (?chip= rhombus · block · swatch). The ladder is one sticky list of the
  families (atlas.js builds it from the shelves; the headings stay for the outline): no fades, it rides off with the
  catalog's end, the description only under the family on screen. Menus carry no title or hint ('Any' only). The
  catalog's cards drop their spinners (the dossier keeps them). The corner (corner.js): the image in use, framed and
  pickable as the site's floater, and the current color – nearest CSS name, hex, rgb(), oklch(), display-p3 – each
  a copy; the workshop bar moved bottom-left. The dossier: a wheel over its card scrolls the modal (the embed's
  .modal no longer contains overscroll); prev/next wrap round the ends; its foot is tighter.
- Atlas, eleventh round (owner's notes of 2026-10-06): the image behaves as the site's – its floater's backing is the
  full picture, a press picks and a drag keeps picking; histograms at index.html's precision (768 bins, 24576
  samples, a 64-row mask with its fill and crest). The current color left the pinned row for the corner, as the
  page's main value (the chip's hosts: mark/picker, value, gamut; then the nearest CSS name and rgb/oklch/p3), lifted
  clear of the first screen's row. The burst is strong (full strength), its ray width a workshop slider (?rw=,
  1–5 px). The flood circle is gone; how a taken color reaches the page is a study (?enter= fly · rays · none). The
  promise's words are doors: the spaces (into the atlas), the years (arrange by era), "Pick a color" (the picker),
  "analyze an image" (the file dialog).
- Atlas, twelfth round (owner's notes of 2026-10-06): the rays are the hero's entrance – they grow out from the field
  as the page opens (no color transition; the fly and the slider retired); 4 px rays; the foot softens to half, the
  cells' row cuts them. One field again for a color or a space's name (words go to the row's search). The promise is
  a study (?line= purpose · runs · ask), its words doors: a purpose cuts the shelves by purpose and opens that
  shelf, a runs-in or range word filters, the years cut by era, pick and image open their dialogs. Arrange is the
  ladder's tabs again (under the list; on a narrow catalog, over it). The list hangs by its shelf: the family on
  screen level with where its spaces start, or with the line under the pinned row once they have passed it
  (atlas.js sets --ly/--li each frame).
- Atlas, thirteenth round (owner's notes of 2026-10-06): no flash on load – the page hides (html.boot) until the
  shell has built header, hero and catalog (3 s fallback). The ladder is index.html's rail again: a full-height column
  sticks; in it each title sits beside its shelf, passed ones piling at the top, coming ones waiting at the bottom
  over the Family · Purpose · Era tabs (atlas.js place()). The cells' row has no top line and sits on the burst,
  which fades out behind it; stuck, it takes paper and a hair below (scroll-state). The title lost its period; the
  promise no longer repeats it ("For gradients that look even, footage to grade, colors to print and colors to
  measure – 168 spaces …"). The corner is the masthead's chip as it was (mark, value, tag), above the row. The
  row's search is gone: the hero's field is the one search – colors and space names.
- Atlas, fourteenth round (owner's notes of 2026-10-06): the rail is index.html's own mechanism – a column as tall as
  the catalog, each title after a measured spacer (its centre on its first space name's), sticky between the passed
  pile at the top and the coming stack at the screen's foot over the tabs; measured once per layout, the browser runs
  the scroll. Descriptions fade in under the family on screen (absolute, over what follows); the last family takes
  over once the catalog's end is on screen. The cells' row has its hair from the start and lines up with the
  content's edges. No count by the wordmark. The promise (?line= scope · tasks · ask) – scope: "168 spaces from web
  to broadcast, film and print, for every purpose, from 1860 to 2026. Ready for CSS, shaders, WASM and LUTs.", each
  word a door (a family, the purpose cut, the era cut, a runs-in filter); pick and image left the line.
- Atlas, fifteenth round (owner's notes of 2026-10-06): the active family's description steps out while the next title
  or the tabs ride over it; the rail re-measures when the catalog's height moves. Planes as tall as three strips,
  labelled as index.html labels them; the preview switch sits higher. Runs in left the filters (it is what the library
  has built so far – a space's fact, kept on its card and in the list). The closing speaks to the developer ("One
  import, every space" and how it goes into code); the site's own title and lede are a hero line (?line=site); the
  count fact became "Cross-disciplinary". The history is one stream – no families (the catalog's sorting, not
  history's) – with sRGB among the milestones. The footer's wall is a study (?foot= flat · hues · tones): the color's
  hue wheel or its tones in four rows quantized ever coarser, the words on a plate of the color.
- Atlas, sixteenth round (owner's notes of 2026-10-06): the hero line is the site's own wording (?line=site, the
  default): "Web, print, photography, film, broadcast, art, science and history – 168 coordinate systems with
  canonical conversions and cited references, in the public domain.", every field a door. The closing is the four
  facts beside the code, no title. The footer is hues by default: its words on the page, the quantized wall under
  them. The history takes the whole width. Where the current color stands is a study (?cur= corner · edge – a strip
  of the color down the right edge, the value running up it · column – a column of its own, the color a square over
  its value).
- Atlas, seventeenth round (owner's notes of 2026-10-06): the line is scope (default; site, tasks, ask stay in the
  study). The footer is hues by default: its words over the wall, no plate (every hue at the color's lightness, so the
  color's ink reads). The current color leads the cells' row again – its rhombus (the picker), its value, its tag; the
  ?cur study retired, the corner keeps only the image.
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

1. **Atlas workshop** – the header is done and the hero is chosen: Search, centered, over rays. One study awaits
   the owner's pick: the promise line. Then port the Drawer header (with its tucking
   cells), the chosen hero, the cut, the shape, the ladder (with its fit rules) and the grouped list into
   `web/index.html` (the workshop's `[data-wb]` hosts map onto the page's existing controls; `atlas.js`
   documents the contract).
2. ~~**Shader tabs on the site**~~ – done: GLSL · WGSL · HLSL · MSL in the dossier's GL tab, naga lazy on
   the first HLSL/MSL pick, check-site pins each language's entry name and the on-demand load.
3. **Translations (pt-BR, es, tr, ru)** – built, wired, translated; not yet reviewed. The owner asked for ru and es
   first (2026-10-05); ru is theirs to read. To promote a language:
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

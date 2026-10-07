# Port: the atlas becomes web/index.html

The owner's decision (2026-10-06): the workbench atlas (web/workbench/atlas.*) is the site. Full port into
web/index.html – prerendered, translated, per-space pages and baked dossiers kept; the atlas and the workbench go.
Owner's calls: the atlas's 7 families replace the 11 sections; images merge (the hero field's image button opens the
site's sample stripe and remembered images; Recent under the field shows colors and images; no floating button);
all views (Grid, Rows, List, the per-card planes switch).

The site's engine stays: one state (`master`, `scheduleFast`/`renderFast`/`settleCatalog`), its painters and tiers,
the dossier modal, routing, i18n, prerender and bake. The atlas's design moves onto it. One template – render.js
`catHTML` – for prerender and runtime. Every step leaves `npm run landing`, `npm run test:browser` and `npm test` green.

## Steps

1. Grouping – categories.js becomes the 7 families (id, name, tip, spaces, from study-families.js); render.js,
   groups.js, the rail and check-site's counts follow. New cat.* keys read English until translated (step 9).
2. Shell – masthead (wordmark, EN, theme, GitHub), the hero (title, promise line with doors, the field: picker,
   words, image; Recent), the burst (burst.js), the cells' row pinned under the hero (the color chip, the facets,
   Draw · Limit · Vision · View), the footer (Install, For agents, legal over the hues wall), the closing
   (Use it in your code, four facts, the API tabs; the questions in two halves). Boot without a flash.
3. Catalog cards – render.js emits the atlas's shelves: lead cards (name, by-line, lede, readings, strips) and tiles
   (name, year, thin strips, readings); the painters paint tiles too; no spinners in the catalog; masonry retires.
4. Rail – the ladder in the atlas's look (icons, counts, the active family's description fading, the tabs at the
   foot), on layoutToc's stacked-sticky mechanism.
5. Filters – the drawer's cells and menus over the site's facets (Range, Shape, Signal, Tone curve, White, More:
   channels, status, coverage); lenses as cells (#qseg, #gseg, #vseg behind Draw, Limit, Vision); View.
6. Views – Rows and List (render.js), the per-card planes switch.
7. Images – the hero's image button opens the sample stripe and remembered images; the floater stays bottom-right;
   Recent under the field (colors and images).
8. History – lineage.js on the site's data, after the catalog.
9. i18n – every new string through t()/data-i18n; npm run i18n; the four languages translated for the new keys.
10. Tests – check-site.js and test/index.js pins rewritten to the new structure; the workbench deleted; README.

## Progress
- 1 Grouping – done (7 families, translations, counts).
- 3 Catalog cards – done: render.js `ent()` emits `.ent.lc` (header.eh: .nm + .by · p.for · .cvs · .chs) and `.ent.tc`
  (header.eh: .nm + .yr · .chs · .cvs); every entry paints; no catalog spinners; the masonry (colize), the sheet-row
  popover, liteOff/ALLS retired; `.lead`/`.tiles` grids sized by `@container secs`; the secondary-gradient throttle
  paints a batch per 16 ms tick so every visible row repaints within 300 ms. The source index.html keeps #cat empty
  (the build bakes it). Full suite green.
- 2 Shell + 5 Filters – done: index.html's masthead is `.top` (wordmark, the stamped language select, theme, GitHub);
  `#hero` (title, the promise line with `data-door` buttons, `form.hfield#hq` – picker `#hpk`, words `#q`, image
  `#him` – the hint `#hhint`, Try/Recent `#htry`, the burst from js/burst.js); the pinned row `.mhead#strip > .cells`
  (the chip `.cx`, facet cells `#c-range|geometry|signal|encoding|white|more`, lens cells `#c-draw|limit|vision|view`)
  with popover menus `.dpop#m-*` built once and restyled per pick (`paintCells`, `paintLens`); the search commits on
  Enter (`qWord`); the image stripe `#uppop` is a popover `#him` invokes (no floating button); the notation list
  `#fmtp` a popover; the closing "Use it in your code" + `.facts`; the footer Install · For agents (`#agentsp`) ·
  legal over the hues wall (`--wall`, written once); Recent colors/images in `localStorage.csRecent`; the dossier
  keeps `.top`, the stuck row and its menus live. Translations for the new keys in es/pt-BR/ru/tr.
- 4 Rail – done: each title carries its shelf's icon (render.js SHELFI), name `.tt` and count; the active family's
  description `.tip` shows under it and steps out (`tipoff`) while the next title or the tabs ride over it (trackAct);
  the rail widens with the screen (`--railw` clamp); narrow screens show each family's `.stip` under its heading.
- 6 Views – done: catHTML(m, secs, { view, cut, sort }) – grid (lead cards, tiles), rows (`.ent.lr`), list (`tr.ent`,
  the spec sheet, a column sorting every space into one shelf); View's menu sets it (kept in `localStorage.csView`);
  a lead card's `.pvs` switch shows its channel pairs as `.pls` planes (GL, CPU fallback), dragging picks both channels.
- 7 Images – done with 2: `#him` invokes `#uppop`; Recent mixes colors and images; the floater lifts above the first
  screen's row.
- 8 History – done: js/lineage.js (lineageHTML, wireLineage), mounted as the reader nears `#lineage`; its hue follows the color.
- 9 i18n – every new string in es/pt-BR/ru/tr; all four stamp every page.
- 10 – done: web/workbench/, web/variants.css, variants-model/catalog/data/bars, study-families/solid/runtime deleted;
  variants-icons.js → icons.js (trimmed to what the site draws), study-render.js → quant.js (the GPU's CPU reference,
  test/quant.js in npm test); README's spaces table regrouped by the 7 families with its curated names.
- Round 5 (owner's review): the rail rests by the first space (layoutToc's `rest`); the grid leads each family with as
  many featured spaces as it has columns (`leadsNow` from CSS `--cols`, rebuild on change); the footer sits lower,
  ॐ at the line's right; the Limit cuts every slider and plane (render.js `LIMIT`/`limitFor`, the catalog's lens);
  every facet is a cell (+ Channels, Coverage, Status; Export retired) and the row lends what it can't hold to More
  (`fitCells`, bodies moved, never copied); no underline on picked values; Draw → Quantize; lead numbers under their
  strips; the solid wears a surface lattice – tone latitudes and hue meridians for a space with a hue (gl.js uGrid).
- Round 6: rail titles keep their spacing to the catalog's end (each title's margin-bottom = what waits below it – the
  sticky margin-box clamp); the closing and the questions take the full width in two halves; the footer a little
  higher; the solid's surface grid removed; More's menus compact (Channels in one row, two columns elsewhere, first
  clause of each gloss, a wider Coverage); sRGB's story shortened to two lines.
- Round 7: every rail title rests on its family's first-space line (one pin for all; a passed title steps out, `.past`);
  the ladder re-measures whenever the catalog's size moves (a tile drawn for the first time shifted every family below
  it); a card opened on the first screen keeps the pinned row live, floating under the masthead (`body.mfloat`, baked
  into the name views), the page restored on close.
- Round 8: the closing is "Use it" – the MCP server joins the usage tabs (MCP), the footer keeps Install and the legal
  line in one column; a window too short to stack the coming rail titles under the resting line keeps the line (they
  wait in their flow places; the window's height re-measures the ladder).
- Round 9: the first rail title never waits in the stack – it enters with its first space; the coming titles stack at
  the screen's foot only once the catalog fills it (`.toc.stacked`, trackAct); the footer's install command centred,
  untitled.
- Round 10: the hero's rays thinner, dense rays prefiltered (mean coverage) so they don't alias; the questions cut to ten (+ color model vs space, + print vs screen; exactness absorbs trust and
  ranges; many, dead, log, HDR, colormaps, mixing out); the language select offers every current translation (search
  still waits for a review: noindex, no hreflang, no sitemap).
- Round 11: every rail title and the tabs in a range of their own (`.trg`, `--rg-y` from layoutToc): the first family's
  opens at the rail's top, each later one under the first family's description and the coming titles before it – the
  waiting stack stays at the screen's foot and the entering first family pushes it down in order (`.toc.stacked` and
  the stack's entrance gate retired); rays 1.5 px; Range and Shape menus one column, every option gloss one line
  (TAGLINE for the facets, menus as wide as their glosses, the whole sentence in the tooltip; Vision's DOI in it too);
  the footer's install command left-set, nearer the footer's top, further from the legal line.
- Round 12: the language is the pinned row's last cell (`#c-lang`, stamped by the build with its menu `#m-lang`):
  each language in its own name, its code as the mark, and its name in the page's language beneath (Intl.DisplayNames);
  the masthead keeps theme and GitHub.
- Round 13: menus open on the side with more room (`position-try-order:most-height`), a thin hair scrollbar if still
  needed; glosses only where a name doesn't say itself (Shape, Signal, Tone curve, White, Limit, Vision – "red-blind"
  etc., the citation in the tooltip); none on Range, Status, Channels, Quantize, View; glosses wrap within a
  `fit-content(16rem)` column; the history grows – the oldest space on the bottom row, each newer laid on top, the
  rising edge the count by year; its title read off the data ("{k} of the {n} were made this century."); the footer's
  install lower, the links centred, ॐ at the line's end; the language select back in the masthead; pt-BR → pt
  ("Português"); right-to-left pages: `dir="rtl"` stamped from Intl text direction, the page's text layout in logical
  properties, drawn things (strips, planes, numbers, history, code, notations) kept left-to-right; zh-Hans, ja, ar
  translations under way.
- Round 14: eight more languages – zh-Hans, ja, ar, de, fr, it, ko, hi (AI, unreviewed; glossary columns and each
  translator's notes in GLOSSARY.md); the dossier's glossary terms match on the language's own word breaks
  (Intl.Segmenter), with Arabic proclitics and Korean particles, a Devanagari vowel sign inside a word; a language ships
  once 95% translated and stays through English edits (stale/new strings read English per key) – review adds search
  only; the bake runs languages side by side (half the cores, BAKE_JOBS to pin it), timeouts for a loaded machine;
  Rows: strips 24px, touching; List: one set of column widths for every family (table-layout fixed), no rule between
  families, the rail's title on the column names, a hair scrollbar.
- Round 15: List – the preview column fixed (6rem), facts at fixed widths, the name and the maker share the rest; new
  columns Coverage (share of the visible gamut, sortable) and Signal; Shape, Curve, Signal and Range drawn as the
  filters' icons (named in their tooltips), merged into one cell below a 76rem sheet; Rows – the channel letter at its
  strip's edge; lαβ's channels are α and β at the source (spaces/lalphabeta.js → data.json, every surface); the bake
  reloads and retries a dossier that won't open once, and its first waits' options now apply (they sat in the arg seat).
- Round 16: drags – a held hand repaints only the strip in hand (the other spaces' strips and their Limit settle once,
  on release); secondary repaints run in a 6 ms per-frame budget, set without a cross-fade while the color moves; the
  cursor hides while a strip or plane is dragged (`.sliding`). Measured against the deleted atlas prototype (same
  machine, same drag): median frame 16.7 ms vs 25 ms, slow frames 20–30% vs 55% (the machine at load ~100, so not a
  clean 60fps reading). Rows: each strip row is its strip's height – no seam. Hero: rays 2 px, grow from the centre on
  the first frame drawn, turn one revolution in 6 min (reduced motion: still). History: "Most were made this century."
  and a dek read off the data (first year, by 1950, the busiest decade – its claims pinned in test/index.js).
- Deploy notes: 13 languages × 169 name views bake for ~40 min on a loaded machine (CI unknown); the bake's first waits
  had their options in the arg seat (default 30 s applied) – fixed; a stuck dossier reloads up to twice; BAKE_LANGS=en
  bakes a subset for a quick local build, BAKE_JOBS=n bakes languages side by side (off by default – it starved pages
  under load). Open: bake only English + reviewed languages; an Action that translates new English strings via Claude.

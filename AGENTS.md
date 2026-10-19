# color-space — working agreements

The web catalog (`web/index.html` + `web/js/*`, built by `npm run landing` → `_site/`) is a
single, coherent design system. The recurring failure mode here is **ad-hoc**: inventing a value,
an idiom, or a JS workaround on the spot instead of reusing what already exists. Don't.

## Consistency — the standing rule

1. **Reuse design tokens. Never hardcode.** Spacing is `--s1..--s12` / `--space-*` (0.25rem
   four-point scale). Type is `--t0..--t6` – one scale, seven fixed steps, each step's role named in `web/tokens.css`. Colors are `--ink/--soft/--body/--paper/
   --panel/--hair/--c`. If a value isn't a token and you're typing a raw `px`/`rem`/`oklch(...)`,
   stop — find the token that means it. New tokens only for genuinely new, reused quantities.

2. **New components mirror existing ones.** Same structure, same class names, same field order.
   The dossier modal order is canonical: **header → tag pill (`.dpills .tag`) → `.dhr` → `.dgrid2`,
   two columns of their own heights: the story (`.desc`, then the record `.props`: channels (its label's tip saying
   what it is), kind …, the primaries | origin, reference, test, source, the matrix with its copy beside its label) |
   the margin (made for · used for · caveat, then the downloads)**; the transfer's formula under its plot (the figure's transfer). Any variant
   (e.g. the proprietary dossier) must read as the same component, not a cousin. Match order and
   naming; don't reorder or rename.

3. **Reuse idioms; don't introduce new ones.** Established affordances: `↗` = opens dossier;
   dim→ink on hover (opacity or `--soft`→`--ink`, as on `.mx`); `.tag` pill; the circle color mark (pickers, swatches – a rhombus read as an animation keyframe, retired 2026-10);
   the pick in `--ink`, the rest `--soft` (the family titles' way; never inverted), plus one ink mark by kind (2026-10):
   a `--ulw` bar under its word, never its icon (tabs in a row or Usage's column, switches, a menu's options – a letter's
   or a digit's at least a mark wide), an overline over the word on the shelf cut and the history's lights; the one pointed
   at a soft bar (`--ulp`) of its own; the rail's family on screen is ink alone.
   Don't invent a new hover color, a new icon, or a new marker when one of these fits. No
   `text-shadow`, ever.

4. **CSS over JS for layout. Never write JS that fights CSS intent.** If an element must sit at
   the screen edge, that's `position:fixed; left:0` — not a `getBoundingClientRect` + inline-style
   pass (that was `placeNav`, deleted 2026-07 for exactly this). Reach for JS only when CSS
   genuinely can't express it (measured masonry balance, virtualization).

5. **Introduce only genuinely new items.** Before adding a class/token/rule, grep for one that
   already does the job. Subtract the redundant; keep the load-bearing.

## Proprietary systems — out of scope (removed 2026-07)

Pantone, NCS, RAL Classic, HKS, Toyo, British Standard, DIN 6164 are named swatch books, not color
spaces — out of scope (README "What it isn't"). They were catalogued in `web/js/barred.js` for a
while, then cut; `barred.js` now exports `[]` and the page's barred wiring is inert (kept resolvable,
not yet deleted). Don't re-add them. If the topic resurfaces: the honest framing is *proprietary /
licensed* (they're technically convertible via lookup — the barrier is the licensed swatch data,
not math), never "not convertible."

## Verify before "done"

Rebuild (`npm run landing`), then check visually via Playwright (cache-bust every nav with
`?cb=<digits>`; `pkill -f mcp-chrome-<id>` if the session wedges). Run `npm test` (the library) and `npm run test:site` (the page, its build, browsers,
accessibility) — 0 `not ok`.
Confirm div-balance and `node --check` on the extracted module. UI: z-index, clipping, focus,
the full open→interact→close lifecycle. Cite an authoritative source for any reference value/range.

## Commits

The owner is the sole author. Never commit under an agent's identity (no `--author`, no
`Claude <noreply@anthropic.com>` git user), no `Co-Authored-By` lines for agents, no
"Generated with" lines. 24 commits of 2026-10 went in as Claude – don't add more.

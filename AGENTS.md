# color-space — working agreements

The web catalog (`web/index.html` + `web/js/*`, built by `npm run landing` → `_site/`) is a
single, coherent design system. The recurring failure mode here is **ad-hoc**: inventing a value,
an idiom, or a JS workaround on the spot instead of reusing what already exists. Don't.

## Consistency — the standing rule

1. **Reuse design tokens. Never hardcode.** Spacing is `--s1..--s12` / `--space-*` (0.25rem
   four-point scale). Type is `--t0..--t4` and `--text-*`. Colors are `--ink/--soft/--body/--paper/
   --panel/--hair/--c`. If a value isn't a token and you're typing a raw `px`/`rem`/`oklch(...)`,
   stop — find the token that means it. New tokens only for genuinely new, reused quantities.

2. **New components mirror existing ones.** Same structure, same class names, same field order.
   The dossier modal order is canonical: **header → tag pill (`.dpills .tag`) → `.dhr` → `.props
   props3` (channels | origin · reference …) → `.desc` description → used-for**. Any variant
   (e.g. the proprietary dossier) must read as the same component, not a cousin. Match order and
   naming; don't reorder or rename.

3. **Reuse idioms; don't introduce new ones.** Established affordances: `↗` = opens dossier;
   dim→ink on hover (opacity or `--soft`→`--ink`, as on `.mx`); `.tag` pill; `.diamond` marker.
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
`?cb=<digits>`; `pkill -f mcp-chrome-<id>` if the session wedges). Run `npm test` — 0 `not ok`.
Confirm div-balance and `node --check` on the extracted module. UI: z-index, clipping, focus,
the full open→interact→close lifecycle. Cite an authoritative source for any reference value/range.

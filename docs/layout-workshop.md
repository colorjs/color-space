# Layout workshop

Build with `npm run landing`, serve `_site/`, and open `third.html`.
The study switch changes the treatment without resetting the current color,
filters, selection or catalog view. The URL retains the direction for comparison:

| Direction | URL | What to judge |
| --- | --- | --- |
| Quiet | `third.html?style=quiet` | Open rows, light controls, clear hierarchy. The baseline. |
| Notebook | `third.html?style=notebook` | Larger family headings and short explanations beneath the filters. More reading room. |
| Studio | `third.html?style=studio` | Soft control groups and lightly contained featured spaces. More approachable, with more visible interface. |
| Instrument | `third.html?style=instrument` | Compact, explicitly labeled fields. Efficient for repeated use, but the strictest treatment. |

These are workshop directions, not a replacement for the canonical design system.
All four use the existing atlas fonts, colors, spacing and interaction tokens.
Warmth is explored through hierarchy, rhythm, grouping and helpful explanations.

## Shared layout

- Seven families use the lineage cut from `alt.html`. HDR is a facet.
- One to three editorial starting points per group have descriptions, dates,
  readings and a choice of three square planes or sliders. The other entries
  have compact sliders. A–Z keeps alphabetical order without featured promotion.
- Density follows the layout; there is no zoom control or library sidebar.
- Family, purpose, era and A–Z arrangement remain immediately accessible.
- Grid is a mixed catalog, list aligns readings and previews, and table compares
  sortable metadata. Search and filters operate on the same complete catalog.
- Details open beside the catalog on desktop and in a modal on mobile.
  The mobile modal contains keyboard focus and returns it on close.
- Filters expose explanations, option counts and a reset. Render controls expose
  continuous/native-step/palette modes and sRGB/P3/Rec. 2020/Surface/Light limits.
  As on the main page, limits affect the dossier while catalog previews retain
  the full light range.

## Rendering

The solid uses `gl.js`'s production tessellation, gamut sources and clipping.
The added contour grid follows native coordinates on the existing surface;
it does not replace or coarsen the mesh. `map.grid` is opt-in, so the main page's
renderer retains its existing appearance. The study frame fitting follows the
main page's declared-range and cap logic. Unsupported GPU spaces display an
unavailable state rather than substitute a different gamut.

Palette definitions, ranges and conversions come from the existing catalog;
this workshop introduces no scientific reference values. The study's frame
adapter can be consolidated with the main dossier when a direction is selected.

## Regression checks

`npm test` covers CPU quantization boundaries and palette-cache call order in
`test/workshop.js`, staged ICC/LUT/WASM imports in `test/index.js`, and GPU pixels
in `scripts/check-site.js`. The GPU checks compare one-pixel bars and planes with
the CPU, then toggle contours on one canvas through RGB → OKLab → RGB. They pin
unchanged surface coverage, partial darkening and restoration of the original
pixels when contours are disabled or omitted.

Suggested next choice: compare Quiet and Studio with the same space open,
then decide whether Notebook's inline filter explanations earn their height.

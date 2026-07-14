# color-space types

Generated from the live registry by `scripts/generate-types.js` (`npm run types`,
part of `prepare`) — do not edit by hand.

* `index.d.ts` / `lite.d.ts` — exactly the runtime surface of each hub: the default
  registry + `register` (no named space exports — those don't exist at runtime),
  plus the `SpaceName` / `LiteSpaceName` id unions.
* `<space>.d.ts` — one per space, for direct `color-space/<name>.js` imports.
* `color-space.d.ts` — the shared `ColorSpace` / `Convert` / `ConvertParam` shapes.
* `hub.d.ts` · `wasm.d.ts` · `gl.d.ts` · `lut.d.ts` · `icc.d.ts` ·
  `whitepoints.d.ts` · `gamuts.d.ts` · `util.d.ts` — the tool modules.

Conversion targets stay an index signature (`[to: string]: any`) by design: the
graph is wired at runtime (`register()` can extend it), so a static member list
would be a lie in both directions.

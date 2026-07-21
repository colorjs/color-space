# color-space types

Generated from the live registry by `scripts/generate-types.js` (`npm run types`,
part of `prepare`) — do not edit by hand.

* `index.d.ts` / `lite.d.ts` — exactly the runtime surface of each hub: the default
  registry + `register` (no named space exports — those don't exist at runtime),
  plus the `SpaceName` / `LiteSpaceName` id unions.
* `<space>.d.ts` — one per space, for direct `color-space/<name>.js` imports.
* `color-space.d.ts` — shared fixed-arity scalar, batch, space, and registry types.
* `hub.d.ts`, `wasm*.d.ts`, `gl*.d.ts`, `lut.d.ts`, `icc.d.ts`, `mcp.d.ts`,
  `transfers.d.ts`, `cie.d.ts`, `whitepoints.d.ts`, `gamuts.d.ts`, and `util.d.ts`
  — exact declarations for every public tool export.

Built-in hub targets are an exact 161-name map, so misspelled spaces and missing
channels fail at compile time. `register(space, reverse)` returns that registry
intersected with the inferred custom space and adds the custom target to every
existing source; both directions remain typed without weakening built-ins to an
open `any` index signature.

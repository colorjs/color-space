# Contributing

Two things help most: a wrong value reported with its source, and a space the catalog lacks, with the document that defines it.

## Report a wrong value

Open a [Wrong value](https://github.com/colorjs/color-space/issues/new?template=wrong-value.yml) issue: the space, the input, what color-space returns, what you expect, and where the expected value is printed (paper, standard, vendor document, or a named implementation and its version). The fix lands with a test row pinned to that source.

## Propose a space

Open a [New color space](https://github.com/colorjs/color-space/issues/new?template=new-space.yml) issue: the name, the defining document, and at least one input → output value printed in it. Swatch books (Pantone, NCS, RAL Classic and similar) are out of scope, see the [README](README.md#motivation).

## Add or fix a space

1. `spaces/<name>.js` – conversions to a neighbour (usually `xyz` or a linear RGB) and back, under the JSDoc header the catalog, the site and `data.json` are built from: the description, `@see` (the defining document), `@wiki`, `@year`, `@by`, `@use`, one `@channel {symbol} min max Name` per channel, `@method`, `@encoding`, `@illuminant`, `@observer`, `@referred`, `@dynamic`, and `@gamut` for RGB spaces (primaries in [gamuts.js](gamuts.js)). Copy the header of a neighbour such as [spaces/prophoto.js](spaces/prophoto.js).
2. Import and register it in [index.js](index.js).
3. [test/refs.js](test/refs.js) – at least one row `{s, f, t, in, out, src, url, kind}` whose `out` is printed by the source (`kind: 'published'`), computed from it by a named reference implementation (`'implementation'`, say which and its version) or plain arithmetic from its definition (`'computed'`). Copy values from the source, never from color-space's own output; the suite checks each channel to 1e-4 of its range.
4. `gl/<name>.glsl.js` – the shader chunk, in the restricted GLSL that [test/gl.js](test/gl.js) checks against the JS in float64. Say so in the pull request if you'd rather leave it to the maintainer.
5. `npm run data && npm run types && npm test` – no `not ok`. The suite also checks that the docs state the live space count.

## Conventions

- Ranges are conventional: each channel in the units its own literature or CSS uses (RGB 0–255, Lab L 0–100, OKLCH as CSS writes it).
- A correction to a published source goes into the space file's implementation notes with its evidence, and into [docs/errata.md](docs/errata.md).
- Contributions are dedicated to the public domain under [CC0](license.md), like the rest of the project.

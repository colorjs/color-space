# Migrating to v3

## From v2

Every claim below is verified against the published `v2.3.2` source — what v2
actually did, not what it was assumed to do.

### 1. Flat arguments; arrays now mean batches

v2 conversions took one array. v3 conversions take flat channel arguments — and
an array is still a legal call: it is the **batch form**, interleaved pixels in,
new `Float64Array` out. A batch of one is exactly the v2 calling convention.

```js
// v2
rgb.lab([50, 50, 50]);

// v3 — scalar form
rgb.lab(50, 50, 50);                  // → [l, a, b]

// v3 — the v2 shape still works: a batch of one
rgb.lab([50, 50, 50]);                // → Float64Array [l, a, b]
rgb.lab([50, 50, 50, 20, 20, 20]);    // → Float64Array, 2 pixels

// optional params keep their v2 place, after the channels / the array
rgb.ycbcr(255, 0, 0, kb, kr);
rgb.ycbcr([255, 0, 0], kb, kr);
```

One shape difference: batch results are `Float64Array`, not `Array` — spread or
`[...result]` first if you need array methods that must return non-typed values.

### 2. Ranges: five spaces rescaled — the rest are unchanged

v2 already used conventional ranges (rgb 0–255, hsl 0–360/0–100/0–100, cmyk
0–100, ycbcr 16–235, lab L 0–100 …). Those did not change. What did:

| Space | v2 | v3 |
|---|---|---|
| `hsm` | all channels 0–1 | H 0–360, S 0–100, M 0–100 |
| `tsl` | all channels 0–1 | T 0–360, S 0–1, L 0–255 |
| `hsi` | I 0–255 | I 0–100 |
| `hcy` | Y 0–255 | Y 0–100 — and reimplemented (the v2 formula was incorrect) |
| `hsp` | P 0–255, outputs rounded to integers | P 0–100, exact outputs |

### 3. `lab` / `lchab` are D50 now

v2 `lab` was D65 (its formula normalized by 95.047/108.883). v3 `lab` uses
**D50** (ICC / CSS Color 4 `lab()` convention); the v2 behavior lives on as
`lab-d65` / `lch-d65`:

```js
// v2 — was D65
import lab from 'color-space/lab.js';

// v3 — explicit D65 equivalent of v2
import lab from 'color-space/lab-d65.js';

// v3 — D50 (ICC / CSS `lab()`)
import lab from 'color-space/lab.js';
```

Declared bounds were also made truthful — `lab` a/b are ±125 (v2 declared ±100
while the formula always exceeded it), `luv` u/v ±215, and so on. For such
spaces only the metadata moved; conversion outputs are identical.

### 4. Removed `min` / `max` / `channel` / `alias` — use `range`

```js
// v2
space.rgb.min;          // [0, 0, 0]
space.rgb.max;          // [255, 255, 255]
space.hsl.channel;      // ['hue', 'saturation', 'lightness']
space.lab.alias;        // ['LAB', 'cielab']

// v3
space.rgb.range;        // [[0, 255], [0, 255], [0, 255]]
space.hsl.range;        // [[0, 360], [0, 100], [0, 100]]
```

Channel names, refs, provenance and more moved to `color-space/data.json` (`data.spaces`)
(`meta.hsl.channels`). Aliases are gone — address spaces by canonical name.

### 5. `ciecam` and `cubehelix` removed; `munsell` works now

- v2's `ciecam.js` (registered as `cam`) was a one-way `xyz→cam` stub. v3 ships
  the full bidirectional **`ciecam02`**, plus the CAM16 family and successors.
- v2's `cubehelix` is gone: it is a colormap — a single fraction painted to a
  color — not a color space you convert between, so it falls outside the library's
  scope (README "What it isn't"). No replacement; `import cubehelix from
  'color-space/cubehelix.js'` and `space.rgb.cubehelix(…)` no longer resolve.
- v2's `munsell` was an unfinished stub whose single conversion referenced an
  undefined variable. v3 implements the 1943 renotation, bidirectionally — code
  addressing it will now actually convert.

### 6. Custom spaces must connect in both directions

`register()` now preserves the library's any-to-any guarantee. Methods on the new
space point outward; the second argument supplies the matching existing→new edges.
Disconnected, duplicate, and reserved names are rejected, and neither input object
is mutated.

```js
import { register } from 'color-space';

const extended = register({
  name: 'unit-rgb',
  range: [[0, 1], [0, 1], [0, 1]],
  rgb: (r, g, b) => [r * 255, g * 255, b * 255],
}, {
  rgb: (r, g, b) => [r / 255, g / 255, b / 255],
});

extended['unit-rgb'].oklch(1, 0.5, 0);
extended.oklch['unit-rgb'](0.7, 0.15, 40);
```

### 7. New since v2 — not breaking, worth knowing

- 162 spaces (v2 had 41): P3, Rec.2020/2100, ACES, 30+ camera logs, appearance
  models, historical systems.
- Any-to-any conversion: the graph wires every pair by shortest path (v2
  required a path through rgb/xyz to exist).
- Tiers beyond the catalog: `color-space/lite` (the compact working set, plain
  JS), `color-space/wasm` (same set, prebuilt WASM batch kernel),
  `color-space/gl` (GLSL/WGSL chunks), `color-space/lut` (.cube export).
- `data.json` (per-space provenance/channels/refs + gamuts, whitepoints, CMFs, conformance), `gamuts.js`, `whitepoints.js`.

---

## Migrating from v1 to v2

> [!WARNING]
> v2 works only in ESM environments. For CJS please use a bundler.

Replace imports like `var rgb = require('color-space/rgb')` with `import rgb from 'color-space/rgb.js'`.

Test thoroughly.

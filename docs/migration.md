# Migrating to v3

## From v2

Every claim verified against the published `v2.3.2` source.

### 1. Flat arguments; arrays mean batches

```js
rgb.lab([50, 50, 50]);               // v2
rgb.lab(50, 50, 50);                 // v3 scalar → [l, a, b]
rgb.lab([50, 50, 50]);               // v3 batch of one → Float64Array [l, a, b]
rgb.lab([50, 50, 50, 20, 20, 20]);   // batch, 2 pixels
rgb.ycbcr([255, 0, 0], kb, kr);      // optional params keep their v2 place
```

Batch results are `Float64Array`, not `Array` — spread first if you need plain arrays.

### 2. Five spaces rescaled — the rest unchanged

| Space | v2 | v3 |
|---|---|---|
| `hsm` | all 0–1 | H 0–360, S 0–100, M 0–100 |
| `tsl` | all 0–1 | T 0–360, S 0–1, L 0–255 |
| `hsi` | I 0–255 | I 0–100 |
| `hcy` | Y 0–255 | Y 0–100 · reimplemented (the v2 formula was incorrect) |
| `hsp` | P 0–255, rounded outputs | P 0–100, exact |

### 3. `lab` / `lchab` are D50 now

v2 `lab` was D65. v3 follows ICC / CSS Color 4: `lab` is D50, the v2 behavior lives on as `lab-d65` / `lch-d65`. Declared bounds are truthful now (`lab` a/b ±125, `luv` u/v ±215) — metadata only, outputs identical.

### 4. `min` / `max` / `channel` / `alias` → `range` + data.json

```js
space.rgb.range;   // [[0, 255], [0, 255], [0, 255]]
```

Channel names, refs, provenance: `color-space/data.json`. Aliases are gone — use canonical names.

### 5. `ciecam` and `cubehelix` removed; `munsell` works now

- `ciecam` (a one-way stub) → full bidirectional `ciecam02`, plus the CAM16 family.
- `cubehelix` is a colormap, not a space — removed, no replacement.
- v2 `munsell` was a broken stub; v3 implements the 1943 renotation bidirectionally.

### 6. Custom spaces connect both ways

```js
import { register } from 'color-space';

const extended = register({
  name: 'unit-rgb',
  range: [[0, 1], [0, 1], [0, 1]],
  rgb: (r, g, b) => [r * 255, g * 255, b * 255],
}, {
  rgb: (r, g, b) => [r / 255, g / 255, b / 255],
});
```

Disconnected, duplicate and reserved names are rejected; neither input is mutated.

### 7. New since v2

162 spaces (v2: 41) · any-to-any by shortest path · `lite` / `wasm` / `gl` / `lut` / `icc` tiers · `data.json`, `gamuts.js`, `whitepoints.js`.

## From v1 to v2

ESM only — for CJS use a bundler. `require('color-space/rgb')` → `import rgb from 'color-space/rgb.js'`.

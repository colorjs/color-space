## Migrating from v2 to v3

### 1. Flat arguments

Conversion functions now take individual channel arguments, not an array.

```js
// v2
rgb.lab([10, 20, 30]);

// v3
rgb.lab(10, 20, 30);

// spread an array
rgb.lab(...arr);
```

### 2. Conventional ranges

Values are no longer normalized to 0–1. Each space now uses its conventional range.

| Space | v2 (0–1) | v3 (conventional) |
|---|---|---|
| RGB | `rgb.hsl(1, 0.5, 0)` | `rgb.hsl(255, 128, 0)` |
| HSL | H/S/L all 0–1 | H: 0–360, S/L: 0–100 |
| Lab | L: 0–1, a/b: ±1 | L: 0–100, a/b: ±125 |

**Predefined-RGB spaces** (`p3`, `rec2020`, `a98rgb`, `prophoto`) stay **0–1** — this matches the CSS `color()` function syntax.

```js
// v2 — normalized
rgb.hsl(1, 0.5, 0.25);
lab.rgb(0.5, 0.1, -0.2);

// v3 — conventional
rgb.hsl(255, 128, 64);
lab.rgb(50, 12.5, -25);
```

Multiply/divide to convert stored v2 values:

```js
// v2 stored value → v3 call
const [r, g, b] = storedNormalized;
rgb.lab(r * 255, g * 255, b * 255);

// v3 result → v2 normalized storage
const [L, a, b] = lab.rgb(50, 0, 0);
const stored = [L / 255, a / 255, b / 255];
```

### 3. Removed `min` / `max` / `channel` / `alias`

These properties are gone from space objects. Use `range` for channel bounds, and the docs for channel names.

```js
// v2
space.rgb.min;          // [0, 0, 0]
space.rgb.max;          // [1, 1, 1]
space.hsl.channel;      // ['hue', 'saturation', 'lightness']
space.lab.alias;        // [...]

// v3
space.rgb.range;        // [[0, 255], [0, 255], [0, 255]]
space.hsl.range;        // [[0, 360], [0, 100], [0, 100]]
space.lab.range;        // [[0, 100], [-125, 125], [-125, 125]]
// channel names: see JSDoc or README
```

### 4. Lab / LCHab are now D50

`lab` and `lchab` use the **D50** reference white (ICC / CSS Color 4 convention). In v2 they were effectively D65.

If your code relied on the v2 D65 behavior, switch to `lab-d65`:

```js
// v2 — was silently D65
import lab from 'color-space/lab.js';

// v3 — explicit D65 equivalent
import lab from 'color-space/lab-d65.js';

// v3 — D50 (ICC / CSS `lab()`)
import lab from 'color-space/lab.js';
```

### 5. Renamed: `rec2100pq` / `rec2100hlg` → `rec2100-pq` / `rec2100-hlg`

```js
// v2
import rec2100pq  from 'color-space/rec2100pq.js';
import rec2100hlg from 'color-space/rec2100hlg.js';

// v3
import rec2100pq  from 'color-space/rec2100-pq.js';
import rec2100hlg from 'color-space/rec2100-hlg.js';
```

---

## Migrating from v1 to v2

> [!WARNING]
> v2 will work only in ESM environment. For CJS please use bundler.

Replace imports like `var rgb = require('color-space/rgb')` with `import rgb from 'color-space/rgb.js'`.

Test thoroughly.

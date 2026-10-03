# Benchmarks

Performance comparison of color-space against other popular JavaScript color libraries.

## Running Benchmarks

First, install dependencies:

```bash
npm install
```

Then run the benchmark suite:

```bash
npm run benchmark
```

## Libraries Compared

- **color-space** (this library) - Conventional ranges, 168 color spaces
- **color-space/lite** - the same formulas behind the 27-space hub (no HSL, no P3)
- **culori** - Normalized ranges (0-1), 25 color spaces, comprehensive
- **colorjs.io** - Normalized ranges (0-1), 40 color spaces, CSS Color spec reference
- **@texel/color** - Normalized ranges (0-1), 16 color spaces, WebGL-focused
- **chroma-js** - Popular library, 15+ color spaces, data visualization focus
- **tinycolor2** - Lightweight, common color spaces (RGB, HSL, HSV)
- **color** - Simple API, basic color spaces and manipulation
- **color-convert** - Lightweight, pure conversion functions, 20+ color spaces
- **d3-color** - D3's color module: RGB, HSL, Lab, HCL, Cubehelix

## What's Being Measured

The benchmark measures the speed of common color space conversions:

1. **RGB → Lab** - sRGB to CIELAB conversion
2. **Lab → RGB** - CIELAB to sRGB conversion
3. **RGB → HSL** - sRGB to HSL conversion
4. **HSL → RGB** - HSL to sRGB conversion
5. **RGB → Oklab** - sRGB to Oklab conversion
6. **Oklab → RGB** - Oklab to sRGB conversion
7. **RGB → P3** - sRGB to Display P3 conversion
8. **RGB → HSV** - sRGB to HSV conversion
9. **RGB → HEX** - sRGB to hexadecimal string

Each case is warmed with 20,000 calls, then timed as the median of 7 rounds of 100,000 calls. Inputs rotate through a fixed 256-color table, precomputed in each library's own units: with literal arguments V8 can inline a pure conversion and fold it to a constant, which times code that no longer runs (on Node 22, d3-color rgb → lab measured 47 M op/s on literals vs 2.6 M on varied input).

**Note**: Not all libraries support all color spaces. Unsupported conversions are omitted, never timed.

The run closes with **Speed**, the figure the README table quotes: the geometric mean of M op/s over the 7 shared conversions (rgb ⇄ lab · hsl · oklab, rgb → p3), each library over the subset it implements, with color-space on that same subset alongside for a like-for-like reading. Two batch sections follow, over a 1M-pixel interleaved buffer: rgb → oklab per library (color-space's batch API and WASM kernel, the others a per-pixel loop over their scalar API — none ships a batch API), then the WASM speedup over the JS batch API for every WASM-covered target.

## Interpreting Results

- **Ops/sec**: Operations per second (higher is better)
- **Time/op**: Time per operation in microseconds (lower is better)
- **vs fastest**: How many times slower than the fastest library (1.00x = fastest)

Excerpt of a real run (2026-10-03, Node 22.22, Intel Xeon 2.1 GHz):

```
RGB → Lab:
────────────────────────────────────────────────────────────────────────────────
Library                   Ops/sec      Time/op   vs fastest
────────────────────────────────────────────────────────────────────────────────
color-space ⚡               3.37M    297.126ns        1.00x
color-space/lite            3.31M    302.106ns        1.02x
culori                      3.28M    304.999ns        1.03x
colorjs.io                194.46K      5.142µs       17.31x
d3-color                    2.35M    425.744ns        1.43x
chroma-js                   1.56M    641.050ns        2.16x
color-convert               2.57M    388.449ns        1.31x
```

## Performance Notes

- Performance varies by:
  - Hardware (CPU speed, cache size)
  - JavaScript engine (Node.js version, V8 optimizations)
  - System load

- **Choose based on your needs**:
  - **color-space**: Most comprehensive (168 spaces), conventional ranges (CSS-matching)
  - **culori**: Design-focused, comprehensive, smaller bundle
  - **colorjs.io**: W3C standard reference, CSS Color spec editors
  - **@texel/color**: WebGL-optimized, minimal, very fast
  - **chroma-js**: Popular, great for data visualization
  - **tinycolor2**: Lightweight, simple API, common spaces only
  - **color**: Simple API, basic operations, easy to use
  - **color-convert**: Minimal, pure conversion functions, no objects

## API Differences

Different libraries use different value ranges and APIs:

```javascript
// color-space: Conventional ranges (matches CSS)
space.hsl.rgb(270, 67, 50);  // H:0-360°, S/L:0-100%

// culori, colorjs.io, texel: Normalized ranges
culori.rgb({ mode: 'hsl', h: 270, s: 0.67, l: 0.5 });  // All 0-1 (except hue)

// chroma-js: Chainable API
chroma.hsl(270, 0.67, 0.5).rgb();

// tinycolor2: Object-based
tinycolor({ h: 270, s: 0.67, l: 0.5 }).toRgb();

// color: Chainable with conventional ranges
color.hsl(270, 67, 50).rgb().array();

// color-convert: Pure functions
colorConvert.hsl.rgb(270, 67, 50);
```

Each library is timed through its own native API, with inputs precomputed in its own units, so no scalar case pays for a range conversion inside the timed loop (the batch loops read a 0–255 buffer, as an image is stored, and the 0–1 libraries divide by 255 per pixel).

## Adding More Tests

Edit `benchmark/compare.js` to add custom tests:

```javascript
{
  name: 'My Test',
  // `i` picks an entry of the input tables; return the result so it escapes the loop
  colorSpace: (i) => { const k = at(i); return space.rgb.lab(RGB[k], RGB[k + 1], RGB[k + 2]) },
  culori: (i) => { const k = at(i); return culori.lab({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
  // ... other libraries
}
```

## Continuous Benchmarking

For CI/CD integration, run benchmarks as part of your workflow:

```yaml
- name: Run benchmarks
  run: npm run benchmark
```

Results can help detect performance regressions across versions.

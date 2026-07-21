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

- **color-space** (this library) - Conventional ranges, 162 color spaces
- **culori** - Normalized ranges (0-1), 25 color spaces, comprehensive
- **colorjs.io** - Normalized ranges (0-1), 40 color spaces, CSS Color spec reference
- **@texel/color** - Normalized ranges (0-1), 16 color spaces, WebGL-focused
- **chroma-js** - Popular library, 15+ color spaces, data visualization focus
- **tinycolor2** - Lightweight, common color spaces (RGB, HSL, HSV)
- **color** - Simple API, basic color spaces and manipulation
- **color-convert** - Lightweight, pure conversion functions, 20+ color spaces

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

Each test runs 100,000 iterations to provide stable measurements.

**Note**: Not all libraries support all color spaces. Results marked as "null" indicate the library doesn't support that particular conversion.

## Interpreting Results

- **Ops/sec**: Operations per second (higher is better)
- **Time/op**: Time per operation in microseconds (lower is better)
- **vs fastest**: How many times slower than the fastest library (1.00x = fastest)

Example output:

```
RGB → Lab:
────────────────────────────────────────────────────────────────────────────────
Library              Ops/sec       Time/op   vs fastest
────────────────────────────────────────────────────────────────────────────────
color-space ⚡       2.45M         0.408µs        1.00x
culori               1.98M         0.505µs        1.24x
colorjs.io           1.12M         0.893µs        2.19x
@texel/color         2.31M         0.433µs        1.06x
```

## Performance Notes

- Performance varies by:
  - Hardware (CPU speed, cache size)
  - JavaScript engine (Node.js version, V8 optimizations)
  - System load

- Typical results show < 2x difference between libraries for most operations

- **Choose based on your needs**:
  - **color-space**: Most comprehensive (162 spaces), conventional ranges (CSS-matching)
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
culori.rgb({ h: 270, s: 0.67, l: 0.5 });  // All 0-1 (except hue)

// chroma-js: Chainable API
chroma.hsl(270, 0.67, 0.5).rgb();

// tinycolor2: Object-based
tinycolor({ h: 270, s: 0.67, l: 0.5 }).toRgb();

// color: Chainable with conventional ranges
color.hsl(270, 67, 50).rgb().array();

// color-convert: Pure functions
colorConvert.hsl.rgb(270, 67, 50);
```

This affects comparison fairness, as range conversion adds overhead. The benchmarks measure real-world usage of each library's native API.

## Adding More Tests

Edit `benchmark/compare.js` to add custom tests:

```javascript
{
  name: 'My Test',
  colorSpace: () => {
    space.rgb.lab(0.5, 0.3, 0.8);
  },
  culori: () => {
    culori.lab({ mode: 'rgb', r: 0.5, g: 0.3, b: 0.8 });
  },
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

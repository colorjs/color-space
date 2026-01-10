## v3

### Critical
  * [ ] Bump version to 3.0.0 (currently 2.3.1)
  * [ ] Fix p3/rec2020/a98rgb/prophoto ranges — declared 0-255 but actually 0-1
  * [ ] Create docs/library-comparison.md (referenced in README)
  * [ ] Create docs/formula-verification.md (referenced in README)
  * [ ] Write v2→v3 migration guide (currently commented out)
  * [ ] Fix type extensions: lrgb.ts, xvycc.ts, yccbccrc.ts → .d.ts

### Defects
  * [ ] osaucs.xyz() throws 'Unimplemented'
  * [ ] rgb.cubehelix() throws 'not implemented'
  * [ ] uvw.js: _u/_v division unprotected for _v=0
  * [ ] osaucs.js: X+Y+Z division without zero check
  * [ ] rg.js: chromacity sum=0 for black unhandled
  * [ ] Add NaN guards to critical conversion paths
  * [ ] Delete types/munsell.d.ts (no implementation exists)

### Missing Type Definitions (32 files)
  * [ ] oklch, okhsl, okhsv, oklrab, oklrch
  * [ ] jzazbz, jzczhz, rec2100-pq, rec2100-hlg, ictcp
  * [ ] p3, p3-linear, prophoto, prophoto-linear
  * [ ] a98rgb, a98rgb-linear, acescg, acescc
  * [ ] rec2020, rec2020-linear, rec2020-oetf
  * [ ] cam16, hct, hcl, gray, rg
  * [ ] din99o-lab, din99o-lch, xyb
  * [ ] lab-d50, xyz-d50, xyz-abs-d65

### Documentation
  * [ ] Clarify test count: README says 1,371 but runner shows ~1087
  * [ ] Pick consistent space count (72 vs 71+)
  * [ ] Add CHANGELOG.md
  * [ ] Add JSDoc to hct.js, cam16.js
  * [ ] Add @example tags to spaces

### Cleanup
  * [ ] Remove duplicate constrain() in hct.js (use cam16's)
  * [ ] Replace minified hsluv.js with maintainable version
  * [ ] Remove min/max from types/color-space.d.ts (not in v3)
  * [ ] Unify variable style: var → const
  * [ ] Fix benchmark/compare.js line 87 (uses 0-1 range, should be 0-255)

### Missing Tests
  * [ ] Edge cases: NaN, Infinity, negative values
  * [ ] Implement osaucs → xyy (marked test.todo)
  * [ ] Roundtrip precision tests (A→B→A error accumulation)
  * [ ] Out-of-gamut tests (RGB > 255, negative)
  * [ ] cam16/hct viewing condition variations


---

## Core
  * [ ] All available color space conversions
  * [x] color-io conversions
  * [ ] All todo/fixme
  * [x] All current spaces, cleaned up and tested

## [ ] WASM versions

## [ ] WebGL versions

## [ ] Tests
  * [x] Edge values per 1/2/3 channels
  * [x] Consistency of back-forth transforms
  * [x] Correctness of all tests by ref values
  * [ ] Palette renderer

## [ ] Website
  * [ ] Write via playwright
  * [ ] All spaces
  * [ ] Benchmark
  * [ ] Alt analysis

## Future
  * [ ] AI-training
  * [ ] All possible visualisations
  * [ ] Education about color spaces
  * [ ] CSS Color Level 5 relative color syntax hooks
  * [ ] Gamut metadata (display-referred vs scene-referred)
  * [ ] Consistent file naming (kebab-case vs flat)


## [ ] mat3 * vec3 separate operation

+ separates concern, DRY
+ lots of code reuse (many places), less space
+ we can store matrices separately, rather than functions
+ can possibly be done as SIMD
+ WebGL-friendly
- introduces some utility file
- less readable, less self-documenting
- slightly slower

## [ ] Comparison table with color spaces

  * Purpose
  * Comparison with other alternatives
  * Channels with limits
  * Conversion formulas
  * Which spaces directly converts to

## [ ] Demo

  * All color spaces
  * Color picker with color space switch
  * Visualizer with limits

## [ ] Psychedelic fullscreen color picker

  * All spaces at once
  * Rendering limits

## [ ] Test

  * Color palette renderer for the space
  * Edge values
  * Wrong values
  * Correctness of all test cases (paper)
  * Edge values: pure red, pure green, pure blue, cyan, yellow, magenta, white, black
  * Consistency of back-forth

## [ ] Competitors analysis
  * size
  * spaces
  * performance
  * types
  * ecosystem

## [ ] Proof
  * Blending
  * Color gamut
  * Munsell data
  * See culori, color tests

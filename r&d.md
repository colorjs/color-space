## [x] Normalize srgb? -> not just srgb, all spaces

  + sRGB and derivatives (h*) are primarily exceptional unnormalized space.
  + Broadly speaking channel limits have referential (meta) purpose, not calculatory
  + Very often we normalize internal calcs to/from 0..255, so that adds friction
  + color.io is normalized to 0..1
  + i8 -> f32/f64

## [x] Replace vector arg with arguments `rgb([r,g,b])` to `rgb(r,g,b)` -> let's try

  + cleaner
  + removes semantic concept of "Vector"
  + resolves 1-channel spaces conflict `cubehelix(intensity)` vs `cubehelix([intensity])` - cubehelix, gray and others
  + when compiling to WASM allows avoid using GC for arrays: simply multiple args, multiple returns
    - tuples are not necessarily more expensive in wasm
    - WASM is surprizingly slower than JS by at least 10%
  + no need for options argument
  - breaking change
  - vector is natural group holder: it combines both color space sample and channel values
    - vectors are supported by all programming languages
  - it makes harder to compose transforms like `rgb.lrgb(channels) |> lrgb.xyz(%)`, `lrgb.xyz(...rgb.lrgb(channels))`
    ~ only `...` is needed, but that's whole iterator instead of simple reading vals
      + this can be optimized that multiple returns go directly from stack to the following fn - it only needs chaining on JZ side
    + there's strong argument that tuples need allocation, compared to direct args in register, which makes them slow
  - in js tuples are significantly faster
    ~ everything related to spread or destructuring is slow. Taking reference and feeding again is even faster than tuple
    + sending individual channels directly is even faster `.rgb(a[0],a[1],a[2])`

  deepseek analysis
  + clarity - lab.rgb(1,2,3) is self-documenting
  + ergonomics for common use-cases - most users work with individual channels, avoids wrapping into arrays
  + arrays can be simply spread
  + Three.js, chroma.js use `new THREE.Color(r, g, b)`

## [x] Ranges -> try no ranges

  1. `min: [a, b, c], max: [a, b, c]`
    + no need to break v2

  2. `range: [[from, to], [from, to], [from, to]]`
    + more compact
    + has range pairs in place
    ~ `cmy.min[0]` vs `cmy.range[0][0]`

  3. `channel: [{name:'red', range:[0,255]}, {name:'green', range:[0,255]}, {name:'blue', range:[0,255]}, ]`
  3.1 `channel: {red: [0,255], green: [0,255], blue: [0,255]}`
    + order is keys order
    + names is channel names
    + range naturally
    ~ mb channels is long name.
      ~ component, value?
    - complicated access to min/max of 1st channel, eg. now `cmy.min[0]` then `cmy.channel[??][0]`

  4. Do we even need ranges?
    + theoretical spaces like lab, xyz don't have defined ranges
    + these ranges can be used as a convention only
    + ranges per-channel can be interdependent, like lightness is not available for some values of saturation or hue (beyond srgb)
    + that would save space
    + ranges are conventional, transforms themselves don't have ranges

## [x] Alias - do we need that? -> no

- It takes up space
- It includes useless cap case change - capcase is not good
- Usually alias is a sign of bad design or lack of research / certainty
  - We can ask AI which kind of alias is more widespread
- Anyways we don't have channel aliases
- We can put alias to docs

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

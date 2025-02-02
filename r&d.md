## [x] Normalize srgb? -> not just srgb, all spaces

  + sRGB and derivatives (h*) are primarily exceptional unnormalized space.
  + Broadly speaking channel limits have referential (meta) purpose, not calculatory
  + Very often we normalize internal calcs to/from 0..255, so that adds friction
  + color.io is normalized to 0..1
  + i8 -> f32/f64

## [x] Replace vector arg with arguments `rgb([r,g,b])` -> `rgb(r,g,b)` -> yes

  + cleaner
  + removes semantic concept of "Vector"
  + resolves 1-channel spaces conflict `cubehelix(intensity)` vs `cubehelix([intensity])` - cubehelix, gray and others
  + on compiling to WASM allows avoid using GC for arrays: simply multiple args, multiple returns
  + no need for options argument

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

## [x] Alias - do we need that? -> no

- It takes up space
- It includes useless cap case change - capcase is not good
- Usually alias is a sign of bad design or lack of research / certainty
  - We can ask AI which kind of alias is more widespread
- Anyways we don't have channel aliases
- We can put alias to docs

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

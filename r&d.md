## [ ] Comparison table with color spaces

  * Purpose
  * Comparison with other alternatives
  * Channels with limits
  * Conversion formulas
  * Which spaces directly converts to

## [ ] Normalize srgb?

  + sRGB and derivatives (h*) are primarily exceptional unnormalized space.
  + Broadly speaking channel limits have referential (meta) purpose, not calculatory
  + Very often we normalize internal calcs to/from 0..255, so that adds friction

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

## [ ] Proof
  * Blending
  * Color gamut
  * Munsell data
  * See culori, color tests

## [ ] Ranges

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

## [ ] Alias - do we need that?

- It takes up space
- It includes useless cap case change - capcase is not good
- Usually alias is a sign of bad design or lack of research / certainty
  - We can ask AI which kind of alias is more widespread
- Anyways we don't have channel aliases
- We can put alias to docs

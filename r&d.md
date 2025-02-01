## [ ] Comparison table with color spaces

  * Purpose
  * Comparison with other alternatives
  * Channels with limits
  * Conversion formulas
  * Which spaces directly converts to

## [ ] Normalization?

  1. `rgb.hsl(, {normalize:true})`

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

## [ ] Ranges

1. `min: [a, b, c], max: [a, b, c]`

2. `range: [[from, to], [from, to], [from, to]]`
+ more compact
+ has range pairs in place

## [ ] Alias - do we need that?

- It takes up space
- It includes useless cap case change - capcase is not good
- Usually alias is a sign of bad design or lack of research / certainty
  - We can ask AI which kind of alias is more widespread
- Anyways we don't have channel aliases
- We can put alias to docs

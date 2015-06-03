# Color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space) [![Code Climate](https://codeclimate.com/github/dfcreative/color-space/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/color-space) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

<img src="https://raw.githubusercontent.com/dfcreative/color-space/gh-pages/logo.png" width="100%" height="150"/>

Conversions and data for the following color spaces:

* [x] RGB
* [x] HSl
* [x] HSV (HSB)
* [x] [HWB](http://dev.w3.org/csswg/css-color/#the-hwb-notation)
* [x] CMYK
* [x] CMY
* [x] [XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space)
* [x] XYY (YXY)
* [x] [LAB](http://en.wikipedia.org/wiki/Lab_color_space)
* [x] LCH<sub>ab</sub>
* [x] [LUV](http://en.wikipedia.org/wiki/CIELUV)
* [x] [LCH<sub>uv</sub>](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation)
* [x] [H<sub>u</sub>SL](http://www.boronine.com/husl/)
* [x] [H<sub>u</sub>SL<sub>p</sub>](http://www.boronine.com/husl/)
* [x] [LAB<sub>Hunter</sub>](http://en.wikipedia.org/wiki/Lab_color_space#Hunter_Lab)
* [ ] [LMS](http://en.wikipedia.org/wiki/LMS_color_space).
* [ ] [YUV]()
* [ ] [YIQ]()
* [ ] [CIE CAM]()
* [ ] [Other spaces](#contribute)

#### [Demo & tests](https://cdn.rawgit.com/dfcreative/color-space/master/test/index.html)


## Usage

`$ npm install --save color-space`

```js
var colorSpace = require('color-space');

//convert lab to lch
var result = colorSpace.lab.lch([80,50,60]);
```

Require separately:

```js
var rgb = require('color-space/rgb');
var hsl = require('color-space/hsl');

//convert rgb to hsl
rgb.hsl([200,230,100]);
```


## API

Convert one space to another:

```js
<fromSpace>.<toSpace>(array);
```

Get space data:

```js
<space>.name //space name
<space>.min //channel minimums
<space>.max //channel maximums
<space>.channel //channel names
<space>.alias //alias space names, if any
xyz.whitepoint //list of whitepoint references
lms.transform //list of transform matrices
```


## Contribute

Please fork, add color space with basic conversions to/from XYZ or RGB and tests.

_Color-space_ is supposed to be a basic library to work with color conversions, an enhanced replacement for [color-convert](https://github.com/harthur/color-convert). It has maximally minimal API and functions, the goal of project is to provide the most complete set of color spaces with minimal and uniform API.


## Similar projects

* [color-convert](https://github.com/harthur/color-convert)
* [chromatist](https://github.com/jrus/chromatist)
* [spectra](https://github.com/avp/spectra)
* [colorspaces.js](https://github.com/boronine/colorspaces.js)


[![NPM](https://nodei.co/npm/color-space.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/color-space/)

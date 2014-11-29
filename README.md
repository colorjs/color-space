# Color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space)

[![NPM](https://nodei.co/npm/color-space.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/color-space/)

Math and data behind color spaces and color conversions. _Color-space_ provides a uniform interface to well-known color spaces: RGB, HSl, HSV (HSB), [HWB](http://dev.w3.org/csswg/css-color/#the-hwb-notation), CMYK, [XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space), XYY (YXY), [LAB](http://en.wikipedia.org/wiki/Lab_color_space), LCH<sub>ab</sub>, [LUV](http://en.wikipedia.org/wiki/CIELUV), [LCH<sub>uv</sub>](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation), [H<sub>u</sub>SL](http://www.boronine.com/husl/), [H<sub>u</sub>SL<sub>p</sub>](http://www.boronine.com/husl/), [LAB<sub>Hunter</sub>](http://en.wikipedia.org/wiki/Lab_color_space#Hunter_Lab).

<!--
#### [Converter demo](https://cdn.rawgit.com/dfcreative/color-space/master/test/index.html)
-->


# Use

`$ npm install color-space`

Include all spaces:

```js
var spaces = require('color-space');

//convert lab to lch
spaces.lab.lch([80,50,60]);
```


If you aware of size, you can include only needed spaces:

```js
var rgb = require('color-space/rgb');
var hsl = require('color-space/hsl');

//convert rgb to hsl
rgb.hsl([200,230,100]);
```

Use [browserify](https://github.com/substack/node-browserify) to use in a browser.


# API

Convert one space to another:

```js
var fromSpace = 'rgb', toSpace = 'hsl';

spaces[fromSpace][toSpace](array);
```

Space data:

```js
space.name //space name
space.min //channel minimums
space.max //channel maximums
space.channel //channel names
space.alias //alias space names, if any
xyz.whitepoint //list of whitepoint references
```


# Contribute

Please fork, add color space & basic conversions (to/from XYZ or RGB), tests. _Color-space_ is supposed to be a basic library to work with color conversions, an extended replacement for [color-convert](https://github.com/harthur/color-convert).


<a href="http://unlicense.org/UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="40"/></a>
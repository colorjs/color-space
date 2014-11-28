# color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space)

Math and data behind color spaces and color conversions. _Color-space_ provides uniform interface to all known color-spaces. [Converter & tests](https://cdn.rawgit.com/dfcreative/color-space/master/test/index.html).

[![NPM](https://nodei.co/npm/color-space.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/color-space/)


# Use

`$ npm install color-space`

To include all spaces:

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
*.name //space name
*.min //channel minimums
*.max //channel maximums
*.channel //channel names
*.alias //alias space names, if any
xyz.whitepoint //list of whitepoint references
```

Available spaces:

* rgb
* hsl
* hsv (hsb)
* hwb
* cmyk
* xyz ([CIE XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space))
* lab ([CIE Lab](http://en.wikipedia.org/wiki/Lab_color_space))
* lch (CIE LCHab&thinsp;—&thinsp;cylindrical LAB)
* luv ([CIE Luv](http://en.wikipedia.org/wiki/CIELUV))
* lchuv ([CIE LCHuv](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation))
* [husl](http://www.boronine.com/husl/), [huslp](http://www.boronine.com/husl/)


# Contribute

Please fork, add color space & basic conversions (to/from XYZ or RGB), tests.


<a href="http://unlicense.org/UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="40"/></a>
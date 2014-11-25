# color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space)

Math and data behind color spaces and color conversions. [Converter & tests](https://cdn.rawgit.com/dfcreative/color-space/master/test/index.html).

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

Convert from one space to another:

```js
var fromSpace = 'rgb', toSpace = 'hsl';

spaces[fromSpace][toSpace](array);
```

Get space data:

```js
space.name //space name
space.min //channel minimums
space.max //channel maximums
space.channel //channel names
space.alias //alias space names, if any
space.illuminant //space-specific properties
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


To see details `console.log(space)`.



# Contribute

Please fork, add color spaces/convertions. If you add a new space, make sure you have implemented at least to/from _XYZ_ or to/from _RGB_ conversion functions. Don’t forget to add a test-case.

This is meant to be a basic library that can be used by other libraries to wrap color calculations in some cool way.



<a href="http://unlicense.org/UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="40"/></a>
# color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space)

Math and data behind color spaces and color conversions.

[![NPM](https://nodei.co/npm/color-space.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/color-space/)

[Tests]().

## Use

`$ npm install color-space`

Use [browserify](https://github.com/substack/node-browserify) to use in browser.

```js
var convert = require('color-space');

//convert rgb to lch
convert.rgb.lch([200,230,100]);
```

## API

Convert from one space to another:

```js
var fromSpace = 'rgb', toSpace = 'hsl';

convert[fromSpace][toSpace](array);
```

Get space data:

```js
convert[space].min //channel minimums
convert[space].max //channel maximums
convert[space].channel //channel names
convert[space].alias //alias space names, if any
```

Available spaces:

* rgb
* hsl
* hsv (hsb)
* hwb
* cmyk
* xyz (ciexyz)
* lab (cielab)
* luv (cieluv)
* lch (cielch)


To see details `console.log(convert)`.



## Color-convert differences

Color-space was initially a fork of [color-convert](https://github.com/harthur/color-convert), but then it was separated into a standalone module with the next changes:

* Keyword space is replaced with [color-name](https://github.com/dfcreative/color-name/), because it is not a space, it is a different kind of knowledge about the color.
* Removed wrapper code: you have a natural wrapper already — [harthur/color](https://github.com/harthur/color) or a faster fork [dfcreative/color](https://github.com/dfcreative/color).
* `conversions.js` are placed to index.js for better use.
* [pending] CIE spaces.
* [pending] HUSL spaces (great thanks to Alexei Boronine for his [HUSL](https://github.com/boronine/husl)).
* Minimums, maximums, channel names and aliases info.
* Better structured, easier exported (esp. for webworkers).
* No result rounding — she can always do it by herself.
* Unlicensed.

# Contribute

Please fork, add conversions, figure out color profile stuff for XYZ, LAB, etc. This is meant to be a basic library that can be used by other libraries to wrap color calculations in some cool way.



<a href="http://unlicense.org/UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="40"/></a>
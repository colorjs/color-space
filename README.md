# color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space)

Math and data behind color spaces and color conversions. [Converter & tests](https://cdn.rawgit.com/dfcreative/color-space/master/test/index.html).

[![NPM](https://nodei.co/npm/color-space.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/color-space/)


## Use

`$ npm install color-space`

Use [browserify](https://github.com/substack/node-browserify) to use in browser.


To include all spaces at once:

```js
var spaces = require('color-space');

//convert lab to lch
spaces.lab.lch([80,50,60]);
```


To include one target space:

```js
var rgb = require('color-space/rgb');
var hsl = require('color-space/hsl');

//convert rgb to lch
hsl.lch([200,230,100]);
```


## API

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
* xyz (ciexyz)
* lab (cielab)
* luv (cieluv)
* lch (cielch)


To see details `console.log(space)`.



# Contribute

Please fork, add conversions, figure out color profile stuff for XYZ, LAB, etc. This is meant to be a basic library that can be used by other libraries to wrap color calculations in some cool way.



<a href="http://unlicense.org/UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="40"/></a>
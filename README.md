# color-space

Math and data behind the color spaces and conversions. The most complete color-conversions node module so far. Initially fork of [color-convert](https://github.com/dfcreative/color), separated to a standalone module.

Differences with initial color-convert:

* no keywords (isn’t a space - actually, it is a different king of knowledge + extra bytes saved)
* no wrapper code (you have a natural wrapper - [color.js](https://github.com/dfcreative/color))
	* conversions.js are placed to index.js for better use
* CIE spaces
* HUSL spaces (thanks to Alexei Boronine)
* Ranges list
* Better structured (no need `2` in function name)
* No rounding result - one can always do it himself

Color-convert is a color conversion library for JavaScript and node. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, and CSS keywords:

```javascript
var converter = require("color-convert")();

converter.rgb(140, 200, 100).hsl()   // [96, 48, 59]

converter.keyword("blue").rgb()      // [0, 0, 255]
```

# Install

### node

For [node](http://nodejs.org) with [npm](http://npmjs.org):

	npm install dfcreative/color-convert

### browser

Download the latest [color-convert.js](http://github.com/harthur/color-convert/downloads). All the methods are on the `colorConvert` object.

# API

```javascript
require("color-convert").rgb2hsl([140, 200, 100]);   // [96, 48, 59]
```

### Unrounded
To get the unrounded conversion, append `Raw` to the function name:

```javascript
convert.rgb2hslRaw([140, 200, 100]);   // [95.99999999999999, 47.619047619047606, 58.82352941176471]
```

### Hash
There's also a hash of the conversion functions keyed first by the "from" color space, then by the "to" color space:

```javascript
convert["hsl"]["hsv"]([160, 0, 20]) == convert.hsl2hsv([160, 0, 20])
```

### Other spaces
There are some conversions from rgb (sRGB) to XYZ and LAB too, available as `rgb2xyz()`, `rgb2lab()`, `xyz2rgb()`, and `xyz2lab()`.

# Contribute
Please fork, add conversions, figure out color profile stuff for XYZ, LAB, etc. This is meant to be a basic library that can be used by other libraries to wrap color calculations in some cool way.

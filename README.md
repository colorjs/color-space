# Color-space [![Build Status](https://travis-ci.org/dfcreative/color-space.svg?branch=master)](https://travis-ci.org/dfcreative/color-space) [![Code Climate](https://codeclimate.com/github/dfcreative/color-space/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/color-space) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

<img src="https://raw.githubusercontent.com/dfcreative/color-space/gh-pages/logo.png" width="100%" height="150"/>

Conversions and data for color spaces. [Demo](http://dfcreative.github.io/color-space).


## Usage

[`npm install color-space`](https://npmjs.org/package/color-space/)

```js
var space = require('color-space');

//convert lab to lch
var result = space.lab.lch([80,50,60]);
```

You can require a separate space to reduce size significantly:

```js
var rgb = require('color-space/rgb');
var hsl = require('color-space/hsl');

//convert rgb to hsl
rgb.hsl([200,230,100]);
```


## API


```js
<fromSpace>.<toSpace>(array);
<space>.name //space name
<space>.min //channel minimums
<space>.max //channel maximums
<space>.channel //channel names
<space>.alias //alias space names
```

## Spaces

* [x] [RGB](https://en.wikipedia.org/wiki/CIE_1931_color_space#Experimental_results:_the_CIE_RGB_color_space)
* [x] [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV)
* [x] [HSV, HSB](https://en.wikipedia.org/wiki/HSL_and_HSV)
* [x] [HWB](http://dev.w3.org/csswg/css-color/#the-hwb-notation)
* [x] [HSI](https://en.wikipedia.org/wiki/HSL_and_HSV)
* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space)
* [x] [XYY (YXY)](https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xy_chromaticity_diagram_and_the_CIE_xyY_color_space)
* [x] [LAB](http://en.wikipedia.org/wiki/Lab_color_space)
* [x] [LCH<sub>ab</sub>](https://en.wikipedia.org/wiki/Lab_color_space#Cylindrical_representation:_CIELCh_or_CIEHLC)
* [x] [LUV](http://en.wikipedia.org/wiki/CIELUV)
* [x] [LCH<sub>uv</sub>](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation)
* [x] [H<sub>u</sub>SL](http://www.boronine.com/husl/)
* [x] [H<sub>u</sub>SL<sub>p</sub>](http://www.boronine.com/husl/)
* [x] [LAB<sub>Hunter</sub>](http://en.wikipedia.org/wiki/Lab_color_space#Hunter_Lab)
* [x] [YUV](https://en.wikipedia.org/?title=YUV)
* [x] [YIQ](https://en.wikipedia.org/?title=YIQ)
* [x] [YC<sub>g</sub>C<sub>o</sub>](https://en.wikipedia.org/wiki/YCgCo)
* [x] [YD<sub>b</sub>D<sub>r</sub>](https://en.wikipedia.org/wiki/YDbDr)
* [x] [YP<sub>b</sub>P<sub>r</sub>](https://en.wikipedia.org/wiki/YPbPr)
* [x] [YC<sub>b</sub>C<sub>r</sub>](https://en.wikipedia.org/wiki/YCbCr)
* [x] [Y<sub>c</sub>C<sub>bc</sub>C<sub>rc</sub>](https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion)
* [x] [JPEG](https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion)
* [x] [XvYCC](https://en.wikipedia.org/wiki/XvYCC)
* [x] [UCS](https://en.wikipedia.org/wiki/CIE_1960_color_space)
* [x] [UVW](https://en.wikipedia.org/wiki/CIE_1964_color_space)
* [ ] [Munsell](https://en.wikipedia.org/wiki/Munsell_color_system)
* [ ] [NCS](https://en.wikipedia.org/wiki/Natural_Color_System)
* [ ] [PMS](https://en.wikipedia.org/wiki/Pantone)
* [ ] [RAL](https://en.wikipedia.org/wiki/RAL_colour_standard)
* [ ] [TSL](https://en.wikipedia.org/wiki/TSL_color_space)
* [ ] [RG](https://en.wikipedia.org/wiki/RG_color_space)
* [x] [Coloroid](https://en.wikipedia.org/wiki/Coloroid)
* [ ] [OSA-UCS](https://en.wikipedia.org/wiki/OSA-UCS)
* [ ] [HKS](https://en.wikipedia.org/wiki/HKS_(colour_system))
* [x] [LMS](http://en.wikipedia.org/wiki/LMS_color_space)
* [x] [Cubehelix](https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/)
* [ ] [Gray](http://dev.w3.org/csswg/css-color/#grays)
* [ ] [CIECAM02](https://en.wikipedia.org/wiki/CIECAM02)
* [ ] [PhotoYCC](http://www5.informatik.tu-muenchen.de/lehre/vorlesungen/graphik/info/csc/COL_34.htm)


## Contribute

Please fork, add color space with basic conversions to/from XYZ or RGB and tests.
The goal of project is to provide the most complete set of color spaces with maximally minimal uniform API.


## Related projects

* [color2](https://www.npmjs.com/package/color2) — color class based on color-space.
* [color-ranger](https://www.npmjs.com/package/color-ranger) — visualize color spaces using canvas.
* [color-tool](https://www.npmjs.com/package/color-tool) — color picker based on color-space.
* [color-measure](https://www.npmjs.com/package/color-measure) — list of color measurement functions.
* [color-manipulate](https://www.npmjs.com/package/color-manipulate) — list of color manipulation functions.


## Similar projects

* [color-convert](https://github.com/harthur/color-convert)
* [chromatist](https://github.com/jrus/chromatist)
* [spectra](https://github.com/avp/spectra)
* [colorspaces.js](https://github.com/boronine/colorspaces.js)


# Color-space [![test](https://github.com/colorjs/color-space/actions/workflows/test.yml/badge.svg)](https://github.com/colorjs/color-space/actions/workflows/test.yml) [![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)](http://github.com/badges/stability-badges) [![npm](https://img.shields.io/npm/v/color-space)](https://npmjs.org/color-space) [![size](https://img.shields.io/bundlephobia/minzip/color-space/latest)](https://bundlephobia.com/package/color-space)

<img src="https://raw.githubusercontent.com/colorjs/color-space/gh-pages/logo.png" width="100%" height="150"/>

Collection of color spaces conversions & data.

[Demo](http://colorjs.github.io/color-space).


## Usage

```js
import space from 'color-space';

//convert lab to lch
var result = space.lab.lch([80,50,60]);
```

Spaces can be imported separately:

```js
import rgb from 'color-space/rgb.js';
import hsl from 'color-space/hsl.js';

//convert rgb to hsl
rgb.hsl([200,230,100]);
```
<!--
New space can be registered as:
```js
import space, {register} from 'color-space';

register(spaceDefiniton)
``` -->

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

* [x] [RGB](https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_colour_space) — additive color model based on red, green and blue primary colors.
* [x] [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV) — cylindrical-coordinates representation of RGB.
* [x] [HSV, HSB](https://en.wikipedia.org/wiki/HSL_and_HSV)
* [x] [HWB](http://dev.w3.org/csswg/css-color/#the-hwb-notation)
* [x] [HSI](https://en.wikipedia.org/wiki/HSL_and_HSV) — used for computer vision due to better separation of shapes in an image, comparing to HSL/HSB.
* [x] [CMYK](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [CMY](https://en.wikipedia.org/wiki/CMYK_color_model)
* [x] [XYZ](http://en.wikipedia.org/wiki/CIE_1931_color_space)
* [x] [XYY (YXY)](https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xy_chromaticity_diagram_and_the_CIE_xyY_color_space)
* [x] [LAB](http://en.wikipedia.org/wiki/Lab_color_space)
* [x] [LCH<sub>ab</sub>](https://en.wikipedia.org/wiki/Lab_color_space#Cylindrical_representation:_CIELCh_or_CIEHLC)
* [x] [LUV](http://en.wikipedia.org/wiki/CIELUV)
* [x] [LCH<sub>uv</sub>](http://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation)
* [x] [HSL<sub>uv</sub>](http://www.hsluv.org/)
* [x] [HPL<sub>uv</sub>](http://www.hsluv.org/)
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
* [ ] [RGK](https://en.wikipedia.org/wiki/RG_color_space)
* [x] [Coloroid](https://en.wikipedia.org/wiki/Coloroid) — color space for architects and visual constructors, Hungarian Standard MSZ 7300 since 2000.
* [ ] [OSA-UCS](https://en.wikipedia.org/wiki/OSA-UCS) — accurately reprsenting uniform color differences, developed by the Optical Society of America’s Committee on Uniform Color Scales.
* [ ] [HKS](https://en.wikipedia.org/wiki/HKS_(colour_system))
* [x] [LMS](http://en.wikipedia.org/wiki/LMS_color_space) — represents sensitivity of the human eye to Long, Medium and Short wavelengths.
* [x] [Cubehelix](https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) — colormaps for data visualization.
* [ ] [Gray](http://dev.w3.org/csswg/css-color/#grays)
* [ ] [CIECAM02](https://en.wikipedia.org/wiki/CIECAM02)
* [ ] [US Federal Standard 595](https://en.wikipedia.org/wiki/Federal_Standard_595)
* [ ] [Toyo](http://mytoyocolor.com/)
* [ ] [PhotoYCC](http://www5.informatik.tu-muenchen.de/lehre/vorlesungen/graphik/info/csc/COL_34.htm)
* [x] [HCG](https://github.com/acterhd/hcg-legacy)
* [ ] [HCL](http://www.chilliant.com/rgb2hsv.html)
* [x] [HSP](http://alienryderflex.com/hsp.html)
* [ ] [HCY](http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html)
* [x] [YES](http://www.atlantis-press.com/php/download_paper.php?id=198) — computationally effective color space for face recognition.
* [ ] [British Standard Colour](http://www.britishstandardcolour.com/)
* [ ] [RG chromacity](https://en.wikipedia.org/wiki/Rg_chromaticity)
* [ ] [CIE DSH](https://en.wikipedia.org/wiki/Rg_chromaticity)
* [ ] [HSM](http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428)

## Contribute

Please fork, add color space with basic _conversions_ to/from XYZ or RGB and _tests_.
The goal of the project is the most complete set of color spaces with minimal uniform API.


## Credits

Thanks to all scientists, who devoted their time to color research and conveyed their knowledge, for now we can use their formulas and code.


## Alternatives

* [color-convert](https://github.com/harthur/color-convert)
* [chromatist](https://github.com/jrus/chromatist)
* [spectra](https://github.com/avp/spectra)
* [colorspaces.js](https://github.com/boronine/colorspaces.js)

## See also

* [color-api](https://github.com/LeaVerou/color-api) - color API proposal by Lea Verou

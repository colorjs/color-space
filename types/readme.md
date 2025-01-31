# @types/color-space

* `index.d.ts` exports full space with all conversions.
* `*.d.ts` exports individual color spaces.

Types are kept as meaningfully minimal as possible.
Eg. there's no sense for generic _ColorSpace_ since all subtypes include static members.
There's no sense for _Tuple_ data types like _RgbData_ or even _Vec3_/_Vec4_ since they introduce non-existent layer: simple in-place `[number, number, number]` is enough.

## Why not generating from jsdoc?

* Proper jsdoc declarations introduce hacks to js files and still don't reach correct results.
* JSdoc doesn't provide matching features, eg. merging interfaces, which we need.
* Generated types look wrong: they miss important parts and include jsdocs.
* Current JSDoc serve literally formalized description purpose.

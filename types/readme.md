# @types/color-space

* `index.d.ts` exports full space with all conversions.
* `*.d.ts` exports individual color spaces.

Types are kept as meaningfully minimal as possible.

## Why not generating from jsdoc?

* Proper jsdoc declarations introduce hacks to js files and still don't attain correct results.
* JSdoc doesn't provide merging interfaces, which we need. It lacks capabilities of TS.
* Generated types look wrong: they miss important parts and somehow retain jsdocs.
* Current JSDoc serve literally formalized description purpose.

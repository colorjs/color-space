# μMath [![Build Status](https://travis-ci.org/dfcreative/mumath.svg?branch=master)](https://travis-ci.org/dfcreative/mumath) [![Code Climate](https://codeclimate.com/github/dfcreative/mumath/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/mumath) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

Set of practical math utils to shorten code.

`$ npm install mumath`

```js
	var round = require('mumath/round');
	round(123.32, .5); //123.5

	//require any function as
	//var <fn> = require('mumath/<fn>');
```

## API

### `round(value, precision?)`

Rounds value to optional `precision`, which is `1` by default.


### `precision(value)`

Get precision from float:

`1.1 → 1, 1234 → 0, .1234 → 4`


### `between(value, left, right)`

Return value clamped by left/right limits (or vice-versa).


### `isBetween(value, left, right)`

Whether element is between left & right, including.


### `loop(value, [min,]? max)`

An enhanced [mod-loop](http://npmjs.org/package/mod-loop) - loops value within a frame.


### `mult(a, b, ...)`
### `div(a, b, ...)`
### `sub(a, b, ...)`
### `add(a, b, ...)`
### `mod(a, b, ...)`
### `min(a, b, ...)`
### `max(a, b, ...)`
### `floor(a, b, ...)`
### `ceil(a, b, ...)`
### `log(a)`
### `lg(a)`

Simple wrappers for arythmetical functions.


### `gt(a,b)`
### `gte(a,b)`
### `lt(a,b)`
### `lte(a,b)`
### `eq(a,b)`
### `ne(a,b)`

Simple conditional functions.



[![NPM](https://nodei.co/npm/mutype.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/mumath/)
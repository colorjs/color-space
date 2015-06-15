var s = typeof colorSpace !== 'undefined' ? colorSpace : require("../index");
var assert = require("assert");
var round = require('mumath').round;
var mult = require('mumath').mult;
var div = require('mumath').div;
var max = require('mumath').max;
var husl = require('husl');
var addSpace = require('../util/add-space');

//append extra spaces
addSpace(s, require('../xyy'));
addSpace(s, require('../labh'));
addSpace(s, require('../cmy'));



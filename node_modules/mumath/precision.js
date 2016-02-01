/**
 * @module  mumath/precision
 *
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
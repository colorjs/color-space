/**
 * @module mumath/div
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result /= arguments[i];
	}
	return result;
});
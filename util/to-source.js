/**
 * Transform set of spaces to source code.
 * Useful to pass color-spaces source to web-worker, for example.
 *
 * @module  color-space/to-source
 */


/**
 * Return evaluable source code of spaces set.
 *
 * @param {object} spaces A (sub)set of color spaces to stringify. Normally - index.js.
 *
 * @return {string} source code
 */
module.exports = function(spaces){
	var res = '(function(){\nvar space = {};\n';

	var fnSrc, space;
	for (var spaceName in spaces) {
		space = spaces[spaceName];

		res += '\nvar ' + spaceName + ' = space.' + spaceName + ' = {\n';

		for (var prop in space) {
			if (typeof space[prop] === 'function') {
				fnSrc = space[prop].toString();

				//replace medium converters refs
				fnSrc = fnSrc.replace('[toSpaceName]', '.' + prop);
				fnSrc = fnSrc.replace('fromSpace', spaceName);

				res += prop + ':' + fnSrc + ',\n';
			} else {
				res += prop + ':' + JSON.stringify(space[prop]) + ',\n';
			}
		}

		res += '}\n';
	}

	res += '\nreturn space;})()';

	return res;
};
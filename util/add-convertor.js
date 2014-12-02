/**
 * Add a convertor from one to another space via XYZ or RGB space as a medium.
 *
 * @module  color-space/add-convertor
 */

var xyz = require('../xyz');
var rgb = require('../rgb');

module.exports = addConvertor;


/**
 * Add convertor from space A to space B.
 * So space A will be able to transform to B.
 */
function addConvertor(fromSpace, toSpace){
	if (!fromSpace[toSpace.name]) {
		fromSpace[toSpace.name] = getConvertor(fromSpace, toSpace);
	}

	return fromSpace;
}


/** return converter through xyz/rgb space */
function getConvertor(fromSpace, toSpace){
	var toSpaceName = toSpace.name;

	//create xyz converter, if available
	if (fromSpace.xyz && xyz[toSpaceName]) {
		return function(arg){
			return xyz[toSpaceName](fromSpace.xyz(arg));
		};
	}
	//create rgb converter
	else if (fromSpace.rgb && rgb[toSpaceName]) {
		return function(arg){
			return rgb[toSpaceName](fromSpace.rgb(arg));
		};
	}

	throw Error('Can’t add convertor from ' + fromSpace.name + ' to ' + toSpaceName);
}

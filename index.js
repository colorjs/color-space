/**
 * Color space data and conversions
 *
 * @module color-space
 *
 */


/** Exported spaces */
var spaces = {
	rgb: require('./rgb'),
	hsl: require('./hsl'),
	hsv: require('./hsv'),
	hwb: require('./hwb'),
	cmyk: require('./cmyk'),
	cmy: require('./cmy'),
	xyz: require('./xyz'),
	xyy: require('./xyy'),
	lab: require('./lab'),
	labh: require('./labh'),
	lchab: require('./lchab'),
	luv: require('./luv'),
	lchuv: require('./lchuv'),
	husl: require('./husl'),
	huslp: require('./huslp')
};



//build absent convertors from each to every space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
	fromSpace = spaces[fromSpaceName];
	for (var toSpaceName in spaces) {
		toSpace = spaces[toSpaceName];
		if (!fromSpace[toSpaceName]) fromSpace[toSpaceName] = getConvertor(fromSpace, toSpace);
	}
}


/** return converter through xyz/rgb space */
function getConvertor(fromSpace, toSpace){
	var toSpaceName = toSpace.name;

	//create straight converter
	if (fromSpace === toSpace) {
		return function (a) {
			return a;
		};
	}

	//create xyz converter, if available
	else if (fromSpace.xyz && spaces.xyz[toSpaceName]) {
		return function(arg){
			return spaces.xyz[toSpaceName](fromSpace.xyz(arg));
		};
	}
	//create rgb converter
	else if (fromSpace.rgb && spaces.rgb[toSpaceName]) {
		return function(arg){
			return spaces.rgb[toSpaceName](fromSpace.rgb(arg));
		};
	}

	throw Error('Can’t add convertor from ' + fromSpace.name + ' to ' + toSpaceName);
}


module.exports = spaces;
/**
 * @module color-space
 *
 */
//TODO: implement other spaces from http://en.wikipedia.org/wiki/Category:Color_space yuv, yiq, cmy etc.
//TODO: ciecam
//TODO: hunterlab

/** Set of exported spaces */
var spaces = {};
Object.defineProperty(spaces, 'add', {
	value: addSpace
});


//add common spaces
addSpace(require('./rgb'));
addSpace(require('./hsl'));
addSpace(require('./hsv'));
addSpace(require('./hwb'));
addSpace(require('./cmyk'));
addSpace(require('./xyz'));
addSpace(require('./lab'));
addSpace(require('./lchab'));
addSpace(require('./luv'));
addSpace(require('./lchuv'));
addSpace(require('./husl'));
addSpace(require('./huslp'));



/**
 * Adds a new space to the set.
 * Creates converters to/from every other possible state.
 */
function addSpace(toSpace){
	var toSpaceName = toSpace.name;

	if (spaces[toSpaceName]) return;

	//add a new space
	spaces[toSpaceName] = toSpace;

	//make each space be able to transform to every other space
	var fromSpace;
	for (var fromSpaceName in spaces) {
		fromSpace = spaces[fromSpaceName];

		//ignore self
		if (fromSpace === addSpace) continue;

		if (!fromSpace[toSpaceName]) {
			fromSpace[toSpaceName] = getConverter(fromSpace, toSpace);
		}
		if (!toSpace[fromSpaceName]) {
			toSpace[fromSpaceName] = getConverter(toSpace, fromSpace);
		}
	}
}



/** return converter through xyz/rgb space */
function getConverter(fromSpace, toSpace){
	var toSpaceName = toSpace.name;

	//create xyz converter, if available
	if (fromSpace.xyz && spaces.xyz[toSpaceName]) {
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

	return fromSpace[toSpaceName];
}


module.exports = spaces;
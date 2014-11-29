/**
 * @module color-space
 *
 * @todo  implement all side spaces from http://en.wikipedia.org/wiki/Category:Color_space yuv, yiq etc.
 */

var addConvertor = require('./add-convertor');


/** Exported spaces */
var spaces = {
	rgb: require('./rgb'),
	hsl: require('./hsl'),
	hsv: require('./hsv'),
	hwb: require('./hwb'),
	cmyk: require('./cmyk'),
	xyz: require('./xyz'),
	lab: require('./lab'),
	lchab: require('./lchab'),
	luv: require('./luv'),
	lchuv: require('./lchuv'),
	husl: require('./husl'),
	huslp: require('./huslp')
};


/**
 * Add a new space to the set
 */
Object.defineProperty(spaces, 'add', {
	value: function (space) {
		var spaceName = space.name;

		//ignore existing space
		if (this[spaceName]) return;

		//add convertors to every existing space
		var otherSpace;
		for (var otherSpaceName in this) {
			otherSpace = this[otherSpaceName];
			addConvertor(space, otherSpace);
			addConvertor(otherSpace, space);
		}

		//save a new space
		this[spaceName] = space;

		return space;
	}
});

//you can add other spaces manually
//via `spaces.add(require('color-space/ciecam'))`



//build absent convertors from each to every space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
	fromSpace = spaces[fromSpaceName];
	for (var toSpaceName in spaces) {
		if (toSpaceName !== fromSpaceName) {
			toSpace = spaces[toSpaceName];
			addConvertor(fromSpace, toSpace);
		}
	}
}


module.exports = spaces;
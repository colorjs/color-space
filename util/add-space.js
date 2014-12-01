/**
 * Append a new color space to the set
 * Bind all necessary conversions etc
 *
 * @module  color-space/add-space
 */

var addConvertor = require('./add-convertor');

/**
 * Appends a converter from every space in the set to a new space.
 * Appends a converter from the new space to every space in the set.
 *
 * @param {object} space New space with basic xyz/rgb converters
 * @param {object} spaces Set of color spaces
 *
 * @return {object} A new space
 */
module.exports = function(spaces, space){
	var spaceName = space.name;

	//ignore existing space
	if (spaces[spaceName]) return;

	//add convertors to every existing space
	var otherSpace;
	for (var otherSpaceName in spaces) {
		otherSpace = spaces[otherSpaceName];
		addConvertor(space, otherSpace);
		addConvertor(otherSpace, space);
	}

	//save a new space
	spaces[spaceName] = space;

	return space;
};
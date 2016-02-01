/**
 * Composed set of all math utils
 *
 * @module  mumath
 */
module.exports = {
	between: require('./between'),
	isBetween: require('./is-between'),
	round: require('./round'),
	precision: require('./precision'),
	loop: require('./loop'),
	add: require('./add'),
	sub: require('./sub'),
	min: require('./min'),
	max: require('./max'),
	div: require('./div'),
	lg: require('./lg'),
	log: require('./log'),
	mult: require('./mult'),
	mod: require('./mod'),
	floor: require('./floor'),
	ceil: require('./ceil'),

	gt: require('./gt'),
	gte: require('./gte'),
	lt: require('./lt'),
	lte: require('./lte'),
	eq: require('./eq'),
	ne: require('./ne'),
};
export const spaceIds = /** @type {const} */ (['rgb', 'xyz', 'hsl', 'hsv', 'hsi', 'hwb', 'cmyk', 'cmy', 'xyy', 'yiq', 'yuv', 'ydbdr', 'ycgco', 'ypbpr', 'ycbcr', 'xvycc', 'yccbccrc', 'ucs', 'uvw', 'jpeg', 'lab', 'labh', 'lms', 'lchab', 'luv', 'lchuv', 'hsluv', 'hpluv', 'cubehelix', 'coloroid', 'hcg', 'hcy', 'tsl', 'yes', 'osaucs', 'hsp']);

/** @typedef {typeof spaceIds[number]} SpaceId */

/** @typedef {(color: Array<number>, ...rest: Array<*>) => Array<number>} Transform */

/** @typedef {{[key in SpaceId]: Transform}} ColorSpaceTransforms */

/** @type {ColorSpaceTransforms} */
export const conversionPlaceholders = spaceIds.reduce((acc, id) => {
	acc[id] = () => {
		throw new Error(`No direct conversion to ${id} available.`);
	};
	return acc;
}, /** @type {ColorSpaceTransforms} */ ({}));

/**
 * @typedef {Object} ColorSpaceBase
 * @property {SpaceId} name
 * @property {Array<number>} min
 * @property {Array<number>} max
 * @property {Array<string>} channel
 * @property {Array<string>} [alias]
 * @property {Object<number, Object<string, Array<number>>>} [whitepoint]
 */

/** @typedef {ColorSpaceBase & ColorSpaceTransforms} ColorSpace */

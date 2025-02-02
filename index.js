/**
 * Color space data and conversions
 *
 * @module color-space
 *
 */
import rgb from './rgb.js'
import hsl from './hsl.js'
import hsv from './hsv.js'
import hsi from './hsi.js'
import hwb from './hwb.js'
import cmyk from './cmyk.js'
import cmy from './cmy.js'
import xyz from './xyz.js'
import xyy from './xyy.js'
import yiq from './yiq.js'
import yuv from './yuv.js'
import ydbdr from './ydbdr.js'
import ycgco from './ycgco.js'
import ypbpr from './ypbpr.js'
import ycbcr from './ycbcr.js'
import xvycc from './xvycc.js'
import yccbccrc from './yccbccrc.js'
import ucs from './ucs.js'
import uvw from './uvw.js'
import jpeg from './jpeg.js'
import lab from './lab.js'
import labh from './labh.js'
import lms from './lms.js'
import lchab from './lchab.js'
import luv from './luv.js'
import lchuv from './lchuv.js'
import hsluv from './hsluv.js'
import hpluv from './hpluv.js'
import oklab from './oklab.js'
import cubehelix from './cubehelix.js'
import coloroid from './coloroid.js'
import hcg from './hcg.js'
import hcy from './hcy.js'
import tsl from './tsl.js'
import yes from './yes.js'
import osaucs from './osaucs.js'
import hsp from './hsp.js'
import hsm from './hsm.js'
import lrgb from './lrgb.js'


/**
 * Dict with all color spaces
 *
 * @type {{[key in SpaceId]: ColorSpace}}
 */
const spaces = {};
export default spaces;


/**
 * Register new color space and conversions with all existing spaces
 *
 * @param {ColorSpace} newSpace
 */
export function register(newSpace) {
	const newSpaceName = newSpace.name;
	for (const existingSpaceName in spaces) {
		if (!newSpace[existingSpaceName]) newSpace[existingSpaceName] = createConverter(newSpace, existingSpaceName);

		const existingSpace = spaces[existingSpaceName]
		if (!existingSpace[newSpaceName]) existingSpace[newSpaceName] = createConverter(existingSpace, newSpaceName);
	}
	spaces[newSpaceName] = newSpace
}

/**
 * Creates a color space converter function.
 *
 * @param {ColorSpace} fromSpace
 * @param {SpaceId} toSpaceName
 * @returns {Transform}
 */
function createConverter(fromSpace, toSpaceName) {
	//create xyz converter, if available
	if (fromSpace.xyz && spaces.xyz[toSpaceName])
		return (arg) => spaces.xyz[toSpaceName](fromSpace.xyz(arg));

	//create rgb converter
	if (fromSpace.rgb && spaces.rgb[toSpaceName])
		return (arg) => spaces.rgb[toSpaceName](fromSpace.rgb(arg));


	return () => {
		throw new Error(`Conversion ${fromSpace.name} to ${toSpaceName} is not available`);
	}
}

// register all spaces by default
[rgb, xyz, hsl, hsv, hsi, hwb, cmyk, cmy, xyy, yiq, yuv, ydbdr, ycgco, ypbpr, ycbcr, xvycc, yccbccrc, ucs, uvw, jpeg, lab, labh, lms, lchab, luv, lchuv, hsluv, hpluv, cubehelix, coloroid, hcg, hcy, tsl, yes, osaucs, hsp, hsm, lrgb, oklab].map(register)

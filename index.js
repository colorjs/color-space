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
import oklab from './oklab.js'
import oklch from './oklch.js'
import okhsl from './okhsl.js'
import okhsv from './okhsv.js'
import oklrab from './oklrab.js'
import oklrch from './oklrch.js'
import jzazbz from './jzazbz.js'
import jzczhz from './jzczhz.js'
import p3 from './p3.js'
import p3Linear from './p3-linear.js'
import rec2020 from './rec2020.js'
import rec2020Linear from './rec2020-linear.js'
import rec2020oetf from './rec2020-oetf.js'
import rec2100pq from './rec2100-pq.js'
import rec2100hlg from './rec2100-hlg.js'
import a98rgb from './a98rgb.js'
import a98Linear from './a98rgb-linear.js'
import prophoto from './prophoto.js'
import prophotoLinear from './prophoto-linear.js'
import acescg from './acescg.js'
import acescc from './acescc.js'
import ictcp from './ictcp.js'
import cam16jmh from './cam16.js'
import hct from './hct.js'
import xyzD50 from './xyz-d50.js'
import xyzAbsD65 from './xyz-abs-d65.js'
import labD50 from './lab-d50.js'
import gray from './gray.js'
import rg from './rg.js'
import hcl from './hcl.js'

/**
 * Dict with all color spaces
 */
const space = {};
export default space;


/**
 * Register new color space and conversions with all existing spaces
 */
export function register(newSpace) {
	const newSpaceName = newSpace.name;
	for (const existingSpaceName in space) {
		if (!newSpace[existingSpaceName]) newSpace[existingSpaceName] = createConverter(newSpace, existingSpaceName);

		const existingSpace = space[existingSpaceName]
		if (!existingSpace[newSpaceName]) existingSpace[newSpaceName] = createConverter(existingSpace, newSpaceName);
	}
	space[newSpaceName] = newSpace
}

/**
 * Creates a color space converter function via intermediate xyz or rgb.
 *
 * @param {space} fromSpace
 * @param {SpaceId} toSpaceName
 * @returns {Transform}
 */
function createConverter(fromSpace, toSpaceName) {
	// xyz converter
	if (fromSpace.xyz && space.xyz[toSpaceName])
		return (...args) => space.xyz[toSpaceName](...fromSpace.xyz(...args));

	// rgb converter
	if (fromSpace.rgb && space.rgb[toSpaceName])
		return (...args) => space.rgb[toSpaceName](...fromSpace.rgb(...args));
}

// register all spaces by default
[rgb, xyz, hsl, hsv, hsi, hwb, cmyk, cmy, xyy, yiq, yuv, ydbdr, ycgco, ypbpr, ycbcr, xvycc, yccbccrc, ucs, uvw, jpeg, lab, labh, lms, lchab, luv, lchuv, hsluv, hpluv, cubehelix, coloroid, hcg, hcy, tsl, yes, osaucs, hsp, hsm, lrgb, oklab, oklch, okhsl, okhsv, oklrab, oklrch, jzazbz, jzczhz, p3, p3Linear, rec2020, rec2020Linear, rec2020oetf, rec2100pq, rec2100hlg, a98rgb, a98Linear, prophoto, prophotoLinear, acescg, acescc, ictcp, cam16jmh, hct, xyzD50, xyzAbsD65, labD50, gray, rg, hcl].map(register)

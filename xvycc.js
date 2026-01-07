/**
 * https://en.wikipedia.org/wiki/XvYCC
 *
 * Sony xvYCC is extended YCbCr
 *
 * It uses same transformation as
 * SD: ITU-R BT.601
 * HD: ITU-R BT.709
 *
 * But have extended mins/maxes, which (may) result in negative rgb values
 *
 * https://web.archive.org/web/20130524104850/http://www.sony.net/SonyInfo/technology/technology/theme/xvycc_01.html
 *
 * TODO: look for a spec (120$) - there are xvYCC ←→ XYZ conversion formulas
 *
 * @module  color-space/xvycc
 */
import rgb from './rgb.js';
import ypbpr from './ypbpr.js';

var xvycc = {
	name: 'xvycc',
	channel: ['Y', 'Cb', 'Cr'],
	/**
	 * xvYCC to YPbPr (digital to analog)
	 * Input is normalized 0-1, output is analog YPbPr 0-1
	 */
	ypbpr: function (y, cb, cr) {
		// Both in 0-1 range, return as-is
		return [y, cb, cr];
	},

        /**
         * xvYCC to RGB
         * transform through analog form
         *
         * @param {Array<number>} arr RGB values
         * @param {number} kb
         * @param {number} kr
         * @return {Array<number>} xvYCC values
         */
        rgb: function (y, cb, cr, kb, kr) {
                return ypbpr.rgb(...xvycc.ypbpr(y, cb, cr), kb, kr);
        }
};

export default (xvycc);

/**
 * YPbPr to xvYCC (analog to digital)
 * Input is analog YPbPr 0-1, output is normalized 0-1
 *
 * @return {Array<number>} Resulting digitized form normalized to 0-1
 */
ypbpr.xvycc = function (y, pb, pr) {
	// Both in 0-1 range, return as-is
        return [y, pb, pr];
};


/**
 * RGB to xvYCC
 * transform through analog form
 *
 * @param {Array<number>} arr xvYCC values
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} RGB values
 */
rgb.xvycc = function (r, g, b, kb, kr) {
        return ypbpr.xvycc(...rgb.ypbpr(r, g, b, kb, kr));
};

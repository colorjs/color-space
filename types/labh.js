/**
 * Hunter-lab space.
 *
 * @module  color-space/labh
 */
import xyz from './xyz.js';
/** @type {Partial<import('./index.js').ColorSpace>} */
var labh = {
    name: 'labh',
    //mins/maxes are taken from colormine
    //FIXME: check whether mins/maxes correct
    min: [0, -128, -128],
    max: [100, 128, 128],
    channel: ['lightness', 'a', 'b'],
    alias: ['LABh', 'hunter-lab', 'hlab'],
    //maths are taken from EasyRGB
    xyz: function (lab) {
        var l = lab[0], a = lab[1], b = lab[2];
        var _y = l / 10;
        var _x = a / 17.5 * l / 10;
        var _z = b / 7 * l / 10;
        var y = _y * _y;
        var x = (_x + y) / 1.02;
        var z = -(_z - y) / 0.847;
        return [x, y, z];
    }
};
export default /** @type {import('./index.js').ColorSpace} */ (labh);
//extend xyz
xyz.labh = function (xyz) {
    var x = xyz[0], y = xyz[1], z = xyz[2];
    var _y12 = Math.sqrt(y);
    var l = 10 * _y12;
    var a = y === 0 ? 0 : 17.5 * (((1.02 * x) - y) / _y12);
    var b = y === 0 ? 0 : 7 * ((y - (0.847 * z)) / _y12);
    return [l, a, b];
};

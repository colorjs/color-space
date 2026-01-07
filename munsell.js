/**
 * @module color-space/munsell
 */
var munsell = {
	name: 'munsell',
	min: [],
	max: [],
	//hue, value, chroma
	channel: ['H', 'V', 'C']
}

/**
 * http://www.pp.bme.hu/ar/article/view/2395/1500
 */
// FIXME: obviously unfinished
munsell.coloroid = function (c, vm) {
	var a, t, v;

	//coloroid chroma / munsell chroma
	t = kav * Math.pow(c, 2 / 3);

	v = 10 * Math.sqrt(1.2219 * vm - 0.23111 * vm * vm + 0.23951 * vm * vm * vm - 0.021009 * vm * vm * vm * vm + 0.0008404 * vm * vm * vm * vm * vm);
};


export default munsell;

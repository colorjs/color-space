var convert = require("../");
var assert = require("assert");
var round = require('mumath').round;
var q = require('query-relative');


var doc = document, win = window, body = doc.body, root = doc.documentElement;

var title = q('.page-link');

var table = q('#convert-table');
var thead = q(table, 'thead');
var tbody = q(table, 'tbody');
var tr = q(table, 'tr', true);

var selCss='::selection{background:%b;color:%c} ::-moz-selection{background:%b;color:%c}';
selStyle=doc.createElement('style');
doc.getElementsByTagName('head')[0].appendChild(selStyle);


//select on click
table.addEventListener('click', function(e){
	if (e.target instanceof HTMLInputElement) {
		e.target.select();
	}
});

//recalc all on input
table.addEventListener('input', function(e){
	var target = e.target;
	var channel = target.id;
	var srcSpace = target.getAttribute('data-space');
	var srcSpaceInputs = q('[data-space=' + srcSpace + ']', true);
	var targetValues, targetSpaceInputs;
	var srcValues = [];
	for (var i = srcSpaceInputs.length; i--;){
		srcValues[i] = +srcSpaceInputs[i].value;
	}

	//recalc all other spaces but source
	for (var targetSpace in convert) {
		if (targetSpace === srcSpace) continue;

		try {
			targetValues = convert[srcSpace][targetSpace](srcValues);

			targetSpaceInputs = q('[data-space=' + targetSpace + ']', true);

			for (var i = targetSpaceInputs.length; i--;){
				targetSpaceInputs[i].value = targetValues[i].toFixed(1);
			}
		} catch (e) {
			console.log('Can’t convert from ' + srcSpace + ' to ' + targetSpace, e);
		}
	}

	//Set header color according to the current converting color
	var rgb = srcSpace === 'rgb' ? srcValues : convert[srcSpace].rgb(srcValues);
	var l = +q('#lightness').value;

	title.style.color = 'rgb(' + rgb + ')';
	title.style.borderColor = 'rgba(' + rgb + ', .1)';

	//change color of selection
	var selStr = selCss.replace(/%b/g, 'rgb(' + rgb + ')');
	selStr = selStr.replace(/%c/g, l > 82 ? 'black' : 'white');
	selStyle.innerHTML = selStr;
});


/**
 * Create table-column for converting
 */
function createSpaceCase(name){
	var space = convert[name];

	var th = document.createElement('th');
	th.innerHTML = name;
	thead.appendChild(th);

	var td = document.createElement('td');
	td.innerHTML = '<input id="" value="0" type="number"/>';

	//for each channel create cell
	for (var i = 0, cname; i < space.channel.length; i++){
		cname = space.channel[i];
		td.lastChild.id = cname;
		td.lastChild.title = cname;
		td.lastChild.setAttribute('data-space', name);
		td.lastChild.min = space.min[i];
		td.lastChild.max = space.max[i];
		tr[i].appendChild(td);
		td = td.cloneNode(true);
	}
	if (i === 3) tr[3].appendChild(td.cloneNode());
}


describe('rgb', function(){
	before(function(){
		createSpaceCase('rgb');
	});

	it('to hsl', function(){
		assert.deepEqual(round(convert.rgb.hsl([140, 200, 100])), [96, 48, 59]);
	});
	it('to hsv', function(){
		assert.deepEqual(round(convert.rgb.hsv([140, 200, 100])), [96, 50, 78]);
	});
	it('to hwb', function(){
		assert.deepEqual(round(convert.rgb.hwb([140, 200, 100])), [96, 39, 22]);
	});
	it('to cmyk', function(){
		assert.deepEqual(round(convert.rgb.cmyk([140, 200, 100])), [30, 0, 50, 22]);
		assert.deepEqual(round(convert.rgb.cmyk([0,0,0,1])), [0,0,0,100]);
	});
	it('to xyz', function(){
		assert.deepEqual(round(convert.rgb.xyz([92, 191, 84])), [25, 40, 15]);
	});
	it('to lab', function(){
		assert.deepEqual(round(convert.rgb.lab([92, 191, 84])), [70, -50, 45]);
	});
	it('to lch', function(){
		assert.deepEqual(round(convert.rgb.lch([92, 191, 84])), [70, 67, 138]);
	});
	it('to luv', function(){
		assert.deepEqual(round(convert.rgb.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(convert.rgb.luv([10, 0, 0])), [1, 2, 0]);
		assert.deepEqual(round(convert.rgb.luv([100, 0, 0])), [19, 62, 13]);
		assert.deepEqual(round(convert.rgb.luv([255, 0, 0])), [53, 175, 38]);
		assert.deepEqual(round(convert.rgb.luv([0, 255, 0])), [88, -83, 107]);
		assert.deepEqual(round(convert.rgb.luv([0, 0, 255])), [32, -9, -130]);
		assert.deepEqual(round(convert.rgb.luv([0, 255, 255])), [91, -70, -15]);
		assert.deepEqual(round(convert.rgb.luv([255, 255, 255])), [100, 0, 0]);
	});
});


describe('hsl', function(){
	before(function(){
		createSpaceCase('hsl');
	});

	it('to rgb', function(){
		assert.deepEqual(round(convert.hsl.rgb([96, 48, 59])), [140, 201, 100]);
	});
	it('to hsv', function(){
		// colorpicker says [96,50,79]
		assert.deepEqual(round(convert.hsl.hsv([96, 48, 59])), [96, 50, 79]);
	});
	it('to hwb', function(){
		// computer round to 21, should be 22
		assert.deepEqual(round(convert.hsl.hwb([96, 48, 59])), [96, 39, 21]);
	});
	it('to cmyk', function(){
		assert.deepEqual(round(convert.hsl.cmyk([96, 48, 59])), [30, 0, 50, 21]);
	});
});

describe('hsv', function(){
	before(function(){
		createSpaceCase('hsv');
	});

	it('to rgb', function(){
		assert.deepEqual(round(convert.hsv.rgb([96, 50, 78])), [139, 199, 99]);
	});
	it('to hsl', function(){
		assert.deepEqual(round(convert.hsv.hsl([96, 50, 78])), [96, 47, 59]);
		assert.deepEqual(round(convert.hsv.hsl([0,0,0])), [0,0,0]);
	});
	it('to hwb', function(){
		assert.deepEqual(round(convert.hsv.hwb([96, 50, 78])), [96, 39, 22]);
	});
	it('to cmyk', function(){
		assert.deepEqual(round(convert.hsv.cmyk([96, 50, 78])), [30, 0, 50, 22]);
	});
});

describe('cmyk', function(){
	before(function(){
		createSpaceCase('cmyk');
	});

	it('to rgb', function(){
		assert.deepEqual(round(convert.cmyk.rgb([30, 0, 50, 22])), [139, 199, 99]);
	});
	it('to hsl', function(){
		assert.deepEqual(round(convert.cmyk.hsl([30, 0, 50, 22])), [96, 47, 59]);
	});
	it('to hsv', function(){
		assert.deepEqual(round(convert.cmyk.hsv([30, 0, 50, 22])), [96, 50, 78]);
	});
	it('to hwb', function(){
		assert.deepEqual(round(convert.cmyk.hwb([30, 0, 50, 22])), [96, 39, 22]);
	});
});


describe('xyz', function(){
	before(function(){
		createSpaceCase('xyz');
	});

	it('to rgb', function(){
		assert.deepEqual(round(convert.xyz.rgb([25, 40, 15])), [97, 190, 85]);
		assert.deepEqual(round(convert.xyz.rgb([50, 100, 100])), [0, 255, 241]);
	});
	it('to lab', function(){
		assert.deepEqual(round(convert.xyz.lab([25, 40, 15])), [69, -48, 44]);
	});
	it('to lch', function(){
		assert.deepEqual(round(convert.xyz.lch([25, 40, 15])), [69, 65, 137]);
	});
	it('to luv', function(){
		assert.deepEqual(round(convert.xyz.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(convert.xyz.luv([100, 0, 0])), [12, 38, 7]);
		assert.deepEqual(round(convert.xyz.luv([100, 0, 100])), [12, 31, -2]);
		assert.deepEqual(round(convert.xyz.luv([100, 100, 100])), [9, 24, -2]);
	});
});

describe('lab', function(){
	before(function(){
		createSpaceCase('lab');
	});

	it('to xyz', function(){
		assert.deepEqual(round(convert.lab.xyz([69, -48, 44])), [25, 39, 15]);
	});
	it('to rgb', function(){
		assert.deepEqual(round(convert.lab.rgb([75, 20, -30])), [194, 175, 240]);
	});
	it('to lch', function(){
		assert.deepEqual(round(convert.lab.lch([69, -48, 44])), [69, 65, 137]);
	});
});


describe('lch', function(){
	before(function(){
		createSpaceCase('lch');
	});

	it('to lab', function(){
		assert.deepEqual(round(convert.lch.lab([69, 65, 137])), [69, -48, 44]);
	});
	it('to xyz', function(){
		assert.deepEqual(round(convert.lch.xyz([69, 65, 137])), [25, 39, 15]);
	});
	it('to rgb', function(){
		assert.deepEqual(round(convert.lch.rgb([69, 65, 137])), [98, 188, 83]);
	});
});




describe('hwb', function(){
	before(function(){
		createSpaceCase('hwb');
	});

	it('to rgb', function(){
		// hwb
		// http://dev.w3.org/csswg/css-color/#hwb-examples

		// all extrem value should give black, white or grey
		for(var angle = 0; angle <= 360; angle ++) {
		  assert.deepEqual(round(convert.hwb.rgb([angle, 0, 100])), [0, 0, 0]);
		  assert.deepEqual(round(convert.hwb.rgb([angle, 100, 0])), [255, 255, 255]);
		  assert.deepEqual(round(convert.hwb.rgb([angle, 100, 100])), [128, 128, 128]);
		}

		assert.deepEqual(round(convert.hwb.rgb([0, 0, 0])), [255,0,0]);
		assert.deepEqual(round(convert.hwb.rgb([0, 20, 40])), [153, 51, 51]);
		assert.deepEqual(round(convert.hwb.rgb([0, 40, 40])), [153, 102, 102]);
		assert.deepEqual(round(convert.hwb.rgb([0, 40, 20])), [204, 102, 102]);

		assert.deepEqual(round(convert.hwb.rgb([120, 0, 0])), [0,255,0]);
		assert.deepEqual(round(convert.hwb.rgb([120, 20, 40])), [51, 153, 51]);
		assert.deepEqual(round(convert.hwb.rgb([120, 40, 40])), [102, 153, 102]);
		assert.deepEqual(round(convert.hwb.rgb([120, 40, 20])), [102, 204, 102]);

		assert.deepEqual(round(convert.hwb.rgb([240, 0, 0])), [0,0,255]);
		assert.deepEqual(round(convert.hwb.rgb([240, 20, 40])), [51, 51, 153]);
		assert.deepEqual(round(convert.hwb.rgb([240, 40, 40])), [102, 102, 153]);
		assert.deepEqual(round(convert.hwb.rgb([240, 40, 20])), [102, 102, 204]);
	});
});


describe('luv', function(){
	before(function(){
		createSpaceCase('luv');
	});

	it.skip('to ', function(){

	});

});


describe('lchuv', function(){
	before(function(){
		createSpaceCase('lchuv');
	});

	it.skip('to rgb', function(){

	});

	it.skip('to xyz', function(){

	});

	it.skip('to ', function(){

	});
});


describe('husl', function(){
	before(function(){
		createSpaceCase('husl');
	});

	it.skip('to rgb', function(){

	});

	it.skip('to xyz', function(){

	});

	it.skip('to ', function(){

	});
});


describe('huslp', function(){
	before(function(){
		createSpaceCase('huslp');
	});

	it.skip('to rgb', function(){

	});

	it.skip('to xyz', function(){

	});

	it.skip('to ', function(){

	});
});


describe('ciecam', function(){
	before(function(){
		createSpaceCase('ciecam');
	});

	it.skip('to rgb', function(){

	});

	it.skip('to xyz', function(){

	});

	it.skip('to ', function(){

	});
});
/**
 * CIECAM02 http://en.wikipedia.org/wiki/CIECAM02
 *
 * @todo add transforms
 *
 * @module cam
 */
var xyz = require('./xyz');


var cam = module.exports = {
  name:'cam',

  alias: ['ciecam', 'ciecam02'],

  xyz: function(cam){
  	//TODO
  }
};


//extend xyz
xyz.cam = function(xyz){
	var x = xyz[0], y = xyz[1], z = xyz[2];
	//TODO
};
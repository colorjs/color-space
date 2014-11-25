var rgb = require('./rgb');
var xyz = require('./xyz');

//CIECAM02 http://en.wikipedia.org/wiki/CIECAM02
var cam = {
  name:'cam',
  alias: ['ciecam', 'ciecam02']
};


//extend xyz
//TODO
xyz.cam = function(xyz){
	var x = xyz[0], y = xyz[1], z = xyz[2];

	//Mcat02
	var m =[[0.7328, 0.4296, -0.1624], [-0.7036, 1.6975, 0.0061], [0.0030, 0.0136, 0.9834]];

	//get lms
	var L = x*m[0][0] + y*m[0][1]  + z*m[0][2];
	var M =  x*m[1][0] + y*m[1][1] + z*m[1][2];
	var S = x*m[2][0] + y*m[2][1] + z*m[2][2];

	//calc lc, mc, sc
	//FIXME: choose proper d
	var d = 0.85;
	var Lwr = 100, Mwr = 100, Swr = 100;
	var Lc = (Lwr*D/Lw + 1 - D) * L;
	var Mc = (Mwr*D/Mw + 1 - D) * M;
	var Sc = (Swr*D/Sw + 1 - D) * S;
};
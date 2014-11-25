var luv = require('./luv');
var rgb = require('./rgb');

//cylindrical luv
var lchuv = module.exports = {
  name: 'lchuv',
  alias: ['cielchuv'],
  luv: function(){

  },
};



rgb.lchuv = function(args){
	return luv.lchuv(rgb.luv(args));
};
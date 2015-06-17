/**
 * Cubehelix https://www.mrao.cubehelix.ac.uk/~dag/CUBEHELIX/
 *
 * @module color-space/cubehelix
 */
var rgb = require('./rgb');


var cubehelix = module.exports = {
  name: 'cubehelix',
  channel: ['start', 'rotation', 'hue', 'gamma'],
  min: [0, -10, 0, 0],
  max: [3, 10, 2, 2],

  rgb: function(ch){
  	//TODO
  }
};


//extend rgb
rgb.cubehelix = function(rgb){
	var x = rgb[0], y = rgb[1], z = rgb[2];
	//TODO
};
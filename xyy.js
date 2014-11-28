var rgb = require('./rgb');

var xyz = module.exports = {
  name: 'xyy',
  min: [0,0,0],
  max: [96,100,109],
  channel: ['x','y','Y'],
  alias: ['yxy'],

  //TODO: fix this maths so to return 255,255,255 in rgb
  xyz: function(arg) {
  }
};


//extend rgb
xyz.xyy = function(arg) {

};
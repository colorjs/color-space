var xyz = require('./xyz');
var rgb = require('./rgb');

var luv = module.exports = {
  name: 'uvw',

  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'u', 'v'],
  alias: ['cieuvw'],
};
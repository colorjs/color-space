//TODO: save hue on setting sat = 0;

var spaces = {
  rgb: require('./rgb'),
  hsl: require('./hsl'),
  hsv: require('./hsv'),
  hwb: require('./hwb'),
  cmyk: require('./cmyk'),
  xyz: require('./xyz'),
  lab: require('./lab'),
  lch: require('./lch'),
  lchuv: require('./lchuv'),
  luv: require('./luv')
};

//make each space able to transform to every other space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
  fromSpace = spaces[fromSpaceName];
  for (var toSpaceName in spaces) {
    if (!fromSpace[toSpaceName]) {
      fromSpace[toSpaceName] = getConverter(fromSpace, toSpaceName);
    }
  }
};

//return converter through xyz/rgb space
function getConverter(fromSpace, toSpaceName){
  //create xyz converter, if available
  if (fromSpace.xyz && spaces.xyz[toSpaceName]) {
    return function(arg){
      return spaces.xyz[toSpaceName](fromSpace.xyz(arg));
    };
  }
  //create rgb converter
  else if (fromSpace.rgb && spaces.rgb[toSpaceName]) {
    return function(arg){
      return spaces.rgb[toSpaceName](fromSpace.rgb(arg));
    };
  }

  return fromSpace[toSpaceName];
}


/**
 * @module color-space
 */
module.exports = spaces;
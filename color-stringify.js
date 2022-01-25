import names from "./color-name.js";
var colorStringify = stringify;
var nameValues = {};
for (var name in names) {
  nameValues[names[name]] = name;
}
function stringify(values, type) {
  if (!Array.isArray(values) && values.values) {
    var color = values;
    if (color.alpha === 1 || color.alpha === void 0) {
      return stringify(color.values, type || color.space);
    } else {
      var values = color.values.slice();
      values.push(color.alpha);
      return stringify(values, type || color.space);
    }
  }
  if (type === "hex") {
    var res = values.slice(0, 3).map(function(value) {
      return (value < 16 ? "0" : "") + value.toString(16);
    }).join("");
    if (res[0] === res[1] && res[2] === res[3] && res[4] === res[5])
      res = res[0] + res[2] + res[4];
    return "#" + res;
  }
  if (type === "keyword") {
    return nameValues[values];
  }
  if (type === "adobe1") {
    return "R:" + values[0] + ", G:" + values[1] + ", B:" + values[2];
  }
  if (type === "adobe2") {
    return "(R" + values[0] + " / G" + values[1] + " / B" + values[2] + ")";
  }
  var isPercent, isAlphaSpace;
  if (type === "percent") {
    type = "rgb";
    values = values.map(function(value, i) {
      if (i === 3)
        return value;
      return Math.round(value * 100 / 255);
    });
    isPercent = true;
    isAlphaSpace = true;
  }
  type = type || "rgb";
  isPercent = isPercent ? isPercent : type[0] === "h";
  isAlphaSpace = isAlphaSpace || /rgb|hs[lv]/i.test(type);
  if (isAlphaSpace && type[type.length - 1] === "a") {
    type = type.slice(0, -1);
  }
  var alpha = 1;
  if (values.length > type.length) {
    alpha = values.pop();
  }
  var alphaPf = isAlphaSpace && alpha < 1 ? "a" : "";
  var res = type + alphaPf;
  res += "(" + values.map(function(value, i) {
    if (isPercent && !(type[i] === "h")) {
      return value + "%";
    } else {
      return value;
    }
  }).join(", ");
  res += (alpha < 1 ? ", " + alpha : "") + ")";
  return res;
}
export default colorStringify;


import hsm from './hsm.js';
import coloroid from './coloroid.js';
import xyz from './xyz.js';
import xyy from './xyy.js';

console.log("--- HSM DEBUG ---");
const h=0, s=1, m=0.57;
const res = hsm.rgb(h, s, m);
console.log(`hsm.rgb(${h}, ${s}, ${m}) =`, res);

// Manual calculation check constants
const u_r = 3 / Math.sqrt(41);
console.log("u_r:", u_r);
console.log("cos(0):", Math.cos(0));


console.log("--- COLOROID DEBUG ---");
// XYZ from test 173 expected
const x_in = 0.56, y_in = 0.49, z_in = 0.19;
// Convert to xyy
const xyy_val = xyz.xyy(x_in, y_in, z_in);
console.log("xyy:", xyy_val);
// xyy to coloroid
const col = coloroid.xyy(...xyy_val);
console.log("coloroid:", col);


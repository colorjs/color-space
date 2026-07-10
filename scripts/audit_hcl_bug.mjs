/**
 * Track down the HCL green bug
 * Manual shows green should work, but space.hcl.rgb(120,100,94.26) gives [255,255,0]
 */
import space from '../index.js';

const PI = Math.PI;
const HCLgamma = 3;
const HCLy0 = 100;
const HCLmaxL = 0.530454533953517;

// Manual trace of hcl.rgb(120, 100, 94.259)
function hcl_rgb_manual(h360, c100, l100) {
  const h = h360/360;
  const c = c100/100;
  const l = l100/100;

  if (l === 0) return [0,0,0];

  const L = l * HCLmaxL;
  const Q = Math.exp((1 - c / (2 * L)) * (HCLgamma / HCLy0));
  const U = (2 * L - c) / (2 * Q - 1);
  const V = c / Q;

  const frac = x => x - Math.floor(x);
  const A = (h + Math.min(frac(2 * h) / 4, frac(-2 * h) / 8)) * PI * 2;

  let rgb = [0, 0, 0];
  let T;
  const H = h * 6;

  console.log(`  h=${h} H=${H} A_deg=${A*180/PI}`);
  console.log(`  L=${L} Q=${Q} U=${U} V=${V}`);
  console.log(`  frac(2h)=${frac(2*h)} frac(-2h)=${frac(-2*h)}`);
  console.log(`  min=${Math.min(frac(2*h)/4, frac(-2*h)/8)}`);

  if (H <= 0.999) {
    T = Math.tan(A);
    rgb[0] = 1;
    rgb[1] = T / (1 + T);
    console.log(`  Branch: H<=0.999 T=${T}`);
  } else if (H <= 1.001) {
    rgb[0] = 1;
    rgb[1] = 1;
    console.log(`  Branch: H<=1.001`);
  } else if (H <= 2) {
    T = Math.tan(A);
    rgb[0] = (1 + T) / T;
    rgb[1] = 1;
    console.log(`  Branch: H<=2 (H=${H}) T=${T} rgb[0]=${rgb[0]} rgb[1]=${rgb[1]}`);
  } else if (H <= 3) {
    T = Math.tan(A);
    rgb[1] = 1;
    rgb[2] = 1 + T;
    console.log(`  Branch: H<=3 T=${T}`);
  } else if (H <= 3.999) {
    T = Math.tan(A);
    rgb[1] = 1 / (1 + T);
    rgb[2] = 1;
    console.log(`  Branch: H<=3.999 T=${T}`);
  } else if (H <= 4.001) {
    rgb[1] = 0;
    rgb[2] = 1;
    console.log(`  Branch: H<=4.001`);
  } else if (H <= 5) {
    T = Math.tan(A);
    rgb[0] = -1 / T;
    rgb[2] = 1;
    console.log(`  Branch: H<=5 T=${T}`);
  } else {
    T = Math.tan(A);
    rgb[0] = 1;
    rgb[2] = -T;
    console.log(`  Branch: else (H=${H}) T=${T}`);
  }

  const result = [
    (rgb[0] * V + U) * 255,
    (rgb[1] * V + U) * 255,
    (rgb[2] * V + U) * 255
  ];
  console.log(`  pre-scale rgb=[${rgb}]`);
  console.log(`  result=[${result.map(v=>v.toFixed(2))}]`);
  return result;
}

console.log('=== Tracing hcl.rgb(120, 100, 94.259) ===');
hcl_rgb_manual(120, 100, 94.259);

console.log('\n=== Actual space.hcl.rgb output ===');
console.log(space.hcl.rgb(120, 100, 94.259));

// The issue: at H=2.0 exactly, the branch H<=2 applies
// But wait: H = h*6 = (120/360)*6 = 2.0
// T = tan(A) where A = (h + ...) * 2pi
// For h=1/3: A = (1/3 + min(frac(2/3)/4, frac(-2/3)/8)) * 2pi
//           = (1/3 + min(0.6667/4, 0.3333/8)) * 2pi
//           = (1/3 + min(0.1667, 0.0417)) * 2pi
//           = (1/3 + 0.0417) * 2pi
//           = (0.375) * 2pi
//           = 3pi/4 = 135 degrees
// T = tan(135) = -1
// rgb[0] = (1+(-1))/(-1) = 0
// rgb[1] = 1
// rgb[2] = 0 (not set)
// result = [0*V+U, 1*V+U, 0*V+U]*255

// But T = -1.000000000000002 due to floating point
// (1 + T) = -2e-16 (tiny negative)
// (1 + T) / T = -2e-16 / -1 = 2e-16 ≈ 0 -- this is fine!

// So manual says it should work... but space.hcl.rgb(120,...) gives [255,255,0]
// Let me check what H value is actually passed to hcl.rgb from the index.js chaining

console.log('\n=== Check if index.js chains through something ===');
// Check what space.hcl is exactly
console.log('space.hcl:', Object.keys(space.hcl));

// When we call space.hcl.rgb, what path does it take?
// hcl.rgb is defined in hcl.js
// rgb.hcl is defined in hcl.js
// If space chains through index.js and goes hcl -> xyz -> rgb, that could change things
// Let me check if there's a direct hcl.rgb or if it chains

// Try calling directly
import hcl_direct from '../spaces/hcl.js';
console.log('\n=== Direct hcl.js import ===');
console.log('hcl.rgb:', hcl_direct.rgb);
console.log('Direct hcl.rgb(120,100,94.259):', hcl_direct.rgb(120, 100, 94.259));
console.log('space.hcl.rgb(120,100,94.259):', space.hcl.rgb(120, 100, 94.259));

// Check if they're the same function
console.log('\n=== Are they the same function? ===');
console.log('Same?', hcl_direct.rgb === space.hcl.rgb);

// What about green roundtrip?
const greenHCL = space.rgb.hcl(0, 255, 0);
console.log('\n=== Green roundtrip ===');
console.log('rgb.hcl(0,255,0):', greenHCL);
console.log('hcl.rgb directly:', hcl_direct.rgb(...greenHCL));
console.log('space.hcl.rgb:', space.hcl.rgb(...greenHCL));

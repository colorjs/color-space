/**
 * Find out why hcl.rgb(120, 100, 94.259) gives [255,255,0] instead of [0,255,0]
 */
const PI = Math.PI;
const HCLgamma = 3;
const HCLy0 = 100;
const HCLmaxL = 0.530454533953517;
const frac = x => x - Math.floor(x);

function trace_hcl_rgb(h360, c100, l100) {
  const h = h360/360;
  const c = c100/100;
  const l = l100/100;

  if (l === 0) return [0,0,0];

  const L = l * HCLmaxL;
  const Q = Math.exp((1 - c / (2 * L)) * (HCLgamma / HCLy0));
  const U = (2 * L - c) / (2 * Q - 1);
  const V = c / Q;
  const A = (h + Math.min((2 * h) % 1 / 4, (-2 * h) % 1 / 8)) * PI * 2;  // NOTE: modulo not frac!

  console.log(`  h=${h} c=${c} l=${l}`);
  console.log(`  L=${L} Q=${Q} U=${U} V=${V}`);
  console.log(`  (2*h) % 1 = ${(2*h)%1} (-2*h) % 1 = ${(-2*h)%1}`);
  console.log(`  A = (${h} + min(${((2*h)%1)/4}, ${((-2*h)%1)/8})) * 2pi`);
  console.log(`  A = ${A} rad = ${A*180/PI} deg`);

  let rgb = [0, 0, 0];
  let T;
  const H = h * 6;

  if (H <= 0.999) {
    T = Math.tan(A);
    rgb[0] = 1;
    rgb[1] = T / (1 + T);
    console.log(`  Branch: H<=0.999`);
  } else if (H <= 1.001) {
    rgb[0] = 1;
    rgb[1] = 1;
    console.log(`  Branch: H<=1.001`);
  } else if (H <= 2) {
    T = Math.tan(A);
    rgb[0] = (1 + T) / T;
    rgb[1] = 1;
    console.log(`  Branch: H<=2 T=${T} rgb[0]=${rgb[0]}`);
  } else if (H <= 3) {
    T = Math.tan(A);
    rgb[1] = 1;
    rgb[2] = 1 + T;
    console.log(`  Branch: H<=3`);
  } else if (H <= 3.999) {
    T = Math.tan(A);
    rgb[1] = 1 / (1 + T);
    rgb[2] = 1;
    console.log(`  Branch: H<=3.999`);
  } else if (H <= 4.001) {
    rgb[1] = 0;
    rgb[2] = 1;
    console.log(`  Branch: H<=4.001`);
  } else if (H <= 5) {
    T = Math.tan(A);
    rgb[0] = -1 / T;
    rgb[2] = 1;
    console.log(`  Branch: H<=5`);
  } else {
    T = Math.tan(A);
    rgb[0] = 1;
    rgb[2] = -T;
    console.log(`  Branch: else`);
  }

  return [(rgb[0]*V+U)*255, (rgb[1]*V+U)*255, (rgb[2]*V+U)*255];
}

console.log('=== ACTUAL hcl.js code: A = (h + min((2*h)%1/4, (-2*h)%1/8)) * PI * 2 ===');
console.log('Note: JS modulo for negative numbers: -2/3 % 1 = -0.333... (NOT 0.333!)');
console.log('frac function subtracts floor: frac(-0.6667) = -0.6667 - (-1) = 0.3333');
console.log('But % operator in JS: -0.6667 % 1 = -0.6667 (keeps sign!)');
console.log('');

const h = 120/360;
console.log(`h = ${h}`);
console.log(`(2*h) % 1 = ${(2*h)%1} (positive, OK)`);
console.log(`(-2*h) % 1 = ${(-2*h)%1} (NEGATIVE! This is the bug!)`);
console.log(`frac(-2*h) = ${(-2*h) - Math.floor(-2*h)} (should be 0.3333, this is correct)`);
console.log('');

// The actual code in hcl.js:
// const A = (h + Math.min((2 * h) % 1 / 4, (-2 * h) % 1 / 8)) * PI * 2;
// For h = 1/3:
// (2 * 1/3) % 1 = 0.6667 -> /4 = 0.1667
// (-2 * 1/3) % 1 = -0.6667 -> /8 = -0.0833  (NEGATIVE!)
// min(0.1667, -0.0833) = -0.0833
// A = (1/3 + (-0.0833)) * 2pi = (0.25) * 2pi = pi/2 = 90 degrees
// T = tan(pi/2) = Infinity (or very large number)

const A_actual = (h + Math.min((2*h)%1/4, (-2*h)%1/8)) * PI * 2;
console.log(`A (actual code) = ${A_actual} rad = ${A_actual*180/PI} deg`);
console.log(`tan(A) = ${Math.tan(A_actual)}`);
console.log('');
console.log('=== This is the BUG: JS % operator preserves sign, not true modulo! ===');
console.log('=== The code should use: frac(x) = x - Math.floor(x) instead of x % 1 ===');
console.log('');

console.log('=== Tracing actual hcl.rgb(120, 100, 94.259) ===');
const result = trace_hcl_rgb(120, 100, 94.259);
console.log(`result = ${result.map(v=>v.toFixed(2))}`);

// Now let's verify: if we use frac instead of %, does it work?
console.log('\n=== What if we use frac instead of % ===');
{
  const h = 120/360;
  const frac = x => x - Math.floor(x);
  const A_fixed = (h + Math.min(frac(2*h)/4, frac(-2*h)/8)) * PI * 2;
  console.log(`A_fixed = ${A_fixed} rad = ${A_fixed*180/PI} deg`);
  console.log(`T = ${Math.tan(A_fixed)}`);
  // H=2, Branch: (1+T)/T, 1
  const T = Math.tan(A_fixed);
  const rgb0 = (1+T)/T;
  console.log(`rgb[0] = ${rgb0}`);
}

// Show which hues are affected
console.log('\n=== Comparison of % vs frac for all primaries ===');
const frac = x => x - Math.floor(x);
const primaries = [
  { name: 'red(0)',     h: 0 },
  { name: 'yellow(60)', h: 60/360 },
  { name: 'green(120)', h: 120/360 },
  { name: 'cyan(180)',  h: 180/360 },
  { name: 'blue(240)',  h: 240/360 },
  { name: 'magenta(300)', h: 300/360 },
];

for (const { name, h } of primaries) {
  const mod_pos = (2*h) % 1;
  const mod_neg = (-2*h) % 1;
  const frac_pos = frac(2*h);
  const frac_neg = frac(-2*h);
  const A_mod = (h + Math.min(mod_pos/4, mod_neg/8)) * PI * 2;
  const A_frac = (h + Math.min(frac_pos/4, frac_neg/8)) * PI * 2;
  const T_mod = Math.tan(A_mod);
  const T_frac = Math.tan(A_frac);
  const diff = Math.abs(A_mod - A_frac) > 0.001;
  console.log(`${name.padEnd(15)}: %: A=${(A_mod*180/PI).toFixed(1)}° T=${T_mod.toFixed(3)}  frac: A=${(A_frac*180/PI).toFixed(1)}° T=${T_frac.toFixed(3)} ${diff ? '<<< DIFFERENT' : 'same'}`);
}

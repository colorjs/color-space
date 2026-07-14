/**
 * Verify Chilliant HCL algorithm
 * Original source: http://www.chilliant.com/rgb2hsv.html
 */

const HCLgamma = 3;
const HCLy0 = 100;
const HCLmaxL = 0.530454533953517; // exp(HCLgamma / HCLy0) - 0.5
const PI = Math.PI;
const frac = x => x - Math.floor(x);

// Chilliant's original forward HCL (from HLSL source on that page):
// Reference C# / HLSL code:
// float HCLgamma = 3, HCLy0 = 100, HCLmaxL = 0.530454533953517;
// float3 RGBtoHCL(in float3 _RGB)
// {
//   float3 HCL;
//   float H = 0, U = min(_RGB.r, min(_RGB.g, _RGB.b));
//   float V = max(_RGB.r, max(_RGB.g, _RGB.b));
//   float Q = HCLgamma / HCLy0;
//   HCL.y = V - U;
//   if (HCL.y != 0)
//   {
//     H = atan2((_RGB.g - _RGB.b), (_RGB.r - _RGB.g)) / PI;
//     Q *= U / V;
//   }
//   Q = exp(Q);
//   HCL.x = frac(H / 2 - min(frac(H), frac(-H)) / 6) * HD;  // HD seems to be 1/6 scale?
//   HCL.z = (V + Q * U) / (2 * HCLmaxL);  // NOTE: not L=(V-U)*Q+U but (V + Q*U)/(2*maxL)!
//   HCL.y *= Q;
//   return HCL;
// }

// Wait, looking more carefully at the Chilliant source...
// Let me check if the L formula is different
// code has: const L = ((V - U) * Q + U) / (HCLmaxL * 2)
// vs what Chilliant might say: L = (V + Q*U) / (2 * maxL)

// Let me compute both for red
const r=1, g=0, b=0;
const U = Math.min(r,g,b); // 0
const V = Math.max(r,g,b); // 1
let Q_exp = HCLgamma / HCLy0;
const C = V - U;
let H_raw;
if (C !== 0) {
  H_raw = Math.atan2(g - b, r - g) / PI;
  Q_exp *= U / V; // U/V = 0/1 = 0
}
const Q = Math.exp(Q_exp);
const H_final_code = frac(H_raw/2 - Math.min(frac(H_raw), frac(-H_raw))/6);

const C_adjusted_code = C * Q;
const L_code = ((V - U) * Q + U) / (HCLmaxL * 2);

console.log('=== RED analysis ===');
console.log(`U=${U} V=${V} C=${C} H_raw=${H_raw} Q_exp=${Q_exp} Q=${Q}`);
console.log(`Code: H=${H_final_code} C=${C_adjusted_code} L=${L_code}`);

// Now let me look at the actual Chilliant source more carefully
// From the site: "Conversion from HCL to RGB"
// The inverse in code:
// const L = l * HCLmaxL;
// const Q = Math.exp((1 - c / (2 * L)) * (HCLgamma / HCLy0));
// const U = (2 * L - c) / (2 * Q - 1);
// const V = c / Q;
//
// For red: H=0, C=100/100=1, L=94.26/100=0.9426
// L_norm = L * HCLmaxL = 0.9426 * 0.5305 = 0.5
// Q = exp((1 - 1/(2*0.5)) * 3/100) = exp((1-1)*0.03) = exp(0) = 1
// U = (2*0.5 - 1) / (2*1 - 1) = 0/1 = 0
// V = 1/1 = 1
// That's correct for red with U=0, V=1

// The issue with GREEN:
// Green forward: H_code = 0.3333 (= 120/360)
// But Chilliant's own forward gives H_chilliant = 0.8125 (i.e. 292.5/360?)
// So the code uses a different hue formula than Chilliant's original!

// Let me check: maybe the code is a different version / equivalent mapping
// In the code's forward: H = frac(H_raw/2 - min(frac(H_raw), frac(-H_raw))/6)
// In Chilliant: H = frac(H + min(frac(2H)*0.25, frac(-2H)*0.125))  [using H = atan2/pi]
// Let's verify these are NOT equivalent for H_raw = atan2(g-b, r-g)/pi for all 6 primaries

const primaries = [
  { name: 'red',     r:1, g:0, b:0 },
  { name: 'yellow',  r:1, g:1, b:0 },
  { name: 'green',   r:0, g:1, b:0 },
  { name: 'cyan',    r:0, g:1, b:1 },
  { name: 'blue',    r:0, g:0, b:1 },
  { name: 'magenta', r:1, g:0, b:1 },
];

console.log('\n=== Hue comparison for primaries ===');
console.log('name       H_raw(pi)  Chilliant   Code        Diff');
for (const {name, r, g, b} of primaries) {
  const U = Math.min(r,g,b), V = Math.max(r,g,b);
  let Q_exp = HCLgamma/HCLy0;
  let H_r = 0;
  if (V-U !== 0) {
    H_r = Math.atan2(g-b, r-g)/PI;
    Q_exp *= U/V;
  }
  const chil = frac(H_r + Math.min(frac(2*H_r)*0.25, frac(-2*H_r)*0.125));
  const code = frac(H_r/2 - Math.min(frac(H_r), frac(-H_r))/6);
  console.log(`${name.padEnd(10)} ${H_r.toFixed(4).padEnd(10)} ${chil.toFixed(4).padEnd(11)} ${code.toFixed(4).padEnd(11)} ${Math.abs(chil-code).toFixed(4)}`);
}

// Now check: when we use Chilliant forward AND Chilliant inverse, does it round-trip?
// The inverse in the code might be designed for the CODE's forward, not Chilliant's.
// Let's test with the green:
console.log('\n=== Green HCL->RGB with code inverse ===');
{
  // Using code's forward: H=120/360=0.3333
  const [hC, cC, lC] = [120, 100, 94.259];
  const h = hC/360, c = cC/100, l = lC/100;
  const H = h * 6;
  const A = (h + Math.min(frac(2*h)/4, frac(-2*h)/8)) * PI * 2;
  const T = Math.tan(A);
  console.log(`H=${H} A=${A*180/PI} T=${T}`);
  // H<=2 branch: rgb[0]=(1+T)/T, rgb[1]=1
  const rgb0 = (1+T)/T; // = (1+(-1))/(-1) = 0
  const rgb1 = 1;
  const L = l * HCLmaxL;
  const Q_inv = Math.exp((1 - c/(2*L)) * HCLgamma/HCLy0);
  const U_inv = (2*L - c)/(2*Q_inv - 1);
  const V_inv = c/Q_inv;
  console.log(`L=${L} Q=${Q_inv} U=${U_inv} V=${V_inv}`);
  const R = (rgb0*V_inv + U_inv)*255;
  const G = (rgb1*V_inv + U_inv)*255;
  const B = (0*V_inv + U_inv)*255;
  console.log(`Result: [${R.toFixed(1)}, ${G.toFixed(1)}, ${B.toFixed(1)}]`);
  console.log('Expected: [0, 255, 0]');
}

// So green DOES round-trip correctly with H_code=0.3333!
// Then why did the test show green->hcl->back=[255,255,0]?
// Let me re-run the actual conversion to check
import space from '../index.js';
console.log('\n=== Green via space.rgb.hcl + space.hcl.rgb ===');
const greenHCL = space.rgb.hcl(0, 255, 0);
console.log('Green HCL:', greenHCL);
const greenBack = space.hcl.rgb(...greenHCL);
console.log('Green HCL->RGB:', greenBack);

// Something is wrong with the actual space chaining?
// Let me check what hue value rgb.hcl gives for green
console.log('\n=== Manual check of rgb.hcl for green ===');
{
  const r255=0, g255=255, b255=0;
  const rn=r255/255, gn=g255/255, bn=b255/255;
  const U = Math.min(rn,gn,bn);
  const V = Math.max(rn,gn,bn);
  let Q_exp = HCLgamma/HCLy0;
  let H_r = 0;
  const Cv = V - U;
  if (Cv !== 0) {
    H_r = Math.atan2(gn-bn, rn-gn)/PI;
    Q_exp *= U/V; // U=0, so Q_exp=0, Q=exp(0)=1
  }
  const Q = Math.exp(Q_exp);
  const frac2 = x => x - Math.floor(x);
  const H_code = frac2(H_r/2 - Math.min(frac2(H_r), frac2(-H_r))/6);
  const C_adj = Cv * Q;
  const L_val = ((V - U) * Q + U) / (HCLmaxL * 2);
  console.log(`H_raw=${H_r} H_code=${H_code} H*360=${H_code*360}`);
  console.log(`C_adj=${C_adj*100} L_val=${L_val*100}`);
  // space.rgb.hcl returns [H*360, C*100, L*100]
  console.log(`Expected output: [${H_code*360}, ${C_adj*100}, ${L_val*100}]`);
  console.log(`Actual space output: [${greenHCL}]`);
}

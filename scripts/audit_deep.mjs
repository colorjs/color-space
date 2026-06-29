/**
 * Deep analysis of discovered issues
 */
import space from '../index.js';
import * as culori from 'culori';

const round = (v, d=4) => Math.round(v * 10**d) / 10**d;

// =========================================================
// 1. HCY vs HSI: they are IDENTICAL implementations
//    HSI.rgb.js and HCY.rgb.js have exactly the same formula
//    But HCY claims Y = Luminance (perceptual), not Intensity (avg)
// =========================================================
console.log('=== 1. HCY vs HSI: Are they the same formula? ===');
{
  // Both use: i = sum / 3 (which is arithmetic intensity = average)
  // HCY SHOULD use: Y = 0.299*r + 0.587*g + 0.114*b (perceived luminance)
  // The paper "Hue-Preserving Color Blending" by Jan Morovic uses intensity as base
  // but the *correct* HCY uses luminance weights
  // Kuzma Shapran's HCY uses Pr=0.299, Pg=0.587, Pb=0.114
  // Source: https://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html

  const [r255, g255, b255] = [92, 191, 84];
  const r = r255/255, g = g255/255, b = b255/255;
  const intensityBased = (r + g + b) / 3;
  const lumaBased = 0.299*r + 0.587*g + 0.114*b;
  const currentY = space.rgb.hcy(r255, g255, b255)[2];

  console.log(`  Current HCY Y for [92,191,84]: ${round(currentY, 3)}`);
  console.log(`  Intensity (avg): ${round(intensityBased*100, 3)}`);
  console.log(`  Luma (Rec601): ${round(lumaBased*100, 3)}`);
  console.log(`  HCY uses: ${Math.abs(currentY - intensityBased*100) < 0.001 ? 'INTENSITY (same as HSI)' : 'LUMA'}`);
  console.log('  ISSUE: HCY and HSI are IDENTICAL implementations. HCY should use luminance weights.');
}

// =========================================================
// 2. HCL round-trip failures
//    Green [0,255,0] -> hcl=[120,100,94.26] -> back=[255,255,0] (WRONG!)
//    The HCL->RGB formula maps H=120 to the wrong sector
// =========================================================
console.log('\n=== 2. HCL round-trip failures ===');
{
  const cases = [
    { name: 'green', rgb: [0, 255, 0] },
    { name: 'magenta', rgb: [255, 0, 255] },
    { name: 'white', rgb: [255, 255, 255] },
    { name: 'gray', rgb: [128, 128, 128] },
  ];

  for (const { name, rgb } of cases) {
    const hcl = space.rgb.hcl(...rgb);
    const back = space.hcl.rgb(...hcl);
    console.log(`  ${name}: rgb=${JSON.stringify(rgb)} -> hcl=${hcl.map(v=>round(v,2))} -> rgb=${back.map(v=>round(v,1))}`);
  }

  // The issue: H=120 in rgb.hcl maps to H*360=120, i.e. H/360=0.333
  // In hcl.rgb: H = h * 6 = 0.333 * 6 = 2.0
  // Branch H<=2 assigns: rgb[0]=(1+T)/T, rgb[1]=1
  // But H exactly 2.0 goes to <= 2 branch which is for green sector, that's correct
  // Let's trace: H=120 -> h=120/360=0.333 -> H=h*6=2.0
  // Branch: H <= 2 (but H > 1.001) -> T=tan(A), rgb[0]=(1+T)/T, rgb[1]=1
  // A = (h + min(frac(2*h)/4, frac(-2*h)/8)) * PI * 2
  // frac(2*h) = frac(0.6667) = 0.6667
  // frac(-2*h) = frac(-0.6667) = 0.3333
  // min(0.6667/4, 0.3333/8) = min(0.1667, 0.0417) = 0.0417
  // A = (0.3333 + 0.0417) * 2*PI = 0.375 * 2*PI = 0.75*PI = 135 degrees
  // T = tan(135 deg) = -1
  // rgb[0] = (1 + (-1)) / (-1) = 0 / -1 = 0
  // rgb[1] = 1
  // So pure[0,1,2] = [0, 1, 0] -> green sector before V/U adjustment
  // Seems OK for green... let me check the actual failure

  console.log('\n  Tracing H=120 conversion:');
  const h = 120/360;
  const H = h * 6;
  console.log(`  h=${round(h,4)} H=${round(H,4)}`);
  const frac = (x) => x - Math.floor(x);
  const A = (h + Math.min(frac(2*h)/4, frac(-2*h)/8)) * Math.PI * 2;
  console.log(`  frac(2h)=${round(frac(2*h),4)} frac(-2h)=${round(frac(-2*h),4)}`);
  console.log(`  min=${round(Math.min(frac(2*h)/4, frac(-2*h)/8),4)}`);
  console.log(`  A=${round(A,4)} rad = ${round(A*180/Math.PI,2)} deg`);
  const T = Math.tan(A);
  console.log(`  T=${round(T,4)}`);
  console.log(`  Branch H<=2: rgb[0]=(1+T)/T=${round((1+T)/T,4)}, rgb[1]=1`);

  // Now check U, V values for green
  const greenHCL = space.rgb.hcl(0, 255, 0);
  console.log(`  Green HCL: ${greenHCL.map(v=>round(v,3))}`);
  // The issue is that the HCL->RGB formula computes *which* pure[2] is set
  // In branch H<=2: only rgb[0] and rgb[1] are set, rgb[2]=0 (black)
  // So result[2] = 0*V + U = U, result[1] = 1*V+U, result[0]=(1+T)/T*V+U
  // If U>0 this adds a floor, making all channels > 0
  // But original green has rgb[2]=0 -- only works if U=0

  // The problem with gray (128,128,128): chroma=0, so C=0
  // In rgb.hcl: when C=0, H=0 -> H stays 0
  // In hcl.rgb: gray should reconstruct fine with C=0
  // Let me check:
  const grayHCL = space.rgb.hcl(128, 128, 128);
  console.log(`\n  Gray HCL: ${grayHCL.map(v=>round(v,3))}`);
  const grayBack = space.hcl.rgb(...grayHCL);
  console.log(`  Gray HCL->RGB: ${grayBack.map(v=>round(v,1))}`);
  // Gray has C=0, so Q = exp((1 - 0/(2*L)) * gamma/y0) = exp(gamma/y0)
  // U = (2L - 0) / (2Q - 1) = 2L/(2Q-1)
  // V = 0 / Q = 0
  // rgb[i] = 0*V + U = U for all i
  // So result = [U*255, U*255, U*255]
  // U must equal L for gray round-trip
  console.log('  This reveals HCL has fundamental gray round-trip error (non-trivial)');
}

// =========================================================
// 3. TSL inverse (tsl.rgb) is producing negative B values
//    The formula r + g + B = 1 (in normalized space) but k scaling breaks it
// =========================================================
console.log('\n=== 3. TSL inverse formula analysis ===');
{
  // The TSL paper: Terrillon & Akamatsu 2000
  // Normalized coords: r' = r/sum - 1/3, g' = g/sum - 1/3
  // Inverse: given T, S, L -> r, g, b
  // T = g'!=0 ? (0.5 - atan2(g', r') / (2pi)) : 0  (in 0-1 range)
  // Wait: T in 0-360, then T/360 = 0..1
  //
  // Forward:
  // r' = r/sum - 1/3
  // g' = g/sum - 1/3
  // T = 0.5 - atan2(g', r')/(2pi)  [in 0..1]
  // S = sqrt(9/5 * (r'^2 + g'^2))
  // L = 0.299*r + 0.587*g + 0.114*b  [L in 0-255 here since r,g,b are 0-255]
  //
  // Inverse:
  // x = tan(2pi*(T-0.25)) where T is in 0..1
  // From T: r'/g' = x  (i.e. r_norm/g_norm = tan(angle))
  // S^2 = 9/5 * (r'^2 + g'^2) = 9/5 * g'^2 * (1 + x^2)
  // g'^2 = S^2 * 5/9 / (1 + x^2)  => g' = sqrt(5S^2/(9(1+x^2)))
  // r' = g' * x
  // but in code: r = sqrt(5S^2 / (9*(1/x^2 + 1))) = sqrt(5S^2 * x^2 / (9*(1+x^2)))
  //            = |x| * sqrt(5S^2/(9*(1+x^2)))
  // That's r' and g' (normalized chromaticities). Then:
  // r_actual = (r' + 1/3) * k
  // g_actual = (g' + 1/3) * k
  // b_actual = (1 - r_actual - g_actual) * k ?
  // But k = L / (0.185*r_actual + 0.473*g_actual + 0.114)
  //       = L / (0.185*(r'+1/3) + 0.473*(g'+1/3) + 0.114)
  // This is L / (0.185*r + 0.473*g + 0.114) where r,g are unnormalized?
  //
  // The issue: B = k*(1 - r - g) can be negative if r+g > 1!
  // Since r and g are from the inverse formula, they might sum > 1

  // Test with red [255,0,0]:
  const tslRed = space.rgb.tsl(255, 0, 0);
  console.log(`  TSL of red [255,0,0]: ${tslRed.map(v=>round(v,4))}`);
  const backRed = space.tsl.rgb(...tslRed);
  console.log(`  TSL->RGB back: ${backRed.map(v=>round(v,2))}`);

  // Why does it fail? Let's trace manually
  const [T360, S, L255] = tslRed;
  const T = T360 / 360;
  const x_sq = Math.tan(2*Math.PI*(T - 0.25))**2;
  console.log(`  T=${round(T,4)}, x^2=${round(x_sq,4)}`);
  const r_norm = Math.sqrt(5*S**2 / (9*(1/x_sq + 1))) + 1/3;
  const g_norm = Math.sqrt(5*S**2 / (9*(x_sq + 1))) + 1/3;
  console.log(`  r_norm=${round(r_norm,4)} g_norm=${round(g_norm,4)} sum=${round(r_norm+g_norm,4)}`);
  const k = L255 / (0.185*r_norm + 0.473*g_norm + 0.114);
  console.log(`  k=${round(k,4)}`);
  const B = k * (1 - r_norm - g_norm);
  console.log(`  B=${round(B,4)} (negative if r+g>1)`);

  console.log('\n  ROOT CAUSE: In tsl.rgb, r and g already include +1/3 offset (so they are');
  console.log('  in approximately [0,1] range). Then B = k*(1-r-g) can be negative when r+g>1.');
  console.log('  The formula is computing unnormalized chromaticity coords, not true 0..1 values.');
  console.log('  The inverse is fundamentally broken for saturated colors.');

  // Try tsl.rgb from a correctly forward-computed tsl:
  // White -> T=0, S=0, L=255
  const whiteResult = space.tsl.rgb(0, 0, 255);
  console.log(`\n  tsl.rgb(T=0, S=0, L=255): ${whiteResult.map(v=>round(v,1))}`);
  // The problem: when S=0, the sqrt terms = 0, so r = 1/3, g = 1/3, B = k*(1-2/3) = k/3
  // k = 255 / (0.185/3 + 0.473/3 + 0.114) = 255 / (0.2193/3+0.114) ...
  // = 255 / (0.658/3 + 0.114) = 255 / (0.219 + 0.114) = 255 / 0.333 = 765
  // R = 765 * 1/3 = 255, G = 765 * 1/3 = 255, B = 765 * 1/3 = 255 -- OK for achromatic!
}

// =========================================================
// 4. HSI / HCY black case produces NaN
// =========================================================
console.log('\n=== 4. HSI/HCY black (and achromatic) NaN ===');
{
  // When r=g=b=0 (black): sum=0, so rNorm=0/0=NaN
  // acos argument becomes NaN
  // No guard for sum=0

  // Also for white/gray: rNorm=gNorm=bNorm=1/3
  // acos arg = (0.5*(0+0)) / sqrt(0) = 0/0 = NaN
  // Need guard for when all channels equal

  const cases = [[0,0,0],[255,255,255],[128,128,128]];
  for (const c of cases) {
    const hsi = space.rgb.hsi(...c);
    console.log(`  rgb.hsi(${c}): ${hsi.map(v=>round(v,3))} [has NaN: ${hsi.some(isNaN)}]`);
  }
  console.log('  FIX NEEDED: Guard for sum=0 (black) and for rNorm=gNorm=bNorm (achromatic)');
}

// =========================================================
// 5. Check for specific HCL mapping bug at green H=120
// =========================================================
console.log('\n=== 5. HCL H=120 (green) mapping trace ===');
{
  // The frac function and A computation
  const h = 120/360; // 0.33333...
  const H = h * 6;  // 2.0 exactly
  const frac = x => x - Math.floor(x);

  // A = (h + min(frac(2h)/4, frac(-2h)/8)) * 2pi
  const f1 = frac(2*h); // frac(0.6667) = 0.6667
  const f2 = frac(-2*h); // frac(-0.6667) = 0.3333 (because frac of negative = 1 - frac of positive when non-integer)
  console.log(`  h=${h} H=${H}`);
  console.log(`  frac(2h)=${round(f1,4)} frac(-2h)=${round(f2,4)}`);
  console.log(`  f1/4=${round(f1/4,4)} f2/8=${round(f2/8,4)}`);
  const chosen = Math.min(f1/4, f2/8);
  const A = (h + chosen) * 2 * Math.PI;
  const T = Math.tan(A);
  console.log(`  chosen=${round(chosen,4)} A=${round(A,4)} T=${round(T,4)}`);

  // H=2.0 -> branch H<=2 (and H>1.001)
  // rgb[0] = (1+T)/T, rgb[1] = 1, rgb[2] = 0 (not set)
  const rgb0 = (1+T)/T;
  console.log(`  Branch H<=2: rgb[0]=${round(rgb0,4)} rgb[1]=1 rgb[2]=0`);

  // Now U, V
  const greenHCL = space.rgb.hcl(0, 255, 0);
  const [hv, cv, lv] = greenHCL;
  // Reconstruct from hcl.rgb internals
  const hN = hv/360;
  const cN = cv/100;
  const lN = lv/100;
  const HCLmaxL = 0.530454533953517;
  const HCLgamma = 3;
  const HCLy0 = 100;
  const L = lN * HCLmaxL;
  const Q = Math.exp((1 - cN/(2*L)) * (HCLgamma/HCLy0));
  const U = (2*L - cN) / (2*Q - 1);
  const V = cN / Q;
  console.log(`\n  Green HCL=[${[hv,cv,lv].map(v=>round(v,3))}]`);
  console.log(`  L=${round(L,4)} Q=${round(Q,4)} U=${round(U,4)} V=${round(V,4)}`);
  console.log(`  Final rgb: [${[(rgb0*V+U)*255, (1*V+U)*255, (0*V+U)*255].map(v=>round(v,2))}]`);
  console.log(`  Expected: [0, 255, 0]`);
  console.log('  Issue: rgb[0] = (1+T)/T is NOT 0 even though it should map green correctly');
  console.log('  The HCL scheme at boundary H=2 puts rgb[0]=(1+T)/T which with T=tan(135deg)=-1');
  console.log('  gives 0/(-1)=0. But T here is tan(A) with A≠135deg. Let me check...');
  console.log(`  A = ${round(A*180/Math.PI,2)} degrees, T = ${round(T,4)}`);
}

// =========================================================
// 6. HCL inverse formula check vs source
//    Source: http://www.chilliant.com/rgb2hsv.html
// =========================================================
console.log('\n=== 6. HCL algorithm analysis ===');
{
  // The rgb.hcl forward function uses:
  // H = atan2(g-b, r-g) / PI -> range [-1,1]
  // Then H = frac(H/2 - min(frac(H), frac(-H))/6) -> maps to [0,1]

  // For green [0,255,0]: r=0, g=1, b=0 (normalized)
  // H_raw = atan2(g-b, r-g) / PI = atan2(1-0, 0-1) / PI = atan2(1,-1)/PI
  // = (-3pi/4)/pi = -0.75 (in pi units... wait atan2 returns radians)
  // atan2(1,-1) = 3pi/4 (135 degrees) -> / PI = 0.75 (in PI multiples)
  const r=0, g=1, b=0;
  const H_raw = Math.atan2(g-b, r-g) / Math.PI;
  console.log(`  Green: H_raw = atan2(${g-b},${r-g})/PI = ${round(H_raw,4)}`);

  const frac = x => x - Math.floor(x);
  const H_final = frac(H_raw/2 - Math.min(frac(H_raw), frac(-H_raw))/6);
  console.log(`  frac(H_raw)=${round(frac(H_raw),4)} frac(-H_raw)=${round(frac(-H_raw),4)}`);
  console.log(`  H_final = frac(${round(H_raw/2,4)} - ${round(Math.min(frac(H_raw),frac(-H_raw))/6,4)}) = ${round(H_final,4)}`);
  console.log(`  H*360 = ${round(H_final*360,2)} (should map green to ~120)`);

  // This shows the problem: Chilliant's HCL hue encoding is NOT a simple 0-360 hue
  // The transformation is non-linear and not symmetric. When we output H*360, the inverse
  // needs the corresponding inverse of this non-linear mapping.
  // The hcl.rgb code uses A = (h + ...) * 2pi which is the inverse, but
  // let's check if it correctly inverts

  // Actually the Chilliant HLSL code is:
  // Forward: HCLgamma = 3, HCLy0 = 100, HCLmaxL = 0.530454533953517
  // float HCL_Hue = atan2(G - B, R - G) / PI;
  // float HCL_Chroma = V - U;
  // if (HCL_Chroma != 0)
  //   HCL_Hue += min(frac(HCL_Hue * 2) * 0.25, frac(-HCL_Hue * 2) * 0.125);
  // HCL_Hue = frac(HCL_Hue);
  //
  // vs in code: H = frac(H/2 - min(frac(H),frac(-H))/6)
  // These are different! Let's check:

  // Chilliant ORIGINAL:
  const HC_orig = frac(H_raw + Math.min(frac(H_raw*2)*0.25, frac(-H_raw*2)*0.125));
  console.log(`\n  Chilliant ORIGINAL H = frac(H_raw + ...) = ${round(HC_orig,4)}`);

  // Code implementation:
  const HC_code = frac(H_raw/2 - Math.min(frac(H_raw), frac(-H_raw))/6);
  console.log(`  Code implementation: frac(H_raw/2 - ...) = ${round(HC_code,4)}`);

  console.log('\n  These should be the same mathematically. Let me verify:');
  // frac(H/2 - min(frac(H),frac(-H))/6) vs frac(H + min(frac(2H)*0.25, frac(-2H)*0.125))
  // Let H_raw = h (in pi units). Let H_norm = h (already ÷ PI).
  // Chilliant uses atan2 directly (radians/pi), so H in [-1,1]
  // Code uses same H (divided by pi).
  // Chilliant: frac(H + min(frac(2H)/4, frac(-2H)/8))
  // Code: frac(H/2 - min(frac(H),frac(-H))/6)
  // These are NOT the same formula! The code seems different.

  const H = H_raw;
  const chil = frac(H + Math.min(frac(2*H)/4, frac(-2*H)/8));
  const code = frac(H/2 - Math.min(frac(H),frac(-H))/6);
  console.log(`  H_raw=${round(H,4)}: Chilliant=${round(chil,4)} Code=${round(code,4)} Match=${Math.abs(chil-code)<1e-6}`);

  // Test more values
  for (const h of [0, 0.25, 0.5, 0.75, -0.5, -0.25, 0.75, -0.75]) {
    const c = frac(h + Math.min(frac(2*h)/4, frac(-2*h)/8));
    const d = frac(h/2 - Math.min(frac(h),frac(-h))/6);
    if (Math.abs(c-d) > 0.001) {
      console.log(`  MISMATCH at h=${h}: Chilliant=${round(c,4)} Code=${round(d,4)}`);
    }
  }
}

console.log('\n=== DONE ===');

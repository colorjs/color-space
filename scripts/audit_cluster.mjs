/**
 * Audit script for cluster: hsl, hsv, hsi, hwb, hcg, hcy, hcl, hsp, hsm, tsl
 * Checks:
 *  1. Roundtrip rgb->X->rgb for each space
 *  2. Cross-reference vs culori / colorjs.io where available
 *  3. Edge cases: black/white/gray/pure primaries + NaN/Infinity check
 */
import space from '../index.js';

// culori for reference
import * as culori from 'culori';

// We'll use colorjs for additional reference
// colorjs uses 0-1 for all channels except hue 0-360

const round = (v, d=4) => Math.round(v * 10**d) / 10**d;

// Test colors as RGB 0-255
const testColors = [
  { name: 'black',   rgb: [0, 0, 0] },
  { name: 'white',   rgb: [255, 255, 255] },
  { name: 'red',     rgb: [255, 0, 0] },
  { name: 'green',   rgb: [0, 255, 0] },
  { name: 'blue',    rgb: [0, 0, 255] },
  { name: 'cyan',    rgb: [0, 255, 255] },
  { name: 'magenta', rgb: [255, 0, 255] },
  { name: 'yellow',  rgb: [255, 255, 0] },
  { name: 'gray',    rgb: [128, 128, 128] },
  { name: 'arb1',   rgb: [92, 191, 84] },
  { name: 'arb2',   rgb: [51, 102, 204] },
];

function maxAbsErr(a, b) {
  return Math.max(...a.map((v, i) => Math.abs(v - b[i])));
}

function hasNaN(arr) {
  return arr.some(v => isNaN(v) || !isFinite(v));
}

// =========================================================
// HSL
// =========================================================
console.log('\n=== HSL ===');
{
  let maxRoundtrip = 0, maxRef = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hsl = space.rgb.hsl(r, g, b);
    if (hasNaN(hsl)) { nanCases.push(name + ' rgb->hsl'); continue; }
    const back = space.hsl.rgb(...hsl);
    if (hasNaN(back)) { nanCases.push(name + ' hsl->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    maxRoundtrip = Math.max(maxRoundtrip, err);

    // culori reference: returns {mode, h, s, l} with h 0-360, s/l 0-1
    const cRef = culori.hsl(culori.rgb({ mode: 'rgb', r: r/255, g: g/255, b: b/255 }));
    if (cRef) {
      const cH = (cRef.h || 0);
      const cS = (cRef.s || 0) * 100;
      const cL = (cRef.l || 0) * 100;
      // Compare H circularly
      const dH = Math.abs(((hsl[0] - cH + 540) % 360) - 180);
      const dS = Math.abs(hsl[1] - cS);
      const dL = Math.abs(hsl[2] - cL);
      const refErr = Math.max(dH, dS, dL);
      if (refErr > 0.01 && name !== 'black' && name !== 'white' && name !== 'gray') {
        console.log(`  HSL ref mismatch [${name}]: cs=[${round(hsl[0])},${round(hsl[1])},${round(hsl[2])}] culori=[${round(cH)},${round(cS)},${round(cL)}] err=${round(refErr)}`);
      }
      maxRef = Math.max(maxRef, refErr);
    }
  }
  console.log(`HSL: maxRoundtripErr=${round(maxRoundtrip)} maxRefErr=${round(maxRef)} nanCases=${JSON.stringify(nanCases)}`);
}

// =========================================================
// HSV
// =========================================================
console.log('\n=== HSV ===');
{
  let maxRoundtrip = 0, maxRef = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hsv = space.rgb.hsv(r, g, b);
    if (hasNaN(hsv)) { nanCases.push(name + ' rgb->hsv'); continue; }
    const back = space.hsv.rgb(...hsv);
    if (hasNaN(back)) { nanCases.push(name + ' hsv->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    maxRoundtrip = Math.max(maxRoundtrip, err);

    // culori reference
    const cRef = culori.hsv(culori.rgb({ mode: 'rgb', r: r/255, g: g/255, b: b/255 }));
    if (cRef) {
      const cH = cRef.h || 0;
      const cS = (cRef.s || 0) * 100;
      const cV = (cRef.v || 0) * 100;
      const dH = Math.abs(((hsv[0] - cH + 540) % 360) - 180);
      const dS = Math.abs(hsv[1] - cS);
      const dV = Math.abs(hsv[2] - cV);
      const refErr = Math.max(dH, dS, dV);
      if (refErr > 0.01) console.log(`  HSV ref mismatch [${name}]: err=${round(refErr)}`);
      maxRef = Math.max(maxRef, refErr);
    }
  }
  console.log(`HSV: maxRoundtripErr=${round(maxRoundtrip)} maxRefErr=${round(maxRef)} nanCases=${JSON.stringify(nanCases)}`);
}

// =========================================================
// HSI
// =========================================================
console.log('\n=== HSI ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  // culori doesn't have HSI, no reference comparison
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hsi = space.rgb.hsi(r, g, b);
    if (hasNaN(hsi)) { nanCases.push(name + ' rgb->hsi'); continue; }
    const back = space.hsi.rgb(...hsi);
    if (hasNaN(back)) { nanCases.push(name + ' hsi->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.1) console.log(`  HSI roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HSI: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // Test the known black-division case explicitly
  console.log('  HSI black: rgb->hsi =', space.rgb.hsi(0, 0, 0));
}

// =========================================================
// HWB
// =========================================================
console.log('\n=== HWB ===');
{
  let maxRoundtrip = 0, maxRef = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hwb = space.rgb.hwb(r, g, b);
    if (hasNaN(hwb)) { nanCases.push(name + ' rgb->hwb'); continue; }
    const back = space.hwb.rgb(...hwb);
    if (hasNaN(back)) { nanCases.push(name + ' hwb->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HWB roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);

    // culori reference
    const cRef = culori.hwb(culori.rgb({ mode: 'rgb', r: r/255, g: g/255, b: b/255 }));
    if (cRef) {
      const cH = cRef.h || 0;
      const cW = (cRef.w || 0) * 100;
      const cB = (cRef.b || 0) * 100;
      const dH = Math.abs(((hwb[0] - cH + 540) % 360) - 180);
      const dW = Math.abs(hwb[1] - cW);
      const dBk = Math.abs(hwb[2] - cB);
      const refErr = Math.max(dH, dW, dBk);
      if (refErr > 0.05) console.log(`  HWB ref mismatch [${name}]: cs=[${hwb.map(v=>round(v,2))}] culori=[${round(cH,2)},${round(cW,2)},${round(cB,2)}] err=${round(refErr)}`);
      maxRef = Math.max(maxRef, refErr);
    }
  }
  console.log(`HWB: maxRoundtripErr=${round(maxRoundtrip)} maxRefErr=${round(maxRef)} nanCases=${JSON.stringify(nanCases)}`);
}

// =========================================================
// HCG
// =========================================================
console.log('\n=== HCG ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hcg = space.rgb.hcg(r, g, b);
    if (hasNaN(hcg)) { nanCases.push(name + ' rgb->hcg'); continue; }
    const back = space.hcg.rgb(...hcg);
    if (hasNaN(back)) { nanCases.push(name + ' hcg->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HCG roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HCG: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // Check division-by-zero edge: when chroma=1, grayscale = min/(1-chroma) = div by zero
  const pureSaturated = space.rgb.hcg(255, 0, 0); // chroma=1, 1-chroma=0
  console.log('  HCG pure red (chroma=1 edge):', pureSaturated);
}

// =========================================================
// HCY (Hue, Chroma, Luminance)
// =========================================================
console.log('\n=== HCY ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hcy = space.rgb.hcy(r, g, b);
    if (hasNaN(hcy)) { nanCases.push(name + ' rgb->hcy'); continue; }
    const back = space.hcy.rgb(...hcy);
    if (hasNaN(back)) { nanCases.push(name + ' hcy->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HCY roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HCY: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // HCY vs HSI - check if they are the same code (they look identical)
  const hsi_r = space.rgb.hsi(92, 191, 84);
  const hcy_r = space.rgb.hcy(92, 191, 84);
  console.log('  HCY vs HSI for arb1: hsi=', hsi_r.map(v=>round(v,3)), 'hcy=', hcy_r.map(v=>round(v,3)));
  console.log('  (Are HCY and HSI identical implementations? They should differ for luminance vs intensity)');
}

// =========================================================
// HCL (Chilliant HCL, not CIE LCh)
// =========================================================
console.log('\n=== HCL ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hcl = space.rgb.hcl(r, g, b);
    if (hasNaN(hcl)) { nanCases.push(name + ' rgb->hcl'); continue; }
    const back = space.hcl.rgb(...hcl);
    if (hasNaN(back)) { nanCases.push(name + ' hcl->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HCL roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err,2)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HCL: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // Check the specific constants cited in the implementation
  // HCLmaxL = exp(3/100) - 0.5 -- verify
  const claimed = 0.530454533953517;
  const computed = Math.exp(3/100) - 0.5;
  console.log(`  HCLmaxL: claimed=${claimed} computed=${computed} match=${Math.abs(claimed-computed) < 1e-10}`);
}

// =========================================================
// HSP
// =========================================================
console.log('\n=== HSP ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hsp = space.rgb.hsp(r, g, b);
    if (hasNaN(hsp)) { nanCases.push(name + ' rgb->hsp'); continue; }
    const back = space.hsp.rgb(...hsp);
    if (hasNaN(back)) { nanCases.push(name + ' hsp->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HSP roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HSP: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // Verify luminance coefficients match Darel Rex Finley's original
  // http://alienryderflex.com/hsp.html
  // Pr=0.299, Pg=0.587, Pb=0.114 -- exactly Rec601 luma coefficients
  // Check: 0.299+0.587+0.114 = 1.0
  const sum = 0.299 + 0.587 + 0.114;
  console.log(`  HSP Pr+Pg+Pb = ${sum} (should be 1.0)`);

  // Test perceived brightness of white: sqrt(0.299+0.587+0.114) = 1.0 -> P=100
  const whitePB = space.rgb.hsp(255, 255, 255);
  console.log(`  HSP white: [${whitePB.map(v=>round(v,2))}] (expect P=100)`);
}

// =========================================================
// HSM
// =========================================================
console.log('\n=== HSM ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const hsm = space.rgb.hsm(r, g, b);
    if (hasNaN(hsm)) { nanCases.push(name + ' rgb->hsm'); continue; }
    const back = space.hsm.rgb(...hsm);
    if (hasNaN(back)) { nanCases.push(name + ' hsm->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  HSM roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`HSM: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // Saturation edge: check m=1 (boundary issue in rgb.hsm - last interval `m < 1` excludes m=1)
  const white = space.rgb.hsm(255, 255, 255);
  console.log(`  HSM white: ${JSON.stringify(white)} (S should be 0)`);

  // Forward with known values
  const red = space.rgb.hsm(255, 0, 0);
  console.log(`  HSM red: ${red.map(v=>round(v,2))}`);
}

// =========================================================
// TSL
// =========================================================
console.log('\n=== TSL ===');
{
  let maxRoundtrip = 0;
  const nanCases = [];
  for (const { name, rgb: [r, g, b] } of testColors) {
    const tsl = space.rgb.tsl(r, g, b);
    if (hasNaN(tsl)) { nanCases.push(name + ' rgb->tsl'); continue; }
    const back = space.tsl.rgb(...tsl);
    if (hasNaN(back)) { nanCases.push(name + ' tsl->rgb'); continue; }
    const err = maxAbsErr([r, g, b], back);
    if (err > 0.5) console.log(`  TSL roundtrip [${name}]: orig=[${[r,g,b]}] back=[${back.map(v=>round(v,1))}] err=${round(err)}`);
    maxRoundtrip = Math.max(maxRoundtrip, err);
  }
  console.log(`TSL: maxRoundtripErr=${round(maxRoundtrip)} nanCases=${JSON.stringify(nanCases)}`);

  // TSL white special case
  const white = space.rgb.tsl(255, 255, 255);
  console.log(`  TSL white: [${white.map(v=>round(v,3))}] (T: undefined/0, S: 0, L: sum*k)`);

  // TSL black
  const black = space.rgb.tsl(0, 0, 0);
  console.log(`  TSL black: [${black}] (L=0 -> NaN check)`);

  // Division by zero check in tsl.rgb when S=0 (tan(x) could be 0)
  // T=90deg -> tan would be infinite at pi/2 - but T is mapped to 0-1 and into (2pi*(T-1/4))
  // At T=0.5 (180 deg): 2pi*(0.5-0.25) = 2pi*0.25 = pi/2 => tan(pi/2) = Infinity
  console.log('  TSL.rgb T=180: result=', space.tsl.rgb(180, 0.5, 100));

  // Check k computation: L / (.185*r + .473*g + .114)
  // If r,g are both 1/3 (achromatic), check denominator
  console.log('  TSL.rgb achromatic (T=45, S=0, L=100):', space.tsl.rgb(45, 0, 100));
}

// =========================================================
// Extra: deep-check NaN edges
// =========================================================
console.log('\n=== Edge case NaN survey ===');
{
  const edgeCases = [
    { name: 'black', r: 0, g: 0, b: 0 },
    { name: 'very dark', r: 1, g: 0, b: 0 },
  ];

  for (const { name, r, g, b } of edgeCases) {
    const hsi = space.rgb.hsi(r, g, b);
    const hcy = space.rgb.hcy(r, g, b);
    const hsp = space.rgb.hsp(r, g, b);
    const tsl = space.rgb.tsl(r, g, b);
    const hcg = space.rgb.hcg(r, g, b);
    console.log(`[${name}] HSI=${JSON.stringify(hsi.map(v=>round(v,3)))} HCY=${JSON.stringify(hcy.map(v=>round(v,3)))} HSP=${JSON.stringify(hsp.map(v=>round(v,3)))} TSL=${JSON.stringify(tsl.map(v=>round(v,3)))} HCG=${JSON.stringify(hcg.map(v=>round(v,3)))}`);
  }
}

// =========================================================
// Specific: HCY vs HSI - are they the same?
// =========================================================
console.log('\n=== HCY vs HSI implementation comparison ===');
{
  const colors = [[100, 150, 200], [92, 191, 84], [51, 102, 204]];
  for (const [r, g, b] of colors) {
    const hsi = space.rgb.hsi(r, g, b);
    const hcy = space.rgb.hcy(r, g, b);
    console.log(`  rgb=[${r},${g},${b}] hsi=[${hsi.map(v=>round(v,3))}] hcy=[${hcy.map(v=>round(v,3))}] identical=${JSON.stringify(hsi) === JSON.stringify(hcy)}`);
  }
}

// =========================================================
// Specific: HCY luminance vs HSI intensity check
// HCY is documented as (Hue, Chroma, Luminance) but uses intensity (r+g+b)/3
// Real luminance would use 0.299*r + 0.587*g + 0.114*b
// =========================================================
console.log('\n=== HCY luminance check ===');
{
  const [r, g, b] = [0.299, 0.587, 0.114]; // deliberately test luma coeff colors
  const rgb255 = [r * 255, g * 255, b * 255];
  const hcy = space.rgb.hcy(...rgb255);
  const lumaExpected = (r * 255 * 0.299 + g * 255 * 0.587 + b * 255 * 0.114) / 255 * 100;
  const intensityExpected = (r + g + b) / 3 * 100;
  console.log(`  rgb255=[${rgb255.map(v=>round(v,1))}]`);
  console.log(`  hcy Y=${round(hcy[2],3)}`);
  console.log(`  luma (BT601) would be ${round(lumaExpected,3)}`);
  console.log(`  intensity (avg) would be ${round(intensityExpected,3)}`);
  console.log(`  HCY uses: ${Math.abs(hcy[2]-lumaExpected) < Math.abs(hcy[2]-intensityExpected) ? 'luma' : 'intensity'}`);
}

// =========================================================
// HCL constant verification
// =========================================================
console.log('\n=== HCL constant verification ===');
{
  // HCLmaxL is claimed = exp(gamma / y0) - 0.5 where gamma=3, y0=100
  const gamma = 3, y0 = 100;
  const correct = Math.exp(gamma / y0) - 0.5;
  const inCode = 0.530454533953517;
  console.log(`  exp(${gamma}/${y0}) - 0.5 = ${correct}`);
  console.log(`  Code constant: ${inCode}`);
  console.log(`  Match: ${Math.abs(correct - inCode) < 1e-10}`);

  // Check round-trip for non-black colors
  const colors = [
    [255, 0, 0], [0, 255, 0], [0, 0, 255],
    [128, 128, 128], [92, 191, 84]
  ];
  for (const rgb of colors) {
    const hcl = space.rgb.hcl(...rgb);
    const back = space.hcl.rgb(...hcl);
    const err = maxAbsErr(rgb, back);
    console.log(`  HCL roundtrip [${rgb}]: hcl=[${hcl.map(v=>round(v,2))}] back=[${back.map(v=>round(v,1))}] err=${round(err,2)}`);
  }
}

// =========================================================
// TSL detailed analysis
// =========================================================
console.log('\n=== TSL formula analysis ===');
{
  // In rgb.tsl: T is derived using atan2 — but note:
  // T = 0.5 - atan2(g_, r_) / (2*PI) when g_!=0, else T=0
  // But g_ = (g/sum) - 1/3 could be 0 for specific grays
  // On full black: sum=0 -> r_=0, g_=0, so T=0 which is correct

  // In tsl.rgb: x = tan(2*pi*(T - 0.25))
  //   At T=0 -> tan(2*pi*(-0.25)) = tan(-pi/2) = -Infinity
  //   At T=0.5 -> tan(2*pi*(0.25)) = tan(pi/2) = +Infinity
  // This means for T=0 or T=0.5 (180 deg) the formula breaks

  const problematic = [0, 90, 180, 270, 360];
  for (const T of problematic) {
    const Tnorm = T / 360;
    const x_raw = Math.tan(2 * Math.PI * (Tnorm - 0.25));
    console.log(`  T=${T}: tan(2pi*(${round(Tnorm,3)}-0.25)) = ${round(x_raw,3)} [${isFinite(x_raw) ? 'finite' : 'INFINITE'}]`);
    const result = space.tsl.rgb(T, 0.5, 100);
    console.log(`    tsl.rgb(${T}, 0.5, 100) = ${JSON.stringify(result.map(v=>round(v,1)))}`);
  }
}

// =========================================================
// HSM saturation boundary check at m=1
// =========================================================
console.log('\n=== HSM boundary at m=1 ===');
{
  // In rgb.hsm, the last interval is:
  // else if (6/7 < m && m < 1)   <- strictly less than 1
  // So m=1 (white: r=g=b=255 -> m=(4*1+2*1+1)/7=1) falls into s=0 (else s=0)
  // That means white has s=0 correctly, but via `else s=0` fallthrough, not explicit
  const white = space.rgb.hsm(255, 255, 255);
  console.log(`  White HSM: ${white.map(v=>round(v,2))} (S should be 0, M should be 100)`);

  // Check that m=1 case is handled correctly
  // Also m=0 edge (black):
  const black = space.rgb.hsm(0, 0, 0);
  console.log(`  Black HSM: ${black.map(v=>round(v,2))} (S should be 0, M should be 0)`);

  // Check d=0 case (atan of 0/0 in hue computation):
  // When d=0 (achromatic), hue uses `|| 0` to handle NaN:
  // theta = acos(.../ (d || 0)) -- actually it's sqrt(dr*dr+dg*dg+db*db) = d
  // and formula is || 0, so when d=0 -> acos(0) = pi/2?
  // Actually: Math.acos(((3*dr - 4*dg - 4*db) / Math.sqrt(41 * (dr**2 + dg**2 + db**2))) || 0)
  // When all deviations are 0, sqrt term = 0, ratio = 0/0 = NaN, NaN || 0 = 0
  // acos(0) = pi/2 -> theta = pi/2
  // h = (b<=g) ? (pi/2)/(2*pi) : 1 - same = 0.25 -> 90 degrees
  const gray = space.rgb.hsm(128, 128, 128);
  console.log(`  Gray HSM: ${gray.map(v=>round(v,2))} (S should be 0, H is irrelevant but expect 90)`);
}

// =========================================================
// Summary of issues found
// =========================================================
console.log('\n=== Summary ===');
console.log('Check output above for specific issues');

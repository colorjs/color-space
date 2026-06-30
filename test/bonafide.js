// Bona-fide cited reference values (audit pass). Each asserts an authoritative
// input->output, NOT a self-referential round-trip. Scale-aware tolerance.
import space from '../index.js'
import test, { is } from 'tst'

const REF = [
  {"s":"hct","f":"xyz","t":"hct","in":[41.24,21.26,1.93],"out":[27.4072,113.3965,53.2329],"src":"colorjs.io HCT (Material viewing conditions): XYZ red primary"},
  {"s":"cam16","f":"xyz","t":"cam16","in":[41.23908,21.263901,1.933082],"out":[46.025701,81.254248,27.393257],"src":"colorjs.io v0.5 toCam16 (same viewing conditions: La=64/pi*0.2, Yb=20,"},
  {"s":"cmy","f":"rgb","t":"cmy","in":[255,0,0],"out":[0,100,100],"src":"Gonzalez & Woods, \\'Digital Image Processing\\' 4th ed., Eq. 6-79: [C,M,Y"},
  {"s":"cmyk","f":"cmyk","t":"rgb","in":[0,81,81,30],"out":[178.5,33.915,33.915],"src":"CSS Color 4 §10.3 device-cmyk naive conversion formula: R=255*(1-min(1"},
  {"s":"coloroid","f":"xyy","t":"coloroid","in":[0.235644,0.641004,36],"out":[70,70,60],"src":"Nemcsics 1980, Color Res. Appl. 5(2): A=70 limit color xλ=0.20262,yλ=0.77472; inverse at T=70"},
  {"s":"cubehelix","f":"cubehelix","t":"rgb","in":[0.5],"out":[184.32579375,98.60563125,127.5],"src":"Green, D.A. (2011) \\'A colour scheme for the display of astronomical in"},
  {"s":"din99o-lab","f":"lab-d65","t":"din99o-lab","in":[53.23711559542936,80.09011352310385,67.20326351172214],"out":[57.289,39.498,30.518],"src":"Hand-derived from the DIN 6176:2001 forward formula (kE=1, kCH=1, thet"},
  {"s":"din99o-lch","f":"rgb","t":"din99o-lch","in":[0,0,255],"out":[36.02575,51.50863,308.33688],"src":"colour-science 0.4.7 Lab_to_DIN99(np.array([32.29701, 79.18894, -107.8"},
  {"s":"gray","f":"rgb","t":"gray","in":[255,0,0],"out":[0.21263900587151],"src":"IEC 61966-2-1:1999 (sRGB standard), Annex A: Y-row of the sRGB->XYZ D6"},
  {"s":"hcg","f":"rgb","t":"hcg","in":[255,0,0],"out":[0,100,0],"src":"color-convert v2.0.1 (npm) — the canonical JS HCG implementation; conv"},
  {"s":"hcl","f":"rgb","t":"hcl","in":[200,100,50],"out":[17.710034118052,59.266364437914,74.345869934708],"src":"Hand-traced through Chilliant\\'s RGB-to-HCL algorithm (http://www.chill"},
  {"s":"hcy","f":"rgb","t":"hcy","in":[255,0,0],"out":[0,100,29.9],"src":"Chilliant, \\'RGB to HCY colour\\' (2012), http://chilliant.blogspot.com/2"},
  {"s":"hpluv","f":"hpluv","t":"rgb","in":[0,100,50],"out":[163.14205083632,101.48236975862,114.00047700395],"src":"colorjs.io v0.5.2: new Color(\\'hpluv\\', [0, 100, 50]).to(\\'srgb\\').coords "},
  {"s":"hsi","f":"rgb","t":"hsi","in":[255,0,0],"out":[0,100,33.33333333333333],"src":"Gonzalez & Woods, \\'Digital Image Processing\\' 4th ed., §6.3.3, HSI mode"},
  {"s":"hsluv","f":"rgb","t":"hsluv","in":[255,0,0],"out":[12.1770506301,100,53.2371155954],"src":"colorjs.io v0.5: new Color(\\'#FF0000\\').to(\\'hsluv\\').coords — [12.1770506"},
  {"s":"hsm","f":"rgb","t":"hsm","in":[255,0,0],"out":[0,100,57.143],"src":"Derived from Bianconi et al., \\'A New Color Space for Skin-Color Detect"},
  {"s":"hsp","f":"rgb","t":"hsp","in":[255,0,0],"out":[0,100,54.680892457969264],"src":"Darel Rex Finley, \\'RGB to HSP Color Model\\', http://alienryderflex.com/"},
  {"s":"jpeg","f":"rgb","t":"jpeg","in":[100,150,200],"out":[140.75,161.4368,98.9344],"src":"ITU-T T.871 (2011) §7 and Wikipedia \\'YCbCr – JPEG conversion\\' table. H"},
  {"s":"labh","f":"xyz","t":"labh","in":[41.239079926595,21.263900587151,1.9330818715591],"out":[46.11279712525689,83.96223524337029,29.583908506904507],"src":"Hunter (1948) D65-adapted formula, manually derived: L=10*sqrt(Y)=10*s"},
  {"s":"lms","f":"xyz","t":"lms","in":[41.23908,21.263901,1.933082],"out":[39.041037,7.091446,2.313899],"src":"CIE 159:2004 (CIECAM02) CAT02 forward matrix M_CAT02 = [[0.7328, 0.429"},
  {"s":"okhsl","f":"rgb","t":"okhsl","in":[127,50,200],"out":[302.4413377082429,84.58003023916605,42.741790435452856],"src":"Derived by running Björn Ottosson\\'s reference JavaScript implementatio"},
  {"s":"okhsv","f":"rgb","t":"okhsv","in":[255,0,0],"out":[29.2339,100,100],"src":"Björn Ottosson\\'s okhsv reference implementation (linear_srgb_to_okhsv)"},
  {"s":"oklrab","f":"rgb","t":"oklrab","in":[255,0,0],"out":[56.8085,22.4863,12.5846],"src":"colorjs.io v0.5: Color(\\'srgb\\',[1,0,0]).to(\\'oklab\\') -> L=0.62796, a=0.2"},
  {"s":"oklrch","f":"rgb","t":"oklrch","in":[255,0,0],"out":[56.808465250408624,25.76833077361567,29.233885192342633],"src":"Manually derived from Björn Ottosson\\'s Oklab/colorpicker formulas (htt"},
  {"s":"osaucs","f":"xyz","t":"osaucs","in":[20.654008,12.197225,5.136952],"out":[-3.0049979,2.997137,-9.6678423],"src":"colour-science v0.4.7, XYZ_to_OSA_UCS(np.array([0.20654008, 0.12197225"},
  {"s":"rg","f":"rgb","t":"rg","in":[255,0,0],"out":[1,0],"src":"Direct arithmetic from definition: r = R/(R+G+B) = 255/255 = 1, g = 0/"},
  {"s":"rgb","f":"rgb","t":"xyz","in":[255,0,0],"out":[41.239079926595934,21.263900587151028,1.9330818715591822],"src":"colorjs.io v0.5: new Color(\\'srgb\\',[1,0,0]).to(\\'xyz-d65\\').coords scaled"},
  {"s":"tsl","f":"rgb","t":"tsl","in":[255,0,0],"out":[206.56505117707798,1,76.245],"src":"Computed from the canonical formula in Terrillon J.C. & Akamatsu S. (2"},
  {"s":"ucs","f":"xyz","t":"ucs","in":[41.2391,21.2639,1.9331],"out":[27.4927,21.2639,12.2429],"src":"Derived by hand from the CIE 1960 UCS definition U=(2/3)X, V=Y, W=(-X+"},
  {"s":"uvw","f":"xyz","t":"uvw","in":[41.239079926595,21.263900587151,1.9330818715591],"out":[171.80039039452177,24.715033319020314,52.2608238403668],"src":"Hand-derived from CIE 1964 U*V*W* formulas (Wyszecki & Stiles, Color S"},
  {"s":"xvycc","f":"rgb","t":"xvycc","in":[255,0,0],"out":[62.5594,102.33584824315585,240],"src":"Derived from ITU-R BT.709-6 (2015) Table 1 luma coefficients Kr=0.2126"},
  {"s":"xyb","f":"rgb","t":"xyb","in":[255,0,0],"out":[0.028100083161277323,0.4881882010413151,-0.01652922538774071],"src":"culori v4 converter(\\'xyb\\')({ mode:\\'rgb\\', r:1, g:0, b:0 }) — culori imp"},
  {"s":"xyy","f":"xyz","t":"xyy","in":[41.239079926596,21.263900587151,1.9330818715591],"out":[0.64,0.33,21.263900587151],"src":"colorjs.io v0.5.2: new Color(\\'srgb\\',[1,0,0]).to(\\'xyz-d65\\').coords * 10"},
  {"s":"xyz-abs-d65","f":"rgb","t":"xyz-abs-d65","in":[255,0,0],"out":[83.715332,43.165718,3.924156],"src":"colorjs.io v0.5 (new Color(\\'srgb\\',[1,0,0]).to(\\'xyz-abs-d65\\').coords), "},
  {"s":"ycbcr","f":"rgb","t":"ycbcr","in":[255,0,0],"out":[62.56,102.34,240],"src":"ITU-R BT.709 limited-range: Y=16+219·0.2126, Cr=240"},
  {"s":"yccbccrc","f":"rec2020-linear","t":"yccbccrc","in":[1,0,0],"out":[0.503085,-0.259269,0.500116],"src":"ITU-R BT.2020-2 Table 4 constant-luminance: Rec.2020 red primary -> Yc=oetf(0.2627), piecewise chroma"},
  {"s":"ycgco","f":"rgb","t":"ycgco","in":[255,0,0],"out":[0.25,-0.25,0.5],"src":"Derived from the YCgCo analog forward transform Y = 1/4·R + 1/2·G + 1/"},
  {"s":"ydbdr","f":"rgb","t":"ydbdr","in":[0,0,255],"out":[0.114,1.333,0.217],"src":"Wikipedia \\'YDbDr\\' article, matrix table; derivation: Y=0.114×1=0.114, "},
  {"s":"yes","f":"rgb","t":"yes","in":[255,0,0],"out":[0.253,0.5,0.25],"src":"Agaian, Panetta, Nercessian (2007) \\'A New Measure of Image Enhancement"},
  {"s":"yiq","f":"rgb","t":"yiq","in":[255,0,0],"out":[0.299,0.595716,0.211456],"src":"FCC NTSC 1953 forward matrix, hand-computed: Y=0.299*1+0.587*0+0.114*0"},
  {"s":"ypbpr","f":"rgb","t":"ypbpr","in":[255,0,0],"out":[0.2126,-0.11457210605733996,0.5],"src":"ITU-R BT.709-6 (2015), Section 3 \\'Signal format\\', Table 1: Kr=0.2126, "},
  {"s":"yuv","f":"rgb","t":"yuv","in":[255,0,0],"out":[0.299,-0.14713,0.615],"src":"ITU-R BT.470-7 (2005) Table 1 / Wikipedia \\'YUV\\' article §\\'Conversion t"},
]

test('bona-fide reference values (43 audited spaces)', () => {
  for (const r of REF) {
    const got = space[r.f][r.t](...r.in)
    for (let k = 0; k < r.out.length; k++) {
      const tol = 0.01 + 0.002 * Math.abs(r.out[k])
      is(Math.abs(got[k] - r.out[k]) <= tol, true,
        r.s + ' ' + r.f + '->' + r.t + ' ch' + k + ': got ' + got[k].toFixed(4) + ' exp ' + r.out[k] + ' [' + r.src + ']')
    }
  }
})

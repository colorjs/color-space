# colour

## summary
I matched every color-space catalog space to colour-science (colour 0.4.7) and checked each mapping numerically against the JS library. No repo files were changed.

Method: dump_node.mjs records `space.rgb[id](r,g,b)` for 14 sRGB samples across all 162 spaces (primaries, secondaries, gray, white, mid-tones, near-black). colour_verify.py then evaluates each Python one-liner exactly as stored, with only `np`, `colour` and `rgb` in scope. Error is max |colour − color-space| divided by the channel range from data.json. Hue is compared circularly and skipped on achromatic samples. The pass threshold is 1e-3 of range.

Results for the 162 catalog spaces (rgb→space):
- **126 verified.** Most agree to 1e-11 to 1e-14. Every residual above 1e-6 has a named cause: colour ships rounded published matrices (ProPhoto/RIMM, DJI), Ottosson's original Oklab matrix, a 0.02 offset in the HDR lightness, and DIN99o constants.
- **4 convention-diff:**
  - acesproxy: one 10-bit code value apart, from a rounding boundary.
  - cct-duv: agrees to 7.9e-9 inside the defined CCT domain only.
  - wavelength: agrees to 7.1e-4 except on purples.
  - munsell: value agrees to ~1e-5, but hue and chroma interpolate differently, and colour raises on 4 of 14 samples.
- **32 none:** colour 0.4.7 has no equivalent. I confirmed this by grepping the installed package source.

I also checked 35 inverse (space→rgb) snippets: 30 verified and 5 convention-diff (oklab, oklch, prophoto, acescg, acescct). Those 5 are under 1 sRGB code value off, on channels near zero.

Every entry has three forms:
- `python`: fully self-contained.
- `pythonShort`: uses a shared preamble (colour_preamble.py) and was checked to give identical errors.
- `pythonSRGB`: the plain call through colour's 'sRGB' colourspace, with its own error so the trade-off is visible.

Each entry also lists what it `requires`. I checked this in a clean venv with only colour-science 0.4.7 and numpy:
- kelvin, cct-duv, wavelength, dsh and munsell need scipy.
- `colour.convert` needs networkx.
- Everything else runs on colour-science + numpy alone.

The main finding for a Python tab: colour's 'sRGB' colourspace carries the rounded 4-decimal IEC matrix, which costs about 1e-4. Decoding with `colour.cctf_decoding(...,'sRGB')` and converting through 'ITU-R BT.709', whose matrix colour derives from the primaries, matches color-space to ~1e-14.

I also found a likely bug in color-space itself, in acescg: `rgb.acescg(255,255,255)` = [0.99992, 1.00001, 1.00030] instead of [1,1,1].

To run the checks I installed networkx into the scratch Python venv and created a second clean venv at scratchpad/pyclean. Both are outside the research folder.

## recommendation
How to use this for the Python code tab:

1. **Show the preamble plus the short form.** Display colour_preamble.py once (`rgb`, D65, D50, `lin = colour.cctf_decoding(rgb/255,'sRGB')`, `XYZ = colour.RGB_to_XYZ(lin,'ITU-R BT.709')`), then each entry's `pythonShort`. Prefer it over the plain `colour.sRGB_to_XYZ` / `colour.convert(...,'sRGB',...)`: colour's 'sRGB' uses the rounded IEC matrix (~1e-4 off), while 'ITU-R BT.709' derives it the CSS way (~1e-14). One footnote can explain this.

2. **Show the requirements line.** Default is `pip install colour-science numpy`. Add scipy for kelvin, cct-duv, wavelength, dsh and munsell. Avoid `colour.convert` in snippets: it needs networkx and returns the 0..1 scale unless `to_reference_scale=True`.

3. **Show tabs by status:**
   - **verified (126):** show the tab.
   - **convention-diff (acesproxy, cct-duv, wavelength, munsell):** show the tab with the one-line caveat from `notes`. For munsell, consider labelling it "approximate".
   - **none (32):** hide the Python tab, or say "not in colour-science 0.4.7".
   - **din99d-plain:** this is a reference row, not a space. Use it only to justify the explicit X' step in the din99d snippet.

4. **Shortest snippets, if needed.** The composed and convention entries (hwb, hct, din99d, cct-duv, nayatani95 `max(C,0)`, viperlog/filmicpro `np.maximum`, smpte-c/240m signed OETFs, a98rgb derived matrix) are what make them match exactly. Swapping in the simpler `pythonSRGB` / `pythonAlt` forms costs the errors recorded in their maxErrRel fields.

5. **Separate from the tab: the acescg finding.** spaces/acescg.js (and gl/acescg.glsl.js, dist) hard-code a D65<->ACES matrix that maps D65 to Z=1.009125 instead of 1.008825, so sRGB white is not ACEScg [1,1,1] (B = 1.0003). Recompute it as Bradford D65 (0.3127, 0.3290) → ACES white (0.32168, 0.33767), citing ACES S-2014-004. Run `npm test` and test/aces-vendor.js afterwards, since aces2065-1, acescc/acescct/acesproxy and the camera-log→ACES comparisons all inherit it.

6. **Re-run after any color-space change.** Run `node dump_node.mjs node_values.json` from the repo, then `.../py/bin/python colour_verify.py`.

## files
['<session-scratch>/research/colour_verify.py', '<session-scratch>/research/colour.json', '<session-scratch>/research/colour_preamble.py', '<session-scratch>/research/colour_deps_check.py', '<session-scratch>/research/colour_deps.json', '<session-scratch>/research/dump_node.mjs', '<session-scratch>/research/node_values.json']

## facts
- [fetched-primary] colour-science latest release and requirements: 0.4.7 is the latest on PyPI (uploaded 2025-12-06); requires_python >=3.11,<3.15; numpy>=2; networkx and scipy are only in the 'optional' extra (https://pypi.org/pypi/colour-science/json)
- [computed] Coverage of catalog spaces, rgb->space: 162 spaces: 126 verified (<=1e-3 of range, most <=1e-11), 4 convention-diff (acesproxy, cct-duv, wavelength, munsell), 32 none (research/colour_verify.py -> research/colour.json (14 sRGB samples vs color-space 3.1.0 index.js))
- [computed] Inverse (space->rgb) snippets checked: 35 checked: 30 verified, 5 convention-diff (oklab, oklch, prophoto, acescg, acescct; all under 1 sRGB code value, on channels near zero) (research/colour_verify.py (INV list))
- [computed] colour's 'sRGB' colourspace uses the rounded IEC 61966-2-1 matrix, not a derived one: matrix_RGB_to_XYZ = [[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]], use_derived_matrix=False; 'ITU-R BT.709' carries the derived NPM (0.412390799...). Plain sRGB_to_XYZ path costs ~1e-4 relative; cctf_decoding + 'ITU-R BT.709' brings it to ~1e-14 (e.g. xyz 5.8e-5 -> 2.3e-14, p3 6.9e-4 -> 1.3e-13) (colour 0.4.7 RGB_COLOURSPACES inspection + harness maxErrRel vs maxErrRelSRGB)
- [computed] colour.convert needs networkx and returns the '1' scale by default: Without networkx it raises ImportError ('NetworkX related API features ... not available'). convert(rgb,'sRGB','CIE Lab') gives L=0.532 for red unless to_reference_scale=True (53.23); Oklch hue 0.081 vs 29.22 deg (executed in research env and in a clean venv)
- [computed] Optional dependencies needed by specific snippets: kelvin and cct-duv (uv_to_CCT Krystek 1985 uses scipy.optimize), wavelength, dsh and munsell (scipy.spatial) need scipy; colour.convert needs networkx; all other snippets run with colour-science 0.4.7 + numpy only (research/colour_deps_check.py in a venv with only colour-science==0.4.7 + numpy 2.4.6 -> research/colour_deps.json)
- [computed] Bradford must be passed explicitly: RGB_to_RGB / sRGB_to_XYZ / RGB_to_XYZ default chromatic_adaptation_transform='CAT02'; color-space uses Bradford for lab (D50), xyz-d50, prophoto, rimm, acescg, aces2065-1, dci-p3, ntsc, cie-rgb (inspect.signature in colour 0.4.7)
- [computed] CIELAB D50 (CSS lab()) equivalent: colour.XYZ_to_Lab(colour.RGB_to_XYZ(lin,'ITU-R BT.709',illuminant=D50,chromatic_adaptation_transform='Bradford'), illuminant=D50): maxErrRel 2.2e-7 (colour.json entry 'lab')
- [computed] Camera logs match colour's log encodings: All 25 colour-0.4.7 log curves (slog/slog2/slog3, sgamut3cine, logc3 EI800, logc4, vlog, log3g10 v3, log3g12, redlog, redlogfilm, clog/clog2/clog3 in_reflection=True, bmdfilm, davinci, dlog, tlog, protune, flog, flog2, nlog, applelog, llog, milog) are verified with linear camera-gamut RGB via RGB_to_RGB: max 6.5e-5 (dlog), most 1e-11 to 1e-14. cineon/panalog/viperlog/filmicpro work on linear sRGB; viperlog/filmicpro need np.maximum(...,0) because color-space clamps black (colour.json)
- [computed] OPPO O-Log availability: Not in colour 0.4.7 (absent from LOG_ENCODINGS; no OPPO/OLog in the source); refs.js cites it from colour 'develop' (colour.LOG_ENCODINGS keys + grep of installed package)
- [computed] CAM16 equivalent: XYZ_to_CAM16(XYZ*100, XYZ_w=[95.047,100,108.883], L_A=64/pi*0.2, Y_b=20, surround=VIEWING_CONDITIONS_CAM16['Average']) -> [J,M,h] agrees to 9.9e-14; CAM16-UCS/LCD/SCD via JMh_CAM16_to_* agree to ~3e-14 (spaces/cam16.js viewingConditions + colour.json)
- [computed] HCT via colour primitives: No HCT function in colour. Composed [CAM16 h, CAM16 C under XYZ_w=D65*100, L_A=200/pi*luminance(50)/100, Y_b=luminance(50)] + CIE L* gives 8.9e-14 (colour.json entry 'hct')
- [computed] colour's DIN99d omits Cui et al. 2002 X' step: XYZ_to_DIN99(method='DIN99d') differs by 0.207 of range (blue a: 31.97 vs 11.28). Applying X'=1.12X-0.12Z to the sample and to the white, then Lab_to_DIN99(...,'DIN99d'), agrees to 4.3e-14 (colour.json entries din99d / din99d-plain; color-space spaces/din99d.js comment)
- [fetched-primary] DIN99o maps to colour method 'DIN99b': Agrees to <=5e-4. Residual comes from colour's constants (303.67, chroma factor 23.0) vs DIN 6176 exact 100/ln(1.39)=303.671 and 1/0.0435=22.989 (colour/models/din99.py DIN99_METHODS['DIN99b']=[303.67,0.0039,26,0.83,23.0,0.075,26,1]; spaces/din99o-lab.js)
- [fetched-primary] hdr-CIELab/hdr-IPT residual: 2.0e-4 of range, from the '+ 0.02' lightness offset in colour's Fairchild 2011 hdr lightness, which color-space omits (colour/colorimetry/lightness.py lines 383/449 (installed 0.4.7); spaces/hdr-cie-lab.js)
- [computed] colour Oklab is not neutral at D65: colour.XYZ_to_Oklab(D65 white) = [0.9999988, -2.18e-5, -1.23e-4] (Ottosson's original XYZ->LMS M1). Forward oklab differs by 1.5e-4 of range; inverse is up to 0.95 sRGB code value on channels near zero (executed in colour 0.4.7)
- [computed] Possible color-space bug in acescg D65<->ACES adaptation: spaces/acescg.js M_ADAPT_D65_TO_ACES maps D65 to XYZ [0.952643, 1.0000033, 1.009125]; the ACES white (0.32168, 0.33767) is [0.952646, 1, 1.008825]. space.rgb.acescg(255,255,255) = [0.99992, 1.00001, 1.00030] while colour gives [1,1,1]; acescg.xyz(1,1,1) = [95.0454, 99.99951, 108.8733]. Max difference from a Bradford matrix computed by colour: 1.9e-4 (node index.js + colour.adaptation.matrix_chromatic_adaptation_VonKries(D65, ACES white, 'Bradford'))
- [computed] colour colourspace transfer curves differ from color-space for several legacy spaces: colour 'Pal/Secam' and 'NTSC (1953)' use gamma 2.8 and 'SMPTE C' uses gamma 2.2; color-space uses 2.2 / 2.2 / BT.709 OETF. The snippets apply the curve explicitly (gamma_function 'Mirror', sign-mirrored oetf_BT709/oetf_SMPTE240M) and agree to <=2e-4 (RGB_COLOURSPACES[...].cctf_encoding keywords; colour.json)
- [computed] Published rounded matrices in colour: Max |matrix - derived NPM|: ProPhoto/RIMM 2.05e-4, DJI D-Gamut 1.84e-4; Adobe RGB (1998) uses the 5-decimal published matrix. ACEScg, ACES2065-1, CIE RGB and BMD WG are derived/exact. a98rgb needs the derived NPM plus a 'Mirror' gamma, because colour's built-in cctf returns NaN for negatives (colour.normalised_primary_matrix vs matrix_RGB_to_XYZ)
- [computed] rec2020 transfer constants: color-space uses a=1.09929682680944, b=0.018053968510807 (CSS Color 4); colour.models.oetf_BT2020 defaults to the rounded 10-bit pair. is_12_bits_system=True gives 2.45e-6 (transfers.js + colour.json)
- [computed] HDR conventions reproduced: rec2100-pq = eotf_inverse_ST2084(lin2020*203); rec2100-hlg = oetf_BT2100_HLG(lin2020*oetf_inverse_BT2100_HLG(0.75)); jzazbz/izazbz/icacb use XYZ*203; ictcp = RGB_to_ICtCp(lin2020*203); dcdm = eotf_inverse_DCDM(XYZ*48). All <=1e-9 (colour.json)
- [computed] Chilliant HCL equals colour.RGB_to_HCL rescaled: colour.RGB_to_HCL(rgb01)*[180/pi, 150, 100/RGB_to_HCL(ones)[2]] agrees to 4.3e-16 (colour.json entry 'hcl')
- [computed] Munsell: color-space's value matches colour ASTM D1535 when Y*0.975 is used (agreement ~1e-5; 1943 Newhall polynomial = ASTM x 1/0.975). Hue/chroma differ up to ~0.9 hue step and 2.2 chroma; colour raises on 4/14 samples (V<1, beyond renotation data, non-convergence). Status convention-diff (colour.json entry 'munsell' + per-sample run)
- [computed] CCT/Duv: kelvin = clip(uv_to_CCT(uv, method='Krystek 1985'), 1000, 25000) agrees to 1.7e-8. cct-duv composed from Krystek uv_to_CCT/CCT_to_uv agrees to 7.9e-9 on the 6/14 samples inside 1000-25000 K, |Duv|<=0.05. colour's default Ohno 2013 differs by 1.06e-3 there (colour.json entries kelvin / cct-duv)
- [computed] Dominant wavelength quantisation: colour.dominant_wavelength returns the nearest CMFS sample (integer nm with the default 1 nm CMFS -> 1.45e-3 error). Aligning the CMFS to SpectralShape(360,780,0.1) gives 7.1e-4 on non-purples. For purples color-space's 'wavelength' snaps to 380/700 nm while colour returns -complementary; dsh uses the signed convention in both and agrees to 8.3e-4 (colour.json entries wavelength / dsh)
- [computed] Spaces with no colour-science 0.4.7 equivalent: hsi, yiq, yuv, ydbdr, yes, ohta, tsl, hsp, hsm, hcg, hcy, rg, ryb, maxwell, macboyn, dkl, xyb, okhsl, okhsv, okhwb, oklrab, oklrch, hsluv, hpluv, coloroid, photoycc, ral-design, ostwald, lalphabeta, anlab, srlab2, olog (32) (colour graph node list + grep of installed colour source (0 matches for each name; 'Ohta' hits are only the ColorChecker dataset))

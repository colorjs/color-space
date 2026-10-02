// Python equivalents of color-space conversions — the dossier's Python tab (lazy-loaded).
//
// Every snippet here was executed and compared against color-space's own output (node,
// float64) by scripts/verify-python.py: colour-science 0.4.7 and OpenCV 5.0.0
// (opencv-python-headless 5.0.0.93, numpy 2.4), 2026-10-02. Pass = max |difference| ≤ 1e-3
// of the channel's range (hues compared on the circle, skipped on grays) on 14 sRGB samples,
// 43 for OpenCV. The OpenCV routes also held over all 16,777,216 8-bit colors in the research
// sweep (lch-d65 and lchuv through their swept Lab/Luv; the polar step is plain numpy).
// Entries that differ by a named convention carry a one-line caveat; spaces colour-science
// 0.4.7 has no equivalent for are absent. Method: docs/formula-verification.md, "Python equivalents".
//
//   colour    rgb → space, one expression over PREAMBLE's rgb / lin / XYZ / D65 / D50
//             (absent for yuv: OpenCV has it, colour-science 0.4.7 does not)
//   inverse   space → sRGB 0–255, reading `v` (the space's values in color-space's conventions)
//   opencv    rgb → space over PREAMBLE_CV's float32 `f` (sRGB 0–1) and `lin` (linear sRGB)
//   scipy     the snippet also needs scipy (pip(e) adds it)

export const VERIFIED = 'colour-science 0.4.7 · OpenCV 5.0.0 · 2026-10-02'
export const pip = (e) => 'pip install colour-science numpy' + (e?.scipy ? ' scipy' : '')
export const PIP_CV = 'pip install opencv-python numpy'

// colour's 'sRGB' colourspace carries the rounded 4-decimal IEC matrix (~1e-4 off);
// decoding + 'ITU-R BT.709' derives the matrix from the primaries, as color-space does
export const PREAMBLE = `import numpy as np, colour
rgb = [200, 100, 50]  # sRGB 0–255
D65 = colour.CCS_ILLUMINANTS['CIE 1931 2 Degree Standard Observer']['D65']
D50 = colour.CCS_ILLUMINANTS['CIE 1931 2 Degree Standard Observer']['D50']
lin = colour.cctf_decoding(np.array(rgb) / 255, 'sRGB')  # linear sRGB
XYZ = colour.RGB_to_XYZ(lin, 'ITU-R BT.709')  # D65, Y 0–1`

// cv2 reads BGR, and cvtColor rejects float64; its Lab/Luv are D65 (= lab-d65, luv), and
// RGB2GRAY is BT.601 luma, not color-space's gray (luminance)
export const PREAMBLE_CV = `import numpy as np, cv2
img = cv2.imread('image.png')  # uint8, BGR order
f = (img[..., ::-1] / 255).astype(np.float32)  # RGB 0–1, float32
lin = np.where(f > 0.04045, ((f + 0.055) / 1.055) ** 2.4, f / 12.92).astype(np.float32)  # linear sRGB`

export default {
	"rgb": { colour: "np.array(rgb, dtype=float)" },
	"lrgb": { colour: "lin" },
	"scrgb": { colour: "lin" },
	"p3": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Display P3', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(v, 'Display P3', 'ITU-R BT.709', apply_cctf_decoding=True), 'sRGB')*255" },
	"p3-linear": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Display P3', chromatic_adaptation_transform='Bradford')" },
	"rec2020": { colour: "colour.models.oetf_BT2020(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'), is_12_bits_system=True)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.oetf_inverse_BT2020(v, is_12_bits_system=True), 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"rec2020-linear": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford')" },
	"rec2100-linear": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford')" },
	"rec709": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)" },
	"a98rgb": { colour: "colour.gamma_function(np.linalg.inv(colour.normalised_primary_matrix(colour.RGB_COLOURSPACES['Adobe RGB (1998)'].primaries, colour.RGB_COLOURSPACES['Adobe RGB (1998)'].whitepoint)) @ XYZ, 256/563, 'Mirror')", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.normalised_primary_matrix(colour.RGB_COLOURSPACES['Adobe RGB (1998)'].primaries, colour.RGB_COLOURSPACES['Adobe RGB (1998)'].whitepoint) @ colour.gamma_function(v, 563/256, 'Mirror'), 'ITU-R BT.709'), 'sRGB')*255" },
	"a98rgb-linear": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Adobe RGB (1998)', chromatic_adaptation_transform='Bradford')" },
	"prophoto": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ProPhoto RGB', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(v, 'ProPhoto RGB', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford', apply_cctf_decoding=True), 'sRGB')*255", inverseCaveat: "colour's ProPhoto RGB carries the rounded 4-decimal ISO 22028-2 matrix: up to 0.5 sRGB code value on near-zero channels." },
	"prophoto-linear": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ProPhoto RGB', chromatic_adaptation_transform='Bradford')" },
	"acescg": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ACEScg', chromatic_adaptation_transform='Bradford')", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(v, 'ACEScg', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"aces2065-1": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ACES2065-1', chromatic_adaptation_transform='Bradford')" },
	"acescc": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ACEScc', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)" },
	"acescct": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ACEScct', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_ACEScct(v), 'ACEScg', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"acesproxy": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ACESproxy', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)" },
	"dci-p3": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'DCI-P3', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)" },
	"smpte-c": { colour: "(lambda v: np.sign(v)*colour.models.oetf_BT709(np.abs(v)))(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'SMPTE C', chromatic_adaptation_transform='Bradford'))" },
	"smpte-240m": { colour: "(lambda v: np.sign(v)*colour.models.oetf_SMPTE240M(np.abs(v)))(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'SMPTE 240M', chromatic_adaptation_transform='Bradford'))" },
	"pal": { colour: "colour.gamma_function(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Pal/Secam', chromatic_adaptation_transform='Bradford'), 1/2.2, 'Mirror')" },
	"ntsc": { colour: "colour.gamma_function(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'NTSC (1953)', chromatic_adaptation_transform='Bradford'), 1/2.2, 'Mirror')" },
	"apple-rgb": { colour: "colour.gamma_function(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Apple RGB', chromatic_adaptation_transform='Bradford'), 1/1.8, 'Mirror')" },
	"cie-rgb": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'CIE RGB', chromatic_adaptation_transform='Bradford')" },
	"rimm": { colour: "colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'RIMM RGB', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True)" },
	"erimm": { colour: "colour.models.log_encoding_ERIMMRGB(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ProPhoto RGB', chromatic_adaptation_transform='Bradford'))" },
	"rec2100-pq": { colour: "colour.models.eotf_inverse_ST2084(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford')*203)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.eotf_ST2084(v)/203, 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"rec2100-hlg": { colour: "colour.models.oetf_BT2100_HLG(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford')*colour.models.oetf_inverse_BT2100_HLG(0.75))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.oetf_inverse_BT2100_HLG(v)/colour.models.oetf_inverse_BT2100_HLG(0.75), 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"slog3": { colour: "colour.models.log_encoding_SLog3(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'S-Gamut3', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_SLog3(v), 'S-Gamut3', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"sgamut3cine": { colour: "colour.models.log_encoding_SLog3(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'S-Gamut3.Cine', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_SLog3(v), 'S-Gamut3.Cine', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"slog2": { colour: "colour.models.log_encoding_SLog2(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'S-Gamut', chromatic_adaptation_transform='Bradford'))" },
	"slog": { colour: "colour.models.log_encoding_SLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'S-Gamut', chromatic_adaptation_transform='Bradford'))" },
	"logc3": { colour: "colour.models.log_encoding_ARRILogC3(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ARRI Wide Gamut 3', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_ARRILogC3(v), 'ARRI Wide Gamut 3', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"logc4": { colour: "colour.models.log_encoding_ARRILogC4(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ARRI Wide Gamut 4', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_ARRILogC4(v), 'ARRI Wide Gamut 4', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"vlog": { colour: "colour.models.log_encoding_VLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'V-Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_VLog(v), 'V-Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"log3g10": { colour: "colour.models.log_encoding_Log3G10(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'REDWideGamutRGB', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_Log3G10(v), 'REDWideGamutRGB', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"log3g12": { colour: "colour.models.log_encoding_Log3G12(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'REDWideGamutRGB', chromatic_adaptation_transform='Bradford'))" },
	"redlog": { colour: "colour.models.log_encoding_REDLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'REDcolor', chromatic_adaptation_transform='Bradford'))" },
	"redlogfilm": { colour: "colour.models.log_encoding_REDLogFilm(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'REDcolor', chromatic_adaptation_transform='Bradford'))" },
	"clog": { colour: "colour.models.log_encoding_CanonLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Cinema Gamut', chromatic_adaptation_transform='Bradford'))" },
	"clog2": { colour: "colour.models.log_encoding_CanonLog2(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Cinema Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_CanonLog2(v), 'Cinema Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"clog3": { colour: "colour.models.log_encoding_CanonLog3(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Cinema Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_CanonLog3(v), 'Cinema Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"bmdfilm": { colour: "colour.models.oetf_BlackmagicFilmGeneration5(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Blackmagic Wide Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.oetf_inverse_BlackmagicFilmGeneration5(v), 'Blackmagic Wide Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"davinci": { colour: "colour.models.oetf_DaVinciIntermediate(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'DaVinci Wide Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.oetf_inverse_DaVinciIntermediate(v), 'DaVinci Wide Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"dlog": { colour: "colour.models.log_encoding_DJIDLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'DJI D-Gamut', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_DJIDLog(v), 'DJI D-Gamut', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"tlog": { colour: "colour.models.log_encoding_FilmLightTLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'FilmLight E-Gamut', chromatic_adaptation_transform='Bradford'))" },
	"protune": { colour: "colour.models.log_encoding_Protune(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Protune Native', chromatic_adaptation_transform='Bradford'))" },
	"flog": { colour: "colour.models.log_encoding_FLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))" },
	"flog2": { colour: "colour.models.log_encoding_FLog2(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_FLog2(v), 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"nlog": { colour: "colour.models.log_encoding_NLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_NLog(v), 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"applelog": { colour: "colour.models.log_encoding_AppleLogProfile(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.models.log_decoding_AppleLogProfile(v), 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"llog": { colour: "colour.models.log_encoding_LLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))" },
	"milog": { colour: "colour.models.log_encoding_MiLog(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'))" },
	"cineon": { colour: "colour.models.log_encoding_Cineon(lin)" },
	"panalog": { colour: "colour.models.log_encoding_Panalog(lin)" },
	"viperlog": { colour: "np.maximum(colour.models.log_encoding_ViperLog(lin), 0)" },
	"filmicpro": { colour: "np.maximum(colour.models.log_encoding_FilmicPro6(lin), 0)" },
	"xyz": { colour: "XYZ*100", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(np.array(v)/100, 'ITU-R BT.709'), 'sRGB')*255", opencv: "cv2.cvtColor(lin, cv2.COLOR_RGB2XYZ) * 100" },
	"xyz-d50": { colour: "colour.RGB_to_XYZ(lin, 'ITU-R BT.709', illuminant=D50, chromatic_adaptation_transform='Bradford')*100" },
	"xyz-abs-d65": { colour: "XYZ*203" },
	"xyy": { colour: "colour.XYZ_to_xyY(XYZ)*[1, 1, 100]" },
	"gray": { colour: "XYZ[1:2]", opencv: "cv2.cvtColor(lin, cv2.COLOR_RGB2XYZ)[..., 1]" },
	"ucs": { colour: "colour.XYZ_to_UCS(XYZ)*100" },
	"uvw": { colour: "colour.XYZ_to_UVW(XYZ*100, illuminant=D65)" },
	"uv": { colour: "np.append(colour.XYZ_to_CIE1976UCS(XYZ)[:2], XYZ[1]*100)" },
	"lab": { colour: "colour.XYZ_to_Lab(colour.RGB_to_XYZ(lin, 'ITU-R BT.709', illuminant=D50, chromatic_adaptation_transform='Bradford'), illuminant=D50)", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Lab_to_XYZ(v, D50), 'ITU-R BT.709', illuminant=D50, chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"lab-d65": { colour: "colour.XYZ_to_Lab(XYZ, illuminant=D65)", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Lab_to_XYZ(v, D65), 'ITU-R BT.709'), 'sRGB')*255", opencv: "cv2.cvtColor(lin, cv2.COLOR_LRGB2Lab)" },
	"lchab": { colour: "colour.Lab_to_LCHab(colour.XYZ_to_Lab(colour.RGB_to_XYZ(lin, 'ITU-R BT.709', illuminant=D50, chromatic_adaptation_transform='Bradford'), illuminant=D50))", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Lab_to_XYZ(colour.LCHab_to_Lab(v), D50), 'ITU-R BT.709', illuminant=D50, chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"lch-d65": { colour: "colour.Lab_to_LCHab(colour.XYZ_to_Lab(XYZ, illuminant=D65))", opencv: "(lambda o: np.stack([o[..., 0], np.hypot(o[..., 1], o[..., 2]), np.degrees(np.arctan2(o[..., 2], o[..., 1])) % 360], -1))(cv2.cvtColor(lin, cv2.COLOR_LRGB2Lab))" },
	"luv": { colour: "colour.XYZ_to_Luv(XYZ, illuminant=D65)", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Luv_to_XYZ(v, D65), 'ITU-R BT.709'), 'sRGB')*255", opencv: "cv2.cvtColor(f, cv2.COLOR_RGB2Luv)" },
	"lchuv": { colour: "colour.Luv_to_LCHuv(colour.XYZ_to_Luv(XYZ, illuminant=D65))", opencv: "(lambda o: np.stack([o[..., 0], np.hypot(o[..., 1], o[..., 2]), np.degrees(np.arctan2(o[..., 2], o[..., 1])) % 360], -1))(cv2.cvtColor(lin, cv2.COLOR_LRGB2Luv))" },
	"labh": { colour: "colour.XYZ_to_Hunter_Lab(XYZ*100, XYZ_n=[95.047, 100, 108.883], K_ab=[175, 70])" },
	"lms": { colour: "colour.adaptation.CAT_CAT02 @ (XYZ*100)" },
	"dcdm": { colour: "colour.models.eotf_inverse_DCDM(XYZ*48)" },
	"oklab": { colour: "colour.XYZ_to_Oklab(XYZ)", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Oklab_to_XYZ(v), 'ITU-R BT.709'), 'sRGB')*255", inverseCaveat: "colour's Oklab starts from Ottosson's original XYZ→LMS matrix, whose white is not exactly neutral: up to ~1 sRGB code value on near-zero channels." },
	"oklch": { colour: "colour.Oklab_to_Oklch(colour.XYZ_to_Oklab(XYZ))", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Oklab_to_XYZ(colour.Oklch_to_Oklab(v)), 'ITU-R BT.709'), 'sRGB')*255", inverseCaveat: "colour's Oklab starts from Ottosson's original XYZ→LMS matrix, whose white is not exactly neutral: up to ~1 sRGB code value on near-zero channels." },
	"jzazbz": { colour: "colour.XYZ_to_Jzazbz(XYZ*203)", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.Jzazbz_to_XYZ(v)/203, 'ITU-R BT.709'), 'sRGB')*255" },
	"jzczhz": { colour: "colour.models.Jzazbz_to_JzCHab(colour.XYZ_to_Jzazbz(XYZ*203))" },
	"izazbz": { colour: "colour.models.XYZ_to_Izazbz(XYZ*203)" },
	"ictcp": { colour: "colour.RGB_to_ICtCp(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford')*203)", inverse: "colour.cctf_encoding(colour.RGB_to_RGB(colour.ICtCp_to_RGB(v)/203, 'ITU-R BT.2020', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford'), 'sRGB')*255" },
	"icacb": { colour: "colour.XYZ_to_ICaCb(XYZ*203)" },
	"ipt": { colour: "colour.XYZ_to_IPT(XYZ)" },
	"hdr-ipt": { colour: "colour.XYZ_to_hdr_IPT(XYZ)" },
	"hdr-cie-lab": { colour: "colour.XYZ_to_hdr_CIELab(XYZ, illuminant=D65)" },
	"igpgtg": { colour: "colour.XYZ_to_IgPgTg(XYZ)" },
	"yrg": { colour: "colour.XYZ_to_Yrg(XYZ)" },
	"prolab": { colour: "colour.XYZ_to_ProLab(XYZ, illuminant=D65)" },
	"sucs": { colour: "colour.XYZ_to_sUCS(XYZ)" },
	"osaucs": { colour: "colour.XYZ_to_OSA_UCS(XYZ*100)" },
	"din99o-lab": { colour: "colour.XYZ_to_DIN99(XYZ, illuminant=D65, method='DIN99b')" },
	"din99o-lch": { colour: "colour.Lab_to_LCHab(colour.XYZ_to_DIN99(XYZ, illuminant=D65, method='DIN99b'))" },
	"din99d": { colour: "(lambda M: colour.Lab_to_DIN99(colour.XYZ_to_Lab(M @ XYZ, colour.XYZ_to_xy(M @ colour.xy_to_XYZ(D65))), method='DIN99d'))(np.array([[1.12, 0, -0.12], [0, 1, 0], [0, 0, 1]]))" },
	"cam16": { colour: "(lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CAM16(XYZ*100, XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average']))", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.CAM16_to_XYZ(colour.CAM_Specification_CAM16(J=v[0], M=v[1], h=v[2]), XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average'])/100, 'ITU-R BT.709'), 'sRGB')*255" },
	"cam16-ucs": { colour: "colour.JMh_CAM16_to_CAM16UCS((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CAM16(XYZ*100, XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average'])))", inverse: "colour.cctf_encoding(colour.XYZ_to_RGB(colour.CAM16_to_XYZ((lambda j: colour.CAM_Specification_CAM16(J=j[0], M=j[1], h=j[2]))(colour.CAM16UCS_to_JMh_CAM16(v)), XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average'])/100, 'ITU-R BT.709'), 'sRGB')*255" },
	"cam16-lcd": { colour: "colour.JMh_CAM16_to_CAM16LCD((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CAM16(XYZ*100, XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average'])))" },
	"cam16-scd": { colour: "colour.JMh_CAM16_to_CAM16SCD((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CAM16(XYZ*100, XYZ_w=[95.047, 100, 108.883], L_A=64/np.pi*0.2, Y_b=20, surround=colour.VIEWING_CONDITIONS_CAM16['Average'])))" },
	"ciecam02": { colour: "(lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CIECAM02(XYZ*100, XYZ_w=[95.05, 100, 108.88], L_A=318.31, Y_b=20, surround=colour.VIEWING_CONDITIONS_CIECAM02['Average']))" },
	"cam02-ucs": { colour: "colour.JMh_CIECAM02_to_CAM02UCS((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CIECAM02(XYZ*100, XYZ_w=[95.05, 100, 108.88], L_A=318.31, Y_b=20, surround=colour.VIEWING_CONDITIONS_CIECAM02['Average'])))" },
	"cam02-lcd": { colour: "colour.JMh_CIECAM02_to_CAM02LCD((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CIECAM02(XYZ*100, XYZ_w=[95.05, 100, 108.88], L_A=318.31, Y_b=20, surround=colour.VIEWING_CONDITIONS_CIECAM02['Average'])))" },
	"cam02-scd": { colour: "colour.JMh_CIECAM02_to_CAM02SCD((lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_CIECAM02(XYZ*100, XYZ_w=[95.05, 100, 108.88], L_A=318.31, Y_b=20, surround=colour.VIEWING_CONDITIONS_CIECAM02['Average'])))" },
	"hct": { colour: "(lambda c: np.array([c.h, c.C, colour.XYZ_to_Lab(XYZ)[0]]))(colour.XYZ_to_CAM16(XYZ*100, XYZ_w=colour.xy_to_XYZ(D65)*100, L_A=200/np.pi*colour.luminance(50)/100, Y_b=colour.luminance(50), surround=colour.VIEWING_CONDITIONS_CAM16['Average']))" },
	"hellwig2022": { colour: "(lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_Hellwig2022(XYZ*100, XYZ_w=[95.05, 100, 108.88], L_A=318.31, Y_b=20, surround=colour.VIEWING_CONDITIONS_HELLWIG2022['Average']))" },
	"zcam": { colour: "(lambda c: np.array([c.J, c.M, c.h]))(colour.XYZ_to_ZCAM(XYZ*100, XYZ_w=[256, 264, 202], L_A=264, Y_b=100, surround=colour.VIEWING_CONDITIONS_ZCAM['Average']))" },
	"llab": { colour: "(lambda c: np.array([c.J, c.a, c.b]))(colour.XYZ_to_LLAB(XYZ*100, XYZ_0=[95.05, 100, 108.88], Y_b=20, L=318.31, surround=colour.VIEWING_CONDITIONS_LLAB['Reference Samples & Images, Average Surround, Subtending < 4']))" },
	"rlab": { colour: "(lambda c: np.array([c.J, c.a, c.b]))(colour.XYZ_to_RLAB(XYZ*100, XYZ_n=[109.85, 100, 35.58], Y_n=31.83, sigma=colour.VIEWING_CONDITIONS_RLAB['Average'], D=colour.appearance.D_FACTOR_RLAB['Hard Copy Images']))" },
	"hunt": { colour: "(lambda c: np.array([c.J, c.C, c.h]))(colour.XYZ_to_Hunt(XYZ*100, XYZ_w=[95.05, 100, 108.88], XYZ_b=[95.05, 100, 108.88], L_A=318.31, surround=colour.VIEWING_CONDITIONS_HUNT['Normal Scenes'], CCT_w=6504))" },
	"nayatani95": { colour: "(lambda c: np.array([c.L_star_N, max(c.C, 0), c.h]))(colour.XYZ_to_Nayatani95(XYZ*100, XYZ_n=[95.05, 100, 108.88], Y_o=20, E_o=5000, E_or=1000))" },
	"atd95": { colour: "(lambda c: np.array([c.A_2, c.T_2, c.D_2]))(colour.XYZ_to_ATD95(XYZ*100, XYZ_0=[95.05, 100, 108.88], Y_0=318.31, k_1=0, k_2=50))" },
	"hsv": { colour: "colour.RGB_to_HSV(np.array(rgb)/255)*[360, 100, 100]", inverse: "colour.HSV_to_RGB(np.array(v)/[360, 100, 100])*255", opencv: "cv2.cvtColor(f, cv2.COLOR_RGB2HSV) * [1, 100, 100]" },
	"hsl": { colour: "colour.RGB_to_HSL(np.array(rgb)/255)*[360, 100, 100]", inverse: "colour.HSL_to_RGB(np.array(v)/[360, 100, 100])*255", opencv: "cv2.cvtColor(f, cv2.COLOR_RGB2HLS)[..., [0, 2, 1]] * [1, 100, 100]" },
	"hwb": { colour: "(lambda h: np.array([h[0]*360, (1-h[1])*h[2]*100, (1-h[2])*100]))(colour.RGB_to_HSV(np.array(rgb)/255))" },
	"hcl": { colour: "colour.RGB_to_HCL(np.array(rgb)/255)*[180/np.pi, 150, 100/colour.RGB_to_HCL(np.ones(3))[2]]" },
	"cmy": { colour: "colour.RGB_to_CMY(np.array(rgb)/255)*100" },
	"cmyk": { colour: "colour.CMY_to_CMYK(colour.RGB_to_CMY(np.array(rgb)/255))*100" },
	"ycbcr": { colour: "colour.RGB_to_YCbCr(np.array(rgb)/255, K=colour.WEIGHTS_YCBCR['ITU-R BT.709'])*255" },
	"xvycc": { colour: "colour.RGB_to_YCbCr(np.array(rgb)/255, K=colour.WEIGHTS_YCBCR['ITU-R BT.709'])*255" },
	"ycbcr-bt709": { colour: "colour.RGB_to_YCbCr(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.709', chromatic_adaptation_transform='Bradford', apply_cctf_encoding=True), K=colour.WEIGHTS_YCBCR['ITU-R BT.709'])*255" },
	"ycbcr-bt2020": { colour: "colour.RGB_to_YCbCr(colour.models.oetf_BT2020(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'), is_12_bits_system=True), K=colour.WEIGHTS_YCBCR['ITU-R BT.2020'])*255" },
	"ycbcr-bt601-525": { colour: "colour.RGB_to_YCbCr((lambda v: np.sign(v)*colour.models.oetf_BT709(np.abs(v)))(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'SMPTE C', chromatic_adaptation_transform='Bradford')), K=colour.WEIGHTS_YCBCR['ITU-R BT.601'])*255" },
	"ycbcr-bt601-625": { colour: "colour.RGB_to_YCbCr(colour.gamma_function(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'Pal/Secam', chromatic_adaptation_transform='Bradford'), 1/2.2, 'Mirror'), K=colour.WEIGHTS_YCBCR['ITU-R BT.601'])*255" },
	"jpeg": { colour: "colour.RGB_to_YCbCr(np.array(rgb)/255, K=colour.WEIGHTS_YCBCR['ITU-R BT.601'], out_legal=False)*255 + [0, 128, 128]", opencv: "cv2.cvtColor(f, cv2.COLOR_RGB2YCrCb)[..., [0, 2, 1]] * 255 + [0, 0.5, 0.5]" },
	"ypbpr": { colour: "colour.RGB_to_YCbCr(np.array(rgb)/255, K=colour.WEIGHTS_YCBCR['ITU-R BT.709'], out_legal=False)" },
	"ycgco": { colour: "colour.RGB_to_YCoCg(np.array(rgb)/255)[[0, 2, 1]]" },
	"yccbccrc": { colour: "colour.RGB_to_YcCbcCrc(colour.RGB_to_RGB(lin, 'ITU-R BT.709', 'ITU-R BT.2020', chromatic_adaptation_transform='Bradford'), out_legal=False, is_12_bits_system=True)" },
	"kelvin": { colour: "np.clip(np.atleast_1d(colour.uv_to_CCT(colour.xy_to_UCS_uv(colour.XYZ_to_xy(XYZ)), method='Krystek 1985')), 1000, 25000)", scipy: true },
	"cct-duv": { colour: "(lambda uv: (lambda T: np.array([T, np.sign(uv[1] - colour.CCT_to_uv(T, method='Krystek 1985')[1]) * np.linalg.norm(uv - colour.CCT_to_uv(T, method='Krystek 1985'))]))(colour.uv_to_CCT(uv, method='Krystek 1985')))(colour.xy_to_UCS_uv(colour.XYZ_to_xy(XYZ)))", caveat: "Matches inside the defined CCT domain (1000–25000 K, |Duv| ≤ 0.05) only — outside it color-space clamps T and colour's Krystek solver diverges.", scipy: true },
	"wavelength": { colour: "colour.dominant_wavelength(colour.XYZ_to_xy(XYZ), D65, colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer'].copy().align(colour.SpectralShape(360, 780, 0.1)))[0:1]", caveat: "Matches except for purples: colour returns −(complementary wavelength), color-space snaps to the nearer end of the purple line (380/700 nm).", scipy: true },
	"dsh": { colour: "(lambda xy: np.array([colour.dominant_wavelength(xy, D65, colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer'].copy().align(colour.SpectralShape(360, 780, 0.1)))[0], colour.excitation_purity(xy, D65, colour.MSDS_CMFS['CIE 1931 2 Degree Standard Observer'].copy().align(colour.SpectralShape(360, 780, 0.1))), XYZ[1]*100]))(colour.XYZ_to_xy(XYZ))", scipy: true },
	"munsell": { colour: "(lambda m: np.array([((7 - m[3]) % 10) * 10 + m[0], m[1], m[2]]))(colour.notation.munsell.xyY_to_munsell_specification(colour.XYZ_to_xyY(XYZ)*[1, 1, 0.975]))", caveat: "Approximate: Munsell value matches, but hue and chroma interpolate the renotation data differently (up to ~0.9 hue step, ~2.2 chroma), and colour raises outside that data (e.g. value < 1).", scipy: true },
	"yuv": { opencv: "cv2.cvtColor(f, cv2.COLOR_RGB2YUV) - [0, 0.5, 0.5]" },
}

# Camera-Log Verification Against Official ACES Transforms

Seven camera-log conversions are differential-tested against the Academy's official
vendor transforms — the CTL files camera makers supplied to or the Academy published in
[ampas/aces-dev v1.3](https://github.com/ampas/aces-dev/tree/v1.3/transforms/ctl/csc).
The decode curves and matrix recipes are transcribed verbatim from the CTLs; each pair
is sampled on a 5³ grid of encoded triplets and compared as `log → aces2065-1` through
color-space's hub. The suite runs on every `npm test` ([test/aces-vendor.js](../test/aces-vendor.js)).

## Measured agreement

Deviation is the max channel error relative to the point's dominant official component
(floored at 0.18 mid grey), over the full grid:

| color-space | Official transform (ampas/aces-dev v1.3) | CAT in CTL | Max deviation |
|---|---|---|---:|
| `slog3` | [ACEScsc.Academy.SLog3_SGamut3_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/sony/ACEScsc.Academy.SLog3_SGamut3_to_ACES.ctl) | CAT02 | 4.1e-3 |
| `sgamut3cine` | [ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/sony/ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES.ctl) | CAT02 | 4.2e-3 |
| `logc3` | [ACEScsc.Academy.LogC_EI800_AWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/arri/ACEScsc.Academy.LogC_EI800_AWG_to_ACES.ctl) | CAT02 | 4.3e-3 |
| `clog2` | [ACEScsc.Academy.CLog2_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog2_CGamut_to_ACES.ctl) | CAT02 | 4.9e-3 |
| `clog3` | [ACEScsc.Academy.CLog3_CGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/canon/ACEScsc.Academy.CLog3_CGamut_to_ACES.ctl) | CAT02 | 4.9e-3 |
| `vlog` | [ACEScsc.Academy.VLog_VGamut_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/panasonic/ACEScsc.Academy.VLog_VGamut_to_ACES.ctl) | Bradford | 3.0e-4 |
| `log3g10` | [ACEScsc.Academy.Log3G10_RWG_to_ACES](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/red/ACEScsc.Academy.Log3G10_RWG_to_ACES.ctl) | Bradford | 3.0e-4 |

The two Sony matrices are additionally pinned to the digits Sony itself typed into
[IDT.Sony.SLog3_SGamut3.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3.ctl) /
[IDT.Sony.SLog3_SGamut3Cine.ctl](https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3Cine.ctl):
the Academy's matrix recipe (primaries + CAT02) reproduces Sony's published matrices to
**5e-11**, and color-space's own matrices are derived from the same vendor primaries.

## Why not zero

The residuals are two documented conventions, not formula error:

- **Chromatic adaptation transform.** The Sony/ARRI/Canon CTLs adapt the camera's D65
  white to the ACES white with **CAT02**; color-space routes through its XYZ D65 hub and
  adapts with **Bradford**, matching colorjs.io and the CSS Color 4 convention (the
  Panasonic and RED CTLs also default to Bradford — and agree to 3e-4). Swapping
  Bradford into a CAT02 recipe collapses its residual to the same 3e-4. The remaining
  difference peaks at ~0.5% of a point's dominant component at gamut extremes.
- **D65 white digits.** The ~3e-4 floor is the CSS-convention D65 white point versus the
  CTL library's chromaticity-derived white — a digit convention, sub-perceptual.
- **Canon reflection factor.** Canon's Log v1.2 paper, Canon's vendor IDTs, and
  colour-science define scene reflectance as IRE-linear × 0.9; the Academy *container*
  CSC omits that factor. color-space follows Canon's reflectance convention; the test
  bridges with the documented 0.9 so curve + matrix + adaptation are what's compared.

## Conversion, not look

Everything here — and every `.cube` exported by [`color-space/lut`](../lut.js) — is a
**colorimetric conversion**: pure math from one encoding to another, no tone mapping,
no highlight rolloff, no look. Vendor "to Rec.709" LUTs (ARRI LogC2Video, Sony s709,
Panasonic V-709) are **display renders** that include tone mapping and creative
decisions; a colorimetric conversion will not and should not match them. Use these
LUTs to move between encodings — normalization, monitoring, pipeline QC, batch
`ffmpeg` work — and grade the look on top.

Each generated `.cube` also states its own accuracy: the header carries the measured
deviation of the interpolated lattice against the direct conversion at random
off-lattice points ([details](../lut.js)).

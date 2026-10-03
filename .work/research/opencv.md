# opencv

## summary
I checked OpenCV's cvtColor against color-space@3.1.0 in three ways: the OpenCV docs (4.x, 5.x and the 5.0.0 tag), the 5.0.0 C++ source, and actual runs of cv2 5.0.0 (opencv-python-headless 5.0.0.93, numpy 2.4.6). The numbers were checked twice:
1. 43 sample colors compared directly against node `space.rgb[id]`: primaries, secondaries, grays, near-blacks and 24 seeded random colors.
2. All 16,777,216 8-bit sRGB colors, compared against a numpy copy of the library's formulas. That copy matches node to ≤3.3e-13 for every space except `lab`, where it is off by 9.2e-5.

The following are verified equivalent:
- **HSV:** `COLOR_RGB2HSV`, float and uint8. `HSV_FULL` uint8 also matches.
- **HSL:** `COLOR_RGB2HLS`, float and uint8. OpenCV's channel order is H, L, S.
- **lab-d65:** only via `COLOR_LRGB2Lab` on numpy-linearized float32. The direct float `RGB2Lab` path is off by up to 0.0019 of the channel span because of a lookup-table interpolation.
- **luv:** float, both the direct and the linear-input path.
- **xyz:** only `COLOR_RGB2XYZ` applied to linear RGB, times 100.
- **yuv:** float, after subtracting OpenCV's 0.5 offset from U and V.
- **jpeg:** `COLOR_RGB2YCrCb`, uint8 and float. OpenCV's order is Y, Cr, Cb.
- **Limited-range BT.601:** `COLOR_RGB2YUV_I420` matches `space.rgb.ycbcr(r,g,b,0.114,0.299)`.
- **gray:** only via the Y channel of XYZ on linear RGB.

The following are not equivalent:
- **cv2 Lab vs `lab`:** cv2 Lab is D65 and color-space `lab` is D50. Max error is 11.9 units on a*. Adding a numpy Bradford adaptation step makes it match.
- **`COLOR_RGB2GRAY` vs `gray`:** cv2 computes luma, color-space computes luminance. Max error is 0.306, and 99.6% of colors are off by more than 1 step. `RGB2GRAY` does equal the yuv Y channel within 0.503 of a step.
- **`yuv` in uint8:** V gets clipped. It needs a range of −28.8 to 284.8 to fit, so 1.52% of colors are wrong, by up to 29.8 steps.
- **I420 vs `ycbcr-bt601-625` and `ycbcr-bt601-525`:** off by up to 30 code values. Those two spaces convert to PAL or SMPTE-C primaries first; cv2 does not.

Partial matches:
- **uint8 Lab:** 0.379% of colors exceed 1 step, by up to 2.67. All of them have L* below 46.
- **uint8 Luv:** 0.067% of colors exceed 1 step, by up to 1.13.

Other findings:
- **HLS_FULL depends on the build.** On x86 wheels it goes through Intel IPP, which truncates (pure red gives L=127, S=254). Calling `cv2.ipp.setUseIPP(False)` fixes it.
- **The `_FULL` hue is not symmetric.** The forward conversion packs hue as H·256/360, but the inverse decodes with 255, so pure blue comes back as (6,0,255).
- **float64 input is rejected:** cv2 raises an error on `'depth' is 6 (CV_64F)`.
- **0–255 floats into Lab clip silently:** orange (255,128,0) comes out as yellow, (97.14, −21.55, 94.47).
- **Oklab is not released:** it exists only on the unreleased 5.x branch (codes 155–158). It is not in 5.0.0, 4.14.0, 4.13.0 or 4.x HEAD.

## recommendation
For the Python tab, only show cv2 snippets for the routes the full-cube check verified. Every snippet should start with `rgb = img[..., ::-1]` when the image comes from `cv2.imread`, because imread returns BGR. Inputs should be `(rgb/255).astype(np.float32)`, since float64 is rejected.

Snippets to show, with their mapping to color-space ranges:
- **hsv:** `COLOR_RGB2HSV` on float32 gives values in range: H stays as-is, S and V are multiplied by 100. On uint8: H×2, S and V ×100/255.
- **hsl:** `COLOR_RGB2HLS`, then reorder to `[o0, o2·100, o1·100]`.
- **lab-d65:** linearize sRGB in numpy, then use `COLOR_LRGB2Lab` on float32.
- **lch-d65 / lchuv:** take the same Lab or Luv result and convert with `hypot` and `atan2`.
- **luv:** `COLOR_RGB2Luv` on float32.
- **xyz:** linearize, then `COLOR_RGB2XYZ`, then ×100.
- **yuv:** `COLOR_RGB2YUV` on float32, then subtract 0.5 from U and V.
- **jpeg:** `COLOR_RGB2YCrCb` on uint8, then reorder with `o[..., [0, 2, 1]]`.
- **gray:** linearize, `COLOR_RGB2XYZ`, then take `[..., 1]`.

Snippets to leave out:
- **lab:** don't map `COLOR_RGB2Lab` to `lab` without saying it is D65. Either show the numpy Bradford step or link to lab-d65 instead.
- **gray:** don't map `COLOR_RGB2GRAY` to `gray`. Label it as luma and point to yuv Y.
- **yuv in uint8:** don't offer it; V clips.
- **ycbcr-bt601-625 / ycbcr-bt601-525:** don't claim cv2 equivalents.
- **Oklab:** no cv2 snippet until a tagged OpenCV release includes `COLOR_RGB2Oklab`.

If the tab shows uint8 Lab or Luv, add a footnote that dark colors (L* below about 46) can be off by up to 2.67 steps. Avoid `_FULL` codes, or warn that their round trip doesn't come back exact and that HLS_FULL output changes with the IPP build.

To recheck after a cv2 upgrade, rerun `opencv_verify.py` (after `opencv_sweep.py`).

## files
['<session-scratch>/research/opencv_verify.py', '<session-scratch>/research/opencv.json', '<session-scratch>/research/opencv_sweep.py', '<session-scratch>/research/opencv_sweep.json', '<session-scratch>/research/opencv_pitfalls.json', '<session-scratch>/research/opencv_ipp_check.json', '<session-scratch>/research/opencv_src/opencv_colors_4x.markdown', '<session-scratch>/research/opencv_src/opencv_colors_5.0.0.markdown', '<session-scratch>/research/opencv_src/opencv_colors_5x.markdown', '<session-scratch>/research/opencv_src/color_lab.cpp', '<session-scratch>/research/opencv_src/color_yuv.simd.hpp', '<session-scratch>/research/opencv_src/color_hsv.simd.hpp', '<session-scratch>/research/opencv_src/color_hsv.dispatch.cpp', '<session-scratch>/research/opencv_src/color.hpp', '<session-scratch>/research/opencv_src/color.cpp', '<session-scratch>/research/opencv_src/color.simd_helpers.hpp', '<session-scratch>/research/opencv_src/core_private.hpp', '<session-scratch>/research/opencv_src/imgproc_5x_head.hpp', '<session-scratch>/research/opencv_src/imgproc_4x_head.hpp', '<session-scratch>/research/opencv_src/colors_4.14.0.md', '<session-scratch>/research/opencv_src/colors_4.13.0.md']

## facts
- [fetched-primary] OpenCV doc (4.x, identical to the 5.0.0 tag) defines RGB2GRAY as Y = 0.299R + 0.587G + 0.114B: 0.299, 0.587, 0.114 (BT.601 luma) (raw.githubusercontent.com/opencv/opencv/5.0.0/modules/imgproc/doc/colors.markdown)
- [fetched-primary] The 5.0.0 tag colors.markdown is byte-identical to the 4.x HEAD doc; only the 5.x branch HEAD adds an Oklab section: diff empty (5.0.0 vs 4.x); 5.x HEAD adds the 'RGB <-> Oklab' section (colors.markdown at refs 4.x, 5.0.0, 5.x, 4.13.0, 4.14.0)
- [fetched-primary] The COLOR_RGB2Oklab constant exists only on the 5.x branch HEAD header and is missing from the cv2 5.0.0 wheel: imgproc.hpp 5.x HEAD: COLOR_BGR2Oklab=155, RGB2Oklab=156, Oklab2BGR=157, Oklab2RGB=158; hasattr(cv2,'COLOR_RGB2Oklab') == False in 5.0.0; 0 Oklab mentions in 4.13.0/4.14.0 docs (raw.githubusercontent.com/opencv/opencv/5.x/modules/imgproc/include/opencv2/imgproc.hpp + cv2 5.0.0 run)
- [fetched-primary] cv2 RGB2XYZ uses a bare Rec.709/D65 matrix with no transfer function: [[0.412453,0.357580,0.180423],[0.212671,0.715160,0.072169],[0.019334,0.119193,0.950227]] (colors.markdown + color_lab.cpp sRGB2XYZ_D65 (5.0.0))
- [fetched-primary] cv2 Lab/Luv white point is D65: Xn=0.950456, Zn=1.088754 (color-space lab-d65 uses Z=1.0890577507598784) (color_lab.cpp D65[] (5.0.0))
- [fetched-primary] COLOR_RGB2Lab and COLOR_RGB2Luv remove the sRGB gamma (threshold 0.04045, power 2.4); COLOR_LRGB2Lab and COLOR_LRGB2Luv do not. The doc formulas leave this step out: is_sRGB() is true for RGB2Lab/RGB2Luv/Lab2RGB/Luv2RGB only (color.hpp is_sRGB + color_lab.cpp applyGamma (5.0.0))
- [fetched-primary] The source uses the exact CIE constants for Lab, not the doc's rounded 0.008856 / 903.3: lthresh=216/24389, f9033=29^3/27, lscale=841/108 (color_lab.cpp (5.0.0))
- [fetched-primary] The float32 sRGB RGB2Lab path uses a 33^3 trilinear LUT and clips input to 0..1: useInterpolation = !coeffs && !whitept && srgb; LAB_LUT_DIM=(1<<5)+1 (color_lab.cpp RGB2Lab_f (5.0.0))
- [computed] Over the full cube, cv2 float32 COLOR_RGB2Lab vs color-space lab-d65 does not meet the 1e-3 threshold: max abs err L 0.189, a 0.466, b 0.332 (max 0.00189 of span) (opencv_sweep.py on all 16,777,216 colors)
- [computed] Over the full cube, cv2 float32 COLOR_LRGB2Lab on numpy-linearized RGB matches lab-d65: max abs err L 0.00665, a 0.0345, b 0.0130 (max 1.38e-4 of span) (opencv_sweep.py)
- [computed] Over the full cube, uint8 COLOR_RGB2Lab (L*100/255, a-128, b-128) matches lab-d65 within 1 step except for some dark colors: 63,515 colors (0.379%) exceed 1 step; max 2.67 steps on a*; all exceedances at L* < 46.1 (opencv_sweep.py + bucket analysis)
- [computed] cv2 Lab compared against color-space 'lab' (D50) is not equivalent: full-cube max err L 2.73, a 11.89, b 4.30 (opencv_sweep.py)
- [computed] lab (D50) computed via cv2 RGB2XYZ on linear RGB + Bradford D65->D50 (CSS matrix) + numpy Lab is equivalent: max err 0.0049 / 0.0114 / 0.0221 (8.8e-5 of span); numpy port differs from node lab by 9.2e-5 (opencv_verify.py (vs node) + opencv_sweep.py)
- [computed] Over the full cube, cv2 float32 RGB2Luv matches color-space luv: max err L 0.00665, u 0.0198, v 0.0285 (6.65e-5 of span) (opencv_sweep.py)
- [computed] Over the full cube, uint8 Luv unpacked as L*100/255, u*354/255-134, v*262/255-140 is mostly within 1 step: 11,241 colors (0.067%) exceed 1 step; max 1.13 steps; all exceedances at L* < 43.6 (opencv_sweep.py; packing from colors.markdown)
- [computed] cv2 RGB2XYZ ×100 on linear RGB equals color-space xyz; on gamma-encoded sRGB it does not: linear: max err X 0.0062, Y 0.0032, Z 0.0307; gamma-encoded: max err 31.25 (opencv_sweep.py)
- [computed] COLOR_RGB2GRAY is luma, not color-space gray (relative luminance): vs gray: max err 0.306 (78 steps), 99.6% of colors over 1 step; vs yuv Y: max 0.503 step (opencv_sweep.py)
- [computed] color-space gray equals cv2 RGB2XYZ(linear)[...,1]: max err 3.2e-5 (opencv_sweep.py)
- [fetched-primary] cv2 COLOR_RGB2YUV uses U=0.492(B-Y), V=0.877(R-Y) plus delta, output order Y,U,V; delta = 0.5 for float, 128 for uint8: B2UF=0.492, R2VF=0.877, ColorChannel<float>::half()=0.5 (color_yuv.simd.hpp + color.simd_helpers.hpp (5.0.0))
- [computed] float32 YUV mapped as [Y, U-0.5, V-0.5] matches color-space yuv: max err U 8.8e-5, V 2.23e-4 (opencv_sweep.py)
- [computed] uint8 COLOR_RGB2YUV clips V for saturated colors: V needs uint8 range -28.82..284.82; 1.52% of the cube exceeds 1 step; max 29.8 steps at pure red (opencv_sweep.py)
- [fetched-primary] COLOR_RGB2YCrCb outputs Y, Cr, Cb (in that order) with coefficients 0.713 and 0.564: YCRF=0.713, YCBF=0.564; dst order Y, Cr, Cb (color_yuv.simd.hpp (5.0.0) + colors.markdown)
- [computed] uint8 RGB2YCrCb with channels reordered [0,2,1] equals color-space jpeg: full-cube max 0.898 step, 0 colors over 1 step (opencv_sweep.py)
- [computed] float32 YCrCb chroma is centered at 0.5 (127.5 on a 0..255 scale), not 128; jpeg = [Y*255, Cb*255+0.5, Cr*255+0.5]: max err Cb 0.0755, Cr 0.0477 (on the 0..255 scale) (opencv_sweep.py)
- [computed] COLOR_RGB2YUV_I420 (BT.601 limited range) on 2x2 blocks equals color-space space.rgb.ycbcr(r,g,b,0.114,0.299), which is not the default call (the default is BT.709): full-cube max 0.604 step, 0 colors over 1 step (opencv_sweep.py)
- [computed] COLOR_RGB2YUV_I420 does not equal ycbcr-bt601-625 or ycbcr-bt601-525: max err 29.2 / 30.0 code values (these spaces convert to PAL or SMPTE-C primaries first) (opencv_verify.py vs node)
- [fetched-primary] Hue range depends on dtype and code: 32F uses 360; 8U uses 180, or 256 for _FULL forward but 255 for _FULL inverse: cvtBGRtoHSV: hrange = 32F?360 : full?256:180; cvtHSVtoBGR: 32F?360 : full?255:180 (color_hsv.simd.hpp lines 1276/1302 (5.0.0))
- [computed] Because of the 256-vs-255 hue asymmetry, pure blue does not survive an HSV_FULL round trip: (0,0,255) -> [171,255,255] -> (6,0,255); the non-FULL HSV round trip returns (0,0,255) (cv2 5.0.0 run)
- [computed] HSV, HSV_FULL and HLS (uint8 and float) match color-space hsv/hsl within quantization over the full cube: HSV u8 max 0.64 step; HSV_FULL u8 0.64; HLS u8 0.5; float max 3.0e-5 of span (opencv_sweep.py)
- [computed] uint8 RGB2HLS_FULL is routed to Intel IPP (ippiRGBToHLS_8u_C3R) on IPP builds; the HSV IPP path is disabled by IPP_DISABLE_RGB_HSV=1: with IPP on: pure red -> L=127, S=254; 59.6% of the cube differs by 1 from IPP-off; 11.9% of colors over 1 step vs hsl; IPP off: max 0.833 step (color_hsv.dispatch.cpp + core/private.hpp (5.0.0) + cv2.ipp.setUseIPP runs)
- [computed] cvtColor rejects float64 input: cv2.error ... 'depth' is 6 (CV_64F) (cv2 5.0.0 run)
- [computed] Passing 0..255 float32 to RGB2Lab silently clips to 0..1: orange (255,128,0) gives Lab (97.14,-21.55,94.47), which is yellow; the correct value is (67.05,42.82,74.02) (cv2 5.0.0 run)
- [computed] Passing an RGB array to a BGR2* code gives large hue errors: max hue error 179.9° (BGR2HSV); a/b errors up to 175 (BGR2Lab) (cv2 5.0.0 run)
- [computed] cv2 uint8 self round trips are lossy: max RGB code error: HSV 6, HSV_FULL 9, HLS 5, Lab 27, Luv 29, YUV 34, YCrCb 1 (cv2 5.0.0 full-cube run)
- [computed] Channel extents of color-space spaces over the sRGB cube: lab-d65 a -86.18..98.24, b -107.86..94.48; luv u -83.07..175.01, v -134.11..107.42; yuv U ±0.436, V ±0.615 (numpy port of the color-space formulas, full cube)

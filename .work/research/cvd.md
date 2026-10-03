# cvd

## summary
Recommended CVD lens: use Machado, Oliveira & Fernandes 2009 for protan and deutan, and Brettel, Viénot & Mollon 1997 for tritan. Both run as SVG feColorMatrix filters in linear-light sRGB, applied with filter:url(#cvd-*) on the <html> element. The exact 'values' strings and a ready-to-use SVG snippet are in research/cvd.json.

How it was checked:
- **Machado table:** read from the colour-science dataset. I rebuilt the table from first principles: Smith & Pokorny 1975 cone fundamentals plus the "Typical CRT Brainard 1997" primaries.
  - Protan/deutan: L/M shift of 20*s nm, all 22 matrices within 1e-4.
  - Tritan: S shift of 60*s−1 nm, within 8e-4.
  - So the table operates on linear RGB, and strictly on that CRT's linear RGB. Applying it to linear sRGB is standard practice but an approximation.
- **Browsers:** Chromium DevTools and Firefox DevTools both ship the Machado severity-1.0 matrices (read from their source files). Chromium rounds them to 3 decimals, which changes 8-bit output by at most 2 levels.
- **Rendering:** I rendered the filters in headless Chromium 141:
  - The default (linearRGB) output matched the linear prediction exactly; a gamma-space version would be off by up to 70 levels.
  - The two-pass Brettel tritan filter was within 1/255.
  - On the real built site, with the filter on <html>, every position:fixed element stayed in place.
- **Model agreement** (CIEDE2000 over a 17³ sRGB grid): Machado vs Brettel averages 2.62 for protan and 1.78 for deutan, but 9.24 for tritan (95th percentile 18.99). That gap is why Brettel is recommended for tritan.

Pitfalls found:
- If the SVG filter definitions sit inside a display:none block and the color-space attribute isn't set, Chromium silently processes them in gamma sRGB (verified). Firefox reportedly ignores such filters entirely (search snippet only).
- Interpolating between table rows is buggy in both reference libraries (colour 0.4.7 and daltonlens 0.1.5). Offering only the published 0.1 severity steps avoids this.

Not verified: whether Firefox applies its matrix in linear or gamma space (search snippets about bug 1655053 conflict), and the cost of a full-page SVG filter while the hue animation runs.

## recommendation
Ship a :root-level lens: normal / protan / deutan / tritan.
- **Protan and deutan:** Machado 2009 matrices, severity from the published 0.1-step table. This matches Chromium and Firefox DevTools and models anomalous trichromacy properly.
- **Tritan:** Brettel 1997 as a two-pass SVG filter (feColorMatrix with a selector row, then feComponentTransfer, then feColorMatrix, then feBlend). Do not use Machado for tritan; it does not model tritanopia and differs from Brettel by a mean of 9.2 CIEDE2000.

Implementation:
- Put the <svg> defs in a zero-size container that is not display:none, and set color-interpolation-filters="linearRGB" explicitly on each <filter>.
- Toggle with :root[data-cvd=...]{filter:url(#cvd-...)}. Filtering only the root keeps the site's 13 position:fixed elements working (AGENTS.md rule 4: CSS, no JS layout).
- Do not use CSS filter functions for this; they run in gamma sRGB.
- v1 can be severity 1.0 only. If a severity slider is added, use 0.1 steps (no interpolation needed). For tritan, blend each Brettel matrix with identity, s*T + (1-s)*I, and keep the selector row unchanged.
- Readouts can show a simulated hex through the library's lrgb.

Cite Machado et al. 2009 (doi:10.1109/TVCG.2009.113) and Brettel et al. 1997 (doi:10.1364/JOSAA.14.002647) in the lens tooltip. Label Machado 1.0 as protanopia/deuteranopia; never call Machado's tritan output tritanopia.

## files
['<session-scratch>/research/cvd.json', '<session-scratch>/research/cvd/fe_values.json', '<session-scratch>/research/cvd/machado_table.json', '<session-scratch>/research/cvd/brettel_rgb.json', '<session-scratch>/research/cvd/model_agreement.json', '<session-scratch>/research/cvd/browser_matrix_check.json', '<session-scratch>/research/cvd/chromium_check.json', '<session-scratch>/research/cvd/chromium_display_none.json', '<session-scratch>/research/cvd/site_grid.png', '<session-scratch>/research/cvd/test.html', '<session-scratch>/research/cvd/site.mjs', '<session-scratch>/research/cvd/build.py', '<session-scratch>/research/cvd/repro2.py', '<session-scratch>/research/cvd/vision_deficiency.cc', '<session-scratch>/research/cvd/ff_constants.js', '<session-scratch>/research/cvd/filter-effects-1.bs', '<session-scratch>/research/cvd/dl_svg_cvd_svg_filters.html', '<session-scratch>/research/cvd/review.md']

## facts
- [fetched-primary] Machado 2009 citation: Machado, G.M., Oliveira, M.M., & Fernandes, L.A.F. (2009). A Physiologically-based Model for Simulation of Color Vision Deficiency. IEEE TVCG 15(6), 1291-1298. doi:10.1109/TVCG.2009.113; precomputed table credited to Machado (2010) MSc thesis, UFRGS, lume.ufrgs.br/handle/10183/26950 (raw.githubusercontent.com/colour-science/colour/develop/colour/blindness/machado2009.py and datasets/machado2010.py)
- [fetched-primary] Machado severity 1.0 protan matrix (linear RGB): [[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]] (colour-science CVD_MATRICES_MACHADO2010; identical in colour 0.4.7 matrix_cvd_Machado2009)
- [fetched-primary] Machado severity 1.0 deutan matrix: [[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]] (colour-science CVD_MATRICES_MACHADO2010)
- [fetched-primary] Machado severity 1.0 tritan matrix: [[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]] (colour-science CVD_MATRICES_MACHADO2010)
- [computed] feColorMatrix values, protan severity 1.0 (Machado): 0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0 (built from the table (research/cvd/build.py))
- [computed] feColorMatrix values, deutan severity 1.0 (Machado): 0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.01182 0.04294 0.968881 0 0  0 0 0 1 0 (built from the table)
- [computed] feColorMatrix values, protan 0.5 and deutan 0.5 (Machado): protan 0.5: 0.458064 0.679578 -0.137642 0 0  0.092785 0.846313 0.060902 0 0  -0.007494 -0.016807 1.024301 0 0  0 0 0 1 0 ; deutan 0.5: 0.547494 0.607765 -0.155259 0 0  0.181692 0.781742 0.036566 0 0  -0.01041 0.027275 0.983136 0 0  0 0 0 1 0 (built from the table)
- [computed] feColorMatrix values, Machado tritan 1.0 (not recommended): 1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.3039 0 0  0 0 0 1 0 (built from the table)
- [computed] Brettel 1997 tritan as a two-pass SVG filter (severity 1.0): plane1: 1.01354 0.14268 -0.15622 0 0  -0.01181 0.87561 0.13619 0 0  0.07707 0.81208 0.11085 0 0  7.92482 -5.66475 -2.26007 1 -0.2 ; then feFuncA discrete '0 0 0 0 1' ; plane2: 0.93337 0.19999 -0.13336 0 0  0.05809 0.82565 0.11626 0 0  -0.37923 1.13825 0.24098 0 0  0 0 0 1 0 ; feBlend normal (in=plane1, in2=plane2) (reproduced exactly (5 dp) from daltonlens 0.1.5 Simulator_Brettel1997(LMSModel_sRGB_SmithPokorny75); matches DaltonLens libDaltonLens/svg/cvd_svg_filters.html)
- [computed] The published Machado table can be rebuilt from first principles: Smith & Pokorny 1975 cone fundamentals + 'Typical CRT Brainard 1997' primaries. Protan/deutan with shift 20*s nm: max abs error 9.9e-5 over 22 matrices. Tritan with S shift 60*s-1 nm (5..59): error <= 7.9e-4. The CRT primaries are xy R(0.6189,0.3440) G(0.2765,0.6049) B(0.1512,0.0611). (colour 0.4.7 matrix_anomalous_trichromacy_Machado2009 (research/cvd/repro.py, repro2.py))
- [fetched-primary] Machado does not model tritanopia: Paper: 'we simulate tritanomaly based on the shift paradigm only as an approximation to the actual phenomenon and restrain our model from trying to model tritanopia.' colour-science emits a usage warning for Tritanomaly. (DaltonLens review source (github.com/DaltonLens/daltonlens.org _notebooks/2021-10-19-OpenSource-ColorBlindness-Simulations.ipynb) quoting the paper; colour machado2009.py)
- [fetched-primary] DaltonLens recommendation: 'For tritanopia the Brettel 1997 approach is still the most solid and basically only valid choice'. For protanopia/deuteranopia, Viénot 1999, Brettel 1997 and Machado 2009 are all solid. For protanomaly/deuteranomaly, Machado is more principled than blending with the original image. Library auto-select: Brettel for tritan, Machado for severity < 1, Viénot for severity 1. (DaltonLens review notebook; DaltonLens-Python simulate.py Simulator_AutoSelect)
- [computed] How far the models disagree, CIEDE2000 over a 17^3 sRGB grid (Machado 1.0 vs Brettel 1997): protan mean 2.62 / p95 6.67; deutan mean 1.78 / p95 4.24; tritan mean 9.24 / p95 18.99 / max 22.12 (research/cvd/build.py -> cvd/model_agreement.json)
- [fetched-primary] Chromium DevTools vision deficiency implementation: Machado 2009 severity-1.0 matrices rounded to 3 dp (protan 0.152 1.053 -0.205 / 0.115 0.786 0.099 / -0.004 -0.048 1.052, etc.) in a data: URL SVG filter with no color-interpolation-filters attribute, so the default linearRGB applies. Also achromatopsia 0.213/0.715/0.072, blurred vision (feGaussianBlur stdDeviation 2), reduced contrast. (raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/css/vision_deficiency.cc)
- [computed] Chromium's 3-dp rounding is the table rounded, with negligible effect: Exactly equals the table rounded to 3 dp; at most 2/255 difference in 8-bit output over a 33^3 grid (research/cvd browser_matrix_check.json)
- [fetched-primary] Firefox DevTools color vision simulation matrices: Exact 6-dp Machado severity-1.0 matrices for protanopia/deuteranopia/tritanopia, flattened column-major 4x5, applied via docShell.setColorMatrix. Achromatopsia uses 0.299/0.587/0.114. (raw.githubusercontent.com/mozilla-firefox/firefox/main/devtools/server/actors/accessibility/constants.js and simulator.js)
- [unverified] Whether Firefox applies its matrix in linear or gamma space: UNVERIFIED. Snippets about bug 1655053 (fixed in Firefox 81) conflict, and I could not find the Gecko code that consumes docShell's mColorMatrix. (web search snippets; nsDocShell.cpp read (only stores the matrix))
- [fetched-primary] color-interpolation-filters defaults to linearRGB: Value: auto | sRGB | linearRGB; Initial: linearRGB; applies to all filter primitives; inherited. linearRGB = 'linear-light sRGB color space'. It has no effect on CSS filter functions, which operate in sRGB. (raw.githubusercontent.com/w3c/csswg-drafts/main/filter-effects-1/Overview.bs)
- [fetched-primary] feColorMatrix 'values' format: type=matrix takes 'a list of 20 matrix values (a00 a01 a02 a03 a04 a10 a11 ... a34)', i.e. 4 rows x 5 columns in row-major order, computed on non-premultiplied values. Each primitive's result is clamped to the valid range. (csswg-drafts filter-effects-1/Overview.bs)
- [computed] A filter on the root element does not break position:fixed: Spec: filter creates a containing block for absolute/fixed descendants 'unless the element it applies to is a document root element'. In Chromium 141 on the built site, all fixed elements kept identical positions after a 1500px scroll in every mode. (filter-effects-1/Overview.bs line 343; headless test research/cvd/site.mjs)
- [computed] Rendering check: Chromium applies feColorMatrix in linear light by default: Machado protan with no attribute matched the linear prediction with 0 error (gamma prediction off by 70 levels). Brettel two-pass tritan within 1 level. Deutan within 1. (Chromium 141.0.7390.37 headless, research/cvd/test.html + check.py)
- [computed] Pitfall: SVG filter defs inside display:none: In Chromium a display:none filter without the attribute is processed in gamma sRGB (matched the sRGB prediction exactly). With an explicit color-interpolation-filters=linearRGB it is linear again. Firefox reportedly ignores filters defined in display:none subtrees. (Chromium part: research/cvd/chromium_display_none.json; Firefox part: storybookjs/storybook #36153/#36154 search snippets)
- [computed] Interpolation bugs between severity steps in reference libraries: colour 0.4.7 at s=0.15 extrapolates from the 0.2/0.3 rows (protan row0 col0 0.7869875; true midpoint 0.7954665). daltonlens 0.1.5 uses alpha = s - floor(10s)/10 without x10, so at 0.15 it weights the 0.2 row 5% instead of 50%. (research/cvd/machado_dump.py, dl.py, plus source reading)
- [fetched-primary] Brettel 1997 and Viénot 1999 citations: Brettel, Viénot & Mollon (1997) JOSA A 14(10), doi:10.1364/JOSAA.14.002647; anchors 475/575 nm (protan/deutan), 485/660 nm (tritan). Viénot, Brettel & Mollon (1999) Color Research & Application 24(4), 243-252. Brettel end page not verified. (DaltonLens website repo _bibliography/references.bib)
- [computed] Simulated hex readouts can use the existing library: space.rgb.lrgb -> Machado 3x3 -> clamp 0..1 -> space.lrgb.rgb gives [166,145,0] for #ff8000 protan 1.0, identical to colour-science (node import of /home/user/color-space/index.js vs colour 0.4.7)

## skeptic overall
None of the 14 claims is refuted. Every value was re-fetched from the primary source or recomputed independently, and all of them matched.

**Machado matrices and feColorMatrix strings (claims 2-8).** The severity-1.0 matrices match three sources:
- colour-science develop and installed 0.4.7 (identical).
- Firefox devtools constants.js, an independent codebase with the same 6-dp values.
- Chromium vision_deficiency.cc, which uses the same values rounded to 3 dp.

The severity-0.5 matrices come only from colour-science, since DaltonLens copied colour's table. The spectral rebuild confirms them: Smith & Pokorny 1975 with the Brainard 1997 CRT reproduces all 22 protan/deutan matrices to within 9.87e-5. It is the only one of the 6 dataset combinations that fits. All feColorMatrix strings parse exactly to the table, in the spec's row-major a00..a34 order.

**Citation and quotes (claims 1, 11, 12).** The citation, the tritanopia quote and the DaltonLens recommendations are confirmed. The tritanopia quote has three corroborations: the DaltonLens notebook verbatim, colour-science's warning text, and the paper PDF as the top search hit for the exact phrase. The DaltonLens summary leaves out "a slight advantage for Viénot" at severity 1.

**Chromium DevTools (claim 14).** I drove Chromium 141's real Emulation.setEmulatedVisionDeficiency over CDP. The output matches the 3-dp matrices applied in linearRGB with 0/255 error, versus 72-73/255 under the gamma-space hypothesis.

**Caveats the orchestrator should carry forward:**
1. **The Brettel tritan numbers are from an older DaltonLens model.** They come from daltonlens 0.1.5 (still the latest on PyPI, 2021) and match libDaltonLens's SVG file. DaltonLens-Python master and libDaltonLens.c master have since switched to a Judd-Vos-corrected model with different numbers (plane1 starts 1.01277 0.13548 -0.14826). I reproduced those numbers exactly. The two versions differ by ΔE2000 mean 0.25, max 1.20, so either is fine, but the site should name its source.
2. **The two-pass tritan filter is less accurate in Chromium than reported.** cvd.json says "max 1/255", based on 12 test colors. On a 9^3 grid I measured max 6/255 (ΔE2000 mean 0.31, p95 1.06, max 4.44), concentrated in dark channels. The single-matrix Machado filter on the same grid stays at 1/255, which suggests 8-bit intermediate surfaces in multi-primitive filter graphs.
3. **The model-agreement stats depend on which Brettel is used.** Against the master Brettel, protan becomes 2.50/6.42; deutan and tritan barely change.
4. **The "first principles" rebuild is not fully independent.** It uses colour-science's own model implementation and datasets. I could not reach the Machado paper, IEEE, doi.org or lume (proxy 403).

Scratch files are in <session-scratch>/research/skeptic_cvd/:
- Scripts: rebuild.py, brettel_two.py, agree.py, agree_master.py, cdp.mjs, cdpcheck.py, svgtri.mjs, svgtricheck.py, svgpro.mjs, svgprocheck.py
- Re-fetched sources: machado2009.py, machado2010.py, vd.cc, ff_constants.js, dl_simulate.py, dl_convert_master.py, libDaltonLens.c, dl_svg.html, fx.bs, review_master.ipynb
- Screenshots: cdp_*.png, svgtri.png, svgpro.png

No repo files were edited.

## refuted

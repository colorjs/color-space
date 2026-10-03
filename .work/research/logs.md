# logs

## summary
Four camera logs missing from the catalog have published math that I checked against the vendor documents. Two of them reuse curves already in the repo:

- **F-Log2 C** is the F-Log2 curve on F-Gamut C.
- **Apple Log 2** is the Apple Log curve on Apple Wide Gamut.

The other two are new curves:

- **GP-Log2** (GoPro MISSION 1 series): log base 600 on Rec.2020, documented by GoPro Labs.
- **KineLOG3** on Kinefinity Wide Gamut: Kinefinity's spec page, which has been revised once. Use the second version; the first had a different blue primary and matrices that don't match it.

Three more have math, but nothing proves the vendor stands behind it:

- **vivo Log + vivo Wide Gamut**: only in ACES pull request #31, not yet merged.
- **Huawei H-Log**: only in ACES pull request #30, not merged, from an outside contributor.
- **DJI D-Log2 + D-Gamut2** (Osmo Pocket 4P): a decode-only DaVinci Resolve transform file that search results credit to DJI. There is no white paper, and the gamut primaries can only be worked out from a matrix rounded to 4 decimals.

The rest can't be implemented:

- **D-Log M**: DJI publishes only lookup tables. Community versions are per-model curve fits.
- **Z-Log2**: lookup table only, reverse-engineered by the community, and no primaries.
- **GoPro GP-Log (HERO12/13)**: base 400 is only claimed by the community, and the gamut is unknown.
- **Honor**: nothing found.

Samsung Log and Insta360 I-Log both have vendor white papers, but the proxy blocks both sites, so I couldn't read their constants. These two still need checking.

Most vendor sites were blocked. Reachable sources were raw.githubusercontent.com, `git clone` of public GitHub repos (including ACES pull request branches), and search-result snippets. The vendor PDFs for Apple Log 2, F-Log2 C, both KineLOG3 versions and O-Log were read as byte copies in the thatcherfreeman/dwg-transforms repo.

All reference values were computed with colour-science 0.4.7 and recomputed independently in Node with the repo's `mat3`/`inv3`. The two agree to 6 decimals and match the vendor reference tables. Proposed test anchors in the `test/refs.js` format are in `logs.json`. No repo files were changed.

## recommendation
1. **Add F-Log2 C (`flog2c`) and Apple Log 2 (`applelog2`) first.** Both reuse curves already in the repo (`flog2.js` and `applelog.js`). Each needs a new gamut file linked to `xyz`, mirroring `dlog.js`; the primaries and computed matrices are in `logs.json`. Cite the Fujifilm data sheet plus colour-science for F-Log2 C, and the Apple white paper plus the ACES and OCIO transforms for Apple Log 2.
2. **Add GP-Log2 (`gplog2`)**, modelled on `protune.js` and linked to `rec2020-linear`. The file header should say that linear 1.0 means clip and 18% grey is L=0.0517.
3. **Add KineLOG3 (`kinelog3`)** using the second version of the spec. The header should note:
   - the blue primary was revised from y=-0.2282 to y=-0.2236;
   - the green primary is virtual (y=1.148);
   - the spec's "0% → 0.09 IRE" is a typo (the formula gives 9.29 IRE).
4. **Wait on vivo Log, Huawei H-Log and DJI D-Log2.** vivo and H-Log need their ACES pull requests (#31, #30) merged or a vendor document. D-Log2 needs a white paper or a DJI-hosted copy of the Resolve transform. If you add D-Log2 earlier, mark it provisional because its primaries are worked out from a rounded matrix.
5. **Samsung Log and Insta360 I-Log need a manual download.** The proxy blocks both vendor sites. If you put the PDFs in the scratchpad, I'll check the constants against Samsung's official 1D lookup table and Insta360's 18%→432 code.
6. **Don't add D-Log M, Z-Log2, GP-Log (HERO12/13) or Honor.** None has published math. Keep the existing "black box" note style used in `dlog.js`.

Each new space should get the two `test/refs.js` anchors listed in `logs.json` (18% grey and linear-sRGB red), with the vendor's 18%-grey value as the primary check.

## files
['<session-scratch>/research/logs.json', '<session-scratch>/research/verify_logs.py', '<session-scratch>/research/verify_out.json', '<session-scratch>/research/jscheck.mjs', '<session-scratch>/research/build_logs_json.py']

## facts
- [fetched-primary] Apple Log 2 uses the Apple Log transfer function unchanged (R0=-0.05641088, Rt=0.01, c=47.28711236, β=0.00964052, γ=0.08550479, δ=0.69336945): identical to spaces/applelog.js (Apple Log 2 White Paper, Sept 2025, Part 028-00834 v1.1 (copy: github.com/thatcherfreeman/dwg-transforms/specs/Apple Log 2 White Pper.pdf; original developer.apple.com/download/all/?q=Apple%20log%202, login-gated))
- [fetched-primary] Apple Wide Gamut primaries and white point: R(0.725,0.301) G(0.221,0.814) B(0.068,-0.076), white D65 (0.3127,0.3290) (Apple Log 2 White Paper; also aces-aswf/aces-input-and-colorspaces apple/CSC.Apple.AppleLog2_to_ACES.ctl (merged 2026-02-04, PR #20) and OpenColorIO main AppleCameras.cpp)
- [computed] Apple Log 2 reference values (white paper table, then computed): 0%→0.150477 (computed 0.150476), 18%→0.488272, 90%→0.681686 (computed 0.681687), 1200%→1.0; 10-bit 154/500/697/1023 all match (White paper table; colour-science log_encoding_AppleLogProfile)
- [computed] Apple Log 2 anchor: D65 grey and linear-sRGB-red XYZ to Apple Log 2: [17.108208,18,19.603044]→[0.488272]×3; [41.23908,21.263901,1.933082]→[0.633951,0.36873,0.298659] (colour-science normalised_primary_matrix + log_encoding_AppleLogProfile; Node with repo util.js gives the same)
- [fetched-primary] F-Log2 C curve is identical to F-Log2 (a=5.555556, b=0.064829, c=0.245281, d=0.384316, e=8.799461, f=0.092864, cut1=0.000889, cut2=0.100686685370811): 10-bit codes 95 (0%), 400 (18%), 570 (90%) (Fujifilm F-Log2 C Data Sheet Ver.1.0, PDF dated 2024-11-15 (dl.fujifilm-x.com/support/lut/F-Log2C_DataSheet_E_Ver.1.0.pdf; read via copy in thatcherfreeman/dwg-transforms/specs))
- [fetched-primary] F-Gamut C primaries: R(0.7347,0.2653) G(0.0263,0.9737) B(0.1173,-0.0224), white D65 (Fujifilm F-Log2 C data sheet; colour-science 0.4.7 RGB_COLOURSPACES['F-Gamut C'] (datasets/fujifilm.py))
- [computed] F-Log2 C computed checks: 0→0.092864, 0.18→0.391007, 0.9→0.557132 (×1023 = 95.0/400.0/569.95); XYZ sRGB red→[0.4991,0.322007,0.191368] (colour-science 0.4.7, cross-checked in Node)
- [search-snippet] F-Log2 C shipped on X-H2, X-H2S and GFX100 II by firmware: November 2024 (newsshooter.com / cined.com / fujiaddict.com)
- [fetched-primary] KineLOG3 formula: Y=log10(a·x+1)·b·c+d (x≥cut); (x−cut)/s (x<cut); a=66.64, b=0.296, c=0.907136, d=0.092864, cut=-0.008239, s=0.017178 (Kinefinity 'KineLog3 Technical Specifications' (2025-09-24), v1 and v2 copies in thatcherfreeman/dwg-transforms/specs)
- [fetched-primary] Kinefinity Wide Gamut primaries in the current (v2) spec: R(0.7571,0.2282) G(0.2139,1.1480) B(0.0536,-0.2236), white D65; v1 had B y=-0.2282 (KineLog3 spec v2 copy; live kinefinity.com/kinelog3-technical-specifications shown in search snippets with B=-0.2236)
- [computed] KineLOG3 v2 published matrices match the v2 primaries; v1 matrices did not: v2 max diff 4.7e-5 (KWG→XYZ), 4.3e-5 (XYZ→KWG), 5.0e-5 (KWG→BT.2020); v1 off by 0.034 (NPM computed from primaries vs printed matrices)
- [computed] KineLOG3 spec IRE checks: 18%→39.193 IRE (spec 39.2); 90%→57.22 (spec 57.2); 0%→9.286 IRE, where the spec prints '0.09' (looks like a units typo); code 1.0 decodes to linear 35.85 (KineLOG3 formula)
- [computed] KineLOG3 anchor: D65 grey and sRGB-red XYZ: grey→[0.391928]×3; red→[0.519755,0.327437,0.224483] (Python and Node agree)
- [fetched-primary] GoPro GP-Log2 formula and gamut: v=ln(599L+1)/ln(600), L=(600^v−1)/599, L=1 is clip, 18% grey at L=0.0517; Rec.2020 primaries (github.com/gopro/labs docs/log/README.md (gopro.github.io/labs/log, David Newman, 2026-05-19 to 2026-09-22) and docs/gplog2/index.html (LOGBASE=600))
- [computed] GP-Log2 document mapping checks: 0.0517→0.5416 (≈554/1023), 0.25→0.7841, 0.5→0.8919, 1→1.0; 0.18→0.733117 (computed)
- [search-snippet] GP-Log2 cameras: GoPro MISSION 1 / MISSION 1 PRO / MISSION 1 PRO ILS (GoPro Labs doc; community.gopro.com article; petapixel/newsshooter)
- [fetched-primary] vivo Log and vivo Wide Gamut appear only in an unmerged ACES pull request: encode 0.265817·log10(5.558556y+0.076581)+0.382516 (y>0.006132), else 5.775961y+0.092813; WG R(0.7063,0.2957) G(0.1913,0.9623) B(0.1115,-0.0492) D65; 18%→0.391092; 1.68e-4 gap between branches at the cut (aces-aswf/aces-input-and-colorspaces refs/pull/31/head ('add CSC as submitted', 2026-09-03))
- [fetched-primary] Huawei H-Log appears only in an unmerged ACES pull request from an outside contributor: 0.2902·log10(5.555556x+0.035852)+0.470634 (x≥0.01), else 7.624634x+0.092864; BT.2020; 18%→0.475073; continuous to 1e-6 (aces-aswf/aces-input-and-colorspaces refs/pull/30/head (user scz51, 2026-08-11); the cited 'H-Log technical specification' was not found)
- [fetched-primary] DJI D-Log2 decode constants (from a DCTL credited to DJI): H=475, a=16.285770761945304, k1=0.059439938321493, b1=0.304985337243402 (=312/1023), k2=2.96093524549225, b2=0.148314799066323; code 1.0→475 (47500%); segments meet exactly at 0.18 and 0.028961695 (copy of DLog2_DGamut2_to_ACES_AP0 DCTL in thatcherfreeman/dwg-transforms/specs; DJI authorship only from search snippets)
- [computed] D-Gamut2 primaries worked out from the 4-decimal matrix: R(0.73468,0.26532) G(0.15997,0.84003) B(0.08999,-0.07999), white (0.31267,0.32899) (computed from dgamut2_to_xyz in the DCTL)
- [search-snippet] No D-Log2 white paper as of 2026: DJI has not released one (gamut.io/dlog2-osmo-pocket-4p; Threads post by @sircalen)
- [fetched-primary] DJI D-Log M has no published math: lookup tables only; community DCTLs are per-model fits (forum.dji.com thread-297669; thatcherfreeman/dwg-transforms D-Log M DCTL headers)
- [fetched-primary] Z CAM Z-Log2 has no published math: curve reverse-engineered from Z CAM's 1D lookup table and E2 footage; no primaries (github.com/thatcherfreeman/zlog-curve README; Z-Cam Z-Log2 to DWG.dctl header)
- [search-snippet] A Samsung Log white paper exists (encode/decode functions, BT.2020-2 colorimetry, log curve with S-shaped toe), but I couldn't read its constants: constants unverified (developer.samsung.com/mobile/samsung-log-video.html; scribd 830667592 (both blocked))
- [search-snippet] Insta360 refers to a 10-bit I-Log white paper (Rec.2020, 18% grey near code 432), but I couldn't read its constants: constants unverified (onlinemanual.insta360.com (blocked))
- [fetched-primary] colour-science (0.4.7 and develop) has no Apple Log 2, KineLOG3, GP-Log2, Samsung, D-Log2/M, Z-Log2, I-Log, vivo or Huawei: develop adds only O-Log; F-Gamut C is in 0.4.7 (raw.githubusercontent.com colour develop transfer_functions/__init__.py, datasets/__init__.py; local colour.LOG_ENCODINGS / RGB_COLOURSPACES)
- [fetched-primary] Side check: milog.js constants are the final Dec-2024 Xiaomi values: match ACES PR #13 and colour CONSTANTS_MI_LOG (aces-input-and-colorspaces refs/pull/13/head; colour 0.4.7 source)
- [computed] Side check: the OPPO O-Log white paper contradicts itself on 18% grey; olog.js follows the formula: prose says 18%→0.4901589 (502); formula and Table 1 give 18%→0.3895463 (399); olog.js gives 0.3896 (oppo-o-log_profile_whitepaper_v1.pdf (copy in dwg-transforms/specs))

## skeptic overall
I could not refute any of the 14 claims. Every curve constant, primary set, white point, reference table and computed anchor reproduces when re-fetched from source or recomputed.

How I checked:
- **Vendor documents:** re-downloaded fresh copies from raw.githubusercontent.com (Apple Log 2 white paper, both Fujifilm data sheets, KineLog3 spec v1 and v2, GoPro docs) and read them with pdftotext.
- **Images in the KineLog3 v1 PDF:** rendered the pages and read the primaries table directly.
- **Commit history:** fresh git clones of ACES (Apple Log 2 commit 2331f7d, 2026-02-04, PR #20) and gopro/labs.
- **Computation:** values recomputed in Python (my own code plus colour-science 0.4.7) and Node (repo util.js), using the literal anchor inputs.

Five corrections to wording or interpretation (no value changes):
1. **KineLOG3 v1 matrices:** they are consistent with each other and already imply the v2 blue (−0.2236). The 0.034 mismatch comes mainly from a bad white normalisation (implied white xy 0.3133/0.3319, Y 1.0285), so the printed v1 B y = −0.2282 is probably a typo. The v2 primaries and matrices remain the right choice.
2. **GoPro dates:** docs/log/README.md was written 2026-05-19 to 05-23. The 2026-09-22 date belongs to docs/gplog2/index.html.
3. **Grey anchor label:** the input [17.108208, 18, 19.603044] follows the repo's test/refs.js convention but is not exactly xy-derived D65 ([17.108207, 18, 19.603040]). Results are identical to 6 dp.
4. **Apple Log 2 table rounding:** the white paper over-rounds 0% (exact 0.150476452) and truncates 90% (exact 0.681686796). 18% at 10-bit is 499.503, close to the rounding boundary.
5. **KineLOG3 "IRE":** the spec's 39.2 and 57.2 only match if IRE means full-range code × 100. Treating "0.09" as a code value is an inference.

F-Log2 C firmware is confirmed by snippets from Fujifilm's own firmware pages plus independent press: 2024-11-21 (X-H2S 7.10, GFX100 II 2.30; X-H2 5.10 from press only).

What could not be verified: byte identity of the GitHub-mirrored PDFs against the vendor originals. developer.apple.com is login-gated, and dl.fujifilm-x.com and kinefinity.com are unreachable from the sandbox. Independent ACES, OCIO, colour-science and kinefinity.com snippet sources do agree on the content.

My scratch files are in <session-scratch>/research/skeptic-logs/ (sk_apple.py, sk_lit.py, sk_node.mjs, the PDFs and their text extracts, rendered KineLog3 v1 pages, and clones aces-sk and gopro-sk). No repo files were edited.

## refuted

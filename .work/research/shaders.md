# shaders

## summary
color-space can ship HLSL verifiably, and MSL only with a macOS CI job. The route that works is translating the existing WGSL output with naga (WGSL → naga validate → HLSL/MSL).

- **naga sweep (computed):** All 594 sources (every edge plus every rgb↔space path) parse, validate, and produce HLSL (SM 6.0) and MSL (2.0) in 0.9 s on Node 22, using the npm package naga-wasm 30.2.0 (wraps the upstream crate naga =30.0.1).
- **Official CLI cross-check (computed):** naga-cli 30.0.1 built here from crates.io with cargo in about 59 s. Its output is byte-identical to naga-wasm on 6 sampled sources.
- **Independent HLSL compile (computed):** Ubuntu's glslang-tools 15.1.0 compiles 580 of 594 naga-HLSL compute-harness shaders to SPIR-V that passes spirv-val. The 14 failures are all const-table spaces (ostwald, coloroid, dsh, wavelength), where naga emits `static const X[N] = ConstructarrayN(...)`. That is a glslang limitation: glslang also rejects upstream naga's own `wgsl-constructors.hlsl` snapshot, which upstream validates with DXC and FXC.
- **Numeric execution (computed):** Shaders ran on lavapipe, Mesa's CPU Vulkan driver, extracted from Ubuntu packages into scratchpad.
  - WGSL path: wgpu-py, 594 sources, about 28 s.
  - HLSL path: naga HLSL → glslang → SPIR-V → a raw Vulkan host in Python. 576 cases ran in 8.6 s (18 skipped: the 14 glslang rejections plus 4 LUT cases not wired up).
  - On chromatic inputs, 117 of 576 HLSL-path cases are bit-identical to the WGSL path and 381 are within 1e-6; all are within 1.5e-2.
  - Every case where the two paths differ by more than 1e-3 already has both paths more than 1e-3 away from the float64 JS library. That pattern is float32 conditioning, not mistranslation.
  - Dawn/Tint (npm `webgpu`) is a second, independent WGSL compiler: it ran 590 non-LUT cases from Node, 583 bit-identical to the naga path.
- **The biggest risk isn't specific to HLSL or MSL (computed):** In float32, 13 sources are off by more than 1% of the channel range on chromatic samples:
  - okhsl, okhsv and okhwb conversions at pure blue (e.g. okhsl→rgb gives G = −110.9 instead of 0)
  - rgb→ryb (magenta B = 0 instead of 62.1)
  - cctduv conversions for saturated primaries

  Nine more sources return NaN or Inf at black or white (ciecam02/cam02 at black, hsluv/hpluv at white). This already applies to the GLSL and WGSL shipped today; current CI never runs shaders in float32.
- **Post-processing naga's output needs (computed):**
  - *Entry names:* naga renames identifiers that end in a digit by appending `_`. This breaks the `${from}_${to}` entry name in 66 pairs (132 outputs), e.g. `lrgb_rec709` becomes `lrgb_rec709_`. The plain name is never emitted, so renaming it back is safe.
  - *Helper names:* trailing underscores are stripped, so `cbrt_`, `mod_` and `spow_` become plain `cbrt`, `mod` and `spow`, which can collide with host shader code. A C++ mock shows the ambiguity under `using namespace metal;`. Whether Metal's standard library actually declares `cbrt` is not verified.
  - *LUT texture (munsell, 4 sources):* HLSL declares a global `register(t0)` texture. MSL adds a texture parameter to every function, including the public entry.
- **The requested risks don't apply today:** mat3 layout/padding, mul order and mod/fmod. No output contains fmod, %, mul() or matrix types (0 of 594), thanks to the scalar-only chunk contract and the `mod_` helper. HLSL and MSL `atan2` keep the (y, x) order.
- **Not verifiable here:** DXC is not on npm, PyPI or Ubuntu 24.04, and github.com is blocked, so the official Linux tarball (search snippet only) wasn't tested. Metal can only be checked on macOS. Upstream wgpu CI shows the recipe (fetched from its workflow files): DXC and FXC on windows-latest, and `xcodebuild -downloadComponent MetalToolchain` followed by `xcrun metal` on macos-26.

Nothing in the repo was modified. Outside the research directory, the work wrote the naga-cli binary and build directory in scratchpad, the cargo registry cache, pip installs of wgpu and vulkan into scratchpad/py, and the npm cache.

## recommendation
Ship HLSL now and MSL behind a macOS CI job. Use naga as the translator (WGSL → naga → HLSL/MSL) rather than hand-written regex translators: naga's backends are already validated with DXC, FXC and Metal in upstream CI.

1. **Implementation (estimated 40–60 lines plus tests):** Add `gl/hlsl.js` and `gl/msl.js` as `naga(wgsl(from, to))`, plus a post-processing step:
   - rename `${entry}_` back to `${entry}` (shown to be collision-free);
   - prefix the generic helper names (`cbrt_`, `mod_`, `spow_`) in the WGSL before handing it to naga;
   - document that munsell (the LUT space) uses an HLSL `register(t0)` texture and an extra texture parameter on the MSL entry.
2. **Dependency:** Pin naga-wasm exactly, as a devDependency or optional peer, and lazy-load it on the site (592 KB brotli). Better long term: build the wasm from the official naga crate ourselves (the wrapper is about 200 lines of Rust), because naga-wasm is two weeks old and has a single maintainer.
3. **CI tier 1 (every `npm test`):** parse and validate all 594 sources, emit HLSL and MSL, assert the entry names, lint for fmod, % and matrix types, and snapshot a few outputs. Takes about 1 s.
4. **CI tier 2 (Ubuntu job):** apt-install `glslang-tools` and `mesa-vulkan-drivers`. Run the harnessed WGSL and the naga HLSL (via glslang → SPIR-V) on lavapipe, comparing against the JS library with new per-chunk float32 tolerances and comparing the HLSL path against the WGSL path. Takes 30–60 s.
5. **CI tier 3 (authoritative compile):** DXC and FXC on windows-latest, or the official Linux DXC tarball. For MSL, a macos-26 job running `xcodebuild -downloadComponent MetalToolchain` then `xcrun metal`.

Before promoting any GPU target further, fix or document the float32 outliers: okhsl, okhsv and okhwb at the gamut edge, ryb, cctduv, and the NaNs at black and white in CAM02 and HSLuv/HPLuv. They affect the GLSL and WGSL shipped today and are invisible to current CI.

## files
['<session-scratch>/research/shaders.json', '<session-scratch>/research/naga-sweep.mjs', '<session-scratch>/research/naga-names.mjs', '<session-scratch>/research/rename-check.mjs', '<session-scratch>/research/gen-cases.mjs', '<session-scratch>/research/run-gpu.py', '<session-scratch>/research/run-vk.py', '<session-scratch>/research/analyze.py', '<session-scratch>/research/gpu-wgsl.json', '<session-scratch>/research/gpu-hlsl-glslang.json', '<session-scratch>/research/gpu-hlsl.json', '<session-scratch>/research/gpu-analysis.json', '<session-scratch>/research/gpu-f32-range-relative.json', '<session-scratch>/research/out/', '<session-scratch>/research/num/', '<session-scratch>/research/dawn/probe.mjs', '<session-scratch>/research/cxx/mock.cpp', '<session-scratch>/research/upstream/', '<session-scratch>/research/nagawasm/', '<session-scratch>/research/apt/', '<session-scratch>/research/wgpupy/']

## facts
- [computed] All generated WGSL sources pass naga parse+validate and emit HLSL and MSL: 594/594 in 906 ms (Node v22.22.0, naga 30.0.1 via naga-wasm 30.2.0) (<session-scratch>/research/naga-sweep.mjs)
- [fetched-primary] naga-wasm wraps the upstream naga crate with hlsl-out and msl-out: upstream = { package = "naga", version = "=30.0.1", features = [glsl-in, glsl-out, hlsl-out, msl-out, spv-in, spv-out, wgsl-in, wgsl-out] } (https://raw.githubusercontent.com/kekkon-nexus/naga-wasm/main/Cargo.toml)
- [fetched-primary] naga-wasm package provenance: single maintainer ryansuhartanto; created 2026-09-17; versions 0.0.0, 30.0.0, 30.1.0, 30.2.0; engines node>=24.12; MIT OR Apache-2.0 (https://registry.npmjs.org/naga-wasm)
- [computed] naga-wasm wasm size: 2,053,200 bytes raw; 756,207 gzip -9; 592,380 brotli q11 (scratchpad/research/nagawasm/package/dist/wasm/naga_bg.wasm)
- [computed] naga-wasm wasm imports only wasm-bindgen JS value helpers (no fs/network): 40 imports, all ./naga_bg.js __wbg_* / __wbindgen_* (WebAssembly.Module.imports on naga_bg.wasm)
- [computed] naga-cli builds from crates.io in this sandbox and matches naga-wasm output: naga-cli 30.0.1, 58.92 s release build (Rust 1.97.0); 6/6 sampled HLSL+MSL outputs byte-identical (scratchpad/naga/install.log; scratchpad/research/out/cli vs out/)
- [fetched-primary] naga's Namer strips trailing separators and appends '_' to names ending in a digit, keywords or builtins: sanitize(): trim_end_matches(SEPARATOR); call(): if base.ends_with(char::is_numeric) || keyword || builtin { push(SEPARATOR) } (https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/naga/src/proc/namer.rs)
- [computed] Entry functions renamed by naga and safety of renaming back: 132 of 1188 HLSL+MSL outputs (66 pairs) renamed entry to `${entry}_`; plain `${entry}` never present (0/132) (scratchpad/research/rename-check.mjs)
- [computed] Util helpers renamed by naga: cbrt_->cbrt, mod_->mod, spow_->spow; atan2_ stays atan2_ (atan2 is in naga's HLSL keyword list) (scratchpad/research/naga-names.mjs; naga/src/back/hlsl/keywords.rs)
- [computed] No matrix, mul(), fmod or % constructs in generated HLSL/MSL library code: 0 of 594 HLSL and 0 of 594 MSL outputs (grep over scratchpad/research/num/hlsl and num/msl)
- [computed] LUT handling differs per target: HLSL: global `Texture2D<float4> munsell_ren_tex : register(t0);` MSL: texture threaded as a parameter into the public entry for 4/4 LUT sources (scratchpad/research/out/rgb_munsell.hlsl, rgb_munsell.metal; rename-check.mjs)
- [computed] glslang (Khronos HLSL frontend) compiles naga's HLSL: 580/594 compiled; spirv-val passed on all 580; 14 fail with 'Recursion detected' (ostwald, coloroid, dsh, wavelength const tables) (glslang-tools 15.1.0-2~ubuntu0.24.04.2 run on scratchpad/research/num/hlsl)
- [fetched-primary] glslang also rejects an upstream naga snapshot that upstream validates with DXC and FXC: wgsl-constructors.hlsl (contains `static const float2x2 const4_[1] = Constructarray1_float2x2_(...)`, .ron target cs_5_1) fails in glslang (https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/naga/tests/out/hlsl/wgsl-constructors.hlsl and .ron; https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/.github/workflows/shaders.yml)
- [fetched-primary] Upstream wgpu validates naga HLSL with DXC+FXC on Windows and MSL with xcrun metal on macOS: shaders.yml: windows-latest `cargo xtask validate hlsl dxc` / `fxc`; macos-26 `sudo xcodebuild -downloadComponent MetalToolchain` then `cargo xtask validate msl`; validate.rs runs `xcrun -sdk macosx metal -mmacosx-version-min=10.11 -std=macos-metal2.x -x metal file -o /dev/null` (https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/.github/workflows/shaders.yml; https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/naga/xtask/src/validate.rs)
- [fetched-primary] Upstream GPU tests run on hosted runners with software or virtual devices: gpu-test matrix: windows-2022 (DXC + WARP + Mesa), macos-14, ubuntu-24.04 (Mesa) (https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/.github/workflows/ci.yml)
- [search-snippet] DXC Linux binaries are published officially: linux_dxc_2026_09_28.x86_x64.tar.gz for v1.9.2609 (not downloadable here: github.com 403) (https://github.com/microsoft/DirectXShaderCompiler/releases)
- [fetched-primary] DXC not packaged in Ubuntu 24.04 or on npm/PyPI: absent from noble/noble-updates main+universe; npm dxc* only an unrelated 2020 package; PyPI none (http://archive.ubuntu.com/ubuntu/dists/noble*/{main,universe}/binary-amd64/Packages.gz; registry.npmjs.org; pypi.org)
- [search-snippet] Xcode 26 ships the Metal toolchain as a separate downloadable component: xcodebuild -downloadComponent MetalToolchain (https://developer.apple.com/forums/thread/803174)
- [computed] CPU Vulkan execution is possible in this sandbox and on Ubuntu CI: mesa-vulkan-drivers 25.2.8 lavapipe: 'llvmpipe (LLVM 20.1.2, 256 bits)', adapter_type CPU, via wgpu-py 0.32.0 (wgpu-native 29.0.1.1) (scratchpad/research/run-gpu.py)
- [computed] HLSL path (naga HLSL -> glslang -> SPIR-V -> lavapipe) vs WGSL path on the same device, chromatic inputs: 576 cases: 117 bit-identical, 381 <=1e-6, 470 <=1e-4, 561 <=1e-3, max 1.5e-2; all 15 cases >1e-3 already >=1e-3 from float64 in both paths (scratchpad/research/run-vk.py, analyze.py, gpu-analysis.json)
- [computed] Dawn/Tint (npm webgpu 0.6.2) agrees with wgpu/naga on lavapipe: 590 non-LUT cases ran in ~16 s; 583 bit-identical (scratchpad/research/dawn/probe.mjs)
- [computed] Float32 GPU accuracy vs the float64 scalar library (WGSL on lavapipe, chromatic samples, range-relative): 594 sources: 425 <=1e-6, 568 <=1e-4, 581 <=1e-2; 13 >1% of range (okhsl/okhsv/okhwb at pure blue, rgb->ryb, cctduv); 9 produce NaN/Inf at black/white (ciecam02/cam02-*, hsluv/hpluv) (scratchpad/research/gpu-f32-range-relative.json, gpu-wgsl.json)
- [fetched-primary] Existing CI never executes shaders in float32: test/gl.js evaluates the GLSL dialect as JS (float64); test/wgsl.js only parses (wgsl_reflect); scripts/check-gl-gpu.js only compiles/validates (/home/user/color-space/test/gl.js, test/wgsl.js, scripts/check-gl-gpu.js)
- [computed] Global helper `cbrt` plus `using namespace metal;` produces an ambiguous call in C++ if metal::cbrt exists: clang++ -std=c++14: error: call to 'cbrt' is ambiguous (mock namespace) (scratchpad/research/cxx/mock.cpp)
- [unverified] Whether Metal's metal_stdlib declares cbrt: not verified (community transcription of the MSL math table did not list it; official PDF not fetched) (https://raw.githubusercontent.com/alexiscn/metal-shading-language-specification/master/ch05.md)
- [unverified] DXC/FXC/Metal compiler acceptance of the 594 outputs: not tested (no DXC/FXC/macOS available) (n/a)

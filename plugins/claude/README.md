# color-space

Verified color math for Claude: conversions between 205 color spaces – OKLCH, CIELAB, CAM16, HCT, Display P3, Rec. 2020, camera logs such as S-Log3 and LogC4, print and appearance models – each pinned to an authoritative reference (colorjs.io, colour-science, the defining paper or standard).

The plugin adds two things:

- **The color-space MCP server**, with nine read-only tools: `convert` (any pair, batches), `gamut` (which display gamut holds a color), `css` (CSS Color 4 strings), `space` and `spaces` (channels, ranges, references, provenance), `cube` (.cube LUTs), `icc` (ICC profiles), `shader` (the conversion as GLSL, WGSL, HLSL or MSL) and `code` (the JS call and its verified colour-science Python equivalent). A color goes in as any CSS string, such as `#ff8000` or `oklch(0.7 0.1 50)`, or as channel values.
- **A skill** that tells Claude when to use these tools instead of computing color math from memory.

## What it runs

The server runs locally over stdio: Claude Code starts it with npx, which downloads the pinned npm package `color-space@3.4.0` (zero dependencies, public domain) once. After that it needs no network, no API key and no configuration. It reads no files, stores nothing and sends no data anywhere: every tool is pure computation on the values you pass.

Library, CLI and catalog: https://github.com/colorjs/color-space · https://color-space.io

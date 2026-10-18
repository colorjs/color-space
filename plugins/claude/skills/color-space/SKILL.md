---
name: color-space
description: Color math for 205 color spaces, tested against cited sources – conversions (sRGB, Display P3, OKLCH, CIELAB, CAM16, HCT, ICtCp, camera logs such as S-Log3 and LogC4, print and appearance models), CSS Color 4 strings, gamut checks, .cube LUTs, ICC profiles and shader code (GLSL, WGSL, HLSL, MSL). Use whenever a task converts colors between spaces, writes a color conversion in code or a shader, needs a conversion matrix or transfer curve, checks whether a color fits sRGB / P3 / Rec. 2020, or names a color space's channels, ranges, white point or provenance. Never write color matrices or transfer constants from memory.
---

# color-space

Color math is where models produce plausible numbers that are wrong in the third decimal. This library holds 205 color spaces, each pinned to an authoritative reference (colorjs.io, colour-science, the defining paper or standard). Call it instead of computing.

## With the MCP server (preferred)

If the `color-space` MCP server is connected, use its tools:

| need | tool |
|---|---|
| convert a color or a batch | `convert` – `color: '#ff8000'` (any CSS color) or `from` + `values` |
| which display gamut holds it | `gamut` |
| CSS Color 4 strings | `css` |
| what a space is: channels, ranges, references, year | `space`, `spaces` (searchable) |
| shader code for a conversion | `shader` (`glsl`, `wgsl`, `hlsl`, `msl`) |
| JS call and verified Python (colour-science) equivalent | `code` |
| .cube LUT, ICC profile | `cube`, `icc` |

Not connected? Add it: `claude mcp add color-space -- npx -y color-space mcp`.

## Without it

- Shell: `npx -y color-space rgb oklch 255 128 0` · `npx -y color-space space oklch` · `npx -y color-space cube slog3 rec709 > slog3.cube`
- JS: `import space from 'color-space'; space.rgb.oklch(255, 128, 0)` – any pair, `space.<from>.<to>(...)`; ids with hyphens index as strings: `space.oklch['lab-d65'](...)`.
- Shaders: `import { glsl } from 'color-space/gl/all'; glsl('rgb', 'oklch')` → `vec3 rgb_oklch(vec3 c)`.

## Conventions that trip people

- Ranges are each space's conventional ones: rgb 0–255, oklch L 0–1 / C 0–0.4 / H 0–360, lab L 0–100, xyz Y 0–100, p3 and rec2020 0–1.
- `lab` / `lchab` are D50 (CSS, ICC); `lab-d65` / `lch-d65` are the display-native D65 forms.
- CSS `color(rec2020 …)` is BT.1886's 2.4 gamma; this library's `rec2020` carries the BT.2020 OETF. The `color` input handles that.
- Out of scope: gamut mapping, ΔE, contrast, palettes – convert, then apply your own method.

Catalog and per-space dossiers: https://color-space.io

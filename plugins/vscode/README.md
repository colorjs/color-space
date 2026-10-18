# Color Space for VS Code

Every color in your file on one plane, in OKLCH, HCT, CAM16, Display P3 or any of 205 color spaces, written back in
its own notation: CSS, Swift, Flutter, Compose, Unity, Godot, Unreal, design tokens, themes and palettes.

The same picker as [Color Space for Figma](https://www.figma.com/community/plugin/1691970922817908383/color-space),
beside your code instead of your canvas.

## Use it

Open the **Color Space** view in the secondary side bar (or run **Color Space: Pick Color**). Put the cursor on a
color: it becomes the current one, outlined in the editor. Drag on the plane, a slider, or type a value; the literal
is rewritten as you go, and a drag is one undo step.

- **The file's colors at once.** Every color of the file is a swatch and a dot on the plane, so you see how a palette
  sits in a space. **In selection** narrows them to the cursor's color or the selected text.
- **Gradients** are lines on the plane, mixed in the gradient's own interpolation space (`in oklch longer hue`…); edit
  a stop and the line follows.
- **Images** a stylesheet names in `url()`, or one open in the editor, show where their pixels fall: dots on the
  plane, histograms on the sliders.
- **Variables are edited where they live.** With the cursor on `var(--brand)`, `$brand` or `@brand`, the picker edits
  the `--brand: …` definition (following aliases such as `--button: var(--brand)`), so every use follows.
- **Snap** to the file's other colors, or quantize to Tailwind, CSS named colors, xkcd, web-safe, PICO-8 or ANSI.
- **Gamuts:** the plane draws sRGB, Display P3 or Rec.2020; a color past the file's gamut is said to be, and written
  mapped into it (CSS Color 4 gamut mapping).
- **Measure:** hold ⌥ (Alt) over another color for its steps on each channel and the WCAG contrast. ⇧ holds one
  channel during a drag, ⌘ (Ctrl) moves a tenth as far.
- **Merge:** drop a swatch onto another and both literals take one color.
- **Eyedropper:** pick any pixel on screen into the current color.
- **Hover** any color for its OKLCH, Display P3 and hex values and its gamut; **Color Space: Convert Color To…**
  rewrites the selected CSS colors in another notation.

## What it reads

| Where | Colors |
|---|---|
| Any file | `#hex`, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` (CSS Color 4); named colors in stylesheets |
| Swift | `Color(red:green:blue:)`, `Color(.displayP3, …)`, `Color(hue:saturation:brightness:)`, `UIColor`, `NSColor(srgbRed:…)` |
| Dart, Kotlin, Java | Flutter `Color(0x…)`, `Color.fromARGB`, `Color.fromRGBO`; Compose `Color(…)`; Android `#AARRGGBB` |
| C#, GDScript, C++ | Unity `new Color`, `Color32`; Godot `Color`, `Color8`, `Color.hex`; Unreal `FLinearColor`, `FColor` |
| Shaders | `vec3`/`vec4`, `vec3f`, `float3`, `half3`: off by default (a vector is as often a position); set **colorSpace.shaders** |
| Data | Xcode `.colorset`, design tokens (DTCG), iTerm2 `.itermcolors`, GIMP `.gpl`, Adobe `.ase` (read only) |

Each is written back in its own form: a `#hex` keeps its case and length, a Swift call its labels, `0.5f` its suffix.

## Settings

- **colorSpace.gamut**: `p3` (default) or `srgb`, the gamut edits are written in for notations that can name wider
  colors. `#hex`, `rgb()`, `hsl()` and `hwb()` are always written inside sRGB.
- **colorSpace.shaders**: `off` (default), `srgb` or `linear`: whether shader vectors are colors, and how to read them.

## Also

- The panel and messages follow VS Code's display language.
- The library's MCP server is offered to VS Code's agents (where VS Code has the MCP API): convert, gamut, CSS and
  shader tools, so an agent calls verified color math instead of guessing it.
- Works offline. Nothing is sent anywhere.

## Limits

- A variable is followed within the open file; one defined in an imported file isn't.
- `color(rec2020 …)` isn't read: CSS defines it with a pure 2.4 gamma, the library's rec2020 with the BT.2020 curve.
- `.ase` swatches in CMYK, Lab or Gray, and iTerm2 colors without a color space, are skipped and counted, not guessed.

## Develop

```sh
npm run build:vscode     # plugins/vscode/dist/
npm run test:vscode      # the literals against colorjs.io, the extension on a mock VS Code, the panel in Chromium
```

To try it from source, without installing it: a new window on [`playground/`](https://github.com/colorjs/color-space/tree/master/plugins/vscode/playground), the extension loaded.

```sh
npm run build:vscode && code --extensionDevelopmentPath="$PWD/plugins/vscode" plugins/vscode/playground
```

Free and open source (CC0). Library and source: [github.com/colorjs/color-space](https://github.com/colorjs/color-space).
The atlas of all 205 spaces: [color-space.io](https://color-space.io/).

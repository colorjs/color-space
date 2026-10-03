# color-space for Figma

A Figma plugin that shows the solid fills and strokes of the current selection in any of
color-space's color spaces. You can edit the values and write them back to the layer,
and copy the color as CSS.

The plugin lives in this repository but isn't part of the npm package: package.json
`"files"` doesn't list `plugins/`.

## What it does

- **Reads the selection.** It reads every `SOLID` fill and stroke of the selected layers, up
  to 100 paints, along with the file's color profile (`figma.root.documentColorProfile`).
  Gradients, images and other paint types are skipped.
- **Uses the file's color space.** Figma paint channels are 0–1 values in the document's
  profile (per Figma's docs; see Limitations). In a Display P3 file they're read as Display P3 (the library's `p3`). In an sRGB
  file they're read as sRGB (`rgb`). A legacy file, made before Figma had color
  management, is also read as sRGB and labelled "sRGB · legacy".
- **Shows any space.** Pick any space in the library. The plugin saves the choice on your
  machine with `figma.clientStorage`, and the default is `oklch`.
- **Writes edits back.** When you change a channel, the plugin converts the color to
  OkLCh and gamut-maps it into the file's gamut (see below). It clamps each channel to
  [0, 1] and writes it back. Paints are read-only objects in Figma, so the plugin copies
  the `fills`/`strokes` array, swaps in the edited paint and reassigns the array. Opacity,
  blend mode and visibility stay as they were. Paints that come from a color style or a
  variable are shown but not written (see Limitations).
- **Copies CSS.** There are two copy fields:
  - `oklch(L C H / a)`
  - `color(display-p3 r g b / a)` in P3 files, or `#rrggbb[aa]` in sRGB files
- **Follows Figma's theme.** It opens with `showUI({ themeColors: true })` and uses only
  Figma's `--figma-color-*` variables for color. It takes spacing and type from the
  atlas's own tokens (`web/tokens.css`).
- **Stays read-only in Dev Mode.** The manifest targets `["figma", "dev"]` with the
  `inspect` capability. In Dev Mode the plugin shows values and copies CSS but never
  writes. The main thread refuses any write unless `figma.editorType === 'figma'`.
- **Follows live edits.** If you edit a selected layer's fills or strokes while the
  plugin is open, it picks up the change. It listens for `nodechange` on the current page.
  Under `documentAccess: "dynamic-page"`, `documentchange` would first need
  `loadAllPagesAsync`.
- **Never uses the network.** The manifest sets `networkAccess` to `none`, and `ui.html`
  carries the whole library inline.

## Gamut mapping

An edit can produce a color the file can't hold, for example `oklch(0.7 0.37 50)` in an
sRGB file. The plugin maps it with the CSS Color 4 algorithm, [CSS Gamut Mapping to an
RGB Destination](https://drafts.csswg.org/css-color-4/#css-gamut-mapping), following the
[binary search with local MINDE pseudocode](https://drafts.csswg.org/css-color-4/#pseudo-binsearch)
step for step:

- It reduces OkLCh chroma at constant lightness and hue.
- It stops once clipping is within one JND of the color, with JND = 0.02 in
  [ΔEOK](https://drafts.csswg.org/css-color-4/#color-difference-OK) and ε = 0.0001.
- Lightness ≥ 1 gives white, and lightness ≤ 0 gives black.

After mapping, every channel is clamped to [0, 1]. When mapping changed the value, the
panel says so. The code is in `src/gamut.js`.

The plugin can't simply clamp the library's output. The library encodes out-of-gamut
values with a sign-mirrored transfer function, so a value has to be mapped first.

Checked against the spec's own examples (computed with `src/gamut.js`):

| Input | Spec's result | This plugin |
|---|---|---|
| `color(display-p3 1.1 0.4 0.2)` → P3 | `color(display-p3 1 0.473 0.314)` | `1, 0.4728, 0.3142` |
| `oklch(76% 0.27 60)` → P3 | `color(display-p3 1 0.546 0)` | `1, 0.5458, 0` |

It was also compared with colorjs.io 0.5.2 `toGamut({ method: 'css' })` on two OkLCh
sample grids (2,016 and 3,024 colors per gamut). Results agree within 2e-7 in sRGB and
within 0.0022 in P3, about half of one 8-bit step (1/255). The P3 differences come from
where the binary search stops: the spec accepts any chroma whose clipped ΔEOK lies within
ε of the JND, and floating-point noise moves that stop. The raw OkLCh → RGB conversions
agree within 4e-7.

## Load it for development

In the Figma **desktop** app, open the right-click menu and choose **Plugins › Development
› Import plugin from manifest…**, then pick `plugins/figma/manifest.json`. This is the
path Figma's own plugin-samples README gives.

`ui.html` is committed, so loading the plugin needs no build. After you change anything
in `src/`, rebuild:

```sh
npm run build:figma      # node plugins/figma/build.js; needs data.json (npm run data)
```

The build does three things:

- It bundles `src/ui.js` and the full library into one minified IIFE with esbuild. The
  lite build lacks `p3`, `hsl` and `hct`.
- It inlines that bundle into `src/ui.html`.
- It copies in the `web/tokens.css` tokens that the template uses, and fails if one is
  missing.

The result is about 140 KB, about 62 KB gzipped (the build prints the size). Figma hands the manifest's `ui` file to
`code.js` as a string (`__html__`), so scripts and styles are inlined, and with
`networkAccess` set to `none` nothing is fetched at runtime.

| File | Role |
|---|---|
| `manifest.json` | Figma Design and Dev Mode (inspect), dynamic-page, no network |
| `code.js` | Main thread (Figma's sandbox, no DOM): reads paints, writes edits, saves the chosen space |
| `src/ui.js` | UI: color math, rendering, editing, copying |
| `src/gamut.js` | CSS Color 4 gamut mapping |
| `src/ui.html` | UI template |
| `ui.html` | Built UI that Figma loads |
| `build.js` | Builds `ui.html` |

## Test

```sh
npm run test:figma       # node scripts/check-figma.js, about 5 s
```

The test rebuilds `ui.html`. It then runs the real `code.js` in Chromium against a mock
`figma` global. The mock's `showUI` puts the built UI in a sandboxed iframe and passes
messages the way Figma does. Its paints are frozen, so code that mutates a paint instead
of copying the array fails the check.

It covers read → display → edit → `set` → write → re-read in an SRGB file and a
DISPLAY_P3 file. That includes:

- a color outside sRGB but inside P3, which is written unchanged in the P3 file
- out-of-gamut edits in both files
- legacy files, Dev Mode, variable-bound and style-linked paints, and text with mixed fills
- edits made outside the plugin, and a profile change under the open UI
- `clientStorage`, the copy fallback, and an axe structure scan

Every expected number comes from the library and `src/gamut.js` in Node. The test isn't
part of `npm test`.

## Limitations

- **Not yet run in Figma.** It has only been checked against the mock above, so
  everything Figma-specific still needs a pass in the desktop app before publishing:
  - the real sandbox and iframe
  - that a Display P3 file's paint values are Display P3. Figma's `RGB` docs page says
    colors are in the document's color profile, but only a search snippet of that page
    was seen here, and the typings don't say.
  - the clipboard
  - Dev Mode's Inspect panel
  - how legacy files look
  - whether the dropdown and scrollbars follow Figma's theme. Their colors come from
    CSS `color-scheme`, not from Figma's variables.
- **Clipboard.** Whether `navigator.clipboard` works inside Figma's plugin iframe is
  unverified; the only evidence is forum posts. If it fails, the plugin selects the text
  and calls `document.execCommand('copy')`. If that also fails, the button says
  "Selected" so you can press ⌘C / Ctrl+C.
- **Variables and styles.** The plugin shows paints bound to a variable, and fills or
  strokes linked to a color style, but won't write them. It's unverified whether writing a
  raw color detaches the variable or the style, so the plugin leaves them alone. Edit the
  variable or the style instead.
- **Mixed text fills.** Text whose fill changes partway through (`figma.mixed`) is skipped.
  Per-range fills (`getRangeFills`/`setRangeFills`) aren't supported.
- **Opacity.** Opacity appears in the CSS but can't be edited.
- **Lossy spaces.** Some spaces can't hold every color, such as projections like
  `kelvin`, `wavelength` and `gray`. The panel then says the values are the nearest
  equivalent in that space, and editing writes that equivalent.
- **Legacy files.** These are read and written as sRGB. Figma's help center reportedly
  says that legacy files without a preferred profile render as sRGB, but we only saw
  that in a search snippet, because the page itself couldn't be fetched.
- **Precision.** Displayed values are rounded to the channel's range. An edit keeps the
  other channels at full precision.

## Publishing (owner action)

Only the repository owner can publish the plugin, with their own Figma account. Figma
reportedly generates the plugin id when you publish (the official samples carry numeric
ids of that kind): replace `"id"` in `manifest.json` with it before you submit. The
`"color-space"` id is a placeholder for local import. The publishing steps, account
requirements and review are set by Figma (see Figma's help center); they weren't verified
here because those pages are blocked in this environment.

Possible follow-ups:

- Add the `codegen` capability, so Dev Mode's Code panel prints `oklch()` /
  `color(display-p3 …)` for the selected node.
- Port the plugin to Penpot. Penpot fills are 8-bit sRGB hex only, so a Penpot version
  couldn't write P3.

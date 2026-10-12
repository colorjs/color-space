# color-space for Figma

A Figma plugin that picks the solid fills and strokes of the current selection in any of
color-space's 168 color spaces: a plane of two channels over a bar for each one, painted
per pixel on the GPU and cut to the file's gamut. You can drag, type or step the values,
and copy the color as CSS.

The plugin lives in this repository but isn't part of the npm package: package.json
`"files"` doesn't list `plugins/`.

## What it does

- **Reads the selection.** It reads every color slot of the selected layers' fills and
  strokes, up to 100: each `SOLID` paint and each gradient stop (a stop keeps its alpha
  and position when edited), along with the file's color profile
  (`figma.root.documentColorProfile`). Image paints are read for their pixels (below).
  Other paint types are skipped.
- **Uses the file's color space.** Figma paint channels are 0–1 values in the document's
  profile (per Figma's docs; see Limitations). In a Display P3 file they're read as Display P3 (the library's `p3`). In an sRGB
  file they're read as sRGB (`rgb`). A legacy file, made before Figma had color
  management, is also read as sRGB and labelled "sRGB, legacy"; the tag's tooltip says so.
- **Shows any space.** The space picker works like Figma's font menu: a search over names and
  ids, a family filter, and the list in the atlas's seven families, each led by its three
  featured spaces (`web/js/categories.js`) set bold, the current one checked. It opens with
  the current space's name in the search, selected; ↑↓ move, Enter takes, Escape or a press
  outside closes (that press only closes it; the control under it doesn't act). A plugin frame can't paint outside itself, so the menu opens in the page
  under its button and the window grows to hold it while it's open. The plugin saves the choice on your machine with
  `figma.clientStorage`, and the default is `oklch`.
- **Picks on a plane.** Two channels are swept across a square and the rest are held. Each
  space opens on its natural plane: lightness × chroma at one hue (OkLCh, HSL, HCT…), a × b
  at one lightness (Lab, OSA-UCS…). A hue paired with chroma or saturation is drawn as the
  space's wheel. The pair buttons switch planes, and the choice is saved per space.
- **One bar per channel.** Each bar sweeps its channel with the others held, so it shows
  what moving it would do. Drag the thumb, use the arrow keys (1% a press; Page Up/Down
  10%), or type the exact value in the field beside it.
- **Figma's layout and shapes.** The panel is 264 px wide, near Figma's own picker. The
  selection's colors head it as full-width rows, like Figma's layers, the current one on
  Figma's quiet fill (selected, not focused). Then the space picker
  (an outlined box with a chevron) with the file's profile beside it, the plane, and the
  sliders with the eyedropper beside them and each channel's value cell at the end of its
  row. Handles are Figma's knobs, 16 px with a 3 px white ring around the color; bars are
  16 px pill tracks with the knob kept inside, each painted along the knob's travel so the
  knob sits on its own color.
- **Gestures.** A drag on the plane, a bar or a value's letter writes live once per frame,
  hides the cursor, keeps going past its element (the plane and bars clamp at their edge),
  and ends exactly once with one commit and one undo step, however it ends: a release, a
  cancel, lost capture, the window losing focus, or (when the frame never saw the release)
  the next move without a button. A drag across the plane never repaints it; a re-read
  during a drag never moves the coordinates.
- **Figma's fields.** The value cells take Figma's shape: filled, the channel letter
  inside, the selection color on focus. Drag the letter sideways to scrub the value (the
  channel's span over 300 px; Shift is 10× finer; a hue wraps). Values print with the
  atlas's fixed decimals (`decOf`), so a field never changes width as you drag.
- **Shows the file's gamut.** Past the file's gamut (sRGB or Display P3) the plane and the
  bars fade to half; where a coordinate is no color at all (off the spectral locus, past the
  space's physical range) they show the checkerboard. In a P3 file the fields are painted
  in Display P3, not clipped to sRGB.
- **Quantize.** The atlas's lens menu, with its icons. 10-step and 20-step snap the plane
  and the bars to that many cell centres per channel, for palettes in even steps; keys then
  move one cell. 16-bit and JND snap the color to RGB565 or to a just-noticeable OkLab grid.
  The palettes (web-safe, CSS names, xkcd, Tailwind, PICO-8, ANSI) draw their colors as
  cells on the plane and bars, and every pick writes the nearest palette color. A named
  palette's color also shows its name (for example `sky-500`) in a field you can copy.
- **Same picker as the atlas.** The plane and bar fields come from the site's own GPU
  kernel (`web/js/gl.js`), which runs the library's verified shader chunks per pixel,
  including OSA-UCS's iterative inverse and CAM16. Without WebGL2 the plugin falls back
  to the site's CPU plane and gradient bars.
- **Writes edits back.** Dragging writes the color live, once per frame, and the release
  closes one undo step (`figma.commitUndo`). The plugin converts the color to OkLCh and
  gamut-maps it into the file's gamut (see below), clamps each channel to [0, 1] and
  writes it back. The picked coordinate stays where you put it: a hue survives zero
  chroma, and a point past the gamut stays under the pointer while the mapped color is
  written (the panel says so). Paints are read-only objects in Figma, so the plugin
  copies the `fills`/`strokes` array, swaps in the edited paint and reassigns the array.
  Opacity, blend mode and visibility stay as they were.
- **Edits tokens where they live.** A paint bound to a color variable is edited in that
  variable, in the layer's mode (`resolvedVariableModes`), following aliases to the
  variable that holds the value; the token keeps its alpha and its other modes. A fill or
  stroke linked to a paint style is edited in the style. Either way every layer that uses
  the token changes, and the panel says so. Library (remote) variables and styles are
  shown but locked: edit them in their library.
- **Eyedropper.** Where the browser has the EyeDropper API, a button picks any pixel on
  screen into the current paint (through the active palette lens, if any).
- **Copies CSS.** There are two copy fields, each with a copy button:
  - `oklch(L C H / a)`
  - `color(display-p3 r g b / a)` in P3 files, or `#rrggbb[aa]` in sRGB files
- **Follows Figma's theme.** It opens with `showUI({ themeColors: true })` and uses only
  Figma's `--figma-color-*` variables for color. It takes spacing and type from the
  atlas's own tokens (`web/tokens.css`).
- **Stays read-only in Dev Mode.** The manifest targets `["figma", "dev"]` with the
  `inspect` capability. In Dev Mode the plugin shows values and copies CSS but never
  writes. The main thread refuses any write unless `figma.editorType === 'figma'`.
- **Writes CSS in Dev Mode's Code panel.** With the `codegen` capability, the Code panel
  gets a "CSS (color-space)" language: the selected layer's fills (`background`, or
  `color` for text), strokes (`border-color`) and gradient stops, in the format chosen in
  the panel's settings: `oklch()` (the default), `oklab()`, `lch()`, `lab()`,
  `color(display-p3)`, `hsl()`, `hwb()`, `rgb()` or hex, serialized by the library's
  `css.js`. A color bound to a variable prints as `var(--brand-500, …)`. The sRGB-only
  formats gamut-map a wider P3 color into sRGB and say so in a comment. The `vscode`
  capability offers the same in Figma for VS Code.
- **Images as statistics.** An image paint's bytes (`getBytesAsync`) are decoded and
  sampled in the UI (the atlas's `extract.js`): every pixel is a dot on the plane, as on
  the dossier, and the image's prominent colors (k-means in OkLab) are swatches under the
  bars. A swatch writes its color into the current paint. With only an image selected, the
  image's color stands in for a paint: the picker explores it and the CSS fields copy it,
  but nothing is written.
- **Document colors.** The file's local color variables and paint styles (by name) and the
  solid colors on the current page (the first 4,000 layers) are small, quiet dots on the
  plane, where each sits in this slice of the space; a click writes that color.
- **Relaunch button.** A layer the plugin has edited gets a "color-space" button in its
  properties panel (`setRelaunchData`) that reopens the plugin on it.
- **Follows live edits.** If you edit a selected layer's fills or strokes while the
  plugin is open, it picks up the change. It listens for `nodechange` on the current page.
  Under `documentAccess: "dynamic-page"`, `documentchange` would first need
  `loadAllPagesAsync`.
- **Fits its content.** The panel reports its height and the window follows it. During a
  drag the window only grows; it settles on release.
- **A steady gamut status.** One line under the copy fields always says where the
  coordinate is: "In sRGB", or "Outside sRGB: written as the nearest sRGB color (CSS Color 4
  gamut mapping)", or the palette it snaps to. It reads the coordinate itself, not the last
  write, so it never flickers or changes height as a drag crosses the gamut.
- **Tooltips.** Figma's frame shows no native `title`, so the plugin uses the atlas's
  themed tooltip (`web/js/tip.js`), kept secondary: small, gone on any press, fading on its
  own after a moment, and brought by focus only from the keyboard (a clicked button takes
  focus, which would otherwise show its tip again).
- **Never uses the network.** The manifest sets `networkAccess` to `none`, and `ui.html`
  carries the whole library, its shader chunks and the registry metadata inline.

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

- It bundles `src/ui.js`, the atlas's picker modules (`web/js/core.js`, `web/js/gl.js`)
  and the full library with its shader chunks into one minified IIFE with esbuild. The
  library comes from source (`index.js`, `gl/index.js`), never from `dist/`. The lite
  build lacks `p3`, `hsl` and `hct`.
- It inlines the registry metadata from `data.json` (titles, channels, ranges, method)
  in place of `web/js/data.js`'s fetch.
- It inlines that bundle into `src/ui.html`, with the `web/tokens.css` tokens that the
  template uses, and fails if one is missing.

The UI is about 510 KB and the main thread about 130 KB (the build prints the sizes); most of it is the 168 spaces'
shader chunks. Figma hands the manifest's `ui` file to `code.js` as a string
(`__html__`), so scripts and styles are inlined, and with `networkAccess` set to `none`
nothing is fetched at runtime.

| File | Role |
|---|---|
| `manifest.json` | Figma Design and Dev Mode (inspect, codegen, VS Code), relaunch button, dynamic-page, no network |
| `src/code.js` | Main thread (Figma's sandbox, no DOM): reads color slots and images, writes edits where they live, closes undo steps, sizes the window, saves the preferences; codegen |
| `code.js` | Built main thread that Figma loads (with the library, ES2017) |
| `src/ui.js` | UI: the picker (plane, bars, steps), editing, copying |
| `src/gamut.js` | CSS Color 4 gamut mapping |
| `src/ui.html` | UI template |
| `ui.html` | Built UI that Figma loads |
| `build.js` | Builds `ui.html` and `code.js` |

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
- the picker on the GPU: the pixel under the marker is the coordinate's color (OkLCh,
  the OkLCh wheel, OSA-UCS), and P3 red reads 255, 0, 0 on the P3 file's plane
- a drag: live writes, one commit, one undo step, and the color where the pointer let go
- a hue kept through zero chroma, steps on the plane and on a bar's arrow key, a wheel
  pick, the saved space, lens and plane, and the window fitting its content
- the Tailwind lens: a pick writes a Tailwind color, the name field reads its token, and
  the plane cell under the marker is that color
- a variable reached through an alias: its value in the layer's mode is the edit, its
  alpha and other modes stay, the alias and the layer's binding stay; a style's paint is
  the edit and its linked layer follows; library variables and styles are locked in the
  UI and refused by `code.js`
- one- and two-channel spaces, and Dev Mode's plane and bars writing nothing
- gestures: a drag across the plane repaints nothing, hides the cursor, commits once; a drag
  past the plane's edge holds at the edge; a release outside the frame ends at the next
  buttonless move, and the next press works; blur mid-drag commits once; a bar press lands
  at its place along the knob's travel and clamps past the end; the bar's pixel under its
  knob is the coordinate's color
- document colors: the token and the style marked by name, a click writing into the stop
- the space menu: every space listed, each family led by its three featured spaces in bold,
  search by name, no-match message, the family filter, Enter taking the highlighted space; it opens on
  the current space in view, ↓↑ come back to it, Enter on it changes nothing, Escape closes
- the tooltip: a press dismisses it; focus after a press shows none, keyboard focus does
- a press outside the space menu closing it without acting on the row under it; the status
  naming a palette lens
- the space menu's search opening on the current name, selected; the window growing to hold
  the open menu on a short panel and returning when it closes
- the status line: one line in and out of the gamut, and a drag across the gamut resizing
  nothing; the image's row shaded as the current row
- a gradient: its stops listed, an edit writing one stop with its alpha and position kept;
  the relaunch button on an edited layer; the notes under the copy fields; the featured
  spaces starred
- an image (a PNG painted by the mock): its two colors as swatches, its pixels as dots,
  the image alone exploring without a write, a swatch writing into a gradient stop
- codegen with no UI: the default `oklch()` with a stroke's alpha, `lab()` for a text color
  from a variable as `var(--brand-500, …)`, hex of P3 red mapped into sRGB with a comment,
  and `color(display-p3 1 0 0)` in a P3 file
- `clientStorage`, the copy fallback, and an axe structure scan

Every expected number comes from the library and `src/gamut.js` in Node. The test isn't
part of `npm test`.

## Limitations

- **The picker is not yet run in Figma.** The earlier, fields-only version ran fine in
  the desktop app. The picker has only been checked against the mock above, so these
  still need a pass in Figma before publishing:
  - WebGL2 inside the plugin iframe (without it the plugin falls back to the CPU plane,
    which is slower and has no wheel)
  - `display-p3` canvases in a P3 file, on a P3 display
  - live writes while dragging, and one undo step per drag (`figma.commitUndo`)
  - the window resizing to its content (`figma.ui.resize`)
  - that a Display P3 file's paint values are Display P3. Figma's `RGB` docs page says
    colors are in the document's color profile, but only a search snippet of that page
    was seen here, and the typings don't say.
  - the clipboard, Dev Mode's Inspect panel, legacy files, and whether the dropdowns and
    scrollbars follow Figma's theme (their colors come from CSS `color-scheme`, not from
    Figma's variables)
- **Clipboard.** Whether `navigator.clipboard` works inside Figma's plugin iframe is
  unverified; the only evidence is forum posts. If it fails, the plugin selects the text
  and calls `document.execCommand('copy')`. If that also fails, the button says
  "Selected" so you can press ⌘C / Ctrl+C.
- **Variables and styles.** Edited through `Variable.setValueForMode` and
  `PaintStyle.paints`, checked only against the mock. Unverified in Figma: whether a bound
  paint's `color` reflects the variable right after the edit (the plugin reads the
  variable's own value instead), and how variables from extended collections behave.
- **Eyedropper.** Whether Figma's plugin frame allows `EyeDropper` is unverified. If it
  refuses, the button disappears and the panel says so.
- **Codegen, VS Code, relaunch.** Checked only against the mock. Unverified in Figma:
  whether `inspect` and `codegen` coexist in one plugin as declared (Figma's manifest docs
  list both without saying), the `vscode` capability, and how the relaunch button reads.
- **Drags past the panel.** Whether a drag keeps its pointer past the plugin frame depends
  on the frame keeping capture (a cross-origin frame does in Chromium; the mock's
  same-origin frame doesn't, so the checks drag inside it). Where it doesn't, the gesture
  still ends cleanly on the next move.
- **Images.** Decoded natively in the iframe (PNG, JPEG, GIF, WebP); the site's HEIC
  decoder is left out of the bundle. Up to four images per selection are sampled.
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

The Community listing, entered on the publish form:

- **Name:** color-space
- **Tagline:** Pick color in any color space: OKLCH, Lab, HSLuv, Munsell and 160+ more

Possible follow-ups:

- Add the `codegen` capability, so Dev Mode's Code panel prints `oklch()` /
  `color(display-p3 …)` for the selected node.
- Port the plugin to Penpot. Penpot fills are 8-bit sRGB hex only, so a Penpot version
  couldn't write P3.

# Color Space for Figma

A Figma plugin that picks the solid fills and strokes of the current selection in any of
color-space's 168 color spaces: a plane of two channels over a bar for each one, painted
per pixel on the GPU and cut to the file's gamut. You can drag, type or step the values,
and copy the color as CSS.

Install it from the Figma Community: [Color Space](https://www.figma.com/community/plugin/1691970922817908383/color-space).

The plugin lives in this repository but isn't part of the npm package: package.json
`"files"` doesn't list `plugins/`.

## What it does

- **Reads the selection.** It reads every color slot of the selected layers' fills and
  strokes, up to 100: each `SOLID` paint and each gradient stop (a stop keeps its alpha
  and position when edited), along with the file's color profile
  (`figma.root.documentColorProfile`). A selected group or frame shows the colors of what it
  holds, depth-first in layer order (hidden layers skipped, each layer once even when it's
  selected with its group, up to 2,000 layers), and a change anywhere inside it re-reads. Image paints are read for their pixels (below).
  Other paint types are skipped.
- **Uses the file's color space.** Figma paint channels are 0–1 values in the document's
  profile (per Figma's docs; see Limitations). In a Display P3 file they're read as Display P3 (the library's `p3`). In an sRGB
  file they're read as sRGB (`rgb`). A legacy file, made before Figma had color
  management, is also read as sRGB and labelled "sRGB, legacy"; the tag's tooltip says so.
- **Shows any space.** The space's field shows its name and is the search: focused, it lists
  the spaces in a menu under it (Figma's white one, the window growing to hold it), the current
  one checked; a family select at the menu's top (Featured first – each family's three,
  `web/js/categories.js` – then All spaces and every family, in a Figma menu) chooses the list,
  as Figma's font list does its sources; typing searches every space by name or id; ↑↓ move, Enter takes, Escape or a press outside
  closes and the field names the space again (that press acts on nothing else). The
  plugin saves the choice on your machine with `figma.clientStorage`, and the default is
  `oklch`.
- **Picks on a plane.** Two channels are swept across a square and the rest are held. Each
  space opens on its natural plane: lightness × chroma at one hue (OkLCh, HSL, HCT…), a × b
  at one lightness (Lab, OSA-UCS…). A hue paired with chroma or saturation is drawn as the
  space's wheel. The axis letters in the plane's corners are buttons: a click swaps that axis
  for the channel held (the tip names it), so C×L becomes H×L with one click on C. A wheel's
  corner holds the site's wheel/square switch. Both choices are saved per space. As on the
  site's planes, a pinch (or ⌃ wheel) zooms a square plane about the pointer, the wheel pans
  it once zoomed, and a double click shows the whole again; a wheel has no zoom. Holding ⌘
  (Ctrl elsewhere) during a drag on the plane or a bar moves the pick a tenth as far as the
  pointer, for fine placement; letting go of ⌘ keeps the offset it built, so the pick never
  jumps back under the pointer. The wheel/square switch is the site's: a crossed circle, or
  in a wheel a crossed square. The letters and the switch sit at one inset from their corners
  and take the ink of what shows under them, black or white: the plane's pixels sampled once
  painted, a translucent or empty corner read over the backdrop it shows through.
- **One bar per channel.** Each bar sweeps its channel with the others held, so it shows
  what moving it would do. Drag the thumb, use the arrow keys (1% a press; Page Up/Down
  10%), or type the exact value in the field beside it.
- **Opacity.** The last row is Figma's opacity bar, the color over the checker, with its
  value in percent (A). It sets a solid paint's opacity or a gradient stop's alpha, in whole
  percent as Figma keeps it. A stop bound to a variable sets the variable's alpha; a solid
  bound to one keeps the variable's alpha and sets the layer's paint opacity; a style-linked
  paint sets the style's.
- **Opens a space at once.** A space's plane is a shader that the GPU builds on its first
  draw: 0.5–1 s for a space it has never built (measured on an Apple M4 Max under ANGLE
  Metal; the OS caches it after), tens of ms once built. Once the current space is up, the
  featured spaces build in the background (one pixel each), and a space hovered or arrowed
  to in the menu goes first, so the usual picks open in about 10–50 ms. Software GL skips
  the background builds.
- **Figma's layout and shapes.** The panel opens 288 px wide, a little wider than Figma's own picker (240), and its right edge drags it from 240 to 560 px. The
  selection's colors head it as a palette, Figma's own Selection colors: a 16 px swatch per
  color (the same opacity, a difference under a fifth of the just-noticeable one, the same
  variable or style), each with a hairline inside its edge and a translucent one half solid, half
  over the checker, the current one outlined; a stroke's color is a swatch like any other, and
  hovering a swatch names every layer and place that uses it. An edit of a swatch writes all of them, one undo step. A swatch dragged onto
  another folds into it: its paints take that color and opacity, one undo step, and the two are
  one swatch. Then the space field and the two
  lenses, the plane, and the sliders with the eyedropper beside them and each channel's value
  cell at the end of its row. The status is one badge at the foot: the file's gamut (sRGB, P3),
  ink and "Outside P3" once the coordinate leaves it; its tooltip is the breakdown – the gamut,
  the file's profile, what the dots are, why a field is locked – read once, so it waits behind a
  hover. An error stays in sight beside it. Screen readers hear the same words (live regions).
  The panel's face is Inter, Figma's own, bundled (its Latin subset, 48 KB, OFL: `src/fonts`),
  so it reads as Figma's offline; its small dropdowns are Figma's dark menus, their colors measured. Handles are Figma's knobs as measured on its picker, 14 px with a 2.5 px white
  ring around the color; bars are
  16 px pill tracks with the knob kept inside, each painted along the knob's travel so the
  knob sits on its own color.
- **Gestures.** A drag on the plane, a bar or a value's letter writes live once per frame
  (the plane repaints at full resolution throughout),
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
- **Quantize and Limit.** The site's two lenses sit beside the space, Quantize first, each
  marked with its icon from the atlas's icon font (below). They are customizable selects
  (`appearance: base-select`, Chromium 135+): the page draws the list, so every option shows
  its icon in the font beside its name and the closed control shows the icon alone; the lists
  are short enough to open inside the plugin's frame. An OS-drawn list ignores web fonts (on
  macOS it draws in the system font), so where the select isn't customizable the native one
  stays, its options showing the icons' look-alike Unicode symbols. Quantize: 10-step and 20-step snap
  the plane and the bars to that many cell centres per channel, for palettes in even steps
  (keys then move one cell); 16-bit and JND snap the color to RGB565 or to a just-noticeable
  OkLab grid; the palettes (web-safe, CSS names, xkcd, Tailwind, PICO-8, ANSI) draw their
  colors as cells and every pick writes the nearest one, a named palette's color showing its
  name in a field you can copy. Limit: the file's gamut by default, or sRGB, P3, Rec.2020,
  Surface (the colors a lit surface can show) or Light (every real light) as the body the
  plane and bars ghost past; writes stay in the file's gamut.
- **The atlas's icon font.** `scripts/icon-font.js` compiles every icon in `web/js/icons.js`
  (the filled 16-grid family and the stroked 24-grid one, 48 glyphs) into a TrueType font with
  no dependency, written to `web/fonts/color-space-icons.ttf` with a name → codepoint map
  (`.json`) for any page or tool. The lens icons sit on look-alike Unicode symbols (▥ 10-step,
  ☰ Tailwind, △ P3…), so a list the OS draws in its own font still shows a fitting mark; the
  rest use the Private Use Area. The plugin inlines the subset it shows. A font is one color:
  icons that speak through opacity keep their shapes at full ink.
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
  Blend mode and visibility stay as they were.
- **Edits tokens where they live.** A paint bound to a color variable is edited in that
  variable, in the layer's mode (`resolvedVariableModes`), following aliases to the
  variable that holds the value; the token keeps its alpha and its other modes. A fill or
  stroke linked to a paint style is edited in the style. Either way every layer that uses
  the token changes, and the panel says so. Library (remote) variables and styles are
  shown but locked: edit them in their library.
- **Eyedropper.** Where the browser has the EyeDropper API, a button picks any pixel on
  screen into the current paint (through the active palette lens, if any).
- **Copies CSS in one format.** The value's field is its format's select: a chevron opens the
  formats (OKLCH, OKLab, LCH, Lab, P3, HSL, HWB, RGB, Hex; saved), each listed as the value it
  gives; the copy button follows, outside the field. The value
  comes from `src/notation.js`, the same code as the Code panel's: `oklch()` and `oklab()`
  at three digits (L and C to three decimals, the hue to three significant digits; at most
  0.004 ΔEOK from the unrounded color, a fifth of a JND, which the test checks over 4000
  colors), the alpha in whole percent as Figma keeps it. The sRGB-only formats (RGB, HSL,
  HWB, Hex) gamut-map a wider P3 color into sRGB, and the field's tooltip says so.
- **Follows Figma's theme.** It opens with `showUI({ themeColors: true })` and uses only
  Figma's `--figma-color-*` variables for color. It takes spacing and type from the
  atlas's own tokens (`web/tokens.css`).
- **Stays read-only in Dev Mode.** The manifest targets `["figma", "dev"]` with the
  `inspect` capability. In Dev Mode the plugin shows values and copies CSS but never
  writes. The main thread refuses any write unless `figma.editorType === 'figma'`.
- **Writes CSS in Dev Mode's Code panel.** With the `codegen` capability, the Code panel
  gets a "CSS (Color Space)" language, for a developer building what's selected. First the
  layer's own fills (`background`, or `color` for text), strokes (`border-color`) and
  gradient stops, in the format chosen in the panel's settings: `oklch()` (the default),
  `oklab()`, `lch()`, `lab()`, `color(display-p3)`, `hsl()`, `hwb()`, `rgb()` or hex,
  serialized by the library's `css.js` (`oklch()` and `oklab()` at three digits, as in the
  panel). A color bound to a variable prints as `var(--brand-500, …)`. Then, for a group,
  frame or component, a "Colors inside" section: every color of what it holds once, as a
  custom property ready for `:root` – named by its variable, else by the first layer that
  uses it (a second layer of the same name numbered), with the layers that use it in a
  comment; up to 64. The sRGB-only formats gamut-map a wider P3 color into sRGB and say
  so in a comment. The `vscode` capability offers the same in Figma for VS Code.
- **Images as statistics.** An image paint's bytes (`getBytesAsync`) are decoded and
  sampled in the UI (the atlas's `extract.js`, ≤ 96 px a side) after the picker has drawn:
  every distinct color is a dot on the plane, as on the dossier, as opaque as the pixels
  sharing it, on its own full-resolution layer; their coordinates are computed in slices
  across frames, so the picker never waits on them. Each channel's bar shows the image's
  histogram of that channel too (the site's strip recipe: weighted by pixel count, scaled to
  the 97th percentile), over the bar's field, or over a plain fill when the image is
  selected alone. The plane and its dots render at up to 1024 px, so a widened panel stays
  sharp. With only an image selected, its pixel
  nearest the mean (OkLab) stands in for a paint: the picker explores it and the CSS fields
  copy it, but nothing is written.
- **The other colors.** The selection's other colors are faint 6 px dots on the plane, where
  each sits in this slice of the space; nothing outside the selection is marked, the file's
  variables included. A gradient is a soft white line through its
  actual colors: the colors between each pair of stops mixed channel by channel in the
  file's RGB, as Figma blends them (a linear sRGB-encoded mix, reported on
  [Figma's forum](https://forum.figma.com/t/perceptual-gradients/11205); not in Figma's
  docs), each placed on the plane, so the line bends wherever the space does. Hovering a
  dot names where its color lives (the layer and its fill, stroke or stop, and its variable
  or style). A press on a dot takes that paint up: it becomes the current paint, writing
  nothing, and a drag from it moves it, in one undo step. The dots follow edits at once. A
  line in the badge's tooltip says which kinds of dots are showing ("Dots are other
  selected colors and image pixels.", the list joined in the panel's
  language by `Intl.ListFormat`).
- **Relaunch button.** A layer the plugin has edited gets a "Color Space" button in its
  properties panel (`setRelaunchData`) that reopens the plugin on it.
- **Follows live edits.** If you edit a selected layer's fills or strokes while the
  plugin is open, it picks up the change. It listens for `nodechange` on the current page.
  Under `documentAccess: "dynamic-page"`, `documentchange` would first need
  `loadAllPagesAsync`.
- **Fits its content, any width.** The panel reports its height and the window follows it;
  during a drag the window only grows and settles on release. It opens 288 px wide; the grip
  in its bottom-right corner, two straight ticks ending 3 px from the bottom and the right
  edge, taking presses only in the corner's triangle (or its arrow keys),
  sets the width from 240 to 560 px, the plane growing with it, and the width is saved. The
  height can't be set apart: it is the content's, and the plane is square. It is measured
  from the content itself (the lowest laid-out part), not the document or the body, so a
  host stylesheet holding those at the window's height can't keep a shrinking panel tall. The grip is a gesture like the
  picker's: a release outside the panel that Figma's frame never reports ends it at the
  next move.
- **Speaks the browser's language.** Figma doesn't tell a plugin its interface language, so
  the panel goes by the browser's first language (Figma desktop's is the system's), only
  that one: a later preference never switches it. German, French, Spanish, Italian,
  Portuguese, Russian, Turkish, Hindi, Japanese, Korean and Simplified Chinese have tables;
  anything else is English. Arabic isn't offered: the panel is laid out left to right. The
  panel's own words are in `src/i18n/<lang>.json` (the site's format; `build.js` writes
  `src/i18n/en.json` from the call sites); the words it shares with the site (lens names,
  families, channel names) come from `web/i18n/`. Only fresh, valid translations ship, and
  a language ships once nearly all its words are translated. None has had a native reader's
  review yet. The tables add about 100 KB to `ui.html`.
- **About.** An info mark at the panel's bottom right, beside the badge, opens a small
  card above it (a popover; a press elsewhere or Escape closes it): the mark and the name
  (the site), then, right-aligned, "by colorjs" (the code) and a heart (support). Its
  links open in the browser through `figma.openExternal`, and the main thread opens only
  those three pages.
- **A steady gamut status.** One line under the copy fields always says where the
  coordinate is: "In sRGB.", "Outside sRGB, mapped in." (the CSS Color 4 gamut mapping spelled
  out in its tooltip), or the palette it snaps to; the file's profile sits at its right. It reads the coordinate itself, not the last write, so it never flickers or changes
  height as a drag crosses the gamut.
- **Tooltips.** Figma's frame shows no native `title`, so the plugin uses the atlas's
  themed tooltip (`web/js/tip.js`), kept secondary: small, shown while its element is
  hovered, gone when the pointer leaves it or the panel, on any press, on Escape and when
  Figma takes focus; a click on a quiet explainer (the status line, the profile) shows it;
  a select's tip sits on the select itself and never shows over its open list;
  focus brings it only from the keyboard (a clicked button takes focus, which would
  otherwise show its tip again).
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
- the other colors: the selection's other stop named, no variable, style or page color
  marked, the gradient's line through its mixed colors (at the stops and halfway, against the
  library) and broken where it wraps round the hue on an H × L plane, the color just written shown on the next paint's plane, a press on a stop's dot
  making it current without a write, a drag from a dot moving that stop in one undo step
- a selected group: its children's colors in layer order with a hidden one skipped, a layer
  selected with its group listed once, an edit
  writing the child, a change two levels inside re-reading
- the space field: its name shown, Featured first, All spaces holding every space once, the
  family list shown whole with All spaces and Featured parted from the families, the current
  space checked, typing searching every space, Enter taking, Escape restoring the name, a press
  outside acting on nothing else; the small dropdowns as Figma's menus (its measured fill and
  highlight)
- the plane's controls: a click on C making C×L into H×L and back, the wheel/square switch
  saved per pair and its round trip leaving the letters' and the switch's ink as they were, the disc's centre showing its color on screen; the lens controls keeping
  their width on hover and opening from the chevron, a lens's tooltip on hover and none over
  its open list; the corner grip and its arrow keys setting the width, the resize cursor kept,
  a lost release ending the resize, a widen then a narrow bringing the height back under a
  host stylesheet that holds the document at the window's height
- one menu at a time: a lens closing the space menu and the space menu closing a lens; a held
  channel's drag repainting the plane at full resolution, the dots' layer too
- the lens lists: open, each option's icon in the icon font (P3's △), the closed control
  showing the icon alone, a click on an option taking it and closing the list
- the icon font: accepted by the browser's font sanitizer, every glyph tracing its SVG (IoU
  at 64 px), loaded in the panel
- the tooltip: it stays while hovered, leaves with the pointer, comes back on the next hover,
  swaps to the next element; a press dismisses it, a click on the profile shows it; focus
  after a press shows none, keyboard focus does
- the plane's view: a ⌃ wheel zooming about the pointer (the middle then picks the window's
  middle, checked against the zoom's arithmetic), the marker hiding when zoomed away from it,
  a double click showing the whole, another pair starting whole; a ⌘-drag
  moving the pick a tenth of the pointer's move
- the copy field: the field as the format's select, each format listed as its value, the rows
  lined up and fitting the panel (hex saved, lab(), back to oklch()), the copy button after it,
  P3 red's hex mapped into sRGB with a tooltip saying so
- languages: German, Brazilian Portuguese and Simplified Chinese browsers get their tables (the
  plugin's words and the site's), Traditional Chinese and Dutch get English, and an English
  browser with Russian as a second language stays English
- the about card: opened by the info mark, its links opening the sponsor page and the code,
  nothing else opened whatever the UI sends, Escape closing it
- the Limit: Surface repaints the plane and names itself, the status stays in the file's
  gamut; the status naming a palette lens
- the status line: one line in and out of the gamut, and a drag across the gamut resizing
  nothing; the image's row shaded as the current row
- a gradient: its stops listed, an edit writing one stop with its alpha and position kept;
  the relaunch button on an edited layer; the notes under the copy fields
- an image (a PNG painted by the mock): its pixels as dots, one of its pixels standing in
  as its color, no opacity row, exploring without a write; the dots' legend naming each kind
- opacity: a solid's read and typed (past 100% and below 0% clamped), an arrow key's percent,
  a drag landing in one undo step, its knob and color holding through re-reads that trail a
  newer write (mid-drag and after release) while a current re-read is taken,
  a stop's alpha with its color and position kept, a variable-bound solid's paint opacity with
  the token's alpha kept, a style's paint, a variable-bound stop's alpha in the token
- codegen with no UI: the default `oklch()` with a stroke's alpha, `lab()` for a text color
  from a variable as `var(--brand-500, …)`, hex of P3 red mapped into sRGB with a comment,
  `color(display-p3 1 0 0)` in a P3 file, and a frame's colors inside (a token by name, a
  raw color by its layer, a repeated name numbered; none inside: no section)
- the three-digit `oklch()`/`oklab()`: within JND/5 of the unrounded color over 4000 sRGB
  and P3 colors
- a P3 file's color inside sRGB, as hex and `rgb()`, converted exactly (`#ff8000` stays itself)
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
  - the space field's suggestion list and the lens selects opening past the plugin's frame
    (native popups do in Chromium; Figma's desktop shell is unverified)
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

Only the repository owner can publish the plugin, with their own Figma account. The
`"id"` in `manifest.json` (`1691970922817908383`) is the one Figma assigned to the plugin
at its first publish; every later update is published under it.

The listing's text, its field values and its media order are in
[promo/listing.md](promo/listing.md). The media are made from the plugin itself:

```sh
node plugins/figma/promo/promo.js          # the mark, the cover, a still per scene, both videos (needs ffmpeg)
node plugins/figma/promo/promo.js shots    # or one of: icon, shots, video
```

`promo.js` makes the project's mark (the spectral locus, also `web/img/locus-*.png`), the
cover, a still per scene and two videos: the whole tour and a 30 s cut. It runs the real `ui.html` and `code.js` on the test's mock host
(`scripts/figma-mock.js`, shared with `check-figma.js`) on a stage (`promo/stage.html`)
that draws a small design from the mock document's paints. The scenes are scripted
presses and drags, so an edit in the panel shows on the design. They are not recordings
of Figma's canvas. Real recordings from Figma can replace them, using the same shot list.

Possible follow-ups:

- A native reader's review of each translation (`"reviewed"` in `src/i18n/<lang>.json`).
- Port the plugin to Penpot. Penpot fills are 8-bit sRGB hex only, so a Penpot version
  couldn't write P3.

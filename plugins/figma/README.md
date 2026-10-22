# Color Space for Figma

A Figma plugin that picks the solid fills and strokes of the current selection in any of
color-space's 205 color spaces: a plane of two channels over a bar for each one, painted
per pixel on the GPU, the file's gamut drawn on it as a line. You can drag, type or step the values,
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
  the spaces in a menu under it (Figma's white one, as wide as the field – never narrower than 16 rem or the row's
  whole width at small sizes – the window growing to hold it), the current one checked, each row its name and its
  shape's mark, the site's (`web/js/core.js` `geoOf`) – a disc with a radius from its centre for a space with a hue
  angle (polar: HSL, OKLCH, HWB too), a rhombus parted down its neutral for opponent ones, a cube for the rest (the site's marks); a family select at the menu's top (Featured first – each family's three,
  `web/js/categories.js` – then All spaces and every family, in a Figma menu) chooses the list,
  as Figma's font list does its sources; typing searches every space by name or id; ↑↓ move, Enter takes, Escape or a press outside
  closes and the field names the space again (that press acts on nothing else); the field's chevron opens and shuts
  it, as a select's does. The
  plugin saves the choice on your machine with `figma.clientStorage`, and the default is
  `oklch`.
- **Picks on a plane.** Two channels are swept across a square and the rest are held. Each
  space opens on its natural plane: lightness × chroma at one hue (OkLCh, HSL, HCT…), a × b
  at one lightness (Lab, OSA-UCS…). A hue paired with chroma or saturation is drawn as the
  space's wheel; a hue paired with lightness is a square that the switch turns into a disc
  (black at its centre), as on the site. The axis letters in the plane's corners are buttons: a click swaps that axis
  for the channel held (the tip names it), so C×L becomes H×L with one click on C. A wheel's
  corner holds the site's wheel/square switch. Both choices are saved per space. As on the
  site's planes, a pinch (or ⌃ wheel) zooms a square plane about the pointer, the wheel pans
  it once zoomed, and a double click shows the whole again; a wheel has no zoom. Holding ⌘
  (Ctrl elsewhere) during a drag on the plane or a bar moves the pick a tenth as far as the
  pointer, for fine placement; letting go of ⌘ keeps the offset it built, so the pick never
  jumps back under the pointer. Otherwise a plane drag snaps to a dot within 3 px of it – another
  color's or an image pixel's – the plane's two channels its, the held one kept, as the site's planes snap;
  the tooltip names the color it would take, ⌥ measures to it; never while ⌘ places it finely, nor with Snap to colors off in
  the settings (on at first, kept). The wheel/square switch is the site's: a crossed circle, or
  in a wheel a crossed square; letters and switch at half strength, whole under the pointer, as
  the site's switch; while a pick on the plane is under way they go – they name no value it takes – and come back at
  the release. The letters and the switch sit at one inset from their corners. Over the field they are white, as every
  mark over it is (the image's dots, the histograms – the site's rule); where the field doesn't reach – a wheel's void
  corners – they take the ink of what shows through there, black or white.
- **One bar per channel.** Each bar sweeps its channel with the others held, so it shows
  what moving it would do. Drag the thumb, use the arrow keys (1% a press; Page Up/Down
  10%), or type the exact value in the field beside it.
- **Opacity.** The last slider is Figma's opacity bar, the color over the checker, with its
  value in percent (its cell ends in %). It sets a solid paint's opacity or a gradient stop's alpha, in whole
  percent as Figma keeps it. A stop bound to a variable sets the variable's alpha; a solid
  bound to one keeps the variable's alpha and sets the layer's paint opacity; a style-linked
  paint sets the style's.
- **Opens a space at once.** A space's plane is a shader that the GPU builds on its first
  draw: 0.5–1 s for a space it has never built (measured on an Apple M4 Max under ANGLE
  Metal; the OS caches it after), tens of ms once built. Once the current space is up, the
  featured spaces build in the background (one pixel each), and a space rested on in the menu
  – pointed at or arrowed to, and still there 150 ms later – goes first, compiled but not
  drawn (its first draw, where the driver builds its pipeline, waits for the pick), so the
  usual picks open in about 10–50 ms. Rows passing under a still pointer as the list scrolls
  build nothing: each once built there and then, and the scroll stalled (27 frames over 50 ms,
  the worst 3.4 s, under Metal; now none over 10 ms). Software GL skips the builds ahead.
- **Figma's layout and shapes.** The panel is laid out as Figma's own color picker, row for row
  level with it (measured at 2× beside its picker, 240 px wide). On top, Figma's tool row: 8 px
  under the window's top, 24 px – the space (its field and its menu, which opens over the plane,
  so the panel doesn't grow) and the settings mark – then 8 px and a divider the panel's full
  width, and the plane 16 px under it. Under the plane one slider – the channel the plane doesn't
  hold (H under OkLCh's L×C) – and the opacity's, the eyedropper before them, centred on the pair,
  as Figma's (its glyph fitted to Figma's 2× crop pixel for pixel: a bulb, a collar with its lobes
  and the line across at its foot, a tube narrowing to a round tip, a 1 px stroke). Where the
  eyedropper can't pick – no EyeDropper in the browser (Figma in Firefox or Safari), Dev Mode –
  it isn't shown and the sliders take the panel's width. A slider names its channel in a tooltip;
  the plane's axis letters, set as the panel's text, name theirs (their label says what a click
  does, "Chroma across. Click for Hue": it swaps that axis with the slider's channel); the
  wheel's switch says in a word what a click shows (Wheel, Square). Under the sliders, the value's cells and
  its copy button (below, **The value is the space's channels**). The panel's inset is Figma's, 16 px at the sides; its text Figma UI3's body,
  Inter 11 px at weight 450, 0.5% apart (strong text 550). Every row is 12 px from the next,
  Figma's rhythm (plane to slider, slider to slider, slider to values). Last, Figma's palette section:
  a select – In selection, or On this page (every layer's colors, the selection's first one
  current) – over the swatches, a 16 px swatch per color, 8 px apart, with Figma's 3 px corners
  (measured on its On this page at 2×: 9 columns at its 240 px); its divider the panel's full
  width, 16 px under the value, the select 12 px under it, the swatches 8 px under that. Its
  columns spread across the panel, the first and the last at its edges, as Figma's grid, whether
  the system's scrollbars overlay or take room: the palette's bar is drawn 10 px wide in the
  panel's right padding, at the window's edge, a 6 px thumb under the pointer, as Figma's
  (Chromium and Safari; elsewhere a thin one). The palette runs to the panel's bottom edge and is cropped there, as
  Figma's own: three rows and half a fourth show, the rest scrolls. Its bottom padding is the
  panel's 16 px, so a short palette ends on it and a long one scrolls by whole rows to its last;
  the current swatch, far down, is brought into sight with its row at the top – by scrolling the
  palette alone (`scrollIntoView` scrolled the panel's document too), again when a new width
  re-flows the rows – so no row shows cut at the top. The panel's height is its content's, the
  palette's own margin into the padding taken back, and nothing reaches past it: the swatches'
  screen-reader names are placed inside the list (placed against the body, the cropped rows'
  names once reached below the window, and the panel scrolled into blank space). With nothing
  selected, the hint takes the space's place beside the settings mark, on the line of its first
  row, and the scope keeps the panel's bottom padding. Fields, selects and icon buttons take Figma's 5 px
  corners (the space's menu and the settings, Figma's 13 px floating ones); a chevron is Figma's
  (fitted to its crop: a 4 × 2 px stroke of 1 px, 5 × 3 px of ink), its centre 12 px from its
  control's edge in every select; a select keeps its look under the
  pointer, as Figma's; an icon button (the settings, the eyedropper, the copy) is an ink glyph with a quiet
  fill under the pointer (`--figma-color-bg-hover`), the settings mark fitted to Figma's crop
  too. A focus ring is the keyboard's, as Figma's: shown from a Tab on, until the next press – a slider's knob
  pressed takes the focus for its arrow keys, with no ring. Whatever floats over the panel – the space menu, the settings, an open list, a tooltip –
  closes when the panel loses the focus (a press on Figma's own chrome). A select's menu opens over it, as Figma's: the
  chosen row centred on the control, its text over the control's text (the list the select
  draws, moved by that distance; held 4 px inside the window where it is too small). The
  copy list is the one that doesn't: it opens above the value's row, as wide, so the
  window never stretches under the palette to hold it, every row in sight (no scrollbar; a value
  past the width cut short).
- **Tooltips.** The site's (`web/js/tip.js`), dressed as Figma's: dark, under its element, a
  12 × 6 px tip at the element's middle; placed on whole pixels, the tip running a hairline into
  the bubble, so no seam shows between them. They are short – a channel's name, a control's –
  come after half a second's rest, Figma's wait, and go the moment the pointer leaves, with no
  fade – or the moment their element leaves the page under the pointer (a list redrawn: it
  reports no leaving, and its tip once stayed), or with the next move off it however the leaving went unreported. A
  focus shows a tip only when a key moved it there: a button clicked, a knob the panel focuses after a press (for its
  arrow keys; Chrome counts that focus as the keyboard's), once showed its tip at once and kept it as long as the focus
  – a slider's hung for good. The settings opening shut any tip. The wheel's switch says in a word what a click shows:
  Wheel, Square. The plane tells a resting pointer what it rests on, after the same wait, gone as it moves on, ⌥ held
  or not (it names the color ⌥ weighs, and stays as ⌥ is pressed): another color's dot, its color – the variable or
  style it comes from, else its CSS name (`tomato`), else the named palette's under its lens, else its value in the
  space's channels; a point of the field, the color a press there takes – under a named palette its token
  (`sky-600`), stepped its cell's; past the field, the color the point is (a press takes the field's nearest), or "Not
  a color" past the spectral locus. Past sRGB the tightest of CSS Color 4's predefined gamuts holding it follows
  after a comma (`, P3`, `, Rec.2020`, `, > Rec.2020`; `web/js/core.js` `tightGamut`), and a CSS or palette name only for a color
  inside sRGB – past it, its 8 bits are its clip's. None off the plane, nor mid-gesture.
  A swatch's lists the layers its color
  is on as Figma's own layer menus do (Select layer): a 24 px row each, the layer's icon (its
  kind: frame, text (a T with Figma's slight serifs), rectangle, image…; a vector its own outline, from its paths; `code.js` sends
  them), its name cut to one line, where on it at the right (fill 1, stroke 1, a stop); three,
  then "+N more"; the variable or style it comes from over them – the layers, no color named (the plane names
  colors). It is live: inset alike on every side, its rows' corners its own less
  that inset, concentric; the pointer may cross into it, and a layer pressed is selected in Figma and brought into
  view when it is out of it, the zoom kept ("+N more": the rest of them) – its color, the one on that layer, becoming
  the current one; in VS Code, its literal, the cursor at it.
  There is no gamut mark: the plane shows only the file's colors, so where a color stands needs
  no word. An error stays in sight under the picker. Screen readers hear the gamut and the notes
  – what the dots are, why the value is locked (live regions).
  The panel's face is Inter, Figma's own, bundled (its Latin subset, 48 KB, OFL: `src/fonts`),
  so it reads as Figma's offline, at Figma's weight (450) and with its grayscale smoothing (`-webkit-font-smoothing:
  antialiased`; macOS's default smoothing draws it heavier). Its small dropdowns are Figma's dark menus, their
  colors measured, the row under the pointer Figma's blue, #0d99ff (a macOS screenshot is tagged Display P3: read as
  sRGB, that blue reads 69, 151, 248, darker).
  Handles are Figma's knobs as measured on its picker, 14 px with a 2.5 px white
  ring around the color; bars are
  16 px pill tracks with the knob kept inside, each painted along the knob's travel so the
  knob sits on its own color.
- **Gestures.** A drag on the plane or a bar writes live once per frame
  (the plane repaints at full resolution throughout),
  hides the cursor, keeps going past its element (the plane and bars clamp at their edge),
  and ends exactly once with one commit and one undo step, however it ends: a release, a
  cancel, lost capture, the window losing focus, or (when the frame never saw the release)
  the next move without a button. ⇧ held through a plane's drag holds it to one channel, as
  Figma's: the one moved farther from where the press put the color (a dot taken up: the dot's color, not where the
  pointer first moved) moves, the other stays. A
  drag across the plane never repaints it; a re-read during a drag never moves the coordinates.
  Zoomed in (a pinch, ⌃ wheel), the plane shows where its view stands in the whole, as Figma's
  canvas does: a thin bar along its bottom and one along its right edge. A drag costs the same with a page of a thousand
  colors as with one (measured: a plane drag over 300 page colors and an image back to the
  harness's floor, from 55 to 19 ms a move): its live writes are not answered with reads (the
  page's colors were read and sent every frame, twice – the write's answer and its own
  nodechange); the release's read settles all. A swatch on hundreds of layers drags as freely: the plugin's main
  thread runs on Figma's own, so a backlog of writes there held back Figma's own picker too. It takes the writes one at
  a time, a live one still waiting giving way to the next for the same paints (no backlog behind the pointer), the
  release always kept; a live write paints the layers on screen, those off it follow once the drag rests (300 ms) or at
  the release; layers on one variable or style set it once a write; the relaunch button is set at the release alone.
  Figma's own picker dragged over the selection – a nodechange a frame – is followed a read at a time, 150 ms apart,
  the first change at once and the last always (a read a change, 200 layers' colors every frame, held it back). Each
  frame touches only what moved: the palette
  recolors the swatch that changed, the dots are redrawn only when what they show changes, the
  swatches are grouped in one pass (each filed under its Oklab cell), sizes are read once a
  layout changes them, a gesture's box once, and a write lands only where the DOM differs (a
  write of the same value is still a mutation). No `:has()` sits on the root: there it made
  every change of an attribute it reads restyle the whole panel. The plane's pixels are read
  once per paint, through a copy, and not while a gesture repaints it (its letters' ink waits
  for the release), so its own canvas stays on the GPU.
- **The value is the space's channels.** A space's view is its channels and nothing else: no text field, no format
  to view the color in. They sit in cells as Figma's split field shows RGB, 24 px – a cell a channel, its letter dim
  8 px before its number (as Figma's X and W before theirs), the opacity last in %, a hairline apart, the group
  answering as one (a grey hairline under the pointer, the selection color round it while a cell has the focus). A
  cell takes its number as Figma's fields do – typed (focused, its number is selected; Enter or leaving it takes it,
  Escape puts it back, an emptied cell gets its number back), stepped with ↑↓ by the power of ten under a hundredth of
  its channel's range (L 0.01, C 0.001, a hue 1, a byte 1; the opacity 1%), Shift ten of them, each a write – and a
  letter or the % scrubs its number, as Figma's do: a drag across moves it a step a pixel (ten while Shift is held),
  live, under Figma's ew-resize cursor, one write at the release, held to its range (a hue around; at an end, a move
  back moves it at once). A number left as shown keeps its channel whole (the coordinate, unrounded), so an edit of one
  number moves no other. A whole value pasted into any cell is taken whole: the channels' text (below), bare numbers
  with an opacity, a `#hex`, `rgb()`, `oklch()`, a named color – CSS written mapped into the file's gamut; too few
  numbers, or text that is no color, says so. A letter stands 4 px from its number up to Figma's 288 px – half
  Figma's 8 between X and its value, so the letters keep to narrower widths (OKLCH's at 288 px) – the gap growing with
  the panel to Figma's own 8 at 480 px. Too narrow for every letter and number (CMYK at
  240 px), the cells show the numbers alone, each named in its tooltip – the opacity keeps its % – and every number
  4 px nearer its cell's edge; a number still too wide for its cell sheds a decimal, up to two, rather than be cut –
  XYB's X, four decimals (a hundredth of its range, `web/js/core.js` `decOf`, the site's), shows −0.0018 as −0.002
  at 240 px – and ↑↓ then step at what it shows. The cells share the row equally, the opacity's as wide as a channel's
  (wider only where its 100 % wouldn't fit: CMYK's five at 240 px), its % 4 px from the cell's right (2 where narrow),
  as Figma's. A global cap of two would leave some channels a handful of levels
  (XYB's X spans 0.04, CCT's Duv 0.1), so only the cell that doesn't fit sheds.
- **Copies in any notation.** Beside the cells, a copy button – the copy mark and a chevron, as Figma's buttons that
  open a list, 24 px tall, its tooltip "Copy" –
  opens a plain list over the value's row, as wide, every row in sight – the color in every notation it is copied in,
  each row the value it gives: the channels as text, each letter and number at the atlas's decimals and the opacity
  after a slash in % – `C12 M24 Y36 K0`, the print shops' way of writing a CMYK build (a letter ending in a digit stands
  apart from its number: `I1 0.32`), which pasted into a cell reads back as the color – then OKLCH, OKLab, LCH, Lab,
  P3, HSL, HWB, RGB, Hex; under a named palette's lens (CSS names, xkcd, Tailwind…) the color's name first. A row
  picked is copied and Figma's own toast says so (VS Code: its status bar); the list keeps no row picked, so the same
  row again copies again. Where the frame has no clipboard at all, the value stays in sight in the error line. The
  values come from `src/notation.js`, the same code as the Code panel's, each at as few decimals as it can take:
  `lab()` and `lch()` at two, the fewest that bring every 8-bit sRGB color back to its own bytes (checked on every
  fifth level of each channel; at one decimal, some come back a level off); `oklch()` and `oklab()` at three (the hue
  to three significant digits) – at most 0.004 ΔEOK from the unrounded color, a fifth of a JND, checked over 4000
  colors; about one 8-bit color in five comes back a level off in a channel there, and five decimals would keep every
  byte; `hsl()` and `hwb()` at one, `color(display-p3)` at four, each exact to 8 bits. The alpha in whole percent, as
  Figma keeps it. The sRGB-only notations (RGB, HSL, HWB, Hex) gamut-map a wider P3 color into sRGB, their rows
  saying so beside the value (the value alone copied).
- **Shows a gamut, and picks only inside it.** The plane and the bars paint one gamut's colors
  and nothing past them (plain black; `web/js/gl.js` `uCut`: what would ghost voids): the file's
  by default (sRGB, or Display P3 in a P3 file, painted in Display P3), or another chosen in the
  settings – sRGB, P3, Rec.2020 – kept per profile. Every smaller standard gamut is a line on
  it: sRGB's in a P3 file, as Figma draws it; sRGB's and P3's, two lines, when Rec.2020 is shown.
  A line is one device pixel, at half strength, in one ink over the whole plane – white over a
  dark field, black over a light one, read off its pixels as its letters' and the image's dots'
  are (an ink by each pixel switched halfway along a line: noise), read off the whole field only – zoomed in, the
  lines keep the ink they had, where the part in view would turn it at every pan – and crossing a bar where its
  sweep leaves that gamut, in the ink of the color there. The kernel draws it per pixel
  (`uEdge`, a bit per gamut): each channel's distance past its face of the box, in encoded units
  over its screen-space gradient, is its distance in pixels, the face a straight line there; a
  pixel's distance to the gamut is to the polygon those faces bound – the foot on a face it is
  past, or a corner where two meet – so a line keeps its width at a slant and hugs a hue's sharp
  cusp instead of spurring past it; antialiased, at any size. It lies just past the edge, from
  half a pixel out, so only a pixel past the gamut takes any of it: a field lying on the
  surface draws none – HSV and HSL at full saturation, HWB with no white, on sRGB's surface
  throughout – nor a tick where a hue's sector turns there (centred on the edge, the line once
  laid rounding noise over such a slider and a lattice over such a plane, and ticks at the
  turns). Picks
  stay inside the shown gamut: a press or a drag past the field takes its nearest painted pixel
  (a breadth-first pass over the plane as painted, once per paint), a slider its nearest painted
  column, and a key that would step out of it doesn't. A color picked past
  the file's own gamut (P3 shown in an sRGB file) is written as its nearest color inside it; a
  value typed past it is taken, and mapped in the same way. Without WebGL2 the CPU fields ghost
  past the gamut instead.
- **Quantize.** The site's lens is a row of the settings, marked with its icon from the atlas's
  icon font (below) and named, as Figma's Style row shows its own. It is a customizable select
  (`appearance: base-select`, Chromium 135+): the page draws the list, so every option shows
  its icon in the font beside its name and the closed control shows the icon alone; the list
  is short enough to open inside the plugin's frame. An OS-drawn list ignores web fonts (on
  macOS it draws in the system font), so where the select isn't customizable the native one
  stays, its options showing the icons' look-alike Unicode symbols. Quantize: 10-step and 20-step write the color of
  their cell's centre, that many cells a channel, for palettes in even steps – the coordinates as the hand puts them
  until a release lands them on that centre, as a palette lens does (keys then move one cell); 16-bit and JND snap the color to RGB565 or to a just-noticeable
  OkLab grid; the palettes (web-safe, CSS names, xkcd, Tailwind, PICO-8, ANSI) draw their
  colors as cells and every pick writes the nearest one, a named palette's color heading the
  copy list with its name. A palette is not continuous underneath: a gesture's release lands the channels it moved
  on the middle of their run, as the site's does – the stretch along each, the others held, where the lens gives the
  color picked, ending where the field does – so the coordinates sit under the color, not wherever in its cell the
  press fell (keys still step a hundredth). Under any lens the plane draws no gamut line: its cells are whole colors,
  in a gamut or out, the boundary on their edges where the color jumps, and a line read off a pixel's rate there came
  out as broken white seams between cells.
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
- **Eyedropper.** A button before the sliders picks any pixel on screen into the current paint
  through the browser's EyeDropper API (and the active palette lens, if any). It is shown only
  where it can pick: not without the API, not in Dev Mode; greyed while the color can't be
  edited; where the frame refuses it, the panel says so.
- **⌥ weighs another color.** Held ⌥ (Alt), the pointer on another color – a point of the plane,
  a dot, a point of a bar, a swatch – the panel weighs it against the current color and draws it
  as Figma's ⌥ measures between two points (`web/js/ruler.js`, shared with the site), in Figma's
  measuring red (#f24822): from the current color's mark a solid line along each of the plane's
  two channels to the point, and from the point a dashed one back to each line's end (8 px on, 4
  off, as Figma's) – no knob there, the lines meet at it; on a wheel, around at the mark's radius
  and out along its angle. Each solid line carries its step in a pill 8 px off it, as Figma sets
  them – the across one outside the box the lines draw, the up one inside it (`C −0.048`,
  `L −0.28`, a hue the shorter way); a pill that would leave the field turns to its line's other
  side, and two that would meet part (the up one turns, or the across one steps off its line),
  so a measure of a few pixels stays legible. In the plane's top corner away from it – the other
  one where a step stands there (`web/js/measure.js`, `web/js/core.js` `tightGamut`): their WCAG
  2.2 contrast ratio with the level it reaches (3:1 AA large, 4.5:1 AA, 7:1 AAA; never rounded up
  into one) – none for a point off the spectral locus, no color at all – and the steps of the
  channels off the plane. A point past the field is weighed too; where a color stands (P3,
  Rec.2020, no color) the plane's tooltip says. While ⌥ lasts no element's own tooltip comes over
  it – the plane's, naming the color weighed, stays. Its value shows in the cells
  where the current one's stands. Held through a drag, the same between the color the press left
  (a dot taken up: its own color) and the color as it is: how far it has come – from the same origin ⇧ holds a
  channel to, so a channel ⇧ holds shows no step. The pointer's own ⌥ is read on every move, since
  Figma's frame hears no key while the canvas has the focus; ⌥ let go, the pointer gone or a
  press ends it. Let go while the panel has the keys (once it has been clicked), it goes at once;
  while Figma's canvas has them, no key reaches the panel, and it goes with the pointer's next
  move.
- **⌘Z.** Figma's keys never reach a plugin's frame, so ⌘Z (Ctrl+Z) in the panel asks the
  main thread for Figma's undo (`figma.triggerUndo`, plugin API
  [Update 21](https://developers.figma.com/docs/plugins/updates/2021/03/22/version-1-update-21/)):
  the last step goes, and the panel shows the color it returns to. In a cell being typed in,
  ⌘Z undoes the typing instead. Redo (⇧⌘Z) isn't offered: the API has no redo.
- **Merging swatches.** A swatch dragged onto another merges the two into the one carried: the
  swatch under it takes its color and opacity, in one undo step, and the two become one swatch.
  The carried swatch itself follows the pointer, held where it was taken; its place stays empty.
  A carried color the file can't hold (VS Code: an `oklch()` past sRGB dropped on a `#hex`) is
  mapped into the file's gamut, and the carried literals take the mapped color too. Every write
  is mapped so – an opacity edit of such a color as well – since a host refuses a color past its
  gamut.
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
  every distinct color is a white dot on the plane, as on the dossier, as opaque as the pixels
  sharing it, on its own full-resolution layer, no outline (over a light field they fade; the held channel moved darker shows them); their coordinates are computed in slices
  across frames, so the picker never waits on them. Each channel's bar shows the image's
  histogram of that channel too (the site's strip recipe: weighted by pixel count, scaled to
  the 97th percentile), white as the dots are, over the bar's field, or over a plain fill when the image is
  selected alone. The plane and its dots render at up to 1024 px, so a widened panel stays
  sharp. A plane drag snaps to its pixels as to the other colors' dots (above). With only an image selected, its pixel
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
  nothing, and a drag from it moves it, in one undo step. The dots follow edits at once. Screen
  readers hear which kinds of dots are showing ("Dots are other
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
  height can't be set apart: it is the content's, and the plane is square. Neither outgrows the canvas the window
  floats over, on screen (`figma.viewport.bounds` at its zoom, less Figma's head on the window and a margin): Figma
  moves a taller window up to keep its foot in view, its head – the close – past the top, out of reach; the panel
  scrolls in what it has instead. It is measured
  from the content itself (the lowest laid-out part), not the document or the body, so a
  host stylesheet holding those at the window's height can't keep a shrinking panel tall. The grip is a gesture like the
  picker's: a release outside the panel that Figma's frame never reports ends it at the
  next move. Pressed while a menu is open (the space menu, a list, the settings), it shuts the menu and the same drag
  resizes.
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
- **Settings.** A sliders mark at the top line's right (Figma's own, from its Advanced stroke
  settings: two 11 px rails, 1 px, the left knob low and the right high, in a 24 px icon button
  with a tooltip) opens Figma's settings panel under it
  (as its stroke settings, measured at 2×: 13 px corners, a 40 px head with its name and a close,
  label | control rows; as wide as its rows need); a press elsewhere, Escape or the close shuts
  it. Its rows: Gamut, a segmented control (sRGB | P3 | Rec.2020), Quantize (its icon, then
  its name), and Snap to colors, a checkbox (a plane drag meeting another color's dot or an image's pixel; on at first, kept). Then Hints,
  the keys the panel answers, a line each, as Figma's menus list a shortcut – what it does, its keys at the right in
  the quiet ink: ⇧ drag along one channel, ⌘ drag finely with no snap, ⌥ measure another color, ⌃ scroll zoom the
  plane, a double click the whole plane, ⇧ ↑↓ a value ×10; on Windows and Linux the keys by name (Shift, Ctrl, Alt,
  Ctrl+Scroll). Under them one line: the mark and the name (the site) at the left, "by colorjs"
  (the code) and a heart (support) at the right. Its
  links open in the browser through `figma.openExternal`, and the main thread opens only
  those three pages.
- **A steady gamut status.** Screen readers hear where the coordinate is: "In sRGB.", "Outside
  sRGB, mapped in." (a value typed past the gamut) or the palette it snaps to. It reads the
  coordinate itself, not the last write, so it never flickers or changes height as a drag
  crosses the gamut.
- **Tooltips.** Figma's frame shows no native `title`, so the plugin uses the atlas's
  tooltip (`web/js/tip.js`) dressed as Figma's (measured at 2×): its menus' dark fill and white
  11 px text, 4 × 8 px of padding, 6 px corners, under its element with a 12 × 6 px tip
  pointing at the element's middle (a page asks for the side with `--tip-side`, and for its
  wait with `--tip-delay`, half a second here; `tip.js` sets the side it took and the tip's
  place). It stays secondary: shown while its element is hovered, and for its linger (`--tip-linger`,
  500 ms) once the pointer leaves – the pointer may cross into it to read or copy it – gone when
  the pointer has left both, on Escape and when Figma takes focus; `tip.js` can also show a list
  of rows (`data-tip-rows`, a row's icon a name in its set or a path of its own), live ones whose
  rows are buttons (`data-tip-live`, a pressed row told to its element as a `tiprow` event), and
  a tip at a point (`tipAt`);
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

The UI is about 830 KB and the main thread about 150 KB (the build prints the sizes); most of it is the 205 spaces'
shader chunks and the 12 languages' tables. Figma hands the manifest's `ui` file to `code.js` as a string
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
  highlight), their rows 8 px in from the list's top, bottom and sides alike; the copy button's tooltip "Copy" after
  the wait
- the plane's controls: a click on C making C×L into H×L and back, the wheel/square switch
  saved per pair and its round trip leaving the letters' and the switch's ink as they were (white over a square
  plane's field, the panel's ink over a wheel's void corners), an image's dots and histograms white, the disc's centre showing its color on screen; the lens controls keeping
  their width on hover and opening from the chevron, a lens's tooltip on hover and none over
  its open list; the corner grip and its arrow keys setting the width, the resize cursor kept,
  a lost release ending the resize, a widen then a narrow bringing the height back under a
  host stylesheet that holds the document at the window's height
- one menu at a time: the settings closing the space menu and the space menu closing them; a held
  channel's drag repainting the plane at full resolution, the dots' layer too
- the lens list, in the settings: open, each option's icon in the icon font (web-safe's), the
  closed control showing its icon and name, a click on an option taking it and closing the list
- the icon font: accepted by the browser's font sanitizer, every glyph tracing its SVG (IoU
  at 64 px), loaded in the panel
- the tooltip: not there at 300 ms (Figma's half-second wait), there after it, gone at once with the pointer
  (no fade); it stays while hovered, comes back on the next hover, swaps to the next element; a
  press dismisses it; focus after a press shows none, keyboard focus does; a slider's names its
  channel, the last its opacity
- the panel losing the focus: the settings, the space menu and an open list closed
- the plane's view: a ⌃ wheel zooming about the pointer (the middle then picks the window's
  middle, checked against the zoom's arithmetic), the marker hiding when zoomed away from it,
  a double click showing the whole, another pair starting whole; zoomed, the scrollbars showing
  the window's span of each channel, gone when whole; a ⌘-drag moving the pick a tenth of the
  pointer's move; a ⇧-drag held to one channel (across: L held; farther up: C held)
- the value: the space's channels in cells and no text field; the copy button 8 px from them, its mark and a
  chevron; a row picked copying its value (hex, again, the channels' text), Figma's toast told, no row kept picked; the
  cells a grey hairline under the pointer and ringed in the selection color with the focus, the button no tab stop; a
  select unchanged under the pointer; the list above the value's row and as wide, every row in sight, a long value
  cut short, the rows lined up, the channels' text first; a row clicked copying it, no focus left on the button; a
  palette name heading the list under a named lens, copied; P3 red's hex mapped into sRGB, its row saying so; C typed
  and taken, its number selected, ↑↑ ⇧↓ stepping chroma by 0.001 and 0.01 (a write each), a #336699 pasted into a cell
  taken, the channels' text pasted back writing nothing, bare numbers read as the space's own with an opacity in
  percent, too few numbers and text that is no color said so; a fresh panel in cells, OKLCH's too; Dev Mode's cells
  read-only; lab() and lch() at two decimals bringing every 8-bit sRGB color back to its bytes (some not at one)
- the palette, with 48 colors on the page at Figma's 240 px, the system's scrollbars taking room
  (the checks launch Chromium with them; Playwright hides them by default, which once let the
  palette lose a column to one unseen): Figma's 16 px swatches on its 24 px pitch, 9 columns,
  from the value field's left edge to the sliders' right edge, the bar in the padding;
  running to the window's bottom edge, cropped there with half its fourth row (8 px) shown; the
  panel unscrollable (nothing past the window); the current swatch (the last) shown by scrolling
  the palette alone, its rows whole at the top; the bar's thumb unseen at rest, under the
  pointer at the window's edge (its pixels); a drag on the plane keeping every swatch and dot
  element as it was (none rebuilt)
- menus over their control: the scope's chosen row centred on its select, its text over the
  select's, opened by a press or from the keyboard
- the swatches' grouping (one pass over an Oklab grid) against a search of every swatch in order,
  on 200 paints – each color again, a step well under the swatch's width, one near it, one past
  it, a translucent one apart: the same swatches, the same paints in each
- a swatch's tooltip, of five layers: three as Figma's 24 px rows – the text layer's icon a T,
  the vector's its own outline, a long name cut to one line – then "+2 more", no hex; on whole
  pixels, its tip running a hairline into it; the plane's dots with none; live: the pointer
  crossing into it keeps it, a layer pressed selected in Figma with the view kept (it is in
  view), "+2 more" selecting the other two and bringing the view to them (one far off); gone in
  a breath once the pointer leaves; a vector's outline as its icon only while short (a long one,
  Figma's vector mark)
- ⌥ over another color (a dot, its swatch, a point of the plane): a solid line along each
  channel from the current color's mark to it and a dashed one back from it to each line's end,
  as Figma's (the solid whole, the dashed 8 on 4 off), each solid line's step (C across, L up)
  at its middle, C under its line and L beside; no knob there; the readout in the top corner –
  colorjs.io's contrastWCAG21 with its level and the hue's step, no word for sRGB; Figma's
  measuring red on lines and pills; no element's tooltip over it however long the pointer rests;
  its value in the value field; a few pixels from the mark every way round, and at the field's
  edges, the pills apart, inside the field and off the readout; the steps set as Figma's, across
  outside the box and up inside; past the field a color past sRGB in P3 its contrast, no word for its gamut, and one
  off the locus no contrast, no sign (its Y below zero, checked by the library's
  own conversion); nothing over the current color's own swatch or the opacity slider; a
  slider's knob the current color itself (1.00:1, the readout alone); ⌥ let go, all gone and the
  value back; the key pressed and let go with the pointer resting; held through a drag, the
  lines from where the color was at the press, its steps and contrast since; on a wheel (H × C),
  an arc at the mark's radius and a ray along its angle, solid, their dashed twins closing at
  the dot
- a plane drag 2.5 px off another color's dot: the color on it, its L and C, the hue held; 5 px off, its own place;
  with ⌘ held, unsnapped; Snap to colors unchecked in the settings, 2.5 px off, its own place, the choice stored, and a
  panel opened with it off showing it off; mid-drag the axes' letters and switch hidden, back at the release; a dot
  taken up with ⇧ and dragged across, L held at the dot's own L and ⌥ showing C's step alone; the settings' hints with a
  Mac's keys, and on Windows by name (Ctrl+Scroll, Shift+↑↓)
- CMYK, a space with no CSS: a cell a channel, named and lettered, the opacity last in %, each
  number at the atlas's decimals and in sight; its row in the format list `C… M… Y… K… / 80%`; a
  cell's number selected on focus; M typed (the fill's magenta 50), ↑ and ⇧↑ (51, 61), Escape;
  the opacity cell (50 → 50%); `C10 M20 Y30 K5` pasted into one cell, every channel taken; a hex
  pasted into one; the same number retyped or the cell emptied writing nothing; M's letter dragged 12 px (+12, the
  ew-resize cursor), with Shift (ten a pixel, held at 100), 3 px back from the end (97 at once), HSV's H from 355 past
  360 (5), the % dragged 20 px
  (80%); the letter 4 px from its number at 240 and 288 px, 6 at 384, 8 at 480 and 560; a knob pressed and arrowed with no ring, its ring from Tab; OKLCH in cells
  too, its CSS a row of the list; Ohta's `I1 0.32` spaced and read back as it reads; at 240 px the numbers alone, each
  cell named in its tooltip, the opacity's % kept; the cells equal at 240 and 480 px, the % 4 px from the right;
  XYB's X at four decimals at 480 px, three at 240 (none cut), its number retyped as shown writing nothing, ↑ a
  thousandth from it
- the palette's tooltips the layers alone, no color named; a dot rested on: nothing at a quarter second, its color by
  name (`tomato`) after the wait; gone as the pointer moves on, and resting on the field, the color there in the
  space's channels; ⌥ pressed there, the tooltip kept and the measurement drawn; ⌥ held, gone as the pointer moves and
  back where it rests; past an sRGB file's field C 0.26 at L 0.5 its value `, P3` (out of sRGB, in Display P3 by the
  library's conversions), C 0.38 at L 0.25 "Not a color" (its Y below zero); none off the plane; a layer pressed in
  a swatch's tip making that layer's color the current one
- under the Tailwind lens: the plane's tooltip naming the token under the pointer after the wait, ⌥ held too, ⌥'s
  readout keeping its own (the contrast, no token); the release on that token, L the middle of its run
- stepped (10): mid-drag the coordinates as the hand puts them and the color its cell centre's, the release on the
  centre; in a P3 file no gamut line over the cells
- zoomed into a P3 file's plane at its light corner: the lines keep the whole field's ink
- a canvas 400 px tall on screen: the window at most 352 px
- tooltips: none from a press's focus (the settings mark clicked; a slider's knob pressed, which takes the focus –
  none at the press nor after, the pointer gone), its own from the keyboard's (Tab to the mark); none left behind the
  settings once they open; one whose element is taken out under the pointer gone with the next move; the wheel's
  switch "Wheel" on a square, "Square" on a wheel
- the space menu: a row its name (`CIELAB`) and its shape's mark, the site's (HWB's polar, as HSL's); the field's
  chevron shutting it and opening it again; at 240 px as wide as the row, at 480 as the field, every row its mark, no
  family beside a name
- the grip pressed with the space menu, its family list, the settings or their Quantize list open: the press the
  grip's (the space menu once swallowed it, so the drag took a second press), the same drag resizing, the menu shut
- the space menu scrolled under a resting pointer: no frame over 250 ms (each row passing once
  compiled its space there and then: 4–5 s stalls under a software GL, up to 3.4 s under Metal)
- a drag's live writes not answered with reads, its release answered with one; a re-read that
  lands mid-drag leaving the coordinates where the pointer put them
- twelve live writes and a release sent at once over seven layers (one off screen, three on one variable): on screen
  the first and the release written, off screen the release alone; the variable set once a write; the relaunch button
  once a layer, at the release; a live write resting: the layer off screen written after 300 ms, not at once; twenty
  paint changes from Figma's picker: at most three reads, the last with the last change
- empty: the hint beside the settings mark, on its first line; the scope 16 px over the bottom
- Figma parity (`scripts/figma-ref`: 2× crops of Figma's own UI, its light theme, 2026-10): the
  eyedropper and the settings mark drawn as Figma's – compared pixel for
  pixel at the best ±2 px shift: each glyph's ink box within 2 px of the reference's, its weight
  within 0.8–1.25 of it, no ink pixel farther than 1.5 px from the other's, and under 30% of the
  darkness differing (the eyedropper before its fit stood 2.8 px off, 64%) – shot in a browser
  that keeps the panel's frame in its page's process (an isolated frame is painted at 1× and
  scaled up); Figma's measures: the field and the select 24 px tall, the field filled #f5f5f5,
  the select outlined #e6e6e6, 5 px corners, 11 px text at weight 450, a 16 px inset at the
  sides; and Figma's rhythm beside its picker at 240 px: tool row 8–32, divider 40, plane 57,
  sliders 277 and 305, value 333, the palette's divider 373, its select 385, swatches 417. When
  Figma redraws its UI, these fail: crop the references again, then follow them
- languages: German, Brazilian Portuguese and Simplified Chinese browsers get their tables (the
  plugin's words and the site's), Traditional Chinese and Dutch get English, and an English
  browser with Russian as a second language stays English
- the settings: opened by their mark (Gamut and Quantize rows, as wide as they need, 13 px corners, every gamut
  fitting its segment), their links opening the sponsor page and the code, nothing else opened
  whatever the UI sends, Escape and the close shutting them
- the gamut on the fields: no plane pixel ghosted; an sRGB file's plane opaque exactly where the
  library's conversion is inside sRGB (2 px from the edge, above L 0.05), its hue slider alike
  (1° from the edge), and no line; a P3 file's plane opaque exactly inside P3, every pixel of
  its line within 3 px of sRGB's edge (across, up or diagonally), white over its dark colors and
  black over its light ones, and no line once the profile
  turns sRGB; Rec.2020 shown in an sRGB file: its colors (above L 0.15) and two lines, sRGB's and
  P3's, nothing else; P3 shown by default in a P3 file; a press past the field picking inside
  it, the marker on the field (a wheel's corner too); keys stopping at its edge; slider presses
  taking its nearest hue;
  the status naming a palette lens
- ⌘Z: Figma's undo once, the fill and the values back to the color before the edit; in the
  value being typed in, the text's own undo; merging: the swatch under the drop takes the carried
  color, the carried swatch under the pointer where it was taken, its own size, its place empty; a hue with the tone (H×L) a square by default, the switch making it a disc
- the layout: the top line (space, settings), no value line and no gamut mark, the eyedropper
  before the sliders and centred on them, the value's cells and copy button under them, the
  cells 24 px and filled, the selection color on focus, an axis letter at half strength and
  whole when hovered, in the field's face and size, its tooltip its channel's name, its label
  what a click does, the wheel's switch's a word; the selects' chevrons one inset from their edge, 5 px corners; the
  palette's full-width divider at 16 / 12 / 8 px; the settings mark filled under the pointer,
  with its tooltip; the tooltip under its element, its tip at the middle
- no eyedropper in Dev Mode, nor without the browser's EyeDropper – the sliders then the panel's
  full width
- the status line: one line in and out of the gamut, and a drag across the gamut resizing
  nothing; the image's row shaded as the current row
- a gradient: its stops listed, an edit writing one stop with its alpha and position kept;
  the relaunch button on an edited layer; the notes under the picker
- an image (a PNG painted by the mock): its pixels as dots, one of its pixels standing in
  as its color, no opacity row, exploring without a write; a plane drag 2.5 px off a pixel's dot on it, its L and C, the
  hue held, 5 px off its own place; the dots' legend naming each kind
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
  and calls `document.execCommand('copy')`. If that also fails, the value stays in sight in
  the error line, to be selected by hand.
- **Variables and styles.** Edited through `Variable.setValueForMode` and
  `PaintStyle.paints`, checked only against the mock. Unverified in Figma: whether a bound
  paint's `color` reflects the variable right after the edit (the plugin reads the
  variable's own value instead), and how variables from extended collections behave.
- **Eyedropper.** Figma desktop runs Electron 43.7.9; in that Electron a sandboxed,
  null-origin frame like the plugin's has `EyeDropper` and is a secure context (checked
  2026-10). Whether a pick then works inside Figma itself is unverified. If it refuses, the
  panel says so.
- **⌘Z.** `figma.triggerUndo` is checked only against the mock's history.
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

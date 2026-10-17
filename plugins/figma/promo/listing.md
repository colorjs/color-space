# Figma Community listing: Color Space

The text and media for the plugin's Community page. Media are made from the plugin itself by `promo.js`
(`node plugins/figma/promo/promo.js`), into `out/`.

## Fields

**Name:** Color Space

**Tagline:** Advanced color picker: OKLCH, HCT, RYB, CMYK, Munsell and 200 more color spaces.

**Category:** Design tools

**Tags:** color, color picker, oklch, hct, color space, display p3, gradient, tailwind, variables, design tokens, palette

**Support contact:** https://github.com/colorjs/color-space/issues

**Network access:** No access (the manifest's `networkAccess` is `none`)

**Icon:** `out/icon.png` (128 × 128): the project's mark, the spectral locus filled with its own chromaticities, on a frosted light tile its colors glow through (`out/icon-512.png` is the same at 512, to review)

**Thumbnail:** `out/cover.png` (1920 × 1080)

**Carousel** (up to nine, in this order): one heavy feature each; the rest is the outro's list

1. `out/video-30.mp4`: the tour cut to 30 s (1920 × 1080, H.264): on OkHSL's hue wheel a pick carried round it, a
   selection's colors on it (one dragged, snapping onto another), a gradient's stop turned, a photo's pixels; the wheel
   turned into its square, zoomed into, a fine ⌘ pick, the whole again; OKLCH, the tooltip naming a color past sRGB
   and the gamut it needs, and ⌥ measuring another color – its steps, contrast and name. The whole tour, `out/video.mp4` (with the
   plane's zoom, axes and wheel, the window resized, the gamut tooltips, ⌥'s measurement, ⇧ and ⌘, and merging
   swatches), is for the site or a video page
2. `out/1-selection.png`: Every color of a selection (a color dragged, snapping onto another's)
3. `out/2-gradient.png`: Edit gradients on the plane
4. `out/3-image.png`: Plot image pixels
5. `out/4-spaces.png`: 205 color spaces
6. `out/5-tailwind.png`: Snap to Tailwind colors (the token named under the pointer)
7. `out/6-gamut.png`: sRGB, Display P3, Rec.2020 (the tooltip: the color there, `, Rec.2020`)
8. `out/7-measure.png`: Measure, hold an axis, pick finely (⌥'s redlines and contrast)
9. `out/8-palette.png`: Merge colors, find their layers (a merged swatch's two layers)

`out/9-outro.png` (Also – the rest, in four lines, and Free · Offline · Open) is spare: the carousel holds nine.

## Description

Pick colors in OKLCH, HCT, RYB, CMYK, Munsell, CAM16 or any of 205 color spaces, in seven families, each with its own
plane and sliders.

**What it does**

- Select a group, a frame or several layers to see all their fills and strokes on one plane. Click a color to edit it;
  drag it near another and it snaps onto it (Snap to colors, in the settings, turns that off).
- Edit a gradient on the plane: drag a stop and the whole blend updates.
- Select an image to see where its pixels fall in any color space, on the plane and as histograms on the sliders.
- Snap to Tailwind, CSS named colors, xkcd, web-safe, PICO-8 or ANSI: the token is named under the pointer.
- See which colors fit sRGB, Display P3 or Rec.2020: rest the pointer on the plane and it names the color there and the
  gamut it needs, or says it is no color at all. Display P3 files are edited in P3.
- Hold ⌥ over another color to measure it against yours: its steps on each channel, as Figma's redlines, and the WCAG
  contrast. Hold ⇧ to keep one channel while you drag, ⌘ to move a tenth as far.
- Choose any two channels for the plane, as a square or a hue wheel; pinch to zoom; resize the window by its corner.
- Drop a swatch onto another to make them one color; point at a swatch to list its layers and click one to select it.

**Also**

- A color bound to a variable or a style is edited there, so every layer that uses it follows.
- Copy the color as OKLCH, OKLab, LCH, Lab, P3, HSL, HWB, RGB, hex or its channels as text.
- In Dev Mode, the Code panel shows CSS in your format, with a frame's colors as custom properties.
- Works offline, no account. In 12 languages, matching your browser's.

Free and open source (CC0). By dy.

Library and source: https://github.com/colorjs/color-space
The atlas of all 205 spaces: https://color-space.io
Support the project: https://github.com/sponsors/dy

## Notes for publishing

- The media show the real plugin panel (`ui.html`, `code.js`) on a mock Figma host, beside a small design drawn from
  the mock document's paints, so an edit in the panel shows on the design. The stage looks like a design canvas (its
  grey, a frame's name, blue hover and selection boxes) but draws none of Figma's interface; it is not Figma's canvas.
  Real screen recordings from Figma can replace them. The same shot list works there.
- Figma's own pages give no limits for the carousel video. A forum answer gives MP4 or WebM, up to 30 s, up to 104 MB;
  `video-30.mp4` fits all three (its take is played a little faster to fit, at most 25%).
- The video zooms in on the panel and the design as it works (a camera over the stage) and switches through OKLCH, RYB,
  CMYK, Munsell, HCT, OKLab and HSL planes; the document is a Display P3 file. Its keys (⇧, ⌘, ⌥, the pinch) show as
  a keycap beside the pointer. The eyedropper isn't shown: the headless browser that films it has no EyeDropper API.
- Donations: Figma's help pages don't address donation links. The plugin's About card links to GitHub Sponsors, and
  the description does too. The plugin is free and isn't listed as paid.

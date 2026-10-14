# Figma Community listing: Color Space

The text and media for the plugin's Community page. Media are made from the plugin itself by `promo.js`
(`node plugins/figma/promo/promo.js`), into `out/`.

## Fields

**Name:** Color Space

**Tagline:** Advanced color picker: OKLCH, HCT, RYB, CMYK, Munsell and 160+ more color spaces.

**Category:** Design tools

**Tags:** color, color picker, oklch, hct, color space, display p3, gradient, tailwind, variables, design tokens, palette

**Support contact:** https://github.com/colorjs/color-space/issues

**Network access:** No access (the manifest's `networkAccess` is `none`)

**Icon:** `out/icon.png` (128 × 128): the project's mark, the spectral locus filled with its own chromaticities, on a frosted light tile its colors glow through (`out/icon-512.png` is the same at 512, to review)

**Thumbnail:** `out/cover.png` (1920 × 1080)

**Carousel** (up to nine, in this order): one heavy feature each; the rest is the outro's list

1. `out/video-30.mp4`: the tour cut to 30 s (1920 × 1080, H.264). The whole tour, `out/video.mp4` (about 1 min, with gamut limits and the plane views), is for the site or a video page
2. `out/2-spaces.png`: 168 color spaces
3. `out/3-selection.png`: All the colors of a selection
4. `out/4-gradient.png`: Edit gradients on the plane
5. `out/5-image.png`: Plot image pixels
6. `out/6-tailwind.png`: Snap to Tailwind colors
7. `out/7-gamut.png`: Gamut limits: sRGB, Display P3, Rec.2020
8. `out/8-views.png`: Any two channels, square or wheel
9. `out/9-outro.png`: Also – the rest, in three lines, and Free · Offline · Open

`out/1-hook.png` is the cover's scene after a drag; it is spare.

## Description

Pick colors in OKLCH, HCT, RYB, CMYK, Munsell, CAM16 or any of 168 color spaces, each with its own plane and sliders.

**What it does**

- Select a group, a frame or several layers to see all their colors on one plane. Click a color to edit it.
- Edit a gradient on the plane: drag a stop and the whole blend updates.
- Select an image to see where its pixels fall in any color space, on the plane and as histograms on the sliders.
- Snap to Tailwind, CSS named colors, xkcd, web-safe, PICO-8 or ANSI, and copy the color's name.
- See which colors fit sRGB, Display P3 or Rec.2020. Display P3 files are edited in P3.
- Choose any two channels for the plane, as a square or a hue wheel. Pinch to zoom, hold ⌘ to drag finely.

**Also**

- A color bound to a variable or a style is edited there, so every layer that uses it follows.
- Copy as OKLCH, OKLab, LCH, Lab, P3, HSL, HWB, RGB or hex.
- In Dev Mode, the Code panel shows CSS in your format, with a frame's colors as custom properties.
- Works offline, no account. In 12 languages, matching your browser's.

Free and open source (CC0). By dy.

Library and source: https://github.com/colorjs/color-space
The atlas of all 168 spaces: https://color-space.io
Support the project: https://github.com/sponsors/dy

## Notes for publishing

- The media show the real plugin panel (`ui.html`, `code.js`) on a mock Figma host, beside a small design drawn from
  the mock document's paints, so an edit in the panel shows on the design. The stage looks like a design canvas (its
  grey, a frame's name, blue hover and selection boxes) but draws none of Figma's interface; it is not Figma's canvas.
  Real screen recordings from Figma can replace them. The same shot list works there.
- Figma's own pages give no limits for the carousel video. A forum answer gives MP4 or WebM, up to 30 s, up to 104 MB;
  `video-30.mp4` fits all three (its take is played a few percent faster to fit, at most 20%).
- The video zooms in on the panel and the design as it works (a camera over the stage) and switches through OKLCH, RYB,
  CMYK, Munsell, HCT, OKLab and HSL planes; the document is a Display P3 file. The eyedropper isn't shown: the headless browser that films it has no EyeDropper API.
- Donations: Figma's help pages don't address donation links. The plugin's About card links to GitHub Sponsors, and
  the description does too. The plugin is free and isn't listed as paid.

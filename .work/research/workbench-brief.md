# Workbench brief — three landing directions for color-space.io

## The owner's verdicts (2026-10-02)
- KEEP from alt.html: the 7 families (Display & web 19 · RGB remixes 9 · Perceptual 48 ·
  Colorimetry & research 22 · Video & broadcast 20 · Film & camera 37 · Color order & surface 7);
  the 10 task tags (Picking · Palettes · Editing · Compositing · Grading · Delivery · Print & surface ·
  Difference · Measurement · Research); the filter stripe (Availability · Channels · Range · Geometry ·
  Signal · Encoding · White point · Status); the nav icons; the view-mode controls (size A–A,
  swatch style smooth/stepped/dots, layout grid/rows/list); alt's slider cards.
- REJECT from alt.html: the macOS Font Book look (library sidebar + segmented toolbar + uniform tile
  grid); a uniform grid with no hierarchy; duplicated navigation (families listed in a sidebar AND
  repeated as content headings).
- KEEP from the current page: section titles ARE the navigation (one element, no duplicate list).
- KEEP from third.html (quiet/studio): hierarchy — 1–3 featured spaces per family large (3 columns,
  description + year), the rest as compact sliders; nav icons; the full filter bar; grid view;
  details in a SIDE PANEL on wide screens (modal on phones).
- First impression is never gray: the current color starts its ambient OKLCH hue walk (as index.html
  does: L≈constant + small wobble, chroma fades in from 0 over ~2.2 s, 45 s period, stops on any
  authored input, off under prefers-reduced-motion).

## Findings every direction must carry (from the marketing analysis)
- Head query is "color space" (generic, learners) → the first screen answers *what a color space
  is* in one understated sentence; no number-led selling (owner's stance).
- Start-here tour (web/js/tour.js), creator LUT flow camera → target → editor → download + steps
  (web/js/editors.js + lut.js), Python/OpenCV snippets (web/js/python.js), CVD "Vision" lens
  (web/js/cvd.js), Embed (iframe of /<space>?embed), Cite (CITATION.cff → BibTeX/APA),
  Agents/MCP install (claude mcp add · Claude Desktop · Cursor · VS Code), language switcher
  affordance "EN ▾" (text-dropdown idiom, others listed as planned), analytics hooks via track().

# Test-image provenance

The five generated diagnostics are authored by this project and dedicated under the repository's CC0 license:

- **Signal chart** — exact full-code additive bars, encoded-code and linear-light gray ramps, a continuous hue sweep, and near-black/near-white code steps.
- **Simultaneous contrast** — four byte-identical `rgb(128 128 128)` patches on different chromatic/lightness surrounds. The motif demonstrates context-dependent perception without copying Adelson's checker-shadow artwork: https://persci.mit.edu/gallery/checkershadow
- **Video calibration** — an sRGB diagnostic rendition of 75% studio-level bars (`16…180`), castellations, PLUGE (`7 / 16 / 26`), and two complementary multibursts. References: https://en.wikipedia.org/wiki/SMPTE_color_bars and https://en.wikipedia.org/wiki/Multiburst
- **Colormap paths** — labeled, exact 256-sample gray, viridis, plasma, inferno, magma, Smooth Cool Warm, and Turbo strips. Compact white labels sit only over each path's dark edge, keeping the gradients and their histogram weight dominant. The Matplotlib-family and Smooth Cool Warm byte tables come from Kenneth Moreland's CC0/BSD-compatible reference collection; Turbo uses Google's published polynomial. Sources: https://www.kennethmoreland.com/color-advice/ and https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
- **Emissive star** — a fixed warm linear-sRGB emitter rendered above display range, then clipped and sRGB-encoded. Its radius exposes the resulting white core → yellow → orange → red halo, with the same progression along deterministic diffraction spikes. It is an SDR clipping stimulus, not an HDR measurement.

Color rendition target — photograph by ColorScientist, released to the public domain.
Source: https://commons.wikimedia.org/wiki/File:ColorChecker100423.jpg

The Great Wave off Kanagawa — Katsushika Hokusai, c. 1831. Public domain.
Source: https://commons.wikimedia.org/wiki/File:Tsunami_by_hokusai_19th_century.jpg

Bundled photographic/art raster files are stripped 8-bit sRGB JPEGs at no more than 720 pixels on the long side; generated diagnostics are lossless 640×480 sRGB canvases/PNGs. They are stimuli for comparing coordinate distributions, not substitutes for a physical target, original artwork, HDR signal, or source spectral measurements.

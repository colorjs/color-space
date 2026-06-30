// Generated from JSDoc comments
// Run: node scripts/generate-meta.js > meta.js

export default {
  "a98rgb-linear": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Adobe RGB Linear color space Linear variant of Adobe RGB without gamma correction"
  },
  "a98rgb": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Adobe RGB color space (Adobe RGB 1998) Wider gamut than sRGB, standard for photography"
  },
  "aces2065-1": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 65504,
        "name": "Red (half float)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 65504,
        "name": "Green (half float)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 65504,
        "name": "Blue (half float)"
      }
    ],
    "range": [
      [
        0,
        65504
      ],
      [
        0,
        65504
      ],
      [
        0,
        65504
      ]
    ],
    "description": "ACES2065-1 color space (AP0 primaries) The ACES archival / interchange encoding: linear, AP0 primaries (which enclose the entire visible gamut), ACES white (~D60). Connects to acescg (AP1) via the published AP0↔AP1 matrix; everything else chains through there."
  },
  "acescc": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.358,
        "max": 1.468,
        "name": "Red (log encoded)"
      },
      {
        "symbol": "G",
        "min": -0.358,
        "max": 1.468,
        "name": "Green (log encoded)"
      },
      {
        "symbol": "B",
        "min": -0.358,
        "max": 1.468,
        "name": "Blue (log encoded)"
      }
    ],
    "range": [
      [
        -0.358,
        1.468
      ],
      [
        -0.358,
        1.468
      ],
      [
        -0.358,
        1.468
      ]
    ],
    "description": "ACEScc color space (Academy Color Encoding System) Logarithmic encoding for color grading in cinema Reference for film post-production"
  },
  "acescct": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.358,
        "max": 1.468,
        "name": "Red (log encoded)"
      },
      {
        "symbol": "G",
        "min": -0.358,
        "max": 1.468,
        "name": "Green (log encoded)"
      },
      {
        "symbol": "B",
        "min": -0.358,
        "max": 1.468,
        "name": "Blue (log encoded)"
      }
    ],
    "range": [
      [
        -0.358,
        1.468
      ],
      [
        -0.358,
        1.468
      ],
      [
        -0.358,
        1.468
      ]
    ],
    "description": "ACEScct color space ACES log encoding for colour grading (AP1 primaries, same as ACEScg) with a pure-log curve plus a linear toe near black for lift/gamma/gain controls. ACES spec S-2016-001. Connects to acescg (its linear form)."
  },
  "acescg": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 65504,
        "name": "Red (half float)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 65504,
        "name": "Green (half float)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 65504,
        "name": "Blue (half float)"
      }
    ],
    "range": [
      [
        0,
        65504
      ],
      [
        0,
        65504
      ],
      [
        0,
        65504
      ]
    ],
    "description": "ACEScg color space Academy Color Encoding System linear working space (AP1 primaries) for CGI / compositing. Scene-referred, unbounded."
  },
  "cam16-ucs": {
    "channels": [
      {
        "symbol": "J",
        "min": 0,
        "max": 100,
        "name": "Lightness (J')"
      },
      {
        "symbol": "a",
        "min": -50,
        "max": 50,
        "name": "Red-Green (a')"
      },
      {
        "symbol": "b",
        "min": -50,
        "max": 50,
        "name": "Yellow-Blue (b')"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -50,
        50
      ],
      [
        -50,
        50
      ]
    ],
    "description": "CAM16-UCS color space Uniform-color-space form of CAM16 (Li et al. 2017): compresses lightness J and colourfulness M, then lays out (J', a', b') as a near-Euclidean space suitable for colour-difference (ΔE) and gamut mapping. Built on cam16 (J, M, h)."
  },
  "cam16": {
    "channels": [
      {
        "symbol": "J",
        "min": 0,
        "max": 100,
        "name": "Lightness (Brightness)"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 150,
        "name": "Colorfulness/chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        150
      ],
      [
        0,
        360
      ]
    ],
    "description": "CAM16 color space (Color Appearance Model) Complex color appearance model used in Material Design Includes hue, saturation, brightness, and colorfulness"
  },
  "cmy": {
    "channels": [
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Cyan percentage"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Magenta percentage"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Yellow percentage"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "CMY color space Subtractive color model without black (K) component Used in simpler printing systems"
  },
  "cmyk": {
    "channels": [
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Cyan percentage"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Magenta percentage"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Yellow percentage"
      },
      {
        "symbol": "K",
        "min": 0,
        "max": 100,
        "name": "Black (Key) percentage"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "CMYK color space Subtractive color model used in printing"
  },
  "coloroid": {
    "channels": [
      {
        "symbol": "A",
        "min": 10,
        "max": 76,
        "name": "Hue grade"
      },
      {
        "symbol": "T",
        "min": 0,
        "max": 100,
        "name": "Saturation"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 100,
        "name": "Luminosity"
      }
    ],
    "range": [
      [
        10,
        76
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "Coloroid color space (Nemcsics, MSZ 7300) Aesthetic color system: hue (A), saturation (T), luminosity (V = 10·√Y). Geometry (per Neumann & Nemcsics 2004/2005): V = 10·√Y; hue A is one of 48 grades found by chromaticity angle from white; T is the position along the white→limit-color line (T=0 at white, T=100 at the spectral/purple limit). The hue lookup uses each row's angle computed from its own (xλ,yλ) — the stored angle column is inconsistent with it (a known table defect). EXPERIMENTAL: the ATV↔xyY transform now round-trips exactly and T has the correct excitation-purity semantics, but (a) A is quantized to 48 discrete grades, so rgb→coloroid→rgb loses the between-grade hue (no interpolation yet); (b) the bundled xλ,yλ table (Illuminant-C spectral data) and the white point (D65 here, per MSZ 7300) carry the documented C-vs-D65 split; (c) no reference implementation exists to cross-validate A/T. Treat A/T as provisional. Sources: Neumann & Neumann (2004) \"Gamut Clipping and Mapping Based on the Coloroid System\"; Neumann, Nemcsics & Neumann (2005)."
  },
  "cubehelix": {
    "channels": [
      {
        "symbol": "fraction",
        "min": 0,
        "max": 1,
        "name": "Interpolation fraction along helix (0-1)"
      }
    ],
    "range": [
      [
        0,
        1
      ]
    ],
    "description": "Cubehelix color space Perceptually uniform single-hue color scheme Designed for scientific visualization Reference: Green, D. A. (2011) A colour scheme for the display of astronomical intensity images"
  },
  "din99o-lab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -40,
        "max": 40,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -40,
        "max": 40,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -40,
        40
      ],
      [
        -40,
        40
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "DIN99o Lab color space Perceptually uniform variant of CIE Lab, optimized for Euclidean color difference. DIN 6176. Defined relative to CIELab (D65); rgb/xyz are reached by chaining through lab."
  },
  "din99o-lch": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 51.484,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        51.484
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "DIN99o LCh color space Cylindrical (polar) form of DIN99o Lab. Defined relative to din99o-lab; everything else is reached by chaining through it."
  },
  "gray": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Relative luminance"
      }
    ],
    "range": [
      [
        0,
        1
      ]
    ],
    "description": "Gray (relative luminance) Single-channel achromatic value = CIE relative luminance Y (the Y of XYZ): the sRGB luminance coefficients applied to LINEAR sRGB (not gamma-encoded — that would be luma Y′). Identical to the Y row of the sRGB→XYZ matrix, so gray(rgb) === XYZ(rgb).Y / 100."
  },
  "hcg": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Chroma percentage"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 100,
        "name": "Gray component percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HCG color space (Hue, Chroma, Gray) Alternative cylindrical RGB representation Uses gray component instead of value or lightness"
  },
  "hcl": {
    "description": "HCL Color Space http://www.chilliant.com/rgb2hsv.html https://en.wikipedia.org/wiki/HCL_color_space Note: This is the cylindrical representation from the Chilliant implementation, not to be confused with CIE LCh (which is also sometimes called HCL). This implementation has known limitations - RGB to HCL to RGB round-tripping may not be perfect due to the perceptual approximations involved."
  },
  "hct": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 150,
        "name": "Chroma"
      },
      {
        "symbol": "T",
        "min": 0,
        "max": 100,
        "name": "Tone (perceptual lightness)"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        150
      ],
      [
        0,
        100
      ]
    ],
    "description": "HCT color space (Hue, Chroma, Tone) Material Design's color system based on CAM16 Uses tone (perceptual lightness) instead of lightness"
  },
  "hcy": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Chroma percentage"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Luma percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HCY color space (Hue, Chroma, Luma) Luma-based cylindrical model for shader programming (Kuzma Shapran / Chilliant). Unlike HSI/HSL, the Y channel is the color's actual Rec.601 luma, and chroma is normalized against the luma the hue can carry — so equal Y means equal brightness. http://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html"
  },
  "hpluv": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage (pastel gamut; exceeds 100 outside it)"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "HPLuv color space (High-Precision LUV) Variant of HSLuv for pastel colors with consistent perceptual lightness Optimized for sRGB gamut"
  },
  "hsi": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "I",
        "min": 0,
        "max": 100,
        "name": "Intensity percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HSI color space (Hue, Saturation, Intensity) Cylindrical representation with intensity (average of RGB) Derived from RGB for image processing"
  },
  "hsl": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HSL color space (Hue, Saturation, Lightness) Cylindrical representation of RGB with perceptual intent"
  },
  "hsluv": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "HSLuv color space Human-friendly cylindrical representation of LChuv Perceptually uniform hue with intuitive saturation and lightness"
  },
  "hsm": {
    "description": "http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428"
  },
  "hsp": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "P",
        "min": 0,
        "max": 100,
        "name": "Perceived brightness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HSP color space (Hue, Saturation, Perceived brightness) Uses perceived brightness weighted by human eye sensitivity Useful for perceptually uniform color operations"
  },
  "hsv": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 100,
        "name": "Value (brightness) percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HSV color space (Hue, Saturation, Value) Cylindrical representation of RGB maximizing perceived saturation"
  },
  "hwb": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "W",
        "min": 0,
        "max": 100,
        "name": "Whiteness percentage"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 100,
        "name": "Blackness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "HWB color space (Hue, Whiteness, Blackness) Cylindrical representation using whiteness and blackness"
  },
  "ictcp": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 100,
        "name": "Intensity (lightness)"
      },
      {
        "symbol": "Ct",
        "min": -50,
        "max": 50,
        "name": "Tritan chroma (blue-yellow)"
      },
      {
        "symbol": "Cp",
        "min": -50,
        "max": 50,
        "name": "Protanopia chroma (red-green)"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -50,
        50
      ],
      [
        -50,
        50
      ]
    ],
    "description": "ICtCp color space HDR perceptual color space for ITU-R BT.2100 Based on PQ transfer function for HDR video"
  },
  "jpeg": {
    "description": "https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion JPEG conversion without head/footroom"
  },
  "jzazbz": {
    "channels": [
      {
        "symbol": "Jz",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "az",
        "min": -50,
        "max": 50,
        "name": "Green-Red axis"
      },
      {
        "symbol": "bz",
        "min": -50,
        "max": 50,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -50,
        50
      ],
      [
        -50,
        50
      ]
    ],
    "description": "JzAzBz color space High dynamic range color space based on PQ (Perceptual Quantizer) Used for HDR content and next-generation color imaging"
  },
  "jzczhz": {
    "channels": [
      {
        "symbol": "Jz",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "Cz",
        "min": 0,
        "max": 50,
        "name": "Chroma"
      },
      {
        "symbol": "Hz",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        50
      ],
      [
        0,
        360
      ]
    ],
    "description": "JzCzHz color space Cylindrical variant of JzAzBz for HDR Uses chroma and hue instead of rectangular coordinates"
  },
  "lab-d65": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -125,
        "max": 125,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -125,
        "max": 125,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -125,
        125
      ],
      [
        -125,
        125
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "CIE Lab color space (1976), D65 reference white Display-native CIELAB: the reference white is D65, matching sRGB / Rec.709 / Display P3, so converting display RGB needs no chromatic adaptation. The default `lab` uses D50 (the ICC / CSS Color 4 convention); use this when you want Lab anchored to the display white instead."
  },
  "lab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -125,
        "max": 125,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -125,
        "max": 125,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -125,
        125
      ],
      [
        -125,
        125
      ]
    ],
    "illuminant": "D50",
    "observer": "2",
    "description": "CIE Lab color space (1976) Perceptual color space with approximately uniform lightness. Reference white is D50 — the ICC color-management (PCS) and CSS Color 4 convention for Lab, and the conventional default for Lab as a device-independent interchange space. For a display-native D65 Lab, use `lab-d65`."
  },
  "labh": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -100,
        "max": 100,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -100,
        "max": 100,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -100,
        100
      ],
      [
        -100,
        100
      ]
    ],
    "description": "Lab Hunter color space Alternative Lab definition by Richard Hunter Optimized for reflectance, less uniform than CIE Lab"
  },
  "lch-d65": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 150,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        150
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "LCh (D65) color space Cylindrical (polar) form of lab-d65 — intuitive hue/chroma with the D65 white point. For the CSS/ICC D50 LCh, use `lchab`."
  },
  "lchab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 150,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        150
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "LCh(ab) color space Cylindrical LAB with lightness, chroma, and hue More intuitive than rectangular Lab coordinates"
  },
  "lchuv": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 150,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        150
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "LCh(uv) color space Cylindrical CIE LUV with lightness, chroma, and hue"
  },
  "lms": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Long wavelength (red) response"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Medium wavelength (green) response"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Short wavelength (blue) response"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "LMS color space Responsivity of cones in human eye Used for chromatic adaptation transformations"
  },
  "lrgb": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "description": "Linear RGB color space RGB without gamma correction, useful for color math"
  },
  "luv": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "U",
        "min": -100,
        "max": 100,
        "name": "U chrominance"
      },
      {
        "symbol": "V",
        "min": -100,
        "max": 100,
        "name": "V chrominance"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -100,
        100
      ],
      [
        -100,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "CIE LUV color space (C'est la vie) Cylindrical variant: LChuv Perceptually more uniform than XYZ"
  },
  "okhsl": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "OkHSL color space Cylindrical color picker from Oklab Designed for intuitive color selection"
  },
  "okhsv": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation percentage"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 100,
        "name": "Value (brightness) percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "OkHSV color space Cylindrical variant of OkHSL using value instead of lightness Alternative color picker from Oklab"
  },
  "okhwb": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      },
      {
        "symbol": "W",
        "min": 0,
        "max": 100,
        "name": "Whiteness percentage"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 100,
        "name": "Blackness percentage"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "description": "Okhwb color space Hue / whiteness / blackness built on Okhsv (Ottosson) — the HWB analog of the perceptual Okhsl/Okhsv pickers, bounded to the sRGB gamut."
  },
  "oklab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -40,
        "max": 40,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -40,
        "max": 40,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -40,
        40
      ],
      [
        -40,
        40
      ]
    ],
    "description": "Oklab color space Modern perceptual color space based on cone response More uniform than Lab, better for interpolation"
  },
  "oklch": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 40,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        40
      ],
      [
        0,
        360
      ]
    ],
    "description": "OkLCh color space Cylindrical version of Oklab with cylindrical hue"
  },
  "oklrab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -40,
        "max": 40,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -40,
        "max": 40,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -40,
        40
      ],
      [
        -40,
        40
      ]
    ],
    "description": "OkLrab color space Modified version of Oklab using toe mapping Optimized for color picker gamut mapping"
  },
  "oklrch": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 40,
        "name": "Chroma"
      },
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue angle in degrees"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        40
      ],
      [
        0,
        360
      ]
    ],
    "description": "OkLrch color space Cylindrical variant of OkLrab Uses chroma and hue for intuitive color selection"
  },
  "osaucs": {
    "channels": [
      {
        "symbol": "L",
        "min": -10,
        "max": 10,
        "name": "Lightness"
      },
      {
        "symbol": "j",
        "min": -10,
        "max": 10,
        "name": "Yellow-Blue axis"
      },
      {
        "symbol": "g",
        "min": -10,
        "max": 10,
        "name": "Red-Green axis"
      }
    ],
    "range": [
      [
        -10,
        10
      ],
      [
        -10,
        10
      ],
      [
        -10,
        10
      ]
    ],
    "description": "OSA-UCS color space Uniform Color Scale by Optical Society of America Perceptually uniform color space for industrial applications"
  },
  "p3-linear": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Display P3 Linear color space Linear variant of DCI-P3 (Apple Display P3) Without gamma correction, used for image processing"
  },
  "p3": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Display P3 color space (Apple Display P3) DCI-P3 color space with gamma correction Wider gamut than sRGB, used in modern displays"
  },
  "prophoto-linear": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D50",
    "observer": "2",
    "description": "ProPhoto RGB Linear color space Linear variant of ProPhoto without gamma correction References D50 illuminant"
  },
  "prophoto": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D50",
    "observer": "2",
    "description": "ProPhoto RGB color space Largest gamut RGB color space designed for professional photography References D50 white point"
  },
  "rec2020-linear": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 2020 Linear color space Linear variant of ITU-R Rec. 2020 (UHDTV/4K standard) Without gamma correction for image processing"
  },
  "rec2020-oetf": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (gamma corrected)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (gamma corrected)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (gamma corrected)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 2020 OETF color space Rec. 2020 with OETF (Opto-Electronic Transfer Function) Standard for HD television (Rec. 709 variant)"
  },
  "rec2020": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 2020 color space ITU-R BT.2020 standard for UHDTV/4K. Wide-gamut RGB with the BT.2020 transfer function (same piecewise form as BT.709). Uses the CSS `color(rec2020 …)` convention: channels 0-1, not 0-255."
  },
  "rec2100-hlg": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (HLG encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (HLG encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (HLG encoded)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 2100 with HLG (Hybrid Log-Gamma) transfer function ITU-R BT.2100 HDR with HLG OETF for broadcast Backward compatible with SDR displays"
  },
  "rec2100-pq": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (PQ encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (PQ encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (PQ encoded)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 2100 with PQ (Perceptual Quantizer) transfer function ITU-R BT.2100 HDR (4K/8K) with PQ OETF Used for HDR broadcast and streaming"
  },
  "rec709": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "Rec. 709 color space ITU-R BT.709 HDTV: the same primaries and D65 white as sRGB, but with the BT.709 camera transfer function (OETF) instead of the sRGB curve. The linear light is identical to linear sRGB, so this connects through `lrgb`."
  },
  "rg": {
    "channels": [
      {
        "symbol": "r",
        "min": 0,
        "max": 1,
        "name": "Red chromaticity coordinate"
      },
      {
        "symbol": "g",
        "min": 0,
        "max": 1,
        "name": "Green chromaticity coordinate"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ]
    ],
    "description": "RG Chromaticity color space Normalized 2D chromaticity space (r + g + b = 1) Used for color matching and chromaticity analysis Blue component can be derived as 1 - r - g"
  },
  "rgb": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 255,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 255,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 255,
        "name": "Blue"
      }
    ],
    "range": [
      [
        0,
        255
      ],
      [
        0,
        255
      ],
      [
        0,
        255
      ]
    ],
    "illuminant": "D65",
    "description": "RGB color space (sRGB) Standard red-green-blue color space for displays Uses D65 illuminant, gamma-corrected"
  },
  "tsl": {
    "channels": [
      {
        "symbol": "T",
        "min": 0,
        "max": 360,
        "name": "Tint (hue) angle in degrees"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 1,
        "name": "Saturation"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 255,
        "name": "Lightness (brightness level)"
      }
    ],
    "range": [
      [
        0,
        360
      ],
      [
        0,
        1
      ],
      [
        0,
        255
      ]
    ],
    "description": "TSL color space (Tint, Saturation, Lightness) Simple cylindrical representation of RGB Derived from RGB for image analysis"
  },
  "ucs": {
    "channels": [
      {
        "symbol": "U",
        "min": 0,
        "max": 100,
        "name": "U coordinate"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 100,
        "name": "V coordinate"
      },
      {
        "symbol": "W",
        "min": 0,
        "max": 100,
        "name": "W (related to brightness)"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        100
      ],
      [
        0,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "CIE 1960 UCS (Uniform Color Space) Obsolete color space predecessor to CIELUV Historical reference for color science"
  },
  "uvw": {
    "channels": [
      {
        "symbol": "U",
        "min": -100,
        "max": 100,
        "name": "U* chrominance"
      },
      {
        "symbol": "V",
        "min": -100,
        "max": 100,
        "name": "V* chrominance"
      },
      {
        "symbol": "W",
        "min": -17,
        "max": 100,
        "name": "W* lightness"
      }
    ],
    "range": [
      [
        -100,
        100
      ],
      [
        -100,
        100
      ],
      [
        -17,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "description": "CIE 1964 U*V*W* color space Obsolete perceptual space, predecessor to CIELUV. Built on the CIE 1960 UCS chromaticity (u′, v′): W* = 25·Y^(1/3) − 17        (Y in 0-100) U* = 13·W*·(u′ − u′n) V* = 13·W*·(v′ − v′n) where (u′n, v′n) is the reference-white chromaticity. At an undefined chromaticity (black, or W*=0) the color is achromatic, so U* = V* = 0."
  },
  "xvycc": {
    "description": "https://en.wikipedia.org/wiki/XvYCC Sony xvYCC (extended-gamut YCC) is an extended-gamut version of YCbCr **Important**: In this library, xvYCC uses identical formulas to YPbPr/YCbCr because all values are normalized to 0-1 range. The conceptual difference is: - YCbCr (traditional): Limited to \"legal\" range (16-235 for Y in 8-bit) - YPbPr: Analog version, typically full range [0,1] - xvYCC: Explicitly extended range, allows values beyond normal gamut Since this library normalizes all spaces to [0,1] and doesn't enforce range limits, xvYCC is functionally identical to YPbPr here. The separate implementation exists for semantic clarity and compatibility. It uses the same transformation matrices as: SD: ITU-R BT.601 HD: ITU-R BT.709 Formulas (identical to YPbPr): Forward (RGB → xvYCC): Y  = Kr*R + (1-Kr-Kb)*G + Kb*B Cb = 0.5*(B-Y)/(1-Kb) Cr = 0.5*(R-Y)/(1-Kr) Inverse (xvYCC → RGB): R = Y + 2*Cr*(1-Kr) B = Y + 2*Cb*(1-Kb) G = (Y - Kr*R - Kb*B)/(1-Kr-Kb) Where for BT.709: Kr=0.2126, Kb=0.0722 for BT.601: Kr=0.299,  Kb=0.114 References: - https://en.wikipedia.org/wiki/XvYCC - https://en.wikipedia.org/wiki/YCbCr - IEC 61966-2-4:2006 (xvYCC specification)"
  },
  "xyy": {
    "channels": [
      {
        "symbol": "x",
        "min": 0,
        "max": 1,
        "name": "Red chromaticity"
      },
      {
        "symbol": "y",
        "min": 0,
        "max": 1,
        "name": "Green chromaticity"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Luminance (CIE Y)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        0,
        1
      ],
      [
        0,
        100
      ]
    ],
    "description": "xyY color space Chromaticity coordinates (x, y) with luminance (Y) Useful for color matching and display calibration"
  },
  "xyz": {
    "description": "Bradford chromatic adaptation between D50 and D65 (CSS Color 4, full precision). Shared so the D50-referred spaces (xyz-d50, lab-d50, prophoto) don't each carry their own truncated copy."
  },
  "ycbcr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 16,
        "max": 235,
        "name": "Luma (brightness)"
      },
      {
        "symbol": "Cb",
        "min": 16,
        "max": 240,
        "name": "Blue chroma"
      },
      {
        "symbol": "Cr",
        "min": 16,
        "max": 240,
        "name": "Red chroma"
      }
    ],
    "range": [
      [
        16,
        235
      ],
      [
        16,
        240
      ],
      [
        16,
        240
      ]
    ],
    "description": "YCbCr color space Digital video color format used in broadcasting ITU-R BT.709 or ITU-R BT.601 standard"
  },
  "yccbccrc": {
    "description": "YcCbcCrc is ITU-R BT.2020"
  },
  "ycgco": {
    "description": "https://en.wikipedia.org/?title=YCgCo"
  },
  "ydbdr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma (brightness)"
      },
      {
        "symbol": "Db",
        "min": -1.333,
        "max": 1.333,
        "name": "Blue difference"
      },
      {
        "symbol": "Dr",
        "min": -1.333,
        "max": 1.333,
        "name": "Red difference"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -1.333,
        1.333
      ],
      [
        -1.333,
        1.333
      ]
    ],
    "description": "YDbDr color space SECAM television chrominance encoding Perceptually more uniform than YUV"
  },
  "yes": {
    "description": "YES color space http://www.atlantis-press.com/php/download_paper.php?id=198"
  },
  "yiq": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma (brightness)"
      },
      {
        "symbol": "I",
        "min": -0.5957,
        "max": 0.5957,
        "name": "Chrominance (in-phase)"
      },
      {
        "symbol": "Q",
        "min": -0.5226,
        "max": 0.5226,
        "name": "Chrominance (quadrature)"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.5957,
        0.5957
      ],
      [
        -0.5226,
        0.5226
      ]
    ],
    "description": "YIQ color space Analog television luma-chroma encoding Used in NTSC television standards"
  },
  "ypbpr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma (brightness)"
      },
      {
        "symbol": "Pb",
        "min": -0.5,
        "max": 0.5,
        "name": "Blue chroma"
      },
      {
        "symbol": "Pr",
        "min": -0.5,
        "max": 0.5,
        "name": "Red chroma"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.5,
        0.5
      ],
      [
        -0.5,
        0.5
      ]
    ],
    "description": "YPbPr color space Analog form of YCbCr used in component video ITU-R BT.709 standard for HD video"
  },
  "yuv": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma (brightness)"
      },
      {
        "symbol": "U",
        "min": -0.436,
        "max": 0.436,
        "name": "Chrominance blue component"
      },
      {
        "symbol": "V",
        "min": -0.615,
        "max": 0.615,
        "name": "Chrominance red component"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.436,
        0.436
      ],
      [
        -0.615,
        0.615
      ]
    ],
    "description": "YUV color space Television analog encoding separating luma from chroma Used in PAL/SECAM broadcast standards"
  }
}

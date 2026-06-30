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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "scene",
    "dynamic": "hdr",
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
    "referred": "scene",
    "dynamic": "hdr",
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
    "referred": "scene",
    "dynamic": "hdr",
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACEScg color space Academy Color Encoding System linear working space (AP1 primaries) for CGI / compositing. Scene-referred, unbounded."
  },
  "anlab": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness (9.2·V)"
      },
      {
        "symbol": "a",
        "min": -100,
        "max": 100,
        "name": "Red-Green (40·ΔV)"
      },
      {
        "symbol": "b",
        "min": -100,
        "max": 100,
        "name": "Yellow-Blue (16·ΔV)"
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
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "ANLAB (Adams-Nickerson) color space The chromatic-valence opponent space (Adams 1942; Nickerson 1950) — the direct historical precursor of CIELAB. Applies the Munsell value function to the adapted tristimulus ratios, then opponent differences. This is the ANLAB-40 form under CIE Illuminant C / 2°; CIELAB later replaced the (iterative) Munsell value with a cube root and renormalised lightness to 100 — here white is L ≈ 9.2·V(100) ≈ 91."
  },
  "apple-rgb": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "Apple RGB color space The classic Mac OS working space (~1998-2009) modelling the original Apple Trinitron CRT, still selectable in Photoshop's colour settings and embedded in millions of legacy files. D65 white, γ1.8 (Apple's historic default — the only use of that exponent here). Matrix derived from the primaries."
  },
  "applelog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Apple Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Apple Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Apple Log)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Apple Log color space Apple's Log profile (iPhone 15 Pro+, 2023): a quadratic toe for near/sub-black, then a log2 segment. Apple Log (gen 1) uses ITU-R BT.2020 primaries, so a transfer over `rec2020-linear`. 18% grey → 0.4883. (Spec via the public ACES CTL / colour-science; Apple's own white paper is developer-gated.)"
  },
  "bmdfilm": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (BMD Film Gen5)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (BMD Film Gen5)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (BMD Film Gen5)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Blackmagic Film Gen5 / BMD Wide Gamut color space Blackmagic Design's Generation 5 film curve (a piecewise linear-toe + natural-log curve) over the BMD Wide Gamut Gen5 primaries. Per-channel to scene-linear, then BMD Wide Gamut→XYZ(D65). 18% grey → 0.3836. (Spec reverse-engineered from the BRAW SDK; constants verified against colour-science / OCIO.)"
  },
  "cam02-lcd": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-LCD color space Uniform-color-space form of CIECAM02 optimised for LARGE colour differences (Luo, Cui & Li 2006). Same J'/M' compression family as `cam02-ucs`, with the LCD-tuned constant c2 = 0.0053. Built on `ciecam02` (J, M, h)."
  },
  "cam02-scd": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-SCD color space Uniform-color-space form of CIECAM02 optimised for SMALL colour differences (Luo, Cui & Li 2006). Same J'/M' compression family as `cam02-ucs`, with the SCD-tuned constant c2 = 0.0363. Built on `ciecam02` (J, M, h)."
  },
  "cam02-ucs": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-UCS color space Uniform-color-space form of CIECAM02 (Luo, Cui & Li 2006): compresses lightness J and colourfulness M, then lays out (J', a', b') for colour-difference (ΔE) and gamut mapping. Built on ciecam02 (J, M, h). Same compression family as cam16-ucs."
  },
  "cam16-lcd": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16-LCD color space Uniform-color-space form of CAM16 optimised for LARGE colour differences (Li et al. 2017, using the Luo 2006 coefficients). Same J'/M' compression family as `cam16-ucs`, with the LCD-tuned constant c2 = 0.0053. Built on `cam16` (J, M, h)."
  },
  "cam16-scd": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16-SCD color space Uniform-color-space form of CAM16 optimised for SMALL colour differences (Li et al. 2017, using the Luo 2006 coefficients). Same J'/M' compression family as `cam16-ucs`, with the SCD-tuned constant c2 = 0.0363. Built on `cam16` (J, M, h)."
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
    "referred": "display",
    "dynamic": "sdr",
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
        "symbol": "M",
        "min": 0,
        "max": 105,
        "name": "Colorfulness"
      },
      {
        "symbol": "h",
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
        105
      ],
      [
        0,
        360
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16 color space (Color Appearance Model) Complex color appearance model used in Material Design Includes hue, saturation, brightness, and colorfulness"
  },
  "cie-rgb": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (700 nm)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (546.1 nm)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (435.8 nm)"
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
    "illuminant": "E",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE RGB (1931) color space The original Wright-Guild experimental RGB whose colour-matching functions defined CIE XYZ — monochromatic primaries at 700 / 546.1 / 435.8 nm, equal-energy white E, linear (no gamma). The ancestor of all RGB spaces. Matrix derived from the primaries (Lindbloom method) and Bradford-adapted from E to the library's D65 XYZ."
  },
  "cie": {
    "description": "CIE 1976 perceptual companding — the cube-root toe shared by every space built on L* (CIELAB, CIELUV, DIN99d, HCT, HSLuv). Single source of truth for the two constants and the f/f⁻¹ pair, so no space carries its own (differently-rounded) copy."
  },
  "ciecam02": {
    "channels": [
      {
        "symbol": "J",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Colorfulness"
      },
      {
        "symbol": "h",
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
        100
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIECAM02 color appearance model The CIE 2002 appearance model (predecessor of CAM16, still used in ICC v4 workflows). Reports [J, M, h] under the standard Moroney et al. (2002) viewing conditions: D65 adapting white, La = 318.31 cd/m², Yb = 20, average surround."
  },
  "cineon": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Cineon-coded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Cineon-coded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Cineon-coded)"
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
    "referred": "scene",
    "dynamic": "sdr",
    "description": "Cineon color space Kodak Cineon printing-density log (the classic film-scan/DPX encoding, SMPTE 268M), applied per channel over linear-light RGB. Reference black 95 / white 685 over a 10-bit range; 18% grey encodes to 0.4573. No gamut of its own — a transfer over `lrgb` (linear sRGB)."
  },
  "clog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Canon Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Canon Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Canon Log)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log / Cinema Gamut color space Canon Log (the original, v1.2 constants) over Canon's Cinema Gamut (same matrix as `clog2`). Symmetric log about black with the ÷0.9 reflection convention; 18% grey → 0.3434. Per-channel Canon Log to scene-linear, then Cinema Gamut→XYZ(D65)."
  },
  "clog2": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Canon Log 2 encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Canon Log 2 encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Canon Log 2 encoded)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log 2 / Cinema Gamut color space Canon Log 2 (v1.2, legal/NCV range) transfer over the Canon Cinema Gamut primaries, reflectance-referred (×0.9, matching the ACES IDT and colour-science out_reflection: 18% gray→Y18, 90% card→Y90, perfect white→Y100). Per-channel Canon Log 2 curve to scene-linear, then Cinema Gamut→XYZ(D65). Canon IT 202007."
  },
  "clog3": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Canon Log 3)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Canon Log 3)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Canon Log 3)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log 3 / Cinema Gamut color space Canon Log 3 (v1.2 constants) over Cinema Gamut (same matrix as `clog2`). A three-piece curve — shadow log, linear midtone, highlight log — with the ÷0.9 reflection convention; 18% grey → 0.3434. Per-channel to scene-linear, then Cinema Gamut→XYZ(D65)."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "Coloroid color space (Nemcsics, MSZ 7300) Aesthetic color system: hue (A), saturation (T), luminosity (V = 10·√Y). Geometry (per Neumann & Nemcsics 2004/2005): V = 10·√Y; hue A is one of 48 grades found by chromaticity angle from white; T is the position along the white→limit-color line (T=0 at white, T=100 at the spectral/purple limit). The hue lookup uses each row's angle computed from its own (xλ,yλ); the stored angle column is decorative (it disagrees with the chromaticities). The limit-color table now holds the authoritative Nemcsics (1980) chromaticities (xλ=Xλ/eλ, yλ=Yλ/eλ from the data block below) — the prior table had the yλ column shifted by one row. ATV↔xyY round-trips exactly and reproduces the published A=70,T=70,V=60 → xyY example. Remaining limitation: A is quantized to 48 discrete grades, so rgb→coloroid→rgb carries ~2/255 of between-grade hue rounding (no interpolation). Sources: Nemcsics (1980) Color Res. Appl. 5(2) 113–120; Neumann & Neumann (2004) \"Gamut Clipping and Mapping Based on the Coloroid System\"."
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "Cubehelix color space Perceptually uniform single-hue color scheme Designed for scientific visualization Reference: Green, D. A. (2011) A colour scheme for the display of astronomical intensity images"
  },
  "dci-p3": {
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
    "illuminant": "DCI",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DCI-P3 (theatrical) color space Digital-cinema P3: the P3 primaries with the DCI white point (x 0.314, y 0.351) and a pure gamma-2.6 curve (SMPTE RP 431-2). Distinct from display-p3 (repo `p3`, which is D65 + sRGB curve). The DCI→D65 Bradford adaptation is baked into the matrix."
  },
  "din99d": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -50,
        "max": 50,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
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
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99d color space Improved DIN99 uniform space (Cui, Luo, Rigg, Roesler & Witt 2002). Unlike din99o, canonical DIN99d applies the redness pre-correction Xc = 1.12·X − 0.12·Z to the D65 tristimulus *before* CIELab (with the corrected white Xcw), then a 50° hue rotation and log compression. It connects via xyz because the correction precedes the Lab step. (colour-science's DIN99d omits the X-correction; the paper form here is the canonical one.)"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99o LCh color space Cylindrical (polar) form of DIN99o Lab. Defined relative to din99o-lab; everything else is reached by chaining through it."
  },
  "dlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (D-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (D-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (D-Log)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "DJI D-Log / D-Gamut color space DJI's D-Log curve (linear toe + log10 highlight) over the D-Gamut primaries (X7/Ronin 4D cinema cameras). Per-channel D-Log to scene-linear, then D-Gamut→XYZ (D65). 18% grey → 0.3988. (D-Log M, the consumer-drone variant, is an unpublished black box and is deliberately NOT included.)"
  },
  "dsh": {
    "channels": [
      {
        "symbol": "d",
        "min": -700,
        "max": 700,
        "name": "Dominant wavelength (nm; negative = complementary/purple)"
      },
      {
        "symbol": "s",
        "min": 0,
        "max": 1,
        "name": "Excitation purity"
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
        -700,
        700
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
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE DSH — dominant wavelength / saturation (excitation purity) / hue Helmholtz coordinates of CIE 1931 xy chromaticity: a polar representation where the dominant wavelength is the hue analog (so DSH's \"H\" IS the dominant wavelength `d` — they are the same coordinate) and excitation purity is the saturation analog. The third stored channel is luminance Y, making the transform an invertible wrapped xyY. Negative `d` is a complementary wavelength: non-spectral purples have no dominant wavelength, so the line from white is reversed onto the opposite locus arc. Forward intersects the ray (D65 white -> colour) with the CIE 1931 2° spectral locus (embedded at 5 nm; finer sampling shifts the wavelength by <0.1 nm). Inverse is exact: colour = white + purity·(locus(d) - white)."
  },
  "flog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (F-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (F-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (F-Log)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Fujifilm F-Log / F-Gamut color space Fujifilm's F-Log curve (linear toe + log highlight) over F-Gamut, whose primaries are exactly ITU-R BT.2020 — so this is a transfer over the existing `rec2020-linear`. 18% grey → 0.4593."
  },
  "flog2": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (F-Log2)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (F-Log2)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (F-Log2)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Fujifilm F-Log2 / F-Gamut color space F-Log2 (~14 stops, a shallower log than F-Log) over F-Gamut = ITU-R BT.2020 primaries, so a transfer over `rec2020-linear`. 18% grey → 0.3910."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCG color space (Hue, Chroma, Gray) Alternative cylindrical RGB representation Uses gray component instead of value or lightness"
  },
  "hcl": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Chroma"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 95,
        "name": "Luminance"
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
        95
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
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
        "max": 145,
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
        145
      ],
      [
        0,
        100
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCY color space (Hue, Chroma, Luma) Luma-based cylindrical model for shader programming (Kuzma Shapran / Chilliant). Unlike HSI/HSL, the Y channel is the color's actual Rec.601 luma, and chroma is normalized against the luma the hue can carry — so equal Y means equal brightness. http://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html"
  },
  "hellwig2022": {
    "channels": [
      {
        "symbol": "J",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 60,
        "name": "Colourfulness"
      },
      {
        "symbol": "h",
        "min": 0,
        "max": 360,
        "name": "Hue angle (degrees)"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        60
      ],
      [
        0,
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Hellwig & Fairchild 2022 color appearance model The CIE-recommended successor to CAM16 (basis of CIECAM16 / CIE 248:2022). Reuses CAM16's CAT16 adaptation, opponent dimensions and lightness correlate, but replaces the achromatic response (2R+G+0.05B−0.305, no n_bb) and linearises brightness (Q = (2/c)(J/100)A_w). Output is (J, M, h) under CAM16's \"average\" viewing conditions (D65 white, L_A = 64/π·0.2, Y_b = 20)."
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "HPLuv color space Pastel variant of HSLuv: the chroma is bounded by the LARGEST circle that fits inside the sRGB gamut at each lightness (so every hue stays in gamut), at the cost of S exceeding 100 for vivid colours. L and H pass through to LCHuv; only S↔C differs. Reuses the library's `lchuv` chain and HSLuv's gamut-bound math."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSLuv color space Human-friendly cylindrical form of CIELUV (LCHuv) — the chroma is rescaled so S=100 is the sRGB gamut boundary at each (L, H). L and H pass straight through to LCHuv; only S↔C differs. Reuses the library's `lchuv` (→ luv → xyz → rgb) and XYZ→linear-sRGB matrix; only the gamut-boundary math lives here."
  },
  "hsm": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 100,
        "name": "Saturation"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Mixture"
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSM color space (Hue, Saturation, Mixture) Bianconi et al. (2009), \"A New Color Space for Skin Color Detection\", Revista de Informática Teórica e Aplicada 16(2). Mixture M is the luminance- weighted mean (4R+2G+B)/7; saturation is the chromatic distance normalised by D(M), the maximum reachable chromatic distance at that mixture."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "hdr",
    "description": "ICtCp color space HDR perceptual color space for ITU-R BT.2100 Based on PQ transfer function for HDR video"
  },
  "ipt": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "P",
        "min": -1,
        "max": 1,
        "name": "Red-Green"
      },
      {
        "symbol": "T",
        "min": -1,
        "max": 1,
        "name": "Yellow-Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -1,
        1
      ],
      [
        -1,
        1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "IPT color space Ebner & Fairchild (1998) opponent space with near-constant hue lines — the structural ancestor of ICtCp. XYZ(D65)→LMS (M1), signed power 0.43, then LMS′→IPT (M2). I = lightness, P = red-green, T = yellow-blue."
  },
  "izazbz": {
    "channels": [
      {
        "symbol": "Iz",
        "min": 0,
        "max": 1,
        "name": "Achromatic (PQ)"
      },
      {
        "symbol": "az",
        "min": -0.1,
        "max": 0.1,
        "name": "Red-Green"
      },
      {
        "symbol": "bz",
        "min": -0.1,
        "max": 0.1,
        "name": "Yellow-Blue"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.1,
        0.1
      ],
      [
        -0.1,
        0.1
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Izazbz color space The perceptual opponent stage Safdar et al. (2017) built Jzazbz on — PQ-encoded LMS through the Iz/az/bz mix, *before* Jzazbz's hyperbolic lightness compression (az/bz are identical to `jzazbz`; only the achromatic Iz differs, being the raw pre-compression response). The structural ancestor of ZCAM. Input is XYZ in domain 1 (library 0-100 ÷ 100)."
  },
  "jpeg": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 255,
        "name": "Luma"
      },
      {
        "symbol": "Cb",
        "min": 0,
        "max": 255,
        "name": "Blue-difference chroma"
      },
      {
        "symbol": "Cr",
        "min": 0,
        "max": 255,
        "name": "Red-difference chroma"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "hdr",
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
    "referred": "display",
    "dynamic": "hdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
        "min": -75,
        "max": 115,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -210,
        "max": 60,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -75,
        115
      ],
      [
        -210,
        60
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
        "max": 105,
        "name": "Medium wavelength (green) response"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 110,
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
        105
      ],
      [
        0,
        110
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "LMS color space Responsivity of cones in human eye Used for chromatic adaptation transformations"
  },
  "log3g10": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Log3G10 encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Log3G10 encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Log3G10 encoded)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "RED Log3G10 / REDWideGamutRGB color space RED's Log3G10 (v3) transfer over the REDWideGamutRGB primaries. Per-channel Log3G10 curve to scene-linear, then RWG→XYZ(D65). RED whitepaper 915-0187 Rev-C."
  },
  "logc3": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (LogC3)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (LogC3)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (LogC3)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ARRI LogC3 / ALEXA Wide Gamut 3 color space ARRI's LogC3 curve (EI 800, SUP 3.x, Linear Scene Exposure Factor) over the ALEXA Wide Gamut 3 primaries — the dominant cinema camera space before LogC4. Per-channel LogC3 to scene-linear, then AWG3→XYZ(D65). 18% grey → 0.3910."
  },
  "logc4": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (LogC4 encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (LogC4 encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (LogC4 encoded)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ARRI LogC4 color space ARRI's 2023 log encoding (EI-independent) over the ARRI Wide Gamut 4 (AWG4) primaries. Per-channel LogC4 curve to scene-linear, then the AWG4→XYZ(D65) matrix. ARRI LogC4 Specification (2025-01-23)."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE LUV color space (C'est la vie) Cylindrical variant: LChuv Perceptually more uniform than XYZ"
  },
  "macboyn": {
    "channels": [
      {
        "symbol": "l",
        "min": 0,
        "max": 1,
        "name": "L/(L+M) red-green chromaticity"
      },
      {
        "symbol": "s",
        "min": 0,
        "max": 1,
        "name": "S/(L+M) tritan chromaticity"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Luminance (L+M)"
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
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "MacLeod-Boynton ls chromaticity color space The cone-excitation chromaticity diagram of vision science (MacLeod & Boynton 1979): a constant-luminance plane where l = L/(L+M) and s = S/(L+M) on the Smith-Pokorny (1975) cone fundamentals, scaled so L+M = Y (luminance). The foundation of the DKL cardinal-axis space and of chromatic-discrimination work. Stored with the MB luminance (L+M ≈ Y) as a third channel for invertibility."
  },
  "munsell": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 100,
        "name": "Hue (ASTM circle; 5R=5, 5Y=25, 5G=45, 5B=65, 5P=85)"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 10,
        "name": "Value (lightness)"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 38,
        "name": "Chroma (0=neutral; even-integer renotation grid)"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        0,
        10
      ],
      [
        0,
        38
      ]
    ],
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Munsell renotation color space Artist colour system: Hue (0-100 ASTM circle), Value (0-10 lightness), Chroma (0,2,4,... saturation). Notation like \"5R 5/10\" = hue 5R, value 5, chroma 10. Bidirectional via the Newhall-Nickerson-Judd 1943 renotation (RIT MCSL \"real\" dataset, 2734 colours within the MacAdam limits), embedded packed below. Forward is exact at grid points + trilinear (H,V,C); inverse is iterative (coarse grid search + 2D Newton), round-tripping xy to ~1e-10. Hue numbering (ASTM 0-100): 10RP=0/100, 2.5R=2.5, 5R=5, 10R=10, 5YR=15, ..., advancing R->YR->Y->GY->G->BG->B->PB->P->RP. Achromatic (Munsell \"N\") is chroma 0. CAUTION — illuminant: the renotation is defined for CIE Illuminant C / 2° observer, so munsell<->xyy is Illuminant-C-referenced (matching colour-science). Chaining on to rgb/xyz (which are D65 here) carries a C->D65 white-point mismatch unless you chromatically adapt; convert through xyy and adapt yourself for display-accurate sRGB. Value's Y uses the 1943 (MgO) value function, so V=10 ideal white is Y=102.57."
  },
  "nlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (N-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (N-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (N-Log)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Nikon N-Log / N-Gamut color space Nikon's N-Log — a cube-root toe (shadows) and natural-log highlight (note: ln, not log10) — over N-Gamut, whose primaries are exactly ITU-R BT.2020, so a transfer over `rec2020-linear`. Constants are exact rationals (650/1023, …). 18% grey → 0.3637."
  },
  "ntsc": {
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
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "NTSC RGB (1953) color space The original FCC-mandated US colour-television primaries (1953) — the founding broadcast gamut, still quoted as a coverage benchmark (\"% NTSC\"). Illuminant C white, γ≈2.2 (BT.470 System M). Wide green/red phosphors never achieved in practice (superseded by SMPTE-C / Rec.709). Matrix from the primaries, Bradford C→D65."
  },
  "ohta": {
    "channels": [
      {
        "symbol": "I1",
        "min": 0,
        "max": 255,
        "name": "Intensity (R+G+B)/3"
      },
      {
        "symbol": "I2",
        "min": -128,
        "max": 128,
        "name": "Opponent (R-B)/2"
      },
      {
        "symbol": "I3",
        "min": -128,
        "max": 128,
        "name": "Opponent (2G-R-B)/4"
      }
    ],
    "range": [
      [
        0,
        255
      ],
      [
        -128,
        128
      ],
      [
        -128,
        128
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "Ohta I1I2I3 color space Yu-Ichi Ohta's decorrelated opponent space (1980 Kyoto thesis; Ohta, Kanade & Sakai 1980), an approximate Karhunen-Loève transform of natural-image RGB used widely in computer-vision segmentation (vegetation, fruit, flame, skin). An exact, invertible linear transform of RGB: I1 = intensity, I2/I3 = opponent chroma."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "OSA-UCS color space Uniform Color Scale by Optical Society of America (MacAdam 1974) Perceptually uniform color space for industrial applications"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "Display P3 color space (Apple Display P3) DCI-P3 color space with gamma correction Wider gamut than sRGB, used in modern displays"
  },
  "pal": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "PAL / SECAM RGB color space The European 625-line analogue-TV primaries (EBU Tech 3213 / BT.470 B,G), D65, γ≈2.2. Formally distinct from Rec.709 — the green primary sits at (0.29, 0.60) vs sRGB's (0.30, 0.60) — so it is the correct gamut for archival PAL/SECAM content. Matrix derived from the primaries."
  },
  "photoycc": {
    "channels": [
      {
        "symbol": "Yc",
        "min": 0,
        "max": 255,
        "name": "Luma"
      },
      {
        "symbol": "C1",
        "min": 0,
        "max": 255,
        "name": "Blue chroma (B-Y)"
      },
      {
        "symbol": "C2",
        "min": 0,
        "max": 255,
        "name": "Red chroma (R-Y)"
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
    "observer": "2",
    "referred": "scene",
    "dynamic": "sdr",
    "description": "PhotoYCC color space (Kodak Photo CD) Extended-gamut luma/chroma encoding for Kodak Photo CD (1992). BT.709 primaries + D65 white, but BT.601 luma coefficients (0.299/0.587/0.114), with an odd-function Rec.709 OETF that encodes scene-referred film colours beyond the [0,1] display range. The 8-bit storage form (Y_c,C1,C2 each 0-255) places neutral at C1=156, C2=137 — asymmetric because the encodable film gamut is asymmetric in B-Y / R-Y. Scene reference white (linear 1,1,1) -> luma 182 (Poynton's widely-cited \"189\" is a typo, corrected to 182 in his own 1996 errata: 255/1.402 = 181.88)."
  },
  "prolab": {
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
        "name": "Red-Green"
      },
      {
        "symbol": "b",
        "min": -125,
        "max": 125,
        "name": "Yellow-Blue"
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "proLab color space Konovalenko et al. (2021) projective perceptual space: unlike CIELAB's per-channel cube root, proLab maps XYZ through a single 4×4 homogeneous (projective) matrix, so straight lines (additive colour mixtures) stay straight while the metric tracks human discrimination thresholds. D65; L≈100 at white."
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "ProPhoto RGB color space Largest gamut RGB color space designed for professional photography References D50 white point"
  },
  "ral-design": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue (CIELAB hue angle, degrees)"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness (CIELAB L*)"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Chroma (CIELAB C*ab)"
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
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "RAL Design System+ color space RAL Design (≈1825 colours) is — unlike sample-defined RAL Classic — defined *by construction* in CIELAB cylindrical coordinates. A code \"RAL HHH L CC\" maps to CIE L*C*h directly: hue angle H (0-360°), lightness L = L*, chroma C = C*ab, so L* = L, a* = C·cos H, b* = C·sin H. This is the published *definition*, not a fitted approximation or a copied swatch table, which is what makes it a legitimate algorithmic conversion here. CAUTIONS: - \"RAL\" is a trademark of RAL gGmbH. This implements only the public coordinate definition (H/L/C ↔ CIELAB); it does NOT embed RAL's proprietary colour data, and RAL Classic (sample-defined, no open Lab) is deliberately NOT included. - White point: neighbour `lab` (D50/2°), matching the freieFarbe HLC Colour Atlas — the open, CC-licensed reference for these hue/lightness/chroma colours, defined under D50/2°. The H,L,C→L*a*b* identity is itself white-point-independent; only a later Lab→RGB step depends on the illuminant. (RAL's own measurement white is not openly documented; D50/2° is chosen to agree with the citable reference dataset.) - Real RAL Design codes are quantised (hue in 10° steps, etc.); this transform is continuous and does not snap to the nearest catalogued chip."
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "Rec. 2020 Linear color space Linear variant of ITU-R Rec. 2020 (UHDTV/4K standard) Without gamma correction for image processing"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "hdr",
    "description": "Rec. 2100 with HLG (Hybrid Log-Gamma) transfer function ITU-R BT.2100 HDR with HLG OETF for broadcast Backward compatible with SDR displays"
  },
  "rec2100-linear": {
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
    "referred": "display",
    "dynamic": "hdr",
    "description": "Rec. 2100 Linear color space Linear-light ITU-R BT.2100 (HDR). BT.2100 shares BT.2020's primaries, white point, and matrix exactly, so in value this is identical to rec2020-linear; the distinction is semantic (1.0 = 203 cd/m² HDR reference white, with values above 1.0 valid for specular highlights)."
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
    "referred": "display",
    "dynamic": "hdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "RGB color space (sRGB) Standard red-green-blue color space for displays Uses D65 illuminant, gamma-corrected"
  },
  "rimm": {
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
    "referred": "scene",
    "dynamic": "sdr",
    "description": "RIMM RGB color space Reference Input Medium Metric RGB (ANSI/I3A IT10.7466-2002 / ISO 22028-3) — the scene-referred counterpart of ROMM/ProPhoto, sharing its wide D50 primaries but carrying a BT.709-shaped OETF with extended exposure headroom (E_clip = 2.0, i.e. one stop above diffuse white, which encodes to 0.713). Matrix = ProPhoto primaries Bradford-adapted D50→D65."
  },
  "scrgb": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Red (linear)"
      },
      {
        "symbol": "G",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Green (linear)"
      },
      {
        "symbol": "B",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Blue (linear)"
      }
    ],
    "range": [
      [
        -0.5,
        7.4998779296875
      ],
      [
        -0.5,
        7.4998779296875
      ],
      [
        -0.5,
        7.4998779296875
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "scRGB color space Linear-light sRGB (same primaries and D65 white as sRGB/lrgb) with the extended IEC 61966-2-2 range [-0.5, 61439/8192] for wide-gamut and HDR signals. In float the values are identical to linear sRGB — only the declared range differs."
  },
  "slog2": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (S-Log2)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (S-Log2)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (S-Log2)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Sony S-Log2 / S-Gamut color space Sony's S-Log2 curve over the S-Gamut primaries (identical primaries to S-Gamut3, so the same matrix as `slog3`). S-Log2 wraps the base S-Log with a 155/219 scene scaling and the in-reflection (÷0.9) + legal-range code-value convention. 18% grey → 0.3395."
  },
  "slog3": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (S-Log3 encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (S-Log3 encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (S-Log3 encoded)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Sony S-Log3 / S-Gamut3 color space Sony's S-Log3 transfer over the S-Gamut3 primaries. Per-channel S-Log3 curve to scene-linear, then the S-Gamut3→XYZ(D65) matrix. Sony \"Technical Summary for S-Gamut3/S-Log3\". (S-Gamut3.Cine uses different primaries — not this space.)"
  },
  "smpte-240m": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "SMPTE-240M color space The interim HDTV standard (SMPTE 240M, 1988-1998) that preceded Rec.709. Shares the SMPTE-C / SMPTE 170M primaries (same matrix as `smpte-c`) but defines its own formal OETF (a 0.45-power curve with a linear toe), distinct from BT.601/709. D65."
  },
  "smpte-c": {
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "SMPTE-C color space The 525-line NTSC broadcast standard (SMPTE 170M / SMPTE-C primaries, D65) with the ITU-R BT.601 transfer function (identical curve to BT.709/rec709). Per-channel inverse-OETF to linear, then the SMPTE-C→XYZ(D65) matrix."
  },
  "sucs": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -50,
        "max": 50,
        "name": "Red-Green"
      },
      {
        "symbol": "b",
        "min": -50,
        "max": 50,
        "name": "Yellow-Blue"
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
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "sUCS color space The uniform colour space of sCAM, the \"simple\" colour-appearance model (Li & Luo 2024) — claims CAM16-UCS-class uniformity from a far simpler pipeline: XYZ→LMS (HPE-like), a signed power 0.43, then a fixed opponent mix to I (lightness) and a, b. D65, I≈100 at white. A lighter-weight alternative to cam16-ucs / oklab."
  },
  "transfers": {
    "description": "Standard opto-electronic transfer functions (gamma / OETF-EOTF curves), shared by the RGB working spaces that encode with the same curve. Each is sign-extended (odd-symmetric) so out-of-gamut negatives survive a round-trip. The matrices and primaries stay in the per-space files; only the 1-D transfer lives here."
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "TSL color space (Tint, Saturation, Lightness) Simple cylindrical representation of RGB Derived from RGB for image analysis"
  },
  "ucs": {
    "channels": [
      {
        "symbol": "U",
        "min": 0,
        "max": 64,
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
        "max": 160,
        "name": "W (related to brightness)"
      }
    ],
    "range": [
      [
        0,
        64
      ],
      [
        0,
        100
      ],
      [
        0,
        160
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1960 UCS (Uniform Color Space) Obsolete color space predecessor to CIELUV Historical reference for color science"
  },
  "uv": {
    "channels": [
      {
        "symbol": "u",
        "min": 0,
        "max": 0.7,
        "name": "u' chromaticity"
      },
      {
        "symbol": "v",
        "min": 0,
        "max": 0.6,
        "name": "v' chromaticity"
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
        0.7
      ],
      [
        0,
        0.6
      ],
      [
        0,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1976 UCS (u'v') color space The modern uniform-chromaticity diagram (CIE 15:2004 §8.1 / ISO 11664-5): the dominant chromaticity space for LED binning (ANSI C78.377), display white-point tolerancing (Δu'v'), CCT / Planckian-locus work and colorimeter reporting. The v' axis is 1.5× the CIE 1960 v (the library's `ucs`). Stored with luminance Y as an invertible u'v'Y triplet (analogous to xyY)."
  },
  "uvw": {
    "channels": [
      {
        "symbol": "U",
        "min": -85,
        "max": 175,
        "name": "U* chrominance"
      },
      {
        "symbol": "V",
        "min": -90,
        "max": 75,
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
        -85,
        175
      ],
      [
        -90,
        75
      ],
      [
        -17,
        100
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1964 U*V*W* color space Obsolete perceptual space, predecessor to CIELUV. Built on the CIE 1960 UCS chromaticity (u′, v′): W* = 25·Y^(1/3) − 17        (Y in 0-100) U* = 13·W*·(u′ − u′n) V* = 13·W*·(v′ − v′n) where (u′n, v′n) is the reference-white chromaticity. At an undefined chromaticity (black, or W*=0) the color is achromatic, so U* = V* = 0."
  },
  "vlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (V-Log encoded)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (V-Log encoded)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (V-Log encoded)"
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
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Panasonic V-Log / V-Gamut color space Panasonic's V-Log transfer over the V-Gamut primaries (VARICAM; not the V-Log L variant). Per-channel V-Log curve to scene-linear, then V-Gamut→XYZ(D65). Panasonic V-Log/V-Gamut Reference Manual (2014)."
  },
  "xvycc": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 255,
        "name": "Luma (extended)"
      },
      {
        "symbol": "Cb",
        "min": 0,
        "max": 255,
        "name": "Blue-difference chroma"
      },
      {
        "symbol": "Cr",
        "min": 0,
        "max": 255,
        "name": "Red-difference chroma"
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "https://en.wikipedia.org/wiki/XvYCC Sony xvYCC (extended-gamut YCC) is an extended-gamut version of YCbCr **Important**: In this library, xvYCC uses identical formulas to YPbPr/YCbCr because all values are normalized to 0-1 range. The conceptual difference is: - YCbCr (traditional): Limited to \"legal\" range (16-235 for Y in 8-bit) - YPbPr: Analog version, typically full range [0,1] - xvYCC: Explicitly extended range, allows values beyond normal gamut Since this library normalizes all spaces to [0,1] and doesn't enforce range limits, xvYCC is functionally identical to YPbPr here. The separate implementation exists for semantic clarity and compatibility. It uses the same transformation matrices as: SD: ITU-R BT.601 HD: ITU-R BT.709 Formulas (identical to YPbPr): Forward (RGB → xvYCC): Y  = Kr*R + (1-Kr-Kb)*G + Kb*B Cb = 0.5*(B-Y)/(1-Kb) Cr = 0.5*(R-Y)/(1-Kr) Inverse (xvYCC → RGB): R = Y + 2*Cr*(1-Kr) B = Y + 2*Cb*(1-Kb) G = (Y - Kr*R - Kb*B)/(1-Kr-Kb) Where for BT.709: Kr=0.2126, Kb=0.0722 for BT.601: Kr=0.299,  Kb=0.114 References: - https://en.wikipedia.org/wiki/XvYCC - https://en.wikipedia.org/wiki/YCbCr - IEC 61966-2-4:2006 (xvYCC specification)"
  },
  "xyb": {
    "channels": [
      {
        "symbol": "X",
        "min": -0.0154,
        "max": 0.0281,
        "name": "Red-green (L−M)"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 0.8453,
        "name": "Luminance (L+M)"
      },
      {
        "symbol": "B",
        "min": -0.2778,
        "max": 0.388,
        "name": "Blue (S)"
      }
    ],
    "range": [
      [
        -0.0154,
        0.0281
      ],
      [
        0,
        0.8453
      ],
      [
        -0.2778,
        0.388
      ]
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "XYB color space — JPEG XL Image Coding System. An LMS-based model inspired by the human visual system for perceptually uniform quantization (gamma 3). Implementation based on culori. (JPEG XL Whitepaper: https://ds.jpeg.org/whitepapers/jpeg-xl-whitepaper.pdf)"
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "xyY color space Chromaticity coordinates (x, y) with luminance (Y) Useful for color matching and display calibration"
  },
  "xyz-abs-d65": {
    "channels": [
      {
        "symbol": "Xa",
        "min": 0,
        "max": 9504.6,
        "name": "Absolute X (cd/m²)"
      },
      {
        "symbol": "Ya",
        "min": 0,
        "max": 10000,
        "name": "Absolute Y (cd/m²)"
      },
      {
        "symbol": "Za",
        "min": 0,
        "max": 10888.3,
        "name": "Absolute Z (cd/m²)"
      }
    ],
    "range": [
      [
        0,
        9504.6
      ],
      [
        0,
        10000
      ],
      [
        0,
        10888.3
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Absolute XYZ (D65) — CIE XYZ in absolute luminance (cd/m²), where the relative XYZ hub's Y=100 corresponds to 203 cd/m² (HDR reference white, ITU-R BT.2100)."
  },
  "xyz-d50": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 96.42,
        "name": "X (D50)"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Y (D50)"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 82.51,
        "name": "Z (D50)"
      }
    ],
    "range": [
      [
        0,
        96.42
      ],
      [
        0,
        100
      ],
      [
        0,
        82.51
      ]
    ],
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE XYZ with the D50 white point (ICC profile connection space). Bradford-adapted from the D65 `xyz` hub."
  },
  "xyz": {
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "YCbCr color space Digital video color format used in broadcasting. Limited (studio) range, ITU-R BT.709 coefficients (Kr=0.2126, Kb=0.0722) — the HD default. For SD use BT.601; full-range 601 is the `jpeg` space."
  },
  "yccbccrc": {
    "channels": [
      {
        "symbol": "Yc",
        "min": 0,
        "max": 1,
        "name": "Constant-luminance luma"
      },
      {
        "symbol": "Cbc",
        "min": -0.5,
        "max": 0.5,
        "name": "Blue-difference chroma"
      },
      {
        "symbol": "Crc",
        "min": -0.5,
        "max": 0.5,
        "name": "Red-difference chroma"
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
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YcCbcCrc color space — ITU-R BT.2020 / BT.2100 constant-luminance (CL) system. Unlike the non-constant-luminance Y'CbCr, the luma Yc is formed in LINEAR light (Yc = Kr·R + Kg·G + Kb·B) then OETF-encoded, and the chroma differences use the BT.2020 piecewise normalisation. Operates on linear Rec.2020 RGB."
  },
  "ycgco": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma"
      },
      {
        "symbol": "Cg",
        "min": -0.5,
        "max": 0.5,
        "name": "Green-magenta chroma"
      },
      {
        "symbol": "Co",
        "min": -0.5,
        "max": 0.5,
        "name": "Orange-blue chroma"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "YDbDr color space SECAM television chrominance encoding Perceptually more uniform than YUV"
  },
  "yes": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luminance"
      },
      {
        "symbol": "E",
        "min": -0.5,
        "max": 0.5,
        "name": "E-factor (red-green)"
      },
      {
        "symbol": "S",
        "min": -0.5,
        "max": 0.5,
        "name": "S-factor"
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
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
    "referred": "display",
    "dynamic": "sdr",
    "description": "YUV color space Television analog encoding separating luma from chroma Used in PAL/SECAM broadcast standards"
  },
  "zcam": {
    "channels": [
      {
        "symbol": "J",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 100,
        "name": "Colourfulness"
      },
      {
        "symbol": "h",
        "min": 0,
        "max": 360,
        "name": "Hue angle (degrees)"
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
        360
      ]
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ZCAM color space (Safdar, Hardeberg & Luo 2021) The HDR-native colour appearance model — the CAM16 analogue built on the absolute Izazbz substrate, predicting lightness J, colourfulness M and hue h (plus brightness, vividness, blackness, whiteness in the full model). Operates on ABSOLUTE XYZ. CAUTION — like cam16/hellwig2022 the viewing conditions are baked, here to the canonical ZCAM reference example: white XYZ_w = [256,264,202], L_A = 264 cd/m², Y_b = 100, average surround. Input XYZ is absolute (not the library's relative 0-100); under these conditions XYZ_w=[256,264,202] → J≈100. Chaining from rgb maps a relative colour into this absolute frame, so the result is \"ZCAM of a dim sample\"."
  }
}

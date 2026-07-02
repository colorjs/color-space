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
    "refs": [
      "https://en.wikipedia.org/wiki/Adobe_RGB_color_space"
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
    "refs": [
      "https://en.wikipedia.org/wiki/Adobe_RGB_color_space"
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
    "refs": [
      "https://docs.acescentral.com/specifications/aces2065-1/"
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
    "refs": [
      "https://docs.acescentral.com/specifications/acescc/"
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
    "refs": [
      "https://docs.acescentral.com/specifications/acescct/"
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
    "refs": [
      "https://docs.acescentral.com/specifications/acescg/"
    ],
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACEScg color space Academy Color Encoding System linear working space (AP1 primaries) for CGI / compositing. Scene-referred, unbounded."
  },
  "acesproxy": {
    "channels": [
      {
        "symbol": "R",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Red (ACESproxy)"
      },
      {
        "symbol": "G",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Green (ACESproxy)"
      },
      {
        "symbol": "B",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Blue (ACESproxy)"
      }
    ],
    "range": [
      [
        0.0626,
        0.9189
      ],
      [
        0.0626,
        0.9189
      ],
      [
        0.0626,
        0.9189
      ]
    ],
    "refs": [
      "https://docs.acescentral.com/specifications/acesproxy/"
    ],
    "illuminant": "D60",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACESproxy color space The Academy's on-set transport encoding (S-2013-001): AP1 linear light mapped to 10-bit legal-range code values — CV = round((log2(lin) + 2.5)·50 + 425) clamped to [64, 940] — expressed here as CV/1023 floats. Rounding to integral code values is part of the standard (it rides SDI cables), so round-trips quantise to ~1/100 stop. Not for storage or compositing — use ACEScc/ACEScct. 18% grey → 426/1023 ≈ 0.4164."
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
    "refs": [
      "https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x",
      "https://opg.optica.org/josa/abstract.cfm?uri=josa-32-3-168"
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
    "refs": [
      "http://www.brucelindbloom.com/WorkingSpaceInfo.html"
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
    "refs": [
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/apple_log_profile.py"
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
    "refs": [
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/blackmagic_design.py"
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
    "refs": [
      "https://doi.org/10.1002/col.20227"
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
    "refs": [
      "https://doi.org/10.1002/col.20227"
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
    "refs": [
      "https://doi.org/10.1002/col.20227"
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
    "refs": [
      "https://doi.org/10.1002/col.22131"
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
    "refs": [
      "https://doi.org/10.1002/col.22131"
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
    "refs": [
      "https://doi.org/10.1002/col.22131"
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
    "refs": [
      "https://doi.org/10.1002/col.22131"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIE_1931_color_space"
    ],
    "illuminant": "E",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE RGB (1931) color space The original Wright-Guild experimental RGB whose colour-matching functions defined CIE XYZ — monochromatic primaries at 700 / 546.1 / 435.8 nm, equal-energy white E, linear (no gamma). The ancestor of all RGB spaces. Matrix derived from the primaries (Lindbloom method) and Bradford-adapted from E to the library's D65 XYZ."
  },
  "cie": {
    "refs": [
      "http://www.brucelindbloom.com/index.html?LContinuity.html"
    ],
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
    "refs": [
      "https://doi.org/10.1002/col.10125"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html"
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
    "refs": [
      "https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf"
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
    "refs": [
      "https://en.wikipedia.org/wiki/Log_profile"
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
    "refs": [
      "https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CMY_color_model"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#device-cmyk"
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
    "refs": [
      "https://onlinelibrary.wiley.com/doi/10.1002/col.5080050210"
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
    "refs": [
      "https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "Cubehelix color space Perceptually uniform single-hue color scheme Designed for scientific visualization Reference: Green, D. A. (2011) A colour scheme for the display of astronomical intensity images"
  },
  "davinci": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (DaVinci Intermediate)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (DaVinci Intermediate)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (DaVinci Intermediate)"
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
    "refs": [
      "https://documents.blackmagicdesign.com/InformationNotes/DaVinci_Resolve_17_Wide_Gamut_Intermediate.pdf"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "DaVinci Wide Gamut / DaVinci Intermediate color space Blackmagic's DaVinci Resolve default color-managed working space: the DaVinci Intermediate log curve over DaVinci Wide Gamut primaries (D65). Matrices are the exact values from the Blackmagic whitepaper. 18% grey → 0.3360."
  },
  "dcdm": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 1,
        "name": "X′ (gamma-2.6 X)"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Y′ (gamma-2.6 Y)"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 1,
        "name": "Z′ (gamma-2.6 Z)"
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
    "refs": [
      "https://ieeexplore.ieee.org/document/7290729"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DCDM X′Y′Z′ color space The Digital Cinema Distribution Master encoding inside every DCP: gamma-2.6-encoded CIE XYZ, X′ = (X/52.37)^(1/2.6) (SMPTE ST 428-1), with the SMPTE ST 431-1 reference projector white — relative Y=100 ≡ 48 cd/m² — baked in, so D65 white → ≈[0.948, 0.967, 0.976]. Negative XYZ clamps to 0."
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
    "refs": [
      "https://en.wikipedia.org/wiki/DCI-P3"
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
    "refs": [
      "https://doi.org/10.1002/col.10118"
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
    "refs": [
      "https://de.wikipedia.org/wiki/DIN99-Farbraum"
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
    "refs": [
      "https://en.wikipedia.org/wiki/DIN99"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99o LCh color space Cylindrical (polar) form of DIN99o Lab. Defined relative to din99o-lab; everything else is reached by chaining through it."
  },
  "dkl": {
    "channels": [
      {
        "symbol": "Ach",
        "min": -100,
        "max": 100,
        "name": "Achromatic (luminance)"
      },
      {
        "symbol": "RG",
        "min": -100,
        "max": 100,
        "name": "Red-Green (L−M)"
      },
      {
        "symbol": "YV",
        "min": -100,
        "max": 100,
        "name": "Tritan (S−(L+M))"
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
        -100,
        100
      ]
    ],
    "refs": [
      "https://doi.org/10.1113/jphysiol.1984.sp015499"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DKL color space (Derrington-Krauskopf-Lennie) The cardinal-axis space of human colour vision (Derrington, Krauskopf & Lennie 1984; Brainard 1996) — the three directions the LGN/early visual system encodes, relative to an adapting white (here D65): an achromatic luminance axis (L+M), an isoluminant red-green axis (L−M), and a tritan blue-yellow axis (S−(L+M)). Built on Smith-Pokorny cones; D65 → origin [0,0,0]. (Un-normalised cardinal form; sources differ on axis scaling — normalise to your stimulus set if needed.)"
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
    "refs": [
      "https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf"
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
    "refs": [
      "https://en.wikipedia.org/wiki/Dominant_wavelength",
      "https://cie.co.at/publications/colorimetry-4th-edition"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE DSH — dominant wavelength / saturation (excitation purity) / hue Helmholtz coordinates of CIE 1931 xy chromaticity: a polar representation where the dominant wavelength is the hue analog (so DSH's \"H\" IS the dominant wavelength `d` — they are the same coordinate) and excitation purity is the saturation analog. The third stored channel is luminance Y, making the transform an invertible wrapped xyY. Negative `d` is a complementary wavelength: non-spectral purples have no dominant wavelength, so the line from white is reversed onto the opposite locus arc. Forward intersects the ray (D65 white -> colour) with the CIE 1931 2° spectral locus (embedded at 5 nm; finer sampling shifts the wavelength by <0.1 nm). Inverse is exact: colour = white + purity·(locus(d) - white)."
  },
  "erimm": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (ERIMM)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (ERIMM)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (ERIMM)"
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
    "refs": [
      "https://www.iso.org/standard/58005.html"
    ],
    "illuminant": "D50",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ERIMM RGB color space Extended Reference Input Medium Metric RGB (ISO 22028-3): the log-encoded, extended-dynamic-range member of the ROMM/RIMM family — scene exposures from 0.001 to 316.2 (relative to diffuse white 1.0) over the ROMM (ProPhoto) primaries, D50. A transfer over `prophoto-linear`, whose values it extends far past 1. Linear toe below e·0.001. 18% grey → 0.4101."
  },
  "filmicpro": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Filmic Pro 6)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Filmic Pro 6)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Filmic Pro 6)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmicPro6.html"
    ],
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Filmic Pro 6 Log color space The Filmic Pro v6 iOS log curve — y = 0.371(√t + 0.28257·ln t + 1.69542), a mixed square-root/log law with y(1) = 1 by construction. No closed-form inverse: decoding runs a Newton solve (colour-science interpolates a LUT). Linear input clamps at the value encoding to 0, keeping black finite. No published gamut — a transfer over `lrgb`. 18% grey → 0.6066."
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
    "refs": [
      "https://dl.fujifilm-x.com/support/lut/F-Log_DataSheet_E_Ver.1.1.pdf"
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
    "refs": [
      "https://dl.fujifilm-x.com/support/lut/F-Log2_DataSheet_E_Ver.1.0.pdf"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#grays"
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
    "refs": [
      "https://github.com/Qix-/color-convert"
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
    "refs": [
      "http://www.chilliant.com/rgb2hsv.html"
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
    "refs": [
      "https://material.io/blog/science-of-color-design"
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
    "refs": [
      "http://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCY color space (Hue, Chroma, Luma) Luma-based cylindrical model for shader programming (Kuzma Shapran / Chilliant). Unlike HSI/HSL, the Y channel is the color's actual Rec.601 luma, and chroma is normalized against the luma the hue can carry — so equal Y means equal brightness. http://chilliant.blogspot.com/2012/08/rgbhcy-in-hlsl.html"
  },
  "hdr-cie-lab": {
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
        "name": "Red-Green"
      },
      {
        "symbol": "b",
        "min": -100,
        "max": 100,
        "name": "Yellow-Blue"
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
    "refs": [
      "https://library.imaging.org/cic/articles/18/1/art00057"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "hdr-CIELAB color space Fairchild & Wyble (2010/2011) HDR extension of CIELAB: the L* cube root is replaced by a Michaelis-Menten lightness adapting to scene luminance, applied to X/Xn, Y/Yn, Z/Zn. Baked to the standard surround Y_s=0.2 / Y_abs=100 cd/m² (Fairchild 2011), giving ε=0.4738510. D65."
  },
  "hdr-ipt": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "P",
        "min": -100,
        "max": 100,
        "name": "Red-Green"
      },
      {
        "symbol": "T",
        "min": -100,
        "max": 100,
        "name": "Yellow-Blue"
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
    "refs": [
      "https://library.imaging.org/cic/articles/18/1/art00057"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "hdr-IPT color space Fairchild & Wyble (2010/2011) HDR extension of IPT: the same IPT cone matrices, but the fixed 0.43 power is replaced by a Michaelis-Menten lightness whose exponent adapts to scene luminance. Baked to the standard surround Y_s=0.2 / Y_abs=100 cd/m² (Fairchild 2011), giving ε=0.4820209."
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
    "refs": [
      "https://doi.org/10.1002/col.22792"
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
    "refs": [
      "https://www.hsluv.org/",
      "https://github.com/hsluv/hsluv"
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
    "refs": [
      "https://en.wikipedia.org/wiki/HSL_and_HSV"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#the-hsl-notation"
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
    "refs": [
      "https://www.hsluv.org/",
      "https://github.com/hsluv/hsluv"
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
    "refs": [
      "http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428"
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
    "refs": [
      "https://alienryderflex.com/hsp.html"
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
    "refs": [
      "https://en.wikipedia.org/wiki/HSL_and_HSV"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#the-hwb-notation"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "HWB color space (Hue, Whiteness, Blackness) Cylindrical representation using whiteness and blackness"
  },
  "icacb": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 1,
        "name": "Intensity"
      },
      {
        "symbol": "Ca",
        "min": -0.5,
        "max": 0.5,
        "name": "Red-Green"
      },
      {
        "symbol": "Cb",
        "min": -0.5,
        "max": 0.5,
        "name": "Yellow-Blue"
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
    "refs": [
      "https://github.com/colour-science/colour/blob/develop/colour/models/icacb.py"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ICaCb color space Fröhlich (2017) HDR opponent space: an ICtCp-style encoding tuned for JND uniformity and hue linearity, using a different XYZ→LMS matrix and a PQ (ST 2084) non-linearity before the opponent mix. I = intensity, Ca/Cb = chroma."
  },
  "ictcp": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 1,
        "name": "Intensity (lightness)"
      },
      {
        "symbol": "Ct",
        "min": -0.5,
        "max": 0.5,
        "name": "Tritan chroma (blue-yellow)"
      },
      {
        "symbol": "Cp",
        "min": -0.5,
        "max": 0.5,
        "name": "Protanopia chroma (red-green)"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
    ],
    "referred": "display",
    "dynamic": "hdr",
    "description": "ICtCp color space HDR perceptual color space for ITU-R BT.2100 Based on PQ transfer function for HDR video"
  },
  "igpgtg": {
    "channels": [
      {
        "symbol": "Ig",
        "min": 0,
        "max": 1,
        "name": "Intensity"
      },
      {
        "symbol": "Pg",
        "min": -1,
        "max": 1,
        "name": "Protan (red-green)"
      },
      {
        "symbol": "Tg",
        "min": -1,
        "max": 1,
        "name": "Tritan (yellow-blue)"
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
    "refs": [
      "https://doi.org/10.2352/issn.2169-2629.2020.28.13"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "IgPgTg color space (Hensley & Fairchild 2020) An IPT-structured uniform space fitted with an independent gamut-relative LMS normalisation: XYZ → bespoke LMS, per-cone scaling [18.36, 21.46, 19435] and a 0.427 power, then an opponent matrix to Ig (intensity) / Pg (protan) / Tg (tritan). Competitive hue uniformity with CAM16-UCS at a fraction of the math."
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
    "refs": [
      "https://doi.org/10.2352/CIC.1998.6.1.art00003"
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
    "refs": [
      "https://doi.org/10.1364/OE.25.015131"
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
    "refs": [
      "https://www.itu.int/rec/T-REC-T.871"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "az",
        "min": -0.5,
        "max": 0.5,
        "name": "Green-Red axis"
      },
      {
        "symbol": "bz",
        "min": -0.5,
        "max": 0.5,
        "name": "Blue-Yellow axis"
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
    "refs": [
      "https://doi.org/10.1364/OE.25.015131"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "Cz",
        "min": 0,
        "max": 0.5,
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
        1
      ],
      [
        0,
        0.5
      ],
      [
        0,
        360
      ]
    ],
    "refs": [
      "https://www.w3.org/TR/css-color-hdr/#JzCzHz"
    ],
    "referred": "display",
    "dynamic": "hdr",
    "description": "JzCzHz color space Cylindrical variant of JzAzBz for HDR Uses chroma and hue instead of rectangular coordinates"
  },
  "kelvin": {
    "channels": [
      {
        "symbol": "T",
        "min": 1000,
        "max": 25000,
        "name": "Correlated color temperature (kelvin)"
      }
    ],
    "range": [
      [
        1000,
        25000
      ]
    ],
    "refs": [
      "https://en.wikipedia.org/wiki/Planckian_locus",
      "https://doi.org/10.1002/col.5080170211"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Kelvin (correlated color temperature) color space Maps a colour temperature in kelvin to/from a point on the Planckian (black-body) locus — \"2700 K warm candle … 6500 K cool daylight\", the white-balance axis. CCT→xy uses Krystek's (1985) rational approximation of the locus; xy→CCT uses McCamy's (1992) cubic. A 1-channel space (like `gray`); the inverse returns the nearest CCT, so it round-trips on the locus but is lossy for off-locus colours."
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIELAB_color_space"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#lab-colors"
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
    "refs": [
      "https://en.wikipedia.org/wiki/Hunter_Lab"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "Lab Hunter color space Alternative Lab definition by Richard Hunter Optimized for reflectance, less uniform than CIE Lab"
  },
  "lalphabeta": {
    "channels": [
      {
        "symbol": "l",
        "min": -10.4,
        "max": 0,
        "name": "log-luminance"
      },
      {
        "symbol": "alpha",
        "min": -3,
        "max": 3,
        "name": "Yellow-Blue"
      },
      {
        "symbol": "beta",
        "min": -3,
        "max": 3,
        "name": "Red-Green"
      }
    ],
    "range": [
      [
        -10.4,
        0
      ],
      [
        -3,
        3
      ],
      [
        -3,
        3
      ]
    ],
    "refs": [
      "https://doi.org/10.1109/38.946629"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "lαβ color space (Ruderman 1998) The decorrelated log-cone space behind classic colour transfer (Reinhard et al. 2001): device RGB → LMS cones (paper eq. 4), log10, then the orthogonal l (achromatic) / α (yellow-blue) / β (red-green) rotation (eq. 6). Statistics of natural scenes are nearly independent across these axes, so moving means/variances per axis transfers one image's colour mood onto another. Inverses use the exact matrix inversions (the paper prints rounded ones); LMS is floored at 1e-6 so black stays finite."
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
    "refs": [
      "https://cie.co.at/publications/colorimetry-4th-edition"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#cie-lab"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "LCh(uv) color space Cylindrical CIE LUV with lightness, chroma, and hue"
  },
  "llog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (L-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (L-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (L-Log)"
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
    "refs": [
      "https://leica-camera.com/sites/default/files/2021-11/L-Log_Reference_Manual_EN.pdf"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Leica L-Log color space Leica's L-Log (SL2-S onward): linear toe below 0.006 then c·log10(d·x+e)+f, recorded in a BT.2020 container per the L-Log reference manual — so a transfer over `rec2020-linear`, like `nlog`. 18% grey → 0.4353."
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
    "refs": [
      "https://en.wikipedia.org/wiki/LMS_color_space"
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
    "refs": [
      "https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "RED Log3G10 / REDWideGamutRGB color space RED's Log3G10 (v3) transfer over the REDWideGamutRGB primaries. Per-channel Log3G10 curve to scene-linear, then RWG→XYZ(D65). RED whitepaper 915-0187 Rev-C."
  },
  "log3g12": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Log3G12)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Log3G12)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Log3G12)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log3G12.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "RED Log3G12 / REDWideGamutRGB color space RED's Log3G12 — Log3G10's predecessor with 12 stops above 18% grey (grey → exactly 1/3) — over the same REDWideGamutRGB primaries as `log3g10`. Sign-symmetric, so negative scene values encode continuously."
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
    "refs": [
      "https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf"
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
    "refs": [
      "https://www.arri.com/resource/blob/278790/dc29f7399c1dc9553d329e27f1409a89/2022-05-arri-logc4-specification-data.pdf"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIELUV"
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
    "refs": [
      "https://doi.org/10.1364/JOSA.69.001183"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "MacLeod-Boynton ls chromaticity color space The cone-excitation chromaticity diagram of vision science (MacLeod & Boynton 1979): a constant-luminance plane where l = L/(L+M) and s = S/(L+M) on the Smith-Pokorny (1975) cone fundamentals, scaled so L+M = Y (luminance). The foundation of the DKL cardinal-axis space and of chromatic-discrimination work. Stored with the MB luminance (L+M ≈ Y) as a third channel for invertibility."
  },
  "milog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Mi-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Mi-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Mi-Log)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_MiLog.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Xiaomi Mi-Log color space Xiaomi's Mi-Log profile (14/15 Ultra) — the Apple Log curve shape (quadratic toe, log2 body) with Xiaomi's constants — recorded in a BT.2020 container, so a transfer over `rec2020-linear` like `applelog`. 18% grey → 0.4535."
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
    "refs": [
      "https://www.rit.edu/science/munsell-color-science-lab-educational-resources",
      "https://onlinelibrary.wiley.com/doi/10.1002/col.20715"
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
    "refs": [
      "https://download.nikonimglib.com/archive3/hDCmK00m9JDI03RPruD74xpoU905/N-Log_Specification_(En)01.pdf"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.470"
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
    "refs": [
      "https://doi.org/10.1016/0146-664X(80)90047-7"
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
    "refs": [
      "https://bottosson.github.io/posts/okhsv/"
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
    "refs": [
      "https://bottosson.github.io/posts/okhsv/"
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
    "refs": [
      "https://bottosson.github.io/posts/okhsv/"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -0.4,
        "max": 0.4,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -0.4,
        "max": 0.4,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.4,
        0.4
      ],
      [
        -0.4,
        0.4
      ]
    ],
    "refs": [
      "https://bottosson.github.io/posts/oklab/"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 0.4,
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
        1
      ],
      [
        0,
        0.4
      ],
      [
        0,
        360
      ]
    ],
    "refs": [
      "https://www.w3.org/TR/css-color-4/#ok-lab"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "a",
        "min": -0.4,
        "max": 0.4,
        "name": "Green-Red axis"
      },
      {
        "symbol": "b",
        "min": -0.4,
        "max": 0.4,
        "name": "Blue-Yellow axis"
      }
    ],
    "range": [
      [
        0,
        1
      ],
      [
        -0.4,
        0.4
      ],
      [
        -0.4,
        0.4
      ]
    ],
    "refs": [
      "https://bottosson.github.io/posts/colorpicker/"
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
        "max": 1,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 0.4,
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
        1
      ],
      [
        0,
        0.4
      ],
      [
        0,
        360
      ]
    ],
    "refs": [
      "https://bottosson.github.io/posts/colorpicker/"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkLrch color space Cylindrical variant of OkLrab Uses chroma and hue for intuitive color selection"
  },
  "olog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (O-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (O-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (O-Log)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_OPPOOLog.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "OPPO O-Log color space OPPO's O-Log profile (Find X8 Ultra era) — a pure natural-log curve P = 0.139·ln(R + 0.019) + 0.614 — recorded in a BT.2020 container, so a transfer over `rec2020-linear`. 18% grey → 0.3896."
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
    "refs": [
      "https://doi.org/10.1364/JOSA.64.001691"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#predefined-display-p3"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#predefined-display-p3"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.470"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "PAL / SECAM RGB color space The European 625-line analogue-TV primaries (EBU Tech 3213 / BT.470 B,G), D65, γ≈2.2. Formally distinct from Rec.709 — the green primary sits at (0.29, 0.60) vs sRGB's (0.30, 0.60) — so it is the correct gamut for archival PAL/SECAM content. Matrix derived from the primaries."
  },
  "panalog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Panalog)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Panalog)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Panalog)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Panalog.html"
    ],
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Panalog color space Panavision's Genesis-era Cineon-style log (black 64 / white 681 over 10 bits, gain 444), per channel over linear-light RGB. No published native gamut — a transfer over `lrgb` (linear sRGB), like `cineon`. 18% grey → 0.3746."
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
    "refs": [
      "https://en.wikipedia.org/wiki/Photo_CD",
      "https://www.ilkeratalay.com/colorspacesfaq.php"
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
    "refs": [
      "https://arxiv.org/abs/2012.07653"
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
    "refs": [
      "https://www.color.org/ROMMRGB.pdf"
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
    "refs": [
      "https://www.color.org/ROMMRGB.pdf"
    ],
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "ProPhoto RGB color space Largest gamut RGB color space designed for professional photography References D50 white point"
  },
  "protune": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (Protune)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (Protune)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (Protune)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Protune.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "GoPro Protune color space GoPro's Protune flat profile — y = ln(x·112 + 1)/ln(113) — over the Protune Native primaries (D65). 18% grey → 0.6456."
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
    "refs": [
      "https://en.wikipedia.org/wiki/RAL_colour_standard",
      "https://www.freiefarbe.de/en/colour-atlas/"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2020"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2020"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.709"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Rec. 709 color space ITU-R BT.709 HDTV: the same primaries and D65 white as sRGB, but with the BT.709 camera transfer function (OETF) instead of the sRGB curve. The linear light is identical to linear sRGB, so this connects through `lrgb`."
  },
  "redlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (REDLog)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (REDLog)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (REDLog)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLog.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "REDLog / REDcolor color space RED's original 10-bit log curve (RED One era, superseded by REDLogFilm and then Log3G10) over the REDcolor primaries (D65). Black offset 10^(−1023/511). 18% grey → 0.6376."
  },
  "redlogfilm": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (REDLogFilm)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (REDLogFilm)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (REDLogFilm)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLogFilm.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "REDLogFilm / REDcolor color space RED's Cineon-compatible log (exactly the Cineon curve, black 95 / white 685 over 10 bits) paired with the REDcolor primaries (D65) — colour-science's canonical pairing for the REDcolor generations. 18% grey → 0.4573, as Cineon."
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
    "refs": [
      "https://en.wikipedia.org/wiki/Chromaticity"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#numeric-srgb"
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
    "refs": [
      "https://www.iso.org/standard/58005.html"
    ],
    "illuminant": "D50",
    "observer": "2",
    "referred": "scene",
    "dynamic": "sdr",
    "description": "RIMM RGB color space Reference Input Medium Metric RGB (ANSI/I3A IT10.7466-2002 / ISO 22028-3) — the scene-referred counterpart of ROMM/ProPhoto, sharing its wide D50 primaries but carrying a BT.709-shaped OETF with extended exposure headroom (E_clip = 2.0, i.e. one stop above diffuse white, which encodes to 0.713). Matrix = ProPhoto primaries Bradford-adapted D50→D65."
  },
  "rlab": {
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
    "refs": [
      "https://doi.org/10.1002/(SICI)1520-6378(199610)21:5<338::AID-COL3>3.0.CO;2-Z"
    ],
    "illuminant": "A",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "RLAB color space (Fairchild 1996) An early colour appearance model for cross-media reproduction: von Kries adaptation through the Hunt-Pointer-Estévez cones, then a CIELAB-like opponent stage. Output (LR, aR, bR). Baked to the canonical reference conditions — adapting white = CIE Illuminant A [109.85,100,35.58], Y_n = 31.83 cd/m², σ = 1/2.3 (average), D = 1 (hard-copy) — so it reproduces the published worked example."
  },
  "ryb": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 255,
        "name": "Red pigment"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 255,
        "name": "Yellow pigment"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 255,
        "name": "Blue pigment"
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
    "refs": [
      "https://github.com/meodai/rybitten"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "RYB color space (red-yellow-blue artists' model) The traditional painter's wheel — where blue + yellow makes green, not the additive RGB grey. Implemented as Johannes Itten's chromatic cube (meodai/rybitten's `RYB_ITTEN`): the 8 RYB corners carry hand-picked RGB anchors and any colour is a smoothstep-eased trilinear blend between them. (0,0,0) = no pigment ≈ white, (255,255,255) = all three ≈ black. RGB→RYB is the numerical (Newton) inverse and best-fits colours outside the artists' gamut."
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
    "refs": [
      "https://en.wikipedia.org/wiki/ScRGB"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "scRGB color space Linear-light sRGB (same primaries and D65 white as sRGB/lrgb) with the extended IEC 61966-2-2 range [-0.5, 61439/8192] for wide-gamut and HDR signals. In float the values are identical to linear sRGB — only the declared range differs."
  },
  "slog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (S-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (S-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (S-Log)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Sony S-Log (1) / S-Gamut color space Sony's original S-Log curve (F35/F3 era, superseded by S-Log2/3) over S-Gamut — the same primaries as S-Gamut3, hence the same matrix as `slog2`/`slog3`. Uses the in-reflection (÷0.9) + 10-bit legal-range code-value convention. 18% grey → 0.3850."
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog2.html"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html"
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
    "refs": [
      "https://ieeexplore.ieee.org/document/7291461"
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
    "refs": [
      "https://en.wikipedia.org/wiki/SMPTE_C"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "SMPTE-C color space The 525-line NTSC broadcast standard (SMPTE 170M / SMPTE-C primaries, D65) with the ITU-R BT.601 transfer function (identical curve to BT.709/rec709). Per-channel inverse-OETF to linear, then the SMPTE-C→XYZ(D65) matrix."
  },
  "srlab2": {
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
    "refs": [
      "https://www.magnetkern.de/srlab2.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "SRLAB2 color space Jan Behrens' SRLAB2 — \"the best of CIELAB and CIECAM02\": CIECAM02's CAT02-style chromatic adaptation feeding a CIELAB-like cube-root opponent stage, giving better perceptual uniformity than CIELAB while staying simple and invertible. D65; white → L=100, a=b=0."
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
    "refs": [
      "https://doi.org/10.1364/OE.510196"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "sUCS color space The uniform colour space of sCAM, the \"simple\" colour-appearance model (Li & Luo 2024) — claims CAM16-UCS-class uniformity from a far simpler pipeline: XYZ→LMS (HPE-like), a signed power 0.43, then a fixed opponent mix to I (lightness) and a, b. D65, I≈100 at white. A lighter-weight alternative to cam16-ucs / oklab."
  },
  "tlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (T-Log)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (T-Log)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (T-Log)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_FilmLightTLog.html"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "FilmLight T-Log / E-Gamut color space FilmLight Baselight's working space: the T-Log quasi-log curve (pure log with a linear extension below zero) over E-Gamut primaries (D65). Constants derive from w=128 (linear value mapping to 1.0), g=16 (gradient at 0), o=0.075 (offset at 0). 18% grey → 0.3966."
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
    "refs": [
      "https://doi.org/10.1109/AFGR.2000.840612"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIE_1960_color_space"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIELUV#The_CIE_1976_UCS_diagram",
      "https://cie.co.at/publications/colorimetry-4th-edition"
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
    "refs": [
      "https://en.wikipedia.org/wiki/CIE_1964_color_space"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1964 U*V*W* color space Obsolete perceptual space, predecessor to CIELUV. Built on the CIE 1960 UCS chromaticity (u′, v′): W* = 25·Y^(1/3) − 17        (Y in 0-100) U* = 13·W*·(u′ − u′n) V* = 13·W*·(v′ − v′n) where (u′n, v′n) is the reference-white chromaticity. At an undefined chromaticity (black, or W*=0) the color is achromatic, so U* = V* = 0."
  },
  "viperlog": {
    "channels": [
      {
        "symbol": "R",
        "min": 0,
        "max": 1,
        "name": "Red (ViperLog)"
      },
      {
        "symbol": "G",
        "min": 0,
        "max": 1,
        "name": "Green (ViperLog)"
      },
      {
        "symbol": "B",
        "min": 0,
        "max": 1,
        "name": "Blue (ViperLog)"
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
    "refs": [
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_ViperLog.html"
    ],
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ViperLog color space The Thomson Viper FilmStream log — a pure log10 with no black offset (the flaw its successors fixed): y = (1023 + 500·log10(x))/1023, per channel over linear-light RGB (`lrgb`). Linear input clamps at 10^(−1023/500) ≈ 0.0090 — the value that encodes to code 0 — so black round-trips to that floor. 18% grey → 0.6360."
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
    "refs": [
      "https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Panasonic V-Log / V-Gamut color space Panasonic's V-Log transfer over the V-Gamut primaries (VARICAM; not the V-Log L variant). Per-channel V-Log curve to scene-linear, then V-Gamut→XYZ(D65). Panasonic V-Log/V-Gamut Reference Manual (2014)."
  },
  "wasm": {
    "description": "fast cbrt/pow, so even perceptual paths beat JS). Zero runtime dependency: the ~4.6 kB module is prebuilt and inlined (see scripts/build-wasm.js). Layout: interleaved 3-channel `Float64Array`, n pixels = 3n values [c0,c1,c2, c0,c1,c2, …]. Ranges match the scalar API (rgb 0-255, oklab native, xyz 0-100). Formulas mirror the scalar library and are pinned by test/wasm-batch.js. THE WIN IS ZERO-COPY. Keep the data in WASM memory: import { alloc, convert } from 'color-space/wasm' const buf = alloc(nPixels)      // WASM-backed Float64Array(n*3) — write rgb here // … fill buf … convert('rgb', 'oklab', nPixels)  // in place, no copy // … read buf (now oklab) … `convertBatch(from,to,src,dst,n)` is the drop-in convenience for existing JS buffers, but it copies in and out — fine for a chain of conversions, but a single convert + two copies may not beat JS. Prefer alloc()+convert() on the hot path."
  },
  "wavelength": {
    "channels": [
      {
        "symbol": "wl",
        "min": 380,
        "max": 700,
        "name": "Wavelength (nm; negative = complementary for purples)"
      }
    ],
    "range": [
      [
        380,
        700
      ]
    ],
    "refs": [
      "https://en.wikipedia.org/wiki/CIE_1931_color_space"
    ],
    "illuminant": "E",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Wavelength color space The colour of monochromatic (single-wavelength) light — the \"rainbow\" / spectral locus. Forward maps a wavelength in nm to CIE XYZ via the CIE 1931 2° colour-matching functions (embedded at 5 nm, scaled so the 555 nm peak luminance is Y=100). The inverse returns the dominant wavelength of any colour (shared with `dsh`), so it round-trips for spectral inputs and is lossy otherwise (purples → negative)."
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
    "refs": [
      "https://webstore.iec.ch/publication/6168"
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
    "refs": [
      "https://arxiv.org/abs/1908.03565"
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
    "refs": [
      "http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
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
    "refs": [
      "https://www.w3.org/TR/css-color-4/#predefined-xyz"
    ],
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE XYZ with the D50 white point (ICC profile connection space). Bradford-adapted from the D65 `xyz` hub."
  },
  "xyz": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 95.05,
        "name": "X (D65)"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Y (D65)"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 108.91,
        "name": "Z (D65)"
      }
    ],
    "range": [
      [
        0,
        95.05
      ],
      [
        0,
        100
      ],
      [
        0,
        108.91
      ]
    ],
    "refs": [
      "https://www.w3.org/TR/css-color-4/#cie-xyz"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE XYZ color space (D65) CIE 1931 tristimulus values — the foundation of colorimetry and the device-independent hub other spaces chain through. 0–100 scale (Y = 100 at white)."
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.709"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2020/en"
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
    "refs": [
      "https://www.itu.int/rec/T-REC-H.273"
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
    "refs": [
      "https://en.wikipedia.org/wiki/YDbDr"
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
    "refs": [
      "https://doi.org/10.2991/isaebd.2012.23"
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
    "refs": [
      "https://en.wikipedia.org/wiki/YIQ"
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
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.709"
    ],
    "referred": "display",
    "dynamic": "sdr",
    "description": "YPbPr color space Analog form of YCbCr used in component video ITU-R BT.709 standard for HD video"
  },
  "yrg": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luminance"
      },
      {
        "symbol": "r",
        "min": 0,
        "max": 1,
        "name": "Red chromaticity"
      },
      {
        "symbol": "g",
        "min": 0,
        "max": 1,
        "name": "Green chromaticity"
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
    "refs": [
      "https://doi.org/10.2352/issn.2169-2629.2019.27.38"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Yrg color space (Kirk 2019) Richard Kirk's (FilmLight) luminance/chromaticity space on CIE 2006 LMS cones with evenly-spaced Munsell hues — the chromaticity basis of darktable's colour-balance UCS. Y is cone-weighted luminance; r,g are affine cone chromaticities. The inverse here solves the affine map exactly (Kirk's published inverse uses rounded coefficients); black maps to the r,g origin offsets."
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
    "refs": [
      "https://en.wikipedia.org/wiki/YUV"
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
    "refs": [
      "https://doi.org/10.1364/OE.413659"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ZCAM color space (Safdar, Hardeberg & Luo 2021) The HDR-native colour appearance model — the CAM16 analogue built on the absolute Izazbz substrate, predicting lightness J, colourfulness M and hue h (plus brightness, vividness, blackness, whiteness in the full model). Operates on ABSOLUTE XYZ. CAUTION — like cam16/hellwig2022 the viewing conditions are baked, here to the canonical ZCAM reference example: white XYZ_w = [256,264,202], L_A = 264 cd/m², Y_b = 100, average surround. Input XYZ is absolute (not the library's relative 0-100); under these conditions XYZ_w=[256,264,202] → J≈100. Chaining from rgb maps a relative colour into this absolute frame, so the result is \"ZCAM of a dim sample\"."
  }
}

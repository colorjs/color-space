// Generated from JSDoc comments
// Run: node scripts/generate-meta.js > meta.js

export default {
  "a98rgb-linear": {
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
    "wiki": "https://en.wikipedia.org/wiki/Adobe_RGB_color_space",
    "year": 1998,
    "by": "Adobe Systems",
    "use": "Intermediate linear-light space for Adobe RGB color math; current, used before re-encoding to Adobe RGB's gamma curve.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Linear-light Adobe RGB — the gamma-free counterpart to Adobe RGB 1998, sharing its wider-than-sRGB primaries and D65 white point but with channel values directly proportional to light intensity. It serves as the intermediate space for accurate color math, before results are re-encoded with Adobe RGB's transfer curve."
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
    "wiki": "https://en.wikipedia.org/wiki/Adobe_RGB_color_space",
    "year": 1998,
    "by": "Adobe Systems",
    "use": "Wide-gamut photography and print working space; still common where sRGB's gamut clips CMYK-reproducible colors.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Adobe RGB — introduced by Adobe in 1998 as a wider-gamut alternative to sRGB, designed to reproduce more of the cyans and greens achievable in CMYK printing. It keeps sRGB's D65 white point but uses different primaries and a slightly different gamma, making it a longstanding standard working space in photography and print production, where sRGB's narrower gamut would clip too much color."
  },
  "aces2065-1": {
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
      "https://docs.acescentral.com/encodings/aces2065-1/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACES2065-1",
    "year": 2012,
    "by": "Academy (AMPAS)",
    "use": "Archival/interchange master encoding for finished ACES film and TV masters; current long-term storage format (SMPTE ST 2065-1).",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACES2065-1 — the Academy Color Encoding System's archival and interchange master format, built on the AP0 primaries, wide enough to enclose the entire visible gamut, with ACES's characteristic white point near D60. Like ACEScg it stores scene-referred light linearly, with values reaching far past nominal white to hold highlight detail for later grading or rendering. AMPAS designed it as the long-term, camera-agnostic exchange format for finished ACES masters, distinct from ACEScg's smaller AP1 primaries used for day-to-day rendering."
  },
  "acescc": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.35828683,
        "max": 1.4679963120447153,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": -0.35828683,
        "max": 1.4679963120447153,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": -0.35828683,
        "max": 1.4679963120447153,
        "name": "Blue"
      }
    ],
    "range": [
      [
        -0.35828683,
        1.4679963120447153
      ],
      [
        -0.35828683,
        1.4679963120447153
      ],
      [
        -0.35828683,
        1.4679963120447153
      ]
    ],
    "refs": [
      "https://docs.acescentral.com/encodings/acescc/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScc_&_ACEScct",
    "year": 2014,
    "by": "Academy (AMPAS)",
    "use": "Log2 color-grading working space in ACES post-production; current, though largely superseded by ACEScct on legacy grading control surfaces.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACEScc — the Academy Color Encoding System's logarithmic grading space, sharing the AP1 primaries with ACEScg but applying a pure log2 curve so exposure stops map to code values the way film-trained colorists expect. Unlike its sibling ACEScct, it has no linear toe near black, favoring mathematical purity over legacy grading-control behavior. It's used as the working space for color grading within ACES-managed post-production pipelines, ahead of final render back to ACEScg or ACES2065-1."
  },
  "acescct": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.358,
        "max": 1.468,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": -0.358,
        "max": 1.468,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": -0.358,
        "max": 1.468,
        "name": "Blue"
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
      "https://docs.acescentral.com/encodings/acescct/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScc_&_ACEScct",
    "year": 2016,
    "by": "Academy (AMPAS)",
    "use": "Log2-with-toe color-grading working space in ACES post-production; current default ACES grading space.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACEScct — the Academy Color Encoding System's other grading space, sharing ACEScg's AP1 primaries and ACEScc's log2 curve but adding a linear toe near black. That toe keeps traditional lift/gamma/gain color-corrector controls behaving the way colorists expect instead of exaggerating noise in the shadows, which is why ACEScct is generally preferred over ACEScc on control surfaces built for legacy grading tools."
  },
  "acescg": {
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
      "https://docs.acescentral.com/encodings/acescg/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScg",
    "year": 2014,
    "by": "Academy (AMPAS)",
    "use": "Linear render/composite working space for CGI and VFX; current standard in ACES-based VFX/animation pipelines.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACEScg — the Academy Color Encoding System's linear working space, defined by AMPAS in 2014 for CGI rendering and visual-effects compositing. Built on the wide AP1 primaries, it stores scene-referred light linearly rather than through a log curve, with headroom above white for highlights and light sources that would otherwise clip. It's the standard render and composite space in VFX and animation pipelines built around ACES."
  },
  "acesproxy": {
    "channels": [
      {
        "symbol": "R",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": 0.0626,
        "max": 0.9189,
        "name": "Blue"
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
      "https://docs.acescentral.com/encodings/acesproxy/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Academy_Color_Encoding_System",
    "year": 2013,
    "by": "Academy (AMPAS)",
    "use": "On-set monitoring and dailies preview encoding over SDI video; current but narrow-purpose, not used for storage or final grading.",
    "illuminant": "D60",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ACESproxy — the Academy's on-set monitoring and preview encoding, built to carry AP1 linear-light images as 10-bit legal-range code values over standard SDI video cables during production. It's a coarse, quantized encoding meant for on-set color decisions, dailies, and viewfinder-style preview — not for storage, compositing, or final grading, where ACEScc or ACEScct take over once footage reaches post."
  },
  "anlab": {
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
      "https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x",
      "https://opg.optica.org/josa/abstract.cfm?uri=josa-32-3-168"
    ],
    "year": 1942,
    "by": "Elliot Q. Adams (ext. Dorothy Nickerson, 1950)",
    "use": "Industrial color-difference measurement; historical, superseded by CIELAB and CIEDE2000.",
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "ANLAB is the chromatic-valence opponent space developed by Adams in 1942 and extended by Nickerson in 1950 — the direct ancestor of CIELAB. It builds lightness and two opponent color channels by running each adapted tristimulus ratio through the Munsell Renotation System's empirical value function and then taking differences between the results, the same opponent-color logic CIELAB later kept while replacing that iterative Munsell function with a closed-form cube root in 1976. ANLAB saw substantial industrial use for color-difference measurement in the decades before CIELAB standardized the field."
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
    "wiki": "https://en.wikipedia.org/wiki/RGB_color_spaces#Apple_RGB",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Apple RGB — the working space used by classic Mac OS, modeling the color response of Apple's original Trinitron CRT displays. Referenced to the D65 white point with a gamma of about 1.8, Apple's historic system default, it remained a common Photoshop working space for years and is still encountered in millions of legacy image files."
  },
  "applelog": {
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
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/apple_log_profile.py"
    ],
    "year": 2023,
    "by": "Apple",
    "use": "Cinema-oriented log capture on iPhone Pro for ProRes Log workflows; current native encoding since the iPhone 15 Pro.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Apple Log — Apple's log profile, introduced with the iPhone 15 Pro in 2023 for ProRes Log recording aimed at professional and cinematic video workflows, with tight integration into Final Cut Pro's color tools. Its curve opens with a quadratic toe near black before switching to a log2 highlight region, extending recordable dynamic range well beyond the phone's standard video profiles. It's defined over BT.2020 primaries, matching the wide-gamut sensors across the iPhone Pro line."
  },
  "bmdfilm": {
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
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/blackmagic_design.py"
    ],
    "year": 2020,
    "by": "Blackmagic Design",
    "use": "Log curve for Blackmagic cinema cameras shooting BRAW; current on URSA Mini Pro/Pocket Cinema Gen 5 color-science bodies.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Blackmagic Film — Blackmagic Design's log curve for its Generation 5 color science, which debuted on the URSA Mini Pro 12K and rolled out across the Pocket Cinema Camera line. It combines a linear toe near black with a natural-log highlight region to hold detail across the sensor's full dynamic range for grading in DaVinci Resolve. It pairs with the BMD Wide Gamut Gen5 primaries and ships inside Blackmagic RAW (BRAW) footage."
  },
  "cam02-lcd": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.20227"
    ],
    "year": 2006,
    "by": "Luo, Cui & Li",
    "use": "Uniform space for large color-difference/gamut-mapping work; largely superseded by CAM16-LCD.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-LCD is a variant of the CAM02-UCS uniform color space that Luo, Cui & Li tuned in 2006 specifically for LARGE color differences, rather than the small, fine-grained differences most difference formulas target. Like CAM02-UCS, it reprojects CIECAM02's lightness and colorfulness into a near-Euclidean, Cartesian layout, but with scaling calibrated against large-difference visual data. CAM16-LCD later carried the same large-difference calibration over to CAM16."
  },
  "cam02-scd": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.20227"
    ],
    "year": 2006,
    "by": "Luo, Cui & Li",
    "use": "Uniform space for small color-difference tolerance/QC judgments; largely superseded by CAM16-SCD.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-SCD is a variant of the CAM02-UCS uniform color space that Luo, Cui & Li tuned in 2006 specifically for SMALL color differences, such as those relevant to tolerance and quality-control judgments. Like CAM02-UCS, it reprojects CIECAM02's lightness and colorfulness into a near-Euclidean, Cartesian layout, but with scaling calibrated against small, near-threshold visual differences. CAM16-SCD later carried the same small-difference calibration over to CAM16."
  },
  "cam02-ucs": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.20227"
    ],
    "wiki": "https://en.wikipedia.org/wiki/CIECAM02#Color_spaces",
    "year": 2006,
    "by": "Luo, Cui & Li",
    "use": "General-purpose uniform space for delta-E computation and gamut mapping; superseded by CAM16-UCS but still used in ICC v4 contexts.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM02-UCS is the uniform color space Luo, Cui & Li built on top of CIECAM02 in 2006, transforming its lightness and colorfulness correlates through a compressive scale so that equal numerical distances correspond much more closely to equal perceived color differences. Reprojected into Cartesian coordinates, it behaves like a CIELAB-style space but is far more perceptually uniform, making it well suited to computing color differences (ΔE) and to gamut mapping. CAM16-UCS later carried the same compression scheme over to CAM16."
  },
  "cam16-lcd": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.22131"
    ],
    "year": 2017,
    "by": "Li et al.",
    "use": "Uniform space for large color-difference/gamut-mapping comparisons; current default for that role.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16-LCD is a variant of the CAM16-UCS uniform color space that Li et al. tuned in 2017 specifically for LARGE color differences, carrying over compression coefficients from Luo, Cui & Li's 2006 work on perceptually uniform CIECAM spaces. Like CAM16-UCS it reprojects CAM16's lightness and colorfulness into a near-Euclidean, Cartesian layout, but its scaling is calibrated against large-difference visual data rather than the small, fine-grained differences most color-difference formulas target — making it the CAM16 counterpart to CAM02-LCD."
  },
  "cam16-scd": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.22131"
    ],
    "year": 2017,
    "by": "Li et al.",
    "use": "Uniform space for small color-difference tolerance/QC comparisons; current default for that role.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16-SCD is a variant of the CAM16-UCS uniform color space that Li et al. tuned in 2017 specifically for SMALL color differences, carrying over compression coefficients from Luo, Cui & Li's 2006 work on perceptually uniform CIECAM spaces. Like CAM16-UCS it reprojects CAM16's lightness and colorfulness into a near-Euclidean, Cartesian layout, but its scaling is calibrated against small, near-threshold visual differences rather than the coarser comparisons CAM16-LCD targets — making it the CAM16 counterpart to CAM02-SCD."
  },
  "cam16-ucs": {
    "channels": [
      {
        "symbol": "J",
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
      "https://doi.org/10.1002/col.22131"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Color_appearance_model#CAM16",
    "year": 2017,
    "by": "Li et al.",
    "use": "General-purpose uniform space for delta-E computation and gamut mapping; current default successor to CAM02-UCS.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16-UCS is the uniform color space Li et al. built on top of CAM16 in their 2017 paper, transforming CAM16's lightness and colorfulness correlates through a compressive scale so that equal numerical distances correspond much more closely to equal perceived color differences. Reprojected into Cartesian coordinates, it behaves like a CIELAB-style space but is far more perceptually uniform, making it well suited to computing color differences (ΔE) and to gamut mapping, where straight-line distance needs to track actual visual difference."
  },
  "cam16": {
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
    "wiki": "https://en.wikipedia.org/wiki/Color_appearance_model#CAM16",
    "year": 2017,
    "by": "Li et al.",
    "use": "Color-appearance modeling of perceived lightness/colorfulness/hue; current default replacement for CIECAM02, basis of Material Design's HCT.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CAM16 is the color appearance model introduced by Li et al. in 2017 as a simplified, more robust successor to CIECAM02. It predicts how a color actually looks to a human observer under specific viewing conditions — accounting for the surrounding light, background, and the eye's state of adaptation — rather than merely describing the raw stimulus, yielding correlates of lightness, colorfulness, and hue (plus chroma, saturation, and brightness in the full model). Google adopted it, via its HCT derivative, as the foundation of Material Design's dynamic color system, and it now serves broadly in color science as the default replacement for CIECAM02."
  },
  "cie-rgb": {
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
      "https://en.wikipedia.org/wiki/CIE_1931_color_space"
    ],
    "wiki": "https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_color_space",
    "year": 1931,
    "by": "CIE",
    "use": "Historical/pedagogical reference space built from the Wright-Guild matching data; obsolete in production, ancestor of CIE XYZ.",
    "illuminant": "E",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE RGB — the experimental color space built directly from the 1931 Wright-Guild color-matching experiments, whose data became the foundation for the CIE XYZ standard itself. Its three primaries are monochromatic single-wavelength lights rather than the broadband primaries of any real display, referenced to an equal-energy white point. It survives today mainly as a historical and pedagogical space — the common ancestor from which nearly every later RGB space descends."
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
    "wiki": "https://en.wikipedia.org/wiki/CIECAM02",
    "year": 2002,
    "by": "CIE",
    "use": "Color-appearance modeling for gamut mapping and cross-media reproduction; still embedded in ICC v4 workflows, though superseded by CAM16.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIECAM02 is the color appearance model published by the CIE in 2002, developed to predict how a color will actually look to a human observer under real viewing conditions rather than simply specifying the color stimulus. It passes the physiological cone response through a chromatic-adaptation stage and an opponent-color stage to produce correlates of lightness, colorfulness and hue, along with chroma, saturation and brightness in the full model. Though CAM16 has since superseded it as a simpler, more robust successor, CIECAM02 remains embedded in ICC v4 color-management workflows and is still widely used for gamut mapping and cross-media color reproduction."
  },
  "cineon": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Cineon#Cineon_file_format",
    "year": 1992,
    "by": "Kodak",
    "use": "Film-scanning/digital-intermediate log encoding; historical, survives mainly through the DPX file format it originated.",
    "referred": "scene",
    "dynamic": "sdr",
    "description": "Cineon — Kodak's printing-density log encoding from the early 1990s, created for the Cineon film-scanning and digital-intermediate system that first let film labs work with scanned negatives digitally instead of on an optical printer. Its 10-bit log curve maps negative density directly to code values, with reference black and white points chosen to mirror film stock's response. It has no gamut of its own — scanned imagery inherited whatever primaries the film stock and scanner implied — and it survives today mainly through the DPX file format it gave rise to."
  },
  "clog": {
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
      "https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2011,
    "by": "Canon",
    "use": "Cinema EOS camera log capture; largely superseded by Canon Log 2/3 but still supported for compatibility.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log — Canon's first cinema log gamma, introduced with the EOS C300 in 2011 to extend the dynamic range Cinema EOS cameras could capture ahead of grading. Its curve is symmetric around black, encoding a bit of below-black signal rather than clipping at zero. In this library it pairs with Canon's wide Cinema Gamut primaries, the same matrix shared with the later Canon Log 2 and Canon Log 3 curves."
  },
  "clog2": {
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
      "https://en.wikipedia.org/wiki/Log_profile"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2015,
    "by": "Canon",
    "use": "Cinema EOS camera log capture for maximum dynamic range; current alongside Canon Log 3.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log 2 — Canon's wider-latitude cinema log curve, introduced with the EOS C300 Mark II to capture more of the sensor's dynamic range than the original Canon Log. Its flatter, lower-contrast curve trades a coarser midtone step for extra stops of highlight and shadow information, intended for heavier grading later. It shares the Cinema Gamut primaries with Canon Log and Canon Log 3."
  },
  "clog3": {
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
      "https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Canon Log 3 — Canon's balanced cinema log curve, introduced alongside Canon Log 2 on the EOS C300 Mark II. Rather than one log function, it blends a log shadow region, a linear midtone, and a log highlight region into a three-piece curve, aiming for close to Canon Log 2's dynamic range with gentler, easier-to-grade contrast. It shares the Cinema Gamut primaries with Canon Log and Canon Log 2, and has become Canon's most widely used cinema log curve."
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
    "wiki": "https://en.wikipedia.org/wiki/CMYK_color_model#Comparison_to_CMY",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CMY is the subtractive color model built from cyan, magenta and yellow alone, without CMYK's separate black channel. Each channel represents how much ink is applied to absorb its complementary portion of white light, so mixing all three at full strength approximates black — though in practice impure inks produce a muddy dark brown rather than a true black, which is exactly why CMYK adds a dedicated key channel. CMY remains useful as the direct three-ink subtractive counterpart to RGB, and underlies the arithmetic CMYK is built on."
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
        "name": "Black percentage"
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
    "wiki": "https://en.wikipedia.org/wiki/CMYK_color_model",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CMYK is the subtractive color model used throughout offset and digital printing, built from cyan, magenta and yellow inks plus a separate black channel (K, for \"key\"). Mixing cyan, magenta and yellow absorbs light rather than emitting it, the opposite of how RGB displays add colored light, so in principle their combination alone produces black — but real inks are impure, so a dedicated black channel keeps dark tones neutral, saves ink, and gives text and fine detail a cleaner edge. It remains the standard color model for prepress and printed output across the industry."
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
      "https://onlinelibrary.wiley.com/doi/10.1002/col.5080050214"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Coloroid_color_system",
    "year": 1980,
    "by": "Antal Nemcsics",
    "use": "Architectural and urban color-planning system; still used in Hungarian design practice, standardized as MSZ 7300.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Coloroid — the Hungarian architectural color-order system, developed by Antal Nemcsics at the Budapest University of Technology and standardized as MSZ 7300. Grown from large-scale aesthetic experiments, it arranges hue (A), saturation (T) and luminosity (V) in steps that feel evenly spaced when composing whole environments — its home turf is architecture and urban color planning."
  },
  "cubehelix": {
    "channels": [
      {
        "symbol": "fraction",
        "min": 0,
        "max": 1,
        "name": "Interpolation fraction along helix"
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
    "year": 2011,
    "by": "Dave Green",
    "use": "Scalar colormap for scientific visualization; current standard colorblind-safe alternative to rainbow colormaps.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Cubehelix is a color scheme designed by the astronomer Dave Green in 2011 for displaying astronomical intensity images, where a single continuous scalar value needs a color mapping that stays visually ordered from black to white even when printed in grayscale or viewed by someone with color-vision deficiency. Rather than picking colors freehand, it walks a spiral path — a \"cube helix\" — through RGB space as it rises from black to white, letting perceived brightness increase smoothly and monotonically while hue rotates around it. It is now widely used well beyond its original astronomical purpose, as a colorblind-safe, print-safe alternative to rainbow colormaps in scientific visualization generally."
  },
  "davinci": {
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
      "https://documents.blackmagicdesign.com/InformationNotes/DaVinci_Resolve_17_Wide_Gamut_Intermediate.pdf"
    ],
    "year": 2020,
    "by": "Blackmagic Design",
    "use": "Camera-agnostic grading intermediate and log curve; current default working space in DaVinci Resolve's color-managed pipeline.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "DaVinci Wide Gamut — Blackmagic's own wide color space and log curve, introduced in 2020 with DaVinci Resolve 17 as the default working space for Resolve's color-managed pipeline. Rather than targeting one camera, it's built as a camera-agnostic intermediate that footage from any brand can be converted into and graded consistently, similar in purpose to ACES but native to Resolve. Its DaVinci Intermediate log curve preserves highlight and shadow detail from any source camera ahead of the creative grade."
  },
  "dcdm": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 1,
        "name": "X′"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Y′"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 1,
        "name": "Z′"
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
    "year": 2006,
    "by": "SMPTE/DCI",
    "use": "DCP deliverable encoding for theatrical projection; current mandatory format for theatrical DCP mastering (SMPTE ST 428-1).",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DCDM — the Digital Cinema Distribution Master encoding embedded in every DCP (Digital Cinema Package) shipped to theatres, standardized by SMPTE under the DCI digital cinema specification. It encodes CIE XYZ directly through a 2.6 power-law gamma rather than an RGB transfer curve, tying relative white to the DCI reference projector's calibrated brightness. It's a display-referred, deliverable-only format — content is mastered into DCDM as the last step before packaging for theatrical release."
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
    "wiki": "https://en.wikipedia.org/wiki/DCI-P3#DCI-P3_(P3-DCI)",
    "year": 2005,
    "by": "DCI (Digital Cinema Initiatives)",
    "use": "Reference color space for digital cinema projection and mastering; current theatrical standard, also basis of consumer Display P3.",
    "illuminant": "DCI",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DCI-P3 — the digital cinema standard defined in SMPTE RP 431-2 for theatrical projection and mastering. It shares its wide red-green-blue primaries with Apple's Display P3, but pairs them with the DCI theatrical white point and a pure gamma-2.6 transfer curve rather than the D65 white and sRGB-like curve used in consumer display variants. It remains the reference space for digital film production and distribution."
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
      "https://doi.org/10.1002/col.10066"
    ],
    "year": 2002,
    "by": "Cui, Luo, Rigg, Roesler & Witt",
    "use": "Industrial color-tolerance measurement (coatings/plastics/automotive); current niche alternative to CIEDE2000.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99d is a 2002 refinement of the DIN99 uniform color space by Cui, Luo, Rigg, Roesler and Witt, aimed at fixing the original formula's uneven treatment of blue hues. It adds a correction applied to the tristimulus values before the CIELAB step, along with the family's usual hue rotation and logarithmic compression, so Euclidean distance between two DIN99d points tracks perceived difference more evenly across the hue circle than DIN99 or CIELAB manage alone. Like the rest of the DIN99 family, it's used mainly for industrial color-tolerance work where a simple Euclidean metric is preferred over CIE ΔE2000."
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
    "year": 2018,
    "by": "DIN (FNF/FNL 2 committee)",
    "use": "Industrial color-tolerance measurement standardized in DIN 6176; current lighter alternative to CIEDE2000 in coatings/plastics/automotive QC.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99o Lab is a further nonlinear remapping of CIELAB, part of the German DIN 6176 color-difference standard, built so that a simple Euclidean distance between two points approximates perceived color difference far more closely than raw CIELAB does. It compresses Lab's lightness and chroma logarithmically and applies a hue rotation, correcting CIELAB's well-known tendency to overstate differences among highly saturated colors. The DIN99 family is used mainly in industrial color-tolerance work — coatings, plastics and automotive finishes — as a lighter alternative to the more elaborate CIE ΔE2000 formula."
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
      "https://de.wikipedia.org/wiki/DIN99-Farbraum"
    ],
    "year": 2018,
    "by": "DIN (FNF/FNL 2 committee)",
    "use": "Cylindrical form of DIN99o for direct chroma/hue tolerance adjustment; current, same industrial QC domain as DIN99o Lab.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DIN99o LCh is the cylindrical form of DIN99o Lab, the DIN 6176 color-difference space, converting its rectangular axes into chroma and hue for the same reason LCh does for ordinary CIELAB — a more direct handle for adjusting saturation and hue. It keeps DIN99o's central advantage: because the space is built so Euclidean distance already approximates perceived difference, a simple chroma or lightness difference here is a meaningful color-tolerance metric without further correction formulas."
  },
  "dkl": {
    "channels": [
      {
        "symbol": "Ach",
        "min": -100,
        "max": 0,
        "name": "Achromatic"
      },
      {
        "symbol": "RG",
        "min": -31,
        "max": 0,
        "name": "Red-Green"
      },
      {
        "symbol": "YV",
        "min": 0,
        "max": 99,
        "name": "Tritan"
      }
    ],
    "range": [
      [
        -100,
        0
      ],
      [
        -31,
        0
      ],
      [
        0,
        99
      ]
    ],
    "refs": [
      "https://doi.org/10.1113/jphysiol.1984.sp015499"
    ],
    "year": 1984,
    "by": "Derrington, Krauskopf & Lennie",
    "use": "Vision-science stimulus design isolating cardinal color mechanisms; current standard framework in that research field.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "DKL — the cardinal-axis space of human color vision, proposed by Derrington, Krauskopf & Lennie in 1984 from recordings of neurons in the macaque lateral geniculate nucleus. Rather than an arbitrary opponent model, its three axes are the actual directions early visual neurons respond along: an achromatic luminance axis, an isoluminant red-green axis, and a tritan blue-yellow axis, all measured relative to an adapting white. It remains a standard framework in vision science for designing stimuli that isolate one cardinal mechanism at a time."
  },
  "dlog": {
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
      "https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2017,
    "by": "DJI",
    "use": "Log curve for DJI cinema-oriented drone/gimbal cameras; current on Zenmuse/Ronin cinema product lines.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "D-Log — DJI's log curve for its cinema-oriented cameras, including the Zenmuse X7 and Ronin 4D, designed to preserve dynamic range for grading rather than direct viewing. It pairs a linear toe near black with a log10 highlight curve, mapped to the D-Gamut primaries built for those cameras' sensors. It's distinct from D-Log M, the separate curve DJI uses on its consumer drones."
  },
  "dsh": {
    "channels": [
      {
        "symbol": "d",
        "min": -700,
        "max": 700,
        "name": "Dominant wavelength"
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
        "name": "Luminance"
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
    "wiki": "https://en.wikipedia.org/wiki/Dominant_wavelength",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE DSH — dominant wavelength, saturation (excitation purity) and hue, the classical Helmholtz coordinates for CIE 1931 chromaticity. Rather than the Cartesian x, y pair, a color is located by the spectral wavelength it most resembles and how far it sits from white toward that pure spectral color — a natural way to talk about hue and saturation that predates CIELAB-style opponent spaces. Non-spectral purples, which have no single dominant wavelength, are reported as a negative complementary wavelength instead."
  },
  "erimm": {
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
    "year": 2000,
    "by": "Kodak (Spaulding, Woolfe & Giorgianni)",
    "use": "Archival log scene-referred encoding for raw HDR scene data; niche/historical, part of the Kodak ROMM/RIMM family.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ERIMM RGB — Kodak's Extended Reference Input Medium Metric RGB, a log-encoded, scene-referred format standardized in ISO 22028-3 as the extended-range member of the ROMM/RIMM family. It shares the wide ROMM (ProPhoto) primaries and D50 white point with ProPhoto RGB, but its logarithmic curve lets it hold a much larger range of scene exposures — well beyond diffuse white — than a linear or gamma-encoded format could, making it suited to archiving raw, high-dynamic-range scene data."
  },
  "filmicpro": {
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
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/filmic_pro.py"
    ],
    "year": 2017,
    "by": "FiLMiC Inc.",
    "use": "Third-party iOS cinema-camera log capture; still available in FiLMiC Pro, overshadowed since native Apple Log arrived in 2023.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Filmic Pro 6 Log — the log curve from Filmic Pro, a third-party iOS cinema camera app that gave iPhone footage a flat, grading-ready image years before Apple Log existed natively. Its curve blends a square-root term and a natural-log term into one mixed law, built so a full-scale input maps back to a full-scale output. Like the smartphone-maker log formats that followed it, it has no published native color gamut and is treated as a curve over linear RGB."
  },
  "flog": {
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
      "https://dl.fujifilm-x.com/support/lut/F-Log_DataSheet_E_Ver.1.1.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2018,
    "by": "Fujifilm",
    "use": "Standard flat log profile for Fujifilm X-series/GFX video; current on bodies lacking F-Log2.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "F-Log — Fujifilm's log curve, introduced with the X-H1 in 2018 and later brought to the X-T2 and other X-series and GFX cameras by firmware update. It combines a linear toe in the shadows with a logarithmic highlight rolloff to extend recordable dynamic range ahead of grading. It's defined over F-Gamut, Fujifilm's color space whose primaries match ITU-R BT.2020, and remains the standard flat profile on Fujifilm bodies that lack the newer, wider-range F-Log2."
  },
  "flog2": {
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
      "https://dl.fujifilm-x.com/support/lut/F-Log2_DataSheet_E_Ver.1.0.pdf"
    ],
    "year": 2022,
    "by": "Fujifilm",
    "use": "Wider-dynamic-range log profile for Fujifilm X-series/GFX video; current flagship log curve on newer bodies.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "F-Log2 — Fujifilm's second-generation log curve, introduced on the X-H2S to capture roughly 14 stops of dynamic range, more than the original F-Log. Its curve is shallower than F-Log's, spreading those extra stops across the code-value range at the cost of needing more careful grading. It shares the F-Gamut primaries, matching ITU-R BT.2020, with F-Log."
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
    "wiki": "https://en.wikipedia.org/wiki/Grayscale",
    "year": 1931,
    "by": "CIE",
    "use": "Relative-luminance channel derived from linear RGB; current basis for WCAG contrast-ratio calculations.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Gray — a single-channel relative luminance value, the Y of CIE XYZ, computed from linear-light RGB rather than gamma-encoded values. That distinction matters: true luminance (Y) measures physical light output, while the \"luma\" (Y′) computed from gamma-encoded RGB — common in video engineering — only approximates it. Relative luminance is the quantity behind contrast-ratio calculations such as the WCAG accessibility guidelines."
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
    "description": "HCG — Hue, Chroma, Gray, a cylindrical RGB model that separates a color into its pure hue, the chroma (colorfulness) mixed into it, and the amount of gray added to dilute it. Unlike HSL or HSV, chroma here is an absolute measure of colorfulness rather than one relative to lightness or value, making it a natural fit for additive hue-and-gray color mixing."
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
        "max": 100,
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
        100
      ]
    ],
    "refs": [
      "http://www.chilliant.com/rgb2hsv.html"
    ],
    "year": 2012,
    "by": "Ian Taylor (Chilliant)",
    "use": "Gamma-weighted-luminance color picking for HLSL/shader code; niche, distinct from and often confused with CIE LCh.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCL — a cylindrical Hue, Chroma, Luminance color space from the Chilliant rgb2hsv reference implementation. Hue and chroma behave much like other cylindrical RGB models, but luminance is computed with a gamma-weighted formula designed to track perceived brightness more closely than plain lightness or value. It is unrelated to CIE LCh, which is also sometimes called \"HCL\" but uses entirely different math — the two should not be confused."
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
        "name": "Tone"
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
    "wiki": "https://en.wikipedia.org/wiki/Color_appearance_model#CAM16",
    "year": 2021,
    "by": "Google (Material Design)",
    "use": "Android Material You dynamic theming and tonal-palette generation; current Material Design 3 standard.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCT — hue, chroma, tone — is Google's color space for Material Design 3, introduced in 2021 to power Android's Material You dynamic theming. It pairs the hue and chroma of CAM16, a full color-appearance model that accounts for viewing conditions, with tone: CIELAB's L* lightness, chosen because contrast and accessibility formulas already depend on it. That combination lets a design system derive a complete tonal palette from a single seed color while keeping predictable contrast between any two tones."
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
    "year": 2012,
    "by": "Kuzma Shapran (popularized by Chilliant)",
    "use": "Luma-consistent hue model for real-time shader color grading; niche, used in HLSL/GLSL graphics code.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HCY — Hue, Chroma, Luma, a cylindrical color model devised by Kuzma Shapran and popularized by Chilliant for real-time shader use. Unlike HSI or HSL, its Y channel is the color's actual Rec. 601 luma rather than an average or extremum of the RGB channels, and chroma is normalized against the maximum luma the current hue can carry. The result is that two colors with equal Y always read as equally bright, a property neither HSL nor HSV guarantees."
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
    "year": 2010,
    "by": "Mark Fairchild & Garrett Wyble",
    "use": "HDR-adapted CIELAB for wide-luminance-range image-difference work; academic, superseded in practice by ICtCp/Jzazbz.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "hdr-CIELAB — Fairchild & Wyble's 2010/2011 extension of CIELAB to high-dynamic-range imagery. CIELAB's cube-root lightness response was fit to ordinary display luminance and breaks down across HDR's wider range, so hdr-CIELAB substitutes a Michaelis-Menten response whose exponent adapts to scene luminance, in the spirit of human visual adaptation. It keeps CIELAB's familiar L*, a* and b* lightness and red-green/yellow-blue structure while extending it to HDR content."
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
    "year": 2010,
    "by": "Mark Fairchild & Garrett Wyble",
    "use": "HDR-adapted IPT for hue-linear appearance modeling across wide luminance range; academic, not industrially deployed.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "hdr-IPT — Fairchild & Wyble's 2010/2011 extension of IPT to high-dynamic-range imagery. IPT's fixed power-law lightness response only holds over a narrow luminance range, so hdr-IPT replaces it with a Michaelis-Menten response whose exponent adapts to the scene's own luminance, echoing how the eye itself adapts. It keeps IPT's I/P/T lightness, red-green and yellow-blue structure while extending its hue-linear behavior across HDR's much larger dynamic range."
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
        "name": "Hue angle"
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
    "year": 2022,
    "by": "Luke Hellwig & Mark Fairchild",
    "use": "CIE-recommended color-appearance model succeeding CAM16; current mathematical basis of CIECAM16 (CIE 248:2022).",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "The Hellwig-Fairchild model, published in 2022, is the CIE-recommended refinement of CAM16 and the mathematical basis of CIECAM16 (CIE 248:2022). It keeps CAM16's chromatic-adaptation transform, opponent-color dimensions, and lightness correlate largely intact, but revises the achromatic response and brightness equations for more consistent behavior across the model's full range. Like CAM16 it reports lightness, colorfulness, and hue as its core correlates, making it a close drop-in successor wherever a CIE-endorsed appearance model is called for."
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
    "year": 2012,
    "by": "Alexei Boronine",
    "use": "Guaranteed-in-gamut pastel companion to HSLuv for palette tools; current, maintained alongside HSLuv.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HPLuv is the pastel counterpart to HSLuv, from the same project by Alexei Boronine. Instead of fitting saturation to the sRGB gamut boundary at each individual hue, it uses the single largest circle that fits inside the gamut at a given lightness, so every hue stays reachable across the full saturation range — at the cost of never reaching fully vivid colors, since S=100 only means as saturated as the least colorful hue at that lightness allows. Lightness and hue pass through unchanged from LCHuv, just as in HSLuv; only the chroma mapping differs."
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
    "wiki": "https://en.wikipedia.org/wiki/HSL_and_HSV",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSI — Hue, Saturation, Intensity, a cylindrical color model popular in image processing and computer vision. Intensity is simply the average of the red, green and blue channels, which decouples brightness from color information more cleanly than HSV or HSL for tasks like segmentation and feature extraction, at the cost of a more involved saturation calculation than its cousins."
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
    "wiki": "https://en.wikipedia.org/wiki/HSL_and_HSV",
    "year": 1978,
    "by": "Alvy Ray Smith",
    "use": "Intuitive hue/saturation/lightness color picking; current, standardized as CSS's hsl().",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSL — Hue, Saturation, Lightness, a cylindrical remapping of RGB devised by Alvy Ray Smith in 1978. Hue is the angle around a color wheel, saturation measures colorfulness relative to gray at that lightness, and lightness runs from black through the pure hue up to white. It offers a far more intuitive way to pick and adjust colors than raw RGB, and underlies the `hsl()` notation in CSS and countless color-picker interfaces."
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
    "wiki": "https://en.wikipedia.org/wiki/HSLuv",
    "year": 2012,
    "by": "Alexei Boronine",
    "use": "Perceptually even saturation across hues for design/palette tools; current, actively maintained (renamed from HUSL in 2018).",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSLuv is Alexei Boronine's human-friendly cylindrical form of CIELUV, built to fix a longstanding frustration with HSL: at full saturation, different hues reach wildly different actual vividness, so pure yellow at S=100 looks nothing like pure blue at S=100. HSLuv rescales chroma per hue and lightness so that S=100 always lands exactly on the sRGB gamut boundary, giving a saturation slider that behaves consistently across every hue. Lightness and hue pass through unchanged from LCHuv, and the result is popular in design tools and palette generators that want HSL's familiar interface without its uneven color behavior."
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
    "year": 2009,
    "by": "Bianconi et al.",
    "use": "Skin-color detection in image processing; academic, niche.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSM — Hue, Saturation, Mixture, developed by Bianconi et al. (2009) for robust skin-color detection in image processing. Mixture is a luminance-weighted average of the red, green and blue channels standing in for brightness, while saturation measures how far a color sits from that gray mixture relative to the farthest a color at the same mixture level can reach, keeping saturation properly bounded across the whole range of mixture values."
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
    "year": 2006,
    "by": "Darel Rex Finley",
    "use": "Perceived-brightness color picker alternative to HSL/HSV; niche hobbyist and creative-coding use.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSP — Hue, Saturation, Perceived brightness, a cylindrical color model designed to fix a known flaw in HSL and HSV, where lightness and value don't match how bright colors actually look to the human eye. Perceived brightness is instead computed from a weighted mix of the red, green and blue channels that reflects the eye's differing sensitivity to each, so two colors with the same P value look equally bright regardless of hue."
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
        "name": "Value percentage"
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
    "wiki": "https://en.wikipedia.org/wiki/HSL_and_HSV",
    "year": 1978,
    "by": "Alvy Ray Smith",
    "use": "Hue/saturation/value color picking with pure hues at full brightness; current, the standard 'wheel plus square' picker model.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HSV — Hue, Saturation, Value (also called HSB, for Brightness), another cylindrical remapping of RGB from Alvy Ray Smith's 1978 paper. It shares HSL's hue angle but replaces lightness with value, the brightness of the most intense color channel, so pure hues stay fully saturated across the whole brightness range instead of washing out toward white. It is the model behind most color-picker \"wheel plus square\" interfaces."
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
    "wiki": "https://en.wikipedia.org/wiki/HWB_color_model",
    "year": 1996,
    "by": "Alvy Ray Smith",
    "use": "Intuitive tint/shade color picking; current, standardized as CSS Color 4's hwb().",
    "referred": "display",
    "dynamic": "sdr",
    "description": "HWB — Hue, Whiteness, Blackness, devised by Alvy Ray Smith in 1996 as an even more intuitive alternative to HSV for humans mixing colors by hand. Instead of saturation and value, it describes a color as a pure hue diluted with some amount of white and some amount of black, mirroring how painters think about tinting and shading a pigment. It is standardized in CSS Color 4 as the `hwb()` notation."
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
    "year": 2017,
    "by": "Julian Fröhlich",
    "use": "HDR/wide-gamut opponent space re-optimized for JND uniformity versus ICtCp; research use, not broadly adopted industrially.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ICaCb — an HDR opponent space designed by Fröhlich in 2017, built in the same mold as ICtCp but re-optimized for just-noticeable-difference uniformity and straighter hue lines. XYZ passes through a dedicated cone matrix and the PQ (ST 2084) non-linearity before the opponent mix, giving I as intensity and Ca/Cb as red-green and yellow-blue chroma."
  },
  "ictcp": {
    "channels": [
      {
        "symbol": "I",
        "min": 0,
        "max": 1,
        "name": "Intensity"
      },
      {
        "symbol": "Ct",
        "min": -0.5,
        "max": 0.5,
        "name": "Tritan chroma"
      },
      {
        "symbol": "Cp",
        "min": -0.5,
        "max": 0.5,
        "name": "Protanopia chroma"
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
    "wiki": "https://en.wikipedia.org/wiki/ICtCp",
    "year": 2016,
    "by": "Dolby (BT.2100)",
    "use": "HDR television color grading and the dE-ITP difference metric; current ITU-R BT.2100 standard for HDR broadcast/streaming.",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ICtCp — Dolby's HDR opponent space, standardized in ITU-R BT.2100 for HDR television. Intensity rides the PQ curve while Ct and Cp carry blue-yellow and red-green chroma, keeping hue stable under big luminance changes — the space HDR colorists grade in and the basis of the ΔE-ITP difference metric."
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
        "name": "Protan"
      },
      {
        "symbol": "Tg",
        "min": -1,
        "max": 1,
        "name": "Tritan"
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
    "year": 2020,
    "by": "Hensley & Fairchild",
    "use": "Lightweight hue-uniform alternative to CAM16-UCS for color-difference work; academic, not widely deployed.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "IgPgTg is a color space proposed by Hensley and Fairchild in 2020 as a lighter-weight alternative to CAM16-UCS for hue-uniform color-difference work. Structurally it follows IPT, deriving a lightness signal from LMS cone responses and pairing it with two opponent channels — named Ig, Pg and Tg for intensity, protan and tritan, after the color-vision deficiencies their axes roughly align with. The authors report hue uniformity competitive with CAM16-UCS at a fraction of the computational cost."
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
    "wiki": "https://en.wikipedia.org/wiki/IPT_color_space",
    "year": 1998,
    "by": "Fritz Ebner & Mark Fairchild",
    "use": "Hue-linear opponent space for gamut mapping and image-difference metrics; still used, structural ancestor of ICtCp.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "IPT — an opponent color space built by Ebner & Fairchild in 1998 specifically so lines of constant hue stay straight under changes in saturation and lightness, a property CIELAB lacks. I, P and T stand for lightness, red-green and yellow-blue, derived from a cone-response power law followed by an opponent recombination. Its hue-linear design made it the structural ancestor of Dolby's ICtCp, and it remains a common choice for gamut mapping and image-difference work."
  },
  "izazbz": {
    "channels": [
      {
        "symbol": "Iz",
        "min": 0,
        "max": 1,
        "name": "Achromatic"
      },
      {
        "symbol": "az",
        "min": -0.5,
        "max": 0.5,
        "name": "Red-Green"
      },
      {
        "symbol": "bz",
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
      "https://doi.org/10.1364/OE.25.015131"
    ],
    "year": 2017,
    "by": "Safdar et al.",
    "use": "Intermediate opponent stage of the Jzazbz HDR derivation; research/internal use, foundation of the ZCAM appearance model.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "IzAzBz — the opponent-color stage inside Safdar et al.'s 2017 derivation of Jzazbz, taken before the final hyperbolic lightness compression that turns Iz into Jz. Iz is the raw, uncompressed achromatic response from the PQ-encoded LMS signal, while az and bz carry the same red-green and yellow-blue chroma as Jzazbz. It went on to become the structural foundation of the ZCAM color appearance model."
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
    "wiki": "https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion",
    "year": 1992,
    "by": "Eric Hamilton / C-Cube Microsystems (JFIF)",
    "use": "Full-range YCbCr for JPEG/JFIF still-image storage; current, ubiquitous (later formalized as ITU-T T.871).",
    "referred": "display",
    "dynamic": "sdr",
    "description": "The full-range YCbCr color space defined for JPEG still-image compression (ITU-T T.871 / JFIF), also called PC-range or full-swing YCbCr. Unlike broadcast YCbCr — which reserves the extremes of its 8-bit range as headroom and footroom for analog signal overshoot — JPEG YCbCr uses the full 0-255 range on all three channels, matching how still images are stored and displayed on computers. Y carries luma while Cb and Cr are blue-difference and red-difference chroma, using the same BT.601-derived coefficients as standard-definition video."
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
    "year": 2017,
    "by": "Safdar et al.",
    "use": "Perceptually uniform HDR color-difference space; current, used in HDR imaging research and color-management tooling.",
    "referred": "display",
    "dynamic": "hdr",
    "description": "JzAzBz — a perceptually uniform color space for high-dynamic-range imagery, published by Safdar et al. in 2017. It was designed so small lightness and color differences stay perceptually uniform across HDR's much wider luminance and gamut range, where CIELAB's uniformity breaks down. Jz is a PQ-encoded lightness, while az and bz are opponent red-green and yellow-blue axes; together they underlie HDR color-difference metrics and feed the cylindrical JzCzHz."
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
        "max": 1,
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
        1
      ],
      [
        0,
        360
      ]
    ],
    "refs": [
      "https://www.w3.org/TR/css-color-hdr/#JzCzHz"
    ],
    "year": 2017,
    "by": "Safdar et al.",
    "use": "Cylindrical JzAzBz for HDR hue/chroma editing and gamut mapping; current, proposed in the CSS Color HDR module.",
    "referred": "display",
    "dynamic": "hdr",
    "description": "JzCzHz — the cylindrical form of JzAzBz, trading the az/bz opponent axes for polar chroma (Cz) and hue (Hz). It shares JzAzBz's 2017 Safdar et al. foundation for HDR perceptual uniformity, but makes hue and saturation directly readable, which suits gamut mapping and color grading. It's one of the HDR color spaces proposed in the CSS Color HDR module."
  },
  "kelvin": {
    "channels": [
      {
        "symbol": "T",
        "min": 1000,
        "max": 25000,
        "name": "Temperature"
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
    "wiki": "https://en.wikipedia.org/wiki/Planckian_locus",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Kelvin — correlated color temperature (CCT), the familiar scale for describing a light source's warmth or coolness by comparing it to an ideal black-body radiator: roughly 2700 K for a warm incandescent candle-like glow, up to 6500 K and beyond for cool daylight. It's the white-balance axis used throughout photography, lighting design and display calibration, mapping a single temperature value to a point on the Planckian locus."
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
    "wiki": "https://en.wikipedia.org/wiki/CIELAB_color_space",
    "year": 1976,
    "by": "CIE",
    "use": "D65-anchored CIELAB avoiding chromatic adaptation for sRGB/Rec.709/P3 work; current, common in display-color tooling.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Lab-D65 is CIELAB — the CIE's 1976 perceptual space — reanchored to the D65 white point instead of the standard's usual D50, so it lines up directly with sRGB, Rec. 709 and Display P3. Keeping Lab and the display on the same white point avoids an extra chromatic-adaptation step when converting to and from RGB, which matters for work that stays entirely within a D65 display's color world rather than crossing into device-independent interchange. Its structure is otherwise identical to standard CIELAB: perceptually even lightness paired with red-green and yellow-blue opponent axes."
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
    "wiki": "https://en.wikipedia.org/wiki/CIELAB_color_space",
    "year": 1976,
    "by": "CIE",
    "use": "Device-independent perceptual color specification; current ICC profile connection space and CSS Color 4's lab().",
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIELAB is the CIE's 1976 perceptual color space, the first widely adopted attempt to make Euclidean distance between coordinates track perceived color difference. It splits color into lightness and two opponent axes — red versus green and yellow versus blue — echoing how the visual system encodes color beyond the retina. Color-managed workflows conventionally anchor Lab to the D50 illuminant, which is why it serves as the ICC profile connection space and the reference form of CSS Color 4's lab() function, rather than tying it to any particular display's white point."
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
    "wiki": "https://en.wikipedia.org/wiki/Hunter_Lab",
    "year": 1948,
    "by": "Richard S. Hunter",
    "use": "Industrial surface-color quality control (paints, plastics, textiles, food); legacy but still specified in some industry standards.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Hunter Lab is Richard Hunter's 1948 opponent-color space, developed years before CIELAB as one of the first practical attempts at a perceptually meaningful, roughly uniform coordinate system for measuring surface color. Like Lab it separates lightness from a red-green and a yellow-blue axis, but reaches them through a simpler transform tied to Hunter's own reflectance instruments rather than CIELAB's cube root. It's less perceptually uniform than CIELAB, but its head start left it entrenched in industrial color-quality work — paints, plastics, textiles and food — where legacy specifications still report in Hunter Lab units."
  },
  "lalphabeta": {
    "channels": [
      {
        "symbol": "l",
        "min": -6,
        "max": 0,
        "name": "log-luminance"
      },
      {
        "symbol": "alpha",
        "min": -1,
        "max": 0.9,
        "name": "Yellow-Blue"
      },
      {
        "symbol": "beta",
        "min": -0.21,
        "max": 0.21,
        "name": "Red-Green"
      }
    ],
    "range": [
      [
        -6,
        0
      ],
      [
        -1,
        0.9
      ],
      [
        -0.21,
        0.21
      ]
    ],
    "refs": [
      "https://doi.org/10.1109/38.946629"
    ],
    "year": 1998,
    "by": "Ruderman, Cronin & Chiao",
    "use": "Natural-image color-statistics decorrelation for color transfer between photographs; still used in image-processing research (popularized by Reinhard et al. 2001).",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "The lαβ color space was introduced by Ruderman, Cronin and Chiao in 1998 to decorrelate natural-scene color statistics, and became widely known as the working space behind Reinhard et al.'s 2001 color-transfer technique. It converts RGB into LMS cone responses, takes their logarithm to compress the eye's wide dynamic range the way the visual system itself does, and then rotates the result into three near-uncorrelated axes: l for achromatic lightness, α for the yellow-blue axis, and β for the red-green axis. Because natural images tend to vary almost independently along these three axes, shifting one image's per-channel mean and spread to match another's — entirely in lαβ — transfers the color mood of one photograph onto another with minimal cross-channel artifacts."
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
    "wiki": "https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model",
    "year": 1976,
    "by": "CIE",
    "use": "Cylindrical D65-anchored CIELAB for saturation/hue handles without chromatic adaptation; current, display-color tooling.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "LCh-D65 is the cylindrical form of Lab-D65 — CIELAB reanchored to the D65 white point — converting its rectangular axes into chroma and hue while keeping that display-matching white point. It gives the same intuitive saturation-and-hue handles as standard LCh, but without the chromatic-adaptation step a D50-anchored Lab would need when working directly with display colors."
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
    "wiki": "https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model",
    "year": 1976,
    "by": "CIE",
    "use": "Cylindrical CIELAB for intuitive saturation/hue adjustment; current, underlies CSS Color 4's lch().",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "LCh(ab) is the cylindrical form of CIELAB, the CIE's 1976 perceptual space, converting its rectangular a/b axes into chroma and hue so color can be adjusted the way people actually think about it — how saturated, and what hue — rather than as red-green and yellow-blue offsets. Lightness carries over unchanged from Lab, so the two share the same perceptual uniformity; only the color-axis representation differs. It underlies CSS Color 4's lch() function and is a common choice for building perceptually even saturation or hue controls."
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
        "max": 220,
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
        220
      ],
      [
        0,
        360
      ]
    ],
    "refs": [
      "https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)"
    ],
    "wiki": "https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)",
    "year": 1976,
    "by": "CIE",
    "use": "Cylindrical CIELUV for saturation/hue adjustment in additive-mixture contexts; current, basis for HSLuv/HPLuv.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "LCh(uv) is the cylindrical form of CIELUV, the CIE's 1976 companion to CIELAB, converting its rectangular u/v axes into chroma and hue much as LCh(ab) does for Lab. It inherits LUV's defining additivity — mixtures of lights move predictably through the space — while giving a more intuitive saturation-and-hue handle for adjusting or comparing colors. It's also the basis for HSLuv and HPLuv, which rescale its chroma to fit the sRGB gamut."
  },
  "llog": {
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
      "https://leica-camera.com/sites/default/files/pm-118912-L-Log_Reference_Manual_V1.6.pdf"
    ],
    "year": 2020,
    "by": "Leica",
    "use": "Log video capture for Leica SL-series mirrorless cameras; current native encoding on SL2-S, SL2 and SL.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "L-Log — Leica's log curve, introduced with the SL2-S and later brought to the SL and SL2 by firmware update, for grading on Leica's video-capable mirrorless cameras. Its curve opens with a short linear toe in deep shadow before switching to a logarithmic response, preserving highlight and shadow detail the way other manufacturers' log curves do. It's recorded in a BT.2020 color container, the same gamut Nikon's N-Log uses."
  },
  "lms": {
    "channels": [
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Long"
      },
      {
        "symbol": "M",
        "min": 0,
        "max": 105,
        "name": "Medium"
      },
      {
        "symbol": "S",
        "min": 0,
        "max": 110,
        "name": "Short"
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
    "wiki": "https://en.wikipedia.org/wiki/LMS_color_space",
    "referred": "display",
    "dynamic": "sdr",
    "description": "LMS — the cone-response space of human vision, where L, M and S are the long-, medium- and short-wavelength-sensitive cones of the retina. Describing color the way the eye's own photoreceptors respond makes LMS the natural space for chromatic adaptation: predicting how a color must shift to look unchanged under a different light source. Several competing cone-fundamental and adaptation matrices are in use — von Kries, Bradford, CAT02, CAT16 among them — each modeling that adaptation differently."
  },
  "log3g10": {
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
      "https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2017,
    "by": "RED Digital Cinema",
    "use": "Cinema camera log capture; current default acquisition curve on RED Komodo, V-Raptor and Monstro/Helium cameras.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Log3G10 — RED Digital Cinema's current log curve, introduced in 2017 alongside the REDWideGamutRGB primaries as part of RED's IPP2 image-processing pipeline. It maps the camera's very wide sensor dynamic range logarithmically so highlights and shadows both retain grading latitude, and it's the default acquisition space across RED's modern Komodo, V-Raptor, and Monstro/Helium-sensor cameras."
  },
  "log3g12": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log3G12.html"
    ],
    "year": 2016,
    "by": "RED Digital Cinema (Graeme Nattress)",
    "use": "Earlier RED cinema log curve superseded by Log3G10; legacy, still decodable but no longer recommended.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Log3G12 — an earlier RED Digital Cinema log curve, predating Log3G10 but sharing the same REDWideGamutRGB primaries. It allocates 12 stops of range above middle grey rather than Log3G10's 10, and its curve is sign-symmetric, encoding negative scene-linear values continuously instead of clipping them. RED has since moved to Log3G10 as its recommended acquisition curve."
  },
  "logc3": {
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
      "https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2010,
    "by": "ARRI",
    "use": "Cinema camera log capture for the original ARRI ALEXA line; legacy, superseded by LogC4 but still widely supported in post.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "LogC3 — ARRI's third-generation logarithmic encoding, used across the ALEXA camera line for years before LogC4 arrived with the ALEXA 35. Referenced to EI 800, it compresses the sensor's scene-linear exposure into a curve that preserves shadow detail and highlight headroom for grading, paired with the ALEXA Wide Gamut 3 primaries. It was the dominant scene-referred camera space in digital cinema production for over a decade and remains widely supported in post pipelines today."
  },
  "logc4": {
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
      "https://www.arri.com/resource/blob/278790/dc29f7399c1dc9553d329e27f1409a89/2022-05-arri-logc4-specification-data.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2022,
    "by": "ARRI",
    "use": "Cinema camera log capture; current ARRI ALEXA 35 native encoding.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "LogC4 — ARRI's fourth-generation logarithmic encoding, introduced with the ALEXA 35 in 2022. It compresses the sensor's 17 stops into a curve that keeps grading response uniform from deep shadow to specular highlight, paired with the ARRI Wide Gamut 4 primaries — the current standard for ARRI cinema workflows."
  },
  "lrgb": {
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
      "https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear"
    ],
    "year": 1996,
    "by": "HP & Microsoft (sRGB)",
    "use": "Physically linear intermediate for color mixing, blending, and colorimetric conversion; current, foundational in color-managed rendering.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Linear-light sRGB — the same D65 white point and primaries as sRGB, but with the gamma-like transfer curve removed so that channel values sit directly proportional to light intensity. It is not a space displays use directly; instead it is the physically meaningful intermediate for color math such as mixing, blending and colorimetric conversions, where operating on gamma-encoded values would give wrong results."
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
        "min": -215,
        "max": 215,
        "name": "U chrominance"
      },
      {
        "symbol": "V",
        "min": -215,
        "max": 215,
        "name": "V chrominance"
      }
    ],
    "range": [
      [
        0,
        100
      ],
      [
        -215,
        215
      ],
      [
        -215,
        215
      ]
    ],
    "refs": [
      "https://en.wikipedia.org/wiki/CIELUV"
    ],
    "wiki": "https://en.wikipedia.org/wiki/CIELUV",
    "year": 1976,
    "by": "CIE",
    "use": "Additive-mixture-accurate perceptual space for displays and stage lighting; still used, less common than CIELAB.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE L*u*v* (CIELUV) is the CIE's 1976 companion to CIELAB, an alternative attempt at perceptual uniformity built from a projected version of the CIE chromaticity diagram rather than Lab's opponent differencing. Its defining property is additivity: the position of a mixture of two lights falls on the straight line between the two lights' own coordinates, something Lab cannot do. That has made LUV the traditional choice for additive-color contexts like displays and stage lighting, while Lab remains dominant for reflective and print color."
  },
  "macboyn": {
    "channels": [
      {
        "symbol": "l",
        "min": 0.4,
        "max": 1,
        "name": "Red-green chromaticity"
      },
      {
        "symbol": "s",
        "min": 0,
        "max": 1,
        "name": "Tritan chromaticity"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Luminance"
      }
    ],
    "range": [
      [
        0.4,
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
      "https://doi.org/10.1364/JOSA.69.001183",
      "http://www.cvrl.org/database/text/ccs/spmb.htm"
    ],
    "year": 1979,
    "by": "Donald MacLeod & Robert Boynton",
    "use": "Cone-excitation chromaticity diagram for chromatic-discrimination vision research; academic, foundation of the DKL space.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "MacLeod-Boynton (MB) chromaticity — the cone-excitation diagram MacLeod & Boynton introduced in 1979, plotting color as relative long- and short-wavelength cone excitation on a constant-luminance plane. Isolating chromaticity at the level of the cones themselves, rather than at the tristimulus values a display uses, made it the foundation of the DKL cardinal-axis space and a staple of chromatic-discrimination research in vision science."
  },
  "milog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_MiLog.html"
    ],
    "year": 2024,
    "by": "Xiaomi",
    "use": "Log video profile for Xiaomi 14 Ultra/15 Ultra smartphone cameras; current flagship-camera grading feature.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Mi-Log — Xiaomi's log profile for the 14 Ultra and 15 Ultra smartphones, giving their cameras a flatter image with more grading latitude than the phones' standard color modes. Its curve follows the same quadratic-toe-plus-log2 shape as Apple Log, tuned with Xiaomi's own constants, and is recorded in a BT.2020 color container like other smartphone log formats."
  },
  "munsell": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 100,
        "name": "Hue"
      },
      {
        "symbol": "V",
        "min": 0,
        "max": 10,
        "name": "Value"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 38,
        "name": "Chroma"
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
    "wiki": "https://en.wikipedia.org/wiki/Munsell_color_system",
    "year": 1905,
    "by": "Albert H. Munsell (renotation OSA)",
    "use": "Perceptual color-order system for soil, geology, and pigment/paint specification; still an active industry standard.",
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "The Munsell color system was devised by the American painter and art teacher Albert Munsell around 1905 as a way to organize colors by how they actually look, rather than by how pigments mix or lights combine. It arranges every color along three perceptually spaced axes — hue, value (lightness) and chroma (saturation) — notated like \"5R 5/10\" for hue 5R, value 5, chroma 10, so that equal numerical steps in any one axis look equally spaced to the eye. The system was later refined through extensive visual experiments into the 1943 Munsell Renotation, the dataset still used today as its authoritative reference. It remains a standard for perceptually meaningful color specification in fields such as soil science, geology, and paint and pigment matching."
  },
  "nlog": {
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
      "https://download.nikonimglib.com/archive3/hDCmK00m9JDI03RPruD74xpoU905/N-Log_Specification_(En)01.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2018,
    "by": "Nikon",
    "use": "Log video capture for Nikon Z-series mirrorless cameras; current, defined over N-Gamut (BT.2020 primaries).",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "N-Log — Nikon's log curve, introduced with the Z6 and Z7 mirrorless cameras in 2018 to preserve highlight and shadow detail for later grading, and carried forward across the rest of the Z-series. Its curve pairs a cube-root shadow toe with a natural-log highlight region, rather than the log10 curves common elsewhere. It's defined over N-Gamut, whose primaries match ITU-R BT.2020."
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
    "wiki": "https://en.wikipedia.org/wiki/NTSC#Colorimetry",
    "year": 1953,
    "by": "FCC",
    "use": "Original US color-television primaries; historical, retained only as the '% NTSC' gamut-coverage benchmark.",
    "illuminant": "C",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "NTSC RGB — the color primaries defined by the FCC in 1953 for the first US color television broadcasts, later formalized in ITU-R BT.470 System M. Referenced to Illuminant C with a gamma of about 2.2, it remains the historical benchmark against which gamut coverage is still quoted today (\"% NTSC\"), even though its wide red and green primaries were never fully realized by real phosphors and were later superseded by SMPTE-C and Rec. 709."
  },
  "ohta": {
    "channels": [
      {
        "symbol": "I1",
        "min": 0,
        "max": 255,
        "name": "Intensity/3"
      },
      {
        "symbol": "I2",
        "min": -128,
        "max": 128,
        "name": "Opponent/2"
      },
      {
        "symbol": "I3",
        "min": -128,
        "max": 128,
        "name": "Opponent/4"
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
    "year": 1980,
    "by": "Ohta, Kanade & Sakai",
    "use": "Decorrelated RGB for computer-vision segmentation (vegetation, skin, flame); niche, still referenced in CV literature.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "The Ohta color space, introduced by Yu-Ichi Ohta, Takeo Kanade and Toshiyuki Sakai in 1980, decorrelates RGB into three opponent channels — an intensity channel and two chroma channels — chosen empirically to approximate the Karhunen-Loève transform (the statistically optimal decorrelation) of typical natural images, rather than being derived from any display or broadcast standard. Because it is a simple, exact and invertible linear transform of RGB, it is cheap to compute in both directions while still concentrating most of an image's variance into a single channel. It has been used widely in computer-vision segmentation tasks — isolating vegetation, fruit, flames, and skin regions — where that decorrelation makes thresholding more reliable than working directly in RGB."
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
      "https://bottosson.github.io/posts/colorpicker/#okhsl"
    ],
    "year": 2021,
    "by": "Björn Ottosson",
    "use": "Perceptually even HSL-style color picker bounded to the sRGB gamut; current, used in modern design tools.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkHSL is Björn Ottosson's 2021 hue-saturation-lightness remapping of Oklab, built for use in ordinary color-picker interfaces. Saturation is rescaled per hue and lightness so that 100% always lands exactly on the sRGB gamut boundary, giving sliders that stay in gamut and feel evenly spaced across their whole range — a guarantee plain HSL, built on gamma-encoded RGB, never offered. It pairs with OkHSV and OkHWB as a family of perceptually even color pickers derived from Oklab."
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
        "name": "Value percentage"
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
      "https://bottosson.github.io/posts/colorpicker/#okhsv"
    ],
    "year": 2021,
    "by": "Björn Ottosson",
    "use": "Perceptually even HSV-style color picker bounded to the sRGB gamut; current, used in modern design tools.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkHSV is Björn Ottosson's 2021 hue-saturation-value counterpart to OkHSL, built on Oklab using the value-based model of traditional HSV rather than lightness. Saturation and value are shaped so the space forms a cone that fits exactly inside the sRGB gamut, keeping HSV's familiar layout — pure hues at full saturation and value — while giving perceptually even lightness and chroma underneath. It suits color pickers and palette tools built around an HSV-style saturation/value grid."
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
      "https://bottosson.github.io/posts/colorpicker/#okhwb"
    ],
    "year": 2021,
    "by": "Björn Ottosson",
    "use": "Perceptually even whiteness/blackness color picker built on OkHSV; current but niche next to OkHSL/OkHSV.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkHWB is the whiteness-blackness counterpart to OkHSV, extending Björn Ottosson's 2021 family of Oklab-based color pickers. Like the classic HWB model, it describes any color as a pure hue mixed with some amount of white and some amount of black — a way of thinking about color closer to how painters mix tints and shades than hue/saturation/lightness sliders allow. Built directly on OkHSV, it inherits that space's perceptual evenness while staying bounded to the sRGB gamut."
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
    "wiki": "https://en.wikipedia.org/wiki/Oklab_color_space",
    "year": 2020,
    "by": "Björn Ottosson",
    "use": "Perceptual color space for gradients and design tooling; current, underlies CSS Color 4's oklab()/oklch().",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Oklab is Björn Ottosson's 2020 perceptual color space, created as a practical replacement for CIELAB in graphics and design work. It models color starting from how the eye's cone cells respond to light, then reshapes that signal so equal numeric steps correspond to equal perceived change in lightness, hue and chroma. That uniformity avoids the hue drift and desaturation that CIELAB and HSL produce when interpolating between colors, which is why Oklab now underlies CSS Color 4's oklab() and oklch() functions and much of the tooling built for gradients and palette generation."
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
    "wiki": "https://en.wikipedia.org/wiki/Oklab_color_space",
    "year": 2020,
    "by": "Björn Ottosson",
    "use": "Cylindrical Oklab; current, the recommended CSS format for design-token color palettes.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OKLCH is the cylindrical form of Björn Ottosson's 2020 OKLab, with perceptual lightness, chroma and hue. Designed so equal numeric steps look equal to the eye, it fixes CIELAB's blue-shift and is now the workhorse of modern CSS: `oklch()` is the recommended way to define design-token palettes on the web."
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
    "year": 2021,
    "by": "Björn Ottosson",
    "use": "Toe-corrected Oklab lightness for accurate dark-tone gamut mapping; current, niche/technical tooling use.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkLrab is Björn Ottosson's 2021 adjustment to Oklab's lightness channel, applying a toe curve that compresses near-black values closer to how the eye actually perceives them. Plain Oklab's lightness diverges from CIELAB at the dark end, making blacks read as lighter than they should; the toe mapping corrects this while leaving the a and b axes untouched. It's used mainly for gamut mapping and lightness comparisons where accurate dark-tone behavior matters more than strict fidelity to the original Oklab formulation."
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
    "year": 2021,
    "by": "Björn Ottosson",
    "use": "Cylindrical OkLrab for palette generation and gamut mapping needing accurate darks; current, niche/technical use.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OkLrch is the cylindrical form of OkLrab, Björn Ottosson's toe-mapped variant of Oklab, converting its lightness and rectangular a/b axes into lightness, chroma and hue. It carries over OkLrab's corrected dark-tone behavior while presenting color the way people usually reason about it — a hue at some strength and brightness — making it a natural fit for palette generation and gamut-mapping tools that need both accurate darks and an intuitive chroma/hue handle."
  },
  "olog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_OPPOOLog.html"
    ],
    "year": 2025,
    "by": "OPPO",
    "use": "Log video profile for OPPO Find X8 Ultra-era smartphones; current flagship-camera grading feature.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "O-Log — OPPO's log profile for its Find X8 Ultra-era smartphones, giving the camera a flat, grading-ready image in the same spirit as Apple Log and Xiaomi's Mi-Log. Unlike those two-piece curves, O-Log applies a single, pure natural-log function across the whole tonal range, with no separate toe segment near black. It's recorded in a BT.2020 color container."
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
    "wiki": "https://en.wikipedia.org/wiki/OSA-UCS",
    "year": 1974,
    "by": "OSA committee (David MacAdam)",
    "use": "Large-step perceptual uniformity for industrial/scientific color-difference work; legacy, niche next to CIELAB/CIELUV.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "OSA-UCS (Uniform Color Scale) is a color space developed by an Optical Society of America committee and published in 1974, closely associated with David MacAdam's work on the project. It set out to solve a problem CIELAB and CIELUV don't fully address: making equal numerical distances correspond to equal perceived differences not just for small steps, but across large jumps anywhere in the space. Rather than a simple rectangular grid, its coordinates sit on a cubic close-packed lattice, matching how the committee's extensive visual-scaling experiments found colors to actually cluster perceptually. It has found its main use in industrial and scientific color-difference work that values this large-scale uniformity over the convenience of more common spaces."
  },
  "p3-linear": {
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
    "wiki": "https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)",
    "year": 2015,
    "by": "Apple",
    "use": "Linear intermediate for Apple Display P3; current, feeds P3 color math before re-encoding.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Linear-light Display P3 — the gamma-free counterpart to Apple's Display P3, sharing its wide DCI-P3-derived primaries and D65 white point but with channel values directly proportional to light intensity. It serves as the intermediate space for accurate color math and image processing, before results are re-encoded with the Display P3 transfer curve for output."
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
    "wiki": "https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)",
    "year": 2015,
    "by": "Apple",
    "use": "Wide-gamut display space for Apple devices; current default on iPhone/iPad/Mac, standardized in CSS Color 4.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Display P3 — Apple's wide-gamut display space, introduced with the 2015 iMac and standardized into CSS Color 4 as `display-p3`. It keeps sRGB's transfer curve and D65 white but adopts the wider DCI-P3 film primaries, covering about 25% more colors — the default canvas of modern iPhones, iPads and Macs."
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
    "year": 1967,
    "by": "Walter Bruch / Telefunken",
    "use": "Legacy analog PAL/SECAM broadcast TV primaries (Europe, EBU Tech 3213/BT.470); historical.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "PAL/SECAM RGB — the primaries used by 625-line analogue television across Europe and much of the world, defined in EBU Tech 3213 and ITU-R BT.470 (System B/G). It shares sRGB's D65 white point and a similar gamma of about 2.2, but its green primary is subtly different, making it formally distinct from Rec. 709 — the correct gamut to use when working with archival PAL or SECAM broadcast material."
  },
  "panalog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Panalog.html"
    ],
    "year": 2005,
    "by": "Panavision / Sony",
    "use": "Log curve for the Panavision Genesis digital cinema camera; legacy/historical.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Panalog — the log curve for the Panavision Genesis, a digital cinema camera developed jointly with Sony and released in 2005. Modeled on Kodak's Cineon printing-density curve with its own black and white reference points, it let Genesis footage slot into film-style, Cineon-based post pipelines, much like RED's REDLogFilm did later for RED footage. Panavision never published a native color gamut for the format, so it's handled here as a curve over linear RGB rather than a distinct primaries set."
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
        "name": "Blue chroma"
      },
      {
        "symbol": "C2",
        "min": 0,
        "max": 255,
        "name": "Red chroma"
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
    "wiki": "https://en.wikipedia.org/wiki/Photo_CD#Encoding",
    "year": 1992,
    "by": "Kodak",
    "use": "Kodak Photo CD scene-referred scan encoding; historical, obsolete since Photo CD's discontinuation.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "sdr",
    "description": "PhotoYCC is the color encoding Kodak developed in 1992 for its Photo CD system, built to carry scanned photographic film into a digital, display-oriented format. Film captures a wider gamut and dynamic range than contemporary CRT monitors could show, so PhotoYCC extends the ordinary Rec. 709 encoding curve into an odd-symmetric function able to represent scene-referred colors and highlights beyond the normal [0,1] display range, storing the result as 8-bit luma (Yc) and two chroma channels (C1, C2). This let photofinishing labs scan a roll of film once and derive prints, monitor previews, and digital copies from a single scene-referred master."
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
    "year": 2021,
    "by": "Konovalenko et al.",
    "use": "Projective, linear-mixture-preserving perceptual space for image processing; emerging, niche.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "proLab is a projective perceptual color space proposed by Konovalenko and colleagues in 2021. Where CIELAB reshapes XYZ with an independent cube root on each channel, proLab applies a single projective transformation, so that straight-line mixtures of light — additive color mixing — stay straight lines in proLab coordinates while distances still track human discrimination thresholds the way CIELAB's do. That combination suits image-processing and color-difference work that depends on linear blending staying linear after the color transform."
  },
  "prophoto-linear": {
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
    "wiki": "https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space",
    "year": 1999,
    "by": "Kodak",
    "use": "Linear intermediate for Kodak ProPhoto (ROMM) RGB; current, used in raw-photo color-math pipelines.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Linear-light ProPhoto RGB — the gamma-free counterpart to Kodak's ProPhoto (ROMM) RGB, sharing its very wide primaries and D50 white point but with channel values directly proportional to light intensity. It serves as the intermediate space for color math on ProPhoto-referenced images, such as raw photo processing, before results are re-encoded with ProPhoto's transfer curve."
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
    "wiki": "https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space",
    "year": 1999,
    "by": "Kodak",
    "use": "Ultra-wide-gamut RGB for high-end digital photography/raw processing; current common working space.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "ProPhoto RGB — also known as ROMM RGB, developed by Kodak as a working space for high-end digital photography. Its primaries extend beyond the range of human vision, giving it one of the largest gamuts of any standard RGB space, though this means colors must be stored at higher bit depths to avoid visible banding. It is a common working space in raw photo processing, referenced to the D50 white point."
  },
  "protune": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Protune.html"
    ],
    "year": 2012,
    "by": "GoPro",
    "use": "Flat log color profile for GoPro Hero action cameras; current, still used on modern Hero output.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "Protune — GoPro's flat color profile for its Hero action camera line, designed to minimize in-camera sharpening, saturation, and contrast so footage keeps more headroom for color correction afterward. It applies a single natural-log curve across the tonal range — simpler than the multi-segment curves cinema cameras use — over the Protune Native primaries."
  },
  "ral-design": {
    "channels": [
      {
        "symbol": "H",
        "min": 0,
        "max": 360,
        "name": "Hue"
      },
      {
        "symbol": "L",
        "min": 0,
        "max": 100,
        "name": "Lightness"
      },
      {
        "symbol": "C",
        "min": 0,
        "max": 100,
        "name": "Chroma"
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
      "https://www.freiefarbe.de/en/thema-farbe/hlc-colour-atlas/"
    ],
    "wiki": "https://en.wikipedia.org/wiki/RAL_colour_standard#RAL_Design",
    "year": 1993,
    "by": "RAL gGmbH",
    "use": "European paint/coatings/architectural color-specification system in CIELAB cylindrical coordinates; current standard.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "RAL Design System+ is a color specification system of roughly 1,825 colors, maintained by RAL gGmbH and widely used across Europe to specify paints, coatings and architectural finishes. Unlike the older RAL Classic system, whose colors are defined only by physical sample swatches, RAL Design colors are defined algorithmically as cylindrical coordinates in CIELAB space — a hue angle, a lightness, and a chroma — making every RAL Design code a directly computable point in a standard, device-independent color space rather than a color that has to be matched by eye against a physical chip."
  },
  "rec2020-linear": {
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
    "wiki": "https://en.wikipedia.org/wiki/Rec._2020",
    "year": 2012,
    "by": "ITU-R",
    "use": "Linear intermediate for Rec. 2020 UHDTV primaries; current UHD/HDR grading working space.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Linear-light Rec. 2020 — the gamma-free counterpart to the ITU-R BT.2020 UHDTV standard, sharing its extremely wide primaries and D65 white point but with channel values directly proportional to light intensity. It is the working space for accurate color math, compositing and grading of UHD/HDR content, before results are re-encoded with the Rec. 2020 transfer function for delivery."
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
    "wiki": "https://en.wikipedia.org/wiki/Rec._2020",
    "year": 2012,
    "by": "ITU-R",
    "use": "Wide-gamut color space for UHDTV 4K/8K broadcast and HDR; current standard.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Rec. 2020 — the ITU-R BT.2020 standard defining the color gamut and transfer characteristics for ultra-high-definition television. It uses a transfer function with the same piecewise shape as Rec. 709, but spans a dramatically wider set of primaries that approach the outer limits of human color perception — the target gamut for 4K and 8K UHD broadcast, streaming and HDR displays."
  },
  "rec2100-hlg": {
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
      "https://www.itu.int/rec/R-REC-BT.2100"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Hybrid_log-gamma",
    "year": 2016,
    "by": "BBC & NHK / ITU-R",
    "use": "Backward-compatible scene-referred HDR transfer function for live broadcast; current standard.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Rec. 2100 HLG — ITU-R BT.2100's other HDR transfer function, Hybrid Log-Gamma, developed jointly by the BBC and NHK for broadcast. Where PQ encodes absolute luminance, HLG stays scene-referred and backward compatible: it behaves like ordinary gamma near black and switches to a logarithmic curve for highlights, so an unmodified SDR display can still render a reasonable picture without any metadata. It's the format of choice for live HDR broadcast."
  },
  "rec2100-linear": {
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
      "https://www.itu.int/rec/R-REC-BT.2100"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Rec._2100",
    "year": 2016,
    "by": "ITU-R",
    "use": "Scene-linear substrate beneath Rec. 2100's PQ and HLG; current HDR grading/gamut-mapping space.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Rec. 2100 Linear — the scene-linear RGB that sits beneath both of ITU-R BT.2100's HDR transfer functions, PQ and HLG, before either curve is applied. It carries the same wide Rec. 2020 primaries and white point into HDR, giving colorimetric operations like gamut mapping a straightforward linear-light space to work in, with headroom above reference white for specular highlights."
  },
  "rec2100-pq": {
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
      "https://www.itu.int/rec/R-REC-BT.2100"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Rec._2100",
    "year": 2016,
    "by": "Dolby / ITU-R",
    "use": "Absolute-luminance HDR encoding behind HDR10 and most HDR streaming/mastering; current, dominant.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Rec. 2100 PQ — the HDR RGB encoding from ITU-R BT.2100, pairing Rec. 2020's wide-gamut primaries with the PQ (Perceptual Quantizer) transfer function, SMPTE ST 2084, originally developed by Dolby. Unlike SDR gamma, PQ encodes absolute scene luminance directly, so a given code value always means the same brightness regardless of a display's peak brightness. It's the transfer function behind HDR10 and most HDR video streaming and mastering pipelines."
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
    "wiki": "https://en.wikipedia.org/wiki/Rec._709",
    "year": 1990,
    "by": "ITU-R (CCIR)",
    "use": "Reference gamut/transfer curve for HD video production and broadcast; current HDTV standard.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Rec. 709 — the ITU-R BT.709 standard defining the color primaries and transfer function for HDTV. It shares sRGB's red-green-blue primaries and D65 white point, differing only in a camera-oriented transfer curve (OETF) designed for broadcast cameras rather than computer displays. It remains the reference gamut for HD video production and broadcast."
  },
  "redlog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLog.html"
    ],
    "year": 2007,
    "by": "RED Digital Cinema",
    "use": "Original log curve of the RED ONE digital cinema camera; legacy, superseded by REDLogFilm/Log3G10.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "REDLog — RED Digital Cinema's original log curve, dating to the RED ONE, the company's first digital cinema camera, released in 2007. It pairs with the REDcolor primaries, RED's earliest color gamut, and was RED's default acquisition log before being superseded first by REDLogFilm and later by the Log3G10/REDWideGamutRGB pairing used on modern RED cameras."
  },
  "redlogfilm": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLogFilm.html"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "REDLogFilm — RED Digital Cinema's second log curve, built to match Kodak's Cineon printing-density curve exactly so RED footage could drop into existing film-style, Cineon-based color pipelines. It shares the REDcolor primaries with the original REDLog, sitting between it and the Log3G10/REDWideGamutRGB pairing used on today's RED cameras."
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
    "wiki": "https://en.wikipedia.org/wiki/Rg_chromaticity",
    "referred": "display",
    "dynamic": "sdr",
    "description": "rg chromaticity — the RGB analog of CIE xy: red, green and blue are normalized by their sum, discarding overall intensity and leaving only the relative color proportions. Because it factors out brightness, it's a long-standing technique in color matching and computer vision for describing a surface's color in a way that's more robust to lighting changes than raw RGB."
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
    "wiki": "https://en.wikipedia.org/wiki/SRGB",
    "year": 1996,
    "by": "HP & Microsoft",
    "use": "Default RGB space of the web and untagged images (sRGB); current, dominant consumer-display standard.",
    "illuminant": "D65",
    "referred": "display",
    "dynamic": "sdr",
    "description": "sRGB — the standard RGB color space created by HP and Microsoft in 1996 and later standardized as IEC 61966-2-1. It defines a D65 white point and a piecewise gamma-like transfer curve tuned to typical display response. It became the default color space of the web and of untagged digital images, and remains the assumed gamut for ordinary displays, browsers and image formats today."
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
    "year": 2000,
    "by": "Kodak",
    "use": "Scene-referred counterpart to ProPhoto RGB for unrendered imaging pipelines (ISO 22028-3); current but niche.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "scene",
    "dynamic": "sdr",
    "description": "RIMM RGB — Reference Input Medium Metric RGB, standardized in ISO 22028-3 as the scene-referred counterpart to Kodak's ProPhoto (ROMM) RGB. It shares ProPhoto's very wide D50 primaries but applies a camera-style transfer function with extended highlight headroom above diffuse white, letting it carry scene exposure values that would otherwise clip. It is meant to carry unrendered scene data through an imaging pipeline prior to output-referred rendering."
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
    "wiki": "https://en.wikipedia.org/wiki/Color_appearance_model#RLAB",
    "year": 1996,
    "by": "Mark Fairchild",
    "use": "Cross-media color appearance model for print/display reproduction matching; historical/academic, superseded by CIECAM02/CAM16.",
    "illuminant": "A",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "RLAB is the color appearance model Mark Fairchild published in 1996, developed for predicting how colors reproduce across different media and viewing conditions — for example, matching a printed image's appearance to how it looked on a display. It adapts the cone responses, via a von Kries-style transform through Hunt-Pointer-Estévez cone fundamentals, to the reference viewing condition, then maps the result into a CIELAB-like lightness and opponent-color space, giving it CIELAB's familiar structure while accounting for surround and adaptation effects that plain CIELAB ignores. It was among the earliest appearance models built specifically for cross-media color reproduction workflows."
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
    "wiki": "https://en.wikipedia.org/wiki/RYB_color_model",
    "year": 1961,
    "by": "Johannes Itten",
    "use": "Traditional painters' RYB color wheel per Itten's Bauhaus color theory; current standard in art/design education.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "RYB is the traditional artists' color wheel built on red, yellow and blue as primaries, the model taught in painting and design education long before RGB or CMYK existed. It captures how pigments actually mix on a palette rather than how light combines — blue and yellow mixed as paint make green, not the grey that additive red and green light would produce — matching painters' lived experience of color instead of colorimetric physics. The version implemented here follows Johannes Itten's chromatic color wheel from his Bauhaus color theory, still a standard reference for teaching color harmony in art and design."
  },
  "scrgb": {
    "channels": [
      {
        "symbol": "R",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Red"
      },
      {
        "symbol": "G",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Green"
      },
      {
        "symbol": "B",
        "min": -0.5,
        "max": 7.4998779296875,
        "name": "Blue"
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
    "wiki": "https://en.wikipedia.org/wiki/ScRGB",
    "year": 2003,
    "by": "IEC",
    "use": "Linear-light wide-range HDR extension of sRGB; niche, largely superseded by newer HDR transfer functions.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "scRGB — a linear-light extension of sRGB standardized as IEC 61966-2-2, created to carry wide-gamut and HDR signals through an otherwise ordinary sRGB pipeline. It keeps sRGB's D65 white point and primaries but removes the gamma curve and widens the encoding range well beyond the usual 0-1 span, allowing values for colors brighter or more saturated than standard sRGB can display."
  },
  "slog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog.html"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2008,
    "by": "Sony",
    "use": "Sony's first cinema log curve (F35/F3 cameras); legacy, kept for archival-footage compatibility.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "S-Log — Sony's first logarithmic gamma curve, introduced on the F35 and F3 cameras to capture more dynamic range than conventional video gammas allowed. Paired with the S-Gamut primaries, it was designed for scene-referred acquisition ahead of color grading, but its tonal placement was quickly refined by S-Log2 and then S-Log3. It survives mainly for compatibility with archival footage shot in that era."
  },
  "slog2": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog2.html"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2012,
    "by": "Sony",
    "use": "Sony's second-generation cinema log curve (F5/F55 era); legacy, superseded by S-Log3.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "S-Log2 — Sony's second-generation log curve, refining the original S-Log with a scaling adjustment that captures more of the camera's dynamic range and improves shadow reproduction. It shares the S-Gamut primaries with S-Log and S-Log3, sitting between them chronologically and in capability, before Sony moved to S-Log3 as its recommended acquisition curve. It still appears in workflows built around older Sony camera firmware."
  },
  "slog3": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_SLog3.html"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2014,
    "by": "Sony",
    "use": "Log curve for Sony CineAlta/Venice/Alpha cameras with S-Gamut3; current recommended acquisition setting.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "S-Log3 — Sony's current-generation log curve, designed to mimic the tonal placement of film-scanning logs like Cineon for more intuitive grading than the earlier S-Log curves offered. It pairs with the S-Gamut3 primaries and is the recommended acquisition setting across Sony's modern CineAlta, Venice, and Alpha cinema-line cameras. S-Gamut3 has a companion variant, S-Gamut3.Cine, with narrower primaries closer to DCI-P3 for productions that skip a full grade — a separate color space from this one."
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
    "wiki": "https://en.wikipedia.org/wiki/List_of_color_spaces_and_their_uses#Others_with_RGB_primaries",
    "year": 1988,
    "by": "SMPTE",
    "use": "Interim analog HDTV standard preceding Rec. 709; historical, superseded.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "SMPTE 240M — the interim HDTV standard published by SMPTE in 1988, used during the early analog high-definition era before Rec. 709 was finalized. It shares its wide broadcast primaries with SMPTE-C, referenced to D65 white, but defines its own transfer function — a gamma-like curve with a linear segment near black — distinct from the curves used in BT.601 and BT.709."
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
    "wiki": "https://en.wikipedia.org/wiki/NTSC#SMPTE_C",
    "year": 1987,
    "by": "SMPTE",
    "use": "NTSC broadcast phosphor primaries for North America/Japan (RP 145); historical, legacy analog reference.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "SMPTE-C is the RGB primary set standardized by the Society of Motion Picture and Television Engineers (SMPTE 170M) for 525-line NTSC broadcast in North America and Japan. It replaced the original 1953 FCC/NTSC primaries with phosphors that were actually achievable by contemporary picture tubes, paired with a D65 white point. As an RGB working space it shares its transfer curve with Rec. 709/BT.601 video, and remains the reference gamut for describing legacy analog NTSC color."
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
    "year": 2009,
    "by": "Jan Behrens",
    "use": "CIELAB/CIECAM02 hybrid for more perceptually-uniform color-difference work; niche open alternative to Lab.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "SRLAB2 is Jan Behrens' attempt to combine the best of CIELAB and CIECAM02. It runs color through CIECAM02's CAT02 chromatic adaptation and then finishes with a CIELAB-style cube-root opponent stage, rather than CIELAB's simpler and less accurate adaptation step. The result is noticeably more perceptually uniform than plain CIELAB, especially for saturated colors, while staying as easy to compute and invert as Lab itself, without CIECAM02's full viewing-condition machinery."
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
    "year": 2024,
    "by": "Li & Luo",
    "use": "Lightweight uniform color space alternative to CAM16-UCS/Oklab for color-difference tasks; new/emerging.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "sUCS is the uniform color space built from sCAM, a \"simple\" color-appearance model published by Li and Luo in 2024. It aims to match the perceptual uniformity of CAM16-UCS — equal numeric distances corresponding to equal perceived differences — through a far lighter calculation pipeline than a full appearance model like CAM16 requires. It's meant as a fast, lower-complexity substitute for CAM16-UCS or Oklab in tasks such as color-difference measurement that don't need viewing-condition parameters."
  },
  "tlog": {
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
      "https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/filmlight_t_log.py"
    ],
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "T-Log — FilmLight's log curve for its Baselight color-grading systems, paired with the wide E-Gamut primaries as a camera-agnostic working space that footage from almost any camera can be converted into for grading. Its curve is a near-pure log function with a linear extension below zero, avoiding the harsh clipping a pure log would give to noise and sub-black signal. Baselight facilities use T-Log/E-Gamut much the way ACES or DaVinci Wide Gamut are used elsewhere — as a common space for mixing footage from multiple camera sources."
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
        "name": "Tint angle"
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
        "name": "Lightness"
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
    "year": 2000,
    "by": "Terrillon & Akamatsu",
    "use": "Skin-tone segmentation color space for face/gesture detection in computer vision; niche, still referenced.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "TSL (Tint, Saturation, Lightness) is a cylindrical re-encoding of RGB introduced by Terrillon and Akamatsu in 2000 for detecting human skin tones in images. By separating chromaticity (tint and saturation) from lightness, it groups skin-colored pixels into a tighter, more separable cluster than RGB does, making thresholding for face and gesture detection more reliable. It remains a reference color space in computer-vision work on skin segmentation, alongside spaces like YCbCr and HSV."
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
        "name": "W"
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
    "wiki": "https://en.wikipedia.org/wiki/CIE_1960_color_space",
    "year": 1960,
    "by": "David MacAdam / CIE",
    "use": "Historical uniform chromaticity diagram, basis for correlated-color-temperature calculations; superseded by CIE 1976 u'v'.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1960 UCS is a uniform chromaticity space devised by MacAdam, an early attempt to make equal distances on a chromaticity diagram correspond to equal perceived color differences. It was extended into CIE 1964 U*V*W* by adding a lightness dimension, then superseded outright by CIELUV in 1976. Its underlying (u, v) chromaticity coordinates are still the basis for correlated-color-temperature calculations today, which makes it more a piece of color-science history than a working color space."
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
        "name": "Luminance"
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
    "wiki": "https://en.wikipedia.org/wiki/CIELUV",
    "year": 1976,
    "by": "CIE",
    "use": "Modern uniform chromaticity diagram for LED binning, white-point tolerancing, and CCT; current standard.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1976 UCS (u', v') — the modern, more perceptually uniform successor to the 1960 chromaticity diagram, standardized in CIE 15:2004. Equal distances on the u'v' plane correspond more closely to equal perceived color differences than the older CIE xy diagram does, which is why it's the chromaticity space of choice for LED binning, display white-point tolerancing (Δu'v'), correlated color temperature work along the Planckian locus, and colorimeter reporting."
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
    "wiki": "https://en.wikipedia.org/wiki/CIE_1964_color_space",
    "year": 1964,
    "by": "Günther Wyszecki / CIE",
    "use": "3-D extension of CIE 1960 UCS; superseded by CIELUV in 1976, now historical only.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE 1964 U*V*W* is Wyszecki's extension of the CIE 1960 UCS chromaticity diagram into a full three-dimensional color space, adding a cube-root lightness dimension on top of the earlier system's uniform chromaticity coordinates. It was one of several perceptual color spaces proposed during the 1960s, all trying to make Euclidean distance track perceived color difference better than raw XYZ did. CIELUV superseded it outright in 1976, so today it's mainly of historical interest, marking the transition between the 1960 chromaticity diagram and the modern CIE 1976 spaces."
  },
  "viperlog": {
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
      "https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_ViperLog.html"
    ],
    "year": 2002,
    "by": "Thomson Grass Valley",
    "use": "Log curve for the Thomson Viper FilmStream, one of the earliest digital cinema cameras; legacy/historical.",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "ViperLog — the log curve for the Thomson Viper FilmStream, one of the earliest digital cinema cameras, announced in 2002, well before the tapeless RED and ARRI ALEXA workflows that came to dominate the format. Its curve is a pure log10 function with no black offset, a simplicity that later curves from other manufacturers deliberately corrected to avoid crushing near-black detail. It's applied over linear-light RGB without a published native gamut of its own."
  },
  "vlog": {
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
      "https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf"
    ],
    "wiki": "https://en.wikipedia.org/wiki/Log_profile",
    "year": 2014,
    "by": "Panasonic",
    "use": "Log curve for Panasonic VARICAM/cinema cameras with V-Gamut; current on Panasonic's cinema line.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "scene",
    "dynamic": "hdr",
    "description": "V-Log — Panasonic's logarithmic curve introduced in 2014 with the VARICAM 35 cinema camera, built to hold the sensor's full dynamic range for grading rather than direct viewing. It pairs with the wide V-Gamut primaries, engineered to encompass color spaces like Rec.2020 with room to spare. This is the full cinema-camera curve; Panasonic's mirrorless GH-series bodies instead use a lighter variant called V-Log L, matched to a narrower 12-stop range."
  },
  "wasm": {
    "description": "fast cbrt/pow, so even perceptual paths beat JS). Zero runtime dependency: the ~4.6 kB module is prebuilt and inlined (see scripts/build-wasm.js). The API is the scalar library's, batch-shaped — same `space.from.to` addressing: import space, { alloc } from 'color-space/wasm' space.oklch.rgb(0.72, 0.16, 41)   // → [246, 125, 79] — scalar, same as JS const buf = alloc(nPixels)        // WASM-backed Float64Array(n*3) — write rgb here space.rgb.oklch(buf)              // whole buffer, in place, zero-copy space.rgb.oklch(pixels)           // plain array in → converted Float64Array out Layout: interleaved 3-channel `Float64Array`, n pixels = 3n values [c0,c1,c2, c0,c1,c2, …]. Ranges match the scalar API (rgb 0-255, oklab native, xyz 0-100). Formulas mirror the scalar library and are pinned by test/wasm-batch.js. THE WIN IS ZERO-COPY: an alloc()'d buffer converts in place — nothing crosses the JS/WASM boundary. Any other array-like is copied through (returned as a new Float64Array, input untouched) — fine for a chain, but prefer alloc() on a hot path."
  },
  "wavelength": {
    "channels": [
      {
        "symbol": "wl",
        "min": 380,
        "max": 700,
        "name": "Wavelength"
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
    "wiki": "https://en.wikipedia.org/wiki/Spectral_color",
    "year": 1931,
    "by": "CIE",
    "use": "Monochromatic-light-to-XYZ mapping via the CIE 1931 standard observer; current colorimetry reference.",
    "illuminant": "E",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Wavelength — the color of monochromatic light, a single point on the visible spectrum's \"rainbow\" of pure spectral hues, from deep violet near 380 nm to deep red near 700 nm. Converting a wavelength to CIE XYZ uses the color-matching functions of the CIE 1931 standard observer, the same experimentally-derived functions underlying all of modern colorimetry. Going the other direction recovers the dominant wavelength of any color, the same quantity that gives CIE DSH its hue."
  },
  "xvycc": {
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
      "https://webstore.iec.ch/publication/6168"
    ],
    "wiki": "https://en.wikipedia.org/wiki/XvYCC",
    "year": 2006,
    "by": "Sony / IEC",
    "use": "Extended-gamut YCbCr for consumer TVs/camcorders/Blu-ray beyond BT.709 (x.v.Color); niche, mostly superseded by HDR formats.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "xvYCC (extended-gamut YCC), standardized by Sony as IEC 61966-2-4 and marketed as x.v.Color, extends traditional YCbCr to encode colors lying outside the conventional BT.601/BT.709 gamut triangle. Where legal-range YCbCr clips any signal exceeding the primaries it was built around, xvYCC keeps the same luma/chroma structure but permits values beyond that limited range, letting cameras and displays capture and reproduce more saturated colors than standard- or high-definition video normally allows. It has shipped in consumer camcorders, televisions, and Blu-ray players seeking a wider color gamut without abandoning the familiar YCbCr pipeline."
  },
  "xyb": {
    "channels": [
      {
        "symbol": "X",
        "min": -0.0154,
        "max": 0.0281,
        "name": "Red-green"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 0.8453,
        "name": "Luminance"
      },
      {
        "symbol": "B",
        "min": -0.2778,
        "max": 0.388,
        "name": "Blue"
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
    "wiki": "https://en.wikipedia.org/wiki/LMS_color_space#Image_processing",
    "year": 2019,
    "by": "Jyrki Alakuijala et al. (Google)",
    "use": "Internal perceptual color space of the JPEG XL codec; current, used under the hood, not for authoring.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "XYB is the internal color space of JPEG XL, the royalty-free image format designed as a modern successor to JPEG for both lossy and lossless compression. Rather than building on broadcast-derived YCbCr like its predecessor, XYB is modeled on the eye's LMS cone responses, split into a red-green channel (X), a luminance channel (Y), and a blue-yellow channel (B), then compressed with a perceptually motivated power law so encoding error can be concentrated where vision is least sensitive to it. It is not meant for authoring or display — images are still edited and viewed in ordinary RGB — but is what the JPEG XL codec actually compresses under the hood."
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
        "name": "Luminance"
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
    "wiki": "https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xyY_color_space",
    "year": 1931,
    "by": "CIE",
    "use": "Chromaticity reformulation of CIE XYZ for visualizing gamuts and white points; current standard tool.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "xyY — a reformulation of CIE XYZ that separates a color's chromaticity (x, y) from its luminance (Y), so hue and saturation can be studied independently of brightness. Plotting x against y produces the familiar horseshoe-shaped chromaticity diagram used to visualize gamuts, specify white points, and compare how much of the visible spectrum a display or printer can reproduce."
  },
  "xyz-abs-d65": {
    "channels": [
      {
        "symbol": "Xa",
        "min": 0,
        "max": 192.9,
        "name": "Absolute X"
      },
      {
        "symbol": "Ya",
        "min": 0,
        "max": 203,
        "name": "Absolute Y"
      },
      {
        "symbol": "Za",
        "min": 0,
        "max": 221.1,
        "name": "Absolute Z"
      }
    ],
    "range": [
      [
        0,
        192.9
      ],
      [
        0,
        203
      ],
      [
        0,
        221.1
      ]
    ],
    "refs": [
      "https://www.itu.int/rec/R-REC-BT.2100"
    ],
    "year": 2016,
    "by": "ITU-R",
    "use": "Absolute-luminance XYZ anchored to BT.2100's 203 cd/m² HDR reference white; current HDR analysis tooling.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "Absolute XYZ (D65) — CIE XYZ expressed in real physical units, candela per square meter, instead of the usual 0-100 relative scale. Relative XYZ only says how a color compares to a normalized white; absolute XYZ ties every value to an actual measurable brightness, which HDR workflows need since the same relative color can sit at very different real-world luminances. The two scales meet at ITU-R BT.2100's HDR reference white."
  },
  "xyz-d50": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 96.42,
        "name": "X"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Y"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 82.51,
        "name": "Z"
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
    "year": 1994,
    "by": "ICC",
    "use": "CIE XYZ under D50, the ICC profile-connection space for print/graphic-arts color management; current standard.",
    "illuminant": "D50",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE XYZ referred to the D50 illuminant instead of D65. D50 is the profile connection space ICC color-management profiles convert through, a convention inherited from graphic arts and print viewing standards, so this variant is the one to reach for when reading or writing ICC-based workflows. It relates to D65 XYZ by Bradford chromatic adaptation."
  },
  "xyz": {
    "channels": [
      {
        "symbol": "X",
        "min": 0,
        "max": 95.05,
        "name": "X"
      },
      {
        "symbol": "Y",
        "min": 0,
        "max": 100,
        "name": "Y"
      },
      {
        "symbol": "Z",
        "min": 0,
        "max": 108.91,
        "name": "Z"
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
    "wiki": "https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_XYZ_color_space",
    "year": 1931,
    "by": "CIE",
    "use": "Foundational device-independent color space underlying all colorimetry; current universal reference.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "CIE XYZ — the foundation of modern colorimetry, defined by the CIE in 1931 from the color-matching functions of the standard observer. X, Y and Z are not themselves perceptual attributes; they're engineered so Y alone carries luminance while X and Z carry chromaticity, letting any visible color be written as a weighted sum of three fixed imaginary primaries. It serves as the device-independent reference that RGB, Lab and other working spaces are ultimately defined against."
  },
  "ycbcr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 16,
        "max": 235,
        "name": "Luma"
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
    "wiki": "https://en.wikipedia.org/wiki/YCbCr",
    "year": 1982,
    "by": "ITU-R (CCIR)",
    "use": "Digital luma/chroma format behind broadcast and compressed video (BT.601/709); current, ubiquitous in DVD/H.264/HEVC.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YCbCr is the digital luma/chroma color format behind almost all broadcast and compressed video, standardized by the ITU-R as BT.601 for standard-definition and BT.709 for high-definition. It carries forward the idea behind its analog ancestors YUV and YPbPr — a luma channel Y that alone reproduces a usable grayscale image, paired with blue-difference and red-difference chroma channels Cb and Cr — but in a digital, studio (\"limited\") range that reserves headroom and footroom at the extremes for signal-processing overshoot. It is the color format carried inside everything from DVDs and broadcast television to H.264 and HEVC video compression."
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
    "year": 2012,
    "by": "ITU-R",
    "use": "Constant-luminance luma/chroma encoding for UHDTV/HDR wide-gamut video (BT.2020/2100); current, less common than non-constant-luminance Y'CbCr.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YcCbcCrc is the constant-luminance encoding defined alongside ITU-R BT.2020 and BT.2100 for ultra-high-definition and HDR/wide-gamut video. Ordinary Y'CbCr derives luma from RGB values that have already been gamma-encoded, which lets highly saturated colors leak into the luma channel and distort perceived brightness — a problem that grows more visible with the wider gamuts and higher dynamic range BT.2020 and BT.2100 target. YcCbcCrc avoids this by deriving luma from linear light before applying the transfer curve, keeping brightness and chroma cleanly separated even for the most saturated colors UHDTV and HDR can reproduce."
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
    "wiki": "https://en.wikipedia.org/wiki/YCgCo",
    "year": 2003,
    "by": "Malvar & Sullivan (Microsoft)",
    "use": "Low-complexity reversible luma/chroma transform used in H.264/AVC and HEVC coding; current, specific coding modes.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YCgCo, introduced by Malvar and Sullivan in 2003, is a luma/chroma color transform designed to be cheap to compute and simple to invert. Y carries luma, while Cg and Co are green-difference and orange-difference chroma, each built from the RGB components with lighter arithmetic than the coefficients YCbCr uses. It was adopted into video coding standards including H.264/AVC and HEVC, valued there for combining low computational cost with an exact, easily reversible RGB transform."
  },
  "ydbdr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma"
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
    "wiki": "https://en.wikipedia.org/wiki/YDbDr",
    "year": 1967,
    "by": "Henri de France",
    "use": "Legacy analog SECAM television luma/chroma encoding (France, E. Europe, ex-USSR); historical.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YDbDr is the luma/chrominance encoding used by SECAM (\"Séquentiel Couleur à Mémoire\"), the analog color television standard developed in France and adopted across parts of Eastern Europe, the former Soviet Union, and Africa. Like YUV (its PAL counterpart) and YIQ (NTSC), it keeps a luma channel Y for backward compatibility with monochrome broadcasts, pairing it with two scaled color-difference channels, Db and Dr, derived from blue-minus-luma and red-minus-luma respectively."
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
        "name": "E-factor"
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
      "https://hbfs.wordpress.com/2018/05/01/xerox-yes-colorspaces-iv/"
    ],
    "year": 1989,
    "by": "Xerox",
    "use": "Xerox Color Encoding Standard luminance/chrominance encoding; historical, niche in imaging literature.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YES is a luminance/chrominance color encoding in the same family as YIQ and YUV: Y carries luminance, while E (green-red) and S (blue-yellow) carry chrominance as simple linear combinations of the red, green and blue primaries. Defined in Xerox's Color Encoding Standard (XNSS 289005, 1989), its coordinates are cheap to compute directly from RGB, which is the model's main appeal, but unlike CIELAB or CIELUV they are not perceptually uniform — equal steps in E or S do not correspond to equal-looking color differences. It appears in the color-imaging literature as one of several such encodings used for image analysis and compression."
  },
  "yiq": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma"
      },
      {
        "symbol": "I",
        "min": -0.5957,
        "max": 0.5957,
        "name": "In-phase"
      },
      {
        "symbol": "Q",
        "min": -0.5226,
        "max": 0.5226,
        "name": "Quadrature"
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
    "wiki": "https://en.wikipedia.org/wiki/YIQ",
    "year": 1953,
    "by": "NTSC",
    "use": "Original NTSC analog color-TV luma/chroma encoding (US); legacy/historical, replaced operationally by digital YCbCr.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YIQ is the luma/chroma encoding adopted for NTSC color television in the United States in 1953, engineered to add color broadcasts without breaking the millions of monochrome sets already in homes. The luma channel Y alone reproduces the original black-and-white picture, while I (in-phase) and Q (quadrature) carry the chrominance, named for how they modulate the phase of the color subcarrier. I and Q are rotated relative to the simpler blue-difference/red-difference axes of YUV specifically to exploit the eye's greater sensitivity along the orange-cyan direction than the green-purple direction, letting Q carry less bandwidth."
  },
  "ypbpr": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma"
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
    "wiki": "https://en.wikipedia.org/wiki/YPbPr",
    "year": 1982,
    "by": "ITU-R",
    "use": "Analog component-video color-difference signal for DVD players/consoles/HDTVs pre-HDMI; legacy, displaced by digital.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YPbPr is the analog component-video counterpart to digital YCbCr, carrying the same luma-plus-color-difference structure over three separate analog cables instead of a digital bitstream. Y is the luma signal, alone sufficient for a grayscale picture, while Pb and Pr carry blue-difference and red-difference chroma scaled to a standard analog range. Defined alongside ITU-R BT.709 for high-definition and BT.601 for standard-definition, it was the standard connector-and-signal format for higher-quality analog video on DVD players, game consoles, and HDTVs before digital HDMI became universal."
  },
  "yrg": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1.06,
        "name": "Luminance"
      },
      {
        "symbol": "r",
        "min": 0.02,
        "max": 0.64,
        "name": "Red chromaticity"
      },
      {
        "symbol": "g",
        "min": 0.21,
        "max": 0.78,
        "name": "Green chromaticity"
      }
    ],
    "range": [
      [
        0,
        1.06
      ],
      [
        0.02,
        0.64
      ],
      [
        0.21,
        0.78
      ]
    ],
    "refs": [
      "https://doi.org/10.2352/issn.2169-2629.2019.27.38"
    ],
    "year": 2019,
    "by": "Richard Kirk",
    "use": "Luminance/chromaticity space for color grading, basis of darktable's color-balance module; current, niche.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "sdr",
    "description": "Yrg — Richard Kirk's 2019 luminance/chromaticity space, built at FilmLight on CIE 2006 cone fundamentals and tuned so that hues land at even spacing around the wheel, matching the classical Munsell color order. Y carries cone-weighted luminance while r and g are chromaticity coordinates derived affinely from the cone responses, separating \"how bright\" from \"what hue and how saturated\" in a way suited to color grading. It's the chromaticity basis of darktable's color-balance module."
  },
  "yuv": {
    "channels": [
      {
        "symbol": "Y",
        "min": 0,
        "max": 1,
        "name": "Luma"
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
    "wiki": "https://en.wikipedia.org/wiki/YUV",
    "year": 1967,
    "by": "Walter Bruch / Telefunken",
    "use": "Legacy analog PAL television luma/chroma encoding; historical, though 'YUV' now used loosely for digital video too.",
    "referred": "display",
    "dynamic": "sdr",
    "description": "YUV is the analog color-encoding scheme developed for PAL television broadcasting, and lives on loosely today as a general term for luma/chroma video encoding. It let color signals ride alongside existing black-and-white broadcasts without breaking compatibility with monochrome receivers — the luma channel Y alone carries the brightness signal, while U and V add scaled blue-difference and red-difference chrominance on top. Splitting luma from chroma this way let broadcasters spend less bandwidth on color than on brightness, exploiting the eye's lower sensitivity to chrominance detail."
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
        "name": "Hue angle"
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
    "year": 2021,
    "by": "Safdar, Hardeberg & Luo",
    "use": "HDR/wide-gamut color appearance model for HDR display calibration and gamut mapping; current, active in research/tools.",
    "illuminant": "D65",
    "observer": "2",
    "referred": "display",
    "dynamic": "hdr",
    "description": "ZCAM is the color appearance model Safdar, Hardeberg and Luo introduced in 2021, designed from the outset for high-dynamic-range and wide-gamut imagery rather than adapted to it after the fact. It plays the same role as CAM16 — predicting lightness, colorfulness and hue as a color will actually appear under given viewing conditions — but builds on the absolute Izazbz color space instead of CIE XYZ, so it can work natively with the absolute luminance levels HDR content requires instead of the relative 0-100 scale older appearance models assume. The full model also reports brightness, vividness, blackness and whiteness, suiting it to HDR display calibration and gamut mapping where standard appearance models run out of range."
  }
}

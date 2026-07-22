/**
 * The Munsell color system was devised by the American painter and art teacher
 * Albert Munsell around 1905 as a way to organize colors by how they actually look,
 * rather than by how pigments mix or lights combine. It arranges every color along
 * three perceptually spaced axes — hue, value (lightness) and chroma (saturation) —
 * notated like "5R 5/10" for hue 5R, value 5, chroma 10, so that equal numerical
 * steps in any one axis look equally spaced to the eye. The system was later refined
 * through extensive visual experiments into the 1943 Munsell Renotation, the dataset
 * still used today as its authoritative reference. It remains a standard for
 * perceptually meaningful color specification in fields such as soil science,
 * geology, and paint and pigment matching.
 *
 * @see {@link https://www.rit.edu/science/munsell-color-science-lab-educational-resources}
 * @see {@link https://onlinelibrary.wiley.com/doi/10.1002/col.20715} Centore 2012 (inversion)
 * @wiki {@link https://en.wikipedia.org/wiki/Munsell_color_system}
 * @year 1905
 * @by Albert H. Munsell (renotation OSA)
 * @use Perceptual color-order system for soil, geology, and pigment/paint specification; still an active industry standard.
 * @channel {H} 0 100 Hue
 * @channel {V} 0 10 Value
 * @channel {C} 0 38 Chroma
 * @method system
 * @encoding perceptual
 * @illuminant C
 * @observer 2
 * @referred display
 * @loss lookup Renotation-table interpolation with an iterative inverse; exact only at table nodes.
 * @dynamic sdr
 */
// Implementation notes:
// Hue runs 0-100 on the ASTM circle (10RP=0/100, 2.5R=2.5, 5R=5, 10R=10, 5YR=15, ...,
// advancing R->YR->Y->GY->G->BG->B->PB->P->RP); achromatic ("N") is chroma 0. Built on
// the Newhall-Nickerson-Judd 1943 renotation (RIT MCSL "real" dataset, 2734 colors
// within the MacAdam limits), embedded in this module; forward is exact at grid points
// plus trilinear interpolation (H,V,C), inverse is iterative (coarse grid search + 2D
// Newton), round-tripping xy to ~1e-10.
//
// CAUTION — illuminant: the renotation is defined for CIE Illuminant C / 2° observer,
// so munsell<->xyy is Illuminant-C-referenced (matching colour-science). Chaining on to
// rgb/xyz (which are D65 here) carries a C->D65 white-point mismatch unless you
// chromatically adapt; convert through xyy and adapt yourself for display-accurate
// sRGB. Value's Y uses the 1943 (MgO) value function, so V=10 ideal white is Y=102.57.
import xyyGL from '../gl/xyy.glsl.js';

/**
 * The 1943 Munsell Renotation dataset (RIT MCSL "real" set, 2734 colors within the
 * MacAdam limits) — the measured lookup table used by both the scalar conversion
 * below and the GL chunk (../gl/munsell.glsl.js). One module is the source of truth.
 *
 * `grid()` resamples the irregular table onto its own regular lattice for GPU
 * upload: texel (hue h 0..39, value row v 0..8, chroma column k 0..19) packs
 * `[x(v), y(v), x(v+1), y(v+1)]` at H = 2.5(h+1), V = v+1, C = 2k. Packing the
 * adjacent value plane into the unused BA channels halves forward texture reads
 * and makes an exact renotation node at fractional V one fetch. In column 0, RG
 * remains Illuminant-C white while BA carries the current/next measured maximum
 * chroma; the shader supplies white directly for C<2. The final value repeats
 * itself, and short cells replicate their measured rim outward, so interpolation
 * still reproduces `cellXY` exactly — the dataset has no empty cells.
 */
// Packed renotation: x,y ×10000 as base64 uint16, grouped by [hue 2.5..100 step 2.5]
// [value 1..9], chroma 2,4,...; COUNTS = chroma-step count per (hue,value) cell.
const COUNTS = "5789:98535789:9753578::9853577899853445689:63234679:731345789:41245679:41235678:612346789:1234678991234678991234678992345678:92456789:936789:;<948;=>>=<848;=>>=;648;=>>=:648;=>=<:647:<<;;95369:;::85368999985357889873356888862356788742456788642457898642467997531579:97531CCA=:7531?AA?;8642=?A@=9642;>@@>:752:<?@?<9639;=??=;738:;==<:7379:;<;963689:;:863678::9853";
const PACK = "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RQQsC4kKZwy6CE4MMwcmDH0F3QsaBIwLAQNAC7YKeAwnCYAM5Ad0DKcGVwyCBS4MhgT/C6wD0wvfAqMLRAJ8C+8KiAywCaAMhgioDGIHogxSBpMMYwV+DJIEYgzgA0UMPAMkDKMCAwwZC4oMHwquDDgJxgw0CNAMOgfQDE4G0AyoBcsM2wS9DBYErAyIA58MDQOLDDgLkwxYCr4MiQnaDLwI7wz1BwENNAcJDX4GDw3TBRENLQURDZAEEA1SC5kMmArFDO8J5gwyCQcNcwghDc0HMw0uBz4NiwZJDesFUg1kBVQNZwucDMAKzgwcCvYMcwkYDdgINw01CFQNpgdoDRYHeg1yC6AM0ArXDCcKCg2FCTIN/QhNDX4JzwumBtAKIwS1CVsKGgxyCKUL0wYlCy0FlgrfAxYK1AKuCYsKMAzgCOELiAeOC1QGOAsuBeAKPgSSCmoDQwqzAv8JzApMDH0JJAxBCOwLFwepCwQGXgsSBRgLRATWCpoDngoAA2sK/ApZDPYJTgz0CDUM7gcKDPAG2AsBBqALVAV0C48EQAvWAwwLIQtkDCwKYQxQCVMMewhCDKkHJgziBgkMMQbsC4AFyQvgBKULPgtuDG8KdQy6CXIM9AhqDC4IXQx6B0wM1wY5DDAGHQyTBQQMVAtvDJ4KgAzdCX4MMAl+DIgIfAzaB3QMTAdrDLkGYAxfC3QMqAqIDO8JlAw5CZkMpwiaDDoJQgt6BsAJMgRRCC4KwgswCOYKhQYKCuoEGwmhA1UIZArqC60IRgtFB6IKDwYLCuIEawn6A+kIHgNnCLQKEwxQCagLEQgvC+AGqgrIBSgK4AS0CQkESAl4A/oI7AonDNAJ4Au6CIgLsgcsC7QGyArNBWYKHAUWClQEuQkVCzwMEgoGDB8JxwtECIYLdQdBC6IG8gruBakKOQVbCp0EFQo1C0cMUgolDJAJ/Qu7CMYL8weMCzEHTAuHBhAL0QXQCk4LUAx+CjoMuQkbDP4I9wtICNELkQeiC/wGeAtbC1cMjApEDMUJLgwSCd0KcQYUCV4EdAcSCnwLDAhZClUGNgnOBBwIjwMkB0wKpwuHCLwKIgfoCecFGwnEBFQI3QOrB6cK3gs4CTgLAAiUCskG3Am3BTIJ3wShCAMECQiEA7UH5wr/C7wJiguiCAcLmwd/CqEG9Qm1BWYJAwX0CEIEdggTCxkMCwrACwgJUwsgCOUKVwd6CnwGAQrIBZsJDgUsCTMLJgxFCt4LcgmQC6AINwvKB9cKBQdwClgGFQqbBagJUQs0DGwK+wueCbgL2AhrCxIIFwtVB8AKXQs1DHgKAQzzCHUKgwZ4CLwE0Qb/CToLAAjWCVEGcgjdBCMHxQMWBjkKaQuACEgKKwdHCfcFRwjrBFcHEgSRBqMKsAs7Cd4KDAgMCt8GKQnoBWQIEwWrB0oE+QbqCtgLvQk/C6cIjQqmB9cJwQYrCeEFfAgoBeUHbARHBxoL9wsTCnoLEAnlCigISwpbB7cJlQYjCdgFkQgeBQAIOwsGDEkKnAtqCSYLnAipCsIHEwryBn4JTwYDCVwLGAxvCrYLmQlIC70IyQpnCx4Mcwq9C/MIEwq0BgAIFwVnBsgDAAXxCe8KDwhgCXoG6gchBZwGGwSOBTgKKQuYCOgJUwfSCC8Gwwc/BdwGawQGBq0KgwtUCZAKNgimCR0HuAhBBuwHcQUtB7QEdwbzCrgLzwn4CsgINArXB3EJAAe2CDAG+gd8BVYHzgSvBiYL3QsqCkELMAmUClQI6QmOB0YJxgabCBQG+wdgBVcHSAvyC1sKbwuECeMKsQhHCuAHogkaB/8IagsFDIAKjAuoCQULzAhsCnkLDwyACpELBQm7CfcGtgdwBRsGNQTCBP4JpQo2CAkJtAaRB3QFQwaFBEIFRwrxCsYIowmNB30IegZxB5gFiwbMBLQFKQQFBcEKXgt9CVgKbQhnCWUHcAiRBqIHzwXgBh4FLAaDBIgFBQuWC/MJxQr7CPQJEwgoCUQHZQiCBqwH1AUFBy4FYAazBOEFNwvEC00KGAtfCVoKjQikCdAH+ggLB0IIXQabB64F8gZcC98LfQpGC64JqArlCP8JHghOCVsHmwh3C/YLngpfC9AJyAr2CBsKhQsEDJgKbAs4CXQJZwd3BwMG0wX5BIUEIApzCn8IxQghB0EHBAb6BTQF/gSOBDQEZwrECggJZQnmBzUI9AYpBygGQAZ2BXMF4wTCBN4KPAu3CSUKuwgnCcsHLggNB2AHYgaiBsEF6QU4BUUFwgS4BB8LfgsoCqAKPQm4CW0I5giwBx4IAQdmB2oGwAbXBRcGUwWCBVELrwt8CvQKoQknCuIIZgkvCLEIeQf2B9oGTAd0C9ELqQogC+oJdQowCcIJcggFCY0L5wvGCj8LAgqVCp8L9wt7CUAJ3AdLB44GpwWnBWQEBQVmA04KQArXCJAIlgcTB5UG0wXcBdgEUwUYBOUEaQOUCp8KWQk5CUoIBAh0BwcHtgYaBhUGTAWXBaAEJgUABMwEfwMACxoLAgoAChUJ/Ag3CAIIhQczB+0GewZbBscF4AUlBXAFjwQIBQMEQgtrC2YKfwqPCZEJzwi/CCAI+Qd+B0IH7QaZBmYG8QXuBVUFawuiC64K2grlCf4JOAk9CZUIjAjqB88HUQceB4gLwwvVCgwLJApTCnsJmgnOCNsIngvfC+4KLQs2Cm4KrwvxC/MJBgm4CB0H0AeOBVAHdQQMB7YD4wYkA8oGsAK4BkcCrQYGAqUGxgGgBpIBmwZgAZkGNQGWBg4BlAbqAJIGygCSBrQAkQagAJAGjACYChYKdAlkCI0I/gbVB9cFWgfqBBUHRgTiBrsDwAZHA6UG5gKVBpoChgZSAnwGGgJ1BuwBbwbDAWgGmQFjBnUBXgZUAVwGNgFXBhgB2Qp/CtgJDwkHCdoHZQjhBtUHAAZvB0kFIAekBOUGGATCBrQDpgZjA40GDgN6BscCagaPAmAGYQJVBiwCTAb/AUgG4AEtCwMLYQrgCacJ2ggACecHbggTB/UHXQaVB7wFRQckBQYHoQTOBiIEsQbUA5QGgwN7BjkDZgtcC7MKagoDCnEJcQmcCO0I5AdtCCYH+gd9BpkH5wVGB1UFAgfXBIsLkwvuCsAKTgrjCckJKwlKCXgIwQi3B0cIBwemC7sLEQv5Cn8KNAryCXIJagmwCLsL2gsoCx4LjgpYCscL7At1CugImwkkB/IIvgWOCMwESAgFBBYIZQP2B+kC2Ad+AscHNAK4B+0BrQe0AaAHfAGWB0YBkAcZAYgH8ADzCgcKKApyCIgJMAf2CA8GmAgyBVsIkgQnCAIEBAiOA+UHKAPOB84CugeDAqoHQgKdBwgCkQfXAYUHpAF+B3sBdwdYAR8LbgpkCg8JzwnvB1MJ+gbmCB0Gngh/BV4I4gQsCF4EDAj8A+4HogPUB08DvgcEA6sHxAKeB4oCkgdXAoYHHgJ+B/cBXwv0CscK2gk6CtcIwQn2B1QJLQf6CHsGrAjfBXoIXQVICOgEGwh0BAAIKATkB9kDygeIA7MHSAOgBwoDjwtZCwULYwp+CmwJDAqjCK4J7gdQCUEH+wiiBrAIEwZ+CKQFSQgxBSIIyQSsC5ELLwu7CrQK5QlNCjAJ7AmACIgJzgcwCS8H2QiHBr0LuAtGC/EK2Ao0Cm4KeQkDCsAIoQkKCNML2wtfCyAL6ApZCnUKiwneC+4LXgsiC/gK+AhsClIHCgoXBsAJFwWJCVgEWgmsAzkJKgMbCbgCCAlqAvcIHgLnCNkB2giiAcsIYwFMCxcKxgqgCGUKgQcKCmMGxQmOBZEJ3QRmCUwERAnUAykJaQMQCQsD+gi4AuUIbQLUCCsCxQjrAbcIsAFqC3gK6AomCYMKGAg3CjUH9AlmBsIJyAWRCS0FagmuBEwJRgQyCesDGQmPAwEJQAPuCP0C3Ai6AswIfgLCCEsCtggfApIL9wonC+MJywr8CH0KKQg7Cm8H/wnCBs0JMQajCawFfgk0BVoJxQRDCXcELAkmBBIJ0gP+CI0D7QhPA9kIBgO4C2ALUgtrCvYKjAmoCsAIaQobCDAKeQcACu4G0wlsBqwJ/AWGCYsFYgkjBUQJxwQsCXQEyAuQC3QLxwoaC/YJ0gpECY8KnAhXCgQIIQp1B/QJ6AbICXoG1wu4C4YL+go5C0kK7wqbCakK8QhoCk8I6AvgC5ILIgtBC28K8Aq4CeoL6wuTCzELeAsaCSYLhwfqClwGtgpfBY0KmgRuCu4DVQpfA0EK6gI0CpsCKQpKAh4K/QGoCzQKXAvVCCILyAfnCqsGvArcBZUKKAV0CosEXAoVBEgKpwM0CkYDJQruAhYKnQIJClIC/wkNArULjApwC1IJNgtXCAMLdgfUCqsGswoDBpMKdQV4CvgEYQqLBE8KMgQ8CtIDKgp7Ax4KNgMTCu4CCAqyAv0JdgLOCwkLjgsFClcLKwknC2YI/gqvB9oKEAe7CnwGngrwBYUKgAVuChQFXArCBEsKbAQ6ChwEKArLAxwKiwMOCkED5QtwC6oLiwp0C7cJRQv4CB0LWQj2CrkH1wo3B7gKtgaeCkQGhgrbBXEKdgVcChgFSwrIBDoKbwTqC5cLuQvaCoYLGQpZC3UJLgvUCA0LSQjqCrsHyQo8B6sKygaOClUG8wvCC8ELDwuRC2cKZgvICTgLJwkRC5UI8QoUCPkL5wvECzQLkwuQCmIL5gk2C0wJ+wv0C7sLNgvWCzkJrwu2B5ALkgZ0C5UFWQvNBEQLIwQ0C4cDJAsWAxkLwgIPC3EC/wtXCugLEQnRCwoIuAv1BqMLIQaMC3AFegvTBGoLUgRgC+MDVguFA0oLHwNCC88CEAy0CgAMkAnxC6AI3Qu9B8wLAge7C1IGsAvDBaULTAWZC9cEkQt/BIkLIQSAC8cDegt8A3ILLANqC+4CFQwrCwwMPgoEDHAJ+gu0CPALDAjlC3EH2wvbBtQLVQbIC9wFwgt0BbkLGgWxC8kEqgtvBKMLJgSZC9MDkguKAx8MjwscDL4KFQz7CQ8MRwkIDLYI/wsgCPwLnwf0CyYH7AuvBuILRgbeC9wF1guPBc4LMwXKC+UEwguSBCMMsQsjDA8LHQxaChsMxgkUDC4JEgyuCAwMLwgIDLgHAwxOB/0L0Qb2C2YG8gsLBiUM3QsnDEALJwyqCiUMGAokDIoJIAwQCR0MkAgbDBoIFQyqByMM/gsqDGMLKgzhCiwMQgosDMEJLQxCCSMMCQwtDHALMAzkCjwMZAk8DPAHNgzJBioMyQUeDAIFFgxWBAwMuAMGDEcD/QvsAlkMgwp1DFYJhwxUCJMMRgeeDHsGoQzFBaMMJQWjDJ0EoQwnBJ8MwgOeDF0DYgzmCo4M1QmrDPUIxQwbCNYMYQflDLMG7QwkBvgMsAUBDTQFBA3YBAwNegQNDR8EDw3SA1oMVguKDH4KsAy9CdAMDgnqDHIIAw3eBxcNUwcqDdwGOg1aBkgN3AVTDZAFXQ05BWQN4ARoDZQEcA04BEwMqgt+DPcKqwxGCtAMoAnsDBgJBw2LCCANEgg2DZ8HSQ0wB14NxwZtDWwGeg0TBowNtAWWDWwFog0cBUoMygttDDcLmgycCrsMGArdDJIJ+QwZCRUNmwgqDS8IPA3LB1ENWgdiDfkGcQ2iBoENRAZCDO4LbQxoC5UM4gq4DF4K2AzjCfIMdwkNDQQJKA2QCD8NKAhSDcQHZg1bBzsMDAxnDIsLjQwNC7IMjArSDBYK8AymCQ4NLQk4DBYMaAyWC5IMHQuoDJsJ2gwvCPkMEwcODQ8GGg1HBSENnQQoDfwDKA2GA88Mwgo2DcAJjg3TCOMN0wchDggHVA5SBn8OqQWkDh4Fwg6kBNoOOATIDC0LSA1ACq0NeQkODrkIYQ4GCKoOagfqDt4GJA9dBlkP4gWBD4UFsg8YBZ8MhwsMDdIKcg0jCs0NhgkYDv0IYw5yCKQO9wffDoMHGQ8KB1YPjwZ/DzkGqw/gBdAPlAV/DMsL4gw1C0QNngqiDQoK6A2UCTMOFQl3DqMIsw48CO0O1wchD3UHVA8WB30PygarD3QGdAzoC8gMcQsiDe8KbQ2ACrUNEgr+DZ4JRA4zCYYOywi9Dm4I+Q4ICCUPugdXD2QHYgwEDLYMmwsKDSYLWQ25Cp8NWArjDfEJJA6QCWgOJgmnDsEI4w5fCFIMHAynDLgL/wxSC04N6QqXDYsK4A0iCiUOwAlNDCQMogzCC/oMXgsyDe4Jrw2UCAQOgAdMDn4Gjw6yBbwOAwXjDnIENw0NC+YNJQp8DkwJEg9cCIMPkwfwD+QGVBA+Bq0QrgXyEDwFKg18CwIOtgq1DgkKWg9bCekPuwhnECkI2RCYB0IREQeXEZ8G4RE5Bu4MwgujDTgLVw6tCvkOKAp4D7kJCBA5CYEQyQjzEFsIZxHnB9sRcgcwEh0HuAz5C10NigsBDhoLpA6pCigPRgq2D9sJLhB8CaUQGwkUEcIIhBFmCOURFAhLEroHoAwNDCsNuQvADVgLQA4EC7kOsgo8D1YKtw/4CSgQowmVEE4JEBHrCGERqwiGDCAMBA3YC44NhQsTDjULgQ7uCgEPlgp2D0QK7A/sCVoQmwlsDDAM7AzsC3ANogvyDVQLZQ4MC+oOtgpkDDYM5Qz0C2cNrAuqDTkKeQ78CBkP9AelDwEHJBAsBpAQeAWDDUwLdg57Ck4PugkpEOQI4RAiCIERbwcQEskGiBI7BnoNuQubDiMLlg+UCooQ/AldEXMJLhLhCN8SXAh/E9sHChRlBysN9QscDpMLCg8rC+gPvgqjEFsKYhHtCRUShQm/EhkJZROpCAoUNQjgDBoMuw3QC44OfQtcDyQLDBDVCs8QcwpmESQKCRLKCZkSdQkzExoJtRPICL0MKQxvDfALMw6rC88OcQt4DywLHRDgCr0QkQpgET4K5RH1CX8SoAmgDDUMPQ0HDOoNzguKDpMLHw9aC8gPEgtjEMoK+hCBCoAMQAwgDRQMwQ3iC2IOpwv2DnILog8rC3YMRQwWDRsMuA3sCy0OlgpQD3cJNxB5CAURgQepEa4GPBLqBcwNjQsKD9oKKxAwCkwRcwlGEr0ILxMMCAkUYAfGDfwLMQ+ZC3oQMAvIEbUK8xI6ChMUuQkEFUEJ/BXBCFkNIgyDDuILnw+cC7oQSguwEfsKtRKdCpwTPwpyFOIJWhV4CSoWDwkEDTsMCg4SDAsP3wsJEKQL7BBmC+MRGQufEtgKehOHCkEUPAoUFecJ3AxFDLQNKAycDgIMWg/eCzYQrQsIEXgLyBFBC60S/AphE78KugxMDHYNNQxADhoMCw/7C8gP1gukEKQLaBFzCygSPguSDFAMVA0/DBAOKAzYDgoMjw/pC4UMUwxIDUQMBg4uDA==";

const N = COUNTS.length; // 360 cells (40 hues × 9 values)
const cnt = new Uint8Array(N), off = new Int32Array(N + 1);
for (let i = 0; i < N; i++) { cnt[i] = COUNTS.charCodeAt(i) - 48; off[i + 1] = off[i] + cnt[i]; }
const bin = atob(PACK), VALS = new Uint16Array(bin.length >> 1);
for (let i = 0; i < VALS.length; i++) VALS[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
const xyAt = (hi, vi, ci) => { const o = (off[hi * 9 + vi] + ci) * 2; return [VALS[o] / 1e4, VALS[o + 1] / 1e4]; };

const WC = [0.31006, 0.31616]; // Illuminant C 2° white chromaticity
const maxChroma = (hi, vi) => 2 * cnt[hi * 9 + vi];
const lerp2 = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];

// chroma-interpolated xy at fractional chroma C for cell (hi,vi); clamps to its gamut
const cellXY = (hi, vi, C) => {
	const n = cnt[hi * 9 + vi]; if (n === 0) return null;
	if (C <= 0) return WC.slice();
	const ci = C / 2 - 1, c0 = Math.floor(ci);
	if (c0 < 0) return lerp2(WC, xyAt(hi, vi, 0), C / 2);
	if (c0 >= n - 1) return xyAt(hi, vi, n - 1);
	return lerp2(xyAt(hi, vi, c0), xyAt(hi, vi, c0 + 1), ci - c0);
};

// GPU lattice: RGBA32F, w=40, h=180. For k>0, RG=current V and BA=next V;
// k=0 stores [white x, white y, max chroma at V, max chroma at next V].
const grid = () => {
	const g = new Float32Array(40 * 180 * 4);
	for (let h = 0; h < 40; h++) for (let v = 0; v < 9; v++) for (let k = 0; k < 20; k++) {
		const xy0 = k ? cellXY(h, v, 2 * k) : WC;
		const xy1 = k ? cellXY(h, Math.min(v + 1, 8), 2 * k) : WC;
		const o = ((v * 20 + k) * 40 + h) * 4;
		g[o] = xy0[0]; g[o + 1] = xy0[1];
		g[o + 2] = k ? xy1[0] : maxChroma(h, v);
		g[o + 3] = k ? xy1[1] : maxChroma(h, Math.min(v + 1, 8));
	}
	return g;
};

// Shader chunk kept beside the scalar conversion and its data so Munsell has one
// implementation source. gl/munsell.glsl.js is only the stable public-path adapter.
export const munsellGL = {
	name: 'munsell',
	deps: [xyyGL],
	edges: { xyy: ['xyy_munsell', 'munsell_xyy'] },
	lut: { name: 'munsell_ren_', w: 40, h: 180, data: grid },
	// texels are float32 (what the GPU reads — the evaluator mirrors it): ~4e-8 xy
	// quantization, amplified ~2000× through xyY→XYZ→rgb (×Y/y², ×255 code scale).
	// Well under half a code value — invisible; the tol names the real bound.
	tol: 2e-4,
	code: /* glsl */ `
float munsell_y_(float V) {
	return 1.2219 * V - 0.23111 * V * V + 0.23951 * V * V * V - 0.021009 * V * V * V * V + 0.0008404 * V * V * V * V * V;
}
// The local MacAdam rim: column-zero BA packs maximum chroma on adjacent value
// planes. Interpolate it by the same hue/value weights as the measured surface.
float munsell_maxc_(float H, float V) {
	float vif = clamp(floor(V) - 1.0, 0.0, 8.0); int vi = int(vif);
	float tv = clamp(V - 1.0 - vif, 0.0, 1.0);
	float hf = mod_(H - 1e-9, 100.0) / 2.5 - 1.0;
	int h0 = int(mod_(floor(hf), 40.0)); int h1 = h0 + 1;
	if (h1 == 40) { h1 = 0; }
	float th = hf - floor(hf);
	vec4 A = munsell_ren_(h0, vi * 20); vec4 B = munsell_ren_(h1, vi * 20);
	float c0 = A.z + (A.w - A.z) * tv; float c1 = B.z + (B.w - B.z) * tv;
	return c0 + (c1 - c0) * th;
}
// One hue column, interpolated across chroma and value. RG is value vi, BA is
// vi+1; replicated rim texels and column-zero white make this exactly cellXY.
vec2 munsell_cell_(int hi, int vi, int c0, int c1, float tc, float tv) {
	vec4 A = munsell_ren_(hi, vi * 20 + c0);
	vec4 B = munsell_ren_(hi, vi * 20 + c1);
	float ax = 0.31006; float ay = 0.31616;
	float bx = 0.31006; float by = 0.31616;
	if (c0 > 0) { ax = A.x + (A.z - A.x) * tv; ay = A.y + (A.w - A.y) * tv; }
	if (c1 > 0) { bx = B.x + (B.z - B.x) * tv; by = B.y + (B.w - B.y) * tv; }
	return vec2(ax + (bx - ax) * tc, ay + (by - ay) * tc);
}
vec3 munsell_xyy(vec3 c) {
	float H = c.x; float V = c.y; float C = c.z;
	float Y = munsell_y_(V);
	if (C <= 0.0) { return vec3(0.31006, 0.31616, Y); }
	float vif = clamp(floor(V) - 1.0, 0.0, 8.0);
	int vi0 = int(vif);
	float tv = clamp(V - 1.0 - vif, 0.0, 1.0);
	float hf = mod_(H - 1e-9, 100.0) / 2.5 - 1.0;
	int h0 = int(mod_(floor(hf), 40.0));
	int h1 = h0 + 1;
	if (h1 == 40) { h1 = 0; }
	float th = hf - floor(hf);
	float cf = clamp(C * 0.5, 0.0, 19.0);
	int c0 = int(floor(cf));
	int c1 = min(c0 + 1, 19);
	float tc = cf - float(c0);
	vec2 q0 = munsell_cell_(h0, vi0, c0, c1, tc, tv);
	vec2 q1 = munsell_cell_(h1, vi0, c0, c1, tc, tv);
	return vec3(q0.x + (q1.x - q0.x) * th, q0.y + (q1.y - q0.y) * th, Y);
}
vec3 xyy_munsell(vec3 c) {
	float x = c.x; float y = c.y; float Y = c.z;
	float V = 10.0 * cbrt_(max(Y, 0.0) / 100.0);
	for (int i = 0; i < 6; i++) {
		float f = munsell_y_(V) - Y;
		float d = 1.2219 - 0.46222 * V + 0.71853 * V * V - 0.084036 * V * V * V + 0.004202 * V * V * V * V;
		V = V - f / d;
	}
	float dx = x - 0.31006; float dy = y - 0.31616;
	if (sqrt(dx * dx + dy * dy) < 1e-4) { return vec3(0.0, V, 0.0); }
	// Coarse seed: the same exhaustive 40×19 renotation-node search, but a node
	// at fractional V is already packed into one texel (rather than a full forward).
	float vif = clamp(floor(V) - 1.0, 0.0, 8.0); int vi = int(vif);
	float tv = clamp(V - 1.0 - vif, 0.0, 1.0);
	float bH = 5.0; float bC = 2.0; float bD = 1e30;
	for (int hi = 0; hi < 40; hi++) {
		for (int k = 1; k <= 19; k++) {
			vec4 q = munsell_ren_(hi, vi * 20 + k);
			float fx = q.x + (q.z - q.x) * tv; float fy = q.y + (q.w - q.y) * tv;
			float d = (fx - x) * (fx - x) + (fy - y) * (fy - y);
			if (d < bD) { bD = d; bH = 2.5 * float(hi + 1); bC = 2.0 * float(k); }
		}
	}
	float H = bH; float C = bC;
	float live = 1.0;   // convergence / a vanishing Jacobian mirrors the JS break
	for (int it = 0; it < 60; it++) {
		if (live > 0.5) {
			vec3 f = munsell_xyy(vec3(H, V, C));
			float ex = f.x - x; float ey = f.y - y;
			if (ex * ex + ey * ey < 1e-16) { live = 0.0; }
			if (live > 0.5) {
				vec3 fh = munsell_xyy(vec3(H + 0.05, V, C));
				vec3 fc = munsell_xyy(vec3(H, V, C + 0.05));
				float j00 = (fh.x - f.x) / 0.05; float j01 = (fc.x - f.x) / 0.05;
				float j10 = (fh.y - f.y) / 0.05; float j11 = (fc.y - f.y) / 0.05;
				float det = j00 * j11 - j01 * j10;
				if (abs(det) < 1e-12) { live = 0.0; }
				if (live > 0.5) {
					float sH = (j11 * (0.0 - ex) - j01 * (0.0 - ey)) / det;
					float sC = ((0.0 - j10) * (0.0 - ex) + j00 * (0.0 - ey)) / det;
					H = mod_(H + clamp(sH, -5.0, 5.0), 100.0);
					C = max(0.0, C + clamp(sC, -5.0, 5.0));
				}
			}
		}
	}
	return vec3(H, V, C);
}`,
}

// Newhall 1943 value function V->Y (matches the renotation table's Y column)
const valueToY = V => 1.2219 * V - 0.23111 * V ** 2 + 0.23951 * V ** 3 - 0.021009 * V ** 4 + 0.0008404 * V ** 5;
const YtoValue = Y => {
	let V = 10 * Math.cbrt(Math.max(Y, 0) / 100);
	for (let i = 0; i < 40; i++) {
		const f = valueToY(V) - Y;
		const d = 1.2219 - 0.46222 * V + 0.71853 * V ** 2 - 0.084036 * V ** 3 + 0.004202 * V ** 4;
		V -= f / d; if (Math.abs(f) < 1e-9) break;
	}
	return V;
};

// Munsell H,V,C -> xyY (Illuminant C)
const toXyY = (H, V, C) => {
	const Y = valueToY(V);
	if (C <= 0) return [WC[0], WC[1], Y];
	const vi0 = Math.max(0, Math.min(8, Math.floor(V) - 1)), vi1 = Math.min(8, vi0 + 1);
	const tv = Math.max(0, Math.min(1, (V - 1) - vi0));
	const hf = ((((H - 1e-9) % 100) + 100) % 100) / 2.5 - 1;
	const h0 = ((Math.floor(hf) % 40) + 40) % 40, h1 = (h0 + 1) % 40, th = hf - Math.floor(hf);
	const corner = (hi, vi) => cellXY(hi, vi, C) || cellXY(hi === h0 ? h1 : h0, vi, C) || WC.slice();
	const cv0 = lerp2(corner(h0, vi0), corner(h1, vi0), th);
	const cv1 = lerp2(corner(h0, vi1), corner(h1, vi1), th);
	const [x, y] = lerp2(cv0, cv1, tv);
	return [x, y, Y];
};

// xyY (Illuminant C) -> Munsell H,V,C
const toHVC = (x, y, Y) => {
	const V = YtoValue(Y);
	if (Math.hypot(x - WC[0], y - WC[1]) < 1e-4) return [0, V, 0];
	let best = null; // coarse search over the hue×chroma grid at this value
	for (let hi = 0; hi < 40; hi++) for (let C = 2; C <= 38; C += 2) {
		const f = toXyY(2.5 * (hi + 1), V, C), d = (f[0] - x) ** 2 + (f[1] - y) ** 2;
		if (!best || d < best.d) best = { H: 2.5 * (hi + 1), C, d };
	}
	let H = best.H, C = best.C; // 2D Newton refine on (H,C)
	for (let it = 0; it < 60; it++) {
		const f = toXyY(H, V, C), ex = f[0] - x, ey = f[1] - y;
		if (Math.hypot(ex, ey) < 1e-8) break;
		const fh = toXyY(H + 0.05, V, C), fc = toXyY(H, V, C + 0.05);
		const j00 = (fh[0] - f[0]) / 0.05, j01 = (fc[0] - f[0]) / 0.05;
		const j10 = (fh[1] - f[1]) / 0.05, j11 = (fc[1] - f[1]) / 0.05;
		const det = j00 * j11 - j01 * j10; if (Math.abs(det) < 1e-12) break;
		const sH = (j11 * -ex - j01 * -ey) / det, sC = (-j10 * -ex + j00 * -ey) / det;
		H = ((H + Math.max(-5, Math.min(5, sH))) % 100 + 100) % 100;
		C = Math.max(0, C + Math.max(-5, Math.min(5, sC)));
	}
	return [H, V, C];
};

// The reverse edge is exported beside the space rather than importing/mutating
// xyy here. That keeps the GL-only entry free of the scalar conversion graph.
export const xyyMunsell = (x, y, Y) => toHVC(x, y, Y);

const munsell = {
	name: 'munsell',
	range: [[0, 100], [0, 10], [0, 38]],
	xyy: (H, V, C) => toXyY(H, V, C)
};

export default munsell;

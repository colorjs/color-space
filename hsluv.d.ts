export interface Hsluv extends ColorSpace3 {
    hpluv(hsluv: HslData): HslData
    lchuv(hsluv: HslData): LchData
    xyz(hsluv: HslData): XyzData
}

export interface LchuvHsluv {
    hsluv(lchuv: LchData): HslData
}

export interface RgbHsluv {
    hsluv(rgb: RgbData): HslData
}

export interface XyzHsluv {
    hsluv(xyz: XyzData): HslData
}

declare const hsluv: Hsluv;

export default hsluv;

import type {
    ColorSpace3,
    HslData,
    LchData,
    XyzData,
} from './types/color-space.d.ts';

export interface Hpluv extends ColorSpace3 {
    hsluv(hpluv: HslData): HslData
    lchuv(hpluv: HslData): LchData
    xyz(hpluv: HslData): XyzData
}

export interface LchuvHpluv {
    hpluv(lchuv: LchData): HslData
}

export interface XyzHpluv {
    hpluv(xyz: XyzData): HslData
}

declare const hpluv: Hpluv;

export default hpluv;

import type {
    ColorSpace3,
    HslData,
    LchData,
    XyzData,
} from './types/color-space.d.ts';

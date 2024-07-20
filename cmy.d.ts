export interface Cmy extends ColorSpace3 {
    rgb(cmy: CmyData): RgbData,
}

export interface RgbCmy {
    cmy(rgb: RgbData): CmyData
}

declare const cmy: Cmy;

export default cmy;

import type {
    ColorSpace3,
    CmyData,
    RgbData,
} from './types/color-space.d.ts';

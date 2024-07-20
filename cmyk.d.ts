export interface Cmyk extends ColorSpace4 {
    rgb(cmyk: CmykData): RgbData
}

export interface RgbCmyk {
    cmyk(rgb: RgbData): CmykData
}

declare const cmyk: Cmyk;

export default cmyk;

import type {
    ColorSpace4,
    CmykData,
    RgbData,
} from './types/color-space.d.ts';

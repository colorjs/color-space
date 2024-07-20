export interface Ycgco extends ColorSpace3 {
    rgb(ycgco: YcgcoData): RgbData
}

export interface RgbYcgco {
    ycgco(rgb: RgbData): YcgcoData
}

declare const ycgco: Ycgco;

export default ycgco;

import type {
    ColorSpace3,
    RgbData,
    YcgcoData,
} from './types/color-space.d.ts';

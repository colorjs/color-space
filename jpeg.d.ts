export interface Jpeg extends ColorSpace3 {
    rgb(yCbCr: YcbcrData): RgbData
}

export interface RgbJpeg {
    jpeg(rgb: RgbData): YcbcrData
}

declare const jpeg: Jpeg;

export default jpeg;

import type {
    ColorSpace3,
    RgbData,
    YcbcrData,
} from './types/color-space.d.ts';

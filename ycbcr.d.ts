export interface Ycbcr extends ColorSpace3 {
    rgb(ycbcr: YcbcrData, kb?: number, kr?: number): RgbData
    ypbpr(ycbcr: YcbcrData): YcbcrData
}

export interface RgbYcbcr {
    ycbcr(rgb: RgbData, kb?: number, kr?: number): YcbcrData
}

export interface YpbprYcbcr {
    ycbcr(ypbpr: YpbprData): YcbcrData
}

declare const ycbcr: Ycbcr;

export default ycbcr;

import type {
    ColorSpace3,
    RgbData,
    YcbcrData,
} from './types/color-space.d.ts';

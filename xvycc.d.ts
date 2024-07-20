export interface Xvycc extends ColorSpace3 {
    rgb(xvycc: YcbcrData, kb?: number, kr?: number): RgbData
    ypbpr(xvycc: YcbcrData): YpbprData
}

export interface YpbprXvycc {
    xvycc(rgb: RgbData, kb?: number, kr?: number): YcbcrData
}

export interface RgbXvycc {
    xvycc(rgb: RgbData, kb?: number, kr?: number): YcbcrData
}

declare const xvycc: Xvycc;

export default xvycc;

import type {
    ColorSpace3,
    RgbData,
    YcbcrData,
    YpbprData,
} from './types/color-space.d.ts';

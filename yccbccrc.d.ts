export interface Yccbccrc extends ColorSpace3 {
    rgb(yccbccrc: YccbccrcData): RgbData
}

export interface RgbYccbccrc {
    yccbccrc(ypbpr: YpbprData): YccbccrcData
}

declare const yccbccrc: Yccbccrc;

export default yccbccrc;

import type {
    ColorSpace3,
    RgbData,
    YccbccrcData,
} from './types/color-space.d.ts';

export interface Ydbdr extends ColorSpace3 {
    rgb(ydbdr: YdbdrData): RgbData
    yuv(ydbdr: YdbdrData): YuvData
}

export interface RgbYdbdr {
    ydbdr(rgb: RgbData): YdbdrData
}

export interface YuvYdbdr {
    ydbdr(yuv: YuvData): YdbdrData
}

declare const ydbdr: Ydbdr;

export default ydbdr;

import type {
    ColorSpace3,
    RgbData,
    YdbdrData,
    YuvData,
} from './types/color-space.d.ts';

export interface Yuv extends ColorSpace3,
    Partial<YuvYdbdr>
{
    rgb(yuv: YuvData): RgbData
}

export interface RgbYuv {
    yuv(rgb: RgbData): YuvData
}

declare const yuv: Yuv;

export default yuv;

import type {
    ColorSpace3,
    RgbData,
    YuvData,
} from './types/color-space.d.ts';
import { YuvYdbdr } from './ydbdr.d.ts';

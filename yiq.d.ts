export interface Yiq extends ColorSpace3 {
    rgb(yiq: YiqData): RgbData
}

export interface RgbYiq {
    yiq(rgb: RgbData): YiqData
}

declare const yiq: Yiq;

export default yiq;

import type {
    ColorSpace3,
    RgbData,
    YiqData,
} from './types/color-space.d.ts';

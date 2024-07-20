export interface Hcy extends ColorSpace3 {
    hsl(hcy: HcyData): RgbData
}

export interface RgbHcy {
    hcy(rgb: RgbData): HcyData
}

declare const hcy: Hcy;

export default hcy;

import type {
    ColorSpace3,
    HcyData,
    RgbData,
} from './types/color-space.d.ts';

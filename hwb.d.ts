export interface Hwb extends ColorSpace3,
    Partial<HwbHcg>
{
    hsl(hwb: HwbData): HslData
    hsv(hwb: HwbData): HsvData
    rgb(hwb: HwbData): RgbData
}

export interface HslHwb {
    hwb(hsl: HslData): HwbData
}

export interface HsvHwb {
    hwb(hsv: HsvData): HwbData,
}

export interface RgbHwb {
    hwb(rgb: RgbData): HwbData
}

declare const hwb: Hwb;

export default hwb;

import type {
    ColorSpace3,
    HslData,
    HsvData,
    HwbData,
    RgbData,
} from './types/color-space.d.ts';
import { HwbHcg } from './hcg.d.ts'

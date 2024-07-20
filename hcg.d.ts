export interface Hcg extends ColorSpace3 {
    hsl(hcg: HcgData): HslData
    hsv(hcg: HcgData): HsvData
    hwb(hcg: HcgData): HwbData
    rgb(hcg: HcgData): RgbData
}

export interface HslHcg {
    hcg(hsv: HsvData): HcgData,
}

export interface HsvHcg {
    hcg(hsl: HslData): HcgData
}

export interface HwbHcg {
    hcg(hwb: HwbData): HcgData
}

export interface RgbHcg {
    hcg(rgb: RgbData): HcgData
}

declare const hcg: Hcg;

export default hcg;

import type {
    ColorSpace3,
    HcgData,
    HslData,
    HsvData,
    HwbData,
    RgbData,
} from './types/color-space.d.ts';

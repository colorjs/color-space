export interface Hsv extends ColorSpace3,
    Partial<HsvHcg>,
    Partial<HsvHwb>
 {
    hsl(hsv: HsvData): HslData,
    rgb(hsv: HsvData): RgbData,
}

export interface HslHsv {
    hsv(hsl: HslData): HsvData
}

export interface RgbHsv {
    hsv(rgb: RgbData): HsvData
}

declare const hsv: Hsv;

export default hsv;

import type {
    ColorSpace3,
    HsvData,
    HslData,
    RgbData,
} from './types/color-space.d.ts';
import type { HsvHcg } from './hcg.d.ts';
import type { HsvHwb } from './hwb.d.ts';

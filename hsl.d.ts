export interface Hsl extends ColorSpace3,
    Partial<HslHcg>,
    Partial<HslHsv>,
    Partial<HslHwb>
{
    rgb(hsl: HslData): RgbData
}

export interface RgbHsl {
    hsl(rgb: RgbData): HslData
}

declare const hsl: Hsl;

export default hsl;

import type {
    ColorSpace3,
    HslData,
    RgbData,
} from './types/color-space.d.ts';
import { HslHcg } from './hcg.d.ts';
import { HslHsv } from './hsv.d.ts';
import { HslHwb } from './hwb.d.ts';

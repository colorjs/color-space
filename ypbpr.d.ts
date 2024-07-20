export interface Ypbpr extends ColorSpace3,
    Partial<YpbprXvycc>,
    Partial<YpbprYcbcr>
{
    rgb(ypbpr: YpbprData, kb?: number, kr?: number): RgbData
}

export interface RgbYpbpr {
    ypbpr(rgb: RgbData, kb?: number, kr?: number): YpbprData
}

declare const ypbpr: Ypbpr;

export default ypbpr;

import type {
    ColorSpace3,
    RgbData,
    YpbprData,
} from './types/color-space.d.ts';
import { YpbprXvycc } from './xvycc.d.ts';
import { YpbprYcbcr } from './ycbcr.d.ts';

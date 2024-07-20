export interface Luv extends ColorSpace3,
    Partial<LuvLchuv>
{
    xyz(luv: LuvData, i?: string, o?: number): XyzData
}

export interface XyzLuv {
    luv(xyz: XyzData): LuvData
}

declare const luv: Luv;

export default luv;

import type {
    ColorSpace3,
    LuvData,
    XyzData,
} from './types/color-space.d.ts';
import { LuvLchuv } from './lchuv.d.ts';

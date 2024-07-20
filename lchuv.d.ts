export interface Lchuv extends ColorSpace3,
    Partial<LchuvHpluv>,
    Partial<LchuvHsluv>
{
    luv(lchuv: LchData): LabData
    xyz(lchuv: LchData): XyzData
}

export interface LuvLchuv {
    lchuv(luv: LuvData, i?: string, o?: number): LchData
}

export interface XyzLchuv {
    lchuv(xyz: XyzData): LchData
}

declare const lchuv: Lchuv;

export default lchuv;

import type {
    ColorSpace3,
    LabData,
    LchData,
    XyzData,
} from './types/color-space.d.ts';
import type { LchuvHpluv } from './hpluv.d.ts';
import type { LchuvHsluv } from './hsluv.d.ts';

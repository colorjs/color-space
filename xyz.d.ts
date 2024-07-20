export type Whitepoint = [number, number, number];

export interface Xyz extends ColorSpace3,
    Partial<XyzColoroid>,
    Partial<XyzHsluv>,
    Partial<XyzHpluv>,
    Partial<XyzLab>,
    Partial<XyzLabh>,
    Partial<XyzLchab>,
    Partial<XyzLchuv>,
    Partial<XyzLms>,
    Partial<XyzLuv>,
    Partial<XyzOsaucs>,
    Partial<XyzUcs>,
    Partial<XyzUvw>,
    Partial<XyzXyy>
{
    whitepoint: {
        2: {
            A: Whitepoint,
            C: Whitepoint,
            D50: Whitepoint,
            D55: Whitepoint,
            D65: Whitepoint,
            D75: Whitepoint,
            F2: Whitepoint,
            F7: Whitepoint,
            F11: Whitepoint,
            E: Whitepoint,
        },
        10: {
            A: Whitepoint,
            C: Whitepoint,
            D50: Whitepoint,
            D55: Whitepoint,
            D65: Whitepoint,
            D75: Whitepoint,
            F2: Whitepoint,
            F7: Whitepoint,
            F11: Whitepoint,
            E: Whitepoint,
        },
    },
    rgb(xyz: XyzData, white?: Whitepoint): RgbData
}

export interface RgbXyz {
    xyz(rgb: RgbData, white?: Whitepoint): XyzData
}

declare const xyz: Xyz;

export default xyz;

import type {
    ColorSpace3,
    RgbData,
    XyzData,
} from './types/color-space.d.ts';
import type { XyzColoroid } from './coloroid.d.ts';
import type { XyzHsluv } from './hsluv.d.ts';
import type { XyzHpluv } from './hpluv.d.ts';
import type { XyzLab } from './lab.d.ts';
import type { XyzLabh } from './labh.d.ts';
import type { XyzLchab } from './lchab.d.ts';
import type { XyzLchuv } from './lchuv.d.ts';
import type { XyzLms } from './lms.d.ts';
import type { XyzLuv } from './luv.d.ts';
import type { XyzOsaucs } from './osaucs.d.ts';
import type { XyzUcs } from './ucs.d.ts';
import type { XyzUvw } from './uvw.d.ts';
import type { XyzXyy } from './xyy.d.ts';

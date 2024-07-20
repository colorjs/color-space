export type LmsMatrix = [number, number, number, number, number, number, number, number, number];

export interface XyzLms {
    lms(xyz: XyzData, matrix?: LmsMatrix): LmsData
}

export interface Lms extends ColorSpace3 {
    matrix: {
        HPE: LmsMatrix,
        VONKRIES: LmsMatrix,
        BFD: LmsMatrix,
        CAT97: LmsMatrix,
        CAT00: LmsMatrix,
        CAT02: LmsMatrix,
    }
    xyz(lms: LmsData, matrix: LmsMatrix): XyzData
}

declare const lms: Lms;

export default lms;

import type {
    ColorSpace3,
    LmsData,
    XyzData,
} from './types/color-space.d.ts';

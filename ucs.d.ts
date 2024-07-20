export interface Ucs extends ColorSpace3 {
    xyz(ucs: UvwData): XyzData
}

export interface XyzUcs {
    ucs(xyz: XyzData): UvwData
}

declare const ucs: Ucs;

export default ucs;

import type {
    ColorSpace3,
    UvwData,
    XyzData,
} from './types/color-space.d.ts';

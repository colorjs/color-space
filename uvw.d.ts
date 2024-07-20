export interface Uvw extends ColorSpace3 {
    xyz(uvw: UvwData, i?: string, o?: number): XyzData
}

export interface XyzUvw {
    uvw(xyz: XyzData, i?: string, o?: number): UvwData
}

declare const uvw: Uvw;

export default uvw;

import type {
    ColorSpace3,
    UvwData,
    XyzData,
} from './types/color-space.d.ts';

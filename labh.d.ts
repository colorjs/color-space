export interface Labh extends ColorSpace3 {
    xyz(labh: LabData): XyzData
}

export interface XyzLabh {
    labh(xyz: XyzData): LabData
}

declare const labh: Labh;

export default labh;

import type {
    ColorSpace3,
    LabData,
    XyzData,
} from './types/color-space.d.ts';

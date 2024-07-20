export interface Lchab extends ColorSpace3 {
    xyz(lchab: LchData): LabData
    lab(lchab: LchData): XyzData
}

export interface LabLchab {
    lchab(lab: LabData): LchData,
}

export interface XyzLchab {
    lchab(xyz: XyzData): LchData
}

declare const lchab: Lchab;

export default lchab;

import type {
    ColorSpace3,
    LabData,
    LchData,
    XyzData,
} from './types/color-space.d.ts';

export interface Lab extends ColorSpace3,
    Partial<LabLchab>
{
    xyz(lab: LabData): XyzData,
}

export interface XyzLab {
    lab(xyz: XyzData): LabData
}

declare const lab: Lab;

export default lab;

import type {
    ColorSpace3,
    LabData,
    XyzData,
} from './types/color-space.d.ts';
import type { LabLchab } from './lchab.d.ts';

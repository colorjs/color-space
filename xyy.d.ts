export interface Xyy extends ColorSpace3,
    Partial<XyyColoroid>
{
    xyz(xyy: XyyData): XyzData
}

export interface XyzXyy {
    xyy(xyz: XyzData): XyyData
}

declare const xyy: Xyy;

export default xyy;

import type {
    ColorSpace3,
    XyyData,
    XyzData,
} from './types/color-space.d.ts';
import { XyyColoroid } from './coloroid.d.ts';

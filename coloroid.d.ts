export interface Coloroid extends ColorSpace3 {
    table: Array<[A: number, angle: number, eλ: number, xλ: number, yλ: number]>
    xyy(atv: AtvData): XyyData
    xyz(atv: AtvData): XyzData
}

export interface XyyColoroid {
    coloroid(xyY: XyyData): AtvData
}

export interface XyzColoroid {
    coloroid(xyz: XyzData): AtvData
}

declare const coloroid: Coloroid;

export default coloroid;

import type {
    ColorSpace3,
    AtvData,
    XyyData,
    XyzData,
} from './types/color-space.d.ts';

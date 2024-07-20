export interface Tsl extends ColorSpace3 {
    rgb(tsl: TslData): RgbData
}

export interface RgbTsl {
    tsl(rgb: RgbData): TslData
}

declare const tsl: Tsl;

export default tsl;

import type {
    ColorSpace3,
    RgbData,
    TslData,
} from './types/color-space.d.ts';

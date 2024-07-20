export interface Hsp extends ColorSpace3 {
    rgb(hsp: HspData): RgbData
}

export interface RgbHsp {
    hsp(rgb: RgbData): HspData
}

declare const hsp: Hsp;

export default hsp;

import type {
    ColorSpace3,
    HspData,
    RgbData,
} from './types/color-space.d.ts';

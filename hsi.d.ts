export interface Hsi extends ColorSpace3 {
    rgb(hsi: HsiData): RgbData
}

export interface RgbHsi {
    hsi(rgb: RgbData): HsiData
}

declare const hsi: Hsi;

export default hsi;

import type {
    ColorSpace3,
    HsiData,
    RgbData,
} from './types/color-space.d.ts';

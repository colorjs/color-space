export interface Yes extends ColorSpace3 {
    rgb(yes: YesData): RgbData
}

export interface RgbYes {
    yes(rgb: RgbData): YesData
}

declare const yes: Yes;

export default yes;

import type {
    ColorSpace3,
    RgbData,
    YesData,
} from './types/color-space.d.ts';

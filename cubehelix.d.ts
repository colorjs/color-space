export interface CubehelixOptions {
    start: number
    rotation: number
    hue: number
    gamma: number
}

export interface Cubehelix extends ColorSpace1 {
    defaults: CubehelixOptions
    rgb(fraction: number, options?: Partial<CubehelixOptions>): RgbData
}

declare const cubehelix: Cubehelix;

export default cubehelix;

import type {
    ColorSpace1,
    RgbData,
} from './types/color-space.d.ts';

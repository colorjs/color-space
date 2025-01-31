import { ColorSpace } from "./color-space";

export type CubehelixOptions = {
  start: number,
  rotation: number,
  hue: number,
  gamma: number
}

export interface CubehelixSpace extends ColorSpace<[number]> {
  name: 'cubehelix'
  rgb: (fraction: [number], options?: CubehelixOptions) => [number]
  defaults: CubehelixOptions
}

declare module "./rgb" {
  interface RgbSpace {
    cubehelix: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const coloroid: CubehelixSpace;
export default coloroid;

import { ColorSpace } from "./types";

export type CubehelixOptions = {
  start: number,
  rotation: number,
  hue: number,
  gamma: number
}

export interface CubehelixSpace extends ColorSpace {
  rgb: (rgb: [number, number, number]) => [number]
  defaults: CubehelixOptions
}

declare module "./rgb" {
  interface RgbSpace {
    cubehelix: (fraction: number | [number], options: CubehelixOptions) => [number, number, number]
  }
}

declare const coloroid: CubehelixSpace;
export default coloroid;

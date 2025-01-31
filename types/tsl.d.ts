import { ColorSpace } from "./color-space";

export interface TslSpace extends ColorSpace {
  name: 'tsl'
  rgb: (tsl: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    tsl: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const tsl: TslSpace;
export default tsl;

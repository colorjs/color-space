import { ColorSpace } from "./color-space";

export interface LrgbSpace extends ColorSpace {
  name: 'lrgb'
  rgb: (lrgb: [number, number, number]) => [number, number, number];
  xyz: (lrgb: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    lrgb: (xyz: [number, number, number]) => [number, number, number]
  }
}
declare module "./rgb" {
  interface RgbSpace {
    lrgb: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const lrgb: LrgbSpace;
export default lrgb;

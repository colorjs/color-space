import { ColorSpace } from "./color-space";

export interface HwbSpace extends ColorSpace {
  name: 'hwb'
  rgb: (hwb: [number, number, number]) => [number, number, number];
  hsl: (hwb: [number, number, number]) => [number, number, number];
  hsv: (hwb: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hwb: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./hsl" {
  interface HslSpace {
    hwb: (hsl: [number, number, number]) => [number, number, number]
  }
}
declare module "./hsv" {
  interface HsvSpace {
    hwb: (hsv: [number, number, number]) => [number, number, number]
  }
}

declare const hwb: HwbSpace;
export default hwb;

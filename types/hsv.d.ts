import { ColorSpace } from "./color-space";

export interface HsvSpace extends ColorSpace {
  name: 'hsv'
  rgb: (hsv: [number, number, number]) => [number, number, number];
  hsl: (hsv: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsv: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./hsl" {
  interface HslSpace {
    hsv: (hsl: [number, number, number]) => [number, number, number]
  }
}

declare const hsv: HsvSpace;
export default hsv;

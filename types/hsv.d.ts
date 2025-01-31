import { ColorSpace } from "./types";

export interface HsvSpace extends ColorSpace {
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

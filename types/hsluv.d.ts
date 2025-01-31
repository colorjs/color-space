import { ColorSpace } from "./types";

export interface HsluvSpace extends ColorSpace {
  lchuv: (hsluv: [number, number, number]) => [number, number, number];
  xyz: (hsluv: [number, number, number]) => [number, number, number];
  hpluv: (hsluv: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsluv: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./lchuv" {
  interface HsvSpace {
    hsluv: (lchuv: [number, number, number]) => [number, number, number]
  }
}
declare module "./xyz" {
  interface HwbSpace {
    hsluv: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const hsluv: HsluvSpace;
export default hsluv;

import { ColorSpace } from "./color-space";

export interface HsluvSpace extends ColorSpace {
  name: 'hsluv'
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
  interface LchuvSpace {
    hsluv: (lchuv: [number, number, number]) => [number, number, number]
  }
}
declare module "./xyz" {
  interface XyzSpace {
    hsluv: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const hsluv: HsluvSpace;
export default hsluv;

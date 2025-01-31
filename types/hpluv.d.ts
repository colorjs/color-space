import { ColorSpace } from "./color-space";

export interface HpluvSpace extends ColorSpace {
  name: 'hpluv'
  lchuv: (hpl: [number, number, number]) => [number, number, number]
  xyz: (hpl: [number, number, number]) => [number, number, number]
  hsluv: (hpl: [number, number, number]) => [number, number, number]
}

declare module "./lchuv" {
  interface LchuvSpace {
    hpluv: (lch: [number, number, number]) => [number, number, number]
  }
}
declare module "./xyz" {
  interface XyzSpace {
    hpluv: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const hcy: HpluvSpace;
export default hcy;

import { ColorSpace } from "./types";

export interface HpluvSpace extends ColorSpace {
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

import { ColorSpace } from "./color-space";

export interface LchuvSpace extends ColorSpace {
  name: 'lchuv'
  xyz: (lchuv: [number, number, number]) => [number, number, number];
  luv: (lchuv: [number, number, number]) => [number, number, number];
}

declare module "./luv" {
  interface LuvSpace {
    lchuv: (luv: [number, number, number]) => [number, number, number]
  }
}

declare module "./xyz" {
  interface XyzSpace {
    lchuv: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const lchuv: LchuvSpace;
export default lchuv;

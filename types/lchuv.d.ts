import { ColorSpace } from "./types";

export interface LchuvSpace extends ColorSpace {
  xyz: (lchuv: [number, number, number]) => [number, number, number];
  luv: (lchuv: [number, number, number]) => [number, number, number];
}

declare module "./luv" {
  interface LabSpace {
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

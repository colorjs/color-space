import { ColorSpace } from "./color-space";

export interface UcsSpace extends ColorSpace {
  name: 'ucs'
  xyz: (ucs: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    ucs: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const ucs: UcsSpace;
export default ucs;

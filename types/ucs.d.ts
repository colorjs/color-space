import { ColorSpace } from "./types";

export interface UcsSpace extends ColorSpace {
  xyz: (ucs: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    ucs: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const ucs: UcsSpace;
export default ucs;

import { ColorSpace } from "./types";

export interface UvwSpace extends ColorSpace {
  xyz: (uvw: [number, number, number]) => [number, number, number];
  ucs: (uvw: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    uvw: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare module "./ucs" {
  interface UcsSpace {
    uvw: (ucs: [number, number, number]) => [number, number, number]
  }
}

declare const uvw: UvwSpace;
export default uvw;

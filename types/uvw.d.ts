import { ColorSpace } from "./color-space";

export interface UvwSpace extends ColorSpace {
  name: 'uvw'
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

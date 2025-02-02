import { ColorSpace } from "./color-space";

export interface OklabSpace extends ColorSpace {
  name: 'oklab'
  xyz: (oklab: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    oklab: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const oklab: OklabSpace;
export default oklab;

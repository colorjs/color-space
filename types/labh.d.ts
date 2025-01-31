import { ColorSpace } from "./color-space";

export interface LabhSpace extends ColorSpace {
  name: 'labh'
  xyz: (labh: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    labh: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const labh: LabhSpace;
export default labh;

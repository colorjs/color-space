import { ColorSpace } from "./types";

export interface LabhSpace extends ColorSpace {
  xyz: (labh: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    labh: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const labh: LabhSpace;
export default labh;

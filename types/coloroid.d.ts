import { ColorSpace } from "./types";

export interface ColoroidSpace extends ColorSpace {
  table: number[][]
  xyy: (atv: [number, number, number]) => [number, number, number]
  xyz: (atv: [number, number, number]) => [number, number, number]
}

declare module "./xyy" {
  interface XyySpace {
    coloroid: (xyy: [number, number, number]) => [number, number, number]
  }
}
declare module "./xyz" {
  interface XyzSpace {
    coloroid: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const coloroid: ColoroidSpace;
export default coloroid;

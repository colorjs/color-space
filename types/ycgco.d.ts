import { ColorSpace } from "./types";

export interface YcgcoSpace extends ColorSpace {
  rgb: (ycgco: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    ycgco: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const ycgco: YcgcoSpace;
export default ycgco;

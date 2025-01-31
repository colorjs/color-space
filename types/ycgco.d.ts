import { ColorSpace } from "./color-space";

export interface YcgcoSpace extends ColorSpace {
  name: 'ycgco'
  rgb: (ycgco: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    ycgco: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const ycgco: YcgcoSpace;
export default ycgco;

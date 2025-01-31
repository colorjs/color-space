import { ColorSpace } from "./types";

export interface YcbcrSpace extends ColorSpace {
  rgb: (ycbcr: [number, number, number]) => [number, number, number];
  ypbpr: (ycbcr: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    ycbcr: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./ypbpr" {
  interface YpbprSpace {
    ycbcr: (ypbpr: [number, number, number]) => [number, number, number]
  }
}

declare const ycbcr: YcbcrSpace;
export default ycbcr;

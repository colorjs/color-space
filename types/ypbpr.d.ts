import { ColorSpace } from "./types";

export interface YpbprSpace extends ColorSpace {
  rgb: (ypbpr: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    ypbpr: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const ypbpr: YpbprSpace;
export default ypbpr;

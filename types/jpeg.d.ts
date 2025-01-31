import { ColorSpace } from "./types";

export interface JpegSpace extends ColorSpace {
  rgb: (jpeg: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    jpeg: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const jpeg: JpegSpace;
export default jpeg;

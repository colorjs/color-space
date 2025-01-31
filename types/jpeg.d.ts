import { ColorSpace } from "./color-space";

export interface JpegSpace extends ColorSpace {
  name: 'jpeg'
  rgb: (jpeg: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    jpeg: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const jpeg: JpegSpace;
export default jpeg;

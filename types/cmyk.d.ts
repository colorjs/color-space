import { ColorSpace } from "./types";

export interface CmykSpace extends ColorSpace {
  rgb: (cmyk: [number, number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    cmyk: (rgb: [number, number, number]) => [number, number, number, number]
  }
}

declare const cmyk: CmykSpace;
export default cmyk;

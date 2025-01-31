import { ColorSpace } from "./color-space";

export interface CmykSpace extends ColorSpace<[number, number, number, number]> {
  name: 'cmyk'
  rgb: (cmyk: [number, number, number, number]) => [number, number, number]
}

declare module "./rgb" {
  interface RgbSpace {
    cmyk: (rgb: [number, number, number]) => [number, number, number, number]
  }
}

declare const cmyk: CmykSpace;
export default cmyk;

import { ColorSpace } from "./color-space";

export interface CmySpace extends ColorSpace {
  name: 'cmy'
  rgb: (cmy: [number, number, number]) => [number, number, number]
}

declare module "./rgb" {
  interface RgbSpace {
    cmy: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const cmy: CmySpace;
export default cmy;

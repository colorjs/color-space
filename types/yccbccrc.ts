import { ColorSpace } from "./color-space";

export interface YccbccrcSpace extends ColorSpace {
  name: 'yccbccrc'
  rgb: (yccbccrc: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    yccbccrc: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const yccbccrc: YccbccrcSpace;
export default yccbccrc;

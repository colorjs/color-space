import { ColorSpace } from "./color-space";

export interface HcySpace extends ColorSpace {
  name: 'hcy'
  rgb: (hcy: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hcy: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const hcy: HcySpace;
export default hcy;

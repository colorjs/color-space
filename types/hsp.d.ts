import { ColorSpace } from "./color-space";

export interface HspSpace extends ColorSpace {
  name: 'hsp'
  rgb: (hsp: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsp: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const hsp: HspSpace;
export default hsp;

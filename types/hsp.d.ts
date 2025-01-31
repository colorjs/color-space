import { ColorSpace } from "./types";

export interface HspSpace extends ColorSpace {
  rgb: (hsp: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsp: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const hsp: HspSpace;
export default hsp;

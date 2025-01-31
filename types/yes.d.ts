import { ColorSpace } from "./types";

export interface YesSpace extends ColorSpace {
  rgb: (yes: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    yes: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const yes: YesSpace;
export default yes;

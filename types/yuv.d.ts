import { ColorSpace } from "./types";

export interface YuvSpace extends ColorSpace {
  rgb: (yuv: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    yuv: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const yuv: YuvSpace;
export default yuv;

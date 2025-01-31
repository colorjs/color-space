import { ColorSpace } from "./types";

export interface YdbdrSpace extends ColorSpace {
  rgb: (ydbdr: [number, number, number]) => [number, number, number];
  yuv: (ydbdr: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    ydbdr: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./yuv" {
  interface YuvSpace {
    ydbdr: (yuv: [number, number, number]) => [number, number, number]
  }
}

declare const ydbdr: YdbdrSpace;
export default ydbdr;

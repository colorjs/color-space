import { ColorSpace } from "./types";

export interface YiqSpace extends ColorSpace {
  rgb: (yiq: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    yiq: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const yiq: YiqSpace;
export default yiq;

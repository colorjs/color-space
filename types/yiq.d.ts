import { ColorSpace } from "./color-space";

export interface YiqSpace extends ColorSpace {
  name: 'yiq'
  rgb: (yiq: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    yiq: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const yiq: YiqSpace;
export default yiq;

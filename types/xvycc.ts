import { ColorSpace } from "./color-space";

export interface XvyccSpace extends ColorSpace {
  name: 'xvycc'
  rgb: (xvycc: [number, number, number]) => [number, number, number];
  ypbpr: (xvycc: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    xvycc: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./ypbpr" {
  interface YpbprSpace {
    xvycc: (ypbpr: [number, number, number]) => [number, number, number]
  }
}

declare const xvycc: XvyccSpace;
export default xvycc;

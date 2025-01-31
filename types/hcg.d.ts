import { ColorSpace } from "./color-space";

export interface HcgSpace extends ColorSpace {
  name: 'hcg'
  rgb: (hcg: [number, number, number]) => [number, number, number];
  hsl: (hcg: [number, number, number]) => [number, number, number];
  hsv: (hcg: [number, number, number]) => [number, number, number];
  hwb: (hcg: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hcg: (rgb: [number, number, number]) => [number, number, number]
  }
}
declare module "./hsl" {
  interface HslSpace {
    hcg: (hsl: [number, number, number]) => [number, number, number]
  }
}
declare module "./hsv" {
  interface HsvSpace {
    hcg: (hsv: [number, number, number]) => [number, number, number]
  }
}
declare module "./hwb" {
  interface HwbSpace {
    hcg: (hwb: [number, number, number]) => [number, number, number]
  }
}

declare const hcg: HcgSpace;
export default hcg;

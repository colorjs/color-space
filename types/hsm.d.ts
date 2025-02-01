import { ColorSpace } from "./color-space";

export interface HsmSpace extends ColorSpace {
  name: 'hsm'
  rgb: (hsm: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsm: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const hsm: HsmSpace;
export default hsm;

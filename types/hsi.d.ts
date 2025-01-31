import { ColorSpace } from "./color-space";

export interface HsiSpace extends ColorSpace {
  name: 'hsi'
  rgb: (hsi: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    hsi: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const hsi: HsiSpace;
export default hsi;

import { ColorSpace } from "./color-space";

export interface LmsSpace extends ColorSpace {
  name: 'lms'
  xyz: (lms: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    lms: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const lms: LmsSpace;
export default lms;

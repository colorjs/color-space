import { ColorSpace } from "./types";

export interface LmsSpace extends ColorSpace {
  xyz: (lms: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    lms: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const lms: LmsSpace;
export default lms;

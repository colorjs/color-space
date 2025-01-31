import { ColorSpace } from "./color-space";

export interface LabSpace extends ColorSpace {
  name: 'lab'
  xyz: (lab: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    lab: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const lab: LabSpace;
export default lab;

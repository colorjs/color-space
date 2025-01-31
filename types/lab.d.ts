import { ColorSpace } from "./types";

export interface LabSpace extends ColorSpace {
  xyz: (lab: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    lab: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const lab: LabSpace;
export default lab;

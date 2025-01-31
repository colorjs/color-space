import { ColorSpace } from "./types";

export interface LuvSpace extends ColorSpace {
  xyz: (luv: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    luv: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const luv: LuvSpace;
export default luv;

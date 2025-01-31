import { ColorSpace } from "./color-space";

export interface OsaucsSpace extends ColorSpace {
  name: 'osaucs'
  xyz: (osaucs: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    osaucs: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const osaucs: OsaucsSpace;
export default osaucs;

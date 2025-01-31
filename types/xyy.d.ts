import { ColorSpace } from './color-space'

export interface XyySpace extends ColorSpace {
  name: 'xyy'
  xyz: (xyy: [number, number, number]) => [number, number, number];
}

declare module "./xyz" {
  interface XyzSpace {
    xyy: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const xyy: XyySpace;
export default xyy;

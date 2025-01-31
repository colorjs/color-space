import { ColorSpace } from './types'

export interface XyzSpace extends ColorSpace {
	rgb: (xyz: [number, number, number]) => [number, number, number]
}

declare module "./rgb" {
  interface RgbSpace {
    xyz: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const xyz: XyzSpace;
export default xyz;

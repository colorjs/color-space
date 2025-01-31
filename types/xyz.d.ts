import { ColorSpace } from './color-space'

export interface XyzSpace extends ColorSpace {
  name: 'xyz'
	rgb: (xyz: [number, number, number]) => [number, number, number]
}

declare module "./rgb" {
  interface RgbSpace {
    xyz: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const xyz: XyzSpace;
export default xyz;

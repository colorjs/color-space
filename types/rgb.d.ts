import { ColorSpace } from './color-space'

export interface RgbSpace extends ColorSpace {
  name: 'rgb'
}

declare const rgb: RgbSpace;
export default rgb;

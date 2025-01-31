import { ColorSpace } from "./color-space";

export interface MunsellSpace extends ColorSpace {
  name: 'munsell'
  coloroid: (munsell: [number, number, number]) => [number, number, number];
}

declare const munsell: MunsellSpace;
export default munsell;

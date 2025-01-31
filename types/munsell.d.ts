import { ColorSpace } from "./types";

export interface MunsellSpace extends ColorSpace {
  coloroid: (munsell: [number, number, number]) => [number, number, number];
}

declare const munsell: MunsellSpace;
export default munsell;

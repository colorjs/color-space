export interface CmySpace {
  name: 'cmy';
	min: [0,0,0];
	max: [100,100,100];
  channel: ['cyan', 'magenta', 'yellow'];
  alias: ['CMY'];
  rgb: (cmy: [number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    cmy: (rgb: [number, number, number]) => [number, number, number]
  }
}

declare const cmy: CmySpace;
export default cmy;

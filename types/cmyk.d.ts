export interface CmykSpace {
  name: 'cmyk',
	min: [0,0,0,0],
	max: [100,100,100,100],
	channel: ['cyan', 'magenta', 'yellow', 'black'],
	alias: ['CMYK'],
  rgb: (cmyk: [number, number, number, number]) => [number, number, number];
}

declare module "./rgb" {
  interface RgbSpace {
    cmyk: (rgb: [number, number, number]) => [number, number, number, number]
  }
}

declare const cmyk: CmykSpace;
export default cmyk;

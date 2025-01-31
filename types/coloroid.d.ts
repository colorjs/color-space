export interface ColoroidSpace {
  name: 'coloroid',
	alias: ['ATV'],
	channel: ['A', 'T', 'V'],
	min: [10, 0, 0],
	max: [76, 100, 100],
  table: number[][],
  xyy: (atv: [number, number, number]) => [number, number, number]
  xyz: (atv: [number, number, number]) => [number, number, number]
}

declare module "./xyy" {
  interface XyySpace {
    coloroid: (xyy: [number, number, number]) => [number, number, number]
  }
}
declare module "./xyz" {
  interface XyzSpace {
    coloroid: (xyz: [number, number, number]) => [number, number, number]
  }
}

declare const coloroid: ColoroidSpace;
export default coloroid;

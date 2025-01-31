export interface RgbSpace {
	name: 'rgb',
	min: [0, 0, 0],
	max: [255, 255, 255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
}

declare const rgb: RgbSpace;
export default rgb;

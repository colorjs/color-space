interface ColorSpace {
    name: string,
    min: Array<number>,
    max: Array<number>,
    channel: Array<string>,
    alias?: Array<string>,
}
interface ColorSpace1 extends ColorSpace {
    min: [number],
    max: [number],
    channel: [string],
}
interface ColorSpace3 extends ColorSpace {
    min: [number, number, number],
    max: [number, number, number],
    channel: [string, string, string],
}
interface ColorSpace4 extends ColorSpace {
    min: [number, number, number, number],
    max: [number, number, number, number],
    channel: [string, string, string, string],
}

export type AtvData = [a: number, t: number, v: number];
export type CmyData = [cyan: number, magenta: number, yellow: number];
export type CmykData = [cyan: number, magenta: number, yellow: number, black: number];
export type HcgData = [hue: number, chroma: number, gray: number];
export type HcyData = [hue: number, chroma: number, luminance: number];
export type HsiData = [hue: number, saturation: number, intensity: number];
export type HslData = [hue: number, saturation: number, lightness: number];
export type HspData = [hue: number, saturation: number, perceived_brightness: number];
export type HsvData = [hue: number, saturation: number, value: number];
export type HwbData = [hue: number, whiteness: number, blackness: number];
export type LabData = [lightness: number, a: number, b: number];
export type LchData = [lightness: number, chroma: number, hue: number];
export type LjgData = [l: number, j: number, g: number];
export type LmsData = [long: number, medium: number, short: number];
export type LuvData = [lightness: number, u: number, v: number];
export type RgbData = [red: number, green: number, blue: number];
export type TslData = [tint: number, stauration: number, lightness: number];
export type UvwData = [u: number, v: number, w: number];
export type XyyData = [x: number, y: number, Y: number];
export type XyzData = [x: number, y: number, z: number];
export type YcbcrData = [y: number, cb: number, cr: number];
export type YccbccrcData = [yc: number, cbc: number, crc: number];
export type YcgcoData = [y: number, cg: number, co: number];
export type YdbdrData = [y: number, db: number, dr: number];
export type YesData = [luminance: number, efactor: number, sfactor: number];
export type YiqData = [y: number, i: number, q: number];
export type YpbprData = [y: number, pb: number, pr: number];
export type YuvData = [y: number, u: number, v: number];

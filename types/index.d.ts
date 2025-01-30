/**
 * @param {ColorSpace} newSpace
 */
export function register(newSpace: ColorSpace): void;
export default spaces;
export type SpaceId = "rgb" | "xyz" | "hsl" | "hsv" | "hsi" | "hwb" | "cmyk" | "cmy" | "xyy" | "yiq" | "yuv" | "ydbdr" | "ycgco" | "ypbpr" | "ycbcr" | "xvycc" | "yccbccrc" | "ucs" | "uvw" | "jpeg" | "lab" | "labh" | "lms" | "lchab" | "luv" | "lchuv" | "hsluv" | "hpluv" | "cubehelix" | "coloroid" | "hcg" | "hcy" | "tsl" | "yes" | "osaucs" | "hsp";
export type Transform = (color: Array<number>, ...rest: Array<any>) => Array<number>;
export type ColorSpaceTransforms = { [key in SpaceId]: Transform; };
export type ColorSpaceBase = {
    name: SpaceId;
    min: Array<number>;
    max: Array<number>;
    channel: Array<string>;
    alias?: string[] | undefined;
};
export type ColorSpace = ColorSpaceBase & ColorSpaceTransforms;
/** @typedef {'rgb' | 'xyz' | 'hsl' | 'hsv' | 'hsi' | 'hwb' | 'cmyk' | 'cmy' | 'xyy' | 'yiq' | 'yuv' | 'ydbdr' | 'ycgco' | 'ypbpr' | 'ycbcr' | 'xvycc' | 'yccbccrc' | 'ucs' | 'uvw' | 'jpeg' | 'lab' | 'labh' | 'lms' | 'lchab' | 'luv' | 'lchuv' | 'hsluv' | 'hpluv' | 'cubehelix' | 'coloroid' | 'hcg' | 'hcy' | 'tsl' | 'yes' | 'osaucs' | 'hsp'} SpaceId */
/** @typedef {(color: Array<number>, ...rest: Array<*>) => Array<number>} Transform */
/** @typedef {{[key in SpaceId]: Transform}} ColorSpaceTransforms */
/**
 * @typedef {Object} ColorSpaceBase
 * @property {SpaceId} name
 * @property {Array<number>} min
 * @property {Array<number>} max
 * @property {Array<string>} channel
 * @property {Array<string>} [alias]
 */
/** @typedef {ColorSpaceBase & ColorSpaceTransforms} ColorSpace */
declare const spaces: { [key in SpaceId]: ColorSpace; };
//# sourceMappingURL=index.d.ts.map
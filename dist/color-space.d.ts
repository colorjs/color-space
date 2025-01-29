declare module "rgb" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hsl" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hsv" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hsi" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hwb" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "cmyk" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "cmy" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "xyz" {
    const _default: import("index").ColorSpace & XYZSpecific;
    export default _default;
    export type XYZSpecific = {
        whitepoint: {
            [x: number]: {
                [x: string]: Array<number>;
            };
        };
    };
}
declare module "xyy" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "yiq" {
    export default yiq;
    var yiq: import("index").ColorSpace;
}
declare module "yuv" {
    export default yuv;
    var yuv: import("index").ColorSpace;
}
declare module "ydbdr" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "ycgco" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "ypbpr" {
    export default ypbpr;
    var ypbpr: import("index").ColorSpace;
}
declare module "ycbcr" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "xvycc" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "yccbccrc" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "ucs" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "uvw" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "jpeg" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "lab" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "labh" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "lms" {
    const _default: import("index").ColorSpace & LMSSpecific;
    export default _default;
    export type LMSSpecific = {
        matrix: {
            [x: string]: Array<number>;
        };
    };
}
declare module "lchab" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "luv" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "lchuv" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hsluv" {
    export namespace _hsluv {
        export { Q as hsluvToRgb };
        export { H as hsluvToLch };
        export { R as rgbToHsluv };
        export { T as rgbToHpluv };
        export { u as rgbToXyz };
        export { P as rgbToLch };
        export { S as hpluvToRgb };
        export { J as hpluvToLch };
        export { K as lchToHpluv };
        export { I as lchToHsluv };
        export { G as lchToLuv };
        export { O as lchToRgb };
        export { F as luvToLch };
        export { E as luvToXyz };
        export { A as xyzToLuv };
        export { t as xyzToRgb };
    }
    const _default: import("index").ColorSpace & HSLuvSpecific;
    export default _default;
    export type HSLuvSpecific = {
        _hsluv: {
            [x: string]: import("index").Transform;
        };
    };
    function Q(a: any): number[];
    function H(a: any): any[];
    function R(a: any): any[];
    function T(a: any): any[];
    function u(a: any): number[];
    function P(a: any): any[];
    function S(a: any): number[];
    function J(a: any): any[];
    function K(a: any): any[];
    function I(a: any): any[];
    function G(a: any): any[];
    function O(a: any): number[];
    function F(a: any): any[];
    function E(a: any): any[];
    function A(a: any): any[];
    function t(a: any): number[];
}
declare module "hpluv" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "cubehelix" {
    const _default: import("index").ColorSpace & CubeHelixSpecific;
    export default _default;
    export type CubeHelixSpecific = {
        defaults: {
            start: number;
            rotation: number;
            hue: number;
            gamma: number;
        };
    };
}
declare module "coloroid" {
    const _default: import("index").ColorSpace & ColoroidSpecific;
    export default _default;
    export type ColoroidSpecific = {
        table: Array<Array<number>>;
    };
}
declare module "hcg" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hcy" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "tsl" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "yes" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "osaucs" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "hsp" {
    const _default: import("index").ColorSpace;
    export default _default;
}
declare module "index" {
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
    const spaces: { [key in SpaceId]: ColorSpace; };
}
//# sourceMappingURL=color-space.d.ts.map
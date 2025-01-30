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
declare const _default: import("./index.js").ColorSpace & HSLuvSpecific;
export default _default;
export type HSLuvSpecific = {
    _hsluv: {
        [x: string]: import("./index.js").Transform;
    };
};
declare function Q(a: any): number[];
declare function H(a: any): any[];
declare function R(a: any): any[];
declare function T(a: any): any[];
declare function u(a: any): number[];
declare function P(a: any): any[];
declare function S(a: any): number[];
declare function J(a: any): any[];
declare function K(a: any): any[];
declare function I(a: any): any[];
declare function G(a: any): any[];
declare function O(a: any): number[];
declare function F(a: any): any[];
declare function E(a: any): any[];
declare function A(a: any): any[];
declare function t(a: any): number[];
//# sourceMappingURL=hsluv.d.ts.map
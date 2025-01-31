import { SpaceId, ColorSpace } from './types';

export type Transform = (color: number[], ...rest: any[]) => number[];
export type ColorSpaceTransforms = { [key in SpaceId]?: Transform };

declare const spaces: { [key in SpaceId]: ColorSpace & ColorSpaceTransforms };
export default spaces;

export * from './types';

// export * from './ciecam';
export * from './cmy';
export * from './cmyk';
export * from './coloroid';
export * from './cubehelix';
export * from './hcg';
export * from './hcy';
export * from './hpluv';
export * from './hsi';
export * from './hsl';
export * from './hsluv';
export * from './hsp';
export * from './hsv';
export * from './hwb';
export * from './jpeg';
export * from './lab';
export * from './labh';
export * from './lchab';
export * from './lchuv';
export * from './lms';
export * from './luv';
export * from './munsell';
export * from './osaucs';
export * from './rgb';
export * from './tsl';
export * from './ucs';
export * from './uvw';
export * from './xvycc';
export * from './xyz';
export * from './xyy';
export * from './ycbcr';
export * from './yccbccrc';
export * from './ycgco';
export * from './ydbdr';
export * from './yes';
export * from './yiq';
export * from './ypbpr';
export * from './yuv';

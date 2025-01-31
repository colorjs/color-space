export type SpaceId = 'rgb' | 'xyz' | 'hsl' | 'hsv' | 'hsi' | 'hwb' | 'cmyk' | 'cmy' | 'xyy' | 'yiq' | 'yuv' | 'ydbdr' | 'ycgco' | 'ypbpr' | 'ycbcr' | 'xvycc' | 'yccbccrc' | 'ucs' | 'uvw' | 'jpeg' | 'lab' | 'labh' | 'lms' | 'lchab' | 'luv' | 'lchuv' | 'hsluv' | 'hpluv' | 'cubehelix' | 'coloroid' | 'hcg' | 'hcy' | 'tsl' | 'yes' | 'osaucs' | 'hsp'

export interface ColorSpace {
  name: SpaceId;
  min: number[];
  max: number[];
  channel: string[];
  alias?: string[];
}

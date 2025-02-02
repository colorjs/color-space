import cmy from './cmy';
import cmyk from './cmyk';
import coloroid from './coloroid';
import cubehelix from './cubehelix';
import hcg from './hcg';
import hcy from './hcy';
import hpluv from './hpluv';
import hsi from './hsi';
import hsl from './hsl';
import hsluv from './hsluv';
import hsp from './hsp';
import hsv from './hsv';
import hwb from './hwb';
import jpeg from './jpeg';
import lab from './lab';
import labh from './labh';
import lchab from './lchab';
import lchuv from './lchuv';
import lms from './lms';
import lrgb from './lrgb';
import luv from './luv';
import munsell from './munsell';
import osaucs from './osaucs';
import oklab from './oklab';
import rgb from './rgb';
import tsl from './tsl';
import ucs from './ucs';
import uvw from './uvw';
import xvycc from './xvycc';
import xyz from './xyz';
import xyy from './xyy';
import ycbcr from './ycbcr';
import yccbccrc from './yccbccrc';
import ycgco from './ycgco';
import ydbdr from './ydbdr';
import yes from './yes';
import yiq from './yiq';
import ypbpr from './ypbpr';
import yuv from './yuv';

declare const space: {
  cmy: typeof cmy;
  cmyk: typeof cmyk;
  coloroid: typeof coloroid;
  cubehelix: typeof cubehelix;
  hcg: typeof hcg;
  hcy: typeof hcy;
  hpluv: typeof hpluv;
  hsi: typeof hsi;
  hsl: typeof hsl;
  hsluv: typeof hsluv;
  hsp: typeof hsp;
  hsv: typeof hsv;
  hwb: typeof hwb;
  jpeg: typeof jpeg;
  lab: typeof lab;
  labh: typeof labh;
  lchab: typeof lchab;
  lchuv: typeof lchuv;
  lms: typeof lms;
  luv: typeof luv;
  lrgb: typeof lrgb;
  munsell: typeof munsell;
  osaucs: typeof osaucs;
  oklab: typeof oklab;
  rgb: typeof rgb;
  tsl: typeof tsl;
  ucs: typeof ucs;
  uvw: typeof uvw;
  xvycc: typeof xvycc;
  xyz: typeof xyz;
  xyy: typeof xyy;
  ycbcr: typeof ycbcr;
  yccbccrc: typeof yccbccrc;
  ycgco: typeof ycgco;
  ydbdr: typeof ydbdr;
  yes: typeof yes;
  yiq: typeof yiq;
  ypbpr: typeof ypbpr;
  yuv: typeof yuv;
};

type SpaceId = keyof typeof space;

export default space;

export type Transforms<Channels extends readonly number[]=[number, number, number]> = {
  /**
   * Convert value from current color space to target color space (via intermediate xyz or rgb space)
   *
   * @param channels - Channel values in the current color space.
   * @returns target color space channel values.
   */
  [key in SpaceId]?: (channels: Channels) => number[];
};

// augment all color spaces with conversions to every other space, except itself
declare module './cmy' { interface CmySpace extends Transforms {}}
declare module './cmyk' { interface CmykSpace extends Transforms<[number, number, number, number]> {}}
declare module './coloroid' { interface ColoroidSpace extends Transforms {}}
declare module './cubehelix' { interface CubehelixSpace extends Transforms<[number]> {}}
declare module './hcg' { interface HcgSpace extends Transforms {}}
declare module './hcy' { interface HcySpace extends Transforms {}}
declare module './hpluv' { interface HpluvSpace extends Transforms {}}
declare module './hsi' { interface HsiSpace extends Transforms {}}
declare module './hsl' { interface HslSpace extends Transforms {}}
declare module './hsluv' { interface HsluvSpace extends Transforms {}}
declare module './hsp' { interface HspSpace extends Transforms {}}
declare module './hsv' { interface HsvSpace extends Transforms {}}
declare module './hwb' { interface HwbSpace extends Transforms {}}
declare module './jpeg' { interface JpegSpace extends Transforms {}}
declare module './lab' { interface LabSpace extends Transforms {}}
declare module './labh' { interface LabhSpace extends Transforms {}}
declare module './lchab' { interface LchabSpace extends Transforms {}}
declare module './lchuv' { interface LchuvSpace extends Transforms {}}
declare module './lms' { interface LmsSpace extends Transforms {}}
declare module './luv' { interface LuvSpace extends Transforms {}}
declare module './lrgb' { interface LrgbSpace extends Transforms {}}
declare module './munsell' { interface MunsellSpace extends Transforms {}}
declare module './osaucs' { interface OsaucsSpace extends Transforms {}}
declare module './oklab' { interface OklabSpace extends Transforms {}}
declare module './rgb' { interface RgbSpace extends Transforms {}}
declare module './tsl' { interface TslSpace extends Transforms {}}
declare module './ucs' { interface UcsSpace extends Transforms {}}
declare module './uvw' { interface UvwSpace extends Transforms {}}
declare module './xvycc' { interface XvyccSpace extends Transforms {}}
declare module './xyz' { interface XyzSpace extends Transforms {}}
declare module './xyy' { interface XyySpace extends Transforms {}}
declare module './ycbcr' { interface YcbcrSpace extends Transforms {}}
declare module './yccbccrc' { interface YccbccrcSpace extends Transforms {}}
declare module './ycgco' { interface YcgcoSpace extends Transforms {}}
declare module './ydbdr' { interface YdbdrSpace extends Transforms {}}
declare module './yes' { interface YesSpace extends Transforms {}}
declare module './yiq' { interface YiqSpace extends Transforms {}}
declare module './ypbpr' { interface YpbprSpace extends Transforms {}}
declare module './yuv' { interface YuvSpace extends Transforms {}}

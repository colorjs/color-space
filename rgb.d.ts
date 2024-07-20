export interface Rgb extends ColorSpace3,
    Partial<RgbCmy>,
    Partial<RgbCmyk>,
    Partial<RgbHcg>,
    Partial<RgbHcy>,
    Partial<RgbHsi>,
    Partial<RgbHsl>,
    Partial<RgbHsluv>,
    Partial<RgbHsp>,
    Partial<RgbHsv>,
    Partial<RgbHwb>,
    Partial<RgbJpeg>,
    Partial<RgbTsl>,
    Partial<RgbXvycc>,
    Partial<RgbXyz>,
    Partial<RgbYcbcr>,
    Partial<RgbYccbccrc>,
    Partial<RgbYcgco>,
    Partial<RgbYdbdr>,
    Partial<RgbYes>,
    Partial<RgbYiq>,
    Partial<RgbYpbpr>,
    Partial<RgbYuv>
{
}

declare const rgb: Rgb;

export default rgb;

import type { RgbCmy } from './cmy.d.ts';
import type { RgbCmyk } from './cmyk.d.ts';
import type { RgbHcg } from './hcg.d.ts';
import type { RgbHcy } from './hcy.d.ts';
import type { RgbHsi } from './hsi.d.ts';
import type { RgbHsl } from './hsl.d.ts';
import type { RgbHsluv } from './hsluv.d.ts';
import type { RgbHsp } from './hsp.d.ts';
import type { RgbHsv } from './hsv.d.ts';
import type { RgbHwb } from './hwb.d.ts';
import type { RgbJpeg } from './jpeg.d.ts';
import type { RgbTsl } from './tsl.d.ts';
import type { RgbXvycc } from './xvycc.d.ts';
import type { RgbXyz } from './xyz.d.ts';
import type { RgbYcbcr } from './ycbcr.d.ts';
import type { RgbYccbccrc } from './yccbccrc.d.ts';
import type { RgbYcgco } from './ycgco.d.ts';
import type { RgbYdbdr } from './ydbdr.d.ts';
import type { RgbYes } from './yes.d.ts';
import type { RgbYiq } from './yiq.d.ts';
import type { RgbYpbpr } from './ypbpr.d.ts';
import type { RgbYuv } from './yuv.d.ts';
import type { ColorSpace3 } from './types/color-space.d.ts';

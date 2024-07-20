interface Spaces {
    // ciecam: typeof ciecam,
    cmy: typeof cmy & {
        cmyk(cmy: CmyData): CmykData
        coloroid(cmy: CmyData): AtvData
        hcg(cmy: CmyData): HcgData
        hcy(cmy: CmyData): HcyData
        hpluv(cmy: CmyData): HslData
        hsi(cmy: CmyData): HsiData
        hsl(cmy: CmyData): HslData
        hsluv(cmy: CmyData): HslData
        hsp(cmy: CmyData): HspData
        hsv(cmy: CmyData): HsvData
        hwb(cmy: CmyData): HwbData
        jpeg(cmy: CmyData): YcbcrData
        lab(cmy: CmyData): LabData
        labh(cmy: CmyData): LabData
        lchab(cmy: CmyData): LchData
        lchuv(cmy: CmyData): LchData
        lms(cmy: CmyData): LmsData
        luv(cmy: CmyData): LuvData
        osaucs(cmy: CmyData): LjgData
        rgb(cmy: CmyData): RgbData
        tsl(cmy: CmyData): TslData
        ucs(cmy: CmyData): UvwData
        uvw(cmy: CmyData): UvwData
        xvycc(cmy: CmyData): YcbcrData
        xyy(cmy: CmyData): XyyData
        xyz(cmy: CmyData): XyzData
        ycbcr(cmy: CmyData): YcbcrData
        yccbccrc(cmy: CmyData): YccbccrcData
        ycgco(cmy: CmyData): YcgcoData
        ydbdr(cmy: CmyData): YdbdrData
        yes(cmy: CmyData): YesData
        yiq(cmy: CmyData): YiqData
        ypbpr(cmy: CmyData): YpbprData
        yuv(cmy: CmyData): YuvData
    },
    cmyk: typeof cmyk & {
        cmy(cmyk: CmykData): CmyData,
        coloroid(cmyk: CmykData): AtvData,
        hcg(cmyk: CmykData): HcgData,
        hcy(cmyk: CmykData): HcyData,
        hpluv(cmyk: CmykData): HslData,
        hsi(cmyk: CmykData): HsiData,
        hsl(cmyk: CmykData): HslData,
        hsluv(cmyk: CmykData): HslData,
        hsp(cmyk: CmykData): HspData,
        hsv(cmyk: CmykData): HsvData,
        hwb(cmyk: CmykData): HwbData,
        jpeg(cmyk: CmykData): YcbcrData,
        lab(cmyk: CmykData): LabData,
        labh(cmyk: CmykData): LabData,
        lchab(cmyk: CmykData): LchData,
        lchuv(cmyk: CmykData): LchData,
        lms(cmyk: CmykData): LmsData,
        luv(cmyk: CmykData): LuvData,
        osaucs(cmyk: CmykData): LjgData,
        rgb(cmyk: CmykData): RgbData,
        tsl(cmyk: CmykData): TslData,
        ucs(cmyk: CmykData): UvwData,
        uvw(cmyk: CmykData): UvwData,
        xvycc(cmyk: CmykData): YcbcrData,
        xyy(cmyk: CmykData): XyyData,
        xyz(cmyk: CmykData): XyzData,
        ycbcr(cmyk: CmykData): YcbcrData,
        yccbccrc(cmyk: CmykData): YccbccrcData,
        ycgco(cmyk: CmykData): YcgcoData,
        ydbdr(cmyk: CmykData): YdbdrData,
        yes(cmyk: CmykData): YesData,
        yiq(cmyk: CmykData): YiqData,
        ypbpr(cmyk: CmykData): YpbprData,
        yuv(cmyk: CmykData): YuvData,
    },
    coloroid: typeof coloroid & {
        cmy(atv: AtvData): CmyData
        cmyk(atv: AtvData): CmykData
        hcg(atv: AtvData): HcgData
        hcy(atv: AtvData): HcyData
        hpluv(atv: AtvData): HslData
        hsi(atv: AtvData): HsiData
        hsl(atv: AtvData): HslData
        hsluv(atv: AtvData): HslData
        hsp(atv: AtvData): HspData
        hsv(atv: AtvData): HsvData
        hwb(atv: AtvData): HwbData
        jpeg(atv: AtvData): YcbcrData
        lab(atv: AtvData): LabData
        labh(atv: AtvData): LabData
        lchab(atv: AtvData): LchData
        lchuv(atv: AtvData): LchData
        lms(atv: AtvData): LmsData
        luv(atv: AtvData): LuvData
        osaucs(atv: AtvData): LjgData
        rgb(atv: AtvData): RgbData
        tsl(atv: AtvData): TslData
        ucs(atv: AtvData): UvwData
        uvw(atv: AtvData): UvwData
        xvycc(atv: AtvData): YcbcrData
        xyy(atv: AtvData): XyyData
        xyz(atv: AtvData): XyzData
        ycbcr(atv: AtvData): YcbcrData
        yccbccrc(atv: AtvData): YccbccrcData
        ycgco(atv: AtvData): YcgcoData
        ydbdr(atv: AtvData): YdbdrData
        yes(atv: AtvData): YesData
        yiq(atv: AtvData): YiqData
        ypbpr(atv: AtvData): YpbprData
        yuv(atv: AtvData): YuvData
    },
    cubehelix: typeof cubehelix & {
        cmy(fraction: number, options?: Partial<CubehelixOptions>): CmyData
        cmyk(fraction: number, options?: Partial<CubehelixOptions>): CmykData
        coloroid(fraction: number, options?: Partial<CubehelixOptions>): AtvData
        hcg(fraction: number, options?: Partial<CubehelixOptions>): HcgData
        hcy(fraction: number, options?: Partial<CubehelixOptions>): HcyData
        hpluv(fraction: number, options?: Partial<CubehelixOptions>): HslData
        hsi(fraction: number, options?: Partial<CubehelixOptions>): HsiData
        hsl(fraction: number, options?: Partial<CubehelixOptions>): HslData
        hsluv(fraction: number, options?: Partial<CubehelixOptions>): HslData
        hsp(fraction: number, options?: Partial<CubehelixOptions>): HspData
        hsv(fraction: number, options?: Partial<CubehelixOptions>): HsvData
        hwb(fraction: number, options?: Partial<CubehelixOptions>): HwbData
        jpeg(fraction: number, options?: Partial<CubehelixOptions>): YcbcrData
        lab(fraction: number, options?: Partial<CubehelixOptions>): LabData
        labh(fraction: number, options?: Partial<CubehelixOptions>): LabData
        lchab(fraction: number, options?: Partial<CubehelixOptions>): LchData
        lchuv(fraction: number, options?: Partial<CubehelixOptions>): LchData
        lms(fraction: number, options?: Partial<CubehelixOptions>): LmsData
        luv(fraction: number, options?: Partial<CubehelixOptions>): LuvData
        osaucs(fraction: number, options?: Partial<CubehelixOptions>): LjgData
        rgb(fraction: number, options?: Partial<CubehelixOptions>): RgbData
        tsl(fraction: number, options?: Partial<CubehelixOptions>): TslData
        ucs(fraction: number, options?: Partial<CubehelixOptions>): UvwData
        uvw(fraction: number, options?: Partial<CubehelixOptions>): UvwData
        xvycc(fraction: number, options?: Partial<CubehelixOptions>): YcbcrData
        xyy(fraction: number, options?: Partial<CubehelixOptions>): XyyData
        xyz(fraction: number, options?: Partial<CubehelixOptions>): XyzData
        ycbcr(fraction: number, options?: Partial<CubehelixOptions>): YcbcrData
        yccbccrc(fraction: number, options?: Partial<CubehelixOptions>): YccbccrcData
        ycgco(fraction: number, options?: Partial<CubehelixOptions>): YcgcoData
        ydbdr(fraction: number, options?: Partial<CubehelixOptions>): YdbdrData
        yes(fraction: number, options?: Partial<CubehelixOptions>): YesData
        yiq(fraction: number, options?: Partial<CubehelixOptions>): YiqData
        ypbpr(fraction: number, options?: Partial<CubehelixOptions>): YpbprData
        yuv(fraction: number, options?: Partial<CubehelixOptions>): YuvData
    },
    hcg: typeof hcg & {
        cmy(hcg: HcgData): CmyData
        cmyk(hcg: HcgData): CmykData
        coloroid(hcg: HcgData): AtvData
        hcy(hcg: HcgData): HcyData
        hpluv(hcg: HcgData): HslData
        hsi(hcg: HcgData): HsiData
        hsl(hcg: HcgData): HslData
        hsluv(hcg: HcgData): HslData
        hsp(hcg: HcgData): HspData
        hsv(hcg: HcgData): HsvData
        hwb(hcg: HcgData): HwbData
        jpeg(hcg: HcgData): YcbcrData
        lab(hcg: HcgData): LabData
        labh(hcg: HcgData): LabData
        lchab(hcg: HcgData): LchData
        lchuv(hcg: HcgData): LchData
        lms(hcg: HcgData): LmsData
        luv(hcg: HcgData): LuvData
        osaucs(hcg: HcgData): LjgData
        rgb(hcg: HcgData): RgbData
        tsl(hcg: HcgData): TslData
        ucs(hcg: HcgData): UvwData
        uvw(hcg: HcgData): UvwData
        xvycc(hcg: HcgData): YcbcrData
        xyy(hcg: HcgData): XyyData
        xyz(hcg: HcgData): XyzData
        ycbcr(hcg: HcgData): YcbcrData
        yccbccrc(hcg: HcgData): YccbccrcData
        ycgco(hcg: HcgData): YcgcoData
        ydbdr(hcg: HcgData): YdbdrData
        yes(hcg: HcgData): YesData
        yiq(hcg: HcgData): YiqData
        ypbpr(hcg: HcgData): YpbprData
        yuv(hcg: HcgData): YuvData
    },
    hcy: typeof hcy & {
        cmy(hcy: HcyData): CmyData
        cmyk(hcy: HcyData): CmykData
        coloroid(hcy: HcyData): AtvData
        hcg(hcy: HcyData): HcgData
        hpluv(hcy: HcyData): HslData
        hsi(hcy: HcyData): HsiData
        hsl(hcy: HcyData): HslData
        hsluv(hcy: HcyData): HslData
        hsp(hcy: HcyData): HspData
        hsv(hcy: HcyData): HsvData
        hwb(hcy: HcyData): HwbData
        jpeg(hcy: HcyData): YcbcrData
        lab(hcy: HcyData): LabData
        labh(hcy: HcyData): LabData
        lchab(hcy: HcyData): LchData
        lchuv(hcy: HcyData): LchData
        lms(hcy: HcyData): LmsData
        luv(hcy: HcyData): LuvData
        osaucs(hcy: HcyData): LjgData
        rgb(hcy: HcyData): RgbData
        tsl(hcy: HcyData): TslData
        ucs(hcy: HcyData): UvwData
        uvw(hcy: HcyData): UvwData
        xvycc(hcy: HcyData): YcbcrData
        xyy(hcy: HcyData): XyyData
        xyz(hcy: HcyData): XyzData
        ycbcr(hcy: HcyData): YcbcrData
        yccbccrc(hcy: HcyData): YccbccrcData
        ycgco(hcy: HcyData): YcgcoData
        ydbdr(hcy: HcyData): YdbdrData
        yes(hcy: HcyData): YesData
        yiq(hcy: HcyData): YiqData
        ypbpr(hcy: HcyData): YpbprData
        yuv(hcy: HcyData): YuvData
    },
    hpluv: typeof hpluv & {
        cmy(hsl: HslData): CmyData
        cmyk(hsl: HslData): CmykData
        coloroid(hsl: HslData): AtvData
        hcg(hsl: HslData): HcgData
        hcy(hsl: HslData): HcyData
        hsi(hsl: HslData): HsiData
        hsl(hsl: HslData): HslData
        hsluv(hsl: HslData): HslData
        hsp(hsl: HslData): HspData
        hsv(hsl: HslData): HsvData
        hwb(hsl: HslData): HwbData
        jpeg(hsl: HslData): YcbcrData
        lab(hsl: HslData): LabData
        labh(hsl: HslData): LabData
        lchab(hsl: HslData): LchData
        lchuv(hsl: HslData): LchData
        lms(hsl: HslData): LmsData
        luv(hsl: HslData): LuvData
        osaucs(hsl: HslData): LjgData
        rgb(hsl: HslData): RgbData
        tsl(hsl: HslData): TslData
        ucs(hsl: HslData): UvwData
        uvw(hsl: HslData): UvwData
        xvycc(hsl: HslData): YcbcrData
        xyy(hsl: HslData): XyyData
        xyz(hsl: HslData): XyzData
        ycbcr(hsl: HslData): YcbcrData
        yccbccrc(hsl: HslData): YccbccrcData
        ycgco(hsl: HslData): YcgcoData
        ydbdr(hsl: HslData): YdbdrData
        yes(hsl: HslData): YesData
        yiq(hsl: HslData): YiqData
        ypbpr(hsl: HslData): YpbprData
        yuv(hsl: HslData): YuvData
    },
    hsi: typeof hsi & {
        cmy(hsi: HsiData): CmyData
        cmyk(hsi: HsiData): CmykData
        coloroid(hsi: HsiData): AtvData
        hcg(hsi: HsiData): HcgData
        hcy(hsi: HsiData): HcyData
        hpluv(hsi: HsiData): HslData
        hsl(hsi: HsiData): HslData
        hsluv(hsi: HsiData): HslData
        hsp(hsi: HsiData): HspData
        hsv(hsi: HsiData): HsvData
        hwb(hsi: HsiData): HwbData
        jpeg(hsi: HsiData): YcbcrData
        lab(hsi: HsiData): LabData
        labh(hsi: HsiData): LabData
        lchab(hsi: HsiData): LchData
        lchuv(hsi: HsiData): LchData
        lms(hsi: HsiData): LmsData
        luv(hsi: HsiData): LuvData
        osaucs(hsi: HsiData): LjgData
        rgb(hsi: HsiData): RgbData
        tsl(hsi: HsiData): TslData
        ucs(hsi: HsiData): UvwData
        uvw(hsi: HsiData): UvwData
        xvycc(hsi: HsiData): YcbcrData
        xyy(hsi: HsiData): XyyData
        xyz(hsi: HsiData): XyzData
        ycbcr(hsi: HsiData): YcbcrData
        yccbccrc(hsi: HsiData): YccbccrcData
        ycgco(hsi: HsiData): YcgcoData
        ydbdr(hsi: HsiData): YdbdrData
        yes(hsi: HsiData): YesData
        yiq(hsi: HsiData): YiqData
        ypbpr(hsi: HsiData): YpbprData
        yuv(hsi: HsiData): YuvData
    },
    hsl: typeof hsl & {
        cmy(hsl: HslData): CmyData
        cmyk(hsl: HslData): CmykData
        coloroid(hsl: HslData): AtvData
        hcg(hsl: HslData): HcgData
        hcy(hsl: HslData): HcyData
        hpluv(hsl: HslData): HslData
        hsi(hsl: HslData): HsiData
        hsluv(hsl: HslData): HslData
        hsp(hsl: HslData): HspData
        hsv(hsl: HslData): HsvData
        hwb(hsl: HslData): HwbData
        jpeg(hsl: HslData): YcbcrData
        lab(hsl: HslData): LabData
        labh(hsl: HslData): LabData
        lchab(hsl: HslData): LchData
        lchuv(hsl: HslData): LchData
        lms(hsl: HslData): LmsData
        luv(hsl: HslData): LuvData
        osaucs(hsl: HslData): LjgData
        rgb(hsl: HslData): RgbData
        tsl(hsl: HslData): TslData
        ucs(hsl: HslData): UvwData
        uvw(hsl: HslData): UvwData
        xvycc(hsl: HslData): YcbcrData
        xyy(hsl: HslData): XyyData
        xyz(hsl: HslData): XyzData
        ycbcr(hsl: HslData): YcbcrData
        yccbccrc(hsl: HslData): YccbccrcData
        ycgco(hsl: HslData): YcgcoData
        ydbdr(hsl: HslData): YdbdrData
        yes(hsl: HslData): YesData
        yiq(hsl: HslData): YiqData
        ypbpr(hsl: HslData): YpbprData
        yuv(hsl: HslData): YuvData
    },
    hsluv: typeof hsluv & {
        cmy(hsl: HslData): CmyData
        cmyk(hsl: HslData): CmykData
        coloroid(hsl: HslData): AtvData
        hcg(hsl: HslData): HcgData
        hcy(hsl: HslData): HcyData
        hpluv(hsl: HslData): HslData
        hsi(hsl: HslData): HsiData
        hsl(hsl: HslData): HslData
        hsp(hsl: HslData): HspData
        hsv(hsl: HslData): HsvData
        hwb(hsl: HslData): HwbData
        jpeg(hsl: HslData): YcbcrData
        lab(hsl: HslData): LabData
        labh(hsl: HslData): LabData
        lchab(hsl: HslData): LchData
        lchuv(hsl: HslData): LchData
        lms(hsl: HslData): LmsData
        luv(hsl: HslData): LuvData
        osaucs(hsl: HslData): LjgData
        rgb(hsl: HslData): RgbData
        tsl(hsl: HslData): TslData
        ucs(hsl: HslData): UvwData
        uvw(hsl: HslData): UvwData
        xvycc(hsl: HslData): YcbcrData
        xyy(hsl: HslData): XyyData
        xyz(hsl: HslData): XyzData
        ycbcr(hsl: HslData): YcbcrData
        yccbccrc(hsl: HslData): YccbccrcData
        ycgco(hsl: HslData): YcgcoData
        ydbdr(hsl: HslData): YdbdrData
        yes(hsl: HslData): YesData
        yiq(hsl: HslData): YiqData
        ypbpr(hsl: HslData): YpbprData
        yuv(hsl: HslData): YuvData
    },
    hsp: typeof hsp & {
        cmy(hsp: HspData): CmyData
        cmyk(hsp: HspData): CmykData
        coloroid(hsp: HspData): AtvData
        hcg(hsp: HspData): HcgData
        hcy(hsp: HspData): HcyData
        hpluv(hsp: HspData): HslData
        hsi(hsp: HspData): HsiData
        hsl(hsp: HspData): HslData
        hsluv(hsp: HspData): HslData
        hsv(hsp: HspData): HsvData
        hwb(hsp: HspData): HwbData
        jpeg(hsp: HspData): YcbcrData
        lab(hsp: HspData): LabData
        labh(hsp: HspData): LabData
        lchab(hsp: HspData): LchData
        lchuv(hsp: HspData): LchData
        lms(hsp: HspData): LmsData
        luv(hsp: HspData): LuvData
        osaucs(hsp: HspData): LjgData
        rgb(hsp: HspData): RgbData
        tsl(hsp: HspData): TslData
        ucs(hsp: HspData): UvwData
        uvw(hsp: HspData): UvwData
        xvycc(hsp: HspData): YcbcrData
        xyy(hsp: HspData): XyyData
        xyz(hsp: HspData): XyzData
        ycbcr(hsp: HspData): YcbcrData
        yccbccrc(hsp: HspData): YccbccrcData
        ycgco(hsp: HspData): YcgcoData
        ydbdr(hsp: HspData): YdbdrData
        yes(hsp: HspData): YesData
        yiq(hsp: HspData): YiqData
        ypbpr(hsp: HspData): YpbprData
        yuv(hsp: HspData): YuvData
    },
    hsv: typeof hsv & {
        cmy(hsv: HsvData): CmyData
        cmyk(hsv: HsvData): CmykData
        coloroid(hsv: HsvData): AtvData
        hcg(hsv: HsvData): HcgData
        hcy(hsv: HsvData): HcyData
        hpluv(hsv: HsvData): HslData
        hsi(hsv: HsvData): HsiData
        hsl(hsv: HsvData): HslData
        hsluv(hsv: HsvData): HslData
        hsp(hsv: HsvData): HspData
        hwb(hsv: HsvData): HwbData
        jpeg(hsv: HsvData): YcbcrData
        lab(hsv: HsvData): LabData
        labh(hsv: HsvData): LabData
        lchab(hsv: HsvData): LchData
        lchuv(hsv: HsvData): LchData
        lms(hsv: HsvData): LmsData
        luv(hsv: HsvData): LuvData
        osaucs(hsv: HsvData): LjgData
        rgb(hsv: HsvData): RgbData
        tsl(hsv: HsvData): TslData
        ucs(hsv: HsvData): UvwData
        uvw(hsv: HsvData): UvwData
        xvycc(hsv: HsvData): YcbcrData
        xyy(hsv: HsvData): XyyData
        xyz(hsv: HsvData): XyzData
        ycbcr(hsv: HsvData): YcbcrData
        yccbccrc(hsv: HsvData): YccbccrcData
        ycgco(hsv: HsvData): YcgcoData
        ydbdr(hsv: HsvData): YdbdrData
        yes(hsv: HsvData): YesData
        yiq(hsv: HsvData): YiqData
        ypbpr(hsv: HsvData): YpbprData
        yuv(hsv: HsvData): YuvData
    },
    hwb: typeof hwb & {
        cmy(hwb: HwbData): CmyData
        cmyk(hwb: HwbData): CmykData
        coloroid(hwb: HwbData): AtvData
        hcg(hwb: HwbData): HcgData
        hcy(hwb: HwbData): HcyData
        hpluv(hwb: HwbData): HslData
        hsi(hwb: HwbData): HsiData
        hsl(hwb: HwbData): HslData
        hsluv(hwb: HwbData): HslData
        hsp(hwb: HwbData): HspData
        hsv(hwb: HwbData): HsvData
        jpeg(hwb: HwbData): YcbcrData
        lab(hwb: HwbData): LabData
        labh(hwb: HwbData): LabData
        lchab(hwb: HwbData): LchData
        lchuv(hwb: HwbData): LchData
        lms(hwb: HwbData): LmsData
        luv(hwb: HwbData): LuvData
        osaucs(hwb: HwbData): LjgData
        rgb(hwb: HwbData): RgbData
        tsl(hwb: HwbData): TslData
        ucs(hwb: HwbData): UvwData
        uvw(hwb: HwbData): UvwData
        xvycc(hwb: HwbData): YcbcrData
        xyy(hwb: HwbData): XyyData
        xyz(hwb: HwbData): XyzData
        ycbcr(hwb: HwbData): YcbcrData
        yccbccrc(hwb: HwbData): YccbccrcData
        ycgco(hwb: HwbData): YcgcoData
        ydbdr(hwb: HwbData): YdbdrData
        yes(hwb: HwbData): YesData
        yiq(hwb: HwbData): YiqData
        ypbpr(hwb: HwbData): YpbprData
        yuv(hwb: HwbData): YuvData
    },
    jpeg: typeof jpeg & {
        cmy(ycbcr: YcbcrData): CmyData
        cmyk(ycbcr: YcbcrData): CmykData
        coloroid(ycbcr: YcbcrData): AtvData
        hcg(ycbcr: YcbcrData): HcgData
        hcy(ycbcr: YcbcrData): HcyData
        hpluv(ycbcr: YcbcrData): HslData
        hsi(ycbcr: YcbcrData): HsiData
        hsl(ycbcr: YcbcrData): HslData
        hsluv(ycbcr: YcbcrData): HslData
        hsp(ycbcr: YcbcrData): HspData
        hsv(ycbcr: YcbcrData): HsvData
        hwb(ycbcr: YcbcrData): HwbData
        lab(ycbcr: YcbcrData): LabData
        labh(ycbcr: YcbcrData): LabData
        lchab(ycbcr: YcbcrData): LchData
        lchuv(ycbcr: YcbcrData): LchData
        lms(ycbcr: YcbcrData): LmsData
        luv(ycbcr: YcbcrData): LuvData
        osaucs(ycbcr: YcbcrData): LjgData
        rgb(ycbcr: YcbcrData): RgbData
        tsl(ycbcr: YcbcrData): TslData
        ucs(ycbcr: YcbcrData): UvwData
        uvw(ycbcr: YcbcrData): UvwData
        xvycc(ycbcr: YcbcrData): YcbcrData
        xyy(ycbcr: YcbcrData): XyyData
        xyz(ycbcr: YcbcrData): XyzData
        ycbcr(ycbcr: YcbcrData): YcbcrData
        yccbccrc(ycbcr: YcbcrData): YccbccrcData
        ycgco(ycbcr: YcbcrData): YcgcoData
        ydbdr(ycbcr: YcbcrData): YdbdrData
        yes(ycbcr: YcbcrData): YesData
        yiq(ycbcr: YcbcrData): YiqData
        ypbpr(ycbcr: YcbcrData): YpbprData
        yuv(ycbcr: YcbcrData): YuvData
    },
    lab: typeof lab & {
        cmy(lab: LabData): CmyData
        cmyk(lab: LabData): CmykData
        coloroid(lab: LabData): AtvData
        hcg(lab: LabData): HcgData
        hcy(lab: LabData): HcyData
        hpluv(lab: LabData): HslData
        hsi(lab: LabData): HsiData
        hsl(lab: LabData): HslData
        hsluv(lab: LabData): HslData
        hsp(lab: LabData): HspData
        hsv(lab: LabData): HsvData
        hwb(lab: LabData): HwbData
        jpeg(lab: LabData): YcbcrData
        labh(lab: LabData): LabData
        lchab(lab: LabData): LchData
        lchuv(lab: LabData): LchData
        lms(lab: LabData): LmsData
        luv(lab: LabData): LuvData
        osaucs(lab: LabData): LjgData
        rgb(lab: LabData): RgbData
        tsl(lab: LabData): TslData
        ucs(lab: LabData): UvwData
        uvw(lab: LabData): UvwData
        xvycc(lab: LabData): YcbcrData
        xyy(lab: LabData): XyyData
        xyz(lab: LabData): XyzData
        ycbcr(lab: LabData): YcbcrData
        yccbccrc(lab: LabData): YccbccrcData
        ycgco(lab: LabData): YcgcoData
        ydbdr(lab: LabData): YdbdrData
        yes(lab: LabData): YesData
        yiq(lab: LabData): YiqData
        ypbpr(lab: LabData): YpbprData
        yuv(lab: LabData): YuvData
    },
    labh: typeof labh & {
        cmy(lab: LabData): CmyData
        cmyk(lab: LabData): CmykData
        coloroid(lab: LabData): AtvData
        hcg(lab: LabData): HcgData
        hcy(lab: LabData): HcyData
        hpluv(lab: LabData): HslData
        hsi(lab: LabData): HsiData
        hsl(lab: LabData): HslData
        hsluv(lab: LabData): HslData
        hsp(lab: LabData): HspData
        hsv(lab: LabData): HsvData
        hwb(lab: LabData): HwbData
        jpeg(lab: LabData): YcbcrData
        lab(lab: LabData): LabData
        lchab(lab: LabData): LchData
        lchuv(lab: LabData): LchData
        lms(lab: LabData): LmsData
        luv(lab: LabData): LuvData
        osaucs(lab: LabData): LjgData
        rgb(lab: LabData): RgbData
        tsl(lab: LabData): TslData
        ucs(lab: LabData): UvwData
        uvw(lab: LabData): UvwData
        xvycc(lab: LabData): YcbcrData
        xyy(lab: LabData): XyyData
        xyz(lab: LabData): XyzData
        ycbcr(lab: LabData): YcbcrData
        yccbccrc(lab: LabData): YccbccrcData
        ycgco(lab: LabData): YcgcoData
        ydbdr(lab: LabData): YdbdrData
        yes(lab: LabData): YesData
        yiq(lab: LabData): YiqData
        ypbpr(lab: LabData): YpbprData
        yuv(lab: LabData): YuvData
    },
    lchab: typeof lchab & {
        cmy(lch: LchData): CmyData
        cmyk(lch: LchData): CmykData
        coloroid(lch: LchData): AtvData
        hcg(lch: LchData): HcgData
        hcy(lch: LchData): HcyData
        hpluv(lch: LchData): HslData
        hsi(lch: LchData): HsiData
        hsl(lch: LchData): HslData
        hsluv(lch: LchData): HslData
        hsp(lch: LchData): HspData
        hsv(lch: LchData): HsvData
        hwb(lch: LchData): HwbData
        jpeg(lch: LchData): YcbcrData
        lab(lch: LchData): LabData
        labh(lch: LchData): LabData
        lchuv(lch: LchData): LchData
        lms(lch: LchData): LmsData
        luv(lch: LchData): LuvData
        osaucs(lch: LchData): LjgData
        rgb(lch: LchData): RgbData
        tsl(lch: LchData): TslData
        ucs(lch: LchData): UvwData
        uvw(lch: LchData): UvwData
        xvycc(lch: LchData): YcbcrData
        xyy(lch: LchData): XyyData
        xyz(lch: LchData): XyzData
        ycbcr(lch: LchData): YcbcrData
        yccbccrc(lch: LchData): YccbccrcData
        ycgco(lch: LchData): YcgcoData
        ydbdr(lch: LchData): YdbdrData
        yes(lch: LchData): YesData
        yiq(lch: LchData): YiqData
        ypbpr(lch: LchData): YpbprData
        yuv(lch: LchData): YuvData
    },
    lchuv: typeof lchuv & {
        cmy(lch: LchData): CmyData
        cmyk(lch: LchData): CmykData
        coloroid(lch: LchData): AtvData
        hcg(lch: LchData): HcgData
        hcy(lch: LchData): HcyData
        hpluv(lch: LchData): HslData
        hsi(lch: LchData): HsiData
        hsl(lch: LchData): HslData
        hsluv(lch: LchData): HslData
        hsp(lch: LchData): HspData
        hsv(lch: LchData): HsvData
        hwb(lch: LchData): HwbData
        jpeg(lch: LchData): YcbcrData
        lab(lch: LchData): LabData
        labh(lch: LchData): LabData
        lchab(lch: LchData): LchData
        lms(lch: LchData): LmsData
        luv(lch: LchData): LuvData
        osaucs(lch: LchData): LjgData
        rgb(lch: LchData): RgbData
        tsl(lch: LchData): TslData
        ucs(lch: LchData): UvwData
        uvw(lch: LchData): UvwData
        xvycc(lch: LchData): YcbcrData
        xyy(lch: LchData): XyyData
        xyz(lch: LchData): XyzData
        ycbcr(lch: LchData): YcbcrData
        yccbccrc(lch: LchData): YccbccrcData
        ycgco(lch: LchData): YcgcoData
        ydbdr(lch: LchData): YdbdrData
        yes(lch: LchData): YesData
        yiq(lch: LchData): YiqData
        ypbpr(lch: LchData): YpbprData
        yuv(lch: LchData): YuvData
    },
    lms: typeof lms & {
        cmy(lms: LmsData, matrix?: LmsMatrix): CmyData
        cmyk(lms: LmsData, matrix?: LmsMatrix): CmykData
        coloroid(lms: LmsData, matrix?: LmsMatrix): AtvData
        hcg(lms: LmsData, matrix?: LmsMatrix): HcgData
        hcy(lms: LmsData, matrix?: LmsMatrix): HcyData
        hpluv(lms: LmsData, matrix?: LmsMatrix): HslData
        hsi(lms: LmsData, matrix?: LmsMatrix): HsiData
        hsl(lms: LmsData, matrix?: LmsMatrix): HslData
        hsluv(lms: LmsData, matrix?: LmsMatrix): HslData
        hsp(lms: LmsData, matrix?: LmsMatrix): HspData
        hsv(lms: LmsData, matrix?: LmsMatrix): HsvData
        hwb(lms: LmsData, matrix?: LmsMatrix): HwbData
        jpeg(lms: LmsData, matrix?: LmsMatrix): YcbcrData
        lab(lms: LmsData, matrix?: LmsMatrix): LabData
        labh(lms: LmsData, matrix?: LmsMatrix): LabData
        lchab(lms: LmsData, matrix?: LmsMatrix): LchData
        lchuv(lms: LmsData, matrix?: LmsMatrix): LchData
        luv(lms: LmsData, matrix?: LmsMatrix): LuvData
        osaucs(lms: LmsData, matrix?: LmsMatrix): LjgData
        rgb(lms: LmsData, matrix?: LmsMatrix): RgbData
        tsl(lms: LmsData, matrix?: LmsMatrix): TslData
        ucs(lms: LmsData, matrix?: LmsMatrix): UvwData
        uvw(lms: LmsData, matrix?: LmsMatrix): UvwData
        xvycc(lms: LmsData, matrix?: LmsMatrix): YcbcrData
        xyy(lms: LmsData, matrix?: LmsMatrix): XyyData
        xyz(lms: LmsData, matrix?: LmsMatrix): XyzData
        ycbcr(lms: LmsData, matrix?: LmsMatrix): YcbcrData
        yccbccrc(lms: LmsData, matrix?: LmsMatrix): YccbccrcData
        ycgco(lms: LmsData, matrix?: LmsMatrix): YcgcoData
        ydbdr(lms: LmsData, matrix?: LmsMatrix): YdbdrData
        yes(lms: LmsData, matrix?: LmsMatrix): YesData
        yiq(lms: LmsData, matrix?: LmsMatrix): YiqData
        ypbpr(lms: LmsData, matrix?: LmsMatrix): YpbprData
        yuv(lms: LmsData, matrix?: LmsMatrix): YuvData
    },
    luv: typeof luv & {
        cmy(luv: LuvData): CmyData
        cmyk(luv: LuvData): CmykData
        coloroid(luv: LuvData): AtvData
        hcg(luv: LuvData): HcgData
        hcy(luv: LuvData): HcyData
        hpluv(luv: LuvData): HslData
        hsi(luv: LuvData): HsiData
        hsl(luv: LuvData): HslData
        hsluv(luv: LuvData): HslData
        hsp(luv: LuvData): HspData
        hsv(luv: LuvData): HsvData
        hwb(luv: LuvData): HwbData
        jpeg(luv: LuvData): YcbcrData
        lab(luv: LuvData): LabData
        labh(luv: LuvData): LabData
        lchab(luv: LuvData): LchData
        lchuv(luv: LuvData): LchData
        lms(luv: LuvData): LmsData
        osaucs(luv: LuvData): LjgData
        rgb(luv: LuvData): RgbData
        tsl(luv: LuvData): TslData
        ucs(luv: LuvData): UvwData
        uvw(luv: LuvData): UvwData
        xvycc(luv: LuvData): YcbcrData
        xyy(luv: LuvData): XyyData
        xyz(luv: LuvData): XyzData
        ycbcr(luv: LuvData): YcbcrData
        yccbccrc(luv: LuvData): YccbccrcData
        ycgco(luv: LuvData): YcgcoData
        ydbdr(luv: LuvData): YdbdrData
        yes(luv: LuvData): YesData
        yiq(luv: LuvData): YiqData
        ypbpr(luv: LuvData): YpbprData
        yuv(luv: LuvData): YuvData
    },
    // munsell: typeof munsell & {},
    // osaucs: typeof osaucs & {},
    rgb: typeof rgb & {
        cmy(rgb: RgbData): CmyData
        cmyk(rgb: RgbData): CmykData
        coloroid(rgb: RgbData): AtvData
        hcg(rgb: RgbData): HcgData
        hcy(rgb: RgbData): HcyData
        hpluv(rgb: RgbData): HslData
        hsi(rgb: RgbData): HsiData
        hsl(rgb: RgbData): HslData
        hsluv(rgb: RgbData): HslData
        hsp(rgb: RgbData): HspData
        hsv(rgb: RgbData): HsvData
        hwb(rgb: RgbData): HwbData
        jpeg(rgb: RgbData): YcbcrData
        lab(rgb: RgbData): LabData
        labh(rgb: RgbData): LabData
        lchab(rgb: RgbData): LchData
        lchuv(rgb: RgbData): LchData
        lms(rgb: RgbData): LmsData
        luv(rgb: RgbData): LuvData
        osaucs(rgb: RgbData): LjgData
        tsl(rgb: RgbData): TslData
        ucs(rgb: RgbData): UvwData
        uvw(rgb: RgbData): UvwData
        xvycc(rgb: RgbData): YcbcrData
        xyy(rgb: RgbData): XyyData
        xyz(rgb: RgbData): XyzData
        ycbcr(rgb: RgbData): YcbcrData
        yccbccrc(rgb: RgbData): YccbccrcData
        ycgco(rgb: RgbData): YcgcoData
        ydbdr(rgb: RgbData): YdbdrData
        yes(rgb: RgbData): YesData
        yiq(rgb: RgbData): YiqData
        ypbpr(rgb: RgbData): YpbprData
        yuv(rgb: RgbData): YuvData
    },
    tsl: typeof tsl & {
        cmy(tsl: TslData): CmyData
        cmyk(tsl: TslData): CmykData
        coloroid(tsl: TslData): AtvData
        hcg(tsl: TslData): HcgData
        hcy(tsl: TslData): HcyData
        hpluv(tsl: TslData): HslData
        hsi(tsl: TslData): HsiData
        hsl(tsl: TslData): HslData
        hsluv(tsl: TslData): HslData
        hsp(tsl: TslData): HspData
        hsv(tsl: TslData): HsvData
        hwb(tsl: TslData): HwbData
        jpeg(tsl: TslData): YcbcrData
        lab(tsl: TslData): LabData
        labh(tsl: TslData): LabData
        lchab(tsl: TslData): LchData
        lchuv(tsl: TslData): LchData
        lms(tsl: TslData): LmsData
        luv(tsl: TslData): LuvData
        osaucs(tsl: TslData): LjgData
        rgb(tsl: TslData): RgbData
        ucs(tsl: TslData): UvwData
        uvw(tsl: TslData): UvwData
        xvycc(tsl: TslData): YcbcrData
        xyy(tsl: TslData): XyyData
        xyz(tsl: TslData): XyzData
        ycbcr(tsl: TslData): YcbcrData
        yccbccrc(tsl: TslData): YccbccrcData
        ycgco(tsl: TslData): YcgcoData
        ydbdr(tsl: TslData): YdbdrData
        yes(tsl: TslData): YesData
        yiq(tsl: TslData): YiqData
        ypbpr(tsl: TslData): YpbprData
        yuv(tsl: TslData): YuvData
    },
    ucs: typeof ucs & {
        cmy(uvw: UvwData): CmyData
        cmyk(uvw: UvwData): CmykData
        coloroid(uvw: UvwData): AtvData
        hcg(uvw: UvwData): HcgData
        hcy(uvw: UvwData): HcyData
        hpluv(uvw: UvwData): HslData
        hsi(uvw: UvwData): HsiData
        hsl(uvw: UvwData): HslData
        hsluv(uvw: UvwData): HslData
        hsp(uvw: UvwData): HspData
        hsv(uvw: UvwData): HsvData
        hwb(uvw: UvwData): HwbData
        jpeg(uvw: UvwData): YcbcrData
        lab(uvw: UvwData): LabData
        labh(uvw: UvwData): LabData
        lchab(uvw: UvwData): LchData
        lchuv(uvw: UvwData): LchData
        lms(uvw: UvwData): LmsData
        luv(uvw: UvwData): LuvData
        osaucs(uvw: UvwData): LjgData
        rgb(uvw: UvwData): RgbData
        tsl(uvw: UvwData): TslData
        uvw(uvw: UvwData): UvwData
        xvycc(uvw: UvwData): YcbcrData
        xyy(uvw: UvwData): XyyData
        xyz(uvw: UvwData): XyzData
        ycbcr(uvw: UvwData): YcbcrData
        yccbccrc(uvw: UvwData): YccbccrcData
        ycgco(uvw: UvwData): YcgcoData
        ydbdr(uvw: UvwData): YdbdrData
        yes(uvw: UvwData): YesData
        yiq(uvw: UvwData): YiqData
        ypbpr(uvw: UvwData): YpbprData
        yuv(uvw: UvwData): YuvData
    },
    uvw: typeof uvw & {
        cmy(uvw: UvwData): CmyData
        cmyk(uvw: UvwData): CmykData
        coloroid(uvw: UvwData): AtvData
        hcg(uvw: UvwData): HcgData
        hcy(uvw: UvwData): HcyData
        hpluv(uvw: UvwData): HslData
        hsi(uvw: UvwData): HsiData
        hsl(uvw: UvwData): HslData
        hsluv(uvw: UvwData): HslData
        hsp(uvw: UvwData): HspData
        hsv(uvw: UvwData): HsvData
        hwb(uvw: UvwData): HwbData
        jpeg(uvw: UvwData): YcbcrData
        lab(uvw: UvwData): LabData
        labh(uvw: UvwData): LabData
        lchab(uvw: UvwData): LchData
        lchuv(uvw: UvwData): LchData
        lms(uvw: UvwData): LmsData
        luv(uvw: UvwData): LuvData
        osaucs(uvw: UvwData): LjgData
        rgb(uvw: UvwData): RgbData
        tsl(uvw: UvwData): TslData
        ucs(uvw: UvwData): UvwData
        xvycc(uvw: UvwData): YcbcrData
        xyy(uvw: UvwData): XyyData
        xyz(uvw: UvwData): XyzData
        ycbcr(uvw: UvwData): YcbcrData
        yccbccrc(uvw: UvwData): YccbccrcData
        ycgco(uvw: UvwData): YcgcoData
        ydbdr(uvw: UvwData): YdbdrData
        yes(uvw: UvwData): YesData
        yiq(uvw: UvwData): YiqData
        ypbpr(uvw: UvwData): YpbprData
        yuv(uvw: UvwData): YuvData
    },
    xvycc: typeof xvycc & {
        cmy(ycbcr: YcbcrData, kb?: number, kr?: number): CmyData
        cmyk(ycbcr: YcbcrData, kb?: number, kr?: number): CmykData
        coloroid(ycbcr: YcbcrData, kb?: number, kr?: number): AtvData
        hcg(ycbcr: YcbcrData, kb?: number, kr?: number): HcgData
        hcy(ycbcr: YcbcrData, kb?: number, kr?: number): HcyData
        hpluv(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsi(ycbcr: YcbcrData, kb?: number, kr?: number): HsiData
        hsl(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsluv(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsp(ycbcr: YcbcrData, kb?: number, kr?: number): HspData
        hsv(ycbcr: YcbcrData, kb?: number, kr?: number): HsvData
        hwb(ycbcr: YcbcrData, kb?: number, kr?: number): HwbData
        jpeg(ycbcr: YcbcrData, kb?: number, kr?: number): YcbcrData
        lab(ycbcr: YcbcrData, kb?: number, kr?: number): LabData
        labh(ycbcr: YcbcrData, kb?: number, kr?: number): LabData
        lchab(ycbcr: YcbcrData, kb?: number, kr?: number): LchData
        lchuv(ycbcr: YcbcrData, kb?: number, kr?: number): LchData
        lms(ycbcr: YcbcrData, kb?: number, kr?: number): LmsData
        luv(ycbcr: YcbcrData, kb?: number, kr?: number): LuvData
        osaucs(ycbcr: YcbcrData, kb?: number, kr?: number): LjgData
        rgb(ycbcr: YcbcrData, kb?: number, kr?: number): RgbData
        tsl(ycbcr: YcbcrData, kb?: number, kr?: number): TslData
        ucs(ycbcr: YcbcrData, kb?: number, kr?: number): UvwData
        uvw(ycbcr: YcbcrData, kb?: number, kr?: number): UvwData
        xyy(ycbcr: YcbcrData, kb?: number, kr?: number): XyyData
        xyz(ycbcr: YcbcrData, kb?: number, kr?: number): XyzData
        ycbcr(ycbcr: YcbcrData, kb?: number, kr?: number): YcbcrData
        yccbccrc(ycbcr: YcbcrData, kb?: number, kr?: number): YccbccrcData
        ycgco(ycbcr: YcbcrData, kb?: number, kr?: number): YcgcoData
        ydbdr(ycbcr: YcbcrData, kb?: number, kr?: number): YdbdrData
        yes(ycbcr: YcbcrData, kb?: number, kr?: number): YesData
        yiq(ycbcr: YcbcrData, kb?: number, kr?: number): YiqData
        ypbpr(ycbcr: YcbcrData, kb?: number, kr?: number): YpbprData
        yuv(ycbcr: YcbcrData, kb?: number, kr?: number): YuvData
    },
    xyy: typeof xyy & {
        cmy(xyy: XyyData): CmyData
        cmyk(xyy: XyyData): CmykData
        coloroid(xyy: XyyData): AtvData
        hcg(xyy: XyyData): HcgData
        hcy(xyy: XyyData): HcyData
        hpluv(xyy: XyyData): HslData
        hsi(xyy: XyyData): HsiData
        hsl(xyy: XyyData): HslData
        hsluv(xyy: XyyData): HslData
        hsp(xyy: XyyData): HspData
        hsv(xyy: XyyData): HsvData
        hwb(xyy: XyyData): HwbData
        jpeg(xyy: XyyData): YcbcrData
        lab(xyy: XyyData): LabData
        labh(xyy: XyyData): LabData
        lchab(xyy: XyyData): LchData
        lchuv(xyy: XyyData): LchData
        lms(xyy: XyyData): LmsData
        luv(xyy: XyyData): LuvData
        osaucs(xyy: XyyData): LjgData
        rgb(xyy: XyyData): RgbData
        tsl(xyy: XyyData): TslData
        ucs(xyy: XyyData): UvwData
        uvw(xyy: XyyData): UvwData
        xvycc(xyy: XyyData): YcbcrData
        xyz(xyy: XyyData): XyzData
        ycbcr(xyy: XyyData): YcbcrData
        yccbccrc(xyy: XyyData): YccbccrcData
        ycgco(xyy: XyyData): YcgcoData
        ydbdr(xyy: XyyData): YdbdrData
        yes(xyy: XyyData): YesData
        yiq(xyy: XyyData): YiqData
        ypbpr(xyy: XyyData): YpbprData
        yuv(xyy: XyyData): YuvData
    },
    xyz: typeof xyz & {
        cmy(xyz: xyzData): CmyData
        cmyk(xyz: xyzData): CmykData
        coloroid(xyz: xyzData): AtvData
        hcg(xyz: xyzData): HcgData
        hcy(xyz: xyzData): HcyData
        hpluv(xyz: xyzData): HslData
        hsi(xyz: xyzData): HsiData
        hsl(xyz: xyzData): HslData
        hsluv(xyz: xyzData): HslData
        hsp(xyz: xyzData): HspData
        hsv(xyz: xyzData): HsvData
        hwb(xyz: xyzData): HwbData
        jpeg(xyz: xyzData): YcbcrData
        lab(xyz: xyzData): LabData
        labh(xyz: xyzData): LabData
        lchab(xyz: xyzData): LchData
        lchuv(xyz: xyzData): LchData
        lms(xyz: xyzData): LmsData
        luv(xyz: xyzData): LuvData
        osaucs(xyz: xyzData): LjgData
        rgb(xyz: xyzData): RgbData
        tsl(xyz: xyzData): TslData
        ucs(xyz: xyzData): UvwData
        uvw(xyz: xyzData): UvwData
        xvycc(xyz: xyzData): YcbcrData
        xyy(xyz: xyzData): XyyData
        ycbcr(xyz: xyzData): YcbcrData
        yccbccrc(xyz: xyzData): YccbccrcData
        ycgco(xyz: xyzData): YcgcoData
        ydbdr(xyz: xyzData): YdbdrData
        yes(xyz: xyzData): YesData
        yiq(xyz: xyzData): YiqData
        ypbpr(xyz: xyzData): YpbprData
        yuv(xyz: xyzData): YuvData
    },
    ycbcr: typeof ycbcr & {
        cmy(ycbcr: YcbcrData, kb?: number, kr?: number): CmyData
        cmyk(ycbcr: YcbcrData, kb?: number, kr?: number): CmykData
        coloroid(ycbcr: YcbcrData, kb?: number, kr?: number): AtvData
        hcg(ycbcr: YcbcrData, kb?: number, kr?: number): HcgData
        hcy(ycbcr: YcbcrData, kb?: number, kr?: number): HcyData
        hpluv(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsi(ycbcr: YcbcrData, kb?: number, kr?: number): HsiData
        hsl(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsluv(ycbcr: YcbcrData, kb?: number, kr?: number): HslData
        hsp(ycbcr: YcbcrData, kb?: number, kr?: number): HspData
        hsv(ycbcr: YcbcrData, kb?: number, kr?: number): HsvData
        hwb(ycbcr: YcbcrData, kb?: number, kr?: number): HwbData
        jpeg(ycbcr: YcbcrData, kb?: number, kr?: number): YcbcrData
        lab(ycbcr: YcbcrData, kb?: number, kr?: number): LabData
        labh(ycbcr: YcbcrData, kb?: number, kr?: number): LabData
        lchab(ycbcr: YcbcrData, kb?: number, kr?: number): LchData
        lchuv(ycbcr: YcbcrData, kb?: number, kr?: number): LchData
        lms(ycbcr: YcbcrData, kb?: number, kr?: number): LmsData
        luv(ycbcr: YcbcrData, kb?: number, kr?: number): LuvData
        osaucs(ycbcr: YcbcrData, kb?: number, kr?: number): LjgData
        rgb(ycbcr: YcbcrData, kb?: number, kr?: number): RgbData
        tsl(ycbcr: YcbcrData, kb?: number, kr?: number): TslData
        ucs(ycbcr: YcbcrData, kb?: number, kr?: number): UvwData
        uvw(ycbcr: YcbcrData, kb?: number, kr?: number): UvwData
        xvycc(ycbcr: YcbcrData, kb?: number, kr?: number): YcbcrData
        xyy(ycbcr: YcbcrData, kb?: number, kr?: number): XyyData
        xyz(ycbcr: YcbcrData, kb?: number, kr?: number): XyzData
        yccbccrc(ycbcr: YcbcrData, kb?: number, kr?: number): YccbccrcData
        ycgco(ycbcr: YcbcrData, kb?: number, kr?: number): YcgcoData
        ydbdr(ycbcr: YcbcrData, kb?: number, kr?: number): YdbdrData
        yes(ycbcr: YcbcrData, kb?: number, kr?: number): YesData
        yiq(ycbcr: YcbcrData, kb?: number, kr?: number): YiqData
        ypbpr(ycbcr: YcbcrData, kb?: number, kr?: number): YpbprData
        yuv(ycbcr: YcbcrData, kb?: number, kr?: number): YuvData
    },
    yccbccrc: typeof yccbccrc & {
        cmy(yccbccrc: YccbccrcData): CmyData
        cmyk(yccbccrc: YccbccrcData): CmykData
        coloroid(yccbccrc: YccbccrcData): AtvData
        hcg(yccbccrc: YccbccrcData): HcgData
        hcy(yccbccrc: YccbccrcData): HcyData
        hpluv(yccbccrc: YccbccrcData): HslData
        hsi(yccbccrc: YccbccrcData): HsiData
        hsl(yccbccrc: YccbccrcData): HslData
        hsluv(yccbccrc: YccbccrcData): HslData
        hsp(yccbccrc: YccbccrcData): HspData
        hsv(yccbccrc: YccbccrcData): HsvData
        hwb(yccbccrc: YccbccrcData): HwbData
        jpeg(yccbccrc: YccbccrcData): YcbcrData
        lab(yccbccrc: YccbccrcData): LabData
        labh(yccbccrc: YccbccrcData): LabData
        lchab(yccbccrc: YccbccrcData): LchData
        lchuv(yccbccrc: YccbccrcData): LchData
        lms(yccbccrc: YccbccrcData): LmsData
        luv(yccbccrc: YccbccrcData): LuvData
        osaucs(yccbccrc: YccbccrcData): LjgData
        rgb(yccbccrc: YccbccrcData): RgbData
        tsl(yccbccrc: YccbccrcData): TslData
        ucs(yccbccrc: YccbccrcData): UvwData
        uvw(yccbccrc: YccbccrcData): UvwData
        xvycc(yccbccrc: YccbccrcData): YcbcrData
        xyy(yccbccrc: YccbccrcData): XyyData
        xyz(yccbccrc: YccbccrcData): XyzData
        ycbcr(yccbccrc: YccbccrcData): YcbcrData
        ycgco(yccbccrc: YccbccrcData): YcgcoData
        ydbdr(yccbccrc: YccbccrcData): YdbdrData
        yes(yccbccrc: YccbccrcData): YesData
        yiq(yccbccrc: YccbccrcData): YiqData
        ypbpr(yccbccrc: YccbccrcData): YpbprData
        yuv(yccbccrc: YccbccrcData): YuvData
    },
    ycgco: typeof ycgco & {
        cmy(ycgco: YcgcoData): CmyData
        cmyk(ycgco: YcgcoData): CmykData
        coloroid(ycgco: YcgcoData): AtvData
        hcg(ycgco: YcgcoData): HcgData
        hcy(ycgco: YcgcoData): HcyData
        hpluv(ycgco: YcgcoData): HslData
        hsi(ycgco: YcgcoData): HsiData
        hsl(ycgco: YcgcoData): HslData
        hsluv(ycgco: YcgcoData): HslData
        hsp(ycgco: YcgcoData): HspData
        hsv(ycgco: YcgcoData): HsvData
        hwb(ycgco: YcgcoData): HwbData
        jpeg(ycgco: YcgcoData): YcbcrData
        lab(ycgco: YcgcoData): LabData
        labh(ycgco: YcgcoData): LabData
        lchab(ycgco: YcgcoData): LchData
        lchuv(ycgco: YcgcoData): LchData
        lms(ycgco: YcgcoData): LmsData
        luv(ycgco: YcgcoData): LuvData
        osaucs(ycgco: YcgcoData): LjgData
        rgb(ycgco: YcgcoData): RgbData
        tsl(ycgco: YcgcoData): TslData
        ucs(ycgco: YcgcoData): UvwData
        uvw(ycgco: YcgcoData): UvwData
        xvycc(ycgco: YcgcoData): YcbcrData
        xyy(ycgco: YcgcoData): XyyData
        xyz(ycgco: YcgcoData): XyzData
        ycbcr(ycgco: YcgcoData): YcbcrData
        yccbccrc(ycgco: YcgcoData): YccbccrcData
        ydbdr(ycgco: YcgcoData): YdbdrData
        yes(ycgco: YcgcoData): YesData
        yiq(ycgco: YcgcoData): YiqData
        ypbpr(ycgco: YcgcoData): YpbprData
        yuv(ycgco: YcgcoData): YuvData
    },
    ydbdr: typeof ydbdr & {
        cmy(ydbdr: YdbdrData): CmyData
        cmyk(ydbdr: YdbdrData): CmykData
        coloroid(ydbdr: YdbdrData): AtvData
        hcg(ydbdr: YdbdrData): HcgData
        hcy(ydbdr: YdbdrData): HcyData
        hpluv(ydbdr: YdbdrData): HslData
        hsi(ydbdr: YdbdrData): HsiData
        hsl(ydbdr: YdbdrData): HslData
        hsluv(ydbdr: YdbdrData): HslData
        hsp(ydbdr: YdbdrData): HspData
        hsv(ydbdr: YdbdrData): HsvData
        hwb(ydbdr: YdbdrData): HwbData
        jpeg(ydbdr: YdbdrData): YcbcrData
        lab(ydbdr: YdbdrData): LabData
        labh(ydbdr: YdbdrData): LabData
        lchab(ydbdr: YdbdrData): LchData
        lchuv(ydbdr: YdbdrData): LchData
        lms(ydbdr: YdbdrData): LmsData
        luv(ydbdr: YdbdrData): LuvData
        osaucs(ydbdr: YdbdrData): LjgData
        rgb(ydbdr: YdbdrData): RgbData
        tsl(ydbdr: YdbdrData): TslData
        ucs(ydbdr: YdbdrData): UvwData
        uvw(ydbdr: YdbdrData): UvwData
        xvycc(ydbdr: YdbdrData): YcbcrData
        xyy(ydbdr: YdbdrData): XyyData
        xyz(ydbdr: YdbdrData): XyzData
        ycbcr(ydbdr: YdbdrData): YcbcrData
        yccbccrc(ydbdr: YdbdrData): YccbccrcData
        ycgco(ydbdr: YdbdrData): YcgcoData
        yes(ydbdr: YdbdrData): YesData
        yiq(ydbdr: YdbdrData): YiqData
        ypbpr(ydbdr: YdbdrData): YpbprData
        yuv(ydbdr: YdbdrData): YuvData
    },
    yes: typeof yes & {
        cmy(yes: YesData): CmyData
        cmyk(yes: YesData): CmykData
        coloroid(yes: YesData): AtvData
        hcg(yes: YesData): HcgData
        hcy(yes: YesData): HcyData
        hpluv(yes: YesData): HslData
        hsi(yes: YesData): HsiData
        hsl(yes: YesData): HslData
        hsluv(yes: YesData): HslData
        hsp(yes: YesData): HspData
        hsv(yes: YesData): HsvData
        hwb(yes: YesData): HwbData
        jpeg(yes: YesData): YcbcrData
        lab(yes: YesData): LabData
        labh(yes: YesData): LabData
        lchab(yes: YesData): LchData
        lchuv(yes: YesData): LchData
        lms(yes: YesData): LmsData
        luv(yes: YesData): LuvData
        osaucs(yes: YesData): LjgData
        rgb(yes: YesData): RgbData
        tsl(yes: YesData): TslData
        ucs(yes: YesData): UvwData
        uvw(yes: YesData): UvwData
        xvycc(yes: YesData): YcbcrData
        xyy(yes: YesData): XyyData
        xyz(yes: YesData): XyzData
        ycbcr(yes: YesData): YcbcrData
        yccbccrc(yes: YesData): YccbccrcData
        ycgco(yes: YesData): YcgcoData
        ydbdr(yes: YesData): YdbdrData
        yiq(yes: YesData): YiqData
        ypbpr(yes: YesData): YpbprData
        yuv(yes: YesData): YuvData
    },
    yiq: typeof yiq & {
        cmy(yiq: YiqData): CmyData
        cmyk(yiq: YiqData): CmykData
        coloroid(yiq: YiqData): AtvData
        hcg(yiq: YiqData): HcgData
        hcy(yiq: YiqData): HcyData
        hpluv(yiq: YiqData): HslData
        hsi(yiq: YiqData): HsiData
        hsl(yiq: YiqData): HslData
        hsluv(yiq: YiqData): HslData
        hsp(yiq: YiqData): HspData
        hsv(yiq: YiqData): HsvData
        hwb(yiq: YiqData): HwbData
        jpeg(yiq: YiqData): YcbcrData
        lab(yiq: YiqData): LabData
        labh(yiq: YiqData): LabData
        lchab(yiq: YiqData): LchData
        lchuv(yiq: YiqData): LchData
        lms(yiq: YiqData): LmsData
        luv(yiq: YiqData): LuvData
        osaucs(yiq: YiqData): LjgData
        rgb(yiq: YiqData): RgbData
        tsl(yiq: YiqData): TslData
        ucs(yiq: YiqData): UvwData
        uvw(yiq: YiqData): UvwData
        xvycc(yiq: YiqData): YcbcrData
        xyy(yiq: YiqData): XyyData
        xyz(yiq: YiqData): XyzData
        ycbcr(yiq: YiqData): YcbcrData
        yccbccrc(yiq: YiqData): YccbccrcData
        ycgco(yiq: YiqData): YcgcoData
        ydbdr(yiq: YiqData): YdbdrData
        yes(yiq: YiqData): YesData
        ypbpr(yiq: YiqData): YpbprData
        yuv(yiq: YiqData): YuvData
    },
    ypbpr: typeof ypbpr & {
        cmy(ypbpr: YpbprData, kb?: number, kr?: number): CmyData
        cmyk(ypbpr: YpbprData, kb?: number, kr?: number): CmykData
        coloroid(ypbpr: YpbprData, kb?: number, kr?: number): AtvData
        hcg(ypbpr: YpbprData, kb?: number, kr?: number): HcgData
        hcy(ypbpr: YpbprData, kb?: number, kr?: number): HcyData
        hpluv(ypbpr: YpbprData, kb?: number, kr?: number): HslData
        hsi(ypbpr: YpbprData, kb?: number, kr?: number): HsiData
        hsl(ypbpr: YpbprData, kb?: number, kr?: number): HslData
        hsluv(ypbpr: YpbprData, kb?: number, kr?: number): HslData
        hsp(ypbpr: YpbprData, kb?: number, kr?: number): HspData
        hsv(ypbpr: YpbprData, kb?: number, kr?: number): HsvData
        hwb(ypbpr: YpbprData, kb?: number, kr?: number): HwbData
        jpeg(ypbpr: YpbprData, kb?: number, kr?: number): YcbcrData
        lab(ypbpr: YpbprData, kb?: number, kr?: number): LabData
        labh(ypbpr: YpbprData, kb?: number, kr?: number): LabData
        lchab(ypbpr: YpbprData, kb?: number, kr?: number): LchData
        lchuv(ypbpr: YpbprData, kb?: number, kr?: number): LchData
        lms(ypbpr: YpbprData, kb?: number, kr?: number): LmsData
        luv(ypbpr: YpbprData, kb?: number, kr?: number): LuvData
        osaucs(ypbpr: YpbprData, kb?: number, kr?: number): LjgData
        rgb(ypbpr: YpbprData, kb?: number, kr?: number): RgbData
        tsl(ypbpr: YpbprData, kb?: number, kr?: number): TslData
        ucs(ypbpr: YpbprData, kb?: number, kr?: number): UvwData
        uvw(ypbpr: YpbprData, kb?: number, kr?: number): UvwData
        xvycc(ypbpr: YpbprData, kb?: number, kr?: number): YcbcrData
        xyy(ypbpr: YpbprData, kb?: number, kr?: number): XyyData
        xyz(ypbpr: YpbprData, kb?: number, kr?: number): XyzData
        ycbcr(ypbpr: YpbprData, kb?: number, kr?: number): YcbcrData
        yccbccrc(ypbpr: YpbprData, kb?: number, kr?: number): YccbccrcData
        ycgco(ypbpr: YpbprData, kb?: number, kr?: number): YcgcoData
        ydbdr(ypbpr: YpbprData, kb?: number, kr?: number): YdbdrData
        yes(ypbpr: YpbprData, kb?: number, kr?: number): YesData
        yiq(ypbpr: YpbprData, kb?: number, kr?: number): YiqData
        yuv(ypbpr: YpbprData, kb?: number, kr?: number): YuvData
    },
    yuv: Yuv & {
        cmy(yuv: YuvData): CmyData
        cmyk(yuv: YuvData): CmykData
        coloroid(yuv: YuvData): AtvData
        hcg(yuv: YuvData): HcgData
        hcy(yuv: YuvData): HcyData
        hpluv(yuv: YuvData): HslData
        hsi(yuv: YuvData): HsiData
        hsl(yuv: YuvData): HslData
        hsluv(yuv: YuvData): HslData
        hsp(yuv: YuvData): HspData
        hsv(yuv: YuvData): HsvData
        hwb(yuv: YuvData): HwbData
        jpeg(yuv: YuvData): YcbcrData
        lab(yuv: YuvData): LabData
        labh(yuv: YuvData): LabData
        lchab(yuv: YuvData): LchData
        lchuv(yuv: YuvData): LchData
        lms(yuv: YuvData): LmsData
        luv(yuv: YuvData): LuvData
        osaucs(yuv: YuvData): LjgData
        rgb(yuv: YuvData): RgbData
        tsl(yuv: YuvData): TslData
        ucs(yuv: YuvData): UvwData
        uvw(yuv: YuvData): UvwData
        xvycc(yuv: YuvData): YcbcrData
        xyy(yuv: YuvData): XyyData
        xyz(yuv: YuvData): XyzData
        ycbcr(yuv: YuvData): YcbcrData
        yccbccrc(yuv: YuvData): YccbccrcData
        ycgco(yuv: YuvData): YcgcoData
        ydbdr(yuv: YuvData): YdbdrData
        yes(yuv: YuvData): YesData
        yiq(yuv: YuvData): YiqData
        ypbpr(yuv: YuvData): YpbprData
    },
}

declare const spaces: Spaces;

export function register(newSpace: ColorSpace): void;
export default spaces;

import type {
    ColorSpace,
    AtvData,
    CmyData,
    CmykData,
    HcgData,
    HcyData,
    HsiData,
    HslData,
    HspData,
    HsvData,
    HwbData,
    LabData,
    LchData,
    LjgData,
    LmsData,
    LuvData,
    RgbData,
    TslData,
    UvwData,
    XyyData,
    XyzData,
    YcbcrData,
    YccbccrcData,
    YcgcoData,
    YdbdrData,
    YesData,
    YiqData,
    YpbprData,
    YuvData,
} from './types/color-space.d.ts';
// import type ciecam from './ciecam.d.ts';
import type cmy from './cmy.d.ts';
import type cmyk from './cmyk.d.ts';
import type coloroid from './coloroid.d.ts';
import type cubehelix, { CubehelixOptions } from './cubehelix.d.ts';
import type hcg from './hcg.d.ts';
import type hcy from './hcy.d.ts';
import type hpluv from './hpluv.d.ts';
import type hsi from './hsi.d.ts';
import type hsl from './hsl.d.ts';
import type hsluv from './hsluv.d.ts';
import type hsp from './hsp.d.ts';
import type hsv from './hsv.d.ts';
import type hwb from './hwb.d.ts';
import type jpeg from './jpeg.d.ts';
import type lab from './lab.d.ts';
import type labh from './labh.d.ts';
import type lchab from './lchab.d.ts';
import type lchuv  from './lchuv.d.ts';
import type lms, { LmsMatrix } from './lms.d.ts';
import type luv from './luv.d.ts';
// import type munsell from './munsell.d.ts';
// import type osaucs from './osaucs.d.ts';
import type rgb from './rgb.d.ts';
import type tsl from './tsl.d.ts';
import type ucs from './ucs.d.ts';
import type uvw from './uvw.d.ts';
import type xvycc from './xvycc.d.ts';
import type xyy from './xyy.d.ts';
import type xyz from './xyz.d.ts';
import type ycbcr from './ycbcr.d.ts';
import type yccbccrc from './yccbccrc.d.ts';
import type ycgco from './ycgco.d.ts';
import type ydbdr from './ydbdr.d.ts';
import type yes from './yes.d.ts';
import type yiq from './yiq.d.ts';
import type ypbpr from './ypbpr.d.ts';
import type { Yuv } from './yuv.d.ts';

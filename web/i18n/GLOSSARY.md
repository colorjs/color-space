# Glossary

The recurring terms, decided once so every string and every translator says them the same way.
**Proposed, not yet reviewed** – the native reader of each language confirms or corrects this table
first, then the strings. Where a field (color grading, broadcast) uses the English word, that is noted.

The CIE definitions of [lightness](https://cie.co.at/eilvterm/17-22-063),
[brightness](https://cie.co.at/eilvterm/17-22-059),
[chroma](https://cie.co.at/eilvterm/17-22-074) and
[saturation](https://cie.co.at/eilvterm/17-22-073) distinguish the concepts behind the labels.
For interface usage, compare native application documentation, such as Adobe's
[German color picker](https://helpx.adobe.com/de/photoshop/desktop/adjust-color/choose-colors/choose-colors-with-the-adobe-color-picker.html)
and [Korean HSL explanation](https://www.adobe.com/kr/creativecloud/photography/discover/photo-saturation.html).
Application wording is evidence of usage, not a replacement for a scientific definition or
native review. In particular, German *Farbton* in software and *Buntton* in colorimetry can both
be appropriate; this catalog currently uses the latter.

Russian uniform-space terminology follows **равноконтрастное цветовое пространство**,
as in [ГОСТ Р МЭК 60050-845-2023, 845-23-071](https://normadocs.ru/gost_r_mek_60050-845-2023).
Russian interface vocabulary also uses *карточка пространства*, *поддержка*, and full
*логарифмическая кривая* in explanatory prose. In the other languages, the editorial pass
replaced imported English metaphors with descriptions of the operation. French processing
pipelines are *flux de traitement*, German ones *Verarbeitungsketten*, Italian ones
*catene di elaborazione*, and Portuguese ones *fluxos de processamento*.

The HWB limitation note follows [CSS Color 4's normalization algorithm](https://www.w3.org/TR/css-color-4/#hwb-to-rgb):
with W+B>100 the hue has no effect, but the gray level still depends on the ratio W/(W+B).
Do not translate this as all such coordinates producing one identical gray.

| English | pt (Brazilian usage) | es | tr | ru | zh-Hans | ja | ar | de | fr | it | ko | hi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| color space | espaço de cor | espacio de color | renk uzayı | цветовое пространство | 色彩空间 | 色空間 | فضاء لوني (ج. فضاءات لونية) | Farbraum | espace colorimétrique | spazio colore (pl. spazi colore) | 색공간 | कलर स्पेस |
| color model | modelo de cor | modelo de color | renk modeli | цветовая модель | 色彩模型 | カラーモデル | نموذج لوني | Farbmodell | modèle de couleur | modello di colore | 색 모델 | कलर मॉडल |
| gamut | gamut (o gamut) | gama (de colores) | gamut | цветовой охват (охват) | 色域 | 色域 | نطاق الألوان | Farbumfang (in Komposita und Fachjargon: Gamut – Gamut-Mapping, F-Gamut) | gamut (le gamut) | gamut (il gamut) | 색역 | गैमट |
| gamut mapping | mapeamento de gamut | mapeo de gama | gamut eşleme | отображение охвата | 色域映射 | 色域マッピング | مواءمة نطاق الألوان | Gamut-Mapping | mappage de gamut | mappatura del gamut | 색역 매핑 | गैमट मैपिंग |
| white point | ponto branco | punto blanco | beyaz nokta | точка белого | 白点 | 白色点 | النقطة البيضاء | Weißpunkt | point blanc | punto di bianco | 백색점 | व्हाइट पॉइंट |
| primaries | primárias | primarios | ana renkler | основные цвета (первичные) | 原色 | 原色 | الألوان الأساسية | Primärvalenzen | primaires (les primaires) | primari (i primari) | 원색 | प्राइमरी (प्राइमरी रंग) |
| chromaticity | cromaticidade | cromaticidad | kromatiklik | цветность | 色度（坐标：色度坐标；图：色度图） | 色度 | اللونية | Farbart (Koordinaten: Farbwertanteile / Farbartkoordinaten; Diagramm: Farbtafel) | chromaticité | cromaticità | 색도 | क्रोमैटिसिटी |
| chromaticity diagram | diagrama de cromaticidade | diagrama de cromaticidad | kromatiklik diyagramı | диаграмма цветности | 色度图 | 色度図 | مخطط اللونية | Farbtafel (CIE-Normfarbtafel) | diagramme de chromaticité | diagramma di cromaticità | 색도도 | क्रोमैटिसिटी डायग्राम |
| luminance | luminância | luminancia | luminans | яркость (фотометрическая) | 亮度 | 輝度 | النصوع | Leuchtdichte | luminance | luminanza | 휘도 | ल्यूमिनेंस |
| lightness (CIE L\*) | claridade | claridad | açıklık | светлота | 明度 | 明度 | الإضاءة (provisional; see Arabic note) | Helligkeit | clarté | chiarezza | 명도 | लाइटनेस |
| brightness | brilho | brillo | parlaklık | субъективная яркость | 明亮度（CAM 相关量：视明度） | 明るさ（CAMの相関量としてはブライトネス） | السطوع | Helligkeit; als CAM-Korrelat (Q): absolute Helligkeit | luminosité | luminosità | 밝기 | चमक |
| hue | matiz | matiz | renk tonu | цветовой тон | 色相 | 色相 | تدرج اللون | Buntton | teinte | tinta | 색상 | ह्यू |
| chroma | croma | croma | kroma | хрома | 彩度 | クロマ | الكروما | Buntheit (Video-Chroma bleibt Chroma) | chroma (le chroma) | croma (la croma) | 크로마 | क्रोमा |
| saturation | saturação | saturación | doygunluk | насыщенность | 饱和度 | 彩度 | الإشباع | Sättigung | saturation | saturazione | 채도 | संतृप्ति |
| colorfulness | colorido | colorido | renk canlılığı | красочность | 视彩度 | カラフルネス | الزهاء اللوني | Farbigkeit | niveau de coloration | pienezza | 컬러풀니스 | रंगीनता |
| tristimulus values | valores triestímulo | valores triestímulo | tristimulus değerleri | координаты цвета (трёхстимульные значения) | 三刺激值 | 三刺激値 | قيم المحفزات الثلاثة | Farbwerte (XYZ: Normfarbwerte) | composantes trichromatiques | valori di tristimolo | 삼자극치 | ट्राइस्टिमुलस मान |
| standard observer | observador padrão | observador estándar | standart gözlemci | стандартный наблюдатель | 标准观察者 | 標準観測者 | الراصد القياسي | Normalbeobachter | observateur de référence | osservatore standard | 표준 관찰자 | स्टैंडर्ड ऑब्ज़र्वर |
| illuminant | iluminante | iluminante | aydınlatıcı | стандартный источник (освещения) | 照明体（标准照明体） | イルミナント（標準イルミナント） | المنير القياسي | Normlichtart (A, C, D50, D65; E: Lichtart E) | illuminant | illuminante | 표준광 | इल्युमिनेंट |
| chromatic adaptation | adaptação cromática | adaptación cromática | kromatik adaptasyon | хроматическая адаптация | 色适应 | 色順応 | التكيف اللوني | chromatische Adaptation | adaptation chromatique | adattamento cromatico | 색순응 | क्रोमैटिक एडैप्टेशन |
| color appearance model | modelo de aparência de cor | modelo de apariencia del color | renk görünüm modeli | модель цветового восприятия | 色貌模型 | カラーアピアランスモデル | نموذج المظهر اللوني | Farberscheinungsmodell | modèle d’apparence des couleurs | modello di aspetto del colore | 색 외관 모델 | कलर अपीयरेंस मॉडल |
| color difference (ΔE) | diferença de cor | diferencia de color | renk farkı | цветовое различие | 色差 | 色差 | الفرق اللوني | Farbabstand (ΔE) | écart de couleur | differenza di colore (term tooltip form: differenze di colore) | 색차 | रंग-अंतर |
| perceptually uniform | perceptualmente uniforme | perceptualmente uniforme | algısal olarak tekdüze | равноконтрастный | 感知均匀 | 知覚的に均等（uniform color space = 均等色空間） | منتظم إدراكيًا | empfindungsgemäß gleichabständig | perceptuellement uniforme | percettivamente uniforme | 지각적으로 균일한 (uniform color space = 균일 색공간; UCS chromaticity = 균등 색도) | अनुभूति में एकसमान |
| opponent (axes) | oponente | oponente | karşıt | оппонентные (оси) | 对立（对立轴、对立色） | 反対色（軸） | متضاد (المحاور المتضادة) | Gegenfarb- (Gegenfarbachsen, Gegenfarbraum) | antagoniste (axes antagonistes) | opponente (assi opponenti) | 반대색 (축) | ऑपोनेंट (अक्ष) |
| cone responses | respostas dos cones | respuestas de los conos | koni yanıtları | отклики колбочек | 视锥响应 | 錐体応答 | استجابات المخاريط | Zapfenantworten | réponses des cônes | risposte dei coni | 원추세포 반응 | कोन प्रतिक्रियाएँ |
| transfer function | função de transferência | función de transferencia | aktarım fonksiyonu | передаточная функция | 传递函数 | 伝達関数（curve = 伝達カーブ） | دالة النقل | Übertragungsfunktion (curve: Übertragungskurve) | fonction de transfert | funzione di trasferimento | 전달 함수 (curve = 커브) | ट्रांसफ़र फ़ंक्शन |
| tone curve | curva de tom | curva tonal | ton eğrisi | тональная кривая | 色调曲线 | トーンカーブ | منحنى الدرجات | Tonwertkurve | courbe tonale | curva tonale | 톤 커브 | टोन कर्व |
| log curve | curva log | curva log | log eğrisi | логарифмическая кривая | Log 曲线（对数曲线） | ログカーブ | منحنى log (لوغاريتمي) | Log-Kurve | courbe log | curva log | 로그 커브 | लॉग कर्व |
| gamma (encoding) | gama | gamma | gama | гамма | 伽马 | ガンマ | غاما | Gamma (gammakodiert) | gamma (le gamma) | gamma (la gamma) | 감마 | गामा |
| linear light | luz linear | luz lineal | doğrusal ışık | линейный свет | 线性光 | リニア光 | الضوء الخطي | lineares Licht | lumière linéaire | luce lineare | 선형 광 | लीनियर लाइट |
| encoding | codificação | codificación | kodlama | кодирование | 编码 | 符号化 | الترميز | Kodierung | encodage | codifica | 인코딩 | एन्कोडिंग |
| scene-referred | referido à cena | referido a la escena | sahneye dayalı | привязанный к сцене (scene-referred) | 场景参考 | シーン参照 | منسوب إلى المشهد | szenenbezogen | référé à la scène | riferito alla scena | 장면 기준 | सीन-रेफ़र्ड |
| display-referred | referido ao display | referido a la pantalla | ekrana dayalı | привязанный к дисплею (display-referred) | 显示参考 | ディスプレイ参照 | منسوب إلى الشاشة | displaybezogen | référé à l’affichage | riferito al display | 디스플레이 기준 | डिस्प्ले-रेफ़र्ड |
| dynamic range | faixa dinâmica | rango dinámico | dinamik aralık | динамический диапазон | 动态范围 | ダイナミックレンジ | المدى الديناميكي | Dynamikumfang | plage dynamique | gamma dinamica | 다이내믹 레인지 | डायनामिक रेंज |
| middle gray | cinza médio | gris medio | orta gri | средний серый | 中灰 | ミドルグレー | الرمادي المتوسط | Mittelgrau | gris moyen (gris 18 %) | grigio medio | 미들 그레이 (18% 그레이) | मिडल ग्रे |
| stops (of exposure) | stops | pasos (stops) | stop | ступени (стопы) | 档 | ストップ | ستوب (درجات التعريض) | Blendenstufen | diaphs | stop | 스톱 | स्टॉप |
| luma / chroma (video) | luma / croma | luma / croma | luma / kroma | яркостный / цветоразностные сигналы (luma / chroma) | 亮度信号 / 色度 | ルマ／クロマ | luma / chroma (Latin kept) | Luma / Chroma | luma / chroma | luma / croma (crominanza) | 루마 / 크로마 | लूमा / क्रोमा |
| working space | espaço de trabalho | espacio de trabajo | çalışma uzayı | рабочее пространство | 工作空间 | 作業用色空間（作業空間） | فضاء العمل | Arbeitsfarbraum | espace de travail | spazio di lavoro | 작업 색공간 | वर्किंग स्पेस |
| color grading | correção de cor (color grading) | etalonaje | renk düzenleme (color grading) | цветокоррекция (грейдинг) | 调色 | カラーグレーディング | معالجة الألوان | Color Grading (Grading, graden) | étalonnage | color grading (grading) | 컬러 그레이딩 (purpose label: 그레이딩) | कलर ग्रेडिंग |
| footage | material gravado | material grabado | çekim görüntüsü | отснятый материал | 素材 | 素材 | اللقطات | Material (Log-Material, Archivmaterial) | images (tournées) | girato | 영상 (촬영 영상) | फ़ुटेज |
| broadcast | transmissão (broadcast) | radiodifusión | yayın | телевещание | 广播电视 | 放送 | البث | Rundfunk | télédiffusion | broadcast | 방송 | प्रसारण |
| quantization | quantização | cuantización | nicemleme | квантование | 量化 | 量子化 | التكميم | Quantisierung | quantification | quantizzazione | 양자화 | क्वांटाइज़ेशन |
| lookup table (LUT) | LUT | LUT | LUT | LUT | LUT | LUT | LUT (جدول بحث) | LUT (die LUT) | LUT (la LUT) | LUT (la LUT) | LUT | LUT |
| ICC profile | perfil ICC | perfil ICC | ICC profili | ICC-профиль | ICC 配置文件 | ICCプロファイル | ملف تعريف ICC | ICC-Profil | profil ICC | profilo ICC | ICC 프로파일 | ICC प्रोफ़ाइल |
| historical / legacy | histórico / legado | histórico / heredado | tarihsel / eski | исторический / устаревший | 历史 / 旧式 | 歴史的 / レガシー（旧式） | تاريخي / قديم | historisch / veraltet | historique / hérité | storico / legacy | 역사적 / 레거시 | ऐतिहासिक / पुराना |
| superseded | substituído | reemplazado | yerini başkasına bırakmış | вытеснен | 已被取代 | 置き換えられた | حلّ محله غيره | abgelöst | supplanté | superato | 대체됨 | प्रतिस्थापित (… ने जगह ले ली) |

## Conventions

- Quotation marks: pt “ ”, es « », tr “ ”, ru « » (inner „ “). Never a straight double quote – it would end an HTML attribute.
- Numbers keep the English decimal point (0.18, 2.4): they are read beside code and notations that need it.
- Names stay as they are: space names (OKLCH, CIELAB, S-Log3), standards (ITU-R BT.709, SMPTE ST 2084),
  people, companies, products, file formats (.cube, .icc), code and color notations (oklch(0.7 0.1 50)).
- Interface labels in sentence case; Turkish suffixes on names and abbreviations take the typographic
  apostrophe (sRGB’de, OKLCH’nin), and capitals follow Turkish (i → İ).
- ru: ё where it belongs (трёх-, ещё); every dash is the English's en dash (–), never —; names of spaces
  decline only through a generic word (в пространстве OKLCH, not в OKLCH-е); «вы» lowercase; interface labels short, imperative or nominal (Найти, Скачать).
- es is neutral Spanish for Spain and Latin America alike; where usage splits (etalonaje / corrección de
  color), the first term above is the one used.

## For the reviewers – the translators' open questions

Each first pass (AI, not yet read by a native speaker) followed the table above; these are the calls
it could not settle alone.

- **pt** – *gama* (gamma) collides with *gama* = range/gamut ("ampla gama de cores"): written as
  *curva gama* / *expoente de gama*; consider *gamma*, common in Brazilian video. *Correção de cor*
  for grading reads long as a label; *colorização* is the post-production word. App menu names in the
  LUT steps stay English; thousands take a no-break space (10 000).
- **es** – *vídeo* (Spain) was used throughout; the neutral convention above would say *video*.
  *Gama* (gamut) beside *gamma* is easy to misread; the field's anglicism *gamut* avoids it.
  *Brillo* for brightness, where CIE Spanish uses *luminosidad*. Gender: *el croma*, *la LUT*.
- **ru** – people stay Latin when cited as authors (George Joblove и Donald Greenberg), while standard eponymous
  terms take their Russian form (координаты Гельмгольца, эффект Ханта, адаптация по фон Крису, опыты Райта и Гилда);
  consider transliterating authors too. UCS is *равноконтрастное*, following Russian colorimetry terminology; a log
  curve's toe is *участок у чёрного*, not the sensitometric *подошва*. HSV/Munsell Value is *значение* (GIMP), to stay
  apart from HSL's *светлота*. Tags are neuter adjectives agreeing with *пространство* (полярное, линейное). The
  space details are called *карточка*, with the appropriate case in each sentence. Glossary terms (`term.*`)
  match prose by exact form, so an inflected *точки белого* gets no tooltip.
- **tr** – *renk tonu* for hue, while Adobe's Turkish UI says *Ton* = hue, *Renk tonu* = tint; consider
  *ton*. *Renk düzenleme* (grading) clashed with the Editing purpose, renamed *Görüntü düzenleme*. The
  decade label is *{d} yılları* – one template can't carry 1990’lar / 2000’ler.

### zh-Hans – translator's notes for the reviewer

- **色度 is overloaded.** Mainland usage writes both CIE chromaticity (xy 色度图) and video chroma/chrominance (Cb/Cr 色度) as 色度; I followed that, with 色度坐标 for chromaticity-coordinate channels (rg, u′v′). The GB/T 5698 term for chromaticity is 色品（色品图、色品坐标）. Switching chromaticity to 色品 would remove the clash; decide before review.
- **Luma vs luminance.** luminance = 亮度, luma (Y′) = 亮度信号, so the two stay apart (channel “Luma” = 亮度信号). Brightness = 明亮度; the CAM correlate is 视明度, colorfulness 视彩度 (CIE Chinese terms). Munsell/HSV Value = 明度值, kept apart from HSL/CIE lightness 明度.
- **Color-vision axes.** Protan/Deutan/Tritan channels = 红色觉型 / 绿色觉型 / 蓝色觉型; the lens labels = 红色盲 / 绿色盲 / 蓝色盲. In IPT-family name origins the English protan/tritan are kept, since the letters P/T come from them.
- **Camera log.** “Log” stays as a Latin word (S-Log3 的 Log、Log 曲线), as Chinese camera and grading communities write it; toe/shoulder = 趾部/肩部; stops = 档.
- **App UI names stay English** in the LUT steps (“Open LUT Folder”, Lumetri Color > Settings), as pt did; Resolve, CapCut and Premiere have Chinese UIs whose labels differ by version.
- **Spacing:** a space between Han and Latin letters or digits (ICC 配置文件, 10 位), the mainland tech-doc convention. Thousands keep the English comma (10,000 尼特).
- **Names:** Japanese and Chinese authors get their Han names in parentheses on first mention (纳谷嘉信, 太田友一); Western authors stay Latin. Brands with established Chinese names are written that way in prose (索尼, 佳能, 富士, 尼康, 徕卡, 柯达, 杜比, 影石 Insta360, 小米); camera model names stay Latin.
- **Purpose labels:** Palettes = 配色 (调色板 for the noun inside sentences), because 调色 is already Grading; Editing = 图像编辑.
- **Code issue, not a translation choice:** the dossier's glossary tooltips (`term.*`, web/index.html around line 3731) match only when the term is not next to another letter, `(?<![\p{L}\p{N}_-])…(?![\p{L}\p{N}_-])`. Han ideographs are `\p{L}`, and Chinese has no spaces, so the tooltips almost never fire in zh-Hans. Measured over zh-Hans space descriptions and lore: 色差 0 of 40 occurrences match, 感知均匀 0 of 18, 动态范围 0 of 22, 白点 12 of 30. A fix needs CJK-aware boundaries, for example dropping the boundary check when the term is Han. Plain substring matching would also attach the chromaticity tip to video 色度 (蓝色度), so it needs care.

### ja – translator's notes for the reviewer

- **Value vs lightness.** JIS Z 8721 (Munsell) and common HSV usage both say 明度 for *value*; CIE L* is also 明度. To keep the catalog's channels distinguishable, *Value* is バリュー (channel label, HSV/Munsell prose) and *Lightness* is 明度. Munsell *chroma* in JIS is 彩度; here chroma is クロマ throughout and saturation 彩度. Confirm or switch Value to 明度.
- **Color-vision types.** Protan/Deutan/Tritan follow current Japanese medical usage (1型/2型/3型, P/D/T型), never 色盲. Channels read 「P型（1型）」, the vision lens 「1型色覚（P型）」, the short switch 「1型（赤）」. Check the short forms read clearly.
- **App menu names stay English** in the LUT steps (「Open LUT Folder」, Adjustment > LUT > Import), as in pt. Where the Japanese UI is well known I used it: Premiere (Lumetriカラー > 基本補正 > 入力LUT), OBS (フィルタ, LUTを適用, パス, 量), Final Cut (エフェクトブラウザ, ビデオ/情報インスペクタ). These Japanese menu labels were not checked against current builds; verify or revert to English.
- **Spacing.** No space between Japanese and Latin/numerals (JTF / Microsoft JP style): 「D65白色点」「sRGBの色域」. Units keep a space (6504 K, 380 nm). Ranges use 〜 in prose (0〜255), en dash kept inside quoted code ranges (Y′ 16–235).
- **Dossier = 詳細 / 詳細ページ.** The editorial pass replaced the unfamiliar ドシエ with 詳細 in action labels and 詳細ページ in explanations.
- **Japanese names in kanji:** 大田友一・金出武雄・坂井利之 (Ohta space = 大田色空間), 納谷嘉信 (Nayatani95), 赤松茂 (TSL co-author Akamatsu), 葛飾北斎. Check the readings/attributions, especially Akamatsu.
- **Lore fragments** (`lore.*.for/.nm/.sin`) are plain-style noun phrases (体言止め), matching their caption role; dossier descriptions are です/ます.
- **Term tooltips do not fire in Japanese.** `web/index.html` (TERMS matcher, ~line 3734) wraps each term in `(?<![\p{L}\p{N}_-])…(?![\p{L}\p{N}_-])`. Kana and kanji are `\p{L}`, so 「白色点を」「D65白色点」 never match. Code fix needed (skip the boundary lookarounds when the term is Han/Kana); not something ja.json can solve.

### ar – translator's notes for the reviewer

- Quotes « »; Arabic punctuation (، ؛ ؟) in prose; Western digits with English decimal point (0.18, 2.4) and thousands comma (10,000).
- Names, standards, products, menu names in editor steps (Adjustment, Lumetri Color …), code and notations stay Latin, untranslated.
- A U+200E (LRM) precedes a leading-dot extension (‎.cube, ‎.icc) and U+200F (RLM) sits between some Latin tokens and following Latin/brackets, so the bidi algorithm keeps the dot and parentheses on the correct side in RTL.
- Tags are masculine adjectives agreeing with فضاء (أسطواني، خطي، منسوب إلى المشهد).
- nits → نت; the dossier is ملف (ملف الفضاء اللوني), the ICC profile is ملف تعريف.
- **Luminance / lightness / brightness**: النصوع / الإضاءة / السطوع. الإضاءة for CIE L* follows Microsoft's Arabic HSL UI, but it also means "lighting/illumination" in everyday Arabic (e.g. «تغيّر الإضاءة» in rg / proLab text means lighting change). Consider الصفاء or keeping L* explicit; النصوع for luminance may also be read as luster by some.
- **Hue = تدرج اللون** (Office usage) is long and collides with "gradient" (تدرّج). Alternatives: صبغة، لون صرف. «تدرجات» for gradients was kept only in a few UI strings.
- **Chroma = الكروما** (transliteration) and **colorfulness = الزهاء اللوني**; chrominance = التلوّن. Check these against your field's habit.
- **Illuminant = المنير القياسي** – some texts say مصدر الإضاءة القياسي or الإنارة القياسية.
- **Glossary tooltips (`term.*`)** match the prose by exact form with letter boundaries; Arabic attaches و/ل/ب to the next word, so «ومواءمة نطاق الألوان» or «للنقطة البيضاء» gets no tooltip (gamut mapping matches 3 of 18 occurrences, white point 9 of 16). Adjectival «اللونية» (الفروق اللونية، اللوحات اللونية) was rephrased in space/lore prose (فروق الألوان، لوحات الألوان) so the chromaticity term «اللونية» doesn't fire on it; UI labels still use «اللوحات اللونية».
- **Color grading = معالجة الألوان** – Arab colorists often say «تلوين» or the English «grading»; «تصحيح الألوان» was avoided because correction ≠ grading.
- **stops = ستوب** (anglicism common among Arab cinematographers) – formal alternative: درجة تعريض.
- **Decade label `{d}s` → «عقد {d}»** (عقد 1990): one template can't produce «التسعينيات».
- **Number agreement:** Arabic noun forms vary with the count. Selection counts and the search-result hint now put the number after a label («المحدد: {n}»، «الفضاءات المطابقة: {n}») to avoid a fixed noun form. Check any new count template with 1, 2, 3, 11 and larger values.
- **Hero sample names** (Gold → الذهبي، Teal → الأزرق المخضرّ، Tomato → الطماطمي) – the Rebecca purple label stays Latin as a proper name.

### de – translator's notes for the reviewer

- **DIN vocabulary over software vocabulary.** Hue is *Buntton* and chroma *Buntheit* (DIN 5033), not *Farbton* / *Chroma* as in Photoshop, MDN and most German UIs. Dominant wavelength = *farbtongleiche Wellenlänge*, excitation purity = *spektraler Farbanteil*, CCT = *ähnlichste Farbtemperatur*, spectral locus = *Spektralfarbenzug*, Planckian locus = *Planckscher Kurvenzug*, color-matching functions = *Spektralwertfunktionen*, optimal colors = *Optimalfarben*. If the audience is mostly web designers, switching hue to *Farbton* is a one-term change; decide before review.
- **Lightness vs brightness vs value.** Lightness (L*, HSL L, CAM J) = *Helligkeit*; CAM brightness (Q) = *absolute Helligkeit*; perceived brightness = *wahrgenommene Helligkeit*; HSV/Munsell Value = *Helligkeitswert* (channel) or *Value* in prose. Colorfulness = *Farbigkeit*, kept apart from *Buntheit*. Ostwald's contents are his own terms: *Weißgehalt, Schwarzgehalt, Vollfarbe*; HWB whiteness/blackness = *Weißanteil / Schwarzanteil*.
- **Anglicisms kept where the German trade uses them:** Color Grading / graden, Log, Legal Range, Compositing, Shaper, Cube, Toe (as *Fuß*, with *Toe* once in the ACEScct name note), Tints and Shades. App menu names in the LUT steps stay English (as pt), steps are written in the infinitive (*Den Clip auswählen.*), address elsewhere is *Sie*.
- **Numbers:** English decimal point kept (2.4, 0.18) per the convention; thousands and percent use a no-break space (10 000, 18 %), German style.
- **Glossary tooltips (`term.*`) and German inflection.** The matcher needs the exact form, and German adjectives inflect. Prose was rephrased so most occurrences hit: *szenenlinear* written adverbially (*szenenlinear kodiert*), *empfindungsgemäß gleichabständig* predicatively, *PQ* outside hyphen compounds (*in PQ kodiert*, not *PQ-kodiert*), *Weißpunkt D65* rather than *D65-Weißpunkt*. `term.difference` is the plural *Farbabstände*, because the prose uses the plural far more often than the singular. Compounds (*Farbartkoordinaten*, *CIE-1931-Normalbeobachter*) never match – inherent to German, not fixable in de.json.
- **Hero samples:** Teal = *Petrol*, Tomato = *Tomatenrot*, Rebecca purple kept as a proper name; the field placeholder keeps the CSS keyword *tomato*.
- **Decade label** `{d}s` → `{d}er` (1990er) works for every decade.

### fr – translator's notes for the reviewer

- **Typography:** narrow no-break space (U+202F) before ; : ! ? %, and inside « ». Numbers keep the English decimal point (0.18, gamma 2.4) because they sit beside code; thousands take a narrow space (10 000 nits, 1 825 couleurs). Apostrophe is typographic (’), except in code-like tokens (u', lut3d=file='…').
- **Color space = espace colorimétrique** (Adobe FR, Wikipedia FR), *espace* alone once the context is set. *Espace de couleur* survives only inside glosses of English acronyms (UCS = uniform colour space). Consider whether the shorter *espace de couleur* reads better in UI labels.
- **CIE French terms chosen:** clarté (lightness), luminosité (brightness), niveau de coloration (colourfulness), composantes trichromatiques (tristimulus values), observateur de référence (standard observer), température de couleur proximale (CCT), lieu planckien, écart de couleur (ΔE). Check *niveau de coloration*: it is the CIE ILV term but rare outside colorimetry texts. HSV *Value* = valeur, Munsell *value* = valeur; HWB whiteness/blackness = blancheur/noirceur (NCS usage).
- **Hue vs tint:** hue = teinte throughout, so white-balance *tint* (and TSL's T, CCT+Duv's green–pink axis) became *nuance*. Lightroom FR calls the tint slider « Teinte »; a colorist may expect that.
- **Gamut** kept as the anglicism (le gamut), as French imaging practice does; *gamme de couleurs* avoided to keep "gamut mapping" short (mappage de gamut). *Correspondance de gamut* is an alternative.
- **Camera vocabulary:** stops = diaphs; toe/shoulder = pied/épaule (sensitometry); grading = étalonnage, colorist = étalonneur; footage = images (tournées); dailies = rushes; scene-linear = linéaire scène (also the `term.scene-linear` tooltip form).
- **Dossier = fiche** (« la fiche de l’espace »), the modal labels: conçu pour (made for), réserve (caveat), étymologie, chaîne de conversion (lineage), voisins (related), usages (used for). The FAQ refers to the dossier row as <em>interpoler</em> and the Purpose grouping as <em>usage</em>, matching those UI labels.
- **App menu names stay English** in the LUT steps (« Open LUT Folder », Lumetri Color > Settings, OBS Filters/Apply LUT), as pt/zh/ja did. Resolve, Premiere, Final Cut, OBS and CapCut all ship French UIs whose labels vary by version; swap in the French labels if you can verify them.
- **Glossary tooltips (`term.*`)** use singular forms that occur in the prose: adaptation chromatique, chromaticité, écart de couleur, plage dynamique, mappage de gamut, illuminant, observateur de référence, linéaire scène, perceptuellement uniforme, images sans profil, point blanc. French plurals (écarts de couleur, perceptuellement uniformes) do not match, so a few occurrences get no tooltip (perceptuellement uniforme: 7 hits vs 11 in English).
- **Hero samples:** Or, Sarcelle, Tomate; Rebecca purple kept as a proper name. Decade label `{d}s` = « années {d} ». Color-vision lens: Protanopie/Deutéranopie/Tritanopie; the short switch reads « aveugle au rouge / vert / bleu » – consider *protanope*-style terms if the audience is technical.
- Proper names stay Latin, including Japanese authors (Yu-Ichi Ohta, Yoshinobu Nayatani) and Hokusai (La Grande Vague).

### it – translator's notes for the reviewer

- **Quotes and numbers.** Quotes « » (no inner level needed so far); English decimal point kept (0.18, 2.4) beside code; thousands with a space (10 000 nit). Ranges keep the en dash (0–255, 380–700 nm).
- **Lightness / brightness / value.** CIE L* = *chiarezza*, brightness = *luminosità*, Munsell/HSV value = *valore* (Munsell's own words kept as «value» and «chroma» where the text quotes him). HSL's L is also *chiarezza*, so the channel label differs from Photoshop's Italian UI, which says *Luminosità* for HSL/Lab L. Confirm, or switch HSL to *Luminosità* at the cost of the brightness/lightness split.
- **Croma is feminine** (*la croma*, *croma blu*, *croma rossa*), following Italian Wikipedia and CIE-derived Italian texts; some video engineers say *il chroma*. *Colorfulness* = *pienezza* (Italian Wikipedia's term); *vividezza* is an alternative if *pienezza* reads opaque, but ZCAM's *vividness* already uses *vivacità*.
- **Gamma collision.** *Gamma* is both the encoding exponent (*la gamma*, *curva gamma*) and the first word of *gamma dinamica* (dynamic range). Gamut stays *gamut*, never *gamma di colori*, to keep the three apart. Where English says «full range» for code values (JPEG YCbCr), I wrote *a escursione completa (full range)*, not *gamma completa*. Some photographers prefer *range dinamico*; switch globally if you agree (term.dynamic-range follows).
- **Grading and camera.** *Color grading* / *grading* / *gradare* kept as Italian colorists say them; *camera* (cinema camera) vs *fotocamera* (phone/still); *girato* for footage; *piede* (toe) and *spalla* (shoulder) for curve regions; *truka* for the film optical printer (Cineon) – check it is still understood.
- **App menu names stay English** in the LUT steps («Open LUT Folder», Adjustment > LUT > Import), as pt, zh-Hans and ar did; the Italian builds of Premiere, Final Cut and Resolve localize some of these – verify or keep English.
- **Lore fragments** (`lore.*.for/.nm/.sin`) are lowercase noun phrases. Acronym expansions in `.nm` keep the English words and add the Italian gloss (LCD = large color differences, grandi differenze di colore).
- **Purpose labels:** Editing = *Fotoritocco* (image editing, to stay apart from Grading); Picking = *Selezione*; Delivery = *Distribuzione*.
- **Glossary tooltips (`term.*`)** match by exact form, case-insensitive: *differenze di colore* (plural, the commoner form in the prose; six descriptions were phrased to match), *gamma dinamica*, *punto di bianco*, *percettivamente uniforme* (singular; plural *uniformi* does not fire), *lineare di scena*. *untagged images* is matched as *senza profilo*, so both «immagini senza profilo» and «immagini digitali senza profilo» get the tip.
- **Decade label** `{d}s` → «anni {d}» (anni 1990); one template cannot produce «anni ’90».
- **Hero samples:** Gold = Oro, Teal = Verde petrolio, Tomato = Pomodoro; Rebecca purple stays as the CSS proper name.
- Address is informal *tu* with imperatives (Apri, Scegli, Trascina), as in current Italian software UIs.

### ko – translator's notes for the reviewer

- **Register.** Dossier descriptions, FAQ, tour and LUT steps are 합니다체; `*.use` lines are a noun phrase plus a short 합니다 sentence; lore fragments (`lore.*.for/.nm/.sin`) are 개조식 noun phrases (…함, …됨, noun endings), matching their caption role; labels are nouns.
- **Lightness vs value vs brightness.** CIE L* and HSL L = 명도; brightness (and the CAM correlate) = 밝기; HSV/Munsell *value* = 밸류, to keep it apart from 명도 in channel labels (JIS/KS Munsell would say 명도). Chroma = 크로마 everywhere, saturation = 채도 (KS Munsell *chroma* is also 채도 – kept apart on purpose). Colourfulness = 컬러풀니스. Confirm or switch Value to 명도.
- **Illuminant = 표준광** (KS C 0074 style: 표준광 A, D65); a physical source is 광원. White point = 백색점, chromaticity diagram = 색도도, UCS = 균등 색도 / 균일 색공간.
- **Dynamic range = 다이내믹 레인지** (camera/grading usage); 동적 범위 is the alternative in engineering texts. Middle gray = 미들 그레이, stops = 스톱, legal range = 리걸 레인지 / 제한 범위.
- **Color-vision types.** No 색맹 anywhere. Channels: P형(1형) / D형(2형) / T형(3형); lens: 1형 색각(P형) …; short switch: 1형(빨강) / 2형(초록) / 3형(파랑). In IPT-family name origins the English protan/tritan are kept, since the letters come from them.
- **Dossier = 상세 정보** (the modal); “open … dossier” = 상세 정보 열기.
- **App menu names stay English** in the LUT steps (“Open LUT Folder”, Lumetri Color > Settings), as pt/zh did; DaVinci Resolve, Premiere and Final Cut have Korean UIs whose labels differ by version.
- **Particles after Latin names** follow the English pronunciation's final sound: CIELAB은, sRGB는, YCbCr은, ffmpeg은, HDR로, Rec. 2020은, Rec. 709는. Where a placeholder's final sound is unknown, prefer a construction without a particle, as in the revised action label «{name} 평면 보기».
- **Japanese names** in Korean reading with kanji: 나야타니 요시노부(納谷嘉信), 오타 유이치(大田友一)·가나데 다케오(金出武雄)·사카이 도시유키(坂井利之); Akamatsu and Western authors stay Latin. 葛飾北斎 = 호쿠사이; the sample image is 가나가와 해변의 높은 파도 (the standard Korean title).
- **Hero sample names:** 골드, 틸, 토마토, 레베카 퍼플 (CSS named colors read aloud); P3의 순수한 초록색 for the pure P3 green sample.
- **Code issue – term tooltips rarely fire in Korean.** Korean attaches particles to the noun (백색점은, 다이내믹 레인지를), and Intl.Segmenter('ko') keeps the particle inside the word, so the TERMS matcher in web/index.html (~line 3733) finds no word edge after the term. Measured over ko space descriptions and lore: 백색점 1 of 26 occurrences, 다이내믹 레인지 0 of 22, 색차 25 of 56, 색도 18 of 50 (some of those are 색도도, correctly skipped), 색역 매핑 3 of 10; 지각적으로 균일한, PQ, OETF match fully. Fix in code, mirroring the Arabic PRO prefix rule: for `ko`, accept an end edge after an optional particle suffix (은|는|이|가|을|를|과|와|의|에|에서|으로|로|도|만|까지|부터|보다|처럼) when that suffix ends at a word edge. The `term.*` keys are the bare nouns as they appear in prose.

### hi – translator's notes for the reviewer

- **Register.** Practitioner Hindi: established English technical terms transliterated (गैमट, क्रोमा, ल्यूमिनेंस, ट्रांसफ़र फ़ंक्शन), plain Hindi where it is the everyday word (रंग, चमक, संतृप्ति, प्रकाश, सफ़ेद, काला). Sanskritized coinages (वर्णिकता, द्युति, प्रदीप्ति) avoided. Nukta kept (फ़, ज़, क़, ख़, ग़) as in standard modern print.
- **Perceptual = अनुभूति-आधारित; perceptually uniform = अनुभूति में एकसमान.** Alternatives: दृष्टि-आधारित / दृष्टि में एकसमान, or the loanword परसेप्चुअल. Decide one; it is a tag label, a purpose label and a glossary tooltip.
- **Hue = ह्यू**, not रंगत/वर्ण, so it stays distinct from रंग (color) in labels like ह्यू कोण, ह्यू चाप. **Value (HSV/Munsell) = वैल्यू**, kept apart from **लाइटनेस** (CIE L*, HSL). **Luminance ल्यूमिनेंस vs luma लूमा** stay distinct. Saturation = संतृप्ति (user-facing labels); designers often say सैचुरेशन – check which reads better in pickers.
- **Dossier = विवरण** (the space's detail modal: “… का विवरण खोलें”); the dossier's own “description” field is वर्णन to avoid a clash.
- **Color-vision types.** Channels: प्रोटन / ड्यूटन / ट्राइटन; lens: प्रोटैनोपिया / ड्यूटेरैनोपिया / ट्राइटैनोपिया; short switch: लाल / हरे / नीले का अंधापन. The last echoes the English “red-blind”; a gentler medical phrasing (लाल-रंग दृष्टि दोष) may be preferred.
- **App menu names stay English** in the LUT steps (Adjustment > LUT > Import, Lumetri Color …), as pt/zh/ja did; Hindi UIs of these apps are rare.
- **Numbers**: Western digits, English decimal point and thousands comma (10,000 निट). Sentence ends use ।; lore fragments (.for/.nm/.sin) have no terminal mark, matching the English.
- **Decade label** `{d}s` → “{d} का दशक” (1990 का दशक) – one template can't produce “नब्बे का दशक”.
- **Hero samples**: Gold सुनहरा, Teal टील, Tomato टमाटरी; Rebecca purple stays Latin as a proper name. “The Great Wave – Hokusai” kept Latin (title + name).
- **Term tooltips** (`term.*`): every term form matches the prose by the current whole-word regex (white point 25/25, chromaticity 49/49, color difference 41/42, gamut mapping 19/19). Caveat for the code: Devanagari vowel signs are `\p{M}`, not `\p{L}`, so the boundary lookahead does not stop at a matra – a term ending in a bare consonant would also match inside a longer inflected word (e.g. “रंग” inside “रंगों”). None of the current terms hits this in practice, but a Devanagari-aware boundary should add `\p{M}` to the lookarounds.

# Glossary

The recurring terms, decided once so every string and every translator says them the same way.
**Proposed, not yet reviewed** – the native reader of each language confirms or corrects this table
first, then the strings. Where a field (color grading, broadcast) uses the English word, that is noted.

| English | pt-BR | es | tr |
|---|---|---|---|
| color space | espaço de cor | espacio de color | renk uzayı |
| color model | modelo de cor | modelo de color | renk modeli |
| gamut | gamut (o gamut) | gama (de colores) | gamut |
| gamut mapping | mapeamento de gamut | mapeo de gama | gamut eşleme |
| white point | ponto branco | punto blanco | beyaz nokta |
| primaries | primárias | primarios | ana renkler |
| chromaticity | cromaticidade | cromaticidad | kromatiklik |
| chromaticity diagram | diagrama de cromaticidade | diagrama de cromaticidad | kromatiklik diyagramı |
| luminance | luminância | luminancia | luminans |
| lightness (CIE L\*) | claridade | claridad | açıklık |
| brightness | brilho | brillo | parlaklık |
| hue | matiz | matiz | renk tonu |
| chroma | croma | croma | kroma |
| saturation | saturação | saturación | doygunluk |
| colorfulness | colorido | colorido | renk canlılığı |
| tristimulus values | valores triestímulo | valores triestímulo | tristimulus değerleri |
| standard observer | observador padrão | observador estándar | standart gözlemci |
| illuminant | iluminante | iluminante | aydınlatıcı |
| chromatic adaptation | adaptação cromática | adaptación cromática | kromatik adaptasyon |
| color appearance model | modelo de aparência de cor | modelo de apariencia del color | renk görünüm modeli |
| color difference (ΔE) | diferença de cor | diferencia de color | renk farkı |
| perceptually uniform | perceptualmente uniforme | perceptualmente uniforme | algısal olarak tekdüze |
| opponent (axes) | oponente | oponente | karşıt |
| cone responses | respostas dos cones | respuestas de los conos | koni yanıtları |
| transfer function | função de transferência | función de transferencia | aktarım fonksiyonu |
| tone curve | curva de tom | curva tonal | ton eğrisi |
| log curve | curva log | curva log | log eğrisi |
| gamma (encoding) | gama | gamma | gama |
| linear light | luz linear | luz lineal | doğrusal ışık |
| encoding | codificação | codificación | kodlama |
| scene-referred | referido à cena | referido a la escena | sahneye dayalı |
| display-referred | referido ao display | referido a la pantalla | ekrana dayalı |
| dynamic range | faixa dinâmica | rango dinámico | dinamik aralık |
| middle gray | cinza médio | gris medio | orta gri |
| stops (of exposure) | stops | pasos (stops) | stop |
| luma / chroma (video) | luma / croma | luma / croma | luma / kroma |
| working space | espaço de trabalho | espacio de trabajo | çalışma uzayı |
| color grading | correção de cor (color grading) | etalonaje | renk düzenleme (color grading) |
| footage | material gravado | material grabado | çekim görüntüsü |
| broadcast | transmissão (broadcast) | radiodifusión | yayın |
| quantization | quantização | cuantización | nicemleme |
| lookup table (LUT) | LUT | LUT | LUT |
| ICC profile | perfil ICC | perfil ICC | ICC profili |
| historical / legacy | histórico / legado | histórico / heredado | tarihsel / eski |
| superseded | substituído | reemplazado | yerini başkasına bırakmış |

## Conventions

- Quotation marks: pt-BR “ ”, es « », tr “ ”. Never a straight double quote – it would end an HTML attribute.
- Numbers keep the English decimal point (0.18, 2.4): they are read beside code and notations that need it.
- Names stay as they are: space names (OKLCH, CIELAB, S-Log3), standards (ITU-R BT.709, SMPTE ST 2084),
  people, companies, products, file formats (.cube, .icc), code and color notations (oklch(0.7 0.1 50)).
- Interface labels in sentence case; Turkish suffixes on names and abbreviations take the typographic
  apostrophe (sRGB’de, OKLCH’nin), and capitals follow Turkish (i → İ).
- es is neutral Spanish for Spain and Latin America alike; where usage splits (etalonaje / corrección de
  color), the first term above is the one used.

## For the reviewers – the translators' open questions

Each first pass (AI, not yet read by a native speaker) followed the table above; these are the calls
it could not settle alone.

- **pt-BR** – *gama* (gamma) collides with *gama* = range/gamut ("ampla gama de cores"): written as
  *curva gama* / *expoente de gama*; consider *gamma*, common in Brazilian video. *Correção de cor*
  for grading reads long as a label; *colorização* is the post-production word. App menu names in the
  LUT steps stay English; thousands take a no-break space (10 000).
- **es** – *vídeo* (Spain) was used throughout; the neutral convention above would say *video*.
  *Gama* (gamut) beside *gamma* is easy to misread; the field's anglicism *gamut* avoids it.
  *Brillo* for brightness, where CIE Spanish uses *luminosidad*. Gender: *el croma*, *la LUT*.
- **tr** – *renk tonu* for hue, while Adobe's Turkish UI says *Ton* = hue, *Renk tonu* = tint; consider
  *ton*. *Renk düzenleme* (grading) clashed with the Editing purpose, renamed *Görüntü düzenleme*. The
  decade label is *{d} yılları* – one template can't carry 1990’lar / 2000’ler.

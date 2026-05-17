/**
 * Plante-farve — hver plante får en rolig, botanisk farveflade
 * der *komplementerer* planten (tomat → støvet varm rød, agurk →
 * dæmpet grøn, gulerod → terracotta …). Dæmpede, modne, "dyrkede"
 * toner — aldrig neon, aldrig farvefest.
 *
 * Sæson-modulation sker i UI'et: farvefladen får et tyndt
 * sæson-token-overlay ovenpå, så tomat forbliver tomat men
 * bliver støvet om vinteren / saftig om sommeren — uden at
 * denne rene funktion skal kende årstiden.
 */

export interface PlantColor {
  /** Mættet-men-dæmpet basistone */
  field: string
  /** Let lysere tone (gradient-top) */
  fieldSoft: string
  /** Dybere tone (gradient-bund — sikrer læsbar hvid tekst) */
  fieldDeep: string
}

/** [hue, saturation%, lightness%] — botanisk-sikre toner */
type HSL = [number, number, number]

const KEYWORDS: Array<[RegExp, HSL]> = [
  [/tomat|cherry/, [8, 55, 68]],
  [/chili|jalapeno|peber/, [14, 62, 64]],
  [/agurk|squash|zucchini|gr(æ|ae)skar|melon|courgette/, [95, 32, 64]],
  [/gulerod|karotte|pastinak/, [24, 58, 64]],
  [/salat|spinat|mangold|gr(ø|oe)nk(å|aa)l|k(å|aa)l|rucola|bladbede/, [110, 28, 62]],
  [/basilikum|persille|dild|koriander|timian|oregano|mynte|salvie|rosmarin|urt/, [135, 30, 60]],
  [/jordb(æ|ae)r/, [348, 50, 71]],
  [/(æ|ae)rt|b(ø|oe)nne/, [88, 38, 62]],
  [/l(ø|oe)g|hvidl(ø|oe)g|porre|purl(ø|oe)g/, [70, 22, 70]],
  [/r(ø|oe)dbede|rødløg|beanroot/, [330, 30, 61]],
  [/radise|reddike/, [355, 48, 71]],
  [/kartoffel/, [34, 30, 66]],
  [/majs/, [46, 60, 68]],
  [/solsikke/, [44, 65, 66]],
  [/lavendel/, [265, 30, 70]],
  [/ribs|solb(æ|ae)r|hindb(æ|ae)r|brombær|b(æ|ae)r/, [340, 36, 61]],
  [/(æ|ae)ble|p(æ|ae)re|blomme|kirseb(æ|ae)r|frugttr(æ|ae)/, [100, 30, 62]],
  [/blomst|morgenfrue|valmue|tagetes|zinnia|dahlia|georgine|stedmoder|solhat|ringblomst/, [20, 55, 70]],
]

/** Kuraterede fallback-toner — altid botaniske, aldrig grimme */
const FALLBACK: HSL[] = [
  [110, 28, 62], [95, 32, 64], [135, 28, 60], [70, 24, 68],
  [24, 50, 66], [40, 46, 68], [20, 48, 70], [340, 30, 64],
  [265, 26, 70], [100, 30, 62],
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // fjern kombinerende accenter
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function hsl([h, s, l]: HSL, dl = 0): string {
  const clamped = Math.max(28, Math.min(l + dl, 94))
  return `hsl(${h} ${s}% ${clamped}%)`
}

/**
 * Udled plantens farveflade ud fra dansk navn (+ evt. sort).
 * Deterministisk: samme plante → altid samme tone.
 */
export function plantColor(name: string, variety?: string | null): PlantColor {
  const hay = normalize(`${name} ${variety ?? ''}`)
  let base: HSL | undefined
  for (const [re, color] of KEYWORDS) {
    if (re.test(hay)) { base = color; break }
  }
  if (!base) base = FALLBACK[hash(normalize(name)) % FALLBACK.length]
  return { field: hsl(base), fieldSoft: hsl(base, 9), fieldDeep: hsl(base, -16) }
}

/**
 * Plante-farve — hver plante får ÉN flad, mættet farveblok
 * der *komplementerer* planten (tomat → varm laks, mangold →
 * salviegrøn, gulerod → koral …) plus en meget lys tone af
 * samme kulør til sekundære datablokke. Fast pr. art, ikke
 * sæsondrevet (jf. reference: flade farveblokke, skarpe kanter
 * mellem blokke, ingen gradient i blokken).
 */

export interface PlantColor {
  /** Flad, mættet farveblok (hvid tekst sidder ovenpå) */
  field: string
  /** Meget lys tone af samme kulør — sekundær datablok */
  tint: string
  /** Lyst, FARVET highlight (retningsbestemt lys) — beholder kulør,
   *  bliver aldrig gråt/beige. Bruges som rgba med egen alpha. */
  light: string
  /** Translucent glas-tone i samme kulør — til badges/kapsler */
  glass: string
  /** Sand for varme kulører (koral/gul), falsk for kølige (grøn/blå) */
  warm: boolean
}

/** [hue, saturation%, lightness%] — botanisk-sikre toner */
type HSL = [number, number, number]

const KEYWORDS: Array<[RegExp, HSL]> = [
  // Dusty coral / warm salmon — undgår neon-rød/orange
  [/tomat|cherry/, [12, 38, 74]],
  [/chili|jalapeno|peber/, [16, 44, 70]],
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

/** Flad blok-farve: lysstyrke loftes så hvid tekst altid læses */
function fieldColor([h, s, l]: HSL): string {
  return `hsl(${h} ${s}% ${Math.max(40, Math.min(l, 66))}%)`
}

/** Meget lys tone af samme kulør — til sekundær datablok */
function tintColor([h, s]: HSL): string {
  return `hsl(${h} ${Math.max(20, Math.round(s * 0.5))}% 94%)`
}

/** Lyst FARVET highlight — høj lysstyrke, men kuløren bevares
 *  (saturation falder IKKE mod grå). Til retningsbestemt lys. */
function lightColor([h, s]: HSL): string {
  return `hsl(${h} ${Math.max(40, Math.min(s + 8, 72))}% 84%)`
}

/** Translucent glas-tone i samme kulør — til badges/kapsler */
function glassColor([h, s]: HSL): string {
  return `hsla(${h}, ${Math.max(34, Math.min(s, 58))}%, 60%, 0.30)`
}

/**
 * Udled plantens farveblok ud fra dansk navn (+ evt. sort).
 * Deterministisk: samme plante → altid samme farve.
 */
export function plantColor(name: string, variety?: string | null): PlantColor {
  const hay = normalize(`${name} ${variety ?? ''}`)
  let base: HSL | undefined
  for (const [re, color] of KEYWORDS) {
    if (re.test(hay)) { base = color; break }
  }
  if (!base) base = FALLBACK[hash(normalize(name)) % FALLBACK.length]
  const [h] = base
  return {
    field: fieldColor(base),
    tint: tintColor(base),
    light: lightColor(base),
    glass: glassColor(base),
    warm: h <= 65 || h >= 320,
  }
}

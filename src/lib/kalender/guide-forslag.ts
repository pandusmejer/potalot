/**
 * Guide-forslag til Kalenderens Inspiration-mappe (fane 3, "Guides").
 *
 * ── Hvorfor denne fil findes (KAL-0113, Anna 26/8) ───────────────────────
 * Fanen lovede "Guides til sæsonen lige nu" og viste TO HARDKODEDE kort
 * ("Tomater i juni", "Såning i varme perioder") året rundt — uafhængigt af
 * måned og af hvilke guides Potalot faktisk har. KAL-0109 lappede symptomet
 * ved at filtrere juni-titlen væk uden for juni; det er en gipsplade foran
 * hullet, ikke en rettelse. Samme fejlklasse som Frøbank-fanen.
 *
 * ── Fanens løfte er SÆSON, ikke personalisering (ANNA-LÅST) ──────────────
 * Overskrift + underrubrik siger "sæsonen lige nu". Derfor vælger motoren
 * KUN på måned. Den blander ikke brugerens planter og frø ind: skal fanen
 * personalisere, er det en anden beslutning med en anden copy. En motor der
 * prøver at være klog ved at være vag, er værre end en smal motor.
 *
 * ── Reglerne ─────────────────────────────────────────────────────────────
 * 1. Kun ÆGTE guides fra det aktuelle bibliotek. Ingen hardkodede kort.
 * 2. En guide vises kun, hvis dens egne quickFacts har et vindue åbent i
 *    den valgte måned. 107 af 165 masterguides har slet ingen månedsdata —
 *    de kan aldrig kvalificere, og det er den rigtige opførsel: tavshed
 *    frem for gæt.
 * 3. Ingen filler. Findes der én relevant guide, vises én.
 * 4. Teksten er guidens EGEN summary. Vi opfinder ikke en begrundelse.
 *
 * ── Rangering (kun dokumenterbare kriterier) ─────────────────────────────
 * Vinduestypen bestemmer: at så noget er tidskritisk, høst er løbende.
 *   direkte såning → forkultivering → udplantning → høst → navn
 * I august giver det fx de to guides med augustsåning før de 50 med
 * augusthøst — hvilket er den eneste rangering vi kan forsvare med data.
 *
 * Ren funktion, ingen DB-kald. Kaldes server-side (kalender/page.tsx), så
 * hele guide-biblioteket ikke skal med i kalenderens klient-bundle.
 */

import type { Guide } from '@/lib/types'
import { guideHref } from '@/lib/guides/guide-href'

export type GuideVindue = 'direct_sow' | 'pre_sow' | 'plant_out' | 'harvest'

export interface GuideForslag {
  id: string
  title: string
  text: string
  href: string
  /** Hvilket vindue gjorde guiden aktuel — bevaret, så et kort kan debugges. */
  window: GuideVindue
}

export interface GuideForslagInput {
  guides: Guide[]
  /** 1-12 — den måned brugeren KIGGER på. */
  month: number
  /** Max antal kort. Færre er fint; vi fylder aldrig op. */
  max?: number
}

/** Prioritet: tidskritisk før løbende. Rækkefølgen ER rangeringen. */
const VINDUE_PRIORITET: Array<{ vindue: GuideVindue; felt: keyof Guide['quickFacts'] }> = [
  { vindue: 'direct_sow', felt: 'directSowingMonths' },
  { vindue: 'pre_sow', felt: 'sowingMonths' },
  { vindue: 'plant_out', felt: 'plantingOutMonths' },
  { vindue: 'harvest', felt: 'harvestMonths' },
]

/** Guidens visningsnavn: teknikguidens titel, ellers art + evt. sort. */
function visningsNavn(guide: Guide): string {
  if (guide.title) return guide.title
  return guide.variety ? `${guide.plantName} ${guide.variety}` : guide.plantName
}

/** Første åbne vindue i prioritetsrækkefølge, eller null hvis guiden tier. */
function aabentVindue(guide: Guide, month: number): GuideVindue | null {
  for (const { vindue, felt } of VINDUE_PRIORITET) {
    const maaneder = guide.quickFacts?.[felt]
    if (Array.isArray(maaneder) && maaneder.includes(month)) return vindue
  }
  return null
}

export function byggGuideForslag(input: GuideForslagInput): GuideForslag[] {
  const { guides, month, max = 2 } = input
  if (month < 1 || month > 12) return []

  const rang = (v: GuideVindue) => VINDUE_PRIORITET.findIndex(p => p.vindue === v)
  /** plantenavn → index i `kandidater`, så artsguiden kan overtage pladsen. */
  const set = new Map<string, number>()
  const kandidater: Array<GuideForslag & { level: Guide['guideLevel'] }> = []

  const byg = (guide: Guide, vindue: GuideVindue) => ({
    id: guide.id,
    title: visningsNavn(guide),
    text: (guide.summary ?? '').trim(),
    href: guideHref(guide.id),
    window: vindue,
    level: guide.guideLevel,
  })

  for (const guide of guides) {
    if (guide.status !== 'published') continue
    const summary = (guide.summary ?? '').trim()
    // Uden en egen summary har vi ingen ærlig kort-tekst — og vi skriver
    // ikke en. Guiden springes over.
    if (!summary) continue

    const vindue = aabentVindue(guide, month)
    if (!vindue) continue

    // Én PLANTE = ét kort. Uden det fyldte fx tre hvidløgsguider (arten +
    // Germidour + Thermidrome) hele fanen i oktober-december. Artsguiden
    // vinder, når den findes: den er den bredere indgang til at forstå
    // sæsonen, og sortsguiden hører hjemme på selve sorten.
    const noegle = (guide.plantName || visningsNavn(guide)).toLowerCase().trim()
    const eksisterende = set.get(noegle)
    if (eksisterende !== undefined) {
      if (guide.guideLevel === 'species' && kandidater[eksisterende].level !== 'species') {
        kandidater[eksisterende] = byg(guide, vindue)
      }
      continue
    }
    set.set(noegle, kandidater.length)

    kandidater.push(byg(guide, vindue))
  }

  kandidater.sort((a, b) =>
    (rang(a.window) - rang(b.window)) || a.title.localeCompare(b.title, 'da')
  )
  return kandidater.slice(0, max).map(({ level: _level, ...forslag }) => forslag)
}

/**
 * Alle 12 måneders forslag på én gang. Brugeren skifter måned i klienten,
 * men biblioteket skal blive på serveren — derfor beregnes hele året forud
 * og sendes som ét lille opslagsobjekt (samme mønster som froebank-forslag).
 */
export function byggGuideForslagPrMaaned(
  input: Omit<GuideForslagInput, 'month'>,
): Record<number, GuideForslag[]> {
  const ud: Record<number, GuideForslag[]> = {}
  for (let m = 1; m <= 12; m++) ud[m] = byggGuideForslag({ ...input, month: m })
  return ud
}

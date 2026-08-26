/**
 * Frøbank-autofill — ren opslags-motor til manuel oprettelse.
 *
 * Hierarki (Annas beslutning 2/8):
 *   1. Sortsguide  (slugify("Tomat Sungold") → 'tomat-sungold')
 *   2. Artsguide   (slugify("Tomat")         → 'tomat')
 *   3. STOP. Kategori er ALDRIG datakilde — tomme felter forbliver tomme
 *      ("Ikke udfyldt endnu"). Opfind aldrig data.
 *
 * Feltkilde afgøres ved RÅ sammenligning af sortens og artens quickFacts —
 * IKKE via mergeGuide/inheritedFromParent. Verificeret 2/8: mergeGuide
 * registrerer kun nøgler der er *til stede men tomme* på sorten; helt
 * udeladte nøgler (den redaktionelle norm, jf. field-reference.md
 * "udeladt felt = arv fra arten") arves via spread uden registrering.
 * Regel pr. felt:
 *   - værdi eksplicit på sortens rå quickFacts (ikke-undefined, ikke tom
 *     liste) → 'sort'
 *   - ellers værdi på artens (parent) rå quickFacts → 'art'
 *   - ellers ingen værdi og ingen kilde
 *
 * Alt er form-session-input: intet persisteres, ingen metadata i DB.
 * Når brugeren gemmer, er alle værdier brugerens egne.
 */

import { GUIDE_FACTS, type GuideFactsEntry } from '@/data/guide-facts-index.generated'
import { slugify } from '@/lib/afledninger'
import { kanoniskSortsSlug } from '@/lib/sorts-alias'
import type { Guide, GuideQuickFacts } from '@/lib/types'
import type { DyrkningsfaktaState } from '@/components/froebank/dyrkningsfakta-fields'

export type AutofillKilde = 'sort' | 'art'

// ─── Typede dyrkningsvinduer (Anna 25/8) ─────────────────────────────
//
// Guidekontrakten kender TRE separate vinduer — forkultivering
// (`sowingMonths`), direkte såning (`directSowingMonths`) og udplantning
// (`plantingOutMonths`). Frøbankens formular har historisk kun ét samlet
// såfelt, og sammenfoldningen nedenfor (findFroebankAutofill) MISTER
// derfor hvilken handling månederne repræsenterer.
//
// Det tab må ikke brede sig til resten af appen. Verbet skal udledes af
// det konkrete AKTIVE vindue — ikke af `preCultivation`, som betyder
// "denne art kan/skal forkultiveres", ikke "alle måneder i det samlede
// såvindue er forkultiveringsmåneder". Salat viser forskellen: arten har
// forkultivering feb-aug, direkte såning mar-aug OG preCultivation: true.
// I august er begge handlinger gyldige, og "Så salat" er det enklere råd.
//
// `resolveFroebankVinduer` er derfor den kanoniske kilde for alt der skal
// vide HVILKEN handling en måned hører til. Det samlede felt lever videre
// til formularen — men aldrig som autoritativ kilde for en handling.

export type FroebankVinduesHandling = 'direct_sow' | 'pre_sow' | 'plant_out'

/** Hvor vinduet kommer fra — bevares hele vejen, så et kort kan debugges. */
export type FroebankVinduesKilde = 'inventory' | 'variety' | 'species'

export interface FroebankVindue {
  action: FroebankVinduesHandling
  months: number[]
  source: FroebankVinduesKilde
}

/**
 * Prioritet når FLERE vinduer er åbne i samme måned (Anna 25/8):
 * direkte såning før forkultivering før udplantning. Kan man både så
 * salaten direkte og forkultivere den i august, er "Så salat" det
 * enklere og mere naturlige råd; forkultivering er svaret, når den er
 * den nødvendige vej.
 */
export const FROEBANK_VINDUE_PRIORITET: FroebankVinduesHandling[] = [
  'direct_sow', 'pre_sow', 'plant_out',
]

export interface FroebankAutofill {
  /** Fuldt formet DyrkningsfaktaState — tomme defaults hvor guiderne tier. */
  facts: DyrkningsfaktaState
  /** Kun felter der faktisk fik en værdi — driver kilde-badges. */
  fieldSources: Partial<Record<keyof DyrkningsfaktaState, AutofillKilde>>
  /** Match-niveau: 'sort' hvis sortsguiden fandtes, ellers 'art'. */
  source: AutofillKilde
  /** "Foreslået af Potalot ud fra sorten 'Sungold'" / "Foreslået ud fra tomat generelt" */
  sourceLabel: string
  /** Kun ved art-fallback MED indtastet sort: forklaring om biblioteket. */
  sourceDetail: string | null
}

const guideById = new Map(GUIDE_FACTS.map(g => [g.id, g]))

/** Tom dyrknings-state — genbruges af manuel oprettelse som udgangspunkt. */
export function tomDyrkning(): DyrkningsfaktaState {
  return {
    sowingMonths: [],
    sowingDepthMm: null,
    preCultivation: null,
    plantingOutMonths: [],
    harvestMonths: [],
    light: null,
    water: null,
    soil: '',
    germinationDays: '',
    germinationTemperature: '',
    plantSpacing: '',
    rowSpacing: '',
  }
}

/** Har feltet en reel værdi? (tom liste og undefined tæller som "tier"). */
function harVaerdi(v: unknown): boolean {
  if (v === undefined || v === null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim().length > 0
  return true
}

/**
 * Effektiv værdi + kilde for ét quickFacts-felt via rå sammenligning.
 * sortQF er null ved rent arts-match — så er alle kilder 'art'.
 */
function resolveFelt<K extends keyof GuideQuickFacts>(
  key: K,
  sortQF: GuideQuickFacts | null,
  artQF: GuideQuickFacts | null,
): { value: GuideQuickFacts[K]; kilde: AutofillKilde } | null {
  if (sortQF && harVaerdi(sortQF[key])) return { value: sortQF[key], kilde: 'sort' }
  if (artQF && harVaerdi(artQF[key])) return { value: artQF[key], kilde: 'art' }
  return null
}

/**
 * Rå guide-opslag: sortsguide + artsguide for et navn/sort-par.
 *
 * Delt af autofill (som fylder felter ud) og feltrelevans (som afgør hvilke
 * felter der overhovedet skal stå frem) — så de to altid ser PRÆCIS samme
 * guider. Returnerer begge niveauer råt; kaldere laver selv sort→art-faldet.
 */
export function slaaGuiderOp(
  name: string,
  variety?: string | null,
): { sortsGuide: GuideFactsEntry | null; artsGuide: GuideFactsEntry | null } {
  const navn = name.trim()
  const sort = (variety ?? '').trim()
  if (!navn) return { sortsGuide: null, artsGuide: null }

  // 1) Sortsguide? Eksakt stavemåde først; findes den ikke, prøves sortens
  // kanoniske alias (fx 'Eight Ball F1' → 'Eight Ball'). Kun eksplicit
  // verificerede synonymer — se sorts-alias.ts.
  let sortsGuide: GuideFactsEntry | null = null
  if (sort) {
    sortsGuide = guideById.get(slugify(`${navn} ${sort}`)) ?? null
    if (!sortsGuide) {
      const kanonisk = kanoniskSortsSlug(navn, sort)
      if (kanonisk) sortsGuide = guideById.get(`${slugify(navn)}-${kanonisk}`) ?? null
    }
  }

  // 2) Artsguide — direkte match, eller sortsguidens parent.
  let artsGuide: GuideFactsEntry | null = null
  if (sortsGuide?.parentGuideId) {
    artsGuide = guideById.get(sortsGuide.parentGuideId) ?? null
  }
  if (!artsGuide) artsGuide = guideById.get(slugify(navn)) ?? null

  return { sortsGuide, artsGuide }
}

/**
 * Alle dyrkningsvinduer for en art/sort — med handlingstype og kilde BEVARET.
 *
 * Arven er den samme som resten af autofill'en: værdi eksplicit på sortens
 * rå quickFacts → 'variety'; ellers artens → 'species'; ellers intet vindue.
 * En manglende sortsværdi betyder "ingen override", ikke "ingen aktivitet".
 *
 * Vinduerne returneres i prioritetsrækkefølge (FROEBANK_VINDUE_PRIORITET) og
 * er BEVIDST ikke gjort disjunkte: overlapper forkultivering og direkte
 * såning, er begge sande, og kalderen vælger efter prioritet. Ville vi klippe
 * dem fra hinanden, ville "sidste måned, du kan forkultivere" pludselig
 * betyde "sidste måned hvor forkultivering var det ENESTE valg" — og det er
 * en anden og forkert påstand.
 */
export function resolveFroebankVinduer(
  name: string,
  variety?: string | null,
): FroebankVindue[] {
  const navn = name.trim()
  if (!navn) return []
  const { sortsGuide, artsGuide } = slaaGuiderOp(navn, (variety ?? '').trim())
  const sortQF = sortsGuide?.quickFacts ?? null
  const artQF = artsGuide?.quickFacts ?? null

  const ud: FroebankVindue[] = []
  const tilfoej = (action: FroebankVinduesHandling, key: keyof GuideQuickFacts) => {
    const r = resolveFelt(key, sortQF, artQF)
    if (!r || !Array.isArray(r.value) || r.value.length === 0) return
    ud.push({
      action,
      months: [...(r.value as number[])].sort((a, b) => a - b),
      source: r.kilde === 'sort' ? 'variety' : 'species',
    })
  }
  tilfoej('direct_sow', 'directSowingMonths')
  tilfoej('pre_sow', 'sowingMonths')
  tilfoej('plant_out', 'plantingOutMonths')
  return ud
}

export function findFroebankAutofill(
  name: string,
  variety?: string | null,
): FroebankAutofill | null {
  const navn = name.trim()
  const sort = (variety ?? '').trim()
  if (!navn) return null

  const { sortsGuide, artsGuide } = slaaGuiderOp(navn, sort)
  if (!sortsGuide && !artsGuide) return null

  const sortQF = sortsGuide?.quickFacts ?? null
  const artQF = artsGuide?.quickFacts ?? null

  const facts = tomDyrkning()
  const fieldSources: FroebankAutofill['fieldSources'] = {}

  // Direkte 1:1-felter (samme navn i GuideQuickFacts og DyrkningsfaktaState).
  const saet = <K extends keyof DyrkningsfaktaState & keyof GuideQuickFacts>(key: K) => {
    const r = resolveFelt(key, sortQF, artQF)
    if (!r) return
    ;(facts as unknown as Record<string, unknown>)[key] = r.value
    fieldSources[key] = r.kilde
  }
  saet('sowingDepthMm')
  saet('preCultivation')
  saet('plantingOutMonths')
  saet('harvestMonths')
  saet('light')
  saet('water')
  saet('soil')
  saet('germinationDays')
  saet('germinationTemperature')
  saet('plantSpacing')
  saet('rowSpacing')

  // Sås-måneder: guiderne skelner mellem forkultivering (sowingMonths) og
  // direkte såning (directSowingMonths); frøbankens FORMULAR har ét felt.
  // Regel:
  //   preCultivation === true  → sowingMonths (indendørs-vinduet)
  //   preCultivation === false → directSowingMonths
  //   ukendt                   → union af begge (begge er ægte såvinduer)
  //
  // Sammenfoldningen sker KUN her, til formularen. Alt der skal vide hvilken
  // HANDLING månederne hører til, skal bruge resolveFroebankVinduer() —
  // ellers udleder man verbet af preCultivation, og det er en egenskab ved
  // planten, ikke ved vinduet. Begge veje læser de samme resolveFelt-opslag,
  // så de kan ikke drifte fra hinanden.
  const indendoers = resolveFelt('sowingMonths', sortQF, artQF)
  const direkte = resolveFelt('directSowingMonths', sortQF, artQF)
  const preCult = facts.preCultivation
  let valgteMaaneder: { months: number[]; kilde: AutofillKilde } | null = null
  if (preCult === true && indendoers) {
    valgteMaaneder = { months: indendoers.value as number[], kilde: indendoers.kilde }
  } else if (preCult === false && direkte) {
    valgteMaaneder = { months: direkte.value as number[], kilde: direkte.kilde }
  } else if (indendoers || direkte) {
    const union = [...new Set([
      ...((indendoers?.value as number[] | undefined) ?? []),
      ...((direkte?.value as number[] | undefined) ?? []),
    ])].sort((a, b) => a - b)
    // Ved blandet oprindelse vinder den mest specifikke kilde-etiket.
    const kilde: AutofillKilde =
      indendoers?.kilde === 'sort' || direkte?.kilde === 'sort' ? 'sort' : 'art'
    valgteMaaneder = { months: union, kilde }
  }
  if (valgteMaaneder && valgteMaaneder.months.length > 0) {
    facts.sowingMonths = valgteMaaneder.months
    fieldSources.sowingMonths = valgteMaaneder.kilde
  }

  const source: AutofillKilde = sortsGuide ? 'sort' : 'art'
  const sourceLabel = sortsGuide
    ? `Foreslået af Potalot ud fra sorten '${sortsGuide.variety ?? sort}'`
    : `Foreslået ud fra ${navn.toLowerCase()} generelt`
  const sourceDetail =
    !sortsGuide && sort
      ? `Sorten findes endnu ikke i biblioteket. Vi har brugt ${navn.toLowerCase()} som udgangspunkt.`
      : null

  // Intet felt fik værdi → behandl som intet fund (ingen tom "vi har fundet
  // oplysninger"-lovning over for brugeren).
  if (Object.keys(fieldSources).length === 0) return null

  return { facts, fieldSources, source, sourceLabel, sourceDetail }
}

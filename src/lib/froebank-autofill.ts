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

import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { slugify } from '@/lib/afledninger'
import type { Guide, GuideQuickFacts } from '@/lib/types'
import type { DyrkningsfaktaState } from '@/components/froebank/dyrkningsfakta-fields'

export type AutofillKilde = 'sort' | 'art'

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

const guideById = new Map(IMPORTED_GUIDES.map(g => [g.id, g]))

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

export function findFroebankAutofill(
  name: string,
  variety?: string | null,
): FroebankAutofill | null {
  const navn = name.trim()
  const sort = (variety ?? '').trim()
  if (!navn) return null

  // 1) Sortsguide?
  let sortsGuide: Guide | null = null
  if (sort) sortsGuide = guideById.get(slugify(`${navn} ${sort}`)) ?? null

  // 2) Artsguide — direkte match, eller sortsguidens parent.
  let artsGuide: Guide | null = null
  if (sortsGuide?.parentGuideId) {
    artsGuide = guideById.get(sortsGuide.parentGuideId) ?? null
  }
  if (!artsGuide) artsGuide = guideById.get(slugify(navn)) ?? null

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
  saet('germinationDays')
  saet('germinationTemperature')
  saet('plantSpacing')
  saet('rowSpacing')

  // Sås-måneder: guiderne skelner mellem forkultivering (sowingMonths) og
  // direkte såning (directSowingMonths); frøbanken har ét felt. Regel:
  //   preCultivation === true  → sowingMonths (indendørs-vinduet)
  //   preCultivation === false → directSowingMonths
  //   ukendt                   → union af begge (begge er ægte såvinduer)
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

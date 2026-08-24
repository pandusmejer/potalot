/**
 * Feltrelevans for dyrkningsfakta — REN PRÆSENTATION.
 *
 * Formålet: Frøbanken skal kun fremhæve dyrkningsfelter, der er relevante
 * for den konkrete art/sort. Intet slettes, intet skrives, intet gættes.
 *
 * ── Låst regel (Anna 24/8) ──────────────────────────────────────────────
 * Et felt er RELEVANT, hvis mindst én er sand:
 *   1. sortens data har en reel værdi
 *   2. ellers artens data har en reel værdi
 *   3. brugerens egen frøpost har en værdi
 *
 * Et felt er kun IRRELEVANT, når Potalot EKSPLICIT ved, at det ikke bruges.
 * Manglende data ≠ irrelevant. Tavshed i guiden skjuler ALDRIG et felt.
 *
 * ── Hvad kan datamodellen faktisk bære? ─────────────────────────────────
 * `GuideQuickFacts.preCultivation?: boolean` er det ENESTE felt med ægte
 * negativ viden: `false` betyder "denne art forkultiveres ikke", mens
 * `undefined` betyder "vi ved det ikke". Alle øvrige quickFacts-felter er
 * enten valgfri strenge/tal (udeladt = ingen data) eller måneds-arrays, hvor
 * tom liste ikke kan skelnes fra manglende redaktionel udfyldning. Derfor
 * afleder denne motor kun to skjul, begge forankret i `preCultivation ===
 * false`:
 *
 *   · Forkultivering (preCultivation)
 *       Skjules når guiden siger false OG brugeren ikke har sagt noget andet.
 *
 *   · Plant ud (plantingOutMonths)
 *       Skjules når guiden siger false OG guiden heller ikke har et
 *       udplantningsvindue OG brugeren ikke selv har et. Dvs. udplantning
 *       giver her kun mening som følge af forkultivering.
 *       Arter der IKKE forkultiveres, men stadig sættes ud (kartoffel,
 *       hvidløg, jordbær), har et reelt plantingOutMonths i guiden og
 *       beholder derfor feltet. Ingen artsliste — det falder ud af dataen.
 *
 * ── Brugerens egne data må aldrig skjules ───────────────────────────────
 * Et felt vises igen, så snart brugerens værdi AFVIGER fra Potalots viden
 * (fx preCultivation = true på en gulerod, eller egne udplantningsmåneder).
 * Vi skjuler kun, når den gemte værdi er identisk med Potalots "bruges
 * ikke"-viden — dér går ingen brugerinformation tabt.
 *
 * NB: I formularerne betyder "skjult" ikke fjernet, men flyttet ned under
 * "Flere dyrkningsoplysninger". Brugeren skal altid kunne registrere en
 * særmetode.
 */

import { slaaGuiderOp } from '@/lib/froebank-autofill'
import type { DyrkningsfaktaState } from '@/components/froebank/dyrkningsfakta-fields'
import type { GuideQuickFacts } from '@/lib/types'

export type DyrkningsFelt = keyof DyrkningsfaktaState

/** Brugerens egne værdier — kun de felter relevansen faktisk kigger på. */
export interface EgneDyrkningsvaerdier {
  preCultivation?: boolean | null
  plantingOutMonths?: number[] | null
}

/** Sort først, så art. `undefined` betyder "ingen af dem siger noget". */
function fraGuide<K extends keyof GuideQuickFacts>(
  key: K,
  sortQF: GuideQuickFacts | null,
  artQF: GuideQuickFacts | null,
): GuideQuickFacts[K] | undefined {
  const s = sortQF?.[key]
  if (s !== undefined && !(Array.isArray(s) && s.length === 0)) return s
  const a = artQF?.[key]
  if (a !== undefined && !(Array.isArray(a) && a.length === 0)) return a
  return undefined
}

/**
 * Hvilke dyrkningsfelter ved Potalot POSITIVT ikke bruges for denne art/sort?
 *
 * Tom mængde = vis alt som hidtil (det normale svar; kun 8 af 176 guides
 * bærer i dag eksplicit `preCultivation: false`).
 */
export function irrelevanteDyrkningsfelter(
  name: string,
  variety?: string | null,
  egne?: EgneDyrkningsvaerdier,
): Set<DyrkningsFelt> {
  const skjul = new Set<DyrkningsFelt>()
  if (!name?.trim()) return skjul

  const { sortsGuide, artsGuide } = slaaGuiderOp(name, variety)
  if (!sortsGuide && !artsGuide) return skjul

  const sortQF = sortsGuide?.quickFacts ?? null
  const artQF = artsGuide?.quickFacts ?? null

  // Eneste ægte negative viden i modellen.
  if (fraGuide('preCultivation', sortQF, artQF) !== false) return skjul

  // Brugeren har eksplicit sagt "ja, jeg forkultiverer" → afviger fra
  // Potalots viden. Så står både Forkultivering og Plant ud ved magt.
  if (egne?.preCultivation === true) return skjul

  skjul.add('preCultivation')

  const guidensPlantUd = fraGuide('plantingOutMonths', sortQF, artQF)
  const guidenHarPlantUd = Array.isArray(guidensPlantUd) && guidensPlantUd.length > 0
  const brugerHarPlantUd = (egne?.plantingOutMonths?.length ?? 0) > 0
  if (!guidenHarPlantUd && !brugerHarPlantUd) skjul.add('plantingOutMonths')

  return skjul
}

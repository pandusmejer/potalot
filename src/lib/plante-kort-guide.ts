/**
 * Kort dyrkningsguide til én konkret plante (MVP 1.0, fase 2).
 *
 * Ingen nye guidetekster. Alt hentes fra de EKSISTERENDE quickFacts på
 * artsguiden og sortsguiden (GUIDE_FACTS), med samme arv som frøbankens
 * autofill: en værdi på sortens guide vinder, ellers bruges artens, ellers
 * står feltet ikke. Et tavst felt betyder "guiden ved det ikke" — aldrig
 * "det behøves ikke" — så rækken udelades i stedet for at gætte.
 *
 * Det redaktionelle kildeindhold (content/guides) er urørt; den fulde guide
 * åbnes via det link, plantesiden allerede har (resolvePlantGuideHref).
 */

import { slaaGuiderOp } from '@/lib/froebank-autofill'
import { LIGHT_META, MONTHS_DA, WATER_META } from '@/lib/constants'
import type { GuideQuickFacts } from '@/lib/types'

export interface KortGuideRaekke {
  label: string
  value: string
}

export interface KortGuide {
  /** Lys, vanding, jord, afstand, såning, udplantning, høst, frost. */
  raekker: KortGuideRaekke[]
  /** Kun fra sortens EGEN guide: type, højde, modning, anvendelse. */
  sortRaekker: KortGuideRaekke[]
  /** Hvor oplysningerne kommer fra, i brugerens ord. */
  kilde: string
  /** Ved sort uden egen guide: ærlig forklaring om at artens guide bruges. */
  note: string | null
}

type QF = GuideQuickFacts

function harVaerdi(v: unknown): boolean {
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim() !== ''
  return true
}

/** Sammenhængende måneder → "maj–jun"; ellers en liste "mar, maj, sep". */
export function formatMaaneder(maaneder: number[]): string {
  const m = [...new Set(maaneder)].filter((n) => n >= 1 && n <= 12).sort((a, b) => a - b)
  if (m.length === 0) return ''
  const navn = (n: number) => MONTHS_DA[n - 1].short
  const sammenhaengende = m.every((n, i) => i === 0 || n === m[i - 1] + 1)
  if (m.length === 1) return navn(m[0])
  return sammenhaengende ? `${navn(m[0])}–${navn(m[m.length - 1])}` : m.map(navn).join(', ')
}

function saadybde(mm: number | undefined): string | null {
  if (mm == null) return null
  if (mm === 0) return 'sås på overfladen'
  if (mm < 10) return `${mm} mm dybt`
  return `${(mm / 10).toLocaleString('da-DK')} cm dybt`
}

export function kortGuideForPlante(
  name: string,
  variety?: string | null,
): KortGuide | null {
  const { sortsGuide, artsGuide } = slaaGuiderOp(name, variety)
  if (!sortsGuide && !artsGuide) return null

  const sortQF: QF | null = sortsGuide?.quickFacts ?? null
  const artQF: QF | null = artsGuide?.quickFacts ?? null

  // Sort → art-arv, felt for felt.
  function vaelg<K extends keyof QF>(key: K): QF[K] | undefined {
    if (sortQF && harVaerdi(sortQF[key])) return sortQF[key]
    if (artQF && harVaerdi(artQF[key])) return artQF[key]
    return undefined
  }

  const raekker: KortGuideRaekke[] = []

  const lys = vaelg('light')
  if (lys) raekker.push({ label: 'Lys', value: LIGHT_META[lys].label })

  const vand = vaelg('water')
  if (vand) raekker.push({ label: 'Vanding', value: WATER_META[vand].label })

  const jord = vaelg('soil')
  if (jord) raekker.push({ label: 'Jord', value: jord })

  const plantAfstand = vaelg('plantSpacing')
  const raekkeAfstand = vaelg('rowSpacing')
  if (plantAfstand || raekkeAfstand) {
    raekker.push({
      label: 'Afstand',
      value: [plantAfstand, raekkeAfstand ? `rækker ${raekkeAfstand}` : null]
        .filter(Boolean)
        .join(' · '),
    })
  }

  // Såning: hvordan, ikke hvornår (vinduerne bor i kalenderen og opgaverne).
  const forkult = vaelg('preCultivation')
  const saaDele = [
    forkult === true ? 'Forkultiveres' : forkult === false ? 'Sås direkte' : null,
    saadybde(vaelg('sowingDepthMm')),
    vaelg('germinationDays') ? `spirer på ${vaelg('germinationDays')}` : null,
  ].filter(Boolean)
  if (saaDele.length > 0) raekker.push({ label: 'Såning', value: saaDele.join(' · ') })

  const udplant = vaelg('plantingOutMonths')
  if (udplant?.length) raekker.push({ label: 'Udplantning', value: formatMaaneder(udplant) })

  const hoest = vaelg('harvestMonths')
  if (hoest?.length) raekker.push({ label: 'Høst', value: formatMaaneder(hoest) })

  // Frost: kun når guiden SIGER frostfølsom. false/ukendt giver ingen række.
  if (vaelg('frostSensitive') === true) {
    const min = vaelg('minimumTemperature')
    raekker.push({ label: 'Frost', value: min ? `Frostfølsom · ikke under ${min}` : 'Frostfølsom' })
  }

  // Særligt for sorten: KUN hvad sortens egen guide siger.
  const sortRaekker: KortGuideRaekke[] = []
  if (sortQF) {
    if (harVaerdi(sortQF.growthType)) sortRaekker.push({ label: 'Type', value: sortQF.growthType! })
    if (harVaerdi(sortQF.height)) sortRaekker.push({ label: 'Højde', value: sortQF.height! })
    if (harVaerdi(sortQF.maturityDays)) sortRaekker.push({ label: 'Modning', value: sortQF.maturityDays! })
    if (harVaerdi(sortQF.primaryUse)) sortRaekker.push({ label: 'Bruges til', value: sortQF.primaryUse! })
  }

  if (raekker.length === 0 && sortRaekker.length === 0) return null

  const art = (artsGuide?.plantName ?? name).trim()
  const sort = (variety ?? '').trim()
  const kilde = sortsGuide
    ? `Fra guiden til ${sortsGuide.variety ?? sort}${artsGuide ? `, med arv fra ${art.toLowerCase()}` : ''}`
    : `Fra artsguiden for ${art.toLowerCase()}`
  const note =
    !sortsGuide && sort
      ? `Sorten findes endnu ikke i biblioteket, så oplysningerne gælder ${art.toLowerCase()} generelt.`
      : null

  return { raekker, sortRaekker, kilde, note }
}

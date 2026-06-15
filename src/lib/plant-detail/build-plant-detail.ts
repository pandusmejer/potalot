/**
 * buildPlantDetail — data-drevet editorial planteside.
 *
 * Annas arkitektur-beslutning (2026-06-15): det nye editorial-design er
 * STANDARDEN for alle planter, ikke noget der kun vises når der findes
 * håndskrevet indhold. `plant-detail.ts` er ikke længere adgangsbillet —
 * den er et OVERRIDE/berigelses-lag.
 *
 *   detail = buildPlantDetail({ plant, override: PLANT_DETAIL_OVERRIDES[guideId] })
 *
 * Mål, "Lige nu" og Tidslinje udledes af plantens egne data (status,
 * datoer, logbog). Findes der et override (fx San Marzano), bruges dets
 * tekst/billeder ovenpå det afledte. Mangler data → ærlig fallback eller
 * skjul. INGEN falske statiske tal.
 *
 * V1-rækkevidde (robust frem for genial):
 *   • Mål      — Status + Alder udledt; Højde = "Ikke målt" (ingen
 *                struktureret målekilde endnu); Sundhed = status-afledt.
 *   • Lige nu  — regelbaseret pr. dyrkningsfase.
 *   • Tidslinje— faktiske faser (datoer fra planten) + forventede faser.
 *   • Billeder/Sammenligning — kun fra override i V1 (ellers skjult).
 *   • Karakter — håndteres separat via karakterFor() (PLANT_KARAKTER).
 *   • Historik — den live logbog (Dagbog-sektionen).
 */

import type { MockPlant } from '@/data/mock-plants'
import type { PlantStatus } from '@/lib/types'
import type {
  DetailMaal,
  DetailNaeste,
  DetailMilestone,
  PlantDetail,
  PlantDetailOverride,
} from '@/data/plant-detail'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden, formatDatoKort } from '@/lib/datetime'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

/** Rangering af faser, så vi kan afgøre hvad der er sket vs. forventet. */
const STATUS_RANK: Record<PlantStatus, number> = {
  planlagt: 0,
  saaet: 1,
  spirer: 2,
  i_vaekst: 3,
  klar_til_udplantning: 4,
  udplantet: 5,
  hoestklar: 6,
  afsluttet: 7,
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function plantCardSrc(plant: MockPlant): string {
  const varietySlug = plant.variety ? slugify(`${plant.name}-${plant.variety}`) : null
  return resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  }).src
}

// ─── 1. Mål-strimmel ───────────────────────────────────────────

const STATUS_NOTE: Record<PlantStatus, string> = {
  planlagt: 'endnu ikke sået',
  saaet: 'venter på spiring',
  spirer: 'nye skud',
  i_vaekst: 'i vækst',
  klar_til_udplantning: 'klar til haven',
  udplantet: 'i sit bed',
  hoestklar: 'kan høstes',
  afsluttet: 'sæsonen er slut',
}

/** Sundhed udledes groft af fasen (ingen struktureret sundhedslog endnu). */
function deriveSundhed(status: PlantStatus): { value: string; note: string } {
  switch (status) {
    case 'planlagt':  return { value: '—', note: 'ikke sået endnu' }
    case 'afsluttet': return { value: 'Afsluttet', note: 'sæsonen er slut' }
    case 'hoestklar': return { value: 'Moden', note: 'klar til høst' }
    default:          return { value: 'God', note: 'ingen problemer logget' }
  }
}

export function deriveMaal(plant: MockPlant): DetailMaal {
  const meta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null
  const sundhed = deriveSundhed(plant.status)
  return {
    statusValue: meta.label,
    statusNote: STATUS_NOTE[plant.status],
    alderValue: alder != null ? (alder === 1 ? '1 dag' : `${alder} dage`) : '—',
    alderNote: plant.sowDate ? 'siden såning' : 'ikke sået endnu',
    // Ingen struktureret højdemåling endnu → ærlig fallback (ikke et opdigtet tal).
    hoejdeValue: 'Ikke målt',
    hoejdeNote: 'log en måling',
    sundhedValue: sundhed.value,
    sundhedNote: sundhed.note,
  }
}

// ─── 2. "Lige nu" — regelbaseret pr. fase ──────────────────────

interface NaesteRule {
  overskrift: string
  beskrivelse: string
  denneUge: string[]
}

const STATUS_NAESTE: Record<PlantStatus, NaesteRule> = {
  planlagt: {
    overskrift: 'Klar til at så',
    beskrivelse: 'Find en plads og kom i gang — sæsonen venter ikke.',
    denneUge: ['Vælg så-sted', 'Find såbakke og jord', 'Tjek så-timing i guiden'],
  },
  saaet: {
    overskrift: 'Spiringsfasen',
    beskrivelse: 'Hold jorden let fugtig og lun. De første spirer bør snart vise sig.',
    denneUge: ['Hold jorden fugtig', 'Hold den lunt', 'Undgå direkte udtørring'],
  },
  spirer: {
    overskrift: 'Spirerne er oppe',
    beskrivelse: 'Giv masser af lys, så de ikke strækker sig, og vand forsigtigt.',
    denneUge: ['Giv masser af lys', 'Vand forsigtigt', 'Vend mod lyset dagligt'],
  },
  i_vaekst: {
    overskrift: 'I fuld vækst',
    beskrivelse: 'Planten vokser. Hold jorden jævnt fugtig og gød efter behov.',
    denneUge: ['Hold jorden fugtig', 'Gød hver 1.–2. uge', 'Fjern visne blade'],
  },
  klar_til_udplantning: {
    overskrift: 'Klar til at flytte ud',
    beskrivelse: 'Hærd planten gradvist, og plant ud når frosten er ovre.',
    denneUge: ['Hærd af udendørs', 'Tjek frostvarsel', 'Forbered bedet'],
  },
  udplantet: {
    overskrift: 'Etableret i bedet',
    beskrivelse: 'Hold øje med væksten og vand i tørre perioder.',
    denneUge: ['Vand i tørke', 'Bind op ved behov', 'Hold øje med skadedyr'],
  },
  hoestklar: {
    overskrift: 'Klar til høst',
    beskrivelse: 'Tjek planten jævnligt og høst løbende, mens den er på sit bedste.',
    denneUge: ['Høst løbende', 'Tjek for modne frugter', 'Vand jævnt'],
  },
  afsluttet: {
    overskrift: 'Sæsonen er slut',
    beskrivelse: 'Gem dine noter og fotos til næste år — de bliver guld værd.',
    denneUge: ['Ryd op i bedet', 'Gem dine noter', 'Planlæg næste sæson'],
  },
}

function deriveTiming(plant: MockPlant): string {
  if (plant.status === 'saaet') return 'spirer typisk om 1–2 uger'
  if (plant.status === 'planlagt') return 'så når jorden er klar'
  if (plant.expectedHarvestStart && STATUS_RANK[plant.status] < STATUS_RANK.hoestklar) {
    return `høst forventes omkring ${formatDatoKort(plant.expectedHarvestStart)}`
  }
  if (plant.status === 'hoestklar') return 'høst nu'
  return STATUS_NOTE[plant.status]
}

export function deriveNaeste(plant: MockPlant): DetailNaeste {
  const rule = STATUS_NAESTE[plant.status]
  return {
    overskrift: rule.overskrift,
    timing: deriveTiming(plant),
    beskrivelse: rule.beskrivelse,
    guideHref: '/guides',
    denneUge: rule.denneUge,
    fotoSrc: plantCardSrc(plant),
    fotoAlt: `${plant.name}${plant.variety ? ` ${plant.variety}` : ''}`,
  }
}

// ─── 3. Tidslinje — faktiske + forventede faser ────────────────

/** Find en logget dato for en fase (matcher på handlingstekst). */
function loggedDate(plant: MockPlant, match: RegExp): string | null {
  const hit = [...plant.logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((l) => match.test(l.action.toLowerCase()))
  return hit?.date ?? null
}

export function deriveTidslinje(
  plant: MockPlant,
  noter?: Record<string, string>,
): DetailMilestone[] {
  const rank = STATUS_RANK[plant.status]
  const note = (label: string, fallback: string) => noter?.[label] ?? fallback
  const ms: DetailMilestone[] = []

  // Sået
  if (plant.sowDate) {
    ms.push({
      label: 'Sået', dato: formatDatoKort(plant.sowDate), ikon: 'fro',
      historie: note('Sået', 'Frøene kom i jorden — rejsen er begyndt.'),
    })
  }

  // Spiret
  const spiret = plant.sproutedDate ?? loggedDate(plant, /spire/)
  if (spiret) {
    ms.push({
      label: 'Spiret', dato: formatDatoKort(spiret), ikon: 'spire',
      historie: note('Spiret', 'De første skud brød jorden.'),
    })
  } else if (rank < STATUS_RANK.spirer) {
    ms.push({
      label: 'Spiret', dato: null, ikon: 'spire',
      historie: note('Spiret', 'Forventes 1–2 uger efter såning.'),
    })
  }

  // Udplantet
  const udplantet = plant.plantedOutDate ?? loggedDate(plant, /udplant|plantet ud/)
  if (udplantet) {
    ms.push({
      label: 'Udplantet', dato: formatDatoKort(udplantet), ikon: 'plante',
      historie: note('Udplantet', 'Flyttet ud i sit blivende bed.'),
    })
  } else if (rank < STATUS_RANK.udplantet && plant.status !== 'planlagt') {
    ms.push({
      label: 'Udplantet', dato: null, ikon: 'plante',
      historie: note('Udplantet', 'Forventes når frosten er ovre.'),
    })
  }

  // Høst
  if (rank >= STATUS_RANK.hoestklar) {
    ms.push({
      label: rank >= STATUS_RANK.afsluttet ? 'Høstet' : 'Høstklar', dato: null, ikon: 'frugt',
      historie: note('Høst', rank >= STATUS_RANK.afsluttet ? 'Sæsonen er i hus.' : 'Klar til at høste.'),
    })
  } else {
    ms.push({
      label: 'Første høst', dato: null, ikon: 'frugt',
      historie: note('Høst', plant.expectedHarvestStart
        ? `Forventes omkring ${formatDatoKort(plant.expectedHarvestStart)}.`
        : 'Forventes sidst på sæsonen.'),
    })
  }

  return ms
}

// ─── Builder ───────────────────────────────────────────────────

/**
 * Byg den fælles editorial-struktur for ENHVER plante. Override (hvis
 * det findes) beriger oven på det afledte — det styrer ikke længere om
 * brugeren får nyt eller gammelt layout.
 */
export function buildPlantDetail(args: {
  plant: MockPlant
  override?: PlantDetailOverride | null
}): PlantDetail {
  const { plant, override } = args
  const naeste = deriveNaeste(plant)

  return {
    heroFoto: plantCardSrc(plant),
    heroFotoAlt: `${plant.name}${plant.variety ? ` ${plant.variety}` : ''}`,
    maal: deriveMaal(plant),
    naeste: { ...naeste, ...(override?.naeste ?? {}) },
    tidslinje: deriveTidslinje(plant, override?.tidslinjeNoter),
    // V1: galleri + sammenligning kun fra override (ellers skjult — ingen tomme kort).
    billeder: override?.billeder ?? [],
    sammenligning: override?.sammenligning ?? null,
  }
}

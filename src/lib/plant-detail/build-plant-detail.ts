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
import type { PlantStatus, PlantLog } from '@/lib/types'
import type {
  DetailMaal,
  DetailNaeste,
  DetailMilestone,
  PlantDetail,
  PlantDetailOverride,
} from '@/data/plant-detail'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden, formatDatoKort } from '@/lib/datetime'
import { healthShort, heightLabel } from '@/lib/plant-log-meta'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { resolveNowImage, nowTypeForStatus } from '@/lib/images/resolve-now-image'

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

function plantCardImage(plant: MockPlant): { src: string; hasPhoto: boolean } {
  const varietySlug = plant.variety ? slugify(`${plant.name}-${plant.variety}`) : null
  const { src, source } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  // source 'fallback' = kun placeholder; ikke et ægte foto.
  return { src, hasPhoto: source !== 'fallback' }
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

/** Find den nyeste log af en given type (dato, dernæst created_at). */
function latestLog(logs: PlantLog[] | undefined, type: PlantLog['type']): PlantLog | null {
  if (!logs || logs.length === 0) return null
  const of = logs.filter(l => l.type === type)
  if (of.length === 0) return null
  return of.slice().sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })[0]
}

/**
 * Trivsel og Højde er nu ÆGTE brugerlogget data (migration 00060), ikke
 * status-afledte gæt. Uden en registrering vises "Ikke vurderet"/"Ikke målt" —
 * appen påstår aldrig at planten har det godt uden en kilde (Anna 16/7).
 */
export function deriveMaal(plant: MockPlant, logs?: PlantLog[]): DetailMaal {
  const meta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null

  const healthLog = latestLog(logs, 'health')
  const heightLog = latestLog(logs, 'height_measurement')
  const sundhedValue = (healthLog && healthShort(healthLog.valueText)) || 'Ikke vurderet'
  const hoejdeValue = (heightLog && heightLabel(heightLog.valueNumeric)) || 'Ikke målt'

  return {
    statusValue: meta.label,
    statusNote: STATUS_NOTE[plant.status],
    alderValue: alder != null ? (alder === 1 ? '1 dag' : `${alder} dage`) : '—',
    alderNote: plant.sowDate ? 'siden såning' : 'ikke sået endnu',
    hoejdeValue,
    hoejdeNote: heightLog ? 'seneste måling' : 'log en måling',
    hoejdeSource: heightLog ? formatDatoKort(heightLog.date) : undefined,
    sundhedValue,
    sundhedNote: healthLog ? 'seneste vurdering' : 'endnu ikke vurderet',
    sundhedSource: healthLog ? formatDatoKort(healthLog.date) : undefined,
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
  // "Lige nu" er sidens magasin-moment. resolveNowImage vælger det bedst
  // egnede makro (sort → art → sikker crossover) ud fra fase + motivrolle;
  // ellers falder vi til plantekort-fotoet; ellers tom streng → botanisk fyld.
  const now = resolveNowImage({
    speciesSlug: slugify(plant.name),
    varietySlug: plant.variety ? slugify(plant.variety) : null,
    stage: plant.status,
    nowType: nowTypeForStatus(plant.status),
  })
  const foto = plantCardImage(plant)
  return {
    overskrift: rule.overskrift,
    timing: deriveTiming(plant),
    beskrivelse: rule.beskrivelse,
    guideHref: '/guides',
    denneUge: rule.denneUge,
    fotoSrc: now?.src ?? (foto.hasPhoto ? foto.src : ''),
    fotoAlt: now?.alt ?? `${plant.name}${plant.variety ? ` ${plant.variety}` : ''}`,
    fotoObjectPosition: now?.objectPosition,
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
  /** Brugerens ægte logs — driver Trivsel/Højde i Mål-strimlen. */
  logs?: PlantLog[]
}): PlantDetail {
  const { plant, override, logs } = args
  const naeste = deriveNaeste(plant)

  return {
    heroFoto: plantCardImage(plant).src,
    heroFotoAlt: `${plant.name}${plant.variety ? ` ${plant.variety}` : ''}`,
    maal: deriveMaal(plant, logs),
    naeste: { ...naeste, ...(override?.naeste ?? {}) },
    tidslinje: deriveTidslinje(plant, override?.tidslinjeNoter),
    // V1: galleri + sammenligning kun fra override (ellers skjult — ingen tomme kort).
    billeder: override?.billeder ?? [],
    sammenligning: override?.sammenligning ?? null,
  }
}

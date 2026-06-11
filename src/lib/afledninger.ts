/**
 * Afledningsmotoren — Sprint 1: synlig intelligens.
 *
 * Rene afledningsfunktioner over data der ALLEREDE registreres.
 * Ingen AI, ingen nye tabeller, ingen ny registrering — jf.
 * Docs/product/afledningsmotoren.md.
 *
 * Principper (fra afledningsmotoren.md):
 *   - Estimater markeres som estimater ("~", "forventes")
 *   - Huller i data giver stilhed (null), ikke advarsler
 *   - Afledninger formuleres i sektionens stemme — funktionerne her
 *     returnerer Planter-stemmen (tilstand); Kalender-versionerne
 *     (handling, bydeform) afledes af samme data men formuleres
 *     i kalender-laget.
 *
 * Datakilder: Plant (sowDate, status) + Guide.quickFacts
 * (germinationDays, harvestMonths) via IMPORTED_GUIDES.
 */

import type { Plant } from '@/lib/types'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { dageSiden } from '@/lib/datetime'

/**
 * En afledt statuslinje til et sort-kort.
 *
 * kind styrer farven i UI:
 *   info     → normal statusfarve (grøn — alt går som forventet)
 *   attention→ gold — noget er værd at kigge på (anomali, ventet nu)
 */
export interface AfledtStatus {
  kind: 'info' | 'attention'
  text: string
}

const MAANED_KORT = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

// ─────────────────────────────────────────────────────────────
// Guide-opslag
// ─────────────────────────────────────────────────────────────

/**
 * QuickFacts-opslag med arts-fallback.
 *
 * 1. plant.guideId → sortsguidens quickFacts (fx 'tomat-san-marzano')
 * 2. Ingen guideId / ukendt → prøv artens guide via plantens navn
 *    (fx Sweetie: guideId=null, name='Tomat' → arts-guiden 'tomat').
 *    Arts-data er ÆRLIG fallback: spiretid og høstvindue er
 *    arts-egenskaber, ikke sorts-egenskaber.
 * 3. Intet match → null → afledningerne tier stille.
 *
 * NOTE: IMPORTED_GUIDES indeholder fulde guide-tekster og er ikke
 * gratis i client-bundlen. Acceptabelt i prototype-fasen; hvis det
 * bliver et problem, udtrækkes et quickFacts-only manifest ved
 * import-tid (samme mønster som POTALOT_IMAGE_SETS).
 */
const guideById = new Map(IMPORTED_GUIDES.map(g => [g.id, g]))

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function quickFactsFor(plant: Plant) {
  if (plant.guideId) {
    const g = guideById.get(plant.guideId)
    if (g) return g.quickFacts
  }
  const artsGuide = guideById.get(slugify(plant.name))
  return artsGuide?.quickFacts ?? null
}

// ─────────────────────────────────────────────────────────────
// P2: Forventet spiring (+ P5: anomali)
// ─────────────────────────────────────────────────────────────

/** Parse "6-10 dage" / "14-28 dage" / "7 dage" → {min, max} eller null. */
export function parseGerminationDays(
  s: string | null | undefined,
): { min: number; max: number } | null {
  if (!s) return null
  const m = s.match(/(\d+)\s*(?:-\s*(\d+))?/)
  if (!m) return null
  const min = parseInt(m[1], 10)
  const max = m[2] ? parseInt(m[2], 10) : min
  if (isNaN(min) || isNaN(max)) return null
  return { min, max }
}

/**
 * Forventet spiring for en sået plante.
 *
 *   Før vinduet:    "Spiring om ~3 dage"        (info)
 *   I vinduet:      "Spiring ventes netop nu"   (attention — kig i bakken)
 *   Efter vinduet:  "Sået for 17 dage siden — spiret?" (attention, P5-anomali)
 *
 * Returnerer null hvis sowDate eller spiretid mangler (stilhed).
 */
export function forventetSpiring(plant: Plant): AfledtStatus | null {
  if (!plant.sowDate) return null
  const qf = quickFactsFor(plant)
  const germ = parseGerminationDays(qf?.germinationDays)
  if (!germ) return null

  const dage = dageSiden(plant.sowDate)
  if (dage < 0) return null

  if (dage < germ.min) {
    const tilbage = germ.min - dage
    return {
      kind: 'info',
      text: `Spiring om ~${tilbage} ${tilbage === 1 ? 'dag' : 'dage'}`,
    }
  }
  if (dage <= germ.max) {
    return { kind: 'attention', text: 'Spiring ventes netop nu' }
  }
  return {
    kind: 'attention',
    text: `Sået for ${dage} dage siden — spiret?`,
  }
}

// ─────────────────────────────────────────────────────────────
// P3: Forventet høstvindue
// ─────────────────────────────────────────────────────────────

/**
 * Forventet høstvindue ud fra guidens harvestMonths.
 *
 *   Før vinduet:   "Høst fra august"
 *   I vinduet:     "Høstsæson nu"
 *   Efter vinduet: null (sæsonen er reelt slut — planten bør
 *                  snart være 'afsluttet'; vi gnider det ikke ind)
 *
 * Tilde-reglen (V1.1): "~" bruges KUN ved beregnede dag-estimater
 * ("om ~3 dage"). Måneds-vinduer er guidens datapunkt, og "fra"
 * signalerer allerede åbningen — en tilde oveni er estimat-støj.
 * Hvis alt er et estimat, ignorerer brugeren estimaterne.
 */
export function forventetHoest(
  plant: Plant,
  today: Date = new Date(),
): AfledtStatus | null {
  const qf = quickFactsFor(plant)
  const months = qf?.harvestMonths
  if (!months || months.length === 0) return null

  const nu = today.getMonth() + 1 // 1-12
  const first = Math.min(...months)
  const last = Math.max(...months)

  if (nu < first) {
    return { kind: 'info', text: `Høst fra ${MAANED_KORT[first - 1]}` }
  }
  if (nu <= last) {
    return months.includes(nu)
      ? { kind: 'attention', text: 'Høstsæson nu' }
      : { kind: 'info', text: `Høst fra ${MAANED_KORT[first - 1]}` }
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// F4: Frø-rækkevidde ("nok frø til ~7 sæsoner")
// ─────────────────────────────────────────────────────────────

/**
 * Hvor mange sæsoner rækker frøposen?
 *
 * Forbrugstempo = seedsSown i indeværende sæson (med kun én sæsons
 * historik er det den ærligste proxy; med flere sæsoner bliver det
 * et gennemsnit — samme funktion, bedre input).
 *
 *   rest/tempo ≥ 20:    "20+ sæsoner"        (kærligt: frøskuffer
 *                                             bliver fyldt — havefolk
 *                                             er optimistiske)
 *   rest/tempo ≥ 1.5:   "~7 sæsoner"          (info, tilde = beregnet)
 *   rest/tempo ≥ 1:     "sæsonen ud"          (info)
 *   rest/tempo < 1:     "tør denne sæson"     (attention)
 *
 * Returnerer null (stilhed) hvis der ingen forbrugsdata er —
 * en pose der aldrig er sået fra kan ikke have et tempo, og vi
 * gætter ikke.
 *
 * Teksten er VALUE-delen ("~7 sæsoner") så overflader selv kan
 * komponere: frøkortets fakta-celle bruger label "Rækker";
 * en sætnings-overflade kan skrive "Du har nok frø til ~7 sæsoner".
 */
export function froeRaekkevidde(item: {
  seedCount?: number | null
  seedsSown?: number
  seedsRemaining?: number
}): AfledtStatus | null {
  const remaining = item.seedsRemaining ?? item.seedCount
  const tempo = item.seedsSown
  if (remaining == null || !tempo || tempo <= 0) return null

  const seasons = remaining / tempo
  if (seasons >= 20) return { kind: 'info', text: '20+ sæsoner' }
  if (seasons >= 1.5) {
    return { kind: 'info', text: `~${Math.round(seasons)} sæsoner` }
  }
  if (seasons >= 1) return { kind: 'info', text: 'sæsonen ud' }
  return { kind: 'attention', text: 'tør denne sæson' }
}

// ─────────────────────────────────────────────────────────────
// Samlet statuslinje-picker til sort-kortet
// ─────────────────────────────────────────────────────────────

/**
 * Vælg den mest relevante afledte linje for en plante — eller null
 * hvis ingen afledning er mulig (kortet falder tilbage til den rå
 * status-label).
 *
 * Reglen pr. status:
 *   saaet                → spirings-afledning (det eneste der betyder
 *                          noget før der er spirer)
 *   spirer/i_vaekst/
 *   udplantet            → høstvindue (det fremadskuende svar på
 *                          "hvordan går det")
 *   klar_til_udplantning,
 *   hoestklar            → null — status-label'en ER allerede den
 *                          stærkeste besked; en afledning ville
 *                          udvande den
 */
export function afledtStatuslinje(plant: Plant): AfledtStatus | null {
  switch (plant.status) {
    case 'saaet':
      return forventetSpiring(plant)
    case 'spirer':
    case 'i_vaekst':
    case 'udplantet':
      return forventetHoest(plant)
    default:
      return null
  }
}

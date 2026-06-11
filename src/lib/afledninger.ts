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
    // Accent-normalisering (é→e, ñ→n): 'Café au Lait' og 'Jalapeño'
    // skal matche filnavne uden accenter. æøå håndteres FØR NFD,
    // da å ellers dekomponeres til 'a' i stedet for 'aa'.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
 * Forventet spiring for en sået plante — fire-trins-progression
 * (V1.2, Annas spec). Teksterne afspejler hvad systemet FAKTISK
 * ved: en forventning er en forventning, en passeret dato er et
 * spørgsmål. "Spirer nu" ville lyde som om systemet står og glor
 * ned i potten — det gør det ikke (endnu).
 *
 *   3+ dage tilbage:       "Spiring om ~4 dage"   (info, forventning)
 *   1-2 dage tilbage:      "Snart spiring"        (info, forventning)
 *   Forventet dato passeret
 *   (inde i vinduet):      "Er den spiret?"       (attention, verificering)
 *   Langt over tid
 *   (vinduet passeret):    "Tjek spiring"         (attention, anomali)
 *
 * Kort tekst er et krav, ikke et stilvalg: statuslinjen på sort-
 * kortet truncater, og det er netop de vigtige beskeder der skal
 * kunne læses.
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

  const tilbage = germ.min - dage
  if (tilbage >= 3) {
    return { kind: 'info', text: `Spiring om ~${tilbage} dage` }
  }
  if (tilbage >= 1) {
    return { kind: 'info', text: 'Snart spiring' }
  }
  if (dage <= germ.max) {
    return { kind: 'attention', text: 'Er den spiret?' }
  }
  return { kind: 'attention', text: 'Tjek spiring' }
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
// Mentor-linjen — én sætning der viser at der sidder en hjerne bag
// ─────────────────────────────────────────────────────────────

/**
 * Én sætning under Planter-heroen. Ingen knap, ingen CTA — bare et
 * tegn på at appen har kigget på planterne før brugeren gjorde.
 *
 * Grænsereglen overholdes: Planter taler TILSTAND ("3 planter er
 * klar til næste skridt"), aldrig bydeform (det er Kalenders job).
 *
 * Prioritet:
 *   1. Klar til næste skridt (høstklar + klar til udplantning)
 *   2. Spiring kan være sket (attention fra forventetSpiring)
 *   3. Alt gror roligt (stilhed-er-en-feature: positivt fravær
 *      af noget at gøre er OGSÅ en indsigt)
 *
 * Returnerer null hvis der ingen aktive planter er (sektionen har
 * sin egen empty-state).
 */
export function planterMentorLinje(plants: Plant[]): string | null {
  if (plants.length === 0) return null

  // Specificitet vinder (V2.3.1): "klar til udplantning" er
  // stærkere end "klar til næste skridt", fordi den fortæller
  // hvad næste skridt faktisk ER. Generisk formulering bruges
  // kun når statusserne er blandede.
  const hoest = plants.filter(p => p.status === 'hoestklar').length
  const udplant = plants.filter(p => p.status === 'klar_til_udplantning').length

  if (hoest > 0 && udplant > 0) {
    return `${hoest + udplant} planter er klar til næste skridt.`
  }
  if (udplant === 1) return 'Én plante er klar til udplantning.'
  if (udplant > 1) return `${udplant} planter er klar til udplantning.`
  if (hoest === 1) return 'Én plante er høstklar.'
  if (hoest > 1) return `${hoest} planter er høstklare.`

  const spiringTjek = plants.filter(
    p => p.status === 'saaet' && forventetSpiring(p)?.kind === 'attention',
  ).length
  if (spiringTjek === 1) return 'Én såning kan være spiret.'
  if (spiringTjek > 1) return `${spiringTjek} såninger kan være spiret.`

  return 'Alt gror roligt lige nu.'
}

/**
 * Kort opsummering til "I fokus"-headerens højre side.
 *
 * "6 i gang" sagde ingenting. Den mest presserende bucket siger
 * noget: "1 høstklar" / "2 klar til udplantning" / "1 bør tjekkes"
 * — og falder tilbage til "N i vækst" når intet presser.
 */
export function fokusOpsummering(plants: Plant[]): string {
  // V2.3.1: ental dropper tallet ("Høstklar" frem for "1 høstklar")
  // — teksten skal ikke konkurrere med sektionstitlen på mobil.
  // Flertal beholder tallet, for dér ER tallet informationen.
  const hoestklar = plants.filter(p => p.status === 'hoestklar').length
  if (hoestklar === 1) return 'Høstklar'
  if (hoestklar > 1) return `${hoestklar} høstklare`

  const klar = plants.filter(p => p.status === 'klar_til_udplantning').length
  if (klar === 1) return 'Klar til udplantning'
  if (klar > 1) return `${klar} klar til udplantning`

  const tjek = plants.filter(
    p => p.status === 'saaet' && forventetSpiring(p)?.kind === 'attention',
  ).length
  if (tjek === 1) return 'Bør tjekkes'
  if (tjek > 1) return `${tjek} bør tjekkes`

  return `${plants.length} i vækst`
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

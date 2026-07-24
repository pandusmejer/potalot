/**
 * Hero-foto-resolver for Havebog.
 *
 * Anna's visuelle regel (juni 2026):
 *
 *   Hero-fotoet må aldrig vælges ud fra planteart alene.
 *   Hero-fotoet skal først repræsentere den aktuelle MÅNED,
 *   derefter den aktuelle STEMNING i haven, og til sidst
 *   brugerens HISTORIK.
 *   Fotos skal føles som minder og observationer fra en
 *   virkelig have, ikke som katalogfotos af planter.
 *
 * Forskellen mellem Havebog og resten af appen:
 *   - Frøkort viser PLANTEN
 *   - Havebog viser ØJEBLIKKET
 *
 * Implementering: et eksplicit manifest pr. måned × bruger-state.
 * Når et asset findes for præcis den kombination, bruges det.
 * Ellers falder vi tilbage til den generiske heroes-maaneder/-pool
 * (samme pool som Kalender bruger), så heroen aldrig fejler.
 *
 * Tilføjelse af nye varianter er en data-only operation: drop et
 * billede ind under public/images/heroes-havebog/{maaned}/ og tilføj
 * en linje i HAVEBOG_HERO_MANIFEST nedenfor.
 *
 * Hvorfor manifest frem for fs.existsSync: vi rammer denne resolver
 * ved hver request på /, og manifest-lookup er O(1) uden disk-IO.
 * Det er en lille pris at betale i form af manuel registrering.
 */

export type HavebogUserState = 'new' | 'active' | 'year2plus'

const MAANED_SLUG = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

/**
 * Manifest af tilgængelige havebog-hero-fotos pr. måned × state.
 * Tilføj nye entries efterhånden som assets produceres.
 *
 * Konvention: filer placeres under
 *   public/images/heroes-havebog/{maaned-slug}/{filename}.jpg
 * og registreres i manifestet med stien fra public-roden.
 */
const HAVEBOG_HERO_MANIFEST: {
  [month: number]: Partial<Record<HavebogUserState, string>>
} = {
  // ── Januar (active — stilprøve for 11-måneders serien, jul 2026) ──
  // Rim på tørre frøstande i lav vintersol, drivhusglas anes. Ét foto
  // pr. måned = launch-scope; active dækker også new/year2plus via fallback.
  1: {
    active: '/images/heroes-havebog/januar/havebog-hero-januar-active.jpg',
  },
  // ── Februar (active) — vintergæk bryder gennem mørk jord, køligt lys ──
  2: {
    active: '/images/heroes-havebog/februar/havebog-hero-februar-active.jpg',
  },
  // ── Juni (komplet trippel pr. 11. juni 2026) ──────────────
  6: {
    // Ny bruger: valmue-eng med strå i modlys — mockup'ets foto.
    // Mørk top giver tekstplads; "noget man lagde mærke til".
    new: '/images/heroes-havebog/juni/havebog-hero-juni-ny.jpg',
    // Aktiv: stokroser i modlys ("sommer i haven", Annas valg).
    active: '/images/heroes-havebog/juni/havebog-hero-juni-bruger2.jpg',
    // År 2+: tæt valmueflor i gyldent aftenlys — nostalgisk,
    // "du har været her før".
    year2plus: '/images/heroes-havebog/juni/havebog-hero-juni-aar2.jpg',
  },
  // Andre måneder afventer egne fotos; falder tilbage til
  // heroes-maaneder/-poolen indtil de produceres.
}

/**
 * Vælg hero-foto til Havebog ud fra måned + bruger-state.
 *
 * @param month  1-12 (kalendermåned, ikke 0-baseret)
 * @param state  brugerens "modenhed" i Havebogen
 * @returns sti til foto, klar til background-image
 */
export function pickHavebogHero(
  month: number,
  state: HavebogUserState,
): string {
  const m = Math.max(1, Math.min(12, month))

  // Forsøg specifik variant
  const specific = HAVEBOG_HERO_MANIFEST[m]?.[state]
  if (specific) return specific

  // Forsøg fallback inden for samme måned — aktiv-variant er den
  // mest "neutrale" stemning og er ofte god nok hvis vi har den.
  const sameMonthActive = HAVEBOG_HERO_MANIFEST[m]?.active
  if (sameMonthActive) return sameMonthActive

  // Sidste fallback: brug kalenderens måneds-hero. Ikke perfekt
  // (det er katalogfoto, ikke minde-foto), men forhindrer at vi
  // viser broken-image på en måned der ikke er produceret endnu.
  return `/images/heroes-maaneder/hero-${MAANED_SLUG[m - 1]}-foto.png`
}

/**
 * Bestem bruger-state ud fra datalaget.
 *
 *   new:        ingen noter overhovedet
 *   year2plus:  har historik fra mindst ét tidligere år
 *   active:     ellers (typisk: indeværende år, noter findes)
 *
 * Anna's regel: heroen kobles til måned FØRST, derefter stemning,
 * og denne state er det vigtigste signal vi har om stemning.
 */
export function classifyHavebogUserState(args: {
  notesCount: number
  hasYearOnePlusHistory: boolean
}): HavebogUserState {
  if (args.hasYearOnePlusHistory) return 'year2plus'
  if (args.notesCount === 0) return 'new'
  return 'active'
}

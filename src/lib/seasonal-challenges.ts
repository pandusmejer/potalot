/**
 * Sæson-challenges — kuraterede event-katalog defineret i kode.
 *
 * Hver challenge har en stabil 'slug' der bruges som identifier på tværs
 * af år (fx 'tomatmaj' aktiveres hvert år i maj med ny seasonal_id).
 *
 * Når brugeren besøger /havelandskab kaldes ensureSeasonalChallengesForMonth
 * der inserter manglende rækker i challenges-tabellen via SECURITY DEFINER-RPC.
 *
 * Designprincip: Annas vision — rolige, hyggeligt prestigefulde, ikke
 * konkurrence-aggressive. Tonen er "deltag i sæsonens rytme", ikke "vind".
 */

export interface SeasonalChallengeTemplate {
  /** Stabil slug — bruges til at generere seasonal_id sammen med år. */
  slug: string
  /** Måned challengen aktiveres i (1-12). */
  month: number
  title: string
  description: string
  /** Hvad skal man indsende — tekst og/eller billede. */
  prompt: string
  /** Optjenelses-badge når man har bidraget (valgfri). */
  rewardBadgeId?: string
}

export const SEASONAL_CHALLENGES: SeasonalChallengeTemplate[] = [
  {
    slug: 'altankassen-vaagner',
    month: 4,
    title: 'Altankassen vågner',
    description: 'April er den måned hvor balkonen og altanen langsomt kommer i drift igen.',
    prompt: 'Del et billede af din altankasse eller balkonhave — gerne med planer for sæsonen.',
  },
  {
    slug: 'forspirings-marts',
    month: 3,
    title: 'Forspirings-marts',
    description: 'Få 5 sorter forspiret inden månedens udgang.',
    prompt: 'Vis dine forspiringer — billede + sort.',
  },
  {
    slug: 'tomatmaj',
    month: 5,
    title: 'Tomatmaj',
    description: 'Maj er tomat-måneden. Få dine tomatplanter ud i drivhus, krukker eller højbed.',
    prompt: 'Del en status på din(e) tomatplante(r) — billede + sort + placering.',
  },
  {
    slug: 'plant-for-bierne',
    month: 5,
    title: 'Plant for bierne',
    description: 'Sæt et felt eller en krukke af til vilde bestøvere i år.',
    prompt: 'Del hvad du har plantet eller planlægger at plante for bierne.',
  },
  {
    slug: 'foerste-tomat-i-hus',
    month: 7,
    title: 'Første tomat i hus',
    description: 'Sommerens første tomat. Den smager altid lidt af festdag.',
    prompt: 'Foto af dagens første modne tomat.',
  },
  {
    slug: 'snegle-saesonen',
    month: 7,
    title: 'Overlev sneglesæsonen',
    description: 'Juli er sneglenes festmåned. Hvilken strategi virker for dig?',
    prompt: 'Del din snegle-strategi — kobberkanter, øl-fælder, ænder, eller bare resignation.',
  },
  {
    slug: 'hoest-uge',
    month: 8,
    title: 'Høst fra egen have 7 dage i træk',
    description: 'Plant noget — spis noget. I 7 dage.',
    prompt: 'Del et eller flere billeder af måltider med ingredienser fra haven.',
  },
  {
    slug: 'efteraarsklargoering',
    month: 10,
    title: 'Efterårsklargøring',
    description: 'Rydning af bede, tækning af skrøbelige, bevaring af frø.',
    prompt: 'Del et billede af din have inden eller efter klargøring.',
  },
  {
    slug: 'froesamler',
    month: 9,
    title: 'Frø til næste år',
    description: 'Sensommer er frøtid. Gem en sort fra egen have til 2027.',
    prompt: 'Vis hvilke frø du har samlet og hvor de kommer fra.',
  },
  {
    slug: 'vinterhvile',
    month: 1,
    title: 'Vinterhvile',
    description: 'Januar er stille. Hvad drømmer du om for den kommende sæson?',
    prompt: 'Skriv et par sætninger om hvad du vil prøve i 2026.',
  },
]

/**
 * Find aktive challenges for en given måned. Et challenge kan have flere
 * måneder hvor det 'overlap' — her tager vi det enkleste: month-match.
 */
export function challengesForMonth(month: number): SeasonalChallengeTemplate[] {
  return SEASONAL_CHALLENGES.filter(c => c.month === month)
}

/**
 * Beregn seasonal_id (DB-nøgle) for en challenge + år: 'tomatmaj-2026'.
 */
export function seasonalIdFor(slug: string, year: number): string {
  return `${slug}-${year}`
}

/**
 * Hvornår starter/slutter en sæson-challenge i et givent år?
 * Default: hele måneden (1. til sidste dag).
 */
export function challengeDateRange(month: number, year: number): { startsAt: string; endsAt: string } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  // Sidste dag i måneden, kl 23:59:59 UTC
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59))
  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  }
}

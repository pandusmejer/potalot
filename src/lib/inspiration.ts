/**
 * Inspirations-motoren (V12) — "Inspirér mig" som motor, ikke knap.
 *
 * Læser de sorter brugeren faktisk dyrker (frøbank + planter) og
 * producerer editorial sætninger om DERES egen have, i "I dag i
 * haven"-stemmen. På fladen ser dyrkeren ikke en feature — kun liv:
 *
 *   "Du dyrker Corno di Toro Rosso. Mange kombinerer den med
 *    basilikum og aubergine — en lille middelhavshave i bedet."
 *
 * Sætningerne væves ind i Kapitel 1's daglige rotation, så Havebogen
 * altid har noget at sige om netop denne have.
 *
 * STEMME + ÆRLIGHED (havebog.md V12): almen, sand hortikultur —
 * makkerplanter, sæsonforlængelse, teknik. Ingen fabrikerede tal,
 * ingen påstand om noget systemet ikke ved. Ingen døde links: en
 * sætning står alene, indtil en rigtig destination findes.
 */

export interface DyrketSort {
  name: string
  variety: string | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Kombinations-viden, keyed på sorts-slug (foretrukket) eller arts-
 * slug (fallback). Holdt kort og sand — hver linje er noget en
 * erfaren dyrker faktisk ville sige. Udvides efterhånden som flere
 * sorter får kurateret viden.
 */
const KOMBINATIONER: Record<string, string> = {
  // ── Sorts-niveau ──────────────────────────────────────────
  'corno-di-toro-rosso':
    'Du dyrker Corno di Toro Rosso. Mange kombinerer den med basilikum og aubergine — en lille middelhavshave i bedet.',
  'corno-di-toro-giallo':
    'Du dyrker Corno di Toro Giallo. Den gør sig smukt sammen med den røde Corno — to farver fra samme slægt.',
  'korona':
    'Du dyrker Korona-jordbær. Malwina forlænger jordbærsæsonen flere uger, hvis du planter begge.',
  'san-marzano':
    'San Marzano bliver bedst med basilikum ved foden — en klassisk makker, og en god grund til at så lidt ekstra.',
  'green-zebra':
    'Green Zebra modnes grøn — den er moden, når den giver efter for et let tryk, ikke når farven skifter.',

  // ── Arts-niveau (fallback når sorten ikke har egen linje) ──
  'basilikum':
    'Basilikum holder længere, hvis du kniber toppene, før den når at blomstre — og den trives ved siden af tomater.',
  'dahlia':
    'Dine dahliaknolde kan graves op efter første frost og gemmes frostfrit til næste år.',
  'agurk':
    'Agurker klatrer gerne — et net eller en snor giver renere frugter og mere plads i bedet.',
  'chili':
    'Chili modner langsomt; et lunt, lyst sted strækker høsten langt ind i efteråret.',
  'graeskar':
    'Græskar fylder mere, end man tror — giv dem god plads, eller lad dem klatre op ad et solidt stativ.',
  'solsikke':
    'Solsikker vender hovedet mod solen om dagen — og bierne finder dem uanset hvad.',
  'salat':
    'Sås salat lidt ad gangen med et par ugers mellemrum, har du sprøde hoveder hele sæsonen.',
  'zinnia':
    'Jo mere du plukker zinnia til vasen, jo flere blomster sætter den — den vil gerne skæres.',
}

/** Rodfrugt-arter — til frøbank-hullet "ingen rodfrugter endnu". */
const RODFRUGTER = new Set([
  'gulerod', 'roedbede', 'radise', 'pastinak', 'persillerod',
  'knoldselleri', 'jordskok', 'rodpetersille',
])

/**
 * Producér inspirations-sætninger for de dyrkede sorter.
 * Returnerer unikke linjer (sorts-match før arts-match), plus
 * højst ét frøbank-hul. Rækkefølgen er stabil; rotationen i
 * Kapitel 1 sørger for daglig variation.
 */
export function inspirationsSaetninger(sorter: DyrketSort[]): string[] {
  const ud: string[] = []
  const set = new Set<string>()
  const arterTilstede = new Set<string>()

  for (const s of sorter) {
    const artSlug = slugify(s.name)
    arterTilstede.add(artSlug)
    const varietySlug = s.variety ? slugify(s.variety) : null
    const linje =
      (varietySlug && KOMBINATIONER[varietySlug]) || KOMBINATIONER[artSlug]
    if (linje && !set.has(linje)) {
      set.add(linje)
      ud.push(linje)
    }
  }

  // Frøbank-hul: ingen rodfrugter endnu (kun hvis brugeren faktisk
  // dyrker noget — ellers er det ikke et "hul", bare en tom start).
  if (sorter.length > 0 && ![...arterTilstede].some(a => RODFRUGTER.has(a))) {
    ud.push(
      'Du har endnu ingen rodfrugter. Mange får overraskende gode resultater med rødbeder som den første.',
    )
  }

  return ud
}

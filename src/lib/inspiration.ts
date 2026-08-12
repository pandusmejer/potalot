/**
 * Inspirations-motoren (V12, eksploderet V14) — "Inspirér mig" som
 * intelligens, ikke knap.
 *
 * Læser de sorter brugeren faktisk dyrker (frøbank + planter) og
 * producerer to-takts indsigter om DERES egen have — observation +
 * udbytte — i "I dag i haven"-stemmen:
 *
 *   "Du dyrker Korona. Hvis du tilføjer Malwina, kan du høste
 *    jordbær næsten en måned længere."
 *
 * Her bliver Havebogen KLOG. Tre slags indsigt:
 *   1. Kombination/teknik pr. sort  (KOMBINATIONER)
 *   2. Hul-med-begrundelse          (gapIndsigter: art-type mangler)
 *
 * Sætningerne væves ind i Kapitel 1's daglige rotation.
 *
 * ÆRLIGHED (havebog.md V12): almen, sand hortikultur. Ingen
 * fabrikerede tal, ingen påstand om noget systemet ikke kan vide
 * (fx blomstringsmåneder, som vi ikke har data for). Ingen døde
 * links. Huller formuleres hjælpsomt, aldrig dømmende.
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
 * To-takts viden, keyed på sorts-slug (foretrukket) eller arts-slug
 * (fallback). Hver linje er en observation + et udbytte — noget en
 * erfaren dyrker faktisk ville sige. Udvides løbende.
 */
const KOMBINATIONER: Record<string, string> = {
  // ── Tomat ─────────────────────────────────────────────────
  'san-marzano':
    'Du dyrker San Marzano. Den blev avlet til sauce — kødfuld og næsten uden kerner, bedst når den får lov at modne helt.',
  'sungold':
    'Du dyrker Sungold. Den revner let efter regn, så pluk den, så snart den er dybt orange.',
  'gardeners-delight':
    'Du dyrker Gardeners Delight. Den sætter klaser hele sæsonen, hvis du nipper sideskuddene løbende.',
  'black-cherry':
    'Du dyrker Black Cherry. De mørkeste frugter er de sødeste — vent til de næsten er purpur.',
  'green-zebra':
    'Du dyrker Green Zebra. Den modnes grøn; den er klar, når den giver efter for et let tryk, ikke når farven skifter.',

  // ── Peberfrugt ────────────────────────────────────────────
  'corno-di-toro-rosso':
    'Du dyrker Corno di Toro Rosso. Mange dyrker den sammen med aubergine og basilikum — en lille middelhavshave i bedet.',
  'corno-di-toro-giallo':
    'Du dyrker Corno di Toro Giallo. Den bliver sødere, jo længere den får lov at hænge og modne til gul.',
  'california-wonder':
    'Du dyrker California Wonder. Lader du de grønne frugter modne til røde, fordobler du både sødme og C-vitamin.',

  // ── Chili ─────────────────────────────────────────────────
  'habanero-orange':
    'Du dyrker Habanero. Den er blandt de sidste til at modne — giv den varme helt ind i september.',
  'jalapeno-groen':
    'Du dyrker Jalapeño. Lader du frugterne modne fra grønne til røde, bliver smagen sødere og mere moden.',
  'lemon-drop':
    'Du dyrker Lemon Drop. Den citrusagtige chili tørrer fint — så har du varme hele vinteren.',
  'chili':
    'Chili modner langsomt; et lunt, lyst sted strækker høsten langt ind i efteråret.',

  // ── Jordbær ───────────────────────────────────────────────
  'korona':
    'Du dyrker Korona. Hvis du tilføjer Malwina, kan du høste jordbær næsten en måned længere.',
  'polka':
    'Du dyrker Polka. Den bærer i bølger hele sommeren — pluk ofte, så sætter den nye blomster.',

  // ── Bladgrønt + kål ───────────────────────────────────────
  'crispy-mint':
    'Du dyrker Crispy Mint. Sås den lidt ad gangen med to ugers mellemrum, har du sprøde hjerter hele sommeren.',
  'little-gem':
    'Du dyrker Little Gem. De små hoveder er klar hurtigt — perfekt at så mellem langsommere afgrøder.',
  'matador':
    'Du dyrker Matador-spinat. Den går hurtigt i stok i varmen — den trives bedst i forår og efterår.',
  'red-russian':
    'Du dyrker Red Russian. Grønkål bliver sødere efter den første nattefrost — lad den stå.',
  'rucola':
    'Rucola bliver skarpere, jo varmere det bliver — høst de unge blade til den mildeste smag.',

  // ── Rod + knold ───────────────────────────────────────────
  'hokkaido':
    'Du dyrker Hokkaido. Skrællen kan spises bagt — og græskarret holder måneder i et køligt rum.',

  // ── Bælg + ranker ─────────────────────────────────────────
  'sugar-snap':
    'Du dyrker Sugar Snap. Den skal have noget at klatre op ad — og smager bedst spist rå i bedet.',
  'cobra':
    'Du dyrker Cobra. Jo flere bønner du plukker, jo flere sætter den — lad dem aldrig blive for store.',
  'agurk':
    'Agurker klatrer gerne — et net giver renere frugter og mere plads i bedet.',
  'squash':
    'Squash sætter mange frugter på én gang — pluk dem små og ofte, ellers stopper planten.',
  'majs':
    'Majs bestøves af vinden — den trives bedst i en firkant frem for en enkelt række.',
  'radise':
    'Radiser er klar på en måned — perfekt at så mellem de afgrøder, der tager hele sæsonen.',

  // ── Krydderurter ──────────────────────────────────────────
  'basilikum':
    'Basilikum holder længere, hvis du kniber toppene før blomst — og den trives ved siden af tomater.',
  'dild':
    'Sår du dild et par gange hen over sommeren, har du frisk dild til alle agurkerne.',
  'hvidloeg':
    'Hvidløg sættes om efteråret og høstes til sommer — et af de få, der arbejder, mens du venter på foråret.',

  // ── Blomster ──────────────────────────────────────────────
  'cafe-au-lait':
    'Du dyrker Café au Lait. Jo mere du skærer til buket, jo flere blomster sætter den.',
  'dahlia':
    'Dine dahliaknolde kan graves op efter første frost og gemmes frostfrit til næste år.',
  'zinnia':
    'Jo mere du plukker zinnia til vasen, jo flere blomster sætter den — den vil gerne skæres.',
  'cosmos':
    'Cosmos blomstrer villigst i mager jord — for meget næring giver blade i stedet for blomster.',
  'solsikke':
    'Solsikker vender hovedet mod solen om dagen — og bierne finder dem uanset hvad.',
}

/**
 * Art → grov type, til huller-med-begrundelse. Kun arter vi faktisk
 * kan klassificere ærligt; ukendte arter ignoreres.
 */
const ARTSTYPE: Record<string, 'rodfrugt' | 'krydderurt' | 'blomst' | 'spiseligt'> = {
  // rodfrugter
  gulerod: 'rodfrugt', roedbede: 'rodfrugt', radise: 'rodfrugt',
  pastinak: 'rodfrugt', persillerod: 'rodfrugt', knoldselleri: 'rodfrugt',
  jordskok: 'rodfrugt',
  // krydderurter
  basilikum: 'krydderurt', dild: 'krydderurt', persille: 'krydderurt',
  timian: 'krydderurt', rosmarin: 'krydderurt', mynte: 'krydderurt',
  koriander: 'krydderurt', oregano: 'krydderurt',
  // blomster
  dahlia: 'blomst', zinnia: 'blomst', cosmos: 'blomst', solsikke: 'blomst',
  stokrose: 'blomst', valmue: 'blomst', morgenfrue: 'blomst', tagetes: 'blomst',
  // spiseligt nytte-grønt (til "ren nytte"-hullet)
  tomat: 'spiseligt', peberfrugt: 'spiseligt', chili: 'spiseligt',
  agurk: 'spiseligt', squash: 'spiseligt', graeskar: 'spiseligt',
  majs: 'spiseligt', salat: 'spiseligt', spinat: 'spiseligt',
  groenkaal: 'spiseligt', sukkeraert: 'spiseligt', stangboenne: 'spiseligt',
  jordbaer: 'spiseligt', hvidloeg: 'spiseligt', rucola: 'spiseligt',
}

/**
 * Hul-med-begrundelse: højst ÉT, valgt efter relevans. Kun når
 * brugeren faktisk dyrker noget (ellers er det ikke et hul, bare
 * en tom start). Altid hjælpsomt, aldrig dømmende.
 */
function gapIndsigt(typer: Set<string>): string | null {
  if (!typer.has('rodfrugt')) {
    return 'Du har endnu ingen rodfrugter i dyrkning.'
  }
  if (!typer.has('krydderurt')) {
    return 'Du dyrker ingen krydderurter endnu. Basilikum og dild er svære at undvære, når køkkenet kalder.'
  }
  // Ren nytte-have uden en eneste blomst → bestøver-invitation
  if (!typer.has('blomst') && typer.has('spiseligt')) {
    return 'Din have er ren nytte. Et bånd af tagetes mellem grøntsagerne giver farve og blomster til bestøverne.'
  }
  return null
}

/**
 * Producér inspirations-sætninger for de dyrkede sorter.
 * Kombinations-linjer (sorts-match før arts-match, unikke) + højst
 * ét hul. Rækkefølgen er stabil; rotationen i Kapitel 1 sørger for
 * daglig variation.
 */
export function inspirationsSaetninger(sorter: DyrketSort[]): string[] {
  const ud: string[] = []
  const set = new Set<string>()
  const typer = new Set<string>()

  for (const s of sorter) {
    const artSlug = slugify(s.name)
    const varietySlug = s.variety ? slugify(s.variety) : null
    const type = ARTSTYPE[artSlug]
    if (type) typer.add(type)

    const linje =
      (varietySlug && KOMBINATIONER[varietySlug]) || KOMBINATIONER[artSlug]
    if (linje && !set.has(linje)) {
      set.add(linje)
      ud.push(linje)
    }
  }

  if (sorter.length > 0) {
    const hul = gapIndsigt(typer)
    if (hul) ud.push(hul)
  }

  return ud
}

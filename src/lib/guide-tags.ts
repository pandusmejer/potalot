/**
 * Guide-tags: fra intern søgenøgle til brugerrettet label.
 *
 * Tags er Potalots interne søgevokabular. Nøglerne er kanoniske
 * identifikatorer — ASCII-translitteration (`varmekraevende`) er IKKE en
 * datafejl, og formatteren muterer aldrig tagværdien. Fejlen er, at UI'et
 * har vist nøglen råt.
 *
 * Vokabularet er ÅBENT og delvist AI-genereret (419 tags i unionen af repo
 * og live DB pr. 2/9 2026, og der kommer flere). Formatteren må derfor
 * aldrig afhænge af en komplet label-tabel.
 *
 * ANNA-LÅST lagdeling (Docs/content/potalot-terminologi.md, 2/9 2026):
 *
 *   Lag 1 — verificeret label. Kendt nøgle → eksplicit dansk label.
 *           Det er HER æ/ø/å genskabes, fordi et menneske har set på ordet.
 *   Lag 2 — sikker typografisk fallback. KUN versalisering. Ingen
 *           bogstavsubstitution (ae→æ/oe→ø/aa→å er aldrig mekanisk sikkert;
 *           dansk har ægte ae/oe/aa i låneord), ingen ordopdeling, ingen
 *           semantisk fortolkning.
 *   Lag 3 — usikker struktur. Bindestreg, mellemrum, versaler, cifre eller
 *           anden struktur der kræver fortolkning → ingen label.
 *           Tagget vises ikke; en søgenøgle vi ikke kan præsentere
 *           forsvarligt, præsenterer vi ikke.
 *
 * Alt der ikke rammer lag 1 registreres til redaktionel oprydning — også
 * lag 2. Lag 2 garanterer typografisk sikkerhed, ikke redaktionel kvalitet:
 * `sommerkrudt` er stadig sommerkrudt, bare med stort begyndelsesbogstav.
 *
 * Formatteren er ikke en synonymmotor. Dubletter i vokabularet
 * (`snitblomst`/`snittablomst`/`snittblomst`) er en separat data-oprydning.
 */

export type TagLag = 1 | 2 | 3

export interface TagVisning {
  /** Den uændrede interne nøgle. Data ændres aldrig. */
  noegle: string
  /** Brugerrettet label — `null` på lag 3, hvor tagget ikke må vises. */
  label: string | null
  lag: TagLag
}

/**
 * Lag 1 — verificerede labels.
 *
 * Indeholder de nøgler hvor den rene versalisering ikke er nok: ASCII-
 * translitteration der skal have æ/ø/å tilbage, sammensatte nøgler med
 * bindestreg/mellemrum, latinske navne og sortsnavne.
 *
 * Tabellen er BEVIDST ikke komplet — nye tags skal kunne lande uden
 * kodeændring. Rene danske ord (`grundstamme`, `drivhus`) står her ikke;
 * de klares af lag 2.
 */
export const GUIDE_TAG_LABELS: Readonly<Record<string, string>> = {
  // — ASCII-translitteration → æ/ø/å (verificeret ord for ord) —
  aabenbestoevet: 'Åbenbestøvet',
  aert: 'Ært',
  afskaering: 'Afskæring',
  baelg: 'Bælg',
  baelgplante: 'Bælgplante',
  baer: 'Bær',
  beskaering: 'Beskæring',
  bestoevning: 'Bestøvning',
  bladgroentsag: 'Bladgrøntsag',
  bladhoest: 'Bladhøst',
  bladkaal: 'Bladkål',
  blomsterstoette: 'Blomsterstøtte',
  boeftomat: 'Bøftomat',
  boennestativ: 'Bønnestativ',
  bunddaekke: 'Bunddække',
  buskboenne: 'Buskbønne',
  efteraar: 'Efterår',
  efteraarsafgroede: 'Efterårsafgrøde',
  efteraarsblomstring: 'Efterårsblomstring',
  efteraarsfarve: 'Efterårsfarve',
  efteraarsplantning: 'Efterårsplantning',
  etaarig: 'Etårig',
  fleraarig: 'Flerårig',
  foraarshoest: 'Forårshøst',
  foraarsloeg: 'Forårsløg',
  frugtgroentsag: 'Frugtgrøntsag',
  frugttrae: 'Frugttræ',
  frugtvaegt: 'Frugtvægt',
  graeskar: 'Græskar',
  grenstoette: 'Grenstøtte',
  groen: 'Grøn',
  groentsag: 'Grøntsag',
  haardfoer: 'Hårdfør',
  haek: 'Hæk',
  hoej: 'Høj',
  hovedkaal: 'Hovedkål',
  jordbaer: 'Jordbær',
  kaal: 'Kål',
  kaalfamilie: 'Kålfamilie',
  kepaloeg: 'Kepaløg',
  klatreboenne: 'Klatrebønne',
  knoldgroentsag: 'Knoldgrøntsag',
  koedfuld: 'Kødfuld',
  koekkenhave: 'Køkkenhave',
  laeggekartoffel: 'Læggekartoffel',
  lagerafgroede: 'Lagerafgrøde',
  lagerkaal: 'Lagerkål',
  loeg: 'Løg',
  loegfamilie: 'Løgfamilie',
  marvaert: 'Marvært',
  middelstaerk: 'Middelstærk',
  moerk: 'Mørk',
  moerkeroed: 'Mørkerød',
  naturpraeget: 'Naturpræget',
  palmekaal: 'Palmekål',
  plantestoette: 'Plantestøtte',
  praeriebed: 'Præriebed',
  prydgraes: 'Prydgræs',
  prydloeg: 'Prydløg',
  ringstoette: 'Ringstøtte',
  rodafgroede: 'Rodafgrøde',
  rodgroentsag: 'Rodgrøntsag',
  roed: 'Rød',
  roedgroen: 'Rødgrøn',
  roedkaal: 'Rødkål',
  roedlilla: 'Rødlilla',
  saaning: 'Såning',
  saedskifte: 'Sædskifte',
  saetteloeg: 'Sætteløg',
  skovjordbaersmag: 'Skovjordbærsmag',
  smaaplanter: 'Småplanter',
  smoersalat: 'Smørsalat',
  soed: 'Sød',
  sommerafgroede: 'Sommerafgrøde',
  sommerbaerende: 'Sommerbærende',
  sommerbeskaering: 'Sommerbeskæring',
  sortkaal: 'Sortkål',
  spidskaal: 'Spidskål',
  sproed: 'Sprød',
  staerk: 'Stærk',
  stangboenne: 'Stangbønne',
  stedsegroen: 'Stedsegrøn',
  stokloebning: 'Stokløbning',
  successionssaaning: 'Successionssåning',
  sukkeraert: 'Sukkerært',
  sukkerforstaerket: 'Sukkerforstærket',
  toaarig: 'Toårig',
  toerketalende: 'Tørketålende',
  toerketolerant: 'Tørketolerant',
  toerring: 'Tørring',
  tykvaegget: 'Tykvægget',
  udloebere: 'Udløbere',
  vandkraevende: 'Vandkrævende',
  varmekraevende: 'Varmekrævende',
  vindbestoevet: 'Vindbestøvet',
  vinterafgroede: 'Vinterafgrøde',
  vintergroen: 'Vintergrøn',
  vintergroentsag: 'Vintergrøntsag',
  vinterhoest: 'Vinterhøst',

  // — Nøgler hvor et bogstav mangler i selve nøglen. Labelen viser ordet
  //   rigtigt; nøglen bliver stående (se rapporten i scripts/tags-rapport.ts).
  bestoeversplante: 'Bestøverplante',
  forarsblomstring: 'Forårsblomstring',
  fro: 'Frø',
  frohoest: 'Frøhøst',
  saasonafgroede: 'Sæsonafgrøde',

  // — Sammensatte nøgler (bindestreg/mellemrum) —
  'cut-and-come-again': 'Cut and come again',
  'dekorativ-dahlia': 'Dekorativ dahlia',
  'direkte såning': 'Direkte såning',
  'direkte-saaning': 'Direkte såning',
  'egne erfaringer': 'Egne erfaringer',
  'f1-hybrid': 'F1-hybrid',
  'flad-baelg': 'Flad bælg',
  'fra-froe': 'Fra frø',
  'frisk-brug': 'Frisk brug',
  'fugtig-jord': 'Fugtig jord',
  'fugtigt jord': 'Fugtigt jord',
  'fyldig-smag': 'Fyldig smag',
  'groen-hoest': 'Grøn høst',
  'gul-blomst': 'Gul blomst',
  'hurtig-hoest': 'Hurtig høst',
  'hurtig-vaekst': 'Hurtig vækst',
  'hvid-blomst': 'Hvid blomst',
  'høj afgrøde': 'Høj afgrøde',
  'klassisk-haveplante': 'Klassisk haveplante',
  'koelig-saeson': 'Kølig sæson',
  'koelig-spiring': 'Kølig spiring',
  'kraftig-vaekst': 'Kraftig vækst',
  'lang-blomstring': 'Lang blomstring',
  'lang-saeson': 'Lang sæson',
  'langsom-spiring': 'Langsom spiring',
  'langsomt voksende': 'Langsomt voksende',
  'lille-trae': 'Lille træ',
  'lodret-dyrkning': 'Lodret dyrkning',
  'loebende-hoest': 'Løbende høst',
  'loebende-saaning': 'Løbende såning',
  'lun-placering': 'Lun placering',
  'løbende høst': 'Løbende høst',
  'meget-staerk': 'Meget stærk',
  'mild-smag': 'Mild smag',
  'min tilpasning': 'Min tilpasning',
  'opret-vaekst': 'Opret vækst',
  'orange-blomst': 'Orange blomst',
  'permanent-bed': 'Permanent bed',
  'roed-hvid': 'Rød-hvid',
  'slow-bolting': 'Slow bolting',
  'sol-eller-halvskygge': 'Sol eller halvskygge',
  'spiselig-baelg': 'Spiselig bælg',
  'store-loeg': 'Store løg',
  'søde frugter': 'Søde frugter',
  'tidlig-blomstring': 'Tidlig blomstring',
  'tidlig-hoest': 'Tidlig høst',
  'tidlig-vaekst': 'Tidlig vækst',
  'toer-skygge': 'Tør skygge',
  'tysk sort': 'Tysk sort',
  'varm-saeson': 'Varm sæson',
  'varmt sted': 'Varmt sted',
  'veldraenet-jord': 'Veldrænet jord',
  'vitamin C': 'Vitamin C',

  // — Botaniske navne og sortsnavne —
  'capsicum-annuum': 'Capsicum annuum',
  'capsicum-chinense': 'Capsicum chinense',
  'french-breakfast': 'French Breakfast',
  'mara-des-bois': 'Mara des Bois',
  'mini-stars': 'Mini Stars',
}

/** Lag 2 accepterer kun rene små danske bogstaver. Alt andet er struktur. */
const KUN_SMAA_BOGSTAVER = /^[a-zæøå]+$/

/**
 * Registret over tags der ikke ramte lag 1. Bruges til redaktionel
 * oprydning — både af `scripts/tags-rapport.ts` (statisk, hele
 * vokabularet) og i runtime, hvor et ukendt tag fra live DB kan dukke op
 * uden at nogen har set det i repoet.
 */
const tilOprydning = new Map<string, TagLag>()

/** Læs registret (til rapport/diagnostik). Muterer ikke. */
export function tagsTilOprydning(): Array<{ noegle: string; lag: TagLag }> {
  return [...tilOprydning].map(([noegle, lag]) => ({ noegle, lag })).sort((a, b) => a.lag - b.lag || a.noegle.localeCompare(b.noegle, 'da'))
}

/** Nulstil registret (kun til test). */
export function nulstilTagRegister(): void {
  tilOprydning.clear()
}

function noter(noegle: string, lag: TagLag): void {
  if (tilOprydning.has(noegle)) return
  tilOprydning.set(noegle, lag)
  // Lag 3 råbes op med det samme: der forsvinder et tag for brugeren lige nu.
  // Lag 2 registreres altid, men støjer kun når nogen beder om det
  // (POTALOT_TAG_LOG=1) — ellers drukner en dev-server i 250 linjer.
  // Den fulde liste hentes med `npm run tags:rapport` eller tagsTilOprydning().
  const raab = lag === 3 || process.env.POTALOT_TAG_LOG === '1'
  if (raab && process.env.NODE_ENV !== 'production') {
    console.info(`[guide-tags] lag ${lag} — mangler verificeret label: "${noegle}"`)
  }
}

/**
 * Oversæt én tagnøgle til dens visningsform.
 *
 * Returnerer altid nøglen uændret i `noegle` — formatteren skriver aldrig
 * tilbage i data.
 */
export function formatGuideTag(tag: string): TagVisning {
  const noegle = tag
  const opslag = tag.trim()

  const kendt = GUIDE_TAG_LABELS[opslag]
  if (kendt) return { noegle, label: kendt, lag: 1 }

  if (KUN_SMAA_BOGSTAVER.test(opslag)) {
    noter(opslag, 2)
    return { noegle, label: opslag.charAt(0).toUpperCase() + opslag.slice(1), lag: 2 }
  }

  noter(opslag, 3)
  return { noegle, label: null, lag: 3 }
}

/**
 * Visningsklare labels for en tagliste. Lag 3-tags falder bort — de er
 * registreret til oprydning, ikke vist. Rækkefølgen bevares.
 */
export function guideTagLabels(tags: readonly string[]): string[] {
  const set = new Set<string>()
  const ud: string[] = []
  for (const t of tags) {
    const { label } = formatGuideTag(t)
    if (!label || set.has(label)) continue
    set.add(label)
    ud.push(label)
  }
  return ud
}

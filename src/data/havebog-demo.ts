/**
 * Lokal demo-data til Havebog.
 *
 * KUN brugt af Havebog-flowet (src/app/(app)/page.tsx + komponenter
 * under src/components/havebog/). Ikke en global app-demo-mekanisme.
 *
 * Følger samme mønster som:
 *   - DEMO_PLANTS i din-dyrkning.tsx (Kalender)
 *   - DEMO_INVENTORY i lib/demo-inventory.ts (Frøbank)
 *   - mock-plants.ts i data/ (Planter)
 *
 * Bruges når der ikke er nogen logget-ind bruger (demo-mode).
 * Logget-ind brugere ser deres egen historie via actions/havebog.ts.
 */

export interface HeroStats {
  notes: number
  varieties: number
  harvests: number
}

export type LogType = 'note' | 'observation' | 'reminder' | 'harvest'

export interface OnThisDayEntry {
  yearsAgo: number
  plantName: string
  variety?: string
  text: string
  imageUrl?: string | null
  /** Kilde + destination — "På denne dag" skal ALTID kunne åbne mindet.
   *  Uden href/kilde skjules modulet for rigtige brugere (produktregel). */
  href?: string | null
  sourceType?: 'plant' | 'memory' | 'archive'
  sourceId?: string | null
}

export interface RecentNote {
  type: LogType
  plantName: string
  variety?: string
  text: string
  date: string
}

export interface HistoryMonth {
  monthIdx: number
  monthName: string
  noteCount: number
  imageCount: number
  varietyCount: number
  imageUrls: string[]
}

export interface HistoryYear {
  year: number
  months: HistoryMonth[]
}

export interface SaesonFactHoest {
  plantName: string
  variety?: string
  date: string
  text?: string
}

export interface SaesonFactNote {
  plantName: string
  variety?: string
  date: string
  text: string
  type: LogType
}

export interface SaesonFactBillede {
  plantName: string
  variety?: string
  date: string
  imageUrl: string
}

export interface DenneSaesonFacts {
  senesteHoest: SaesonFactHoest | null
  senesteNote: SaesonFactNote | null
  senesteBillede: SaesonFactBillede | null
}

export interface ArchivedPlant {
  id: string
  name: string
  variety: string | null
  primaryImageId: string | null
  archivedYear: number
  summary?: string
}

/**
 * Editorial tidslinje under hero — én rolig "du er her"-sætning.
 *
 * Renderes som: "Søndag d. 7. juni · 12 dage siden du satte agurkerne ud · 3 noter fra denne uge"
 *
 * BEVIDST IKKE et dashboard. Ingen CTA, ingen actions, ingen
 * "gør nu". Bare tidsorientering: hvor er jeg i året, hvad gjorde
 * jeg sidst der havde substans, og hvor aktiv har min uge været.
 *
 * Rolle-grænse: Havebog viser hvad der sker i brugerens have over
 * tid. Kalender svarer på hvad brugeren skal gøre i haven lige nu.
 * Tidslinjen orienterer — den dirigerer ikke.
 *
 * Hver del kan være null og bliver bare ladt ud; sætningen graceful-
 * downgrader fra fuld erfaren bruger til helt ny bruger (kun dato).
 */
export interface Tidslinje {
  /** Lokaliseret dato, beregnet server-side — fx "Søndag d. 7. juni" */
  dateText: string
  /** "12 dage siden du satte agurkerne ud" — null hvis ingen milestone fundet */
  milestoneText: string | null
  /** Antal noter logget de seneste 7 dage — 0 hvis ingen */
  weekNoteCount: number
}

/**
 * Hero-fortællingen — heroen som FORTÆLLER, ikke overskrift.
 *
 * V2 (juni 2026): Anna's diagnose efter screenshots. Den tidligere
 * tagline + stats-linje var administrativ, ikke fortællende. Heroens
 * rolle er at give brugeren et svar på "hvor er jeg i sæsonen og
 * hvad sker der lige nu", FØR de møder noter, minder og historik.
 *
 * Tre lag, alle valgfri (kun titel er garanteret):
 *
 *   Lag 1 (h1):      "Din Havebog"                — uændret
 *   Lag 2 (eyebrow): "Din første sæson"            — sæsonlinje, Cormorant italic
 *   Lag 3 (narrative): ["Du dyrker 8 sorter i år.",
 *                       "Om lidt begynder de første minder at samle sig her."]
 *                                                  — 1-3 personlige linjer
 *
 * Genereres server-side ud fra bruger-state:
 *   - Ny bruger (notes=0):    "Din første sæson" + invitation
 *   - Lidt data (notes>0):    "Juni i haven" + milestones fra denne uge
 *   - År 1+ (har historik):   "Velkommen tilbage til juni" + På-denne-tid-sidste-år
 *
 * Heroen kan derved bære den tomhed brugeren ellers ville møde
 * gentaget på 5 sektioner længere nede. Hvis heroen siger "Din
 * første sæson er begyndt", giver det mening at Historik er tom.
 *
 * Stats-linjen er nu skjult som default — den var "0 noter · 8
 * sorter · 0 høster" i Anna's case, hvilket er præcis det
 * administrative sprog der ikke hører hjemme på første viewport.
 * Den vises stadig hvis erfaren bruger har meningsfulde tal
 * (notes > 0 OG harvests > 0).
 */
export interface HeroNarrative {
  /** Sæsonlinje — fx "Din første sæson", "Juni i haven", "Velkommen tilbage til juni" */
  seasonLine: string
  /** 1-3 personlige narrativlinjer der placerer brugeren i sin egen sæson */
  personalText: string[]
  /** Skal stats-linjen vises? Default false for ny bruger — den er kun støj uden data */
  showStats: boolean
  /**
   * Brugerens "modenhed" i Havebogen — bruges af hero-foto-resolveren
   * til at vælge passende foto-stemning (V3.2, juni 2026).
   */
  userState: 'new' | 'active' | 'year2plus'
  /**
   * V9 (dagtælleren): sæsondagen som tal + etiket, struktureret så
   * heroen kan rendre den taktile flip-tæller. Null når intet er
   * sået endnu — ærlighed over poesi: ingen såning, ingen sæsondag.
   */
  saesonDag: number | null
  /** "af din første sæson" / "af din tredje sæson" */
  saesonEtiket: string | null
}

// ════════════════════════════════════════════════════════════════
// DEMO-INDHOLD — fabrikerede data der viser Havebogens designvision
// for nye brugere uden egen historie
// ════════════════════════════════════════════════════════════════

export const DEMO_HERO_STATS: HeroStats = {
  notes: 24,
  varieties: 8,
  harvests: 3,
}

/**
 * Demo-tidslinje. Datoen beregnes ikke server-side i demo-flowet —
 * den hardcodes så snapshot'et er stabilt på tværs af visningstidspunkt.
 * Real-data-flowet beregner alle tre felter fra plant_logs.
 *
 * Bevidst valg: weekNoteCount=3 selv om de hardcodede DEMO_RECENT_NOTES
 * ikke falder inden for "denne uge" (de er fra 16.-26. maj, demo-dato
 * 7. juni). Tidslinjens 3 repræsenterer en plausibel hverdag for en
 * bruger der bruger appen — ikke det demoarrayet ved et tilfælde
 * indeholder.
 */
export const DEMO_TIDSLINJE: Tidslinje = {
  dateText: 'Søndag d. 7. juni',
  milestoneText: '12 dage siden du satte agurkerne ud',
  weekNoteCount: 3,
}

/**
 * Demo-fortællingen viser "lidt data"-tilstanden — den mest
 * fortællende af de tre states. Den hardcodes så snapshot'et er
 * stabilt; real-data-flowet genererer den fra heroStats + tidslinje
 * + history i actions/havebog.ts.
 */
export const DEMO_HERO_NARRATIVE: HeroNarrative = {
  // Dagbogs-stemmen (V3.10): "Dag 98" = første såning 2. marts →
  // demo-datoen 7. juni, inklusiv. Den ene sætning der gør
  // Havebogen til en kaptajns logbog frem for et banner.
  seasonLine: 'Dag 98 af din første sæson',
  personalText: [
    'Agurkerne har stået ude i 12 dage.',
    'Tomaterne begynder at tage fart.',
    'Du har skrevet 3 noter denne uge.',
  ],
  showStats: true,
  userState: 'active',
  saesonDag: 98,
  saesonEtiket: 'af din første sæson',
}

/**
 * "I haven lige nu" — ÉT stort tal + ÉN editorial sætning per måned.
 *
 * V3.5 (Anna's reference-opslag-feedback): hierarki skabes med
 * størrelse, ikke med farve eller bokse. Et tal læses på under et
 * sekund. Sammenlign:
 *
 *   Før V3.5:                        V3.5:
 *   • Jordtemperatur over 14°        14°
 *   • Tid til udplantning            Jordtemperaturen er nu høj nok
 *   • Bierne er aktive               til tomater og chili.
 *
 * Samme information. 10 gange stærkere. Det er "magasiner vælger
 * én ting og hvisker resten"-princippet i praksis.
 *
 * value-feltet er en kort string (kan være "14°", "+90 min", "3",
 * "127" — alt der kan rendres som Cormorant 72px). statement er
 * den editoriale forklaring i 1-2 sætninger.
 *
 * Roterer pr. måned i real-data-flowet (actions/havebog.ts).
 */
export interface NaturFakta {
  /** Den store typografiske skuespiller — fx "14°", "+90 min", "3" */
  value: string
  /** Editorial statement under tallet, 1-2 korte sætninger */
  statement: string
}

export const DEMO_NATUREN_LIGE_NU: NaturFakta = {
  value: '14°',
  statement: 'Jordtemperaturen er nu høj nok til tomater og chili.',
}

/**
 * "I DIN HAVE"-tal — bruges som DATAGRUNDLAG for Kapitel 1's
 * fortællende sætninger (V5-bogen). Tallene selv vises IKKE på
 * Havebogen (lobby-reglen: tal-form hører til Planter/Kalender) —
 * de oversættes til prosa i kapitel-laget.
 */
export interface IDinHaveTal {
  aktiveSorter: number
  klarTilUdplantning: number | null
  arterRigere: number | null
}

export const DEMO_I_DIN_HAVE: IDinHaveTal = {
  aktiveSorter: 8,
  klarTilUdplantning: 3,
  arterRigere: 11,
}

/**
 * Kapitel 1: "Lige nu" — ÉN indsigt (V7), og helst en OPDAGELSE (V8).
 *
 * V8 (forfatter, ikke sekretær): den stærkeste linje er noget
 * systemet har OPDAGET, ikke noget brugeren selv har gjort.
 * "Du såede tomater" er en kvittering; "spirede på 9 dage —
 * guiden regner med 10-21" er en forfatter-sætning. Kun den
 * første linje vises; resten er fallback.
 */
// ILDSTEDET (V16): "Havens stemme i dag" som en DAGSSIDE med
// redaktion. Én takt = rubrik-etiket + tekst. Lead'en er dagens
// hovedhistorie (kæmpe); resten er støtte-takter (stepped down).
export interface Takt {
  /** Rubrik-etiket — "Dagens historie", "Fra haven", ... */
  kicker: string
  tekst: string
  /** Undertekst — kun på lead'en: "aha"-laget under hovedhistorien. */
  underrubrik?: string
}

export interface DagensOpslag {
  /** Hovedhistorien — kæmpe, ét bål i centrum */
  lead: Takt
  /** Støtte-takter i læserækkefølge */
  beats: Takt[]
}

export const DEMO_DAGENS_OPSLAG: DagensOpslag = {
  lead: {
    kicker: 'Dagens historie',
    tekst: 'Chilierne spirede på 9 dage',
    underrubrik: 'Guiden regner normalt med 10–21. I år var de hurtigere end forventet.',
  },
  beats: [
    { kicker: 'Lige nu i haven', tekst: 'Jorden er nu varm nok til tomater og chili.' },
    {
      kicker: 'Fra haven',
      tekst:
        'Du dyrker Corno di Toro Rosso. Mange dyrker den sammen med aubergine og basilikum — en lille middelhavshave i bedet.',
    },
    {
      kicker: 'På denne tid af året',
      tekst: 'Mange begynder allerede nu at planlægge efterårets afgrøder.',
    },
  ],
}

/**
 * Kapitel 3: "Sæsonens vendepunkter" (V8 — afløser måneds-krøniken).
 *
 * Mennesker husker ikke deres have som marts/april/maj — de husker
 * begivenheder: første høst, første blomst, ugen det regnede.
 * Historien organiseres derfor omkring VENDEPUNKTER, kronologisk.
 * Samme data som før, helt anden fortælling.
 */
export interface Vendepunkt {
  titel: string          // "Sæsonen begyndte", "Første høst"
  detalje: string        // "Tomaterne blev sået 18. marts."
}

export const DEMO_VENDEPUNKTER: Vendepunkt[] = [
  { titel: 'Sæsonen begyndte', detalje: 'Tomaterne blev sået 18. marts.' },
  { titel: 'Væksten tog fart', detalje: 'Chilierne fik deres første rigtige blade.' },
  { titel: 'Første høst', detalje: 'Salat Crispy Mint blev høstet 18. maj.' },
  { titel: 'Ud i drivhuset', detalje: 'Peberfrugterne flyttede ud 4. juni.' },
]

/**
 * Kapitel 4: "Minder" — kuraterede højdepunkter (V7).
 * Ikke alle billeder, ikke alle logs — kun sæsonens førster og
 * største øjeblikke. Emotionelt indhold, Potalot vælger.
 */
/** Milepæl-type — styrer markørfarve + ikon i tidslinjen. */
export type MindeKind = 'knop' | 'blomst' | 'hoest' | 'saaning' | 'udplantning' | 'spire'

export interface Minde {
  titel: string          // "Første knop", "Første høst"
  detalje: string        // sorten, fx "Dahlia Café au Lait"
  dato: string           // "4. juni"
  kind?: MindeKind       // markør + ikon; udeladt → neutral
  imageUrl?: string | null // lille thumbnail; mangler → farvefelt + ikon
  meta?: string          // lille chip, fx "knapt 90 gram", "seks frø i bakke"
}

export const DEMO_MINDER: Minde[] = [
  // Nyeste først — samme rækkefølge som byggMinder i actions/havebog.ts.
  { titel: 'Første knop', detalje: 'Dahlia Café au Lait', dato: '4. juni', kind: 'knop', imageUrl: '/images/plantekort/dahlia-cafe-au-lait.jpg' },
  { titel: 'Første høst', detalje: 'Salat Crispy Mint', dato: '18. maj', kind: 'hoest', meta: 'knapt 90 gram' },
  { titel: 'Sæsonens første såning', detalje: 'Tomat San Marzano', dato: '18. marts', kind: 'saaning', meta: 'seks frø i bakke' },
]

export const DEMO_ON_THIS_DAY: OnThisDayEntry[] = [
  {
    yearsAgo: 1,
    plantName: 'Dahlia',
    variety: 'Café au Lait',
    text: 'Du plantede dine første dahliaer i havens sydbed. De voksede sig store og bar over 30 blomster den sommer.',
    imageUrl: '/images/havebog/paa-denne-dag.jpg',
    href: '/mine-planter', // mock-destination til preview (nærmeste eksisterende)
    sourceType: 'plant',
  },
  {
    yearsAgo: 2,
    plantName: 'Tomat',
    variety: 'San Marzano',
    text: 'Du noterede: "Spirerne er stærkere end sidste år — solen flytter sig pænt over jorden."',
  },
]

export const DEMO_RECENT_NOTES: RecentNote[] = [
  {
    type: 'observation',
    plantName: 'Chili',
    variety: 'Habanero Orange',
    text: 'Bladene ser lidt lyse ud — mangler nok kvælstof.',
    date: '2026-05-26',
  },
  {
    type: 'reminder',
    plantName: 'Agurk',
    variety: 'Marketmore',
    text: 'Husk at afhærde inden udplantning næste weekend.',
    date: '2026-05-24',
  },
  {
    type: 'note',
    plantName: 'Tomat',
    variety: 'San Marzano',
    text: 'San Marzano klarede sig bedst i drivhusets sydside. Plant samme sted næste år.',
    date: '2026-05-20',
  },
  {
    type: 'harvest',
    plantName: 'Salat',
    variety: 'Crispy Mint',
    text: 'Første portion plukket — knapt 90 g, perfekt sprød.',
    date: '2026-05-18',
  },
  {
    type: 'observation',
    plantName: 'Dild',
    variety: 'Bouquet',
    text: 'Står tæt og frodig efter regn-ugen.',
    date: '2026-05-16',
  },
]

export const DEMO_HISTORY: HistoryYear[] = [
  {
    year: 2026,
    months: [
      {
        monthIdx: 5,
        monthName: 'Maj',
        noteCount: 12,
        imageCount: 8,
        varietyCount: 6,
        imageUrls: [
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/aert-sugar-snap.jpg',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
          '/images/plantekort/dild-bouquet.jpg',
          '/images/plantekort/stangboenne-cobra.jpg',
          '/images/plantekort/tomat-san-marzano.jpg',
        ],
      },
      {
        monthIdx: 4,
        monthName: 'April',
        noteCount: 8,
        imageCount: 5,
        varietyCount: 5,
        imageUrls: [
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/aert-sugar-snap.jpg',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/dild-bouquet.jpg',
        ],
      },
      {
        monthIdx: 3,
        monthName: 'Marts',
        noteCount: 4,
        imageCount: 3,
        varietyCount: 3,
        imageUrls: [
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
        ],
      },
    ],
  },
  {
    year: 2025,
    months: [
      {
        monthIdx: 10,
        monthName: 'Oktober',
        noteCount: 6,
        imageCount: 4,
        varietyCount: 4,
        imageUrls: [
          '/images/plantekort/stangboenne-cobra.jpg',
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
          '/images/plantekort/aert-sugar-snap.jpg',
        ],
      },
      {
        monthIdx: 8,
        monthName: 'August',
        noteCount: 14,
        imageCount: 11,
        varietyCount: 7,
        imageUrls: [
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/aert-sugar-snap.jpg',
          '/images/plantekort/dild-bouquet.jpg',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
          '/images/plantekort/stangboenne-cobra.jpg',
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/aert-sugar-snap.jpg',
        ],
      },
      {
        monthIdx: 5,
        monthName: 'Maj',
        noteCount: 9,
        imageCount: 6,
        varietyCount: 5,
        imageUrls: [
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/aert-sugar-snap.jpg',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/dild-bouquet.jpg',
        ],
      },
    ],
  },
]

export const DEMO_DENNE_SAESON: DenneSaesonFacts = {
  senesteHoest: {
    plantName: 'Salat',
    variety: 'Crispy Mint',
    date: '2026-05-18',
    text: 'Første portion plukket — knapt 90 g.',
  },
  senesteNote: {
    plantName: 'Chili',
    variety: 'Habanero Orange',
    date: '2026-05-26',
    text: 'Bladene ser lidt lyse ud — mangler nok kvælstof.',
    type: 'observation',
  },
  senesteBillede: {
    plantName: 'Tomat',
    variety: 'San Marzano',
    date: '2026-05-22',
    imageUrl: '/images/plantekort/tomat-san-marzano.jpg',
  },
}

export const DEMO_ARCHIVED_PLANTS: ArchivedPlant[] = [
  {
    id: 'demo-arch-tomat-2025',
    name: 'Tomat',
    variety: 'San Marzano',
    primaryImageId: '/images/plantekort/tomat-san-marzano.jpg',
    archivedYear: 2025,
    summary: '4,2 kg høstet · sluttede oktober',
  },
  {
    id: 'demo-arch-agurk-2025',
    name: 'Agurk',
    variety: 'Marketmore',
    primaryImageId: '/images/plantekort/agurk-marketmore.png',
    archivedYear: 2025,
    summary: '11 frugter · sluttede september',
  },
  {
    id: 'demo-arch-dahlia-2025',
    name: 'Dahlia',
    variety: 'Café au Lait',
    primaryImageId: '/images/plantekort/dahlia-cafe-au-lait.jpg',
    archivedYear: 2025,
    summary: '30+ blomster · sluttede november',
  },
]

// ─────────────────────────────────────────────────────────────
// HAVEBOG V1.0 — DE NYE RUM (prototyper, 13. juni 2026)
//
// Første-versioner så hele huset kan ses, før hierarkiet afgøres.
// Demo-data driver dem på demo-forsiden. Rum der kræver eksterne
// kilder (Vejret) eller fællesskabsdata (Populært) er markeret —
// de må IKKE vise opfundne tal til rigtige brugere (ærligheds-
// reglen); de lever indtil videre kun som prototyper i demo.
// ─────────────────────────────────────────────────────────────

// 3 · Tal til din have
export const DEMO_TAL_EKSEMPLER: string[] = [
  '"De første agurker er kommet."',
  '"Husk mig på at nippe tomaterne i weekenden."',
  '"Jeg så bladlus på roserne i dag."',
]
// V18: seneste optagelser — viser at stemmen bliver til noter/minder
export type OptagelseStatus =
  | 'unprocessed'
  | 'log'
  | 'opgave'
  | 'minde'
  | 'observation'
export interface Optagelse {
  tekst: string
  tid: string
  /** Hvad optagelsen er blevet til (diktafon = indbakke, ikke lydarkiv). */
  status?: OptagelseStatus
}
export const DEMO_OPTAGELSER: Optagelse[] = [
  { tekst: 'Tomaterne ser trætte ud efter regnen.', tid: 'I dag, 17.42', status: 'unprocessed' },
  { tekst: 'Husk at så mere salat til efteråret.', tid: 'I går, 10.31', status: 'opgave' },
  { tekst: 'Første tomat er ved at få farve!', tid: '8. juni, 18.09', status: 'minde' },
]

// 4 · Inspirér mig (som selvstændigt rum)
export interface InspirerForslag {
  kicker: string
  navn: string
  begrundelse: string
  /** V18: illustration/foto — bruger eksisterende frøkort indtil videre */
  billede?: string
  /**
   * V19: små sekundære forslag (foto-række under CTA). To linjer:
   *  top  = ART eller SORT (bold), hvis sorten er fortæller nok i sig selv
   *  bund = SORT (ikke bold, en tand mindre) ELLER en særlig kvalitet
   *         (spiselig, sen blomstring, egnet til tørring)
   */
  forslag?: { top: string; bund: string; foto: string }[]
  /** V18: sekundært "måske du også vil prøve" (bliver egen sektion) */
  sekundaer?: { kicker: string; titel: string; tekst: string }
}
export const DEMO_INSPIRER: InspirerForslag = {
  kicker: 'Prøv næste år',
  navn: 'Malwina jordbær',
  begrundelse: 'Forlænger sæsonen 4-6 uger efter Korona.',
  billede: '/images/frokort/jordbaer-korona.png',
  forslag: [
    { top: 'Basilikum', bund: 'Egnet til tørring', foto: '/images/makro/basilikum/bundt.jpg' },
    { top: 'Peberfrugt', bund: 'Corno di Toro', foto: '/images/makro/peberfrugt-corno-di-toro-rosso/moden-frugt.jpg' },
  ],
  sekundaer: {
    kicker: 'Måske du også vil prøve',
    titel: 'Prøv frøavl',
    // Linjeskift bevidst (renderes via pre-line i MaaskeDuOgsaa).
    tekst: 'Du dyrker tomater.\nMåske er det tid til at\ngemme dine egne frø.',
  },
}

// 5 · Dyrkerstatus — identitet, ikke gamification (ingen niveau/afMax)
export interface Dyrkerstatus {
  titel: string
  beskrivelse: string
}
export const DEMO_DYRKERSTATUS: Dyrkerstatus = {
  titel: 'Selvforsyner',
  beskrivelse: 'Du har høstet fra flere afgrøder denne sæson.',
}

// 6 · Dyrkerkompetencer — editorial ord, ingen opnået-badges
export interface Kompetenceomraade {
  omraade: string
  faerdigheder: string[]
}
export const DEMO_KOMPETENCER: Kompetenceomraade[] = [
  { omraade: 'Tomatdyrkning', faerdigheder: ['Beskæring', 'Høst'] },
  { omraade: 'Agurkdyrkning', faerdigheder: ['Såning', 'Udplantning', 'Høst'] },
]

// 10 · Spisekammer
export interface SpisekammerData {
  hoest: { navn: string; antal: string }[]
  opskrifter: string[]
  /**
   * Er `antal` høst-REGISTRERINGER (ægte data) frem for faktiske mængder?
   * Så må UI ikke skrive "18 jordbær" (misvisende) — vis kun afgrødenavne.
   * Demo = false (kuraterede tal). Udfyldes true af den ægte motor.
   */
  antalErHoester?: boolean
}
export const DEMO_SPISEKAMMER: SpisekammerData = {
  hoest: [
    { navn: 'Jordbær', antal: '18' },
    { navn: 'Agurker', antal: '7' },
    { navn: 'Tomater', antal: '4' },
  ],
  opskrifter: ['Gazpacho', 'Jordbærtærte', 'Tomatsalat'],
}

// 11 · Populært lige nu — KRÆVER ægte fællesskabsdata. Prototype.
export interface PopulaertEmne {
  emne: string
  beskrivelse: string
  tone: 'sage' | 'rose' | 'sand'
}
export const DEMO_POPULAERT: PopulaertEmne[] = [
  { emne: 'Kompost', beskrivelse: 'Sådan får du jordliv og næringsstoffer', tone: 'sage' },
  { emne: 'Dræbersnegle', beskrivelse: 'Naturlige metoder der virker nu', tone: 'rose' },
  { emne: 'Efterafgrøder', beskrivelse: 'Beskyt jorden og giv livet en pause', tone: 'sand' },
]

// 12 · Vejret i haven — KRÆVER vejr-kilde. Prototype.
export interface VejrData {
  grader: string
  forhold: string
  note: string
}
export const DEMO_VEJR: VejrData = {
  grader: '21°',
  forhold: 'Delvist skyet',
  note: 'Perfekt vejr til udplantning.',
}

// 13 · Projekter
export interface ProjektForslag {
  kicker: string
  titel: string
  kontekst?: string
}
export const DEMO_PROJEKT: ProjektForslag = {
  kicker: 'Næste projekt',
  titel: 'Byg et insekthotel',
  kontekst: 'Du gemte idéen i juni. Nu er det et godt tidspunkt at gå i gang.',
}

// 14 · Bedrifter / Første gange — kun BEVISELIGE milepæle (log-typer der
// findes). Ikke "første overvintring/frøavl" (ingen log-type endnu).
export interface Bedrift {
  titel: string
  aar: string
  kind: 'hoest' | 'drivhus' | 'blomst' | 'saaning'
}
export const DEMO_BEDRIFTER: Bedrift[] = [
  { titel: 'Første tomathøst', aar: '2025', kind: 'hoest' },
  { titel: 'Første drivhussæson', aar: '2025', kind: 'drivhus' },
  { titel: 'Første dahlia', aar: '2025', kind: 'blomst' },
  { titel: 'Første såning indendørs', aar: '2024', kind: 'saaning' },
]

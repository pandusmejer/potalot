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

export const DEMO_ON_THIS_DAY: OnThisDayEntry[] = [
  {
    yearsAgo: 1,
    plantName: 'Dahlia',
    variety: 'Café au Lait',
    text: 'Du plantede dine første dahliaer i havens sydbed. De voksede sig store og bar over 30 blomster den sommer.',
    imageUrl: '/images/plantekort/dahlia-cafe-au-lait.jpg',
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
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
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
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
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
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
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
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
          '/images/plantekort/dild-bouquet.jpg',
          '/images/plantekort/dahlia-cafe-au-lait.jpg',
          '/images/plantekort/stangboenne-cobra.jpg',
          '/images/plantekort/tomat-san-marzano.jpg',
          '/images/plantekort/agurk-marketmore.png',
          '/images/plantekort/chili-habanero-orange.jpg',
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
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
          '/images/plantekort/sukkeraert-sugar-snap.jpg',
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

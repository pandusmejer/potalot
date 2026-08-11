import type { CalendarTask, Plant, PlantStatus } from '@/lib/types'

/**
 * Handlings-orienterede filtre (V2.2 — Annas feedback).
 *
 * Efter art-opdelingen blev de gamle status-chips (Sået/Spiret/
 * Pottet om/Udplantet/Klar til høst) en anden måde at organisere de
 * samme ting på — database-sprog. De nye chips svarer i stedet på
 * "hvad vil jeg se?":
 *
 *   Lige nu          → alle aktive (default)
 *   I vækst          → saaet, spirer, i_vaekst, udplantet (trives, intet kræves)
 *   Kræver handling  → klar_til_udplantning (du skal gøre noget)
 *   Klar til høst    → hoestklar (belønningen venter)
 */
export type PlantFilterStatus =
  | 'lige_nu'
  | 'i_vaekst'
  | 'kraever_handling'
  | 'klar_til_hoest'

export interface MockPlantImage {
  id: string
  src: string
  alt: string
}

export interface MockPlantLog {
  id: string
  date: string
  action: string
  note?: string
  /** Konsekvensen — hvad hændelsen BETØD for planten. Gør log til historie. */
  konsekvens?: string
}

export interface MockPlantNextAction {
  id: string
  plantId: string
  plantName: string
  action: string
  timing: string
  image?: string | null
}

export interface MockPlantActivity {
  id: string
  plantId: string
  plantName: string
  action: string
  when: string
  image?: string
}

export interface MockPlantGuide {
  title: string
  body: string
  href?: string
}

export interface MockPlant extends Plant {
  seedId: string
  type: string
  sownDate: string | null
  sproutedDate: string | null
  repottedDate: string | null
  plantedOutDate: string | null
  expectedHarvestStart: string | null
  expectedHarvestEnd: string | null
  notes: string
  pictures: MockPlantImage[]
  latestActivity: MockPlantActivity
  nextAction: MockPlantNextAction
  logs: MockPlantLog[]
  guide: MockPlantGuide
}

const DEMO_USER_ID = 'demo-user'

export const plantStatusFilters: Array<{ id: PlantFilterStatus; label: string }> = [
  { id: 'lige_nu', label: 'Lige nu' },
  { id: 'i_vaekst', label: 'I vækst' },
  { id: 'kraever_handling', label: 'Kræver handling' },
  { id: 'klar_til_hoest', label: 'Klar til høst' },
]

export const mockPlants: MockPlant[] = [
  {
    id: 'tomat-san-marzano',
    userId: DEMO_USER_ID,
    seedId: 'seed-tomat-san-marzano',
    sourceElementId: 'seed-tomat-san-marzano',
    name: 'Tomat',
    variety: 'San Marzano',
    type: 'Grøntsag',
    status: 'i_vaekst',
    location: 'Vindueskarm syd',
    sowDate: '2026-03-18',
    sownDate: '2026-03-18',
    sproutedDate: '2026-03-25',
    repottedDate: '2026-04-20',
    plantedOutDate: null,
    plantingOutDate: '2026-06-03',
    firstHarvestDate: '2026-08-08',
    expectedHarvestStart: '2026-08-08',
    expectedHarvestEnd: '2026-09-20',
    quantity: 6,
    imageIds: ['/images/plantekort/tomat-san-marzano.jpg'],
    primaryImageId: '/images/plantekort/tomat-san-marzano.jpg',
    imageSource: 'guide_reference',
    logIds: ['log-tomat-1', 'log-tomat-2', 'log-tomat-3'],
    guideId: 'tomat-san-marzano',
    isArchived: false,
    createdAt: '2026-03-18T08:00:00.000Z',
    updatedAt: '2026-05-28T18:30:00.000Z',
    notes: 'Stærke planter efter ompotning. Hold øje med vanding på solrige dage.',
    pictures: [
      { id: 'tomat-img-1', src: '/images/plantekort/tomat-san-marzano.jpg', alt: 'Tomat San Marzano' },
    ],
    latestActivity: {
      id: 'activity-tomat',
      plantId: 'tomat-san-marzano',
      plantName: 'Tomat San Marzano',
      action: 'Pottet om for 9 dage siden',
      when: '20. april',
      image: '/images/plantekort/tomat-san-marzano.jpg',
    },
    nextAction: {
      id: 'next-tomat',
      plantId: 'tomat-san-marzano',
      plantName: 'Tomat San Marzano',
      action: 'Ompot de største planter',
      timing: 'I denne uge',
    },
    logs: [
      { id: 'log-tomat-1', date: '2026-03-18', action: 'Sået', note: 'Seks frø lagt i bakke på varmemåtte. Dækket med plastik for at holde på fugten.', konsekvens: 'Varmen under bakken vækkede frøene på under en uge.' },
      { id: 'log-tomat-2', date: '2026-04-20', action: 'Pottet om', note: 'Flyttet til 11 cm potter. Rødderne havde fyldt hele den gamle potte.', konsekvens: 'Den ekstra plads satte straks gang i ny vækst ovenpå.' },
      { id: 'log-tomat-3', date: '2026-06-09', action: 'Bundet op', note: 'Første sideskud fjernet. Bundet til snor, så stænglen kan bære vægten.', konsekvens: 'Planten fortsætter med én hovedstamme.' },
    ],
    guide: {
      title: 'Tomat i krukke og drivhus',
      body: 'Hold jævn fugt, giv lys og vent med udplantning til nætterne er lune.',
      href: '/guides',
    },
  },
  {
    id: 'agurk-marketmore',
    userId: DEMO_USER_ID,
    seedId: 'seed-agurk-marketmore',
    sourceElementId: 'seed-agurk-marketmore',
    name: 'Agurk',
    variety: 'Marketmore',
    type: 'Grøntsag',
    status: 'spirer',
    location: 'Lys hylde',
    sowDate: '2026-05-14',
    sownDate: '2026-05-14',
    sproutedDate: '2026-05-19',
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: '2026-06-08',
    firstHarvestDate: '2026-07-22',
    expectedHarvestStart: '2026-07-22',
    expectedHarvestEnd: '2026-09-05',
    quantity: 3,
    imageIds: ['/images/plantekort/agurk-marketmore.jpg'],
    primaryImageId: '/images/plantekort/agurk-marketmore.jpg',
    imageSource: 'user_upload',
    logIds: ['log-agurk-1', 'log-agurk-2'],
    guideId: 'agurk-marketmore',
    isArchived: false,
    createdAt: '2026-05-14T07:30:00.000Z',
    updatedAt: '2026-05-29T07:40:00.000Z',
    notes: 'Spirer hurtigt. Skal ikke stå for vådt omkring rodhalsen.',
    pictures: [
      { id: 'agurk-img-1', src: '/images/plantekort/agurk-marketmore.jpg', alt: 'Agurk Marketmore' },
    ],
    latestActivity: {
      id: 'activity-agurk',
      plantId: 'agurk-marketmore',
      plantName: 'Agurk Marketmore',
      action: 'Foto tilføjet',
      when: 'I dag',
      image: '/images/plantekort/agurk-marketmore.jpg',
    },
    nextAction: {
      id: 'next-agurk',
      plantId: 'agurk-marketmore',
      plantName: 'Agurk Marketmore',
      action: 'Tjek fugt ved spirerne',
      timing: 'I morgen',
    },
    logs: [
      { id: 'log-agurk-1', date: '2026-05-14', action: 'Sået', note: '3 frø i hver sin potte.' },
      { id: 'log-agurk-2', date: '2026-05-19', action: 'Spiret', note: 'Alle tre er oppe.' },
    ],
    guide: {
      title: 'Agurk med lune rødder',
      body: 'Agurk vil have varme, jævn vanding og læ. Plant først ud når jorden er lun.',
      href: '/guides',
    },
  },
  {
    id: 'chili-habanero',
    userId: DEMO_USER_ID,
    seedId: 'seed-chili-habanero',
    sourceElementId: 'seed-chili-habanero',
    name: 'Chili',
    variety: 'Habanero',
    type: 'Frugtgrøntsag',
    status: 'udplantet',
    location: 'Drivhus',
    sowDate: '2026-02-10',
    sownDate: '2026-02-10',
    sproutedDate: '2026-02-22',
    repottedDate: '2026-04-02',
    plantedOutDate: '2026-05-22',
    plantingOutDate: '2026-05-22',
    firstHarvestDate: '2026-08-15',
    expectedHarvestStart: '2026-08-15',
    expectedHarvestEnd: '2026-10-01',
    quantity: 2,
    imageIds: [],
    primaryImageId: null,
    imageSource: null,
    logIds: ['log-chili-1', 'log-chili-2'],
    // Mappet til 'chili-habanero-orange' fordi det er samme demo-sort
    // (Habanero = den orange Habanero-variant i POTALOT_IMAGE_SETS).
    guideId: 'chili-habanero-orange',
    isArchived: false,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-05-29T08:00:00.000Z',
    notes: 'Kompakt vækst. Første blomsterknopper er synlige.',
    pictures: [
      { id: 'chili-img-1', src: '/images/plantekort/chili-habanero-orange.jpg', alt: 'Chili Habanero' },
    ],
    latestActivity: {
      id: 'activity-chili',
      plantId: 'chili-habanero',
      plantName: 'Chili Habanero',
      // Seneste AKTUELLE hændelse — skal følge loggens kronologi (Anna
      // PLT-0253: 'Spirede i dag' + synlige blomsterknopper var en
      // biologisk umulig tidslinje).
      action: 'Udplantet',
      when: '22. maj',
      image: '/images/plantekort/chili-habanero-orange.jpg',
    },
    nextAction: {
      id: 'next-chili',
      plantId: 'chili-habanero',
      plantName: 'Chili Habanero',
      action: 'Bind forsigtigt op',
      timing: 'I weekenden',
    },
    logs: [
      { id: 'log-chili-1', date: '2026-02-10', action: 'Sået', note: 'Tidlig såning med plantelys.' },
      { id: 'log-chili-2', date: '2026-05-22', action: 'Udplantet', note: 'Sat i drivhusets lune hjørne.' },
    ],
    guide: {
      title: 'Chili under glas',
      body: 'Chili trives med varme, moderat gødning og god luft omkring bladene.',
      href: '/guides',
    },
  },
  {
    id: 'dahlia-cafe-au-lait',
    userId: DEMO_USER_ID,
    seedId: 'tuber-dahlia-cafe-au-lait',
    sourceElementId: 'tuber-dahlia-cafe-au-lait',
    name: 'Dahlia',
    variety: 'Café au Lait',
    type: 'Blomst',
    status: 'klar_til_udplantning',
    location: 'Forhave',
    sowDate: '2026-04-05',
    sownDate: '2026-04-05',
    sproutedDate: '2026-04-18',
    repottedDate: '2026-05-12',
    plantedOutDate: null,
    plantingOutDate: '2026-06-01',
    firstHarvestDate: '2026-07-28',
    expectedHarvestStart: '2026-07-28',
    expectedHarvestEnd: '2026-10-05',
    quantity: 4,
    imageIds: ['/images/plantekort/dahlia-cafe-au-lait.jpg'],
    primaryImageId: '/images/plantekort/dahlia-cafe-au-lait.jpg',
    logIds: ['log-dahlia-1', 'log-dahlia-2'],
    guideId: 'dahlia-cafe-au-lait',
    isArchived: false,
    createdAt: '2026-04-05T12:00:00.000Z',
    updatedAt: '2026-05-28T17:00:00.000Z',
    notes: 'Hærdet af i skygge. Vent med udplantning ved kolde nætter.',
    pictures: [
      { id: 'dahlia-img-1', src: '/images/plantekort/dahlia-cafe-au-lait.jpg', alt: 'Dahlia Cafe au Lait' },
    ],
    latestActivity: {
      id: 'activity-dahlia',
      plantId: 'dahlia-cafe-au-lait',
      plantName: 'Dahlia Café au Lait',
      action: 'Pottet om i går',
      when: 'I går',
      image: '/images/plantekort/dahlia-cafe-au-lait.jpg',
    },
    nextAction: {
      id: 'next-dahlia',
      plantId: 'dahlia-cafe-au-lait',
      plantName: 'Dahlia Café au Lait',
      action: 'Udplant efter frost',
      timing: 'Når nætterne er milde',
    },
    logs: [
      { id: 'log-dahlia-1', date: '2026-04-05', action: 'Forspiret', note: 'Knold sat lyst og lunt.' },
      { id: 'log-dahlia-2', date: '2026-05-12', action: 'Pottet om', note: 'Fik større potte før afhærdning.' },
    ],
    guide: {
      title: 'Dahlia gennem sommeren',
      body: 'Topskud kan knibes for busket vækst. Vand dybt og fjern visne blomster.',
      href: '/guides',
    },
  },
  {
    id: 'salat-little-gem',
    userId: DEMO_USER_ID,
    seedId: 'seed-salat-little-gem',
    sourceElementId: 'seed-salat-little-gem',
    // Tidligere fejlagtigt name='Sukkertært'/variety='Sugar Snap'
    // med hardcoded sukkerært-billede — bruteforce-rensning så
    // mock-data matcher id'et. Ingen plantekort-asset findes endnu
    // for Little Gem, så resolveren returnerer placeholder.
    name: 'Salat',
    variety: 'Little Gem',
    type: 'Bladgrøntsag',
    status: 'hoestklar',
    location: 'Højbed 2',
    sowDate: '2026-04-01',
    sownDate: '2026-04-01',
    sproutedDate: '2026-04-08',
    repottedDate: null,
    plantedOutDate: '2026-05-02',
    plantingOutDate: '2026-05-02',
    firstHarvestDate: '2026-05-29',
    expectedHarvestStart: '2026-05-29',
    expectedHarvestEnd: '2026-06-20',
    quantity: 12,
    imageIds: [],
    primaryImageId: null,
    logIds: ['log-salat-1', 'log-salat-2'],
    guideId: 'salat-little-gem',
    isArchived: false,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-29T08:20:00.000Z',
    notes: 'Klar til løbende høst af sprøde yderblade.',
    pictures: [],
    latestActivity: {
      id: 'activity-salat',
      plantId: 'salat-little-gem',
      plantName: 'Salat Little Gem',
      action: 'Klar til høst',
      when: 'I dag',
    },
    nextAction: {
      id: 'next-salat',
      plantId: 'salat-little-gem',
      plantName: 'Salat Little Gem',
      action: 'Høst yderblade',
      timing: 'I dag',
    },
    logs: [
      { id: 'log-salat-1', date: '2026-04-01', action: 'Sået', note: 'Direkte i bakke.' },
      { id: 'log-salat-2', date: '2026-05-29', action: 'Høstklar', note: 'Første faste hoveder.' },
    ],
    guide: {
      title: 'Salat hele sæsonen',
      body: 'Så lidt og ofte, hold jævn fugt og høst yderblade for løbende forsyning.',
      href: '/guides',
    },
  },
  {
    id: 'stangboenne-neckargold',
    userId: DEMO_USER_ID,
    seedId: 'seed-stangboenne-neckargold',
    sourceElementId: 'seed-stangboenne-neckargold',
    // Tidligere fejlagtigt variety='Cobra' med hardcoded cobra-billede
    // selvom id'et er neckargold. Ingen plantekort-asset findes endnu
    // for Neckargold, så resolveren returnerer placeholder.
    name: 'Stangbønne',
    variety: 'Neckargold',
    type: 'Bælgplante',
    status: 'saaet',
    location: 'Minidrivhus',
    sowDate: '2026-05-25',
    sownDate: '2026-05-25',
    sproutedDate: null,
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: '2026-06-12',
    firstHarvestDate: '2026-08-01',
    expectedHarvestStart: '2026-08-01',
    expectedHarvestEnd: '2026-09-15',
    quantity: 8,
    imageIds: [],
    primaryImageId: null,
    logIds: ['log-boenne-1'],
    guideId: 'stangboenne-neckargold',
    isArchived: false,
    createdAt: '2026-05-25T09:00:00.000Z',
    updatedAt: '2026-05-25T09:00:00.000Z',
    notes: 'Venter på spiring. Skal have stativ ved udplantning.',
    pictures: [],
    latestActivity: {
      id: 'activity-boenne',
      plantId: 'stangboenne-neckargold',
      plantName: 'Stangbønne Neckargold',
      action: 'Sået',
      when: '25. maj',
    },
    nextAction: {
      id: 'next-boenne',
      plantId: 'stangboenne-neckargold',
      plantName: 'Stangbønne Neckargold',
      action: 'Hold jorden lun og fugtig',
      timing: 'De næste dage',
    },
    logs: [
      { id: 'log-boenne-1', date: '2026-05-25', action: 'Sået', note: '8 bønner i minidrivhus.' },
    ],
    guide: {
      title: 'Bønner med højde',
      body: 'Bønner vil have lun jord, støtte fra starten og regelmæssig høst senere.',
      href: '/guides',
    },
  },

  // ── V2-demo: flere sorter af samme art ─────────────────────
  // De næste tre planter findes for at "Aktive → Art → Sorter"-
  // arkitekturen kan demonstrere sin styrke i demo-mode:
  //   Tomat      → San Marzano + Sweetie (2 sorter, én uden foto)
  //   Peberfrugt → California Wonder + Corno di Toro Rosso (2 sorter)
  // Sweetie har bevidst INTET foto — den viser sort-kortets ærlige
  // foto-løse fallback (status-farvet blok med forbogstav).
  {
    id: 'tomat-sweetie',
    userId: DEMO_USER_ID,
    seedId: 'seed-tomat-sweetie',
    sourceElementId: 'seed-tomat-sweetie',
    name: 'Tomat',
    variety: 'Sweetie',
    type: 'Grøntsag',
    status: 'spirer',
    location: 'Vindueskarm syd',
    sowDate: '2026-05-02',
    sownDate: '2026-05-02',
    sproutedDate: '2026-05-10',
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: '2026-06-15',
    firstHarvestDate: '2026-08-15',
    expectedHarvestStart: '2026-08-15',
    expectedHarvestEnd: '2026-10-01',
    quantity: 4,
    imageIds: [],
    primaryImageId: null,
    logIds: ['log-sweetie-1'],
    guideId: null,
    isArchived: false,
    createdAt: '2026-05-02T08:00:00.000Z',
    updatedAt: '2026-05-10T08:00:00.000Z',
    notes: 'Cherrytomat til altankassen. Spirer fint.',
    pictures: [],
    latestActivity: {
      id: 'activity-sweetie',
      plantId: 'tomat-sweetie',
      plantName: 'Tomat Sweetie',
      action: 'Spiret',
      when: '10. maj',
    },
    nextAction: {
      id: 'next-sweetie',
      plantId: 'tomat-sweetie',
      plantName: 'Tomat Sweetie',
      action: 'Prikl de stærkeste spirer',
      timing: 'Næste uge',
    },
    logs: [
      { id: 'log-sweetie-1', date: '2026-05-02', action: 'Sået', note: '4 frø i lille bakke.' },
    ],
    guide: {
      title: 'Cherrytomater i krukke',
      body: 'Sweetie er en let busktomat — perfekt til krukker og altankasser.',
      href: '/guides',
    },
  },
  {
    id: 'peberfrugt-california-wonder',
    userId: DEMO_USER_ID,
    seedId: 'seed-peberfrugt-california-wonder',
    sourceElementId: 'seed-peberfrugt-california-wonder',
    name: 'Peberfrugt',
    variety: 'California Wonder',
    type: 'Frugtgrøntsag',
    status: 'klar_til_udplantning',
    location: 'Drivhus',
    sowDate: '2026-03-02',
    sownDate: '2026-03-02',
    sproutedDate: '2026-03-14',
    repottedDate: '2026-04-12',
    plantedOutDate: null,
    plantingOutDate: '2026-06-10',
    firstHarvestDate: '2026-08-01',
    expectedHarvestStart: '2026-08-01',
    expectedHarvestEnd: '2026-09-30',
    quantity: 3,
    imageIds: ['/images/plantekort/peberfrugt-california-wonder.jpg'],
    primaryImageId: '/images/plantekort/peberfrugt-california-wonder.jpg',
    imageSource: 'guide_reference',
    logIds: ['log-calwonder-1', 'log-calwonder-2'],
    guideId: 'peberfrugt-california-wonder',
    isArchived: false,
    createdAt: '2026-03-02T08:00:00.000Z',
    updatedAt: '2026-06-05T08:00:00.000Z',
    notes: 'Kompakte, kraftige planter. Klar til drivhusbedet.',
    pictures: [
      { id: 'calwonder-img-1', src: '/images/plantekort/peberfrugt-california-wonder.jpg', alt: 'Peberfrugt California Wonder' },
    ],
    latestActivity: {
      id: 'activity-calwonder',
      plantId: 'peberfrugt-california-wonder',
      plantName: 'Peberfrugt California Wonder',
      action: 'Hærdet af på terrassen',
      when: '5. juni',
      image: '/images/plantekort/peberfrugt-california-wonder.jpg',
    },
    nextAction: {
      id: 'next-calwonder',
      plantId: 'peberfrugt-california-wonder',
      plantName: 'Peberfrugt California Wonder',
      action: 'Plant ud i drivhusbedet',
      timing: 'I denne uge',
    },
    logs: [
      { id: 'log-calwonder-1', date: '2026-03-02', action: 'Sået', note: '3 frø med varme under.' },
      { id: 'log-calwonder-2', date: '2026-04-12', action: 'Pottet om', note: '11 cm potter, alle tre stærke.' },
    ],
    guide: {
      title: 'Blokpeber i drivhus',
      body: 'California Wonder kvitterer for jævn varme og dyb vanding.',
      href: '/guides/peberfrugt-california-wonder',
    },
  },
  {
    id: 'peberfrugt-corno-di-toro-rosso',
    userId: DEMO_USER_ID,
    seedId: 'seed-peberfrugt-corno',
    sourceElementId: 'seed-peberfrugt-corno',
    name: 'Peberfrugt',
    variety: 'Corno di Toro Rosso',
    type: 'Frugtgrøntsag',
    status: 'i_vaekst',
    location: 'Drivhus',
    sowDate: '2026-03-02',
    sownDate: '2026-03-02',
    sproutedDate: '2026-03-16',
    repottedDate: '2026-04-14',
    plantedOutDate: null,
    plantingOutDate: '2026-06-14',
    firstHarvestDate: '2026-08-10',
    expectedHarvestStart: '2026-08-10',
    expectedHarvestEnd: '2026-10-05',
    quantity: 4,
    imageIds: ['/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg'],
    primaryImageId: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg',
    imageSource: 'guide_reference',
    logIds: ['log-corno-1', 'log-corno-2'],
    guideId: 'peberfrugt-corno-di-toro-rosso',
    isArchived: false,
    createdAt: '2026-03-02T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
    notes: 'Lidt langsommere end California Wonder, men sunde planter.',
    pictures: [
      { id: 'corno-img-1', src: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg', alt: 'Peberfrugt Corno di Toro Rosso' },
    ],
    latestActivity: {
      id: 'activity-corno',
      plantId: 'peberfrugt-corno-di-toro-rosso',
      plantName: 'Peberfrugt Corno di Toro Rosso',
      action: 'Pottet om',
      when: '14. april',
      image: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg',
    },
    nextAction: {
      id: 'next-corno',
      plantId: 'peberfrugt-corno-di-toro-rosso',
      plantName: 'Peberfrugt Corno di Toro Rosso',
      action: 'Begynd afhærdning',
      timing: 'Næste uge',
    },
    logs: [
      { id: 'log-corno-1', date: '2026-03-02', action: 'Sået', note: '4 frø med varme under.' },
      { id: 'log-corno-2', date: '2026-04-14', action: 'Pottet om', note: 'Alle fire klarede flytningen.' },
    ],
    guide: {
      title: 'Snackpeber med horn',
      body: 'Corno di Toro vil have varme og tålmodighed — frugterne er det værd.',
      href: '/guides/peberfrugt-corno-di-toro-rosso',
    },
  },

  // ── Lifecycle-demo: planlagt + afsluttet ────────────────────
  // De næste tre planter demonstrerer den stramme Aktive-definition:
  //   Planlagt  → vises som chip-række (Chili Jalapeño, Basilikum)
  //   Afsluttet → vises som "Klar til arkiv" (Hvidløg 2026)
  // Ingen af dem må optræde i Art-rækkerne.
  {
    id: 'chili-jalapeno-planlagt',
    userId: DEMO_USER_ID,
    seedId: 'seed-chili-jalapeno',
    sourceElementId: 'seed-chili-jalapeno',
    name: 'Chili',
    variety: 'Jalapeño',
    type: 'Frugtgrøntsag',
    status: 'planlagt',
    location: null,
    sowDate: null,
    sownDate: null,
    sproutedDate: null,
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: null,
    firstHarvestDate: null,
    expectedHarvestStart: null,
    expectedHarvestEnd: null,
    quantity: 0,
    imageIds: [],
    primaryImageId: null,
    logIds: [],
    guideId: null,
    isArchived: false,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
    notes: 'Anden runde chili — sås når der er plads i vindueskarmen.',
    pictures: [],
    latestActivity: {
      id: 'activity-jalapeno',
      plantId: 'chili-jalapeno-planlagt',
      plantName: 'Chili Jalapeño',
      action: 'Planlagt',
      when: '1. juni',
    },
    nextAction: {
      id: 'next-jalapeno',
      plantId: 'chili-jalapeno-planlagt',
      plantName: 'Chili Jalapeño',
      action: 'Så når der er plads',
      timing: 'Snart',
    },
    logs: [],
    guide: {
      title: 'Jalapeño fra frø',
      body: 'Junisåning er sent for jalapeño. Giv planten så meget varme og lys som muligt, og regn med, at høsten kan blive sen.',
      href: '/guides',
    },
  },
  {
    id: 'basilikum-genovese-planlagt',
    userId: DEMO_USER_ID,
    seedId: 'seed-basilikum-genovese',
    sourceElementId: 'seed-basilikum-genovese',
    name: 'Basilikum',
    variety: 'Genovese',
    type: 'Krydderurt',
    status: 'planlagt',
    location: null,
    sowDate: null,
    sownDate: null,
    sproutedDate: null,
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: null,
    firstHarvestDate: null,
    expectedHarvestStart: null,
    expectedHarvestEnd: null,
    quantity: 0,
    imageIds: [],
    primaryImageId: null,
    logIds: [],
    guideId: null,
    isArchived: false,
    createdAt: '2026-06-04T08:00:00.000Z',
    updatedAt: '2026-06-04T08:00:00.000Z',
    notes: 'Til drivhusets tomat-bed — sås direkte mellem planterne.',
    pictures: [],
    latestActivity: {
      id: 'activity-genovese',
      plantId: 'basilikum-genovese-planlagt',
      plantName: 'Basilikum Genovese',
      action: 'Planlagt',
      when: '4. juni',
    },
    nextAction: {
      id: 'next-genovese',
      plantId: 'basilikum-genovese-planlagt',
      plantName: 'Basilikum Genovese',
      action: 'Så direkte i drivhusbedet',
      timing: 'Denne måned',
    },
    logs: [],
    guide: {
      title: 'Basilikum ved tomater',
      body: 'Klassisk drivhus-makker — skygger jorden og dufter.',
      href: '/guides',
    },
  },
  {
    id: 'hvidloeg-vallelado-2026',
    userId: DEMO_USER_ID,
    seedId: 'seed-hvidloeg-vallelado',
    sourceElementId: 'seed-hvidloeg-vallelado',
    name: 'Hvidløg',
    variety: 'Vallelado',
    type: 'Løg',
    status: 'afsluttet',
    location: 'Højbed øst',
    growingYear: 2026,
    sowDate: '2025-10-12',
    sownDate: '2025-10-12',
    sproutedDate: '2025-11-02',
    repottedDate: null,
    plantedOutDate: null,
    plantingOutDate: null,
    firstHarvestDate: '2026-06-05',
    expectedHarvestStart: '2026-06-01',
    expectedHarvestEnd: '2026-06-20',
    quantity: 24,
    imageIds: [],
    primaryImageId: null,
    logIds: ['log-hvidloeg-1', 'log-hvidloeg-2'],
    guideId: null,
    isArchived: false,
    createdAt: '2025-10-12T08:00:00.000Z',
    updatedAt: '2026-06-05T08:00:00.000Z',
    notes: 'Hele bedet høstet og hængt til tørre. Flot udbytte.',
    pictures: [],
    latestActivity: {
      id: 'activity-hvidloeg',
      plantId: 'hvidloeg-vallelado-2026',
      plantName: 'Hvidløg Vallelado',
      action: 'Høstet — sæsonen er slut',
      when: '5. juni',
    },
    nextAction: {
      id: 'next-hvidloeg',
      plantId: 'hvidloeg-vallelado-2026',
      plantName: 'Hvidløg Vallelado',
      action: 'Gem i Havebogen',
      timing: 'Når du har tid',
    },
    logs: [
      { id: 'log-hvidloeg-1', date: '2025-10-12', action: 'Sat', note: '24 fed i højbed øst.' },
      { id: 'log-hvidloeg-2', date: '2026-06-05', action: 'Høstet', note: 'Alle løg oppe, hænger til tørre i skuret.' },
    ],
    guide: {
      title: 'Hvidløg fra efterår til sommer',
      body: 'Sat i oktober, høstet i juni — den tålmodiges afgrøde.',
      href: '/guides',
    },
  },
]

export const mockPlantActions: MockPlantNextAction[] = mockPlants
  .filter(plant => !plant.isArchived)
  .slice(0, 4)
  .map(plant => ({
    ...plant.nextAction,
    image: plant.primaryImageId,
  }))

export const mockPlantActivities: MockPlantActivity[] = mockPlants
  .map(plant => plant.latestActivity)
  .slice(0, 5)

export const mockPlantTasks: CalendarTask[] = mockPlantActions.map((action, index) => ({
  id: `task-${action.id}`,
  userId: DEMO_USER_ID,
  title: action.action,
  description: action.timing,
  date: `2026-05-${29 + index}`,
  taskType: 'custom',
  priority: index === 0 ? 'high' : 'medium',
  status: 'open',
  source: 'plant',
  sourceId: action.plantId,
  linkedPlantId: action.plantId,
  linkedPlantName: action.plantName,
  linkedPlantVariety: null,
  isRecurring: false,
  createdAt: '2026-05-29T07:00:00.000Z',
  updatedAt: '2026-05-29T07:00:00.000Z',
}))

export function getMockPlantById(id: string): MockPlant | undefined {
  return mockPlants.find(plant => plant.id === id)
}

export function formatPlantDate(date: string | null | undefined): string {
  if (!date) return 'Ikke endnu'
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

/**
 * Map en plante-status til den handlings-chip den hører under.
 * planlagt/afsluttet rammer aldrig denne funktion i praksis (de er
 * udenfor Aktive-bucket'en), men mapper harmløst til 'lige_nu'.
 */
export function statusToFilter(status: PlantStatus): PlantFilterStatus {
  if (status === 'hoestklar') return 'klar_til_hoest'
  if (status === 'klar_til_udplantning') return 'kraever_handling'
  if (status === 'planlagt' || status === 'afsluttet') return 'lige_nu'
  return 'i_vaekst' // saaet, spirer, i_vaekst, udplantet
}

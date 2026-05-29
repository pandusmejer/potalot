import type { CalendarTask, Plant, PlantStatus } from '@/lib/types'

export type PlantFilterStatus =
  | 'alle'
  | 'saaet'
  | 'spirer'
  | 'i_vaekst'
  | 'udplantet'
  | 'hoestklar'

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
  { id: 'alle', label: 'Alle' },
  { id: 'saaet', label: 'Sået' },
  { id: 'spirer', label: 'Spiret' },
  { id: 'i_vaekst', label: 'Ompottet' },
  { id: 'udplantet', label: 'Udplantet' },
  { id: 'hoestklar', label: 'Klar til høst' },
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
    imageIds: ['/images/plantekort/plantekort-tomat-san-marzano.png'],
    primaryImageId: '/images/plantekort/plantekort-tomat-san-marzano.png',
    logIds: ['log-tomat-1', 'log-tomat-2'],
    guideId: 'guide-tomat',
    isArchived: false,
    createdAt: '2026-03-18T08:00:00.000Z',
    updatedAt: '2026-05-28T18:30:00.000Z',
    notes: 'Stærke planter efter ompotning. Hold øje med vanding på solrige dage.',
    pictures: [
      { id: 'tomat-img-1', src: '/images/plantekort/plantekort-tomat-san-marzano.png', alt: 'Tomat San Marzano' },
    ],
    latestActivity: {
      id: 'activity-tomat',
      plantId: 'tomat-san-marzano',
      plantName: 'Tomat San Marzano',
      action: 'Ompottet for 9 dage siden',
      when: '20. april',
      image: '/images/plantekort/plantekort-tomat-san-marzano.png',
    },
    nextAction: {
      id: 'next-tomat',
      plantId: 'tomat-san-marzano',
      plantName: 'Tomat San Marzano',
      action: 'Ompot de største planter',
      timing: 'I denne uge',
    },
    logs: [
      { id: 'log-tomat-1', date: '2026-03-18', action: 'Sået', note: '6 frø i bakke med varme under.' },
      { id: 'log-tomat-2', date: '2026-04-20', action: 'Ompottet', note: 'Flyttet til 11 cm potter.' },
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
    imageIds: ['/images/plantekort/plantekort-agurk-marketmore.png'],
    primaryImageId: '/images/plantekort/plantekort-agurk-marketmore.png',
    logIds: ['log-agurk-1', 'log-agurk-2'],
    guideId: 'guide-agurk',
    isArchived: false,
    createdAt: '2026-05-14T07:30:00.000Z',
    updatedAt: '2026-05-29T07:40:00.000Z',
    notes: 'Spirer hurtigt. Skal ikke stå for vådt omkring rothalsen.',
    pictures: [
      { id: 'agurk-img-1', src: '/images/plantekort/plantekort-agurk-marketmore.png', alt: 'Agurk Marketmore' },
    ],
    latestActivity: {
      id: 'activity-agurk',
      plantId: 'agurk-marketmore',
      plantName: 'Agurk Marketmore',
      action: 'Foto tilføjet',
      when: 'I dag',
      image: '/images/plantekort/plantekort-agurk-marketmore.png',
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
    imageIds: ['/images/plantekort/plantekort-chili-habanero-orange.jpg'],
    primaryImageId: '/images/plantekort/plantekort-chili-habanero-orange.jpg',
    logIds: ['log-chili-1', 'log-chili-2'],
    guideId: 'guide-chili',
    isArchived: false,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-05-29T08:00:00.000Z',
    notes: 'Kompakt vækst. Første blomsterknopper er synlige.',
    pictures: [
      { id: 'chili-img-1', src: '/images/plantekort/plantekort-chili-habanero-orange.jpg', alt: 'Chili Habanero' },
    ],
    latestActivity: {
      id: 'activity-chili',
      plantId: 'chili-habanero',
      plantName: 'Chili Habanero',
      action: 'Spirede i dag',
      when: '22. februar',
      image: '/images/plantekort/plantekort-chili-habanero-orange.jpg',
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
    imageIds: ['/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg'],
    primaryImageId: '/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg',
    logIds: ['log-dahlia-1', 'log-dahlia-2'],
    guideId: 'guide-dahlia',
    isArchived: false,
    createdAt: '2026-04-05T12:00:00.000Z',
    updatedAt: '2026-05-28T17:00:00.000Z',
    notes: 'Hærdet af i skygge. Vent med udplantning ved kolde nætter.',
    pictures: [
      { id: 'dahlia-img-1', src: '/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg', alt: 'Dahlia Cafe au Lait' },
    ],
    latestActivity: {
      id: 'activity-dahlia',
      plantId: 'dahlia-cafe-au-lait',
      plantName: 'Dahlia Café au Lait',
      action: 'Ompottet i går',
      when: 'I går',
      image: '/images/plantekort/plantekort-dahlia-cafe-au-lait.jpg',
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
      { id: 'log-dahlia-2', date: '2026-05-12', action: 'Ompottet', note: 'Fik større potte før afhærdning.' },
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
    name: 'Sukkertært',
    variety: 'Sugar Snap',
    type: 'Bælgplante',
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
    imageIds: ['/images/plantekort/plantekort-sukkeraert-sugar-snap.jpg'],
    primaryImageId: '/images/plantekort/plantekort-sukkeraert-sugar-snap.jpg',
    logIds: ['log-salat-1', 'log-salat-2'],
    guideId: 'guide-salat',
    isArchived: false,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-29T08:20:00.000Z',
    notes: 'Klar til løbende høst af sprøde bælge.',
    pictures: [
      { id: 'sukkeraert-img-1', src: '/images/plantekort/plantekort-sukkeraert-sugar-snap.jpg', alt: 'Sukkertært Sugar Snap' },
    ],
    latestActivity: {
      id: 'activity-salat',
      plantId: 'salat-little-gem',
      plantName: 'Sukkertært Sugar Snap',
      action: 'Klar til høst',
      when: 'I dag',
      image: '/images/plantekort/plantekort-sukkeraert-sugar-snap.jpg',
    },
    nextAction: {
      id: 'next-salat',
      plantId: 'salat-little-gem',
      plantName: 'Sukkertært Sugar Snap',
      action: 'Høst yderblade',
      timing: 'I dag',
    },
    logs: [
      { id: 'log-salat-1', date: '2026-04-01', action: 'Sået', note: 'Direkte i bakke.' },
      { id: 'log-salat-2', date: '2026-05-29', action: 'Høstklar', note: 'Første faste hoveder.' },
    ],
    guide: {
      title: 'Sukkertærter med støtte',
      body: 'Giv planterne støtte tidligt, hold jorden jævnt fugtig og høst bælgene ofte.',
      href: '/guides',
    },
  },
  {
    id: 'stangboenne-neckargold',
    userId: DEMO_USER_ID,
    seedId: 'seed-stangboenne-neckargold',
    sourceElementId: 'seed-stangboenne-neckargold',
    name: 'Stangbønne',
    variety: 'Cobra',
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
    imageIds: ['/images/plantekort/plantekort-stangboenne-cobra.jpg'],
    primaryImageId: '/images/plantekort/plantekort-stangboenne-cobra.jpg',
    logIds: ['log-boenne-1'],
    guideId: 'guide-boenne',
    isArchived: false,
    createdAt: '2026-05-25T09:00:00.000Z',
    updatedAt: '2026-05-25T09:00:00.000Z',
    notes: 'Venter på spiring. Skal have stativ ved udplantning.',
    pictures: [
      { id: 'boenne-img-1', src: '/images/plantekort/plantekort-stangboenne-cobra.jpg', alt: 'Stangbønne Cobra' },
    ],
    latestActivity: {
      id: 'activity-boenne',
      plantId: 'stangboenne-neckargold',
      plantName: 'Stangbønne Cobra',
      action: 'Sået',
      when: '25. maj',
      image: '/images/plantekort/plantekort-stangboenne-cobra.jpg',
    },
    nextAction: {
      id: 'next-boenne',
      plantId: 'stangboenne-neckargold',
      plantName: 'Stangbønne Cobra',
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

export function filterMockPlantsByStatus(plants: MockPlant[], status: PlantFilterStatus): MockPlant[] {
  if (status === 'alle') return plants.filter(plant => !plant.isArchived)
  return plants.filter(plant => !plant.isArchived && statusToFilter(plant.status) === status)
}

export function formatPlantDate(date: string | null | undefined): string {
  if (!date) return 'Ikke endnu'
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

export function statusToFilter(status: PlantStatus): PlantFilterStatus {
  if (status === 'klar_til_udplantning') return 'i_vaekst'
  if (status === 'planlagt' || status === 'afsluttet') return 'alle'
  return status
}

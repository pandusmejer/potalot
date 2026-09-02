/**
 * PotAlot datamodeller (MVP).
 *
 * Alle objekter er designet til at kunne mappes direkte til Supabase/Postgres-tabeller
 * senere. I første version bruges mock data (se mock-data.ts).
 */

// ============================================
// PROFILE / USER
// ============================================

export type UserMode = 'maalrettet' | 'afslappet' | 'minimal'

export interface Profile {
  id: string
  username: string
  email: string
  avatarUrl?: string | null
  userMode: UserMode
  onboarded: boolean
  isAdmin: boolean
  /** Havens placering — til vejr + natur-signaler */
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  /** Onboarding V2-præference (mindful|rolig|aktiv) — null hvis aldrig valgt */
  notificationProfile?: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// FRØBANK: kategorier + elementer
// ============================================

export type PrimaryCategoryId =
  | 'fro'           // Frø
  | 'loeg'          // Løg
  | 'knolde'        // Knolde
  | 'buske'         // Buske
  | 'traeer'        // Træer
  | 'stauder'       // Stauder
  | 'indkoebsliste' // Ønskeliste/indkøb
  | 'favoritter'    // Dynamisk visning, ikke rigtig kategori

export interface PrimaryCategory {
  id: PrimaryCategoryId
  name: string
  icon: string                // lucide-react ikon-navn
  isSystem: true
  /** Favoritter er en dynamisk view — ikke en "rigtig" kategori */
  isDynamic?: boolean
}

export interface Subcategory {
  id: string
  name: string
  /** Hvilke primære kategorier kan denne underkategori bruges under? */
  parentCategoryIds: PrimaryCategoryId[]
  isSystem: boolean
  createdByUserId?: string | null
  createdAt?: string
}

export type InventoryStatus =
  | 'i_froebank'
  | 'planlagt'
  | 'saaet'
  | 'i_jord'
  | 'i_vaekst'
  | 'afsluttet'
  | 'arkiveret'

export type Light = 'full_sun' | 'partial_shade' | 'shade'
export type Water = 'low' | 'regular' | 'high'

export type GrowingLocation =
  | 'vindueskarm'
  | 'drivhus'
  | 'hoejbed'
  | 'friland'
  | 'krukke'
  | 'custom'

export interface InventoryItem {
  id: string
  userId: string

  // Basis
  name: string                          // dansk navn
  latinName?: string | null             // latinsk/botanisk navn
  variety?: string | null
  supplier?: string | null
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string | null
  quantity?: number | null              // legacy: stadig brugt for løg/knolde/stk.

  // Frø-specifikke felter (sektion 12)
  seedCount?: number | null             // antal frø i posen
  seedsSown?: number                    // computed fra sowing_events
  seedsRemaining?: number               // computed: seedCount - seedsSown

  purchaseDate?: string | null
  purchaseYear?: number | null          // ÅÅÅÅ — bruges typisk for frøposer
  purchaseUrl?: string | null           // "købt her"
  expiryDate?: string | null
  notes?: string | null

  // Dyrkning
  sowingMonths: number[]                // 1-12
  sowingDepthMm: number | null          // null = ukendt · 0 = eksplicit overfladesåning
  preCultivation?: boolean | null
  plantingOutMonths: number[]
  harvestMonths: number[]
  light?: Light | null
  water?: Water | null
  soil?: string | null
  germinationTemperature?: string | null
  germinationDays?: string | null
  plantSpacing?: string | null
  rowSpacing?: string | null
  growingLocations: GrowingLocation[]

  // Status
  status: InventoryStatus
  isFavorite: boolean
  isPinned: boolean

  // Relationer
  imageIds: string[]
  primaryImageId?: string | null
  guideId?: string | null
  linkedPlantIds: string[]

  createdAt: string
  updatedAt: string
}

// ============================================
// MINE PLANTER: aktive dyrkninger
// ============================================

export type PlantStatus =
  | 'planlagt'
  | 'saaet'
  | 'spirer'
  | 'i_vaekst'
  | 'klar_til_udplantning'
  | 'udplantet'
  | 'hoestklar'
  | 'afsluttet'

export type PlantImageSource = 'guide_reference' | 'user_upload' | null

export interface Plant {
  id: string
  userId: string
  sourceElementId?: string | null    // InventoryItem der blev sået
  growingYear?: number | null        // bruges til at samle såninger pr. år

  name: string
  variety?: string | null
  status: PlantStatus
  /** Legacy/fallback fritekst-placering. Bevares selv når gardenLocationId er sat. */
  location?: string | null
  /** Kobling til oprettet dyrkningssted (GardenLocation). Null → stedet udledes af location-teksten. */
  gardenLocationId?: string | null
  sowDate?: string | null

  // Metadata arvet fra inventory (kan overrides)
  plantingOutDate?: string | null
  firstHarvestDate?: string | null

  quantity: number                   // total fra alle sowing_events

  // Medier og relationer
  imageIds: string[]
  primaryImageId?: string | null
  imageSource?: PlantImageSource
  logIds: string[]
  guideId?: string | null

  // Arkiv
  isArchived: boolean
  archivedAt?: string | null
  archivedYear?: number | null

  createdAt: string
  updatedAt: string
}

// ============================================
// GARDEN LOCATION — dyrkningssted som rigtig entity
// ============================================
// Indtil persistens-sprinten blev steder udledt af plant.location-strengen.
// GardenLocation gør stedet til noget brugeren kan oprette FØR der er planter
// i det. Plante.gardenLocationId peger hertil; location-teksten er fallback.

export type GardenLocationType =
  | 'Højbed' | 'Drivhus' | 'Krukke' | 'Vindueskarm' | 'Altan' | 'Friland' | 'Andet'

export interface GardenLocation {
  id: string
  userId: string
  name: string
  type: string                       // GardenLocationType, men fri tekst i DB
  imageUrl?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// SOWING EVENTS — flere såninger pr. plante (sektion 13)
// ============================================

export interface SowingEvent {
  id: string
  userId: string
  plantId: string
  inventoryItemId?: string | null
  sownCount: number
  sowingDate: string                   // YYYY-MM-DD
  containerType?: string | null       // Såbakke, Potte, Plugbox, Direkte friland osv.
  location?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type PlantLogType =
  | 'sowing'
  | 'germination'
  | 'repotting'
  | 'planting_out'
  | 'watering'
  | 'fertilizing'
  | 'pruning'
  | 'pest_disease'
  | 'harvest'
  | 'note'
  | 'status_change'
  | 'archive'
  | 'health'              // trivsel — value_text: 'good' | 'okay' | 'attention'
  | 'height_measurement'  // højde — value_numeric i cm

/** Trivsel-enum (value_text på en 'health'-log). UI: God/Nogenlunde/Kræver opmærksomhed. */
export type HealthValue = 'good' | 'okay' | 'attention'

export interface PlantLog {
  id: string
  plantId: string
  userId: string
  date: string                       // YYYY-MM-DD
  type: PlantLogType
  title?: string | null
  note?: string | null
  imageIds: string[]
  /** Måleværdi — højde (cm) nu; temp/pH/fugtighed senere. */
  valueNumeric?: number | null
  /** Enum-tilstand — trivsel ('good'|'okay'|'attention'). */
  valueText?: string | null
  linkedTaskId?: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// HAVEKALENDER
// ============================================

export type TaskType =
  | 'pre_sow'         // forspir
  | 'sowing'          // så
  | 'repot'           // omplant
  | 'plant_out'       // udplant
  | 'watering'
  | 'fertilizing'
  | 'pruning'
  | 'pest_check'
  | 'harvest'
  | 'weeding'
  | 'maintenance'
  | 'planning'
  | 'custom'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'open' | 'completed' | 'skipped'
export type TaskSource = 'manual' | 'inventory' | 'plant' | 'guide' | 'general'

export interface CalendarTask {
  id: string
  userId: string
  title: string
  description?: string | null
  date: string                       // primær dato
  dueDate?: string | null
  taskType: TaskType
  priority: TaskPriority
  status: TaskStatus

  source: TaskSource
  sourceId?: string | null
  linkedPlantId?: string | null
  /** Den linkede plantes navn, beriget af loaderen så TaskRow kan vise det. */
  linkedPlantName?: string | null
  /** Den linkede plantes sort, beriget af loaderen. */
  linkedPlantVariety?: string | null
  linkedInventoryItemId?: string | null
  linkedGuideId?: string | null

  isRecurring: boolean
  recurrenceRule?: string | null
  completedAt?: string | null

  createdAt: string
  updatedAt: string
}

/** Generelle haveopgaver (årshjul, globale på tværs af brugere — admin-styret) */
export interface GeneralGardenTask {
  id: string
  title: string
  description: string
  month: number                      // 1-12
  season?: string | null
  category: string
  priority: TaskPriority
  timeWindow?: string | null
  tip?: string | null
  risk?: string | null
  recurrence: 'yearly' | 'monthly' | 'weekly'
  isActive: boolean
  linkedGuideIds: string[]
  /** True hvis nuværende bruger har skjult denne globale opgave */
  isHiddenByMe?: boolean
  createdAt: string
  updatedAt: string
  // Bagudkompatibilitet med tidligere felter
  sourceType?: 'curated' | 'external'
}

/** Brugerens egne gøremål i årshjulet — kun synlige for brugeren */
export interface UserGardenTask {
  id: string
  userId: string
  title: string
  description: string
  month: number                      // 1-12
  category: string
  priority: TaskPriority
  timeWindow?: string | null
  notifyEnabled: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// DYRKNINGSGUIDES
// ============================================

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GuideLevel = 'species' | 'variety' | 'technique'
export type GuideStatus = 'draft' | 'published' | 'archived'
export type GuideVisibility = 'private' | 'public' | 'system'
export type GuideReviewStatus = 'not_required' | 'pending_review' | 'approved' | 'rejected'

export interface GuideQuickFacts {
  preCultivation?: boolean
  sowingMonths: number[]
  directSowingMonths: number[]
  plantingOutMonths: number[]
  harvestMonths: number[]
  light?: Light
  water?: Water
  soil?: string
  germinationTemperature?: string
  germinationDays?: string
  plantSpacing?: string
  rowSpacing?: string
  sowingDepthMm?: number
  frostSensitive?: boolean
  minimumTemperature?: string

  // Sortsguide-felter (typisk udfyldt på variety, ikke species).
  // Fri tekst i V1 — kan blive enum/struktureret når vi har set
  // 5-10 rigtige sortsguider og kender variansen.
  growthType?: string                // fx 'ranketomat', 'busktomat', 'klatretomat'
  height?: string                    // fx '180-220 cm'
  maturityDays?: string              // fx '80-85 dage' (fra udplantning)
  primaryUse?: string                // fx 'Sauce og madlavning', 'Frisk spisning'
}

/**
 * Sektion på en guide — to varianter.
 *
 * **prose** (default): det editoriale læselag — overskrift + brødtekst.
 *   Format som hidtil; `kind` kan udelades for bagudkompatibilitet med
 *   eksisterende DB-rækker og demo-data.
 *
 * **fact**: et faktakort — illustration i en naturhåndbog. Renderes
 *   som <GuideFactCard>. Indtil videre kun `comparison`-varianten
 *   (to søjler side om side, fx "Ranketomat vs Busktomat").
 *
 * `body?` på fact-varianten findes kun for at admin-editoren (som
 *   redigerer alle sektioner som prose) ikke smider TypeScript-fejl;
 *   feltet ignoreres ved render.
 */
export interface GuideFactColumn {
  heading: string
  items: string[]
}

export interface GuideProseSection {
  kind?: 'prose'
  key: string                        // fx 'intro', 'pre_cultivation'
  title: string
  body: string
}

export interface GuideFactSection {
  kind: 'fact'
  key: string
  title: string
  variant: 'comparison'
  columns: GuideFactColumn[]
  /** Kort intro-linje over kolonnerne (beslutnings-framing). */
  intro?: string
  /** Konklusion under kolonnerne ("X er bedst til …"). */
  conclusion?: string
  body?: string                      // editor-compat; ikke renderet
}

/**
 * `:::guide` — inline teknik-/færdighedskort i brødteksten.
 * Renderes som <GuideTechniqueCard>. Peger på en teknikguide via slug.
 */
export interface GuideTechniqueSection {
  kind: 'guide'
  key: string
  title: string                      // fx 'Sådan opbinder du tomater'
  slug: string                       // → target guide
  description: string
  body?: string                      // editor-compat
}

/**
 * `:::related-guides` — container med flere beslægtede sorter/guides.
 * Renderes som <GuideRelatedList>. Hvert item er en mini-kort-reference.
 */
export interface GuideRelatedItem {
  slug: string
  heading: string                    // #### Navn
  description: string
}

export interface GuideRelatedSection {
  kind: 'related'
  key: string
  title?: string                     // valgfri eyebrow ("Beslægtede sorter")
  items: GuideRelatedItem[]
  body?: string                      // editor-compat
}

/**
 * `:::next-guide` — det redaktionelle "store næste skridt", typisk
 * allersidst på siden. Højst én pr. guide.
 */
export interface GuideNextSection {
  kind: 'next'
  key: string
  title: string                      // fx 'Vælg en sort'
  description: string
  slug: string                       // target guide
  label: string                      // CTA-tekst, fx 'Tomat San Marzano'
  body?: string                      // editor-compat
}

export type GuideSection =
  | GuideProseSection
  | GuideFactSection
  | GuideTechniqueSection
  | GuideRelatedSection
  | GuideNextSection

export interface GuideCalendarRule {
  taskType: TaskType
  title: string
  recommendedMonths?: number[]
  trigger?: 'sowingDate' | 'germinationDate' | 'plantingOutDate'
  /**
   * @deprecated LEGACY (Anna 2/9). Feltet står ikke i guidekontrakten og
   * stammer fra ét eksempel i AI-prompten, som modellen kopierede 54 gange.
   * Det dokumenterede dyrkningsvindue bestemmer datoen; offsettet placerer
   * kun opgaven INDEN I vinduet og kan aldrig flytte den ud af det.
   * Læsestøtte bevares for eksisterende guides — nye må ikke sætte det.
   * Se task-generation.ts og Docs/product/kalenderregel-semantik-audit.md.
   */
  relativeOffsetDays?: number
  condition?: string
  priority: TaskPriority
}

/**
 * Botanisk kendetegn — én række data om planten på artsniveau.
 *
 * V4.3 (§18 i guides.md): artsguidens kerne er ikke fotos, men en
 * strukturel beskrivelse af planten — livsform, højde, bladtype,
 * vækstform, rodsystem, blomster, bestøvning, livscyklus, osv.
 *
 * Bevidst minimal shape: tre felter, ingen enum på label. Vi har
 * ikke set 10 arts-eksempler endnu, og det er tidligt at låse et
 * fast vokabularium. Når mønstret stabiliserer sig, kan label
 * promoveres til en union.
 *
 * `icon` er en valgfri lucide-icon-navn (fx 'Sprout', 'Ruler',
 * 'Flower2'). UI-laget bestemmer hvordan/om ikonet renderes —
 * datalaget kender ikke ikoner.
 *
 * Renderes som inline data (ikon + label + værdi, 5-8 gange på
 * række), ikke en separat designsystem-komponent. UI eksisterer
 * endnu ikke (V4.3 lock).
 */
export interface BotaniskKendetegn {
  icon?: string                      // lucide-icon-navn, valgfri
  label: string                      // fx 'Livsform', 'Vækstform'
  value: string                      // fx 'Etårig (i Danmark)'
}

export interface Guide {
  id: string

  // Identitet
  plantName: string
  /** Kun teknikguider: H1-titlen ("Sådan kniber du tomater"). Art/sort: undefined. */
  title?: string | null
  /** Kun teknikguider: slugs på arter/sorter teknikken hører til (til :::guide). */
  appliesTo?: string[]
  /** Flertalsform til arts-copy ("tomater"). Fallback: plantName i småt. */
  pluralName?: string | null
  variety?: string | null
  latinName?: string | null
  guideLevel: GuideLevel
  parentGuideId?: string | null      // for sortsguide: reference til artsguide

  // Kategorisering (teknikguider har ingen plantekategori → null)
  primaryCategoryId: PrimaryCategoryId | null
  subcategoryId?: string | null

  // Indhold
  summary: string
  difficulty: Difficulty
  tags: string[]
  quickFacts: GuideQuickFacts
  /**
   * Botaniske kendetegn — artsguidens strukturelle data om planten.
   * Typisk udfyldt på species-guider; sortsguider arver fra art.
   * Ingen UI-render i V4.3; feltet er forberedt til V4.4-render.
   */
  botaniskeKendetegn?: BotaniskKendetegn[]
  sections: GuideSection[]
  calendarRules: GuideCalendarRule[]

  // Medier og kilder
  mediaIds: string[]
  primaryImageId?: string | null
  sourceLinks: string[]

  // Admin
  status: GuideStatus
  visibility: GuideVisibility
  reviewStatus: GuideReviewStatus

  // Moderation
  flaggedAt?: string | null
  flaggedReason?: string | null
  deleteAt?: string | null

  createdAt: string
  updatedAt: string
}

// ============================================
// COMMUNITY
// ============================================

export interface CommunityGroup {
  id: string
  title: string
  description?: string | null
  /** fx 'jalapeno', 'chili' */
  slug: string
  /** Niveau: specifik plante eller kategori/tema */
  groupLevel: 'plant' | 'category' | 'theme'
  linkedPlantName?: string | null
  linkedCategoryId?: string | null
  memberCount: number
  isReadOnly: boolean                // read-only indtil moderator findes
  createdAt: string
  updatedAt: string
}

export interface CommunityMembership {
  id: string
  groupId: string
  userId: string
  role: 'member' | 'moderator'
  invitedAt?: string | null
  joinedAt?: string | null
  declinedAt?: string | null
  createdAt: string
}

// ============================================
// IDÉTAVLE
// ============================================

export interface Idea {
  id: string
  userId: string
  title: string
  description?: string | null
  imageIds: string[]
  tags: string[]
  status: 'idea' | 'planning' | 'in_progress' | 'done' | 'abandoned'
  targetYear?: number | null
  createdAt: string
  updatedAt: string
}

// ============================================
// MEDIA (simpel reference-struktur)
// ============================================

export interface MediaAsset {
  id: string
  userId?: string | null
  url: string                        // Supabase Storage URL
  altText?: string | null
  mimeType: string
  sourceType: 'user_upload' | 'system_placeholder' | 'seed_packet_scan'
  createdAt: string
}

// ============================================
// NOTIFIKATIONER & PROGRESS
// ============================================

export interface NotificationPreference {
  userId: string
  pushEnabled: boolean
  dailyDigestEnabled: boolean
  criticalOnly: boolean
  quietHours: { start: string; end: string } | null
}

export interface ProgressState {
  userId: string
  period: string                     // fx "2026-04"
  completedTasks: number
  totalTasks: number
  criticalTasksCompleted: number
  criticalTasksTotal: number
  /** fx "basket_60_percent", "plant_seedling", "plant_mature" */
  visualState: string
}

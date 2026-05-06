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
  sowingDepthMm: number                 // 0 = overfladen (altid udfyldt)
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

export interface Plant {
  id: string
  userId: string
  sourceElementId?: string | null    // InventoryItem der blev sået
  growingYear?: number | null        // bruges til at samle såninger pr. år

  name: string
  variety?: string | null
  status: PlantStatus
  location?: string | null
  sowDate?: string | null

  // Metadata arvet fra inventory (kan overrides)
  plantingOutDate?: string | null
  firstHarvestDate?: string | null

  quantity: number                   // total fra alle sowing_events

  // Medier og relationer
  imageIds: string[]
  primaryImageId?: string | null
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

export interface PlantLog {
  id: string
  plantId: string
  userId: string
  date: string                       // YYYY-MM-DD
  type: PlantLogType
  title?: string | null
  note?: string | null
  imageIds: string[]
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
export type GuideLevel = 'species' | 'variety'
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
}

export interface GuideSection {
  key: string                        // fx 'intro', 'pre_cultivation'
  title: string
  body: string
}

export interface GuideCalendarRule {
  taskType: TaskType
  title: string
  recommendedMonths?: number[]
  trigger?: 'sowingDate' | 'germinationDate' | 'plantingOutDate'
  relativeOffsetDays?: number
  condition?: string
  priority: TaskPriority
}

export interface Guide {
  id: string

  // Identitet
  plantName: string
  variety?: string | null
  latinName?: string | null
  guideLevel: GuideLevel
  parentGuideId?: string | null      // for sortsguide: reference til artsguide

  // Kategorisering
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string | null

  // Indhold
  summary: string
  difficulty: Difficulty
  tags: string[]
  quickFacts: GuideQuickFacts
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

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro' | 'premium'
  created_at: string
  updated_at: string
}

export interface PlantGuide {
  id: string
  slug: string
  name_da: string
  name_en: string | null
  category: 'groentsager' | 'stauder' | 'krydderurter' | 'graesser' | 'traeer' | 'buske' | 'frugt' | 'baer' | 'blomster_1aarige' | 'blomster_fleraarige'
  description: string | null
  sow_indoor_start: string | null
  sow_indoor_end: string | null
  sow_outdoor_start: string | null
  sow_outdoor_end: string | null
  prick_out_weeks_after_sow: number | null
  plant_out_start: string | null
  plant_out_end: string | null
  harvest_start: string | null
  harvest_end: string | null
  days_to_germination_min: number | null
  days_to_germination_max: number | null
  days_to_harvest_min: number | null
  days_to_harvest_max: number | null
  spacing_cm: number | null
  depth_mm: number
  sun_requirement: 'full_sun' | 'partial_shade' | 'shade' | null
  water_need: 'low' | 'medium' | 'high' | null
  frost_hardy: boolean
  tips: string | null
  companion_plants: string[] | null
  sowing_info: string | null
  repotting_info: string | null
  planting_out_info: string | null
  care_info: string | null
  environment_info: string | null
  biology_info: string | null
  seed_type: string | null
  seed_harvest_possible: boolean | null
  common_mistakes: string | null
  warnings: string | null
  image_url: string | null
  user_notes: string | null
  botanical_name: string | null
  user_images: string[]
  created_automatically: boolean
  created_at: string
}

export interface Seed {
  id: string
  user_id: string
  guide_id: string | null
  // Phase 1 (relaunch): variety_id supersedes inline name/variety/botanical_name
  variety_id: string | null
  parent_plant_id: string | null
  name: string
  variety: string | null
  brand: string | null
  quantity: number | null
  year_purchased: number | null
  expiry_year: number | null
  expiry_date: string | null
  seeds_total: number | null
  seeds_sown: number | null
  primary_category: string
  subcategory: string | null
  plant_type: string | null
  botanical_name: string | null
  purchase_url: string | null
  location: string | null
  germination_rate: number | null
  image_url: string | null
  extra_images: string[]
  is_favorite: boolean
  is_pinned: boolean
  notes: string | null
  status: 'in_stock' | 'sown' | 'depleted' | 'expired'
  created_at: string
  updated_at: string
  guide?: PlantGuide | null
  variety_ref?: Variety | null
}

export interface SeedSubcategory {
  id: string
  user_id: string
  primary_category: string
  name: string
  created_at: string
}

export interface Plant {
  id: string
  user_id: string
  seed_id: string | null
  guide_id: string | null
  // Phase 1 (relaunch): variety_id, garden_id, placering_id, livscyklus
  variety_id: string | null
  garden_id: string | null
  placering_id: string | null
  livscyklus: Livscyklus
  name: string
  variety: string | null
  status: 'planned' | 'sown' | 'germinated' | 'pricked' | 'hardening' | 'planted_out' | 'growing' | 'flowering' | 'harvesting' | 'done' | 'dead'
  location: string | null
  sow_date: string | null
  germination_date: string | null
  prick_date: string | null
  plant_out_date: string | null
  first_harvest_date: string | null
  last_harvest_date: string | null
  quantity: number
  notes: string | null
  created_at: string
  updated_at: string
  guide?: PlantGuide | null
  seed?: Seed | null
  variety_ref?: Variety | null
  garden?: Garden | null
  placering?: Placering | null
  events?: PlantEvent[]
}

// ============================================
// Phase 1 (relaunch): Foundation entities
// ============================================

export type Livscyklus =
  | 'i_froebank'
  | 'planlagt'
  | 'soet'
  | 'spiret'
  | 'priklet'
  | 'udplantet'
  | 'i_vaekst'
  | 'afsluttet'

export type Exposure = 'indendoers' | 'altan' | 'friland' | 'drivhus' | 'tunnel' | 'andet'
export type LightLevel = 'lidt' | 'noget' | 'meget'

export type EventType =
  | 'soet'
  | 'spiret'
  | 'priklet'
  | 'udplantet'
  | 'vandet'
  | 'goedet'
  | 'flyttet'
  | 'beskaaret'
  | 'hoestet'
  | 'afsluttet'
  | 'note'
  | 'foto'

export type AfsluttetAarsag =
  | 'frost'
  | 'sygdom'
  | 'toerke'
  | 'skadedyr'
  | 'faerdig'
  | 'gemt_til_froe'
  | 'ukendt'

export type IllustrationSource = 'flora_danica' | 'ai_generated' | 'user_upload'

export interface Garden {
  id: string
  user_id: string
  name: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Placering {
  id: string
  garden_id: string
  user_id: string
  name: string
  template: string | null
  exposure: Exposure | null
  heated: boolean
  min_temp_c: number | null
  light_level: LightLevel | null
  sheltered: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Variety {
  id: string
  user_id: string | null
  species_name: string
  variety_name: string | null
  botanical_name: string | null
  guide_id: string | null
  illustration_url: string | null
  illustration_source: IllustrationSource | null
  illustration_approved: boolean
  notes: string | null
  created_at: string
  updated_at: string
  guide?: PlantGuide | null
}

export interface PlantEvent {
  id: string
  plant_id: string
  user_id: string
  event_type: EventType
  event_date: string
  event_time: string
  data: Record<string, unknown>
  notes: string | null
  photo_urls: string[] | null
  auto_generated: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  plant_id: string | null
  guide_id: string | null
  title: string
  description: string | null
  task_type: 'sow' | 'water' | 'fertilize' | 'prick_out' | 'harden_off' | 'plant_out' | 'harvest' | 'prune' | 'pest_check' | 'custom'
  due_date: string
  completed_at: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  priority: 'low' | 'medium' | 'high'
  created_at: string
  plant?: Plant | null
}

export interface Note {
  id: string
  user_id: string
  plant_id: string | null
  guide_id: string | null
  title: string
  content: string
  tags: string[] | null
  season_year: number | null
  note_date: string
  created_at: string
  updated_at: string
  plant?: Plant | null
  guide?: PlantGuide | null
}

export interface Season {
  id: string
  user_id: string
  year: number
  name: string | null
  start_date: string | null
  end_date: string | null
  summary: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  push_enabled: boolean
  push_subscription: Record<string, unknown> | null
  daily_reminder_time: string
  remind_task_due: boolean
  remind_days_before: number
  remind_watering: boolean
  created_at: string
  updated_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  title: string | null
  messages: AiMessage[]
  context_plant_ids: string[] | null
  created_at: string
  updated_at: string
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ============================================
// Phase 8 (relaunch): Community
// ============================================

export interface CommunityProfile {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  location_general: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityGroup {
  id: string
  variety_id: string | null
  species_name: string
  variety_name: string | null
  title: string
  description: string | null
  member_count: number
  threshold_reached: boolean
  is_read_only: boolean
  created_at: string
  updated_at: string
}

export interface CommunityMembership {
  id: string
  group_id: string
  user_id: string
  role: 'member' | 'moderator'
  invited_at: string
  joined_at: string | null
  declined_at: string | null
  created_at: string
}

export interface CommunityPost {
  id: string
  group_id: string
  user_id: string
  title: string | null
  content: string
  photo_urls: string[] | null
  post_type: 'text' | 'question' | 'tip' | 'photo' | 'info'
  is_hidden: boolean
  pinned: boolean
  references_plant_id: string | null
  created_at: string
  updated_at: string
}

export interface ChangeRequest {
  id: string
  description: string
  details: string | null
  category: 'content' | 'design' | 'feature' | 'bug'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'done' | 'rejected'
  requested_by: string
  created_at: string
  updated_at: string
}

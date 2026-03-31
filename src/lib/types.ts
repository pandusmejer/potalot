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
  category: 'froe' | 'loeg' | 'knolde' | 'buske' | 'traeer' | 'stauder'
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
  depth_cm: number | null
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

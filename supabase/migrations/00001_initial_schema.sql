-- PotAlot: Initial database schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PLANT GUIDES (shared, seeded data)
-- ============================================
CREATE TABLE public.plant_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_da TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('vegetable', 'herb', 'flower', 'fruit')),
  description TEXT,
  sow_indoor_start TEXT,
  sow_indoor_end TEXT,
  sow_outdoor_start TEXT,
  sow_outdoor_end TEXT,
  prick_out_weeks_after_sow INT,
  plant_out_start TEXT,
  plant_out_end TEXT,
  harvest_start TEXT,
  harvest_end TEXT,
  days_to_germination_min INT,
  days_to_germination_max INT,
  days_to_harvest_min INT,
  days_to_harvest_max INT,
  spacing_cm INT,
  depth_cm NUMERIC(4,1),
  sun_requirement TEXT CHECK (sun_requirement IN ('full_sun', 'partial_shade', 'shade')),
  water_need TEXT CHECK (water_need IN ('low', 'medium', 'high')),
  frost_hardy BOOLEAN DEFAULT false,
  tips TEXT,
  companion_plants TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.plant_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guides readable by authenticated" ON public.plant_guides
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- SEEDS (user inventory)
-- ============================================
CREATE TABLE public.seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES public.plant_guides(id),
  name TEXT NOT NULL,
  variety TEXT,
  brand TEXT,
  quantity INT,
  year_purchased INT,
  expiry_year INT,
  notes TEXT,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sown', 'depleted')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own seeds" ON public.seeds FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PLANTS (active growing)
-- ============================================
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed_id UUID REFERENCES public.seeds(id) ON DELETE SET NULL,
  guide_id UUID REFERENCES public.plant_guides(id),
  name TEXT NOT NULL,
  variety TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned', 'sown', 'germinated', 'pricked', 'hardening',
    'planted_out', 'growing', 'flowering', 'harvesting', 'done', 'dead'
  )),
  location TEXT,
  sow_date DATE,
  germination_date DATE,
  prick_date DATE,
  plant_out_date DATE,
  first_harvest_date DATE,
  last_harvest_date DATE,
  quantity INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plants" ON public.plants FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TASKS (calendar items)
-- ============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES public.plant_guides(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'sow', 'water', 'fertilize', 'prick_out', 'harden_off',
    'plant_out', 'harvest', 'prune', 'pest_check', 'custom'
  )),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_due ON public.tasks(user_id, due_date) WHERE completed_at IS NULL;

-- ============================================
-- NOTES (learning journal)
-- ============================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
  guide_id UUID REFERENCES public.plant_guides(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  season_year INT,
  note_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SEASONS
-- ============================================
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  name TEXT,
  start_date DATE,
  end_date DATE,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, year)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own seasons" ON public.seasons FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  daily_reminder_time TIME DEFAULT '08:00',
  remind_task_due BOOLEAN DEFAULT true,
  remind_days_before INT DEFAULT 1,
  remind_watering BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- AI CONVERSATIONS
-- ============================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context_plant_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

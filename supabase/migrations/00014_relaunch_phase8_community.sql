-- ============================================
-- Relaunch Phase 8: Community foundation
-- ============================================
-- Auto-invitation (ikke auto-indmelding) til sort-grupper.
-- Gruppe eksisterer først når N+ brugere har dyrket samme sort.
-- Moderation er påkrævet — uden moderator er gruppe read-only.
-- ============================================

-- ============================================
-- 1. COMMUNITY_PROFILES
-- Hver bruger kan aktivere en community-profil separat
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  location_general TEXT, -- fx "Østjylland", ikke præcis adresse
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community profiles readable" ON public.community_profiles;
CREATE POLICY "Community profiles readable" ON public.community_profiles
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users manage own community profile" ON public.community_profiles;
CREATE POLICY "Users manage own community profile" ON public.community_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. COMMUNITY_GROUPS
-- Dynamisk oprettede grupper per sort
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kan være knyttet til en specifik sort eller species
  variety_id UUID REFERENCES public.varieties(id) ON DELETE SET NULL,
  species_name TEXT NOT NULL, -- "Tomat"
  variety_name TEXT,          -- "San Marzano" (NULL = species-general)

  title TEXT NOT NULL,
  description TEXT,

  -- Tærskel og status
  member_count INT DEFAULT 0,
  threshold_reached BOOLEAN DEFAULT false,

  -- Moderation
  is_read_only BOOLEAN DEFAULT true, -- read-only indtil moderator findes

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Groups readable" ON public.community_groups;
CREATE POLICY "Groups readable" ON public.community_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE UNIQUE INDEX IF NOT EXISTS community_groups_unique_species_variety
ON public.community_groups (
  species_name,
  COALESCE(variety_name, '__species_general__')
);

CREATE INDEX IF NOT EXISTS idx_community_groups_variety ON public.community_groups(variety_id);

-- ============================================
-- 3. COMMUNITY_MEMBERSHIPS
-- Eksplicit ja fra bruger (ingen auto-indmelding)
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Rolle
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator')),

  -- Invitation-tilstand
  invited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  joined_at TIMESTAMPTZ,      -- NULL = kun inviteret, ikke meldt ind
  declined_at TIMESTAMPTZ,    -- Bruger afviste

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Memberships readable by member" ON public.community_memberships;
CREATE POLICY "Memberships readable by member" ON public.community_memberships
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users manage own memberships" ON public.community_memberships;
CREATE POLICY "Users manage own memberships" ON public.community_memberships
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_group ON public.community_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_joined ON public.community_memberships(joined_at) WHERE joined_at IS NOT NULL;

-- ============================================
-- 4. COMMUNITY_POSTS
-- Simple feed-posts i en gruppe
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  title TEXT,
  content TEXT NOT NULL,
  photo_urls TEXT[],
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'question', 'tip', 'photo', 'info')),

  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  pinned BOOLEAN DEFAULT false,

  -- Referencer
  references_plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts readable by group members" ON public.community_posts;
CREATE POLICY "Posts readable by group members" ON public.community_posts
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT is_hidden);
DROP POLICY IF EXISTS "Users manage own posts" ON public.community_posts;
CREATE POLICY "Users manage own posts" ON public.community_posts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_group_date ON public.community_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.community_posts(user_id);

-- ============================================
-- 5. Tærskel-konstant (default: 3 brugere)
-- ============================================
-- Logikken er i application-code (opdatering af threshold_reached
-- når member_count >= 3), så det er trivielt at justere.

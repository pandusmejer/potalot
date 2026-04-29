-- ============================================================
-- Real auth migration: drop demo data, add username, tighten RLS
-- ============================================================
-- Skifter fra demo-mode (single DEMO_USER_ID + service role) til ægte
-- multi-user auth via Supabase Auth. Hver brugers data isoleres via
-- auth.uid() = user_id i policies. Service role bruges fortsat fra server
-- actions hvor nødvendigt — men de eq('user_id', currentUserId) eksplicit.
-- ============================================================

-- 1) Slet alt demo-data
DELETE FROM public.calendar_tasks       WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.plant_logs_v2        WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.plants_v2            WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.inventory_items      WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.custom_subcategories WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.ideas                WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.profiles             WHERE id      = '00000000-0000-0000-0000-000000000001';
-- Sletning fra auth.users sker via Supabase dashboard — kan ikke gøres via SQL i denne kontekst.

-- 2) Profile: tilføj unikt brugernavn til community
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username CITEXT;

-- Sikre at citext-extension er aktiv (case-insensitive unik)
CREATE EXTENSION IF NOT EXISTS citext;

-- Unique index (case-insensitive via citext)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles(username)
  WHERE username IS NOT NULL;

-- Brugernavn-format-check: 3-20 tegn, kun a-z 0-9 _
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

-- 3) Stram RLS-policies så hver bruger kun ser egne data
-- (tidligere var alle USING (true) — kun OK i demo-mode med service role)

-- profiles: read egen + insert egen + update egen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- For unik-tjek af brugernavn under onboarding tillader vi anonym SELECT
-- på username-kolonnen via en RPC (defineret nedenfor) — ikke direkte tabel-SELECT.

-- inventory_items
DROP POLICY IF EXISTS "inventory all" ON public.inventory_items;
CREATE POLICY "inventory rw own" ON public.inventory_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- custom_subcategories
DROP POLICY IF EXISTS "custom_subcategories all" ON public.custom_subcategories;
CREATE POLICY "custom_subcategories rw own" ON public.custom_subcategories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- plants_v2
DROP POLICY IF EXISTS "plants_v2 all" ON public.plants_v2;
CREATE POLICY "plants_v2 rw own" ON public.plants_v2
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- plant_logs_v2
DROP POLICY IF EXISTS "plant_logs_v2 all" ON public.plant_logs_v2;
CREATE POLICY "plant_logs_v2 rw own" ON public.plant_logs_v2
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- calendar_tasks
DROP POLICY IF EXISTS "calendar_tasks all" ON public.calendar_tasks;
CREATE POLICY "calendar_tasks rw own" ON public.calendar_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ideas
DROP POLICY IF EXISTS "ideas all" ON public.ideas;
CREATE POLICY "ideas rw own" ON public.ideas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) Storage: kun auth users må uploade/slette i media-bucket
DROP POLICY IF EXISTS "media: insert for all" ON storage.objects;
DROP POLICY IF EXISTS "media: delete for all" ON storage.objects;
CREATE POLICY "media: insert auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "media: delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5) RPC til username-tilgængelighedstjek (bruges fra onboarding før login er færdig)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username::citext
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

-- 6) Auto-opret profile-row når en ny user signer up (eksisterer allerede fra 00001
--    men opdater så den også sætter onboarded=false som standard)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, onboarded)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

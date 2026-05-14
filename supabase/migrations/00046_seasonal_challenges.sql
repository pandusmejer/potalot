-- ============================================================
-- Sæson-challenges (system-niveau, ikke gruppe-bundne)
-- ============================================================
-- Tidsbegrænsede events der typisk varer en måned, defineret af PotAlot,
-- synlige for alle brugere. Eksempler: 'Forspirings-marts', 'Tomatmaj',
-- 'Sneglefri uge'.
--
-- Implementering: udvider eksisterende challenges-tabel med en
-- 'challenge_type'-skelnen frem for at lave en separat tabel. Holder
-- challenge_entries-modellen intakt så bidrag-flow er ens for begge
-- typer challenges.
-- ============================================================

-- Tillad NULL på group_id (seasonal har ingen gruppe)
ALTER TABLE public.challenges ALTER COLUMN group_id DROP NOT NULL;

-- Tillad NULL på created_by (system-genererede har ingen author)
ALTER TABLE public.challenges ALTER COLUMN created_by DROP NOT NULL;

-- Nye kolonner
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'group',
  ADD COLUMN IF NOT EXISTS seasonal_id TEXT,
  ADD COLUMN IF NOT EXISTS reward_badge_id TEXT;

-- Constraint: type skal være kendt værdi
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenge_type_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenge_type_check CHECK (challenge_type IN ('group', 'seasonal'));

-- Constraint: konsistens mellem type + group_id + seasonal_id + created_by
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_consistency_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_consistency_check CHECK (
    (challenge_type = 'group' AND group_id IS NOT NULL AND created_by IS NOT NULL)
    OR
    (challenge_type = 'seasonal' AND group_id IS NULL AND seasonal_id IS NOT NULL)
  );

-- Idempotens-nøgle for seasonal: 'tomatmaj-2026'
CREATE UNIQUE INDEX IF NOT EXISTS uniq_seasonal_challenges_id
  ON public.challenges(seasonal_id) WHERE seasonal_id IS NOT NULL;

-- ============================================================
-- RLS: opdater til at håndtere både group og seasonal
-- ============================================================

DROP POLICY IF EXISTS "challenges select if member or open" ON public.challenges;
DROP POLICY IF EXISTS "challenges select" ON public.challenges;
CREATE POLICY "challenges select" ON public.challenges
  FOR SELECT USING (
    -- Sæson-challenges synlige for alle authenticated
    (challenge_type = 'seasonal' AND auth.uid() IS NOT NULL)
    OR
    -- Gruppe-challenges synlige for medlemmer eller offentlige grupper
    (challenge_type = 'group' AND (
      public.is_group_member(group_id)
      OR EXISTS (
        SELECT 1 FROM public.user_groups g
        WHERE g.id = challenges.group_id
          AND g.group_type = 'interest' AND g.visibility = 'open'
      )
    ))
  );

DROP POLICY IF EXISTS "challenges insert by owner" ON public.challenges;
DROP POLICY IF EXISTS "challenges insert" ON public.challenges;
CREATE POLICY "challenges insert" ON public.challenges
  FOR INSERT WITH CHECK (
    -- Sæson-challenges: kun via SECURITY DEFINER-RPC (denne policy fanger ikke direkte insert)
    (challenge_type = 'seasonal' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ))
    OR
    -- Gruppe-challenges som før
    (challenge_type = 'group'
      AND created_by = auth.uid()
      AND public.is_group_owner(group_id)
    )
  );

DROP POLICY IF EXISTS "challenges update by creator or owner" ON public.challenges;
CREATE POLICY "challenges update by creator or owner" ON public.challenges
  FOR UPDATE USING (
    -- Sæson kun af admin
    (challenge_type = 'seasonal' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ))
    OR
    -- Gruppe som før
    (challenge_type = 'group' AND (
      created_by = auth.uid() OR public.is_group_owner(group_id)
    ))
  );

DROP POLICY IF EXISTS "challenges delete by creator or owner" ON public.challenges;
CREATE POLICY "challenges delete by creator or owner" ON public.challenges
  FOR DELETE USING (
    (challenge_type = 'seasonal' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ))
    OR
    (challenge_type = 'group' AND (
      created_by = auth.uid() OR public.is_group_owner(group_id)
    ))
  );

-- ============================================================
-- Challenge_entries: tillad seasonal-bidrag
-- ============================================================

DROP POLICY IF EXISTS "challenge_entries select if can read challenge" ON public.challenge_entries;
DROP POLICY IF EXISTS "challenge_entries select" ON public.challenge_entries;
CREATE POLICY "challenge_entries select" ON public.challenge_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (
          c.challenge_type = 'seasonal'
          OR public.is_group_member(c.group_id)
          OR EXISTS (
            SELECT 1 FROM public.user_groups g
            WHERE g.id = c.group_id AND g.group_type = 'interest' AND g.visibility = 'open'
          )
        )
    )
  );

DROP POLICY IF EXISTS "challenge_entries insert by member" ON public.challenge_entries;
DROP POLICY IF EXISTS "challenge_entries insert" ON public.challenge_entries;
CREATE POLICY "challenge_entries insert" ON public.challenge_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (c.ends_at IS NULL OR c.ends_at > now())
        AND (
          c.challenge_type = 'seasonal'
          OR public.is_group_member(c.group_id)
        )
    )
  );

-- ============================================================
-- ensure_seasonal_challenge: SECURITY DEFINER-RPC
-- Inserter en sæson-challenge idempotent (returns id selv hvis findes).
-- Kaldes fra server actions for at sikre at månedens challenges
-- eksisterer i DB inden de vises.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_seasonal_challenge(
  p_seasonal_id TEXT,
  p_title TEXT,
  p_description TEXT,
  p_prompt TEXT,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_reward_badge_id TEXT DEFAULT NULL,
  p_cover_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Ikke logget ind';
  END IF;

  -- Forsøg insert; hvis seasonal_id allerede findes, return eksisterende id
  INSERT INTO public.challenges (
    challenge_type, seasonal_id, group_id, title, description, prompt,
    starts_at, ends_at, reward_badge_id, cover_image_url, created_by
  )
  VALUES (
    'seasonal', p_seasonal_id, NULL, p_title, p_description, p_prompt,
    p_starts_at, p_ends_at, p_reward_badge_id, p_cover_image_url, NULL
  )
  ON CONFLICT (seasonal_id) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.challenges WHERE seasonal_id = p_seasonal_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_seasonal_challenge(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_seasonal_challenge(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

-- ============================================================
-- Challenges i grupper
-- ============================================================
-- Tidsbegrænsede udfordringer — fx "Vis dit chili-dyrkning",
-- "Bedste høst-billede", "Spir flest frø i februar". Medlemmer kan
-- deltage ved at indsende et bidrag (titel/note + valgfrit billede).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,                                              -- hvad skal man indsende
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_group_active ON public.challenges(group_id, ends_at);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges select if member or open" ON public.challenges;
CREATE POLICY "challenges select if member or open" ON public.challenges
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR EXISTS (
      SELECT 1 FROM public.user_groups g
      WHERE g.id = challenges.group_id
        AND g.group_type = 'interest' AND g.visibility = 'open'
    )
  );

-- Kun gruppe-ejere kan oprette challenges (forhindrer spam)
DROP POLICY IF EXISTS "challenges insert by owner" ON public.challenges;
CREATE POLICY "challenges insert by owner" ON public.challenges
  FOR INSERT WITH CHECK (
    public.is_group_owner(group_id) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "challenges update by creator or owner" ON public.challenges;
CREATE POLICY "challenges update by creator or owner" ON public.challenges
  FOR UPDATE USING (
    created_by = auth.uid() OR public.is_group_owner(group_id)
  );

DROP POLICY IF EXISTS "challenges delete by creator or owner" ON public.challenges;
CREATE POLICY "challenges delete by creator or owner" ON public.challenges
  FOR DELETE USING (
    created_by = auth.uid() OR public.is_group_owner(group_id)
  );

-- ============================================================
-- challenge_entries: deltagernes bidrag
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (caption IS NOT NULL AND length(trim(caption)) > 0)
    OR image_url IS NOT NULL
  )
);

-- Bruger må kun have ét aktivt bidrag pr. challenge (kan slettes og indsendes igen)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_challenge_entries_per_user
  ON public.challenge_entries(challenge_id, user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge
  ON public.challenge_entries(challenge_id, created_at DESC);

ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;

-- Læs hvis man kan se challenge'en
DROP POLICY IF EXISTS "challenge_entries select if can read challenge" ON public.challenge_entries;
CREATE POLICY "challenge_entries select if can read challenge" ON public.challenge_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (
          public.is_group_member(c.group_id)
          OR EXISTS (
            SELECT 1 FROM public.user_groups g
            WHERE g.id = c.group_id AND g.group_type = 'interest' AND g.visibility = 'open'
          )
        )
    )
  );

DROP POLICY IF EXISTS "challenge_entries insert by member" ON public.challenge_entries;
CREATE POLICY "challenge_entries insert by member" ON public.challenge_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_group_member(c.group_id)
        AND (c.ends_at IS NULL OR c.ends_at > now())
    )
  );

DROP POLICY IF EXISTS "challenge_entries update by author" ON public.challenge_entries;
CREATE POLICY "challenge_entries update by author" ON public.challenge_entries
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "challenge_entries delete by author or group owner" ON public.challenge_entries;
CREATE POLICY "challenge_entries delete by author or group owner" ON public.challenge_entries
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_group_owner(c.group_id)
    )
  );

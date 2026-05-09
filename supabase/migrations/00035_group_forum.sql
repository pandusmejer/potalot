-- ============================================================
-- Slice C: Forum i interessegrupper
-- ============================================================
-- Strukturerede opslag med type (spørgsmål, tip, erfaring, problem,
-- frøbytte, billede, guide), kategori, kommentarer og bedste-svar.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'question' CHECK (post_type IN (
    'question', 'tip', 'experience', 'problem', 'seed_swap', 'image', 'guide'
  )),
  category TEXT NOT NULL DEFAULT 'generelt' CHECK (category IN (
    'generelt', 'begyndere', 'spiring', 'lys_varme', 'sorter',
    'sygdomme', 'froebytte', 'vis_dyrkning', 'hoest'
  )),
  title TEXT NOT NULL,
  body TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  best_reply_id UUID,
  reply_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_group_pinned_activity
  ON public.forum_posts(group_id, is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category
  ON public.forum_posts(group_id, category);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Læse: medlemmer ELLER hvis gruppen er åben interessegruppe (alle der kan
-- discoverer den kan læse forum). Closed/hidden kræver medlemskab.
DROP POLICY IF EXISTS "forum_posts select if member or open" ON public.forum_posts;
CREATE POLICY "forum_posts select if member or open" ON public.forum_posts
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR EXISTS (
      SELECT 1 FROM public.user_groups g
      WHERE g.id = forum_posts.group_id
        AND g.group_type = 'interest' AND g.visibility = 'open'
    )
  );

-- Insert: kun medlemmer (gælder også for åbne interessegrupper)
DROP POLICY IF EXISTS "forum_posts insert by member" ON public.forum_posts;
CREATE POLICY "forum_posts insert by member" ON public.forum_posts
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id) AND user_id = auth.uid()
  );

-- Update: forfatteren kan redigere; ejer kan moderere (pin/lock)
DROP POLICY IF EXISTS "forum_posts update by author or owner" ON public.forum_posts;
CREATE POLICY "forum_posts update by author or owner" ON public.forum_posts
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_group_owner(group_id)
  );

-- Delete: forfatter eller ejer
DROP POLICY IF EXISTS "forum_posts delete by author or owner" ON public.forum_posts;
CREATE POLICY "forum_posts delete by author or owner" ON public.forum_posts
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_group_owner(group_id)
  );

-- ============================================================
-- forum_replies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post_created
  ON public.forum_replies(post_id, created_at);

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Læs: samme regler som forum_posts (via JOIN)
DROP POLICY IF EXISTS "forum_replies select if can read post" ON public.forum_replies;
CREATE POLICY "forum_replies select if can read post" ON public.forum_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id
        AND (
          public.is_group_member(p.group_id)
          OR EXISTS (
            SELECT 1 FROM public.user_groups g
            WHERE g.id = p.group_id
              AND g.group_type = 'interest' AND g.visibility = 'open'
          )
        )
    )
  );

-- Insert: medlem af gruppen
DROP POLICY IF EXISTS "forum_replies insert by member" ON public.forum_replies;
CREATE POLICY "forum_replies insert by member" ON public.forum_replies
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND public.is_group_member(p.group_id) AND p.is_locked = false
    )
  );

DROP POLICY IF EXISTS "forum_replies update by author" ON public.forum_replies;
CREATE POLICY "forum_replies update by author" ON public.forum_replies
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "forum_replies delete by author or owner" ON public.forum_replies;
CREATE POLICY "forum_replies delete by author or owner" ON public.forum_replies
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = post_id AND public.is_group_owner(p.group_id)
    )
  );

-- ============================================================
-- Trigger: opdatér reply_count og last_activity_at på posts
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_forum_replies_aggregate()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts
    SET reply_count = reply_count + 1,
        last_activity_at = NEW.created_at
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.post_id;
    -- Hvis det var bedste svar, nulstil
    UPDATE public.forum_posts
    SET best_reply_id = NULL
    WHERE id = OLD.post_id AND best_reply_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tg_forum_replies_insert ON public.forum_replies;
CREATE TRIGGER tg_forum_replies_insert
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.tg_forum_replies_aggregate();

DROP TRIGGER IF EXISTS tg_forum_replies_delete ON public.forum_replies;
CREATE TRIGGER tg_forum_replies_delete
  AFTER DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.tg_forum_replies_aggregate();

-- ============================================================
-- Notifikationer (in-app)
-- ============================================================
-- Trigger-genererede notifikationer for de vigtigste events:
-- idé-deling (direkte + gruppe), gruppe-anmodninger + godkendelse,
-- forum-svar, frøbytte-forespørgsel + resolution, medlemskabsændringer.
--
-- Hver notifikation gemmer en pre-rendered title/link, så displayet
-- ikke kræver joins. Polymorfe FK'er (group_id, idea_id, etc.) bruges
-- til at navigere efter klik.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT NOT NULL,
  group_id UUID REFERENCES public.user_groups(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  forum_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  swap_listing_id UUID REFERENCES public.seed_swap_listings(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Modtager kan se egne
DROP POLICY IF EXISTS "notifications select own" ON public.notifications;
CREATE POLICY "notifications select own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Modtager kan markere som læst (eller andre opdateringer)
DROP POLICY IF EXISTS "notifications update own" ON public.notifications;
CREATE POLICY "notifications update own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications delete own" ON public.notifications;
CREATE POLICY "notifications delete own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Insert sker kun via SECURITY DEFINER-helper nedenfor
DROP POLICY IF EXISTS "notifications insert nobody" ON public.notifications;
CREATE POLICY "notifications insert nobody" ON public.notifications
  FOR INSERT WITH CHECK (false);

-- ============================================================
-- enqueue_notification: kaldes fra triggers; bypass RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_user_id UUID,
  p_type TEXT,
  p_actor_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_link TEXT,
  p_group_id UUID DEFAULT NULL,
  p_idea_id UUID DEFAULT NULL,
  p_forum_post_id UUID DEFAULT NULL,
  p_swap_listing_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Skip hvis modtager = afsender (folk skal ikke notificeres om egne handlinger)
  IF p_user_id IS NULL OR (p_actor_user_id IS NOT NULL AND p_user_id = p_actor_user_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (
    user_id, type, actor_user_id, title, body, link,
    group_id, idea_id, forum_post_id, swap_listing_id
  ) VALUES (
    p_user_id, p_type, p_actor_user_id, p_title, p_body, p_link,
    p_group_id, p_idea_id, p_forum_post_id, p_swap_listing_id
  );
END;
$$;

-- Helper: hent display-name eller username for en bruger
CREATE OR REPLACE FUNCTION public.user_display_label(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT coalesce(NULLIF(trim(p.display_name), ''), p.username::text, 'Ukendt bruger')
  FROM public.profiles p WHERE p.id = p_user_id;
$$;

-- ============================================================
-- Trigger: idé delt direkte med en bruger
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_idea_shared()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_idea TEXT;
BEGIN
  v_actor := public.user_display_label(NEW.shared_by_user_id);
  SELECT title INTO v_idea FROM public.ideas WHERE id = NEW.idea_id;
  PERFORM public.enqueue_notification(
    NEW.recipient_user_id,
    'idea_shared',
    NEW.shared_by_user_id,
    v_actor || ' delte en idé med dig',
    v_idea,
    '/idetavle',
    NULL, NEW.idea_id, NULL, NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_idea_shares_notify ON public.idea_shares;
CREATE TRIGGER tg_idea_shares_notify
  AFTER INSERT ON public.idea_shares
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_idea_shared();

-- ============================================================
-- Trigger: idé delt med en gruppe (notificér alle medlemmer undtagen sharer)
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_idea_group_shared()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_idea TEXT;
  v_group TEXT;
  r RECORD;
BEGIN
  v_actor := public.user_display_label(NEW.shared_by_user_id);
  SELECT title INTO v_idea FROM public.ideas WHERE id = NEW.idea_id;
  SELECT name INTO v_group FROM public.user_groups WHERE id = NEW.group_id;
  FOR r IN
    SELECT user_id FROM public.user_group_memberships WHERE group_id = NEW.group_id
  LOOP
    PERFORM public.enqueue_notification(
      r.user_id,
      'idea_group_shared',
      NEW.shared_by_user_id,
      v_actor || ' delte en idé i ' || v_group,
      v_idea,
      '/idetavle',
      NEW.group_id, NEW.idea_id, NULL, NULL
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_idea_group_shares_notify ON public.idea_group_shares;
CREATE TRIGGER tg_idea_group_shares_notify
  AFTER INSERT ON public.idea_group_shares
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_idea_group_shared();

-- ============================================================
-- Trigger: nogen anmoder om at deltage i en gruppe → notificér ejer(e)
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_join_request()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_group TEXT;
  r RECORD;
BEGIN
  v_actor := public.user_display_label(NEW.user_id);
  SELECT name INTO v_group FROM public.user_groups WHERE id = NEW.group_id;
  FOR r IN
    SELECT user_id FROM public.user_group_memberships
    WHERE group_id = NEW.group_id AND role = 'owner'
  LOOP
    PERFORM public.enqueue_notification(
      r.user_id,
      'group_join_request',
      NEW.user_id,
      v_actor || ' har anmodet om at deltage i ' || v_group,
      NEW.message,
      '/grupper/' || NEW.group_id::text,
      NEW.group_id, NULL, NULL, NULL
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_join_requests_notify ON public.group_join_requests;
CREATE TRIGGER tg_join_requests_notify
  AFTER INSERT ON public.group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_join_request();

-- ============================================================
-- Trigger: ny medlemskab tilføjet (af owner) → notificér det nye medlem
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_membership_added()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_group TEXT;
  v_actor_id UUID := auth.uid();
BEGIN
  -- Hvis brugeren tilføjede sig selv (join_open_group) → ingen notifikation
  IF v_actor_id IS NULL OR v_actor_id = NEW.user_id THEN RETURN NEW; END IF;
  v_actor := public.user_display_label(v_actor_id);
  SELECT name INTO v_group FROM public.user_groups WHERE id = NEW.group_id;
  PERFORM public.enqueue_notification(
    NEW.user_id,
    CASE NEW.role WHEN 'owner' THEN 'group_owner_added' ELSE 'group_member_added' END,
    v_actor_id,
    v_actor || ' tilføjede dig til ' || v_group,
    NULL,
    '/grupper/' || NEW.group_id::text,
    NEW.group_id, NULL, NULL, NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_memberships_notify ON public.user_group_memberships;
CREATE TRIGGER tg_memberships_notify
  AFTER INSERT ON public.user_group_memberships
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_membership_added();

-- ============================================================
-- Trigger: forum-svar → notificér tråd-forfatter
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_forum_reply()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_post_title TEXT;
  v_post_author UUID;
  v_group_id UUID;
BEGIN
  SELECT user_id, title, group_id INTO v_post_author, v_post_title, v_group_id
  FROM public.forum_posts WHERE id = NEW.post_id;
  IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN RETURN NEW; END IF;
  v_actor := public.user_display_label(NEW.user_id);
  PERFORM public.enqueue_notification(
    v_post_author,
    'forum_reply',
    NEW.user_id,
    v_actor || ' svarede på dit opslag',
    v_post_title,
    '/grupper/' || v_group_id::text || '/opslag/' || NEW.post_id::text,
    v_group_id, NULL, NEW.post_id, NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_forum_replies_notify ON public.forum_replies;
CREATE TRIGGER tg_forum_replies_notify
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_forum_reply();

-- ============================================================
-- Trigger: frøbytte-forespørgsel → notificér listing-ejer
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_swap_request()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_listing_owner UUID;
  v_plant TEXT;
  v_group_id UUID;
BEGIN
  SELECT user_id, plant_name, group_id INTO v_listing_owner, v_plant, v_group_id
  FROM public.seed_swap_listings WHERE id = NEW.listing_id;
  v_actor := public.user_display_label(NEW.requester_user_id);
  PERFORM public.enqueue_notification(
    v_listing_owner,
    'swap_request',
    NEW.requester_user_id,
    v_actor || ' har forespurgt bytte: ' || v_plant,
    NEW.message,
    '/grupper/' || v_group_id::text,
    v_group_id, NULL, NULL, NEW.listing_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_swap_requests_notify ON public.seed_swap_requests;
CREATE TRIGGER tg_swap_requests_notify
  AFTER INSERT ON public.seed_swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_swap_request();

-- ============================================================
-- Trigger: swap-request resolved (accepted/declined) → notificér requester
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_swap_resolved()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_listing_owner UUID;
  v_plant TEXT;
  v_group_id UUID;
  v_actor TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;
  SELECT user_id, plant_name, group_id INTO v_listing_owner, v_plant, v_group_id
  FROM public.seed_swap_listings WHERE id = NEW.listing_id;
  v_actor := public.user_display_label(v_listing_owner);
  PERFORM public.enqueue_notification(
    NEW.requester_user_id,
    CASE NEW.status WHEN 'accepted' THEN 'swap_accepted' ELSE 'swap_declined' END,
    v_listing_owner,
    v_actor || (CASE NEW.status WHEN 'accepted' THEN ' accepterede din byttebytte: ' ELSE ' afviste din byttebytte: ' END) || v_plant,
    NULL,
    '/grupper/' || v_group_id::text,
    v_group_id, NULL, NULL, NEW.listing_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_swap_requests_resolved ON public.seed_swap_requests;
CREATE TRIGGER tg_swap_requests_resolved
  AFTER UPDATE ON public.seed_swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_swap_resolved();

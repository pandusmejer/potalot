-- ============================================================
-- Notifikationer: chat-beskeder + challenge-start
-- ============================================================
-- Manglede i 00039. Chat-beskeder dedupeer pr. (modtager, gruppe) så
-- 50 beskeder fra samme person ikke giver 50 notifikationer.
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_chat_message()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_group TEXT;
  v_excerpt TEXT;
  r RECORD;
BEGIN
  v_actor := public.user_display_label(NEW.user_id);
  SELECT name INTO v_group FROM public.user_groups WHERE id = NEW.group_id;
  v_excerpt := NULLIF(trim(coalesce(NEW.body, '')), '');
  IF v_excerpt IS NULL AND NEW.image_url IS NOT NULL THEN
    v_excerpt := '📷 Billede';
  END IF;

  FOR r IN
    SELECT user_id
    FROM public.user_group_memberships
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id
  LOOP
    -- Dedupe: hvis modtager allerede har en ulæst chat-notifikation
    -- for denne gruppe, opdatér tidsstemplet i stedet for at oprette
    -- en ny række. Sikrer at en chat-tråd kun fylder ÉN notifikation.
    IF EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = r.user_id AND group_id = NEW.group_id
        AND type = 'group_chat' AND is_read = false
    ) THEN
      UPDATE public.notifications
      SET created_at = NEW.created_at,
          actor_user_id = NEW.user_id,
          title = v_actor || ' skrev i ' || v_group,
          body = v_excerpt
      WHERE user_id = r.user_id AND group_id = NEW.group_id
        AND type = 'group_chat' AND is_read = false;
    ELSE
      PERFORM public.enqueue_notification(
        r.user_id,
        'group_chat',
        NEW.user_id,
        v_actor || ' skrev i ' || v_group,
        v_excerpt,
        '/grupper/' || NEW.group_id::text,
        NEW.group_id, NULL, NULL, NULL
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_chat_messages_notify ON public.group_chat_messages;
CREATE TRIGGER tg_chat_messages_notify
  AFTER INSERT ON public.group_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_chat_message();

-- ============================================================
-- Trigger: ny challenge startet → notificér alle medlemmer
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_notify_challenge_started()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor TEXT;
  v_group TEXT;
  r RECORD;
BEGIN
  v_actor := public.user_display_label(NEW.created_by);
  SELECT name INTO v_group FROM public.user_groups WHERE id = NEW.group_id;
  FOR r IN
    SELECT user_id FROM public.user_group_memberships
    WHERE group_id = NEW.group_id AND user_id <> NEW.created_by
  LOOP
    PERFORM public.enqueue_notification(
      r.user_id,
      'challenge_started',
      NEW.created_by,
      'Ny challenge i ' || v_group || ': ' || NEW.title,
      NEW.description,
      '/grupper/' || NEW.group_id::text,
      NEW.group_id, NULL, NULL, NULL
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_challenges_notify ON public.challenges;
CREATE TRIGGER tg_challenges_notify
  AFTER INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_challenge_started();

-- ============================================================
-- Opgave-påmindelser (smal launch-notifikation)
-- ============================================================
-- Deterministiske, plante-knyttede, FÅ in-app påmindelser afledt af
-- calendar_tasks → notifications, via den eksisterende enqueue_notification-
-- helper. Self-scoped (auth.uid()) så den ikke kan misbruges til at spamme
-- andre. Dedup: højst én påmindelse pr. opgave pr. dag. Ingen push/email.
--
-- Kaldes on-load (server-action syncTaskReminders → rpc). Idempotent pga.
-- dedup, så gentagne kald samme dag ikke skaber dubletter.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_task_reminders()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user  UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'Europe/Copenhagen')::date;
  v_task  RECORD;
  v_count INTEGER := 0;
  v_link  TEXT;
  v_body  TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN 0; END IF;

  FOR v_task IN
    SELECT ct.id,
           ct.title,
           coalesce(ct.due_date, ct.date) AS forfald,
           p.name AS plante
    FROM public.calendar_tasks ct
    JOIN public.plants_v2 p ON p.id = ct.linked_plant_id
    WHERE ct.user_id = v_user
      AND ct.status = 'open'
      AND ct.linked_plant_id IS NOT NULL
      AND p.is_archived = false
      AND coalesce(ct.due_date, ct.date) <= v_today
    ORDER BY coalesce(ct.due_date, ct.date) ASC
    LIMIT 3
  LOOP
    v_link := '/kalender?t=' || v_task.id::text;

    -- Dedup: findes allerede en påmindelse for denne opgave i dag?
    IF EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = v_user
        AND n.type = 'task_reminder'
        AND n.link = v_link
        AND (n.created_at AT TIME ZONE 'Europe/Copenhagen')::date = v_today
    ) THEN
      CONTINUE;
    END IF;

    IF v_task.forfald = v_today THEN
      v_body := 'Forfalder i dag';
    ELSIF v_task.forfald = v_today - 1 THEN
      v_body := 'Skulle være gjort i går';
    ELSE
      v_body := 'Forsinket siden ' || to_char(v_task.forfald, 'DD/MM');
    END IF;

    -- Genbrug den eksisterende enqueue-helper (actor = NULL → intet skip)
    PERFORM public.enqueue_notification(
      v_user, 'task_reminder', NULL,
      v_task.plante || ' · ' || v_task.title,
      v_body, v_link
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_task_reminders() TO authenticated;

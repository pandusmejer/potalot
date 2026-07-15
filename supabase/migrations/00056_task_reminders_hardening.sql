-- ============================================================
-- Hærdning af opgave-påmindelser (launch-korrekthed)
-- ============================================================
-- To fixes oven på 00055:
--   1) DB-sikker dedup: højst én påmindelse pr. opgave pr. bruger pr. dag,
--      også ved samtidige loads / to faner (unikt indeks + ON CONFLICT).
--   2) Oprydning: completed/skipped opgave fjerner sine eksisterende ULÆSTE
--      påmindelser automatisk (trigger), så brugeren ikke ser forældede nudges.
-- ============================================================

-- 1a) Deterministisk dedup-nøgle. NULL for alt andet end opgave-påmindelser,
--     så sociale notifikationer er upåvirkede af det partielle indeks.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dedup_key TEXT;

-- 1b) Atomisk dedup: to samtidige inserts med samme nøgle → kun én overlever.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_dedup
  ON public.notifications (user_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

-- 2) Redefinér sync: sæt dedup_key + atomisk INSERT ... ON CONFLICT DO NOTHING
--    (erstatter enqueue_notification-kaldet, som ikke er conflict-sikkert).
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
  v_key   TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN 0; END IF;

  FOR v_task IN
    SELECT ct.id, ct.title, coalesce(ct.due_date, ct.date) AS forfald, p.name AS plante
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
    v_key  := 'task:' || v_task.id::text || ':' || v_today::text;  -- pr. opgave pr. dag

    IF v_task.forfald = v_today THEN
      v_body := 'Forfalder i dag';
    ELSIF v_task.forfald = v_today - 1 THEN
      v_body := 'Skulle være gjort i går';
    ELSE
      v_body := 'Forsinket siden ' || to_char(v_task.forfald, 'DD/MM');
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link, dedup_key)
    VALUES (v_user, 'task_reminder', v_task.plante || ' · ' || v_task.title, v_body, v_link, v_key)
    ON CONFLICT DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_task_reminders() TO authenticated;

-- 3) Oprydning ved afslutning: fjern eksisterende ulæste påmindelser for opgaven.
CREATE OR REPLACE FUNCTION public.cleanup_task_reminders_on_close()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.status IN ('completed', 'skipped') AND NEW.status IS DISTINCT FROM OLD.status THEN
    DELETE FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = 'task_reminder'
      AND is_read = false
      AND dedup_key LIKE ('task:' || NEW.id::text || ':%');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_task_reminders ON public.calendar_tasks;
CREATE TRIGGER trg_cleanup_task_reminders
  AFTER UPDATE OF status ON public.calendar_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_task_reminders_on_close();

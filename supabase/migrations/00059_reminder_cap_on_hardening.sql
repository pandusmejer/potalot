-- ============================================================
-- Rettelse: notifikations-cap OVEN PÅ 00056-hærdningen
-- ============================================================
-- 00058 redefinerede ved en fejl sync_task_reminders() ud fra 00055-formen
-- (enqueue_notification + EXISTS-dedup) og tabte dermed 00056-hærdningen
-- (dedup_key + atomisk INSERT ... ON CONFLICT). Konsekvens: dedup var ikke
-- længere race-sikker, og cleanup-triggeren (matcher på dedup_key) kunne ikke
-- rydde de påmindelser, funktionen skabte.
--
-- Denne migration genskaber 00056-funktionen NØJAGTIGT og lægger kun
-- notifikations-loftet oveni (fra 00058): cap ud fra notification_profile,
-- mindful → 0 (ingen påmindelser). dedup_key-kolonnen, det unikke indeks og
-- cleanup-triggeren fra 00056 er uændrede og genbruges.
--
--   mindful → 0 (early-return) · rolig → 1 · aktiv → 3 · NULL → 3
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
  v_cap   INTEGER;
  v_link  TEXT;
  v_body  TEXT;
  v_key   TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN 0; END IF;

  -- Loft ud fra notifikationsprofil (COALESCE bevarer nuværende adfærd).
  SELECT CASE p.notification_profile
           WHEN 'mindful' THEN 0
           WHEN 'rolig'   THEN 1
           WHEN 'aktiv'   THEN 3
           ELSE 3
         END
    INTO v_cap
    FROM public.profiles p
   WHERE p.id = v_user;
  v_cap := COALESCE(v_cap, 3);

  -- Mindful: opret slet ingen opgave-påmindelser.
  IF v_cap <= 0 THEN RETURN 0; END IF;

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
    LIMIT v_cap
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

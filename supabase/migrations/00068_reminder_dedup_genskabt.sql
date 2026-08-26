-- ============================================================
-- 00068: Genskab dedup-hærdningen i sync_task_reminders (ANDEN gang)
-- ============================================================
-- ⚠️ INVARIANT — LÆS FØR DU RØRER DENNE FUNKTION ⚠️
-- Enhver fremtidig CREATE OR REPLACE af public.sync_task_reminders SKAL
-- indeholde BÅDE `dedup_key` OG `INSERT ... ON CONFLICT DO NOTHING`.
-- Byg ALDRIG en ny version oven på en ældre kopi af funktionen — kopiér
-- altid fra den NYESTE migration. scripts/test-migration-invarianter.ts
-- håndhæver det i `npm test`.
--
-- Historikken (samme fejl to gange):
--   00055  EXISTS-dedup pr. opgave pr. dag
--   00056  hærdning: dedup_key + unikt indeks + ON CONFLICT DO NOTHING
--          + cleanup-trigger der matcher PÅ dedup_key
--   00058  redefinerede ved en fejl ud fra 00055-formen → hærdning tabt
--   00059  genskabte 00056 nøjagtigt + lagde cap oveni. Advarede eksplicit.
--   00066  redefinerede "ud fra 00058" → hærdningen tabt IGEN
--   00068  (her) genskaber hærdningen og BEVARER 00066's sprog
--
-- Skaden i produktion (målt 26/8 2026):
--   - Alle task_reminders fra 16/8 og frem har dedup_key = NULL, så
--     cleanup-triggeren (matcher på dedup_key) IKKE kan fjerne ulæste
--     påmindelser når en opgave afsluttes. De hober sig op for evigt.
--   - EXISTS-dedup er ikke atomisk: 18/8 blev der oprettet 4 påmindelser
--     på én dag med et loft på 3 — to samtidige loads vandt begge.
--   - Én bruger stod med 57 ulæste påmindelser for 3 opgaver.
--
-- Denne migration ændrer KUN funktionen. Oprydning i de allerede skabte
-- notifikationer er en separat, eksplicit beslutning (brugerdata).
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

  -- Loft ud fra notifikationsprofil (uændret fra 00058/00059).
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
    LIMIT v_cap
  LOOP
    v_link := '/kalender?t=' || v_task.id::text;
    -- Deterministisk nøgle: én påmindelse pr. opgave pr. dag. Det unikke
    -- partielle indeks (00056) gør dedup atomisk, og cleanup-triggeren
    -- matcher PÅ denne nøgle — uden den kan forældede nudges ikke ryddes.
    v_key  := 'task:' || v_task.id::text || ':' || v_today::text;

    -- Sprog fra 00066 (NAV-0395-0397): Potalot er en haveapp, ikke inkasso.
    IF v_task.forfald = v_today THEN
      v_body := 'Planlagt til i dag';
    ELSIF v_task.forfald = v_today - 1 THEN
      v_body := 'Var planlagt til i går';
    ELSE
      v_body := 'Planlagt til ' || to_char(v_task.forfald, 'DD/MM');
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

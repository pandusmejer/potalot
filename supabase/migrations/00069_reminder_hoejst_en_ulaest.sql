-- ============================================================
-- 00069: Én aktiv ulæst påmindelse pr. opgave (ANNA-LÅST produktregel 26/8)
-- ============================================================
-- ⚠️ INVARIANT — LÆS FØR DU RØRER DENNE FUNKTION ⚠️
-- Enhver fremtidig CREATE OR REPLACE af public.sync_task_reminders SKAL
-- indeholde BÅDE `dedup_key` OG `INSERT ... ON CONFLICT DO NOTHING`.
-- Byg ALDRIG en ny version oven på en ældre kopi — kopiér fra den NYESTE
-- migration. scripts/test-migration-invarianter.ts håndhæver det i `npm test`.
--
-- ── Produktreglen (Anna 26/8) ───────────────────────────────────────────
--   "En opgave må højst have én aktiv ulæst task-reminder ad gangen."
-- Findes der allerede en ULÆST påmindelse for opgaven, opretter sync ikke
-- en ny — på tværs af datoer og uanset tidligere dedup_key. Et dagligt
-- sync-job må ikke bygge et geologisk lag af dårlig samvittighed i
-- notifikationscenteret om den samme uændrede tilstand.
--
-- ── Hvorfor 00068 ikke var nok ──────────────────────────────────────────
-- 00068 genskabte dedup-hærdningen (atomisk, én pr. opgave PR. DAG). Den
-- gjorde hver dags oprettelse sikker — men forhindrede ikke næste dags
-- kopi. Måling 26/8: 69 ulæste påmindelser for 7 opgaver, hvoraf kun 16
-- manglede dedup_key. Bunken var altså den daglige gentagelse, ikke den
-- tabte nøgle. To forskellige fejl, to forskellige rettelser.
--
-- Filteret ligger i SELECT'en (ikke efter LOOP-starten), så loftet v_cap
-- vælger blandt de opgaver der FAKTISK mangler en påmindelse. Ellers ville
-- tre opgaver med eksisterende ulæste nudges kunne æde hele loftet og
-- skygge for en fjerde opgave, der intet har fået.
--
-- Dedup_key + ON CONFLICT bevares: de dækker stadig kapløbet mellem to
-- samtidige loads samme dag, og cleanup-triggeren matcher på nøglen.
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

  -- Loft ud fra notifikationsprofil (uændret fra 00059/00068).
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
      -- PRODUKTREGLEN: har opgaven allerede en ulæst påmindelse, springes
      -- den over. Matcher på link (opgavens identitet), IKKE på dedup_key —
      -- så gamle rækker uden nøgle også tæller som "allerede påmindt".
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = v_user
          AND n.type = 'task_reminder'
          AND n.is_read = false
          AND n.link = '/kalender?t=' || ct.id::text
      )
    ORDER BY coalesce(ct.due_date, ct.date) ASC
    LIMIT v_cap
  LOOP
    v_link := '/kalender?t=' || v_task.id::text;
    -- Deterministisk nøgle: dækker kapløbet mellem to samtidige loads samme
    -- dag, og cleanup-triggeren (00056) matcher PÅ denne nøgle.
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

-- ── Cleanup-triggeren: ram også rækker UDEN dedup_key ────────────────────
-- 00056 matchede kun på dedup_key. De 16 rækker som 00066-regressionen
-- skabte har NULL dér og var derfor usynlige for triggeren — de kunne
-- aldrig ryddes, heller ikke når opgaven blev afsluttet. Nu matches der
-- også på link (samme opgave, stadig kun ULÆSTE).
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
      AND (
        dedup_key LIKE ('task:' || NEW.id::text || ':%')
        OR link = '/kalender?t=' || NEW.id::text
      );
  END IF;
  RETURN NEW;
END;
$$;

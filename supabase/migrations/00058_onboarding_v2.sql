-- ============================================================
-- Onboarding V2 — preference-felter på profiles
-- ============================================================
-- De tre ting Potalot skal vide for at opføre sig intelligent fra dag ét:
-- hvor / hvordan / hvor meget forstyrres. Lokation (latitude/longitude/
-- location_name) findes allerede fra 00048 og genbruges — her tilføjes de
-- resterende fire preference-dimensioner.
--
--   garden_type    : 'parcelhus' | 'raekkehus' | 'kolonihave' | 'byhave'
--                    | 'altan' | 'sommerhus' | 'landsted' | 'andet'
--   growing_areas  : TEXT[] — 'koekkenhave' | 'drivhus' | 'hoejbede'
--                    | 'krukker' | 'blomster' | 'frugt_baer' | 'lidt_af_hvert'
--   grower_profile : 'mindful' | 'hjaelper' | 'entusiast' | 'froesamler'
--                    → styrer bl.a. antal opgave-påmindelser (se funktion nedenfor)
--   season_status  : 'starter' | 'igang' | 'flere_maaneder'
--
-- Alle nullable/additive — eksisterende rækker påvirkes ikke.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS garden_type    TEXT,
  ADD COLUMN IF NOT EXISTS growing_areas  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grower_profile TEXT,
  ADD COLUMN IF NOT EXISTS season_status  TEXT;

-- ============================================================
-- Dyrkerprofil → antal opgave-påmindelser
-- ============================================================
-- Uændret funktion fra 00055 PÅ NÆR at LIMIT nu afhænger af brugerens
-- grower_profile. COALESCE-fallbacken bevarer nøjagtig den nuværende adfærd
-- (3) for enhver bruger uden profil, så eksisterende brugere ikke ændres.
--
--   mindful    → 1  (kun det vigtigste; ingen unødig støj)
--   hjaelper   → 3  (balanceret — som i dag)
--   entusiast  → 6  (flere forslag, mere indsigt)
--   froesamler → 3  (frø-vægtning er indholds-emphasis, ikke flere opgaver)
--   NULL/ukendt→ 3  (nuværende default bevaret)
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
BEGIN
  IF v_user IS NULL THEN RETURN 0; END IF;

  -- Påmindelses-loft ud fra dyrkerprofil (COALESCE bevarer nuværende adfærd).
  SELECT CASE p.grower_profile
           WHEN 'mindful'   THEN 1
           WHEN 'entusiast' THEN 6
           ELSE 3
         END
    INTO v_cap
    FROM public.profiles p
   WHERE p.id = v_user;
  v_cap := COALESCE(v_cap, 3);

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

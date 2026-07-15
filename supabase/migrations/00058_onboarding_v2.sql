-- ============================================================
-- Onboarding V2 — preference-felter på profiles
-- ============================================================
-- To UAFHÆNGIGE dimensioner (Anna 15/7 — må ALDRIG blandes):
--   grower_profile       = hvem er du som dyrker (identitet/interesse)
--                          'ny' | 'koekkenhave' | 'blomster' | 'froesamler'
--                          | 'selvforsyner' | 'drivhus'
--   notification_profile = hvor meget må Potalot forstyrre dig
--                          'mindful' (0) | 'rolig' (få) | 'aktiv' (launch-std.)
--
-- En bruger kan sagtens være både Frøsamler OG Mindful. Notifikations-mængden
-- afhænger UDELUKKENDE af notification_profile — aldrig af dyrker-identiteten.
--
-- Øvrige (findes ikke i forvejen):
--   garden_type   : 'parcelhus'|'raekkehus'|'kolonihave'|'byhave'|'altan'
--                   |'sommerhus'|'landsted'|'andet'
--   growing_areas : TEXT[] — 'koekkenhave'|'drivhus'|'hoejbede'|'krukker'
--                   |'blomster'|'frugt_baer'|'lidt_af_hvert'
--   season_status : 'starter' | 'igang' | 'flere_maaneder'
--
-- Lokation (latitude/longitude/location_name) findes fra 00048 og genbruges.
-- Alle nullable/additive — eksisterende rækker påvirkes ikke.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS garden_type          TEXT,
  ADD COLUMN IF NOT EXISTS growing_areas        TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grower_profile       TEXT,
  ADD COLUMN IF NOT EXISTS notification_profile TEXT,
  ADD COLUMN IF NOT EXISTS season_status        TEXT;

-- ============================================================
-- Notifikationsprofil → antal opgave-påmindelser
-- ============================================================
-- Uændret funktion fra 00055 PÅ NÆR at LIMIT nu afhænger af brugerens
-- notification_profile. COALESCE-fallbacken bevarer nøjagtig den nuværende
-- adfærd (3) for enhver bruger uden profil.
--
--   mindful → 0  (INGEN opgave-påmindelser — klokke/push tavs; in-app-indhold
--                 vises stadig, når brugeren selv åbner kalenderen)
--   rolig   → 1  (få — kun det vigtigste)
--   aktiv   → 3  (launch-standardens loft)
--   NULL    → 3  (nuværende default bevaret)
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

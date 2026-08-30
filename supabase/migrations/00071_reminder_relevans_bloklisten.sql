-- ============================================================
-- 00071: Fagligt udløbne dyrkningsopgaver kalder ikke længere (Anna 30/8)
-- ============================================================
-- ⚠️ INVARIANT — LÆS FØR DU RØRER DENNE FUNKTION ⚠️
-- Enhver fremtidig CREATE OR REPLACE af public.sync_task_reminders SKAL
-- indeholde BÅDE `dedup_key` OG `INSERT ... ON CONFLICT DO NOTHING`.
-- Byg ALDRIG en ny version oven på en ældre kopi — kopiér fra den NYESTE
-- migration (denne). scripts/test-migration-invarianter.ts håndhæver det.
--
-- ── Hvad der ændrer sig ─────────────────────────────────────────────────
-- Funktionen havde ÉN definition af relevans: forfalden. "Udplant chili ·
-- planlagt til 13/04" stod derfor stadig ulæst i slutningen af august, fordi
-- 13/04 ≤ 30/08 er sandt. Guidens dokumenterede udplantningsvindue er maj-
-- juni; handlingen var fagligt meningsløs længe før påmindelsen holdt op.
--
-- Fagligheden afgøres IKKE her. Den afgøres i TypeScript
-- (src/lib/kalender/reminder-relevans.ts) mod den kanoniske
-- dyrkningsvindue-model i froebank-autofill.ts, og resultatet kommer ind som
-- en blokliste. Grunden er målt, ikke principiel: de to guide-kilder er ikke
-- identiske. For Chili · Padrón giver repoets GUIDE_FACTS harvestMonths
-- [7,8,9,10] og sowingMonths [1,2,3], mens rækken i public.guides giver
-- [8,9,10] og [2,3,4]. En vindue-fortolker skrevet her ville altså svare
-- noget ANDET end frøbanken og kalenderen svarer om samme plante. Én
-- fortolker, ét svar.
--
-- ── Hvorfor blokliste og ikke kandidatliste ─────────────────────────────
-- `p_ikke_relevante` fjerner opgaver fra et udvalg SQL stadig selv træffer.
-- Det holder ejerskabet, hvor det hører hjemme: SQL ejer fortsat hvem der
-- kvalificerer (åben, plante-knyttet, ikke-arkiveret, forfalden), atomisk
-- dedup, "højst én ulæst pr. opgave" og notifikationsloftet. TypeScript
-- svarer kun på ét spørgsmål: er handlingen fagligt meningsfuld lige nu.
--
-- Og det er fail-safe hele vejen. NULL (opslaget fejlede, gammel klient,
-- server action der nåede at dø) → nøjagtig adfærden fra 00069. Tomt array
-- (intet var udløbet) → samme. Kun navngivne id'er falder fra. Et hul i
-- guidebiblioteket kan aldrig slette en påmindelse.
--
-- Filteret ligger i SELECT'en sammen med de øvrige — så loftet v_cap vælger
-- blandt de opgaver der FAKTISK er relevante. Lå det efter LOOP-starten,
-- kunne tre udløbne dyrkningsopgaver æde hele loftet og skygge for en
-- fjerde, der stadig var meningsfuld. Præcis samme begrundelse som
-- ulæst-filteret i 00069.
-- ============================================================

-- Den parameterløse version skal væk: med DEFAULT NULL på den nye ville de
-- to overloads være tvetydige ved kald uden argument.
DROP FUNCTION IF EXISTS public.sync_task_reminders();

CREATE OR REPLACE FUNCTION public.sync_task_reminders(
  p_ikke_relevante UUID[] DEFAULT NULL
)
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

  -- Loft ud fra notifikationsprofil (uændret fra 00059/00068/00069).
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
      -- PRODUKTREGLEN (00069): har opgaven allerede en ulæst påmindelse,
      -- springes den over. Matcher på link (opgavens identitet), IKKE på
      -- dedup_key — så gamle rækker uden nøgle også tæller som "påmindt".
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = v_user
          AND n.type = 'task_reminder'
          AND n.is_read = false
          AND n.link = '/kalender?t=' || ct.id::text
      )
      -- RELEVANSREGLEN (00071): maskin-afledte dyrkningsopgaver, hvis
      -- dokumenterede vindue er lukket. Listen kommer fra TypeScript;
      -- NULL betyder "ingen vurdering foretaget" og filtrerer intet.
      AND (p_ikke_relevante IS NULL OR ct.id <> ALL (p_ikke_relevante))
    ORDER BY coalesce(ct.due_date, ct.date) ASC
    LIMIT v_cap
  LOOP
    v_link := '/kalender?t=' || v_task.id::text;
    -- Deterministisk nøgle: dækker kapløbet mellem to samtidige loads samme
    -- dag, og cleanup-triggeren (00056/00069) matcher PÅ denne nøgle.
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

GRANT EXECUTE ON FUNCTION public.sync_task_reminders(UUID[]) TO authenticated;

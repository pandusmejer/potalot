-- ============================================
-- voice_notes — diktafonen som INDBAKKE til haven
-- ============================================
-- "Tal til din have" må ikke være et løst lydarkiv. Hver optagelse
-- persisteres som en førsteklasses ting med status + sæson-metadata, så
-- brugeren kan se ALLE optagelser (arkiv) og gøre dem aktive (føj til log,
-- gem som minde, opret opgave, gem som observation). Spec:
-- Docs/product/diktafon-indbakke.md.
--
-- LÅST REGEL (Anna): recorded_at = KILDEN TIL SANDHEDEN. Behandler brugeren
-- en optagelse 3 dage senere, flyttes den IKKE til behandlingsdatoen — den
-- hører stadig til den dag, brugeren sagde det. processed_at/attached_to_log_at
-- er separate. Havebog-historien (minder/vendepunkter/på-denne-dag) bruger
-- recorded_at.
--
-- Sæson-metadata (season_number/day/start) gemmes AUTOMATISK fra
-- aktivitets-sæsonmodellen (src/lib/havebog-saeson.ts) ved optagelse —
-- brugeren vælger aldrig dato/tid/sæson.
--
-- ANVENDT mod live DB 11/7-2026 (Potalot whtyexhqcpcgpludvkon), verificeret:
-- tabel + 3 indexes + RLS + policy + FK ON DELETE SET NULL + status-CHECK.
-- ============================================

CREATE TABLE IF NOT EXISTS public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Indhold
  text TEXT NOT NULL,               -- transskription (Web Speech / server-STT)
  audio_url TEXT,                    -- valgfri lydfil (fremtid; Web Speech gemmer ingen lyd)

  -- Tidsmodel (recorded_at er kilden til sandheden)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,          -- da brugeren gjorde den aktiv
  attached_to_log_at TIMESTAMPTZ,    -- da den blev føjet til en log

  -- Hvad optagelsen er blevet til
  status TEXT NOT NULL DEFAULT 'unprocessed'
    CHECK (status IN ('unprocessed', 'log', 'opgave', 'minde', 'observation')),

  -- Sæson-metadata (auto fra havebog-saeson ved optagelse)
  season_number INTEGER,
  season_day INTEGER,
  season_start DATE,

  source TEXT NOT NULL DEFAULT 'voice',

  -- Relationer (sat når optagelsen behandles). SET NULL: mister kun koblingen.
  plant_id UUID REFERENCES public.plants_v2(id) ON DELETE SET NULL,
  created_log_id UUID REFERENCES public.plant_logs_v2(id) ON DELETE SET NULL,
  created_task_id UUID REFERENCES public.calendar_tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_notes_user
  ON public.voice_notes(user_id);
-- Arkivet: nyeste optagelse først, evt. filtreret på status.
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_recorded
  ON public.voice_notes(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_status
  ON public.voice_notes(user_id, status);

-- RLS: samme permissive mønster som de øvrige tabeller (00051 m.fl.) —
-- auth håndhæves i action-laget, der altid filtrerer på user_id.
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voice_notes all" ON public.voice_notes;
CREATE POLICY "voice_notes all" ON public.voice_notes
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Plant task completions — udført UDLEDT opgave
-- ============================================
-- "I haven i dag"-opgaver er afledt af plantestatus (lib/afledninger), ikke
-- rigtige manuelle calendar_tasks. Brugeren skal kunne markere dem UDFØRT uden
-- at de bliver til rigtige tasks — og uden at afkrydsningen forsvinder ved reload.
--
-- task_key er DETERMINISTISK: plant_id + task_type + dato/fase. Så systemet kan
-- spørge "er denne udledte opgave allerede udført i dag/denne fase?" og vise
-- den som udført / skjule den. Unik pr. (user_id, task_key) → idempotent toggle.
--
-- log_entry_id kobler til den note i plantens historie, afkrydsningen skabte
-- (planter-persistens-sprint, step 1+2). Slettes completion, ryddes loggen med.
-- ============================================

CREATE TABLE IF NOT EXISTS public.plant_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plant_id UUID REFERENCES public.plants_v2(id) ON DELETE CASCADE,

  -- Deterministisk nøgle: fx "tomat-san-marzano:hoest:2026-06-17"
  task_key TEXT NOT NULL,
  task_title TEXT,
  task_type TEXT,
  source TEXT NOT NULL DEFAULT 'afledt',

  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Kobling til note i plantens historie (plant_logs_v2)
  log_entry_id UUID REFERENCES public.plant_logs_v2(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Én completion pr. deterministisk nøgle pr. bruger (task_key indeholder datoen,
-- så samme opgave kan udføres igen næste dag/fase med en ny nøgle).
CREATE UNIQUE INDEX IF NOT EXISTS idx_plant_task_completions_key
  ON public.plant_task_completions(user_id, task_key);

CREATE INDEX IF NOT EXISTS idx_plant_task_completions_user_date
  ON public.plant_task_completions(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_plant_task_completions_plant
  ON public.plant_task_completions(plant_id);

ALTER TABLE public.plant_task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plant_task_completions all" ON public.plant_task_completions;
CREATE POLICY "plant_task_completions all" ON public.plant_task_completions
  FOR ALL USING (true) WITH CHECK (true);

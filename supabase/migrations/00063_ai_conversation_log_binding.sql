-- 00063: Gartner-vurderinger bindes til logposten der udløste dem
-- (Annas model 8/8: én logpost = højst én initial Gartner-vurdering;
-- vurderingen er TILKNYTTET INDHOLD til logposten, ikke en selvstændig
-- hændelse — og genåbning må aldrig udløse et nyt AI-kald).
--
-- Additiv og ufarlig: nullable kolonne + partielt unikt indeks.
-- ON DELETE CASCADE: slettes logposten, følger vurderingen med (child).

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS log_id uuid
  REFERENCES public.plant_logs_v2(id) ON DELETE CASCADE;

-- Regel 1 håndhævet i databasen: højst én vurdering pr. logpost.
CREATE UNIQUE INDEX IF NOT EXISTS ai_conversations_log_id_key
  ON public.ai_conversations (log_id)
  WHERE log_id IS NOT NULL;

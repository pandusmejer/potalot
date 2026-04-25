-- ============================================
-- Havekalender — calendar_tasks tabel
-- ============================================
-- Personlige opgaver. Generelle haveopgaver (årshjul) er kuraterede konstanter
-- i src/lib/mock-data.ts og bliver i koden, ikke i DB.
-- ============================================

CREATE TABLE IF NOT EXISTS public.calendar_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  date DATE NOT NULL,
  due_date DATE,

  task_type TEXT NOT NULL DEFAULT 'custom' CHECK (task_type IN (
    'pre_sow', 'sowing', 'repot', 'plant_out', 'watering', 'fertilizing',
    'pruning', 'pest_check', 'harvest', 'weeding', 'maintenance',
    'planning', 'custom'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'critical'
  )),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'completed', 'skipped'
  )),

  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'manual', 'inventory', 'plant', 'guide', 'general'
  )),
  source_id TEXT,

  linked_plant_id UUID REFERENCES public.plants_v2(id) ON DELETE SET NULL,
  linked_inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  linked_guide_id UUID,

  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user        ON public.calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date        ON public.calendar_tasks(date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_status      ON public.calendar_tasks(status);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_plant       ON public.calendar_tasks(linked_plant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_inventory   ON public.calendar_tasks(linked_inventory_item_id);

ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_tasks all" ON public.calendar_tasks;
CREATE POLICY "calendar_tasks all" ON public.calendar_tasks FOR ALL USING (true) WITH CHECK (true);

-- Guide enhancements: botanical name, user images, auto-created flag
ALTER TABLE public.plant_guides
  ADD COLUMN IF NOT EXISTS botanical_name TEXT,
  ADD COLUMN IF NOT EXISTS user_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_automatically BOOLEAN DEFAULT false;

-- Index for search
CREATE INDEX IF NOT EXISTS idx_plant_guides_name_da ON public.plant_guides USING gin (to_tsvector('simple', name_da));

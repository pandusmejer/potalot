-- Track whether a plant cover is Potalot's guide reference or the user's own photo.
ALTER TABLE public.plants_v2
  ADD COLUMN IF NOT EXISTS image_source TEXT;

ALTER TABLE public.plants_v2
  DROP CONSTRAINT IF EXISTS plants_v2_image_source_check;

ALTER TABLE public.plants_v2
  ADD CONSTRAINT plants_v2_image_source_check
  CHECK (image_source IS NULL OR image_source IN ('guide_reference', 'user_upload'));

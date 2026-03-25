-- Migration 00007: Add user_notes to plant_guides
-- Allows users to add personal notes to guides without overwriting AI content
ALTER TABLE public.plant_guides
  ADD COLUMN IF NOT EXISTS user_notes TEXT;

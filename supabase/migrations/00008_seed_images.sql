-- Migration 00008: Add extra_images array to seeds for multiple image support
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS extra_images TEXT[] DEFAULT '{}';

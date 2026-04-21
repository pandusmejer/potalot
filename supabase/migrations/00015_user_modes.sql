-- ============================================
-- Brugertype-modes (Målrettet / Afslappet / Minimal)
-- Styrer mængden af notifikationer, forslag og kompleksitet i UI.
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_mode TEXT DEFAULT 'afslappet'
    CHECK (user_mode IN ('maalrettet', 'afslappet', 'minimal')),
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- ============================================================
-- Slice D: Frøbytte i grupper
-- ============================================================
-- Listings i en gruppe — enten tilbud (offer) eller søgning (wanted) —
-- med status (aktiv/reserveret/afsluttet). Brugere kan forespørge bytte
-- på et listing, ejeren kan acceptere eller afvise.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seed_swap_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('offer', 'wanted')),
  plant_name TEXT NOT NULL,
  variety TEXT,
  seed_count INT CHECK (seed_count IS NULL OR seed_count > 0),
  description TEXT,
  can_send BOOLEAN NOT NULL DEFAULT true,
  local_swap BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seed_swap_listings_group_status
  ON public.seed_swap_listings(group_id, status, kind, created_at DESC);

ALTER TABLE public.seed_swap_listings ENABLE ROW LEVEL SECURITY;

-- Læs: medlemmer ELLER hvis gruppen er åben interessegruppe
DROP POLICY IF EXISTS "swap_listings select if member or open" ON public.seed_swap_listings;
CREATE POLICY "swap_listings select if member or open" ON public.seed_swap_listings
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR EXISTS (
      SELECT 1 FROM public.user_groups g
      WHERE g.id = seed_swap_listings.group_id
        AND g.group_type = 'interest' AND g.visibility = 'open'
    )
  );

DROP POLICY IF EXISTS "swap_listings insert by member" ON public.seed_swap_listings;
CREATE POLICY "swap_listings insert by member" ON public.seed_swap_listings
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id) AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "swap_listings update by author" ON public.seed_swap_listings;
CREATE POLICY "swap_listings update by author" ON public.seed_swap_listings
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "swap_listings delete by author or owner" ON public.seed_swap_listings;
CREATE POLICY "swap_listings delete by author or owner" ON public.seed_swap_listings
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_group_owner(group_id)
  );

-- ============================================================
-- seed_swap_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seed_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.seed_swap_listings(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_swap_requests_listing_user_pending
  ON public.seed_swap_requests(listing_id, requester_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_swap_requests_listing
  ON public.seed_swap_requests(listing_id, status);

ALTER TABLE public.seed_swap_requests ENABLE ROW LEVEL SECURITY;

-- Requester ser egne; listing-ejer ser dem på sin liste
DROP POLICY IF EXISTS "swap_requests select self or listing owner" ON public.seed_swap_requests;
CREATE POLICY "swap_requests select self or listing owner" ON public.seed_swap_requests
  FOR SELECT USING (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.seed_swap_listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

-- Insert: kun authenticated medlemmer der ikke er listing-ejer kan
-- forespørge. Den kontrol sker i RPC nedenfor for at undgå duplicate-
-- pending-edge-cases. Vi lader policyen være restriktiv.
DROP POLICY IF EXISTS "swap_requests insert by requester" ON public.seed_swap_requests;
CREATE POLICY "swap_requests insert by requester" ON public.seed_swap_requests
  FOR INSERT WITH CHECK (
    requester_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.seed_swap_listings l
      WHERE l.id = listing_id
        AND l.status = 'active'
        AND l.user_id <> auth.uid()
        AND public.is_group_member(l.group_id)
    )
  );

-- Update: requester kan annullere; listing-ejer kan godkende/afvise
DROP POLICY IF EXISTS "swap_requests update by requester or listing owner" ON public.seed_swap_requests;
CREATE POLICY "swap_requests update by requester or listing owner" ON public.seed_swap_requests
  FOR UPDATE USING (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.seed_swap_listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "swap_requests delete by requester or listing owner" ON public.seed_swap_requests;
CREATE POLICY "swap_requests delete by requester or listing owner" ON public.seed_swap_requests
  FOR DELETE USING (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.seed_swap_listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

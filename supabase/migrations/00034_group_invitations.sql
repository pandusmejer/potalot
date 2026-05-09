-- ============================================================
-- Invitations-flow: link-baserede invitationer + anmod-om-adgang
-- ============================================================
-- Owner kan generere et stabilt invitations-link. Alle med linket kan
-- anmode om adgang. Owner ser ventende anmodninger og godkender/afviser.
--
-- Bruges for både private grupper og lukkede interessegrupper. Åbne
-- interessegrupper har auto-join via join_open_group og bruger ikke
-- denne flow.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_active
  ON public.group_invitations(group_id) WHERE revoked_at IS NULL;

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Kun gruppens medlemmer kan se tokens (ejere får praktisk brug; medlemmer
-- kan også se for at dele videre — i V1 ingen ekstra friktion)
DROP POLICY IF EXISTS "invitations select by member" ON public.group_invitations;
CREATE POLICY "invitations select by member" ON public.group_invitations
  FOR SELECT USING (public.is_group_member(group_id));

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  via_invitation_id UUID REFERENCES public.group_invitations(id) ON DELETE SET NULL,
  message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON public.group_join_requests(group_id);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- Brugeren kan se sine egne anmodninger (alle grupper)
DROP POLICY IF EXISTS "join_requests select self" ON public.group_join_requests;
CREATE POLICY "join_requests select self" ON public.group_join_requests
  FOR SELECT USING (user_id = auth.uid());

-- Owner kan se ventende anmodninger på sin gruppe
DROP POLICY IF EXISTS "join_requests select if owner" ON public.group_join_requests;
CREATE POLICY "join_requests select if owner" ON public.group_join_requests
  FOR SELECT USING (public.is_group_owner(group_id));

-- Brugeren kan annullere egen anmodning
DROP POLICY IF EXISTS "join_requests delete self" ON public.group_join_requests;
CREATE POLICY "join_requests delete self" ON public.group_join_requests
  FOR DELETE USING (user_id = auth.uid());

-- Owner kan slette anmodninger på egen gruppe (decline)
DROP POLICY IF EXISTS "join_requests delete by owner" ON public.group_join_requests;
CREATE POLICY "join_requests delete by owner" ON public.group_join_requests
  FOR DELETE USING (public.is_group_owner(group_id));

-- Insert sker kun via RPC for at undgå at brugere kan oprette anmodninger
-- på grupper de ikke har link til. Ingen INSERT-policy = ingen direkte
-- insert. SECURITY DEFINER-RPC nedenfor opretter rækken.

-- ============================================================
-- RPC: opret eller hent aktiv invitation
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_or_create_group_invitation(p_group_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_token TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Ikke logget ind'; END IF;
  IF NOT public.is_group_owner(p_group_id, v_user) THEN
    RAISE EXCEPTION 'Kun ejere kan generere invitations-link';
  END IF;

  SELECT token INTO v_token
  FROM public.group_invitations
  WHERE group_id = p_group_id AND revoked_at IS NULL
  ORDER BY created_at DESC LIMIT 1;

  IF v_token IS NULL THEN
    v_token := replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public.group_invitations (group_id, token, created_by)
    VALUES (p_group_id, v_token, v_user);
  END IF;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_group_invitation(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_group_invitation(UUID) TO authenticated;

-- ============================================================
-- RPC: revokér aktive invitations + opret nyt token
-- ============================================================

CREATE OR REPLACE FUNCTION public.rotate_group_invitation(p_group_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_token TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Ikke logget ind'; END IF;
  IF NOT public.is_group_owner(p_group_id, v_user) THEN
    RAISE EXCEPTION 'Kun ejere kan rotere invitations-link';
  END IF;

  UPDATE public.group_invitations
  SET revoked_at = now()
  WHERE group_id = p_group_id AND revoked_at IS NULL;

  v_token := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.group_invitations (group_id, token, created_by)
  VALUES (p_group_id, v_token, v_user);

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_group_invitation(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rotate_group_invitation(UUID) TO authenticated;

-- ============================================================
-- RPC: opslag på token (bruges af invitations-siden inden submit)
-- ============================================================

CREATE OR REPLACE FUNCTION public.lookup_invitation(p_token TEXT)
RETURNS TABLE(
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  group_type TEXT,
  visibility TEXT,
  member_count BIGINT,
  is_member BOOLEAN,
  has_pending_request BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_group_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Ikke logget ind'; END IF;

  SELECT i.group_id INTO v_group_id
  FROM public.group_invitations i
  WHERE i.token = p_token AND i.revoked_at IS NULL
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RETURN; -- intet output → invalid/revoked token
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.group_type,
    g.visibility,
    (SELECT count(*) FROM public.user_group_memberships m WHERE m.group_id = g.id),
    EXISTS (SELECT 1 FROM public.user_group_memberships m WHERE m.group_id = g.id AND m.user_id = v_user),
    EXISTS (SELECT 1 FROM public.group_join_requests r WHERE r.group_id = g.id AND r.user_id = v_user)
  FROM public.user_groups g
  WHERE g.id = v_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_invitation(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.lookup_invitation(TEXT) TO authenticated;

-- ============================================================
-- RPC: anmod om adgang via token
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_join_request(p_token TEXT, p_message TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_invitation_id UUID;
  v_group_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Ikke logget ind'; END IF;

  SELECT id, group_id INTO v_invitation_id, v_group_id
  FROM public.group_invitations
  WHERE token = p_token AND revoked_at IS NULL
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Ugyldigt eller udløbet invitations-link';
  END IF;

  -- Allerede medlem? Bare returnér gruppe-id
  IF EXISTS (SELECT 1 FROM public.user_group_memberships WHERE group_id = v_group_id AND user_id = v_user) THEN
    RETURN v_group_id;
  END IF;

  INSERT INTO public.group_join_requests (group_id, user_id, via_invitation_id, message)
  VALUES (v_group_id, v_user, v_invitation_id, NULLIF(trim(coalesce(p_message, '')), ''))
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET requested_at = now(), message = EXCLUDED.message, via_invitation_id = EXCLUDED.via_invitation_id;

  RETURN v_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_join_request(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_join_request(TEXT, TEXT) TO authenticated;

-- ============================================================
-- RPC: godkend anmodning (owner-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_join_request(p_group_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Ikke logget ind'; END IF;
  IF NOT public.is_group_owner(p_group_id, v_user) THEN
    RAISE EXCEPTION 'Kun ejere kan godkende anmodninger';
  END IF;

  -- Tilføj som member
  INSERT INTO public.user_group_memberships (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, 'member')
  ON CONFLICT DO NOTHING;

  -- Fjern anmodningen
  DELETE FROM public.group_join_requests
  WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_join_request(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID, UUID) TO authenticated;

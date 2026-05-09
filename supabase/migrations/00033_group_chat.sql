-- ============================================================
-- Slice B: Chat i private grupper
-- ============================================================
-- Simpelt chatforum: tekst + ét billede pr. besked. Reaktioner,
-- @mentions, fastgjorte beskeder og entity-links er udskudt.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0)
    OR image_url IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_created
  ON public.group_chat_messages(group_id, created_at DESC);

ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Medlemmer kan læse beskeder i grupper de er medlem af
DROP POLICY IF EXISTS "chat select if member" ON public.group_chat_messages;
CREATE POLICY "chat select if member" ON public.group_chat_messages
  FOR SELECT USING (public.is_group_member(group_id));

-- Medlemmer kan poste — men kun som dem selv
DROP POLICY IF EXISTS "chat insert by member" ON public.group_chat_messages;
CREATE POLICY "chat insert by member" ON public.group_chat_messages
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id) AND user_id = auth.uid()
  );

-- Slet egen besked, eller hvis man er ejer af gruppen
DROP POLICY IF EXISTS "chat delete by sender or owner" ON public.group_chat_messages;
CREATE POLICY "chat delete by sender or owner" ON public.group_chat_messages
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_group_owner(group_id)
  );

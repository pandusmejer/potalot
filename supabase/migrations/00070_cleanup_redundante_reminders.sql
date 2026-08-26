-- ============================================================
-- 00070: Engangs-oprydning af redundante opgave-påmindelser
-- ============================================================
-- Følger produktreglen som 00069 netop gjorde til motorens adfærd:
--
--   "En opgave må højst have én aktiv ulæst task-reminder ad gangen."
--
-- Rækkefølgen er bevidst (Anna 26/8): FØRST reglen i motoren, DEREFTER
-- oprydningen efter reglens definition af redundans. Det modsatte ville
-- være at behandle symptomet og håbe, at næste kodeændring matcher bagefter.
--
-- ── Predicate ───────────────────────────────────────────────────────────
-- For hver (bruger, opgave) med FLERE ulæste task-reminders beholdes den
-- NYESTE. Ældre ULÆSTE påmindelser for samme opgave slettes.
--   · Kun type = 'task_reminder'          → andre notifikationstyper røres ikke
--   · Kun is_read = false                 → læste rækker er historik, bevares
--   · Kun rækker med en beholdt søskende  → en enlig påmindelse slettes aldrig
--
-- ── Preview før kørsel (26/8 2026, mod produktion) ──────────────────────
--   69 ulæste → 7 beholdt → 62 slettet
--   fejl_forkert_type: 0 · fejl_læste: 0 · fejl_uden_beholdt_søskende: 0
--   18 notifikationer af andre typer: urørte
--
--   havanna · Udplant chili ................ 25 → beholdt 25/8 → sletter 24
--   havanna · Høst Padron chili ............ 25 → beholdt 25/8 → sletter 24
--   havanna · Skyl alle blade .............. 7  → beholdt 25/8 → sletter 6
--   ralle8k · Vand grønkålen ............... 6  → beholdt 18/8 → sletter 5
--   pandus  · Brøndkarse/Stangbønne × 3 .... 2  → beholdt 31/7 → sletter 1 hver
--
-- Idempotent: efter første kørsel har hver opgave præcis én ulæst
-- påmindelse, så en gentagelse rammer nul rækker.
-- ============================================================

DELETE FROM public.notifications n
USING (
  SELECT id
  FROM (
    SELECT id,
           row_number() OVER (PARTITION BY user_id, link ORDER BY created_at DESC) AS rn
    FROM public.notifications
    WHERE type = 'task_reminder'
      AND is_read = false
  ) r
  WHERE r.rn > 1
) redundante
WHERE n.id = redundante.id;

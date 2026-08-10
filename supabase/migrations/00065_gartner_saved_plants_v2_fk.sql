-- 00065: Ret gartner_saved.plant_id-FK til den RIGTIGE plantetabel.
--
-- 00064 pegede på legacy public.plants (fra 00001), men appen bor i
-- plants_v2 (samme mønster som ai_conversations.log_id → plant_logs_v2 i
-- 00063). Fejlen viste sig som 409/FK-violation på PostgREST ved første
-- "Gem til senere" med plante-kontekst (Annas test 10/8 aften).
--
-- LEKTIE: nye FK'er skal pege på *_v2-tabellerne (plants_v2,
-- plant_logs_v2) — legacy-tabellerne eksisterer stadig og fejler først
-- ved runtime, ikke ved migrationen.

ALTER TABLE public.gartner_saved
  DROP CONSTRAINT IF EXISTS gartner_saved_plant_id_fkey;

ALTER TABLE public.gartner_saved
  ADD CONSTRAINT gartner_saved_plant_id_fkey
  FOREIGN KEY (plant_id) REFERENCES public.plants_v2(id) ON DELETE SET NULL;

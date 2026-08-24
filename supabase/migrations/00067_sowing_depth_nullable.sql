-- 00067 — sowing_depth_mm: ukendt skal kunne skelnes fra overfladesåning
--
-- Defekt: 00016 lagde kolonnen som `INTEGER NOT NULL DEFAULT 0`, og
-- mapperen gjorde `?? 0`. Tre tilstande kollapsede til én værdi:
--   · brugeren har aldrig angivet sådybde
--   · Potalot kender den ikke
--   · frøet skal faktisk overfladesås (0 mm)
-- Frøbanken påstod derfor "Sådybde: 0 mm (overflade)" på poser, hvor ingen
-- havde sagt det. Ukendt er bedre end opdigtet præcision.
--
-- Ny semantik:
--   NULL = ukendt / ikke angivet   0 = eksplicit overfladesåning   >0 = mm
--
-- Kun DETTE felt ændres. Ingen andre dyrkningsfelter gøres nullable.

ALTER TABLE inventory_items ALTER COLUMN sowing_depth_mm DROP NOT NULL;
ALTER TABLE inventory_items ALTER COLUMN sowing_depth_mm DROP DEFAULT;

-- Engangs-oprydning af historiske default-nuller.
--
-- Kun rækker UDEN foto røres. Begrundelse (fuld audit i
-- Docs/product/sowing-depth-audit-2026-08.md): af de fire skriveveje kan
-- guide-autofill aldrig producere 0 (ingen af bibliotekets 176 guides har
-- sowingDepthMm: 0), og den eneste vej der bevidst skriver 0 — AI-læsning
-- af et posefoto — kræver et uploadet billede. Rækker uden foto kan derfor
-- kun have fået deres 0 fra insert-defaulten.
--
-- Bekræftet af oprettelsesmønsteret: to Excel-batches skrev 7 og 6 rækker
-- på samme mikrosekund, alle med 0, heriblandt ært (artsguiden siger 30 mm).
--
-- De 3 foto-bårne nuller (Stangbønne 'Cobra', Brøndkarse, Akshindebæger)
-- røres IKKE — de kan være ægte overfladesåning og afventer Annas svar.
UPDATE inventory_items
SET sowing_depth_mm = NULL
WHERE sowing_depth_mm = 0
  AND primary_image_url IS NULL;

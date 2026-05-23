-- PotAlot: Seed data — demo user, growing guides, and sample data
-- Run this after the migration in the Supabase SQL Editor

-- ============================================
-- 1. DEMO USER (for single-user MVP mode)
-- ============================================
-- The demo user ID must match DEMO_USER_ID in src/lib/demo.ts

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'demo@potalot.app',
  crypt('demo-password-not-used', gen_salt('bf')),
  now(), now(), now(), '', ''
) ON CONFLICT (id) DO NOTHING;

-- The trigger handle_new_user() auto-creates the profile,
-- but in case it didn't fire, upsert explicitly:
INSERT INTO public.profiles (id, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Gartner')
ON CONFLICT (id) DO UPDATE SET display_name = 'Demo Gartner';

-- ============================================
-- 2. PLANT GUIDES (shared reference data)
-- ============================================
INSERT INTO public.plant_guides (slug, name_da, name_en, category, description, sow_indoor_start, sow_indoor_end, sow_outdoor_start, sow_outdoor_end, prick_out_weeks_after_sow, plant_out_start, plant_out_end, harvest_start, harvest_end, days_to_germination_min, days_to_germination_max, days_to_harvest_min, days_to_harvest_max, spacing_cm, depth_cm, sun_requirement, water_need, frost_hardy, tips, companion_plants) VALUES

('tomat', 'Tomat', 'Tomato', 'vegetable',
 'Elsket sommerfrugt der dyrkes bedst i drivhus i Danmark. Kan også klare sig udendørs på lune, solrige steder med en robust sort.',
 'mar', 'apr', NULL, NULL, 3, 'maj', 'jun', 'jul', 'okt',
 5, 10, 60, 90, 50, 0.5, 'full_sun', 'high', false,
 'Knib sideskud af regelmæssigt. Vand jævnt for at undgå revner i frugterne. Gød med tomatgødning hver 2. uge fra blomstring. Bind op løbende. Fjern blade under nederste modne klase.',
 ARRAY['basilikum', 'salat']),

('chili', 'Chili', 'Chili Pepper', 'vegetable',
 'Kræver lang vækstsæson og bør sås tidligt indendørs med bundvarme. Dyrkes bedst i drivhus eller på sydvendt vindueskarm i Danmark.',
 'feb', 'mar', NULL, NULL, 4, 'maj', 'jun', 'aug', 'okt',
 7, 14, 90, 150, 40, 0.5, 'full_sun', 'medium', false,
 'Brug bundvarme ved spiring (25-30°C). Prik ud når første ægte blade vises. Top planten ved 20 cm for bushier vækst. Tålmodighed — chili er langsom i starten.',
 ARRAY['tomat', 'basilikum']),

('agurk', 'Agurk', 'Cucumber', 'vegetable',
 'Hurtigvoksende og meget produktiv. Drivhussorter giver størst udbytte i Danmark. Frilandssorter kan dyrkes udendørs fra juni.',
 'apr', 'maj', 'maj', 'jun', 2, 'maj', 'jun', 'jul', 'sep',
 3, 7, 50, 70, 40, 2.0, 'full_sun', 'high', false,
 'Undgå at vande på bladene — giver meldug. Høst ofte for at fremme ny frugtdannelse. Drivhusagurker kræver ingen bestøvning. Hold jorden jævnt fugtig.',
 ARRAY['salat', 'dild']),

('salat', 'Salat', 'Lettuce', 'vegetable',
 'Hurtig og nem at dyrke. Kan sås i hele sæsonen for løbende høst. Trives bedst i køligt vejr — undgå højsommer.',
 'mar', 'apr', 'apr', 'aug', NULL, 'apr', 'maj', 'maj', 'okt',
 3, 7, 30, 60, 25, 0.5, 'partial_shade', 'medium', false,
 'Så nyt hver 2-3 uger for løbende høst. Giv halvskygge i varmt vejr for at undgå at den går i stok. Høst om morgenen for bedste kvalitet og sprødhed.',
 ARRAY['tomat', 'agurk']),

('spinat', 'Spinat', 'Spinach', 'vegetable',
 'Nemt, hurtigt og sundt. Trives bedst i det kølige forår og efterår. Går hurtigt i blomst i varme.',
 'mar', 'apr', 'mar', 'sep', NULL, NULL, NULL, 'apr', 'nov',
 5, 10, 30, 45, 15, 2.0, 'partial_shade', 'medium', true,
 'Bedst som tidlig forårs- eller sen eftersåning. Går hurtigt i blomst i varme perioder. Kan overvintre med dækning af halm eller fiberdug. Høst de yderste blade først.',
 ARRAY['salat']),

('pak-choi', 'Pak Choi', 'Pak Choi', 'vegetable',
 'Hurtigvoksende asiatisk bladgrøntsag. Perfekt til sen såning og efterårshøst. Mild smag og nem at tilberede.',
 'apr', 'maj', 'jul', 'aug', NULL, 'maj', 'jun', 'jun', 'nov',
 3, 7, 30, 50, 20, 1.0, 'partial_shade', 'medium', false,
 'Bedst som eftersåning juli-august for at undgå at den skyder. Dæk med insektnet mod jordlopper. Kan høstes som babyleaf allerede efter 3-4 uger.',
 ARRAY['salat', 'spinat']),

('dahlia', 'Dahlia', 'Dahlia', 'flower',
 'Spektakulær sensommerblomst med utallige sorter. Knolde skal graves op og opbevares frostfrit om vinteren.',
 'mar', 'apr', NULL, NULL, NULL, 'maj', 'jun', 'jul', 'okt',
 7, 14, 90, 120, 60, 5.0, 'full_sun', 'medium', false,
 'Forspir indendørs fra marts for tidlig blomstring. Plant ud efter sidste frost (medio maj). Knib toppen for bushier vækst og flere blomster. Grav knolde op før første nattefrost.',
 NULL),

('solhat', 'Solhat', 'Echinacea', 'flower',
 'Smuk og hårdført flerårig staude. Tiltrækker bier og sommerfugle. Klassiker i den danske staudehave.',
 'mar', 'apr', 'apr', 'maj', NULL, 'maj', 'jun', 'jul', 'sep',
 10, 21, 120, 150, 40, 0.5, 'full_sun', 'low', true,
 'Tålmodighed — langsom at etablere sig det første år. Klarer sig fint i mager, veldrænet jord. Lad frøstande stå hen over vinteren til fuglene. Dele planten hvert 3-4 år.',
 NULL)

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. DEMO SEEDS
-- ============================================
INSERT INTO public.seeds (id, user_id, guide_id, name, variety, brand, quantity, year_purchased, expiry_year, notes, status) VALUES
('a0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'tomat'),
 'Tomat', 'San Marzano', 'Impecta', 25, 2026, 2029,
 'Flasketype, perfekt til sauce. Købt i Plantorama.', 'sown'),

('a0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'chili'),
 'Chili', 'Habanero', 'Chili Klaus', 15, 2026, 2028,
 'Stærk! Skal sås tidligt med bundvarme.', 'sown'),

('a0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'agurk'),
 'Agurk', 'Marketmore', NULL, 20, 2026, 2029,
 'Frilandssort, robust og produktiv.', 'in_stock'),

('a0000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'salat'),
 'Salat', 'Lollo Rossa', 'Nelson Garden', 50, 2025, 2028,
 NULL, 'in_stock'),

('a0000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'dahlia'),
 'Dahlia', 'Café au Lait', NULL, 3, 2026, NULL,
 'Knolde opbevaret i kælderen.', 'in_stock')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. DEMO PLANTS
-- ============================================
INSERT INTO public.plants (id, user_id, seed_id, guide_id, name, variety, status, location, sow_date, germination_date, quantity, notes) VALUES
('b0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'tomat'),
 'Tomat', 'San Marzano', 'germinated', 'Vindueskarm, stue',
 '2026-02-20', '2026-03-01', 8,
 'Spiret fint efter 9 dage. 6 ud af 8 frø spirede.'),

('b0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.plant_guides WHERE slug = 'chili'),
 'Chili', 'Habanero', 'sown', 'Bundvarme, kontor',
 '2026-02-10', NULL, 5,
 'Sået med bundvarme. Venter stadig på spiring — chilier er langsomme.'),

('b0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 NULL,
 (SELECT id FROM public.plant_guides WHERE slug = 'salat'),
 'Salat', 'Lollo Rossa', 'planned', NULL,
 NULL, NULL, 10,
 'Planlægger at så direkte udendørs i april.')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. DEMO TASKS
-- ============================================
INSERT INTO public.tasks (id, user_id, plant_id, title, task_type, due_date, priority) VALUES
-- Upcoming tasks
('c0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'Prik tomater ud i individuelle potter', 'prick_out',
 CURRENT_DATE + INTERVAL '2 days', 'high'),

('c0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'Vand tomatplanter', 'water',
 CURRENT_DATE, 'medium'),

('c0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000002',
 'Tjek chili-spiring', 'custom',
 CURRENT_DATE + INTERVAL '1 day', 'medium'),

('c0000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 NULL,
 'Køb pottejord og gødning', 'custom',
 CURRENT_DATE + INTERVAL '5 days', 'low'),

('c0000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000003',
 'Så salat direkte udendørs', 'sow',
 CURRENT_DATE + INTERVAL '30 days', 'medium'),

('c0000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'Gød tomaterne med flydende gødning', 'fertilize',
 CURRENT_DATE + INTERVAL '10 days', 'medium')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. DEMO NOTES
-- ============================================
INSERT INTO public.notes (id, user_id, plant_id, guide_id, title, content, tags, season_year, note_date) VALUES
('d0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.plant_guides WHERE slug = 'tomat'),
 'Tomat-spiring gik fint',
 'Sået San Marzano d. 20. feb i små potter med frøjord. Stillede dem på vindueskarm med plastik over. 6 ud af 8 spirede efter ca. 9 dage. Næste gang: så lidt færre, de tager meget plads når de skal prikkes ud.',
 ARRAY['spiring', 'tomat'], 2026, '2026-03-01'),

('d0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.plant_guides WHERE slug = 'chili'),
 'Chili sået med bundvarme',
 'Satte Habanero-frø i små potter med bundvarme (varmemåtte). Temperaturen ligger stabilt på 27°C. Chilier kan tage 2-3 uger om at spire, så tålmodighed.',
 ARRAY['chili', 'spiring', 'bundvarme'], 2026, '2026-02-10'),

('d0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 NULL, NULL,
 'Sæsonplan 2026',
 'Fokusområder i år: tomater (San Marzano til sauce), chili (Habanero), og salat til løbende høst. Vil prøve dahlia for første gang. Agurker sås direkte i drivhuset i maj.',
 ARRAY['plan', 'sæson'], 2026, '2026-01-15')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. DEMO SEASON
-- ============================================
INSERT INTO public.seasons (user_id, year, name, summary) VALUES
('00000000-0000-0000-0000-000000000001', 2026, 'Sæson 2026',
 'Fokus på tomater, chili og salat. Første år med dahlia.')
ON CONFLICT (user_id, year) DO NOTHING;

-- ============================================
-- 8. DEMO NOTIFICATION PREFERENCES
-- ============================================
INSERT INTO public.notification_preferences (user_id, push_enabled, daily_reminder_time, remind_task_due, remind_days_before, remind_watering) VALUES
('00000000-0000-0000-0000-000000000001', false, '08:00', true, 1, true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 9. DEMO INVENTORY (frøbank v2/v3)
-- ============================================
-- Syv frø med komponerede frøkort-fotos i /public/images/froebank,
-- så Frøkort-designet kan verificeres på tværs af afgrøder
-- og chips-kombinationer (forspires/så direkte/udplantes).
INSERT INTO public.inventory_items (
  id, user_id, name, variety, latin_name, supplier,
  primary_category_id, subcategory_id,
  seed_count, purchase_year,
  sowing_months, sowing_depth_mm, pre_cultivation,
  planting_out_months, harvest_months,
  light, water, germination_days, plant_spacing,
  growing_locations, status, is_favorite, is_pinned,
  primary_image_url
) VALUES
('c0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'Tomat', 'Cherry Sweetie', 'Solanum lycopersicum', 'Frøsalg',
 'fro', 'groentsager',
 12, 2026,
 ARRAY[3,4], 5, true,
 ARRAY[5,6], ARRAY[7,8,9],
 'full_sun', 'high', '7-14 dage', '50 cm',
 ARRAY['drivhus','have']::TEXT[], 'i_froebank', true, false,
  '/images/froebank/froekort-cherrytomat.png'),

('c0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'Chili', 'Habanero Orange', 'Capsicum chinense', 'Solhatten',
 'fro', 'groentsager',
 8, 2026,
 ARRAY[2,3], 5, true,
 ARRAY[5,6], ARRAY[8,9,10],
 'full_sun', 'regular', '14-21 dage', '40 cm',
 ARRAY['drivhus']::TEXT[], 'i_froebank', false, false,
  '/images/froebank/froekort-chili-habanero-orange.png'),

('c0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'Peberfrugt', 'California Wonder', 'Capsicum annuum', 'Frøsalg',
 'fro', 'groentsager',
 10, 2026,
 ARRAY[3], 5, true,
 ARRAY[5,6], ARRAY[8,9],
 'full_sun', 'regular', '10-14 dage', '40 cm',
 ARRAY['drivhus']::TEXT[], 'i_froebank', false, false,
  '/images/froebank/froekort-peberfrugt-california-wonder.png'),

('c0000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 'Squash', 'Eight Ball', 'Cucurbita pepo', 'Solhatten',
 'fro', 'groentsager',
 10, 2026,
 ARRAY[4,5], 20, true,
 ARRAY[5,6], ARRAY[7,8,9],
 'full_sun', 'high', '7-10 dage', '90 cm',
 ARRAY['have','drivhus']::TEXT[], 'i_froebank', false, false,
  '/images/froebank/froekort-squash-eight-ball.png'),

('c0000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'Stangbønne', 'Cobra', 'Phaseolus vulgaris', 'Frøsalg',
 'fro', 'groentsager',
 24, 2026,
 ARRAY[5,6], 25, false,
 ARRAY[]::INTEGER[], ARRAY[8,9],
 'full_sun', 'regular', '7-14 dage', '15 cm',
 ARRAY['have']::TEXT[], 'i_froebank', false, false,
  '/images/froebank/froekort-stangboenne-cobra.png'),

('c0000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 'Agurk', 'Marketmore', 'Cucumis sativus', 'Solhatten',
 'fro', 'groentsager',
 15, 2026,
 ARRAY[4,5], 10, true,
 ARRAY[6], ARRAY[7,8,9],
 'full_sun', 'high', '5-10 dage', '40 cm',
 ARRAY['drivhus']::TEXT[], 'i_froebank', false, false,
  '/images/froebank/froekort-agurk-marketmore.png'),

('c0000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000001',
 'Salat', 'Crispy Mint', 'Lactuca sativa', 'Solhatten',
 'fro', 'groentsager',
 200, 2025,
 ARRAY[3,4,5,6,7,8], 5, false,
 ARRAY[]::INTEGER[], ARRAY[5,6,7,8,9],
 'partial_shade', 'regular', '7-10 dage', '25 cm',
 ARRAY['have','drivhus']::TEXT[], 'i_froebank', false, true,
  '/images/froebank/froekort-salat-crispy-mint.png')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. DEMO PLANTS V2 (aktive planter)
-- ============================================
-- Fire planter med varierede statusser så Plantekort-designet
-- kan testes mod alle vækstfaser, og to har foto (Tomat + Chili).
INSERT INTO public.plants_v2 (
  id, user_id, source_inventory_id,
  name, variety, status, location,
  sow_date, planting_out_date, quantity,
  primary_image_url, is_archived
) VALUES
('b1000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000001',
 'Tomat', 'San Marzano', 'klar_til_udplantning', 'Vindueskarm',
 '2026-03-15', NULL, 6,
 '/images/groentsager/Cherrytomat%20Potalot.png', false),

('b1000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 NULL,
 'Sukkerært', 'Sugar Snap', 'spirer', 'Have, sydbed',
 '2026-04-10', NULL, 12,
 NULL, false),

('b1000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 NULL,
 'Dahlia', 'Café au Lait', 'planlagt', NULL,
 NULL, NULL, 3,
 NULL, false),

('b1000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002',
 'Chili', 'Habanero', 'i_vaekst', 'Drivhus',
 '2026-02-20', NULL, 5,
 '/images/groentsager/Chiliplante%20Potalot.png', false),

-- Yderligere planter linket til Agurk + Stangbønne. Deres eneste
-- formål er at give frøkort-demoen den fulde range af ring-states:
-- terracotta (meget lav, <10%), ochre (lav, <30%), ivory (normal).
('b1000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000006',
 'Agurk', 'Marketmore', 'i_vaekst', 'Drivhus',
 '2026-04-10', NULL, 14, NULL, false),

('b1000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000005',
 'Stangbønne', 'Cobra', 'spirer', 'Have, sydbed',
 '2026-05-05', NULL, 6, NULL, false)

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. DEMO SOWING EVENTS (frøtæller-variation)
-- ============================================
-- Disse hændelser eksisterer udelukkende for at give frøkort-ringen
-- realistisk variation i remaining/total. Uden dem ville alle rings
-- vise 100%. Forholdene rammer bevidst de tre farvestadier:
--   • Agurk:      1/15  =  6.7% → terracotta (meget lav)
--   • Chili:      1/8   = 12.5% → ochre (lav)
--   • Tomat:      5/12  = 41.7% → ivory (normal, knap halv)
--   • Stangbønne: 18/24 = 75.0% → ivory (normal)
--   • Peberfrugt / Squash / Salat — ingen events → 100% ivory.
INSERT INTO public.sowing_events
  (user_id, plant_id, inventory_item_id, sown_count, sowing_date, container_type, location)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   7, '2026-03-15', 'Såbakke', 'Vindueskarm'),
  ('00000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000002',
   7, '2026-02-20', 'Plugbox', 'Drivhus'),
  ('00000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000006',
   14, '2026-04-10', 'Plugbox', 'Drivhus'),
  ('00000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000006',
   'c0000000-0000-0000-0000-000000000005',
   6, '2026-05-05', 'Direkte friland', 'Have, sydbed')
ON CONFLICT DO NOTHING;

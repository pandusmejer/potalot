-- Antal gøremål: 48
-- Seed: månedens gøremål (Annas copy) → general_garden_tasks
-- Genereret fra src/lib/kalender/maaneds-copy.ts. Idempotent (title+month-guard).
-- IKKE anvendt mod live-DB af Claude — køres i frisk tråd med DB-adgang.

-- Januar
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Gennemgå dine frø', 'Kig frøposerne igennem, fjern gamle sorter, og noter hvad du mangler til den nye sæson.', 1, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Gennemgå dine frø' and g.month = 1);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Rengør potter og bakker', 'Vask potter, såbakker og planteskilte, så du mindsker risikoen for sygdomme, når forspiringen begynder.', 1, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Rengør potter og bakker' and g.month = 1);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Tjek redskaberne', 'Slib beskæresakse, rens haveredskaber, og gør det let at komme i gang, når jorden igen kalder.', 1, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Tjek redskaberne' and g.month = 1);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Planlæg årets første såninger', 'Skriv ned, hvad du vil forspire først, og hvornår du realistisk har plads og lys til det.', 1, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Planlæg årets første såninger' and g.month = 1);

-- Februar
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Start de langsomme frø', 'Forspir chili, peberfrugt og andre langsomme afgrøder, hvis du har lys og varme nok.', 2, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Start de langsomme frø' and g.month = 2);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Beskær frugttræer på milde dage', 'Beskær æble- og pæretræer, når vejret er tørt og frostfrit.', 2, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Beskær frugttræer på milde dage' and g.month = 2);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Gør drivhus eller vindueskarm klar', 'Ryd plads, vask overflader, og find bakker, jord og skilte frem.', 2, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Gør drivhus eller vindueskarm klar' and g.month = 2);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Tjek overvintrende planter', 'Se efter udtørring, skimmel og skadedyr hos planter, der står i læ eller indendørs.', 2, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Tjek overvintrende planter' and g.month = 2);

-- Marts
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så de første robuste afgrøder', 'Så fx spinat, radiser og salat på lune steder, hvis jorden er tjenlig.', 3, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så de første robuste afgrøder' and g.month = 3);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Forbedr jorden', 'Læg kompost eller jordforbedring ud, så bedene får ny næring før hovedsæsonen.', 3, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Forbedr jorden' and g.month = 3);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Klargør bede', 'Fjern visne rester, løsn forsigtigt jorden, og gør plads til de første såninger.', 3, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Klargør bede' and g.month = 3);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Start forspiring inde', 'Forspir tomat, kål, krydderurter og blomster, hvis de passer til din plan og plads.', 3, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Start forspiring inde' and g.month = 3);

-- April
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Prikl forspirede planter om', 'Giv småplanter mere plads, når de står tæt eller har fået de første rigtige blade.', 4, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Prikl forspirede planter om' and g.month = 4);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så direkte i bedene', 'Så robuste grøntsager og blomster, når jorden er lun nok.', 4, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så direkte i bedene' and g.month = 4);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Lug tidligt', 'Fjern småt ukrudt, før det får rødder nok til at blive et fritidsprojekt.', 4, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Lug tidligt' and g.month = 4);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Beskyt mod kolde nætter', 'Dæk sarte planter med fiberdug, hvis vejret lover frost eller hård kulde.', 4, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Beskyt mod kolde nætter' and g.month = 4);

-- Maj
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Hærd planter af', 'Sæt forspirede planter ud i korte perioder, så de vænner sig til vind, sol og køligere luft.', 5, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Hærd planter af' and g.month = 5);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Plant ud efter vejret', 'Plant tomater, chili, blomster og andre sarte planter ud, når nætterne er milde nok.', 5, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Plant ud efter vejret' and g.month = 5);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Vand nyplantede planter', 'Giv nyplantede planter vand regelmæssigt, mens rødderne finder vej i jorden.', 5, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Vand nyplantede planter' and g.month = 5);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Sæt støtte op tidligt', 'Bind høje stauder, tomater og klatreplanter op, før de vælter eller knækker.', 5, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Sæt støtte op tidligt' and g.month = 5);

-- Juni
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Vand, gød og bind planter op', 'Juni er vækstmåned, og mange planter har brug for både vand, næring og støtte.', 6, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Vand, gød og bind planter op' and g.month = 6);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Hold øje med tørke og varme', 'Krukker, kapillærkasser og nyplantede planter tørrer hurtigst ud.', 6, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Hold øje med tørke og varme' and g.month = 6);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Høst lidt ad gangen', 'Pluk salat, krydderurter og de første grøntsager løbende, så planterne bliver ved.', 6, 'Høst', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Høst lidt ad gangen' and g.month = 6);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så i flere omgange', 'Så fx salat, radiser eller bønner igen, så du får høst over længere tid.', 6, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så i flere omgange' and g.month = 6);

-- Juli
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Høst ofte', 'Pluk grøntsager, bær og krydderurter løbende, så planterne ikke går i stå eller bliver grove.', 7, 'Høst', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Høst ofte' and g.month = 7);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Vand dybt', 'Giv færre, grundige vandinger frem for små sjatter på overfladen.', 7, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Vand dybt' and g.month = 7);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så til sensommeren', 'Så fx spinat, salat, radiser eller asiatiske bladgrøntsager til senere høst.', 7, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så til sensommeren' and g.month = 7);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Hold øje med skadedyr', 'Tjek især kål, bønner, salat og unge planter for snegle, lus og larver.', 7, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Hold øje med skadedyr' and g.month = 7);

-- August
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Høst og ryd op løbende', 'Pluk modne afgrøder, og fjern planterester, der skygger eller spreder sygdom.', 8, 'Høst', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Høst og ryd op løbende' and g.month = 8);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så igen', 'Så hurtige afgrøder som spinat, salat, radiser eller dild til sensommerbrug.', 8, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så igen' and g.month = 8);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Hold jorden dækket', 'Brug kompost, afklip eller grønt plantemateriale, så jorden ikke tørrer unødigt ud.', 8, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Hold jorden dækket' and g.month = 8);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Tag stiklinger og frø', 'Saml frø fra udvalgte planter, og tag stiklinger fra urter eller blomster, du vil gemme.', 8, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Tag stiklinger og frø' and g.month = 8);

-- September
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Høst det modne', 'Pluk tomater, bønner, æbler, krydderurter og blomster, mens kvaliteten stadig er god.', 9, 'Høst', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Høst det modne' and g.month = 9);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Så efterårsgrønt', 'Så fx spinat, vintersalat eller grøngødning, hvis vejret og pladsen passer.', 9, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Så efterårsgrønt' and g.month = 9);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Plant forårsløg', 'Læg blomsterløg, så de kan nå at etablere sig før vinteren.', 9, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Plant forårsløg' and g.month = 9);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Giv jorden kompost', 'Læg kompost på tomme bede, så jorden får nyt liv efter sommerens dyrkning.', 9, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Giv jorden kompost' and g.month = 9);

-- Oktober
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Plant stauder, buske og træer', 'Efterårsjorden giver rødderne tid til at etablere sig før næste vækstsæson.', 10, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Plant stauder, buske og træer' and g.month = 10);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Saml blade til jorddække', 'Brug blade i bede eller kompost, så de bliver til næring i stedet for affald.', 10, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Saml blade til jorddække' and g.month = 10);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Beskyt sarte planter', 'Flyt krukker i læ, og dæk planter, der ikke tåler frost.', 10, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Beskyt sarte planter' and g.month = 10);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Læg de sidste forårsløg', 'Sæt tulipaner, narcisser og andre løg, før jorden bliver for kold.', 10, 'Såning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Læg de sidste forårsløg' and g.month = 10);

-- November
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Frostsikr krukker og vand', 'Tøm slanger, vandkander og beholdere, og flyt frostsarte krukker i læ.', 11, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Frostsikr krukker og vand' and g.month = 11);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Dæk bar jord', 'Læg blade, kompost eller andet organisk materiale på tomme bede.', 11, 'Jord', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Dæk bar jord' and g.month = 11);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Lad noget stå', 'Behold visne stængler og frøstande, hvor de kan give ly og føde til smådyr.', 11, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Lad noget stå' and g.month = 11);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Ryd redskaber væk', 'Rens og tør redskaber, så de ikke ruster eller ligger glemt i regnen.', 11, 'Pleje', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Ryd redskaber væk' and g.month = 11);

-- December
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Kig tilbage på sæsonen', 'Notér hvilke sorter, placeringer og metoder der fungerede, mens du stadig kan huske det.', 12, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Kig tilbage på sæsonen' and g.month = 12);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Tjek frost og vind', 'Se til krukker, dækkede planter og løse ting efter blæst eller frost.', 12, 'Beskyttelse', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Tjek frost og vind' and g.month = 12);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Planlæg næste års dyrkning', 'Vælg få vigtige ændringer, så planen bliver brugbar og ikke bare smuk på papir.', 12, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Planlæg næste års dyrkning' and g.month = 12);
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
select 'Bestil eller ønsk frø', 'Lav en rolig liste over sorter, du mangler, før forårets frøpanik begynder.', 12, 'Planlægning', 'medium', 'yearly', true
where not exists (select 1 from public.general_garden_tasks g where g.title = 'Bestil eller ønsk frø' and g.month = 12);


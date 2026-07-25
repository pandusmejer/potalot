# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/91207c15-3fb0-419a-8bf7-d8008b2ea441

Status **24/7 2026** (131 guides: 82 arts · 37 sorts · 12 teknik):
**55 fotos mangler** (35 arter + 20 sorter). 64 er på plads.

**Teknikguider tæller ikke med** — de har med vilje intet hero-foto. Farveblok-introen
ER deres hero, og deres fotos ligger inline ved trinnet via `@foto`
(se editorial-reglen "Billeder i teknikguider" + `knibning-af-tomater.md` som eksempel).

**Sådan:** læg foto i `_foto-indbakke/` og kør `npm run add:photo <fil> <arts|plantekort|frokort> "<Art>" ["<Sort>"]`.
(`guides:intake` matcher kun fotos mod guides fra *samme* kørsel — til en guide der
allerede er live, er `add:photo` vejen.)

**Format:** arts-hero = 4:3 liggende (1600×1200). Plantekort = **4:5 stående**
(1440×1800) — kortet rendrer med `object-cover` i en 4:5-ramme, så et 2:3-foto
får ~17 % af højden skåret væk i top og bund.

---

## 🥇 Tier 1 — arts-hero (35) · øverst: hver anker en hel familie

### Frugtbuske & frugttræer (10 — batch 5+6, ingen af dem har foto endnu)
- [ ] **Æble** → `arts/aeble.jpg`
- [ ] **Blåbær** → `arts/blaabaer.jpg`
- [ ] **Blomme** → `arts/blomme.jpg`
- [ ] **Brombær** → `arts/brombaer.jpg`
- [ ] **Hindbær** → `arts/hindbaer.jpg`
- [ ] **Kirsebær** → `arts/kirsebaer.jpg`
- [ ] **Pære** → `arts/paere.jpg`
- [ ] **Ribs** → `arts/ribs.jpg`
- [ ] **Solbær** → `arts/solbaer.jpg`
- [ ] **Stikkelsbær** → `arts/stikkelsbaer.jpg`

### Prydgræsser · batch 7 (6)
- [ ] **Blåtop** → `arts/blaatop.jpg`
- [ ] **Elefantgræs** → `arts/elefantgraes.jpg`
- [ ] **Hakonegræs** → `arts/hakonegraes.jpg`
- [ ] **Lampepudsergræs** → `arts/lampepudsergraes.jpg`
- [ ] **Rørhvene** → `arts/roerhvene.jpg`
- [ ] **Staudehirse** → `arts/staudehirse.jpg`

### Køkkenhave · batch 8–10 (18)
- [ ] **Artiskok** → `arts/artiskok.jpg`
- [ ] **Asparges** → `arts/asparges.jpg`
- [ ] **Cikorie** → `arts/cikorie.jpg`
- [ ] **Endivie** → `arts/endivie.jpg`
- [ ] **Havrerod** → `arts/havrerod.jpg`
- [ ] **Jordskok** → `arts/jordskok.jpg`
- [ ] **Kålroe** → `arts/kaalroe.jpg`
- [ ] **Majroe** → `arts/majroe.jpg`
- [ ] **Okra** → `arts/okra.jpg`
- [ ] **Pak choi** → `arts/pak-choi.jpg`
- [ ] **Pastinak** → `arts/pastinak.jpg`
- [ ] **Peberrod** → `arts/peberrod.jpg`
- [ ] **Portulak** → `arts/portulak.jpg`
- [ ] **Rucola** → `arts/rucola.jpg`
- [ ] **Skorzonerrod** → `arts/skorzonerrod.jpg`
- [ ] **Sød kartoffel** → `arts/soed-kartoffel.jpg`
- [ ] **Tomatillo** → `arts/tomatillo.jpg`
- [ ] **Vårsalat** → `arts/vaarsalat.jpg`

### Blomster (1)
- [ ] **Morgenfrue** → `arts/morgenfrue.jpg`

## 🥈 Tier 2 — plantekort (20) · grupperet pr. familie

### Agurk (3)
- [ ] Cucino → `plantekort/agurk-cucino.jpg`
- [ ] Lemon → `plantekort/agurk-lemon.jpg`
- [ ] Mini Stars → `plantekort/agurk-mini-stars.jpg`

### Kål (3)
- [ ] Palmekål → `plantekort/kaal-palmekaal.jpg`
- [ ] Rødkål → `plantekort/kaal-roedkaal.jpg`
- [ ] Spidskål → `plantekort/kaal-spidskaal.jpg`

### Hvidløg (3)
- [ ] Germidour → `plantekort/hvidloeg-germidour.jpg`
- [ ] Messidrome → `plantekort/hvidloeg-messidrome.jpg`
- [ ] Thermidrome → `plantekort/hvidloeg-thermidrome.jpg`

### Ært (2)
- [ ] Ambrosia → `plantekort/aert-ambrosia.jpg`
- [ ] Kelvedon Wonder → `plantekort/aert-kelvedon-wonder.jpg`

### Jordbær (2)
- [ ] Corona → `plantekort/jordbaer-corona.jpg`
- [ ] Mara des Bois → `plantekort/jordbaer-mara-des-bois.jpg`

### Radise (2)
- [ ] French Breakfast → `plantekort/radise-french-breakfast.jpg`
- [ ] Sora → `plantekort/radise-sora.jpg`

### Salat (2)
- [ ] Buttercrunch → `plantekort/salat-buttercrunch.jpg`
- [ ] Rouge Grenobloise → `plantekort/salat-rouge-grenobloise.jpg`

### Chili (2)
- [ ] De Cayenne → `plantekort/chili-de-cayenne.jpg`
- [ ] Early Jalapeño → `plantekort/chili-early-jalapeno.jpg`

### Majs (1)
- [ ] Incredible → `plantekort/majs-incredible.jpg`  *(kandidat kasseret 24/7 — nyt foto ønskes)*

---

## 📸 Teknik-fotos (uden for listen — inline, ikke hero)

- [ ] `makro/knibning-af-tomater/sideskud.jpg` — trin 02, identifikation
- [ ] `makro/knibning-af-tomater/knib-basis.jpg` — trin 03, håndgreb

Lægges direkte i `public/images/makro/<mappe>/` og erstatter automatisk
"Foto kommer"-placeholderen i guiden.

---

## ✅ Allerede på plads (64)

47 arter + 17 sorter — af 119 guides med hero-krav. `npm run guides:status` er den autoritative kilde —
dette dokument regenereres ud fra den.

**Forældreløse plantekort-fotos:** 18 fotos ligger i `plantekort/` til sorter der
endnu ikke har en guide (fx Gulerod Nantes, Rødbede Boltardy, Stangbønne Cobra).
De aktiveres ved at skrive de tilhørende sortsguider — ikke ved nye fotos.

---

*Regenerér efter nye batches / nye fotos: `npm run guides:status`.*

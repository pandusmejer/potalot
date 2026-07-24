# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/91207c15-3fb0-419a-8bf7-d8008b2ea441

Status **24/7 2026** (107 guides: 58 arts · 37 sorts · 12 teknik):
**33 fotos mangler** (11 arter + 22 sorter). 62 er på plads.

**Teknikguider tæller ikke med** — de har med vilje intet hero-foto. Farveblok-introen
ER deres hero, og deres fotos ligger inline ved trinnet via `@foto`
(se editorial-reglen "Billeder i teknikguider" + `knibning-af-tomater.md` som eksempel).

**Sådan:** læg foto i `_foto-indbakke/` navngivet efter **slug** (fx `rabarber.jpg`,
`tomat-black-cherry.jpg`), kør `npm run guides:intake`. Mappen vælges automatisk
efter niveau (art → `arts/`, sort → `plantekort/`), originalen arkiveres.

---

## 🥇 Tier 1 — arts-hero (11) · øverst: hver anker en hel familie

### Frugtbuske & frugttræer (8 — batch 5+6, ingen af dem har foto endnu)
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

### Øvrige (3)
- [ ] **Citronmelisse** → `arts/citronmelisse.jpg`  *(ny guide 24/7)*
- [ ] **Morgenfrue** → `arts/morgenfrue.jpg`
- [ ] **Rabarber** → `arts/rabarber.jpg`  *(ny guide 24/7)*

## 🥈 Tier 2 — plantekort (22) · grupperet pr. familie

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
- [ ] Incredible → `plantekort/majs-incredible.jpg`

---

## 📸 Teknik-fotos (uden for listen — inline, ikke hero)

- [ ] `makro/knibning-af-tomater/sideskud.jpg` — trin 02, identifikation
- [ ] `makro/knibning-af-tomater/knib-basis.jpg` — trin 03, håndgreb

Lægges direkte i `public/images/makro/<mappe>/` og erstatter automatisk
"Foto kommer"-placeholderen i guiden.

---

## ✅ Allerede på plads (62)

45 arter + 17 sorter. `npm run guides:status` er den autoritative kilde —
dette dokument regenereres ud fra den.

---

*Regenerér efter nye batches / nye fotos: `npm run guides:status`.*

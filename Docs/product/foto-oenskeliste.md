# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/91207c15-3fb0-419a-8bf7-d8008b2ea441

Status **28/7 2026** (131 guides: 82 arts · 37 sorts · 12 teknik):
**13 fotos mangler** — alle sortskort (plantekort). **Alle 82 arts-heroes er på plads.** 106 er på plads.

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

## 🥇 Tier 1 — arts-hero ✅ FÆRDIG

Alle 82 arts-guider har nu et hero-foto (28/7). Frugtbuske/-træer,
prydgræsser, blomster og hele køkkenhave-serien er lukket.

## 🥈 Tier 2 — plantekort (13) · grupperet pr. familie · alt der mangler nu

### Agurk (3)
- [ ] Cucino → `plantekort/agurk-cucino.jpg`
- [ ] Lemon → `plantekort/agurk-lemon.jpg`
- [ ] Mini Stars → `plantekort/agurk-mini-stars.jpg`

### Kål (3)
- [ ] Palmekål → `plantekort/kaal-palmekaal.jpg`
- [ ] Rødkål → `plantekort/kaal-roedkaal.jpg`
- [ ] Spidskål → `plantekort/kaal-spidskaal.jpg`

### Ært (2)
- [ ] Ambrosia → `plantekort/aert-ambrosia.jpg`
- [ ] Kelvedon Wonder → `plantekort/aert-kelvedon-wonder.jpg`

### Jordbær (2)
- [ ] Corona → `plantekort/jordbaer-corona.jpg`
- [ ] Mara des Bois → `plantekort/jordbaer-mara-des-bois.jpg`

### Salat (2)
- [ ] Buttercrunch → `plantekort/salat-buttercrunch.jpg`
- [ ] Rouge Grenobloise → `plantekort/salat-rouge-grenobloise.jpg`

### Majs (1)
- [ ] Incredible → `plantekort/majs-incredible.jpg`  *(kandidat kasseret 24/7 — nyt foto ønskes)*

---

## 📸 Teknik-fotos (uden for listen — inline, ikke hero)

- [ ] `makro/knibning-af-tomater/sideskud.jpg` — trin 02, identifikation
- [ ] `makro/knibning-af-tomater/knib-basis.jpg` — trin 03, håndgreb

Lægges direkte i `public/images/makro/<mappe>/` og erstatter automatisk
"Foto kommer"-placeholderen i guiden.

---

## ✅ Allerede på plads (106)

**82 arter (ALLE) + 24 sorter** — af 119 guides med hero-krav. `npm run guides:status`
er den autoritative kilde — dette dokument regenereres ud fra den.

**Nyt 27–28/7:** samtlige 35 manglende arts-heroes lagt ind (frugtbuske/-træer,
prydgræsser, morgenfrue, hele køkkenhave-serien) + 7 plantekort (hvidløg-, radise-
og chili-grupperne). Arts-hero-siden er hermed 100 % dækket. Husk: hero kræver
`npm run import:guides` bagefter, ellers sætter `primaryImageId` sig ikke og
guiden viser ingen hero.

**Forældreløse plantekort-fotos:** 18 fotos ligger i `plantekort/` til sorter der
endnu ikke har en guide (fx Gulerod Nantes, Rødbede Boltardy, Stangbønne Cobra).
De aktiveres ved at skrive de tilhørende sortsguider — ikke ved nye fotos.

---

*Regenerér efter nye batches / nye fotos: `npm run guides:status`.*

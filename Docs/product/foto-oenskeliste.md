# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/91207c15-3fb0-419a-8bf7-d8008b2ea441

Status **30/7 2026** (171 guides: 122 arts · 37 sorts · 12 teknik):
**53 fotos mangler** (40 prydhave/busk/klatre-arter + 13 sortskort). **106 af 159 er på plads.**

**Hero-sort:** hver prydhave-art har en anbefalet flagskibs-sort at fotografere
(fra `Docs/product/sortsplan-batch-13-19.md` — som også holder de ~240 prioriterede
sorter til sorts-fasen). Fotograf: fang den angivne sort.

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

## 🥇 Tier 1 — arts-hero (40) · prydhaven (batch 13–19)

Køkkenhave, frugt og etårige er 100 % dækket. Prydhave-arterne mangler hero.
Format: `arts/<slug>.jpg`, 4:3 liggende 1600×1200. *Hero:* sorten der skal fanges.

### Forårsløg · batch 13 (7)
- [ ] **Tulipan** → `arts/tulipan.jpg` · *hero: Queen of Night*
- [ ] **Påskelilje** → `arts/paaskelilje.jpg` · *hero: Dutch Master*
- [ ] **Krokus** → `arts/krokus.jpg` · *hero: Jeanne d'Arc*
- [ ] **Prydallium** → `arts/prydallium.jpg` · *hero: Purple Sensation*
- [ ] **Vintergæk** → `arts/vintergaek.jpg` · *hero: arten*
- [ ] **Erantis** → `arts/erantis.jpg` · *hero: arten*
- [ ] **Perlehyacint** → `arts/perlehyacint.jpg` · *hero: Armeniacum*

### Stauder · batch 14 (8)
- [ ] **Hosta** → `arts/hosta.jpg` · *hero: Halcyon*
- [ ] **Storkenæb** → `arts/storkenaeb.jpg` · *hero: Rozanne*
- [ ] **Purpursolhat** → `arts/purpursolhat.jpg` · *hero: Magnus*
- [ ] **Lavendel** → `arts/lavendel.jpg` · *hero: Hidcote*
- [ ] **Sankthansurt** → `arts/sankthansurt.jpg` · *hero: Herbstfreude*
- [ ] **Asters** → `arts/asters.jpg` · *hero: Little Carlow*
- [ ] **Røllike** → `arts/roellike.jpg` · *hero: Terracotta*
- [ ] **Høstanemone** → `arts/hoestanemone.jpg` · *hero: Honorine Jobert*

### Skyggehaven · batch 15 (7)
- [ ] **Bregner** → `arts/bregner.jpg` · *hero: Dryopteris filix-mas*
- [ ] **Lungeurt** → `arts/lungeurt.jpg` · *hero: Blue Ensign*
- [ ] **Alunrod** → `arts/alunrod.jpg` · *hero: Caramel*
- [ ] **Bispehue** → `arts/bispehue.jpg` · *hero: Frohnleiten*
- [ ] **Kærmindesøster** → `arts/kaermindesoester.jpg` · *hero: Jack Frost*
- [ ] **Skumblomst** → `arts/skumblomst.jpg` · *hero: Spring Symphony*
- [ ] **Hjerteblomst** → `arts/hjerteblomst.jpg` · *hero: Alba*

### Roser · batch 16 (1)
- [ ] **Rose** → `arts/rose.jpg` · *hero: Bonica*

### Prydbuske & små træer · batch 18 (9)
- [ ] **Magnolia** → `arts/magnolia.jpg` · *hero: Susan*
- [ ] **Japansk løn** → `arts/japansk-loen.jpg` · *hero: Bloodgood*
- [ ] **Kornel** → `arts/kornel.jpg` · *hero: Midwinter Fire*
- [ ] **Syren** → `arts/syren.jpg` · *hero: Beauty of Moscow*
- [ ] **Forsythia** → `arts/forsythia.jpg` · *hero: Lynwood Gold*
- [ ] **Snebolle** → `arts/snebolle.jpg` · *hero: Carlesii*
- [ ] **Sommerfuglebusk** → `arts/sommerfuglebusk.jpg` · *hero: Black Knight*
- [ ] **Rhododendron** → `arts/rhododendron.jpg` · *hero: Catawbiense Grandiflorum*
- [ ] **Azalea** → `arts/azalea.jpg` · *hero: Gibraltar*

### Klatreplanter · batch 19 (8)
- [ ] **Klematis** → `arts/klematis.jpg` · *hero: Nelly Moser*
- [ ] **Blåregn** → `arts/blaaregn.jpg` · *hero: Prolific*
- [ ] **Kaprifolie** → `arts/kaprifolie.jpg` · *hero: Serotina*
- [ ] **Vedbend** → `arts/vedbend.jpg` · *hero: Woerner*
- [ ] **Vildvin** → `arts/vildvin.jpg` · *hero: Veitchii*
- [ ] **Humle** → `arts/humle.jpg` · *hero: Nordbrau*
- [ ] **Trompetblomst** → `arts/trompetblomst.jpg` · *hero: Madame Galen*
- [ ] **Stjernejasmin** → `arts/stjernejasmin.jpg` · *hero: arten*

## 🥈 Tier 2 — plantekort (13) · grupperet pr. familie

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

**82 arter + 24 sorter** — af 159 guides med hero-krav. `npm run guides:status`
er den autoritative kilde — dette dokument regenereres ud fra den.

**28/7:** køkkenhave/frugt/etårige arts-heroes 100 % dækket (82 arter) + 7 plantekort
(hvidløg-, radise-, chili-grupperne). Derefter landede **23 nye prydhave-artsguider**
(batch 13–16 — forårsløg, stauder, skygge, rose) UDEN fotos → de er nu Tier 1 ovenfor.
Husk: hero kræver `npm run import:guides` bagefter, ellers sætter `primaryImageId`
sig ikke og guiden viser ingen hero.

**Forældreløse plantekort-fotos:** 18 fotos ligger i `plantekort/` til sorter der
endnu ikke har en guide (fx Gulerod Nantes, Rødbede Boltardy, Stangbønne Cobra).
De aktiveres ved at skrive de tilhørende sortsguider — ikke ved nye fotos.

---

*Regenerér efter nye batches / nye fotos: `npm run guides:status`.*

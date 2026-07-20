# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/d159e484-fa07-446d-8f6c-0e2d1b0a53a2

Status efter **batch 10**: **31 fotos mangler** (6 arter + 25 sorter). 18 er på plads (nederst).

**Sådan:** læg foto i `_foto-indbakke/` navngivet efter **slug** (fx `aert.jpg`,
`tomat-black-cherry.jpg`), kør `npm run guides:intake`. Mappen vælges automatisk
efter niveau (art → `arts/`, sort → `plantekort/`), originalen arkiveres.

---

## 🥇 Tier 1 — arts-hero (6) · øverst: hver anker en hel familie

- [ ] **Ært** → `arts/aert.jpg`
- [ ] **Jordbær** → `arts/jordbaer.jpg`
- [ ] **Kål** → `arts/kaal.jpg`
- [ ] **Majs** → `arts/majs.jpg`
- [ ] **Radise** → `arts/radise.jpg`
- [ ] **Salat** → `arts/salat.jpg`

## 🥈 Tier 2 — plantekort (25) · grupperet pr. familie

### Tomat (5)
- [ ] Black Cherry → `plantekort/tomat-black-cherry.jpg`
- [ ] Green Zebra → `plantekort/tomat-green-zebra.jpg`
- [ ] Moneymaker → `plantekort/tomat-moneymaker.jpg`
- [ ] Oxheart → `plantekort/tomat-oxheart.jpg`
- [ ] Roma → `plantekort/tomat-roma.jpg`

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

## ✅ Allerede på plads (18 — intet at gøre)

**Arter (6):** Agurk · Chili · Dahlia · Hvidløg · Peberfrugt · Tomat
**Sorter (12):** Sugar Snap · Marketmore · Habanero Orange · Padrón · Café au Lait ·
California Wonder · Corno di Toro Rosso · Little Gem · Lollo Rossa ·
Gardener's Delight · San Marzano · Sungold

---

*Regenerér efter nye batches: manglende hero via `npm run guides:status` / `check:images`.*

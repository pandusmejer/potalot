# Foto-ønskeliste — guides uden hero-billede

Afkrydsningsliste. Vinge af (`- [ ]` → `- [x]`), efterhånden som fotos lægges ind.
**Interaktiv version:** https://claude.ai/code/artifact/91207c15-3fb0-419a-8bf7-d8008b2ea441

Status **1/8 2026** (171 guides: 122 arts · 37 sorts · 12 teknik):
**40 fotos mangler** (28 prydhave/busk/klatre-arter + 12 sortskort). **119 af 159 er på plads.**

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
- [x] **Tulipan** → `arts/tulipan.jpg` · *hero: Queen of Night*
- [ ] **Påskelilje** → `arts/paaskelilje.jpg` · *hero: Dutch Master*
- [x] **Krokus** → `arts/krokus.jpg` · *hero: Jeanne d'Arc*
- [x] **Prydallium** → `arts/prydallium.jpg` · *hero: Purple Sensation*
- [x] **Vintergæk** → `arts/vintergaek.jpg` · *hero: arten*
- [x] **Erantis** → `arts/erantis.jpg` · *hero: arten*
- [ ] **Perlehyacint** → `arts/perlehyacint.jpg` · *hero: Armeniacum*

### Stauder · batch 14 (8)
- [x] **Hosta** → `arts/hosta.jpg` · *hero: Halcyon*
- [x] **Storkenæb** → `arts/storkenaeb.jpg` · *hero: Rozanne*
- [ ] **Purpursolhat** → `arts/purpursolhat.jpg` · *hero: Magnus*
- [x] **Lavendel** → `arts/lavendel.jpg` · *hero: Hidcote*
- [x] **Sankthansurt** → `arts/sankthansurt.jpg` · *hero: Herbstfreude*
- [x] **Asters** → `arts/asters.jpg` · *hero: Little Carlow*
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
- [x] **Rose** → `arts/rose.jpg` · *hero: Bonica*

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
- [x] **Klematis** → `arts/klematis.jpg` · *hero: Nelly Moser*
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
- [x] Korona → `plantekort/jordbaer-korona.jpg`
- [ ] Mara des Bois → `plantekort/jordbaer-mara-des-bois.jpg`

### Salat (2)
- [ ] Buttercrunch → `plantekort/salat-buttercrunch.jpg`
- [ ] Rouge Grenobloise → `plantekort/salat-rouge-grenobloise.jpg`

### Majs (1)
- [ ] Incredible → `plantekort/majs-incredible.jpg`  *(kandidat kasseret 24/7 — nyt foto ønskes)*

---


## 🥉 Tier 3 — plantekort til kommende sortsguider (222)

**Sortskort = plantekort — samme 4:5-foto pr. sort som Tier 2.** Her er de bare
til prioriterede sorter der endnu ikke har en sortsguide; fotograferes efterhånden
som guiderne bygges. Tæller ikke med i de 159 hero-krav-guider. Fuld plan (m.
latinske navne) i `sortsplan-batch-13-19.md`. Format: 4:5 stående (1440×1800).

### Batch 13 — Forårsløg

**Tulipan** (6)  
- [ ] Queen of Night → `plantekort/tulipan-queen-of-night.jpg`
- [ ] Apeldoorn → `plantekort/tulipan-apeldoorn.jpg`
- [ ] Angelique → `plantekort/tulipan-angelique.jpg`
- [ ] Ballerina → `plantekort/tulipan-ballerina.jpg`
- [ ] Purissima → `plantekort/tulipan-purissima.jpg`
- [ ] Negrita → `plantekort/tulipan-negrita.jpg`
**Påskelilje** (6)  
- [ ] Dutch Master → `plantekort/paaskelilje-dutch-master.jpg`
- [ ] Tête-à-Tête → `plantekort/paaskelilje-tete-a-tete.jpg`
- [ ] Thalia → `plantekort/paaskelilje-thalia.jpg`
- [ ] Ice Follies → `plantekort/paaskelilje-ice-follies.jpg`
- [ ] Carlton → `plantekort/paaskelilje-carlton.jpg`
- [ ] Mount Hood → `plantekort/paaskelilje-mount-hood.jpg`
**Krokus** (6)  
- [ ] Jeanne d'Arc → `plantekort/krokus-jeanne-d-arc.jpg`
- [ ] Pickwick → `plantekort/krokus-pickwick.jpg`
- [ ] Flower Record → `plantekort/krokus-flower-record.jpg`
- [ ] Ruby Giant → `plantekort/krokus-ruby-giant.jpg`
- [ ] Yellow Mammoth → `plantekort/krokus-yellow-mammoth.jpg`
- [ ] Blue Pearl → `plantekort/krokus-blue-pearl.jpg`
**Prydallium** (6)  
- [ ] Purple Sensation → `plantekort/prydallium-purple-sensation.jpg`
- [ ] Globemaster → `plantekort/prydallium-globemaster.jpg`
- [ ] Mount Everest → `plantekort/prydallium-mount-everest.jpg`
- [ ] Christophii → `plantekort/prydallium-christophii.jpg`
- [ ] Ambassador → `plantekort/prydallium-ambassador.jpg`
- [ ] Gladiator → `plantekort/prydallium-gladiator.jpg`
**Vintergæk** (5)  
- [ ] Arten → `plantekort/vintergaek-arten.jpg`
- [ ] Flore Pleno → `plantekort/vintergaek-flore-pleno.jpg`
- [ ] S. Arnott → `plantekort/vintergaek-s-arnott.jpg`
- [ ] Magnet → `plantekort/vintergaek-magnet.jpg`
- [ ] Hippolyta → `plantekort/vintergaek-hippolyta.jpg`
**Erantis** (3)  
- [ ] Arten → `plantekort/erantis-arten.jpg`
- [ ] Guinevere → `plantekort/erantis-guinevere.jpg`
- [ ] Schwefelglanz → `plantekort/erantis-schwefelglanz.jpg`
**Perlehyacint** (5)  
- [ ] Armeniacum → `plantekort/perlehyacint-armeniacum.jpg`
- [ ] Valerie Finnis → `plantekort/perlehyacint-valerie-finnis.jpg`
- [ ] Album → `plantekort/perlehyacint-album.jpg`
- [ ] Ocean Magic → `plantekort/perlehyacint-ocean-magic.jpg`
- [ ] Mountain Lady → `plantekort/perlehyacint-mountain-lady.jpg`

### Batch 14 — Stauder

**Hosta** (6)  
- [ ] Halcyon → `plantekort/hosta-halcyon.jpg`
- [ ] Patriot → `plantekort/hosta-patriot.jpg`
- [ ] Francee → `plantekort/hosta-francee.jpg`
- [ ] June → `plantekort/hosta-june.jpg`
- [ ] Sum and Substance → `plantekort/hosta-sum-and-substance.jpg`
- [ ] Blue Angel → `plantekort/hosta-blue-angel.jpg`
**Storkenæb** (6)  
- [ ] Rozanne → `plantekort/storkenaeb-rozanne.jpg`
- [ ] Johnson's Blue → `plantekort/storkenaeb-johnson-s-blue.jpg`
- [ ] Biokovo → `plantekort/storkenaeb-biokovo.jpg`
- [ ] Patricia → `plantekort/storkenaeb-patricia.jpg`
- [ ] Orion → `plantekort/storkenaeb-orion.jpg`
- [ ] Brookside → `plantekort/storkenaeb-brookside.jpg`
**Purpursolhat** (6)  
- [ ] Magnus → `plantekort/purpursolhat-magnus.jpg`
- [ ] White Swan → `plantekort/purpursolhat-white-swan.jpg`
- [ ] Green Twister → `plantekort/purpursolhat-green-twister.jpg`
- [ ] Sombrero Salsa Red → `plantekort/purpursolhat-sombrero-salsa-red.jpg`
- [ ] PowWow White → `plantekort/purpursolhat-powwow-white.jpg`
- [ ] Cheyenne Spirit → `plantekort/purpursolhat-cheyenne-spirit.jpg`
**Lavendel** (6)  
- [ ] Hidcote → `plantekort/lavendel-hidcote.jpg`
- [ ] Munstead → `plantekort/lavendel-munstead.jpg`
- [ ] Edelweiss → `plantekort/lavendel-edelweiss.jpg`
- [ ] Rosea → `plantekort/lavendel-rosea.jpg`
- [ ] Imperial Gem → `plantekort/lavendel-imperial-gem.jpg`
- [ ] Blue Scent → `plantekort/lavendel-blue-scent.jpg`
**Sankthansurt** (6)  
- [ ] Herbstfreude → `plantekort/sankthansurt-herbstfreude.jpg`
- [ ] Matrona → `plantekort/sankthansurt-matrona.jpg`
- [ ] Brilliant → `plantekort/sankthansurt-brilliant.jpg`
- [ ] Carl → `plantekort/sankthansurt-carl.jpg`
- [ ] Purple Emperor → `plantekort/sankthansurt-purple-emperor.jpg`
- [ ] Stardust → `plantekort/sankthansurt-stardust.jpg`
**Asters** (6)  
- [ ] Little Carlow → `plantekort/asters-little-carlow.jpg`
- [ ] Alma Pötschke → `plantekort/asters-alma-potschke.jpg`
- [ ] Purple Dome → `plantekort/asters-purple-dome.jpg`
- [ ] Barr's Blue → `plantekort/asters-barr-s-blue.jpg`
- [ ] Snow Flurry → `plantekort/asters-snow-flurry.jpg`
- [ ] Lady in Black → `plantekort/asters-lady-in-black.jpg`
**Røllike** (6)  
- [ ] Terracotta → `plantekort/roellike-terracotta.jpg`
- [ ] Moonshine → `plantekort/roellike-moonshine.jpg`
- [ ] Paprika → `plantekort/roellike-paprika.jpg`
- [ ] Cerise Queen → `plantekort/roellike-cerise-queen.jpg`
- [ ] Summer Pastels → `plantekort/roellike-summer-pastels.jpg`
- [ ] Red Velvet → `plantekort/roellike-red-velvet.jpg`
**Høstanemone** (6)  
- [ ] Honorine Jobert → `plantekort/hoestanemone-honorine-jobert.jpg`
- [ ] September Charm → `plantekort/hoestanemone-september-charm.jpg`
- [ ] Serenade → `plantekort/hoestanemone-serenade.jpg`
- [ ] Pamina → `plantekort/hoestanemone-pamina.jpg`
- [ ] Whirlwind → `plantekort/hoestanemone-whirlwind.jpg`
- [ ] Prinz Heinrich → `plantekort/hoestanemone-prinz-heinrich.jpg`

### Batch 15 — Skyggehaven

**Bregner** (6)  
- [ ] Dryopteris filix-mas → `plantekort/bregner-dryopteris-filix-mas.jpg`
- [ ] Athyrium niponicum → `plantekort/bregner-athyrium-niponicum.jpg`
- [ ] Polystichum setiferum → `plantekort/bregner-polystichum-setiferum.jpg`
- [ ] Matteuccia → `plantekort/bregner-matteuccia.jpg`
- [ ] Osmunda → `plantekort/bregner-osmunda.jpg`
- [ ] Blechnum → `plantekort/bregner-blechnum.jpg`
**Lungeurt** (5)  
- [ ] Blue Ensign → `plantekort/lungeurt-blue-ensign.jpg`
- [ ] Trevi Fountain → `plantekort/lungeurt-trevi-fountain.jpg`
- [ ] Raspberry Splash → `plantekort/lungeurt-raspberry-splash.jpg`
- [ ] Sissinghurst White → `plantekort/lungeurt-sissinghurst-white.jpg`
- [ ] Opal → `plantekort/lungeurt-opal.jpg`
**Alunrod** (6)  
- [ ] Caramel → `plantekort/alunrod-caramel.jpg`
- [ ] Palace Purple → `plantekort/alunrod-palace-purple.jpg`
- [ ] Lime Marmalade → `plantekort/alunrod-lime-marmalade.jpg`
- [ ] Obsidian → `plantekort/alunrod-obsidian.jpg`
- [ ] Marmalade → `plantekort/alunrod-marmalade.jpg`
- [ ] Berry Smoothie → `plantekort/alunrod-berry-smoothie.jpg`
**Bispehue** (5)  
- [ ] Frohnleiten → `plantekort/bispehue-frohnleiten.jpg`
- [ ] Sulphureum → `plantekort/bispehue-sulphureum.jpg`
- [ ] Amber Queen → `plantekort/bispehue-amber-queen.jpg`
- [ ] Pink Champagne → `plantekort/bispehue-pink-champagne.jpg`
- [ ] Domino → `plantekort/bispehue-domino.jpg`
**Kærmindesøster** (5)  
- [ ] Jack Frost → `plantekort/kaermindesoester-jack-frost.jpg`
- [ ] Sea Heart → `plantekort/kaermindesoester-sea-heart.jpg`
- [ ] Silver Heart → `plantekort/kaermindesoester-silver-heart.jpg`
- [ ] Looking Glass → `plantekort/kaermindesoester-looking-glass.jpg`
- [ ] Hadspen Cream → `plantekort/kaermindesoester-hadspen-cream.jpg`
**Skumblomst** (4)  
- [ ] Spring Symphony → `plantekort/skumblomst-spring-symphony.jpg`
- [ ] Sugar and Spice → `plantekort/skumblomst-sugar-and-spice.jpg`
- [ ] Pink Skyrocket → `plantekort/skumblomst-pink-skyrocket.jpg`
- [ ] Running Tapestry → `plantekort/skumblomst-running-tapestry.jpg`
**Hjerteblomst** (4)  
- [ ] Alba → `plantekort/hjerteblomst-alba.jpg`
- [ ] Gold Heart → `plantekort/hjerteblomst-gold-heart.jpg`
- [ ] Valentine → `plantekort/hjerteblomst-valentine.jpg`
- [ ] Burning Hearts → `plantekort/hjerteblomst-burning-hearts.jpg`

### Batch 16 — Roser

**Rose** (6)  
- [ ] Bonica → `plantekort/rose-bonica.jpg`
- [ ] Iceberg → `plantekort/rose-iceberg.jpg`
- [ ] Queen Elizabeth → `plantekort/rose-queen-elizabeth.jpg`
- [ ] New Dawn → `plantekort/rose-new-dawn.jpg`
- [ ] Gertrude Jekyll → `plantekort/rose-gertrude-jekyll.jpg`
- [ ] The Fairy → `plantekort/rose-the-fairy.jpg`

### Batch 18 — Prydbuske & små træer

**Magnolia** (6)  
- [ ] Susan → `plantekort/magnolia-susan.jpg`
- [ ] Soulangeana → `plantekort/magnolia-soulangeana.jpg`
- [ ] Stellata → `plantekort/magnolia-stellata.jpg`
- [ ] Genie → `plantekort/magnolia-genie.jpg`
- [ ] Galaxy → `plantekort/magnolia-galaxy.jpg`
- [ ] Leonard Messel → `plantekort/magnolia-leonard-messel.jpg`
**Japansk løn** (6)  
- [ ] Bloodgood → `plantekort/japansk-loen-bloodgood.jpg`
- [ ] Orange Dream → `plantekort/japansk-loen-orange-dream.jpg`
- [ ] Dissectum → `plantekort/japansk-loen-dissectum.jpg`
- [ ] Sango-kaku → `plantekort/japansk-loen-sango-kaku.jpg`
- [ ] Osakazuki → `plantekort/japansk-loen-osakazuki.jpg`
- [ ] Butterfly → `plantekort/japansk-loen-butterfly.jpg`
**Kornel** (6)  
- [ ] Midwinter Fire → `plantekort/kornel-midwinter-fire.jpg`
- [ ] Elegantissima → `plantekort/kornel-elegantissima.jpg`
- [ ] Kousa Chinensis → `plantekort/kornel-kousa-chinensis.jpg`
- [ ] Venus → `plantekort/kornel-venus.jpg`
- [ ] Sibirica → `plantekort/kornel-sibirica.jpg`
- [ ] Ivory Halo → `plantekort/kornel-ivory-halo.jpg`
**Syren** (6)  
- [ ] Beauty of Moscow → `plantekort/syren-beauty-of-moscow.jpg`
- [ ] Charles Joly → `plantekort/syren-charles-joly.jpg`
- [ ] Primrose → `plantekort/syren-primrose.jpg`
- [ ] Sensation → `plantekort/syren-sensation.jpg`
- [ ] Mme Lemoine → `plantekort/syren-mme-lemoine.jpg`
- [ ] Katherine Havemeyer → `plantekort/syren-katherine-havemeyer.jpg`
**Forsythia** (4)  
- [ ] Lynwood Gold → `plantekort/forsythia-lynwood-gold.jpg`
- [ ] Weekend → `plantekort/forsythia-weekend.jpg`
- [ ] Goldrausch → `plantekort/forsythia-goldrausch.jpg`
- [ ] Minigold → `plantekort/forsythia-minigold.jpg`
**Snebolle** (6)  
- [ ] Carlesii → `plantekort/snebolle-carlesii.jpg`
- [ ] Opulus Roseum → `plantekort/snebolle-opulus-roseum.jpg`
- [ ] Tinus Eve Price → `plantekort/snebolle-tinus-eve-price.jpg`
- [ ] Bodnantense Dawn → `plantekort/snebolle-bodnantense-dawn.jpg`
- [ ] Kilimanjaro → `plantekort/snebolle-kilimanjaro.jpg`
- [ ] Mariesii → `plantekort/snebolle-mariesii.jpg`
**Sommerfuglebusk** (6)  
- [ ] Black Knight → `plantekort/sommerfuglebusk-black-knight.jpg`
- [ ] White Profusion → `plantekort/sommerfuglebusk-white-profusion.jpg`
- [ ] Pink Delight → `plantekort/sommerfuglebusk-pink-delight.jpg`
- [ ] Buzz Indigo → `plantekort/sommerfuglebusk-buzz-indigo.jpg`
- [ ] Nanho Blue → `plantekort/sommerfuglebusk-nanho-blue.jpg`
- [ ] Empire Blue → `plantekort/sommerfuglebusk-empire-blue.jpg`
**Rhododendron** (6)  
- [ ] Catawbiense Grandiflorum → `plantekort/rhododendron-catawbiense-grandiflorum.jpg`
- [ ] Cunningham's White → `plantekort/rhododendron-cunningham-s-white.jpg`
- [ ] Nova Zembla → `plantekort/rhododendron-nova-zembla.jpg`
- [ ] Percy Wiseman → `plantekort/rhododendron-percy-wiseman.jpg`
- [ ] Roseum Elegans → `plantekort/rhododendron-roseum-elegans.jpg`
- [ ] Yakushimanum → `plantekort/rhododendron-yakushimanum.jpg`
**Azalea** (6)  
- [ ] Gibraltar → `plantekort/azalea-gibraltar.jpg`
- [ ] Golden Lights → `plantekort/azalea-golden-lights.jpg`
- [ ] Homebush → `plantekort/azalea-homebush.jpg`
- [ ] Klondyke → `plantekort/azalea-klondyke.jpg`
- [ ] Northern Hi-Lights → `plantekort/azalea-northern-hi-lights.jpg`
- [ ] Persil → `plantekort/azalea-persil.jpg`

### Batch 19 — Klatreplanter

**Klematis** (6)  
- [ ] Nelly Moser → `plantekort/klematis-nelly-moser.jpg`
- [ ] Jackmanii → `plantekort/klematis-jackmanii.jpg`
- [ ] Polish Spirit → `plantekort/klematis-polish-spirit.jpg`
- [ ] Montana Rubens → `plantekort/klematis-montana-rubens.jpg`
- [ ] The President → `plantekort/klematis-the-president.jpg`
- [ ] Ville de Lyon → `plantekort/klematis-ville-de-lyon.jpg`
**Blåregn** (6)  
- [ ] Prolific → `plantekort/blaaregn-prolific.jpg`
- [ ] Multijuga → `plantekort/blaaregn-multijuga.jpg`
- [ ] Alba → `plantekort/blaaregn-alba.jpg`
- [ ] Amethyst Falls → `plantekort/blaaregn-amethyst-falls.jpg`
- [ ] Violacea Plena → `plantekort/blaaregn-violacea-plena.jpg`
- [ ] Longissima Alba → `plantekort/blaaregn-longissima-alba.jpg`
**Kaprifolie** (6)  
- [ ] Serotina → `plantekort/kaprifolie-serotina.jpg`
- [ ] Graham Thomas → `plantekort/kaprifolie-graham-thomas.jpg`
- [ ] Belgica → `plantekort/kaprifolie-belgica.jpg`
- [ ] Goldflame → `plantekort/kaprifolie-goldflame.jpg`
- [ ] Tellmanniana → `plantekort/kaprifolie-tellmanniana.jpg`
- [ ] Halliana → `plantekort/kaprifolie-halliana.jpg`
**Vedbend** (6)  
- [ ] Woerner → `plantekort/vedbend-woerner.jpg`
- [ ] Glacier → `plantekort/vedbend-glacier.jpg`
- [ ] Goldheart → `plantekort/vedbend-goldheart.jpg`
- [ ] Arborescens → `plantekort/vedbend-arborescens.jpg`
- [ ] Needlepoint → `plantekort/vedbend-needlepoint.jpg`
- [ ] Sagittifolia → `plantekort/vedbend-sagittifolia.jpg`
**Vildvin** (5)  
- [ ] Veitchii → `plantekort/vildvin-veitchii.jpg`
- [ ] Engelmannii → `plantekort/vildvin-engelmannii.jpg`
- [ ] Green Spring → `plantekort/vildvin-green-spring.jpg`
- [ ] Lowii → `plantekort/vildvin-lowii.jpg`
- [ ] Star Showers → `plantekort/vildvin-star-showers.jpg`
**Humle** (6)  
- [ ] Nordbrau → `plantekort/humle-nordbrau.jpg`
- [ ] Cascade → `plantekort/humle-cascade.jpg`
- [ ] Saaz → `plantekort/humle-saaz.jpg`
- [ ] Hallertau → `plantekort/humle-hallertau.jpg`
- [ ] Aureus → `plantekort/humle-aureus.jpg`
- [ ] Magnum → `plantekort/humle-magnum.jpg`
**Trompetblomst** (5)  
- [ ] Madame Galen → `plantekort/trompetblomst-madame-galen.jpg`
- [ ] Flava → `plantekort/trompetblomst-flava.jpg`
- [ ] Stromboli → `plantekort/trompetblomst-stromboli.jpg`
- [ ] Indian Summer → `plantekort/trompetblomst-indian-summer.jpg`
- [ ] Flamenco → `plantekort/trompetblomst-flamenco.jpg`
**Stjernejasmin** (4)  
- [ ] Arten → `plantekort/stjernejasmin-arten.jpg`
- [ ] Star of Toscana → `plantekort/stjernejasmin-star-of-toscana.jpg`
- [ ] Tricolor → `plantekort/stjernejasmin-tricolor.jpg`
- [ ] Ogon Nishiki → `plantekort/stjernejasmin-ogon-nishiki.jpg`

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

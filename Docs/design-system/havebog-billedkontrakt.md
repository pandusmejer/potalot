# 🌾 HAVEBOG — BILLEDKONTRAKT v1

**Version 1.0** · gælder de 11 Havebog-måneds-heroes (jan–maj, jul–dec).
Juni er allerede produceret og er referencen for teknisk niveau.

> Søsterdocs: [`BILLEDER.md`](../BILLEDER.md) (de 6 billedroller · HVOR filer ligger),
> [`botaniske-presets.md`](botaniske-presets.md) (plantefoto-redigering).
> Denne kontrakt definerer Havebog-heroens EGET billedsprog.

---

## Den bærende regel

> **Kalenderen viser måneden. Havebogen viser et øjeblik fra den.**

Havebog-heroen skal adskille sig tydeligt fra appens øvrige billedtyper:

| Billedtype | Hvad det viser |
| ---------- | -------------- |
| **Kalender** | Månedens store sæsonscene |
| **Artsguide** | Hele planten som reference |
| **Plantekort** | Tæt makro af en levende plante |
| **Frøkort** | Isoleret produktobjekt |
| **Havebog** | Et sanseligt **øjeblik**, som kunne blive et minde |

---

## Fælles billedspec (alle 11)

**Format:** stående hero, ca. **4:5** eller lidt højere.

**Komposition:**

* Den øverste tredjedel skal være rolig nok til hilsen, dato og dagtæller.
* Motivet må gerne leve i midten og nederst.
* Fotografen skal stå tæt på øjeblikket, men billedet må ikke blive et katalogmakro.
* Billedet må gerne vise spor af menneskelig tilstedeværelse, men ikke opstillede hænder, forklæder og Martha-Stewart-rekvisitter i samlet flok. **Ét menneskeligt spor er nok.**
* Ingen tekst, UI, labels eller collageelementer.
* Ingen polaroids, tape, scrapbog eller nostalgisk filter.
* Lyset skal være naturligt, roligt og redaktionelt.
* Serien skal føles som **samme fotograf og samme have** gennem året.

---

## De 11 motiver

**Januar** — Rim på tørre frøstande i lav vintersol. Drivhusglas eller en mørk havestruktur kan anes. Stilhed og ventetid, ikke julekort.

**Februar** — En lille grøn spids bryder gennem mørk jord. Køligt lys og meget luft. Årets første tegn, uden at billedet bliver en generisk spiringsillustration.

**Marts** — Nysåede bakker i et vindue eller drivhus. Fugtmættet jord, kondens og tidligt lys. Mere begyndelse end produktfoto.

**April** — Unge planter bæres eller står midlertidigt ude til afhærdning. Vind i bladene og skiftende lys. Ikke en række pæne potter til kataloget.

**Maj** — Jord på hænder eller redskabsspor ved en nyplantet plante. Øjeblikket lige efter udplantning. Frisk jord, lys og forventning.

**Juli** — En moden tomat eller anden høst i hånden, stadig tæt på planten. Varmt aftenslys. Ikke en kurv med grøntsager, der prøver at sælge økologisk livsstil.

**August** — Et bord eller en enkel flade med dagens høst, delvist brugt eller sorteret. Rigdom uden madstyling. Sæsonen står på sit højeste.

**September** — Frøstande, tørrede bælge eller hænder, der samler frø. Lavere lys og tydelig overgang. Mere eftertanke end forfald.

**Oktober** — En sidste høst i køligt lys, visne blade og fugt. Haven giver stadig noget, men sæsonen slipper langsomt taget.

**November** — En tom eller næsten tom have efter oprydning. En efterladt snor, et bed med vinterdække eller en lukket drivhusdør. Ro, ikke tristesse.

**December** — Frøposer, sorterede frø eller en notesbog tæt ved et vindue med haven ude af fokus. Haven lever videre som plan og erindring, uden hyggerekvisit-parade.

---

## Launch-scope

**Én `active`-variant pr. måned.** Fuld dækning uden at producere 33 billeder til tre bruger-states, før nogen har dyrket en radise i appen. `new`- og `year2plus`-varianter produceres først senere, hvis produktdata viser et reelt behov. (Resolveren falder tilbage til `active` for begge, så ét foto pr. måned dækker alle brugere.)

## Produktionsrækkefølge

1. **Januar først — som stilprøve.** Januar tvinger billedsystemet til at fungere uden sommerblomster, gyldent overflodscirkus og andre visuelle krykker. Føles januar som Havebogen, gør resten sandsynligvis også.
2. Derefter de resterende ti som **én samlet serie**.

---

## Modtagelses-pipeline (Claudes rolle)

Assets leveres i `_foto-indbakke/heroes-havebog/` navngivet `<måned>.jpg`
(danske månedsnavne, lowercase). Når de leveres:

1. Kontrollér at hvert motiv er et **Havebog-øjeblik** — ikke et kalender-, artsguide-, plantekort- eller frøkortfoto.
2. Kontrollér den **rolige øverste tekstzone** (øverste tredjedel).
3. Optimér til samme tekniske niveau som juni-assets (≤1600px lang kant, q82, ingen synligt kvalitetstab; følg [[image_compression_rule]]).
4. Placér filerne i `public/images/heroes-havebog/<måned>/havebog-hero-<måned>-active.jpg`.
5. Registrér hver som `active` i `HAVEBOG_HERO_MANIFEST` (`src/lib/havebog-hero-photo.ts`).
6. Verificér alle 12 måneder i browseren.
7. Kontrollér at ingen måned længere falder tilbage til kalenderens hero-pool.
8. **Ændr IKKE** resolverlogik, bruger-state-model eller hero-layout under denne opgave (hero-kompositionen er ANNA-LÅST, se `havebog_hero_laast`).

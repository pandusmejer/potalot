# POTALOT-GUIDES — BESTILLING TIL REDAKTØR (V1)

Du skriver **10 kuraterede dyrkningsguides** der bliver standarden i
Potalots "Dyrkningsguides"-bibliotek. De er fundamentet under hele
Potalots redaktionelle lag.

---

## Tone og stil

- **Praktisk, ikke akademisk.** Læseren vil dyrke planten, ikke skrive eksamen.
- **Konkret før generelt.** "Plant 5 cm dybt med 15 cm afstand" slår
  "plantes med passende afstand."
- **Erfaringsbaseret.** Hvor det giver mening, del observationer
  ("Tyv hver 7. dag — det giver større frugter").
- **Dansk klimakontekst.** Danske måneder, danske jordbundsforhold.
- **Naturhåndbog, ikke blog.** Ingen overskrifter med spørgsmålstegn.
  Ingen "10 ting du ikke vidste".

---

## ⚠️ Vigtigt: to lag af guides

Potalots guide-system har tre lag (se `GUIDES_ARCHITECTURE.md`). Dine
10 guides skal dække de **to første lag** — vi springer "teknikguider"
(Niveau 1) over indtil næste fase.

| Niveau | Type | Eksempel | Antal du skriver |
|---|---|---|---|
| 2 | **Planteguide** (`species`) | "Tomat" — om arten generelt | **5** |
| 3 | **Sortsguide** (`variety`) | "Tomat San Marzano" — om den konkrete sort | **5** |

Forklaring:
- **Planteguide** beskriver planten generelt — den natur, der gælder for
  alle sorter under arten ("Tomater elsker varme. De fleste skal forspires.").
- **Sortsguide** tilføjer sortens særlige hensyn — den arver fra planteguiden
  via `parentGuideId`, så du behøver ikke gentage det generelle.

---

## De 10 sorter

### 5 planteguider (species — generel viden om arten)

1. **Tomat**
2. **Agurk**
3. **Chili**
4. **Dahlia**
5. **Hvidløg**

### 5 sortsguider (variety — sortsspecifikke detaljer, arver fra ovenfor)

6. **Tomat San Marzano** → parent: Tomat
7. **Chili Habanero Orange** → parent: Chili
8. **Dahlia Café au Lait** → parent: Dahlia
9. **Agurk Marketmore** → parent: Agurk
10. **Salat Little Gem** → standalone variety (ingen Salat-planteguide endnu)

---

## Skema for hver guide — udfyld feltvist

### 1 · Identitet

- **Niveau**: ⊙ Planteguide (`species`)   ⊙ Sortsguide (`variety`)
- **Plante-navn** (dansk): _______
- **Sort/variant**: _______ *(kun for variety)*
- **Latinsk navn**: _______
- **Forældreguide** (`parentGuideId`): _______ *(kun for variety — fx "Tomat")*
- **Primær-kategori**: ⊙ Frø  ⊙ Løg  ⊙ Knolde  ⊙ Buske  ⊙ Træer  ⊙ Stauder

### 2 · Resumé (1-2 sætninger, dukker op på kortet)

> Eksempel (species): "Tomater elsker varme og lang sæson. De fleste sorter
> trives bedst i drivhus med god opbinding og regelmæssig vanding."
>
> Eksempel (variety): "Klassisk italiensk pasta-tomat med kraftig vækst og
> kødfuld frugt. Trives i drivhus og varm friland med god opbinding."

_______

### 3 · Sværhedsgrad

⊙ Let   ⊙ Mellem   ⊙ Avanceret

### 4 · Tags (2-4 stk, hjælper søgning)

> Eksempel: italiensk · pasta · kødfuld

_______

### 5 · Quick Facts

| Felt | Værdi |
|---|---|
| Forspires? | ⊙ Ja  ⊙ Nej |
| Såningsmåneder (forspiring) | fx: 3, 4 |
| Direkte såningsmåneder | fx: 5, 6 *(lad stå tom hvis kun forspiring)* |
| Udplantningsmåneder | fx: 5, 6 |
| Høstmåneder | fx: 7, 8, 9 |
| Lyskrav | ⊙ Fuld sol  ⊙ Halvskygge  ⊙ Skygge |
| Vandbehov | ⊙ Lavt  ⊙ Regelmæssigt  ⊙ Højt |
| Jordtype | fri tekst, fx "Næringsrig veldrænende muldjord, pH 6,0-6,8" |

### 6 · Sektioner (Sådan dyrker du — naturhåndbogslaget)

Skriv 4-6 sektioner. Hver er en lille editorial passage (3-6 sætninger).

**For planteguider (species)** — fokusér på artens natur:

1. **Om arten** — generel karakteristik, hvor stammer den fra
2. **Forspiring eller direkte såning** (hvis relevant)
3. **Udplantning** — generelle krav
4. **Pleje gennem sæsonen** — vanding, gødning, almindelige problemer
5. **Høst og opbevaring** — generelle principper

**For sortsguider (variety)** — fokusér KUN på sortens særpræg:

1. **Om sorten** — historie, smag, hvorfor netop denne sort
2. **Sortsspecifikke detaljer** — afstand, højde, særlige hensyn
3. **Anvendelse** — hvad bruger man frugten/blomsten til
4. (Spring de generelle dyrknings-trin over — de arves fra planteguiden)

```
Sektion 1: Om sorten
_______________________________________________
_______________________________________________

Sektion 2: ...
```

### 6b · Faktakort (valgfri — brug sparsomt)

Når en sektion har en naturlig **"denne vs denne"-situation** (rank vs busk,
forspir vs direkte, sol vs halvskygge, drivhus vs friland), så pak det i et
**faktakort** i stedet for at skrive det som prose. Faktakortet renderes som
en lille illustration i naturhåndbogen — to søjler side om side.

**Syntaks:**

````markdown
:::fact{variant="comparison" title="Tomater vokser på to måder"}

### Ranketomat
- Vokser hele sæsonen
- Skal opbindes
- Skal ofte knibes

### Busktomat
- Kompakt vækst
- Velegnet til krukker
- Kræver sjældent opbinding

:::
````

**Regler:**

- **Maks 2-3 faktakort pr. guide.** Det er en illustration, ikke en
  standardsektion. Hvis alt bliver et faktakort, holder ingen op med at læse.
- **Brug kun til ægte sammenligninger** — ikke som rigtig dekorativ liste.
- **Korte punkter.** Hver bullet bør være 3-7 ord, ikke en hel sætning.
- **Symmetriske kolonner** — samme antal punkter i hver søjle.
- **Placér det i den sektion hvor sammenligningen naturligt hører hjemme**,
  ikke som selvstændig sektion.

> *Det visuelle resultat kan ses på `/guides/demo-guide-tomat-sm` — søg efter
> "Tomater vokser på to måder" under "Om sorten".*

### 7 · Kalender-aktiviteter (genererer opgaver i brugerens kalender)

For hver tidsbundet aktivitet, udfyld:

| Aktivitet (titel) | Type | Anbefalede måneder | Prioritet |
|---|---|---|---|
| fx "Forspir indenfor" | sowing | 3, 4 | high |
| fx "Udplant i drivhus" | plant_out | 5, 6 | high |
| fx "Tyv tomatplanterne" | pruning | 6, 7, 8 | medium |
| fx "Høst modne frugter" | harvest | 7, 8, 9 | high |

**Gyldige typer:** `pre_sow` · `sowing` · `repot` · `plant_out` ·
`watering` · `fertilizing` · `pruning` · `pest_check` · `harvest` ·
`weeding` · `maintenance`

**Prioritet:** `low` · `medium` · `high` · `critical`

### 8 · Primært billede

- **Fil-navn til Potalot's plantekort-mappe** (asset leveres separat):
  fx `plantekort-tomat-san-marzano.png`
- **Krav:** kvadratisk eller 3:4, makrofoto med tydelig hovedperson,
  varm naturlig belysning, ingen tekst eller branding på billedet

### 9 · Kildelinks (intern reference — vises kun for admin)

Hvis du har baseret guiden på specifikke kilder, list dem her.
Vises ikke for læseren, men hjælper fact-tjek og senere opdatering.

_______

---

## Levering

- **Format:** ét markdown-dokument pr. guide, navngivet
  `guide-tomat.md`, `guide-tomat-san-marzano.md` osv.
- **Billeder:** levér samtidig som PNG/JPG i mappen `/plantekort/`
- **Deadline:** _______ (aftal med Anna)

## Spørgsmål?

Kontakt Anna direkte. Stilen kan kalibreres på de første 2 guides
(start med Tomat-planteguiden + Tomat San Marzano-sortsguiden, så
arv-forholdet er tydeligt fra start) og derefter bruges som skabelon
for resten.

🌱

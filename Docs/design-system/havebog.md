# Havebog — Design-manifest (V1, juni 2026)

> ## Status
>
> **Dette er Havebogens permanente design-filosofi, ikke en UI-spec.**
>
> Hvor `guides.md` definerer hvordan en sortsguide er bygget op, og
> `potalot.md` definerer hvordan de fem primær-sektioner forholder
> sig til hinanden, definerer dette dokument **DNA'et for Havebogen
> alene**.
>
> Når en designbeslutning på Havebogen føles forkert, skal vi vende
> tilbage til dette dokument før vi rører kode.

---

## Hvad Havebogen er

- Havebogen er **ikke et dashboard**.
- Havebogen er **ikke en database**.
- Havebogen er **ikke et analytics-værktøj**.
- Havebogen er **en personlig havejournal**.

Når brugeren åbner Havebogen, skal oplevelsen føles tættere på en
smuk årbog, et magasin eller en naturdagbog end på Notion, Airtable
eller et SaaS-produkt.

Brugeren skal føle:

> **"Det her er min have."**

Ikke:

> "Det her er mine data."

---

## De ti principper

### 1. Hierarki før komponenter

Hvis noget føles forkert, justér altid:

- Hierarki
- Rytme
- Komposition

før vi justerer:

- Farver
- Skygger
- Hjørneradius
- Badges
- Komponentdetaljer

Store problemer løses næsten aldrig med flere komponenter.

### 2. Typografi skal bære oplevelsen

Typografi skal gøre det meste af arbejdet.

- Store tal
- Store overskrifter
- Meget få ord
- Luft omkring det vigtige

Hvis vi er i tvivl mellem **større typografi** og **endnu en
UI-komponent**, vælger vi næsten altid større typografi.

### 3. Kun få ting må være store

Store elementer er en begrænset ressource. Kun disse må være store:

- Hero-titler
- Datoer
- Antal aktive sorter
- Antal aktive planter
- Sæsonmarkører
- Dagens vigtigste fokus

Hvis alt er stort, er intet vigtigt.

### 4. Asymmetri er obligatorisk

Undgå:

```
Foto venstre.   Tekst højre.
Foto venstre.   Tekst højre.
Foto venstre.   Tekst højre.
```

Dette skaber katalog-følelse.

Sektioner skal skifte rytme:

- Stort foto
- Stort tal
- Overlappende kort
- Bredt billede
- Lille note
- Fuld bredde sektion

Brugeren skal føle bevægelse ned gennem siden.

**Regel:** Ingen to sektioner efter hinanden må bruge samme komposition.

### 5. Redaktionel prioritering

Ikke alle sektioner er lige vigtige. Der skal altid være:

- **En hovedhistorie**
- **En sekundær historie**
- **Flere mindre historier**

Eksempel for "denne uge":

```
Hovedhistorie:    Dild Bouquet er klar til afhærdning.
Sekundær:         8 aktive sorter i haven.
Mindre:           Noter, minder, arkiv, statistik.
```

### 6. Genbrug eksisterende plantekort

Havebogen skal **ikke opfinde nye kort**.

Hvis planten allerede findes i systemet, skal Havebogen genbruge
plantekortet. Havebogen skaber rammesætning omkring kortet — ikke
endnu en variant.

### 7. Store billeder er vigtigere end flere billeder

Ét stærkt billede er bedre end fem små.

Hvis der er tvivl: **gør billedet større**.

### 8. Sæsoner skifter stemning, ikke arkitektur

Kun tre ting ændrer sig gennem året:

1. **Hero-foto**
2. **Accentfarve**
3. **Månedsgrafik**

Resten af systemet forbliver stabilt. Brugeren skal **mærke
årstiden**, ikke **lære en ny app** hver tredje måned.

### 9. Havebogen skal føles som minder

Når brugeren åbner Havebogen om 5 år, skal siden føles som:

> **"Se hvor meget der er sket."**

Ikke:

> "Se hvor mange data jeg har registreret."

Alle designbeslutninger skal vurderes ud fra dette princip.

### 10. Editorial fremfor produkt

Havebogen er det mest emotionelle sted i hele Potalot:

| Sektion | Funktion |
|---|---|
| Frøbank | Data |
| Kalender | Planlægning |
| Guides | Læring |
| **Havebog** | **Erindringer** |

Derfor må Havebogen have sit eget typografiske univers (Cormorant /
Instrument Serif), selv om resten af appen bruger Gabarito. Det er
ikke inkonsistens. Det er redaktionel prioritering — ligesom et
magasin bruger én skrifttype til artikler og en anden til
indholdsfortegnelsen.

---

## Hvad Havebogen IKKE er

For at undgå tilbagefald skal vi være eksplicitte om hvad vi IKKE
bygger her:

- ❌ Tre ens cards ved siden af hinanden
- ❌ Fem sektioner med samme struktur
- ❌ H2 + tekst + card-mønstret gentaget
- ❌ Dashboard-komponenter (KPI-følelse)
- ❌ "0 noter · 8 sorter · 0 høster" — statistik-rakler
- ❌ Stats som første-indtryk
- ❌ Software-sprog som "Dette er din første sæson i Havebogen"

## Hvad Havebogen ER

- ✅ Magasin
- ✅ Scrapbook
- ✅ Havejournal
- ✅ Naturbog
- ✅ Personlig fortælling
- ✅ Editorial opslag
- ✅ Dagbog-sprog ("Den første side er stadig tom")
- ✅ Store tal (ét tal pr. sektion)
- ✅ Store fotos
- ✅ Asymmetri og overlap

---

## Tekstniveau-system (V3.5-låst)

| Niveau | Font | Størrelse | Brug |
|---|---|---|---|
| **1** | Cormorant 500w | clamp(72px, 20vw, 124px) | Big numbers, hero titel — sjældne |
| **2** | Cormorant 400w italic | 24-40px | Editorial statements ("Den første knop") |
| **3** | Manrope 700w caps | 11-14px tracking-wide | Fakta og labels |

Hver sektion må kun have **ét niveau-1-element**. Det er knapheden
der skaber værdi.

---

## Den ene linje at hænge over skærmen

> **Byg en havejournal, ikke et dashboard.**

For den overordnede Potalot-filosofi — se `potalot.md`.
For guide-systemet — se `guides.md`.

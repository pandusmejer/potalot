# Guide-tags — oprydningsliste efter Batch 1 (2/9 2026)

Formatteren (`src/lib/guide-tags.ts`) er på plads: intet tag renderes råt
længere, og repo + live DB har **nul lag 3**. Det, der står tilbage, er
redaktionelt — vokabularet, ikke visningen.

Kør `npm run tags:rapport` for den fulde, altid aktuelle liste. Med
tags fra live DB på stdin (én pr. linje) dækker den begge kilder:

```
select distinct unnest(tags) from guides;   →  tags.txt
npx tsx scripts/tags-rapport.ts < tags.txt
```

Status 2/9 2026: **414 tags** i unionen · 160 med verificeret label ·
254 på ren versalisering · 0 usikre.

## 1. Labels der retter en stavefejl i nøglen

Nøglen står urørt i data. Labelen viser det ord, tagget åbenlyst betyder.
Fem stykker — de bør rettes i data ved lejlighed, så nøgle og label følges ad:

| Nøgle | Label | Hvad der er galt i nøglen |
|---|---|---|
| `bestoeversplante` | Bestøverplante | et `s` for meget |
| `forarsblomstring` | Forårsblomstring | manglende `å` |
| `fro` | Frø | manglende `ø` |
| `frohoest` | Frøhøst | manglende `ø` |
| `saasonafgroede` | Sæsonafgrøde | `saason` skulle have været `saeson` |

## 2. To engelske termer — Annas valg

Begge har allerede en dansk tvilling i vokabularet. De står lige nu med
engelsk label, fordi en oversættelse ville være en betydningsbeslutning,
ikke en typografisk:

| Nøgle | Label i dag | Dansk tvilling der findes | Spørgsmålet |
|---|---|---|---|
| `cut-and-come-again` | Cut and come again | `løbende høst`, `loebende-hoest` | slå sammen, eller er de to forskellige ting? |
| `slow-bolting` | Slow bolting | `stokloebning` | «Sen stokløbning»? |

## 3. Tags der renderer pænt, men er redaktionelt vrøvl

Lag 2 giver dem et stort begyndelsesbogstav og intet andet. De er
typografisk sikre og indholdsmæssigt tvivlsomme — AI-generatoren har lavet
dem, og ingen har set på dem:

`sommerkrudt` · `spadsering` · `snitteskaber` · `sommerkur` ·
`sommerblomstersæd` · `hærltomat` · `middelhavsurte`

## 4. Dubletter i søgevokabularet

Formatteren skjuler symptomet, men må **aldrig** blive en synonymmotor.
Det her er data-oprydning:

- `snitblomst` / `snittablomst` / `snittblomst` / `snittekblomster`
- `begynder` / `begyndervenlig` / `nybegynder` / `nybegyndervenlig`
- `hurtigtvoksende` / `hurtigvoksende` · `hurtig` / `hurtigt`
- `krydderi` / `krydderier` · `knold` / `knolde`
- `sommergrøntsag` / `sommergrøntsager`
- `toerketolerant` / `tørketolerant` / `toerketalende`
- `corona` / `korona`
- de 7 ASCII/dansk-par der allerede har label: `koedfuld`/`kødfuld`,
  `koekkenhave`/`køkkenhave`, `prydgraes`/`prydgræs`, `sproed`/`sprød`,
  `toerring`/`tørring`, `varmekraevende`/`varmekrævende`

Når et par slås sammen i data, skal taberens label blive stående i
`GUIDE_TAG_LABELS` — gamle guides kan stadig bære nøglen.

# Frøbank: audit af forældede måneds-snapshots (P1-datafix)

Status: **spec, ikke påbegyndt.** Kræver frisk tråd. Rører LIVE data —
ingen ad-hoc migration uden Annas per-ting-ja.

Skrevet 26/8 2026, i forlængelse af Kalender-rettelsen
`dd4cfbb → aac8091 → 17e6512 → 96fcf7c` (pushet).

## Problemet

En frøpose gemmer sine dyrkningsmåneder som et **snapshot** taget da posen
blev oprettet. Kalendermotoren respekterer et ikke-tomt gemt vindue som
brugerens override og bruger det frem for guiden — korrekt, fordi vi ikke
kan skelne "Annas egen rettelse" fra "gammel maskinel autofill".

Konsekvensen er en dataintegritetsfejl, ikke bare rod: **korrektheden
afhænger af hvornår posen blev oprettet.** To personer med samme Cherry
Belle kan få forskellige kalenderråd. Potalot har allerede bedre kanoniske
data, men gamle snapshots blokerer dem permanent — backfill-flowet på
/froebank fylder kun TOMME felter (by design, brugerdata røres aldrig), så
intet reparerer dem nogensinde.

Konkret: Radise Cherry Belle + French Breakfast har gemt `saa=[3,4,5]`,
mens Potalots radise-art siger `directSowingMonths [3-9]`. To gyldige
augustråd er usynlige.

## Tre fejltyper — ikke én (Anna 26/8)

"Afvigende snapshot" er for grov en etiket. Skeln:

| Type | Kendetegn | Eksempel |
|---|---|---|
| **stale override** | gemt ikke-tom værdi afviger fra nyere kanoniske data | Radiserne `[3,4,5]` mod artens `[3-9]` |
| **missing inherited value** | gemt `[]`, mens resolveren har en gyldig arvet værdi | Crispy Mints `plantingOutMonths` `[]` mod artens `[3-8]` |
| **genuine override** | brugeren har bevidst ændret værdien | bevares |

Forskellen har konsekvenser. **Missing inherited value er allerede reddet af
read-time inheritance** (`aac8091`): Kalenderen er korrekt for Crispy Mint
uden at der skrives noget som helst. Et klassisk backfill af den pose ville
kun skabe endnu et snapshot, der kan blive gammelt senere.

## Beslutningen FØR migration (Anna 26/8)

For hvert dyrkningsfelt: afgør først, om den gemte værdi **overhovedet bør
eksistere som persistent data.**

Stammer værdien fra Potalot-autofill, og har brugeren aldrig ændret den, bør
vi overveje at **fjerne** snapshot-værdien og lade feltet arve dynamisk
fremover — frem for at migrere snapshot A til snapshot B. Kanoniske
guideværdier bør ikke kopieres permanent ind i en pose, medmindre systemet
har brug for dem som snapshot. Posen bør ideelt kun gemme brugerens
egentlige overrides.

Ellers lever en pose oprettet i marts 2026 stadig efter marts 2026's
Potalot-viden i 2028.

Det gør proveniens endnu vigtigere: ikke kun for at vide hvad vi må
overskrive, men for at kunne **afvikle** unødvendige maskinelle snapshots
helt.

## Fremgangsmåde (Annas rækkefølge, 26/8)

1. For hver afvigelse: sammenlign den gemte værdi med den master/autofill-
   version der fandtes, **da posten blev oprettet** (guide-historik i git).
2. Klassificér efter de tre fejltyper ovenfor, og efter proveniens:
   `gammel Potalot-autofill` · `brugerændret` · `ukendt provenance`.
3. Gammel autofill → migrér ELLER fjern snapshottet (se beslutningen ovenfor).
4. Dokumenterede brugerændringer → **bevares** som override.
5. Ukendt provenance → **overskrives ikke automatisk endnu.**

**Ingen writes før klassifikationen ligger på bordet.**

### Beviskrav til `source = potalot`

`updated_at` alene beviser ingenting — den flytter sig ved enhver redigering
(også et fotoskift). `updated_at == created_at` er et stærkt signal om ren
maskinel autofill uden senere menneskelig berøring, men **ikke nok til en
write-operation** (Anna 26/8).

Det stærke fingeraftryk er: rekonstruér den autofill-version der fandtes ved
oprettelsen, og se om den matcher den gemte værdi **præcist**. Gør den det,
er posten maskinel med høj sikkerhed.

De fem poster med `updated_at == created_at`: begge Radiser, Chili Jalapeno,
Tomat Ananas, Agurk Marketmore, Salat Crispy Mint.

## De 11 afvigelser (Annas base, 25/8)

Gemt vs. hvad `resolveFroebankVinduer` ville svare i dag.
⚠ = skjuler et gyldigt augustråd.

| Pose | Gemt saa / ud | Resolver saa / ud | Oprettet | Rørt senere |
|---|---|---|---|---|
| ⚠ Radise Cherry Belle | [3,4,5] / [] | [3-9] / [] | 2026-06-13 | nej |
| ⚠ Radise French Breakfast | [3,4,5] / [] | [3-9] / [] | 2026-06-13 | ja |
| ⚠ Salat Crispy Mint | [3-8] / [] | [2-8] / [3-8] | 2026-05-22 | nej |
| Agurk Marketmore | [4,5] / [6] | [4,5] / [5,6] | 2026-05-20 | nej |
| Bladbede Rainbow Chard | [3-7] / [] | [4-7] / [] | 2026-08-20 | ja |
| Chili Habanero Orange | [2,3] / [5,6] | [1,2,3] / [5,6] | 2026-05-20 | ja |
| Chili Jalapeno | [2] / [5,6] | [1,2,3] / [5,6] | 2026-07-16 | nej |
| Chili Padron | [2] / [5,6] | [1,2,3] / [5,6] | 2026-07-16 | ja |
| Dahlia Night Silence | [3,4,5] / [5,6] | [3,4] / [5,6] | 2026-05-14 | ja |
| Peberfrugt California Wonder | [2] / [5,6] | [2,3,4] / [5,6] | 2026-07-16 | ja |
| Tomat Ananas | [2] / [5,6] | [3,4] / [5,6] | 2026-07-16 | nej |

Genskab listen med `scripts/`-engangsscript der kører
`resolveFroebankVinduer(name, variety)` mod `inventory_items` — se
`src/lib/froebank-autofill.ts`.

## Den varige løsning: provenance på felterne

Arkæologien er kun nødvendig, fordi posen ikke husker hvor værdien kom fra.
Konceptuelt (Anna 26/8):

```ts
sowingMonthsSource: 'potalot' | 'user' | 'import'
```

Med provenance kan Potalot migrere sine egne gamle autofills frit og lade
brugerens rettelser stå — uden at gætte. Kræver migration + skrivning fra
alle fire indgange (manuel oprettelse, import-merge, backfill, redigering).

## Hvorfor det haster mindre, end det ser ud til

Crispy Mint er beviset på at read-time resolution var den rigtige
arkitektur: **Kalenderen kan være korrekt, mens databasen stadig indeholder
historisk rod.** Det giver plads til at rydde op i ro — uden at gøre
produktionsbrugerne til forsøgskaniner.

## Bagefter: guidehullerne

Motoren skal fortsat TIE om dem, indtil Potalot faktisk ved noget.

- Guide findes, men dyrkningsfakta er tomme: **Ærteblomst, Artiskok, Dild,
  Rabarber**
- Ingen guide overhovedet: **Engkarse, Hirse, Klokkeranke, Lupin**

## Låst regel (ANNA 26/8) — rør ikke uden ny beslutning

> På guideniveau betyder et tomt månedsvindue "ingen override tilgængelig",
> og resolveren søger videre mod artsniveauet. Et ikke-tomt sortsvindue
> overstyrer artens vindue for netop den handling.

Skal Potalot senere kunne udtrykke "denne sort må eksplicit IKKE direkte
sås", kræver det et særskilt signal i guidekontrakten — en egentlig
override-status eller `null` med defineret semantik. **Ikke endnu en
hemmelig betydning af `[]`.**

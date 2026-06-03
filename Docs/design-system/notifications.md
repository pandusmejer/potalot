# Potalot — notifikationer

> **Formålet med denne doc:** Lås notifikationernes DNA mens resten
> af Potalots DNA stadig er friskt i hukommelsen. Det er et
> 2-3 siders dokument der definerer **hvordan Potalot taler** — ikke
> et færdigt design.
>
> Hvis denne doc ikke eksisterer, skriver nogen om 8 måneder
> *"Din aktivitet er blevet opdateret"*, og ingen kan huske hvorfor
> appen oprindeligt føltes som en stille, gennemtænkt havebog.

---

## 1. Formål

**Hvorfor sender Potalot notifikationer?**

| ✅ Vi sender for at | ❌ Vi sender IKKE for at |
|---|---|
| Hjælpe brugeren med **timing** (frost, høst, prikling) | Skabe engagement for engagementets skyld |
| Hjælpe brugeren med **læring** (ny guide, sæsonindsigt) | Lokke brugeren tilbage uden konkret værdi |
| Hjælpe brugeren med at **huske** (planlagte gøremål) | "Vi savner dig"-beskeder |
| Hjælpe brugeren med at **opdage** (sorter, teknikker) | Markedsføring forklædt som indhold |

Hvis en notifikation ikke kan svare på *"Hvad bliver brugeren
gladere/klogere/bedre forberedt af?"* — så send den ikke.

---

## 2. Notifikations-hierarki

Fire niveauer. Brugeren skal kunne styre støjen pr. niveau separat.

| Niveau | Karakter | Eksempler |
|---|---|---|
| **1. Kritisk** | Tidsfølsomt, kan tabes hvis missed | Frost i nat · Udplantning nu · Høst nu |
| **2. Vigtigt** | Anbefalede handlinger, men ikke uopretteligt | Forspiring starter snart · Frø klar til høst · Plante mangler vand |
| **3. Inspiration** | Opdagelse, intet pres | Ny guide · Ny challenge · Populær sort |
| **4. Socialt** | Andre mennesker | Kommentar · Like · Nyt medlem · @-omtale |

### Brugerstyring

- Niveau 1 kan **ikke** muteres (men kan justeres pr. type)
- Niveau 2 kan muteres pr. plante eller pr. gøremål-type
- Niveau 3 kan slås helt fra
- Niveau 4 styres adskilt fra plante-notifikationer (vigtigt — se Fase 2 i `POTALOT_ROADMAP.md`)

---

## 3. Tone of voice

> Potalot skal lyde som en **erfaren haveven**. Ikke som Outlook.
> Ikke som en kommunal selvbetjeningsløsning. Ikke som en chatbot.

### Tre eksempler

| Stil | Eksempel | Hvad er der galt |
|---|---|---|
| ❌ Bureaukratisk | *"Handling påkrævet."* | Ingen kontekst, intet menneske |
| 🟡 OK | *"Dine San Marzano er klar til prikling."* | Korrekt, men kortfattet og mekanisk |
| ✅ Potalot | *"Dine San Marzano står tæt. Nu er det et godt tidspunkt at prikle dem."* | Beskriver tilstand, foreslår handling, lyder som nogen der har set planten |

### Tone-regler

- **Verber over substantiver** — *"Tid til at så dine ærter"* > *"Påmindelse: såning"*
- **Beskriv tilstand før handling** — *"Bladene gulner. Det er normalt — det er tid til at tage knoldene op."*
- **Indrøm usikkerhed** — *"Frost om natten, måske. Tjek varslerne hvis du kan."*
- **Brug navne** — *"Dine Marketmore"* > *"Dine planter"*
- **Drop udråbstegn** — Potalot taler roligt
- **Drop "Husk at"** — det er nedladende
- **Drop emoji i selve teksten** — emoji hører til arketype-mærket (se sektion 7), ikke til brødteksten

---

## 4. Format-regler

### Push-notifikation

```
Overskrift:    max 35 tegn
Brødtekst:     max 80 tegn
Handlinger:    én pr. notifikation
```

### Anatomi

```
[arketype-ikon]   OVERSKRIFT (max 35)
                  brødtekst der beskriver tilstand og foreslår
                  handling (max 80)
                  [primær handling]
```

### Eksempel

```
🌱   Dine San Marzano står tæt
     De er klar til prikling. Tag en weekendmorgen.
     [Åbn plante]
```

### In-app notifikation

Samme tekst-regler, men kan have:
- Tilknyttet billede (plante-foto eller faktakort)
- To handlinger (primær + sekundær, fx "Åbn plante" + "Udsæt 3 dage")
- Lille metadata-linje (klokkeslæt, hvilken plante)

### E-mail

Vises **kun** for niveau 1-2 og kun hvis push er slået fra eller missed.
E-mail er **ikke** push-i-e-mail-form — den må gerne være lidt længere
og rumme to-tre relaterede påmindelser samlet.

---

## 5. Timing-principper

**Tre regler der løser 80% af notifikations-fejlmønstrene:**

### Regel 1 — Forudgriben uden hysteri

Brugeren skal kunne handle. Lyn-varsler giver panik:

| Hændelse | Varsel-vindue |
|---|---|
| Frost om natten | 24 timer før |
| Udplantning klar | 7 dage før + på dagen |
| Frøhøst | inden for høstvinduet, ikke før |
| Vanding | kun hvis tørke er observeret + 24 timers vejrudsigt |

### Regel 2 — Aldrig om søndagen 17 push-beskeder

Community-notifikationer **batcher** automatisk:
- Færre end 3 events: send individuelt
- 3+ events inden for 2 timer: batches til *"5 nye kommentarer i Chili-entusiaster"*
- Same-day events: maks 3 push pr. dag pr. niveau

### Regel 3 — Stilletider respekteres

| Periode | Default |
|---|---|
| 22:00 - 07:00 | Stille (medmindre niveau 1 + akut) |
| Søn 06:00 - 09:00 | Stille (folk drikker kaffe) |

Brugeren kan tilsidesætte. Default er rolig.

---

## 6. Visuelt DNA (skitse-niveau)

### Princip

Notifikationen skal være **læsbar på 1.5 sekund**. Det er hvad
folk giver et push-banner mens de scroller noget andet.

### Komponenter at definere senere

| Komponent | Skitse-spørgsmål |
|---|---|
| **Arketype-ikon** | Kuratorisk udvalg, ikke Lucide-tilfældigt. 7 ikoner (se sektion 7). Samme stil som resten af Potalot — flat, ingen gradient. |
| **Farvekoder** | Niveau 1 må gerne være varm/jord-tone (ikke alarm-rød). Niveau 2-4 i Potalots eksisterende creme-palette. |
| **Badge-system** | Tæller? Dot? Pr. niveau eller samlet? Beslutning kommer når in-app inbox bygges. |
| **In-app kort** | Bruger samme card-DNA som GuideTechniqueCard (border-left accent, eyebrow + titel + body + arrow) — det er allerede et kendt Potalot-mønster. |
| **Push-design** | Begrænset af iOS/Android — kun ikon + tekst + max 1 billede. Vores frihed ligger i **stemningen** af ordene. |

### Anti-mønstre

- Røde tal-badges der råber. (Notifikations-tal som ikon-overlay er fint, men ikke i rød.)
- Notifikationer der vibrerer eller blinker.
- Multi-color emojis i overskriften.
- Brand-navnet i overskriften (*"Potalot: Dine tomater…"*) — appens ikon viser allerede hvem der taler.

---

## 7. Notifikations-arketyper

Syv kategorier som hele systemet bygger på. Hver har sit eget
ikon-mærke, sin egen tone-variation, og sin egen plads i hierarkiet.

| Mærke | Arketype | Trigger | Tone-variant | Niveau |
|---|---|---|---|---|
| 🌱 | **Dyrkning** | Plante-state-skifte (forspiring, udplantning, knibning) | Konkret, observerende | 1-2 |
| 📚 | **Læring** | Ny guide, sæsonindsigt, dybdedyk | Inviterende, rolig | 3 |
| 🏆 | **Challenge** | Sæsonudfordring, milestone | Opmuntrende, ikke kompetitivt | 3 |
| 👨‍🌾 | **Community** | Kommentar, @-omtale, gruppeaktivitet | Menneskelig, batchet | 4 |
| 📅 | **Kalender** | Gøremål forfalder, planlagt aktivitet | Tidsstemplet, faktuel | 2 |
| 🌦 | **Vejr** | Frost, hede, langvarig tørke | Direkte, ikke alarmerende | 1 |
| 🌾 | **Høst** | Frugt-/blomst-modning baseret på plante-state | Fejrende, lavmælt | 2 |

### Eksempler pr. arketype

```
🌱  Dyrkning
    Dine San Marzano står tæt
    De er klar til prikling. Tag en weekendmorgen.

📚  Læring
    Ny guide: Sådan opbinder du tomater
    Tre minutter, hvis du har en kop kaffe.

🏆  Challenge
    Du har sået 4 ud af 5 i marts-udfordringen
    En enkelt mere før månedens udgang.

👨‍🌾 Community
    5 nye kommentarer i Chili-entusiaster
    Habanero-tråden er aktiv i aften.

📅  Kalender
    I morgen: Gød dine Marketmore
    Du planlagde det for to uger siden.

🌦  Vejr
    Frost om natten, måske
    Tjek varslerne. Dine chiliplanter er endnu ikke hærdede.

🌾  Høst
    Café au Lait er på sit smukkeste
    Plukker du nu, holder den til weekenden.
```

---

## Sidste regel — den vigtigste

> Hvis du ikke ville sige det højt til en ven i haven,
> så send det ikke som push.

🌱

# Potalot terminologi-standard (ANNA-LÅST 11/8 2026)

Én beslutning pr. begreb — truffet efter tekst-auditten
(`potalot-text-audit.csv`). Al ny copy og alle korrektur-batches følger
denne liste. Afvigelser i eksisterende tekst rettes batch for batch, IKKE
som blind masse-erstatning.

| Begreb | Potalot-standard |
|---|---|
| Brand | **Potalot** (aldrig "PotAlot") |
| Gartner | **Gartneren** / **Potalot-gartneren** |
| Teknologi | Undgå **AI** i almindelig brugerflade |
| Eksempel | **fx** (aldrig "fx.", "Fx.", "F.eks.") |
| Guide | **guide / guides** (ikke "guider") |
| Guide-type | **artsguide / sortsguide / teknikguide** |
| Før såning | **forkultivering** som standard — se nuance nedenfor |
| Milepæl | **Pottet om** (ikke "Ompottet") |
| Handlinger | **Redigér / Annullér** (med accent) |
| Arbejde | **opgave / opgaver** (aldrig "tasks", "to-do") |
| Gamification | **udfordring** (ikke "challenge") |
| Frøbank-objekt | **frøpost** (ikke "element", "items") |
| Planteside | **Plantens historie** |
| Registreringshandling | **Log** / **Log nyt på planten** er OK |
| Tekniske tags/slugs | translitteration (ae/oe/aa) er OK internt |
| Synlige tags/navne | altid korrekt dansk **æ/ø/å** |
| Såsted/såtid | **såsted / såtid** (aldrig "så-sted", "så-timing") |
| Voksested | **voksested/dyrkningssted** — aldrig automatisk "bed" |
| Spiringsfase | **Venter på spiring** (brugerorienteret, ikke "Spiringsfasen") |

## Nuancer (Annas afgørelser)

- **"Log" forbydes IKKE.** Modellen er etableret og forståelig:
  *Log nyt på planten* = handlingen · *Plantens historie* = resultatet.
  Forsøg ikke at kalde begge dele "historie".
- **forspiring ≠ forkultivering i alle tilfælde.** De overlapper, men
  erstat ALDRIG blindt — kig på den konkrete forekomst.
  Læggekartofler *forspires* (kartoffel.md bruger termen korrekt).
- Interne id'er/slugs (fx `vinduskarm`, tags som `rodafgroede`) ændres
  ikke — kun de viste labels skal have korrekt dansk.
- **Statuscopy-princip (Anna 11/8):** *"Handling lykkedes. Hvad sker der
  nu?"* — bekræftelse først, dernæst næste tilstand, adskilt med punktum.
  Aldrig tankestreg, der får to systemtilstande til at ligne én overskrift
  (fx "Gemt. Gartneren ser på det …", ikke "Gemt — Gartneren kigger på det").
- **Intet minimumsantal råd (Anna 11/8, motor-regel):** "Lige nu"/"Denne
  uge" må vise 0-3 punkter. Ved Potalot kun én relevant ting, vises én
  ting; ved ingenting vises intet — aldrig "Bind op ved behov"/"Vand
  jævnt"-fyld for at nå tre linjer. Software har en dyb eksistentiel
  angst for tom plads; Potalot har ikke.
- **Karakterlaget (Anna 11/8, redaktionel regel):** Potalot må gerne
  personificere planten ("Hidsig · Frugtig · Krævende", "Temperament:
  Rolig") — det er en del af brandet. Men personificeringen må ALDRIG
  snige faglige påstande ind: "Nem", "bitterfri", "sødest et minut
  efter" er dyrknings-/sortspåstande og skal være groundet i data —
  ellers ud. Faktafelter præcise og datadrevne; karaktertekster legende.
  Vi polerer IKKE Potalot ned til en neutral havebog.
- **Demo-reglen (Anna 11/8):** Demo-observationer må være konkrete
  ("Alle fire planter klarede flytningen"); demo-RÅD og sammenligninger
  skal følge samme faglige standard som resten af Potalot.
- **Datagæt-princip (Anna 11/8, GAR-0017):** et interval fra en kilde
  (fx sådybde "2-5 mm") må ALDRIG konverteres til ét tal — intet
  gennemsnit/min/maks. Enkeltværdi → strukturert felt; interval → null
  (v1: værdien importeres ikke; maskinudtrukket metadata må ikke fylde
  brugerens eget notatfelt).

## Status

- P0-rettelserne fra auditten (KAL-0125, SYS-0319, GED-0761, GED-1229,
  GED-0387, GED-1058) er implementeret 11/8 efter Annas godkendte ordlyd
  (cikorie-sektionen slettet — typerne var allerede forklaret; pak choi
  omskrevet til ren botanisk skelnen).
- Korrektur-rækkefølge: **Gartneren (alle 163 rækker, fokus på de 15
  flaggede)** → Frøbank → Planter. Arbejdskopi med beslutningskolonner
  vedligeholdes af Anna; masterfilen `potalot-text-audit.csv` forbliver
  urørt census.

## Kalenderens låste regler (Anna 11/8)

1. **Vejrtekst kræver faktiske vejrdata.** Ingen hardcodede tal eller
   vejrpåstande som fallback — varsler (GardenAlerts) er de eneste
   gyldige signaler; intet varsel = ingen vejrnote, ingen målings-tal.
2. **"Denne uge"/adaptive råd kræver et aktuelt signal** (brugerdata,
   guidefakta, kalenderdata eller vejr). Sæsonprosa må aldrig forklædes
   som ugentlig intelligens eller "aktuel vurdering".
3. **Kalenderen må vise færre råd.** Ingen filler for at fylde et
   bestemt antal cards/chips.
4. **Dynamiske arts-/sortsnavne må aldrig lowercases mekanisk** — byg
   sætninger, der ikke kræver det ("Så ${navn} nu", ikke "Tid til at så
   ${navn.toLowerCase()}").
5. **Frøbank-/guidefakta må udløse timing, ikke løfter.** "Såvinduet er
   åbent" er data; "sår du nu, når den at give i år" er en slutning.
6. **Kurateret månedscopy må være legende** — personlighed er ikke et
   korrekturproblem.
7. **Botaniske inspirationspåstande skal have en kilde** — hele
   src/lib/inspiration.ts behandles som redaktionelt datasæt (fagligt
   systemtjek udestår), ikke som fri UI-copy.
8. **Legacy slettes, ikke smukkeseres.**

## Navigation & profil-reglerne (Anna 12/8)

1. **Auth:** Brugeren må aldrig se en rå fejl fra Supabase/Postgres/HTTP
   — kendte fejl mappes til dansk (src/lib/auth-fejl.ts), resten får
   kontekstuel dansk fallback + log.
2. **Privatliv-undtagelsen:** "AI" er tilladt og NØDVENDIG, når Potalot
   forklarer teknologi og databehandling. "Ingen AI-brand" gælder
   produktoplevelsen, ikke juridisk gennemsigtighed.
3. **Indstillinger:** Ingen roadmap eller status på endnu-ikke-byggede
   features mellem reelle indstillinger.
4. **Onboarding:** Potalot er afsender — aldrig systemets "jeg".
5. **Notifikationer:** Tidspunkt uden moralsk gæld — "Planlagt til i
   går", ikke "Skulle være gjort".
6. **Tekniske processer:** Beskriv hvad brugeren FÅR ("Find planter og
   frø"), ikke hvad parseren hedder ("Fortolk").
7. **Brand:** Potalot konsekvent i al displaytekst og metadata; interne
   slugs/tekniske identifiers røres kun, hvis det er sikkert og
   nødvendigt.
8. **Humor bevares**, når den bærer Potalots stemme ("Vi interesserer os
   mere for dine tomater end dine persondata", "Haven er glæde, ikke et
   KPI-projekt").

## Tekst-audit 2/9 2026 — nye låste regler (Anna)

1. **Udfordringer, ikke Challenges.** Fanen hedder *Udfordringer*,
   singularis *Udfordring*, og copy bøjes naturligt på dansk ("Opret en
   udfordring", "Ingen aktive udfordringer i denne måned"). Interne
   route-, type- og kategorinavne (`challenges`, `challenge_entries`,
   `unreadByCategory.challenges`) bliver stående — vi retter
   brugerfladen, ikke kontrakten.

2. **Kategori-formatteren er tre-lags.** `general_garden_tasks.category`
   må ALDRIG vises rå. Rækkefølgen er:
   - **Lag 1 — kendt:** canonical værdi eller *dokumenteret* alias →
     label fra `CATEGORY_LABELS`.
   - **Lag 2 — ukendt, men sikker dansk:** normaliseres **kun
     typografisk** (versalisering; gendannelse af æ/ø/å når den
     ASCII-strippede tvilling af et eksisterende dansk ord er
     dokumenteret) og vises. `drivhus` → *Drivhus*. `klargoering` →
     *Klargøring*, fordi `klargøring` findes i forvejen.
   - **Lag 3 — ukendt og slug-/kodeagtig:** → *Andet* + log til
     redaktionel oprydning.

   **Lag 2 er typografi, aldrig semantik.** At gætte at
   `vinterklargoering` "nok betyder" en bestemt canonical kategori er
   forbudt, medmindre aliaset er dokumenteret i lag 1. Vi genskaber
   bogstaver, vi opfinder ikke betydning.

   De 6 canonical kategorier er fortsat systemets officielle sæt. De
   ~118 produktionsrækker, hvis kategori er et *sted*, en *plantetype*
   eller en *anledning* (drivhus, græsplæne, blomster, biodiversitet,
   halloween …), er en anden akse, der aldrig er blevet modelleret — de
   overlever via lag 2, indtil nogen beslutter, om aksen skal findes.
   Ingen prod-datawrites i denne omgang.

3. **`repot` hedder "Prikl om".** Alle nuværende anvendelser af typen er
   prikling, og runtime behandler dem allerede sådan. Labelen beskriver
   den faktiske betydning — den er ikke en påstand om, at prikling og
   ompotning er samme handling. Den skelnen skal modelleres rigtigt
   senere: se `Docs/product/prikling-vs-ompotning-backlog.md`. Ingen
   `task_type`-kontraktændring i en korrektur-batch.

4. **Interne ASCII-nøgler er ikke datafejl.** Flere af Potalots enums
   bruger ASCII som intern repræsentation — kategori-nøglerne
   `saaning`, `hoest`, `planlaegning`, `jord`, `pleje`, `beskyttelse`,
   guide-tags som `varmekraevende`, slugs fra `slugifySted()`. Det er
   *kanoniske identifikatorer*, ikke fordansket tekst der er gået i
   stykker, og de skal blive i ASCII: de er nøgler i kode, data og URL'er.

   Fejlen er aldrig, at nøglen er ASCII. Fejlen er, at UI'et viser den
   råt. **Enhver enum-, slug- eller nøgleværdi skal gennem en formatter,
   før den bliver til synlig tekst** — og findes der ingen label for en
   værdi, er det formatterens ansvar at falde tilbage, ikke visningens
   at improvisere.

   Konsekvensen er praktisk: når `saaning` optræder i en badge, er
   rettelsen at kalde `CATEGORY_LABELS` — ikke at skrive om i databasen.
   En "æ/ø/å-oprydning" i en nøglekolonne ødelægger kontrakten uden at
   løse noget.

## Batch 3 — terminologisk integritet (Anna 3/9 2026)

Målt før rettet: hvert par nedenfor er tjekket mod datamodel, live-DB og
kaldesteder (`Docs/content/batch-3-terminologi-beslutningsrapport.md`).
Reglen bag batchen: **samme ord kan dække to ting, og to ord kan dække én
ting — ensret aldrig på ordlyd alene.**

| Begreb | Potalot-standard |
|---|---|
| Frøposens år | **Købsår** (feltet `purchase_year`). Import-headeren må stadig sige "årgang"; brugerfladen siger aldrig Årgang. Datoen hedder **Købsdato**. |
| Købsår i AI-udtræk | Kun når posen/siden faktisk angiver et købs-/anskaffelsesår. Produktions-, pakke- eller sæsonår er **ikke** købsår; kan det ikke bestemmes, er feltet tomt. |
| Kategorien `indkoebsliste` | **Ønskeliste** (id'et er uændret). "Gem til senere" er Gartnerens gemte svar — en anden model, et andet ord. |
| Opgavetypen `pre_sow` | **Forkultivér** (verbet), **Forkultivering** (feltet). "Forspir" kun i regeltitler, hvor det er fagligt korrekt (læggekartofler, knolde). |
| Opgavetypen `plant_out` | **Plant ud** (verbet), **Plant ud** (feltlabel), **Udplantet** (log/status). Aldrig "Udplant". |
| Guidens `sowingMonths` | Er kontraktens **forkultiveringsvindue** og hedder **Forkultivering** i faktaboksen. `directSowingMonths` hedder **Direkte såning**. Ordet "Såning" alene bruges ikke som feltlabel — det er bredere end feltet. |
| Prikling ↔ ompotning | To handlinger. Opgaven `repot` = **Prikl om**; log-typen `repotting` = **Pottet om**. En fuldført prikle-opgave logges som neutral log med overskriften **Priklet om** — aldrig som `repotting`. Kalenderens spirer-stadie siger **Skal prikles om**. Modellen splittes i `Docs/product/prikling-vs-ompotning-backlog.md`. |
| Lys/vand-labels | Altid `LIGHT_META` / `WATER_META` — ingen lokale tabeller. `regular` = **regelmæssig**. |
| Enums i prompter | Statusnøgler går gennem `PLANT_STATUS_META`, før de sendes til Gartneren (regel 4 fra 2/9 gælder også AI-kontekst). |
| Georgine / Dahlia | **Dahlia** er canonical art; **Georgine/Georginer** er artsalias (arts-model.ts). Prosa må sige georginer, hvor det falder naturligt. |
| Aftenerne / aftnerne | Begge korrekte. Ingen regel. |

### Valideringscopy — fem skabeloner

Native `required` beholdes, hvor det er den faktiske mekanisme; browserens
tekst er lokaliseret og tilgængelig. Skabelonerne gælder de app-fejl,
brugeren faktisk kan nå.

| Fejltype | Skabelon |
|---|---|
| Tomt felt | "Skriv et/en [felt]." · "Vælg [ting]." |
| Længde | "[Felt] må højst være N tegn." · "[Felt] skal være mindst N tegn." |
| Format | "Indtast et gyldigt [X] ([format])." |
| Interval | "Højst N [ting] pr. [enhed]." |
| Findes ikke | "Vi kunne ikke finde [ting]. Måske er den allerede slettet." |

Ingen central valideringshjælper: beskeden varierer kun på feltnavnet, og
det er det, en helper ville skjule. Kodeordstekster har dog én kilde
(`src/lib/kodeord.ts`).

### Uploadgrænser (D4)

Én levende billedvej (`/api/upload`). Bucketten er den reelle grænse:
**10 MB**, og route, klient og copy skal sige det samme tal
(`src/lib/upload-graenser.ts`). HEIC har sin egen, dokumenterede grænse
(konverterings-hukommelse). Excel (5 MB) og diktafon (25 MB / 120 s) er
separate kontrakter og skal ikke ensrettes.

### Parkeret som model-backlog (ikke korrektur)

- Stadiet før udplantning og 35-dages-reglen:
  `Docs/product/plantestadie-state-machine-backlog.md`
- UserMode vs. NotificationProfile:
  `Docs/product/notifikationsprofil-vs-usermode-backlog.md`

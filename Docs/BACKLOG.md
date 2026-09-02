# Potalot — Backlog

## Højt prioriteret

### Arts-fallback-fotos i stedet for forbogstav (juni 2026)

Foto-løse plante-kort (sort-kort, I fokus-strippen) viser i dag en
status-farvet blok med sortens forbogstav. Det er ærligt — men det
føles stadig som et systemhul.

Bedre: generér fallback fra Potalots billedbibliotek på ARTS-niveau:

```
Salat  → generisk salatfoto
Tomat  → generisk tomatfoto
Chili  → generisk chilifoto
```

Arts-foto er næsten altid bedre end et bogstav — og det respekterer
stadig "forkert billede er værre end intet billede"-reglen, fordi
arts-fotoet er ÆRLIGT om granulariteten (det lover ikke at vise den
specifikke sort).

Implementering: udvid `resolvePotalotImage`-fallback-kæden med et
arts-trin (rolle: arts-hero fra `public/images/arts/`) markeret som
`source: 'arts-fallback'` så kortet evt. kan vise en lille
"artsfoto"-markering. Konkrete huller pr. juni 2026: salat (intet
arts-foto), stangbønne (intet arts-foto) — de to skal produceres
før mekanismen kan dække demo'en.

### Frøbank-rækkevidde som editorial sætning (juni 2026 — flagget)

"Rækker · ~17 sæsoner" som fakta-celle er muligvis stadig data
frem for indsigt. Hvis Annas browser-QA bekræfter mistanken:
flyt afledningen til frøkortets detalje-/udvidede visning som
editorial note: "188 frø tilbage. Nok til cirka 17 sæsoner." —
eller endnu mere Potalot: "Du kommer sandsynligvis ikke til at
mangle frø foreløbig."

### Månedens udfordring i Kalenderen er parkeret i kode (sept. 2026)

`src/components/havekalender/kalender-client.tsx:383` indeholder en
færdigbygget blok bag `{false && …}`: eyebrow "Månedens udfordring",
kort med `challengesForMonth(valgtMaaned)` og link til `/havelandskab`.
Den har været slået fra siden cc96eb9 (29. maj 2026) — tre måneder, så
det er en parkering, ikke en midlertidig toggle.

Det er **død produktfunktionalitet, ikke korrektur.** Tekst-auditten 2/9
lod den bevidst ligge: den skal enten genoplives eller slettes, og den
skal ikke oversættes undervejs.

Beslutningen der mangler: skal Kalenderen overhovedet vise en indgang
til sæsonudfordringerne, nu hvor `/havelandskab` findes som selvstændig
flade? Hvis ja, skal blokken QA'es mod nuværende data (den blev bygget
før udfordringerne fik deres egen side). Hvis nej, skal den slettes
sammen med `challengesForMonth`-importen.

Bemærk: blokken er også det eneste sted i repoet, der bruger ordene
"Månedens udfordring" og "sæsonudfordringer". Slettes den, forsvinder
den danske term fra kodebasen — så skal terminologien i
`Docs/content/potalot-terminologi.md` (punkt 1, Udfordringer) bære den
alene.

## Havens stue — V9-features (12. juni 2026, principper låst i havebog.md)

Annas "design et sted man har lyst til at være"-prompt. Hero V2
(hilsen + dagtæller) og "I dag i haven"-omdøbningen er bygget;
disse fem er egne sprints. Principperne står i havebog.md §V9 —
læs dem FØR implementering.

PRIORITERING (Annas, 12. juni 2026): 1. Tal til din have →
2. Inspirér mig → 3. Bedrifter → 4. Fra have til køkken →
5. Dyrkerniveau. "De fire sidste bliver stærkere af data; Tal til
din have skaber data uden at føles som registrering."

STRUKTUR-KRAV (havebog.md §V10): nye moduler får IKKE egne faste
pladser på siden — de registreres i det levende lags kuratering
(src/lib/levende-lag.ts, 1-2 moduler ad gangen). Undtagelse:
Tal til din have placeres som Havebogens HOVED-CTA efter dagens
indsigt — bogens ene aktive handling.

### Tal til din have (stor — kræver lyd + AI-pipeline)

Den PRIMÆRE registreringsoplevelse, ikke en note-funktion. Bruger
taler 15 sekunder ("Tomaterne ser triste ud efter regnen") →
transskription → Potalot udleder opgaver/noter/minder/læring uden
ekstra arbejde. Placeres højt i Havebogen. Filosofi: frisk luft
før skærmtid. Kræver: mikrofon-UX, speech-to-text, Claude-parsing
til strukturerede forslag, bekræftelses-flow (intet skrives uden
brugerens ja).

### Dagens indsigt niveau 1 — frøbank-baserede indsigter

"Du har ingen rodfrugter i din frøbank. Mange dyrkere lykkes
overraskende godt med rødbeder som første rodfrugt." Kræver
kategori-data fra inventory i havebog-actionen + kuraterede
kombinations-indsigter (Korona/Malwina-mønstret). Niveau 2-3
findes allerede (V8-opdagelsesmotoren).

### Dyrkerniveau (spejdermærker, ikke gamification)

Spirer → Dyrker → Selvforsyner → Haveentusiast → Havekender.
Fortjent, ikke optjent — ingen XP/points/achievements. Kræver
beslutning om kriterier pr. niveau (afledt af logs/sæsoner) og
hvor det bor i Havebogen ("dyrkeren er hovedpersonen").

### Bedrifter (kapitler, ikke badges)

"Første tomat høstet" · "Første succes med hvidløg" · "100 planter
dyrket" · "Første registrerede bestøver". Læses som kapitler i
brugerens historie. Overlapper med Minder (sæsonens førster) —
afklar forholdet: Minder = denne sæson, Bedrifter = hele dyrker-
livet?

### Inspirér mig (én magisk knap)

ÉT forslag ad gangen — ingen feed, ingen scroll, ingen Pinterest.
Anbefal muligheder, ikke produkter: "Du dyrker ingen rodfrugter →
prøv Detroit 2." Datakilde: frøbank-huller + guide-katalog +
sortskombinationer.

### Fra have til køkken (spisekammer i Havebogen)

"Du har 4 høstklare auberginer → moussaka, baba ganoush."
Kræver: høstklar-afledning pr. art (findes delvist i afledninger)
+ kurateret opskrifts-mapping pr. art (IKKE ekstern API i MVP).

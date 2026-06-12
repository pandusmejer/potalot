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

## Havens stue — V9-features (12. juni 2026, principper låst i havebog.md)

Annas "design et sted man har lyst til at være"-prompt. Hero V2
(hilsen + dagtæller) og "I dag i haven"-omdøbningen er bygget;
disse fem er egne sprints. Principperne står i havebog.md §V9 —
læs dem FØR implementering.

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

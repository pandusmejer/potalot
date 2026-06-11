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

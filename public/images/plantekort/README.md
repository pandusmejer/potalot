# Billeder i Potalot — sådan tilføjer du nye

**Dette er det ENESTE sted, appen henter billeder fra.** Læg altid nye fotos her
i hovedmappen (`public/images/…`) på branchen `feature/havebog` — aldrig i en
worktree.

## Mapper (rollebaseret)

| Type | Mappe |
|------|-------|
| Plantefoto (plantekort-hero, Mine planter) | `public/images/plantekort/` |
| Frøbanks-/frøkort-billede | `public/images/frokort/` |
| Billede af hele arten | `public/images/arts/` |
| Nærbilleder (makro) | wires i `src/data/potalot-image-sets.ts` |

Filnavnet er plantens **slug**: småt, `æ→ae ø→oe å→aa`, accenter væk, mellemrum → bindestreg.
Fx `Tomat` + `San Marzano` → `tomat-san-marzano.jpg`.

## Tilføj et nyt foto — brug scriptet (anbefalet)

Fra projektroden `/Users/mejervind/potalot`:

```bash
npm run add:photo <fil> <plantekort|frokort|arts> "Art" ["Sort"]
```

Eksempler:
```bash
npm run add:photo ~/Desktop/tomat.jpg  plantekort "Tomat" "San Marzano"
npm run add:photo ~/Desktop/chili.png  frokort    "Chili" "Jalapeño"
```

Scriptet: danner slug'en, **nedskalerer + komprimerer** (≤1800px, q82 — så intet
6 MB-foto slipper ind), lægger filen i rette mappe og **regenererer manifestet**.

## Få det live
```bash
git add -A
git commit -m "foto: <navn>"
git push origin feature/havebog
```
→ merge pull request'en til `main` på GitHub → Netlify deployer automatisk.

## Vigtigt
- Appen bruger KUN filer, der står i `src/data/image-manifest.generated.ts`.
  `add:photo` opdaterer det automatisk; lægger du en fil ind i hånden, så kør
  `npm run scan:images` bagefter.
- Store, ukomprimerede billeder gør siden langsom. Lad altid `add:photo`
  (eller `sharp`) komprimere først.

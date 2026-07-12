# Havebog — sektions-fotos

Læg fotos til **Havebogens nederste kort-sektioner** her. Ét foto pr. fil,
navngivet med sektionen først, så det er til at finde:

```
public/images/havebog/
  proev-naeste-aar-<navn>.jpg      # kort 1: hero + små forslag
  maaske-du-ogsaa-<navn>.jpg       # kort 2: frøavl m.m.
  paa-denne-dag-<navn>.jpg         # kort 3: minde-foto (stort, mørkt)
  naeste-projekt-<navn>.jpg        # kort 4: fx insekthotel  ← MANGLER
  ...
```

## Sådan gør du
1. Læg filen her med et sigende navn (fx `naeste-projekt-insekthotel.jpg`).
2. Sig til hvilken sektion den hører til — så wirer jeg stien ind i koden.

## Regler
- **Komprimér/nedskalér** før upload (store fotos ≤ ~1600px bred, JPEG ~80%).
  Undgå de 5–6 MB-originaler.
- Beskæring: kortene bruger `object-fit: cover`, så motivet må gerne have
  luft i kanten. Stående format passer bedst til "På denne dag".

## Undtagelse — afgrøde-/sort-specifikke fotos
Hvis fotoet er knyttet til en bestemt **afgrøde eller sort** (og også kan
bruges i Forvandlinger-mosaikken), hører det i stedet hjemme under
`public/assets/forvandlinger/crops/<afgrøde>/` — det er dét system, der fx
leverede "Gem tomatfrø"-billedet til kort 2.

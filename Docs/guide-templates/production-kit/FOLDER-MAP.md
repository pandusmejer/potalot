# Potalot — mappe-kort (hvad ligger hvor, og hvad skal placeres hvor)

Kortlægning af alle guide- og billed-mapper, deres funktion, og reglen for hvad
der placeres hvor. Afspejler koden på `main`. **Én fremgangsmåde — ryd op, ikke
genopfind.**

---

## 1. Guide-tekst (indhold)

| Mappe | Funktion | Committes? | Hvem skriver |
|-------|----------|-----------|--------------|
| `content/guide-production/generated/` | **JSON-kø.** ChatGPT-batchens `.json` lander her (matcher `guide.schema.json`). | nej (ephemer) | ChatGPT |
| `content/guide-production/built/` | **Kandidat-`.md`.** `guides:build` skriver hertil. Aldrig live. | nej | maskine |
| `content/guides/` | **LIVE guides** (`.md`). Importeres til appen + DB. Kun `guides:promote` skriver hertil. | **ja** | promote |
| `content/guide-production/species.csv` · `varieties.csv` | Plan/input: arter og sorter + kontrollerede fakta. | ja | menneske |
| `content/guide-production/status.json` | Livscyklus-ledger (`draft`/`reviewed`/`approved`/`imported`). Aldrig i selve teksten. | ja | `guides:mark` |
| `Docs/guide-templates/` | **Kontrakt-kilden** (schema, editorial-rules, skabeloner, eksempler). Dette kit er en portabel eksport heraf. | ja | menneske/Claude |

**Afledt (rør ikke manuelt):**
| Fil | Genereret af |
|-----|--------------|
| `src/data/guides-imported.ts` (`IMPORTED_GUIDES`) | `import:guides` fra `content/guides/*.md` — driver bibliotek + detaljeside |
| DB-tabel `public.guides` (master-rækker, `user_id NULL`) | `guides:sync-master` — driver auto-kobling ved oprettelse |

---

## 2. Billeder — ét motiv pr. slug, mappe efter ROLLE

**Reglen: mappen afgøres af guidens NIVEAU/rolle, filnavnet er guidens EGEN slug.**
Appen læser aldrig fra indbakkerne — kun fra `public/images/`.

| Mappe | Rolle | Til hvilke guides | Filnavn |
|-------|-------|-------------------|---------|
| `public/images/arts/` | **Artsguide-hero** — HELE planten som botanisk reference | art (species) | `<slug>.jpg` |
| `public/images/plantekort/` | **Plantekort** — tæt, levende makro; bruges som guide-hero OG plante-kort under Planter | sort (variety) | `<slug>.jpg` |
| `public/images/frokort/` | **Frøkort** — isoleret premium produktkort (frøbank) | sort/art | `<slug>.png\|jpg` |
| `public/images/makro/` | Tekniske makrofotos (struktur/frugt/blad…) | efter behov | `<slug>/<navn>.jpg` |

> **Plantekort samles ÉT sted:** `public/images/plantekort/`. Samme fil fodrer
> både guide-hero (`variety-hero`) og Planter-kortet (`plant-card`) via
> asset-convention — ingen dobbeltproduktion. Arts-hero hører i `arts/`, ikke
> plantekort.

> **Teknikguider har ingen fotohero** (kun farveblok + titel + labelen
> TEKNIKGUIDE). De har derfor ingen dedikeret hero-mappe — trin-fotos hentes fra
> artens `public/images/makro/<art>/`. Ingen ny billedmappe pr. teknik.

**Afledt:** `src/data/image-manifest.generated.ts` (genereret af `scan:images`),
`src/data/potalot-image-sets.ts` (kuraterede roller pr. slug).

---

## 3. Indbakker + arkiv (git-ignored, aldrig committet)

| Mappe | Funktion |
|-------|----------|
| `_guide-indbakke/` | Drop guide-`.json` (eller `.zip`) her → `guides:intake` behandler dem. (LÆS-MIG er sporbar.) |
| `_foto-indbakke/` | Drop fotos her, navngivet efter guiden. `guides:intake`/`add:photo` komprimerer + placerer. |
| `_foto-arkiv/` | Høj-opløste **originaler** flyttes hertil efter placering — slettes aldrig. |

---

## 4. Hvor fotos ender (fuld sti, eksempel)

```
_foto-indbakke/tomat-sungold.jpg   (drop, original)
   │  guides:intake  (sort → plantekort, guidens slug)
   ├─→ public/images/plantekort/tomat-sungold.jpg   (komprimeret, DET appen bruger)
   └─→ _foto-arkiv/tomat-sungold.jpg                (original bevaret)
```

For en art: `_foto-indbakke/salat.jpg` → `public/images/arts/salat.jpg`.

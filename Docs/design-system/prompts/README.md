# Potalot — billed-prompts

> Tonal og kompositorisk specifikation for de billedtyper der lever i
> Potalots billedsystem. Brugt både til AI-genererede billeder
> (Midjourney, DALL·E, Stable Diffusion, Nano Banana m.fl.) og som
> rettesnor for fotografer og redaktører.
>
> Når der opstår en ny billedtype, så låses dens prompt her **inden**
> der genereres mange filer i stilen. Ellers ender vi med 200 makro-
> billeder hvoraf 80 er "ChatGPT-default-pinterest-bling".

---

## Eksisterende prompts

| Prompt | Billedtype | Mappe |
|---|---|---|
| [`makro-fotos.md`](./makro-fotos.md) | Makrofotos (Botanical Bleed, faktaboks-baggrunde, crops) | `public/images/makro/<slug>/` |

---

## Kommende (når de skrives)

| Prompt | Hvad | Status |
|---|---|---|
| `plantekort-fotos.md` | Sorts-hero (hele planten som "produkt" i appen) | Henvist til i makro-prompten, ikke skrevet endnu |
| `arts-hero-fotos.md` | Arts-hero (artsguide-hero, "wide-shot" af arten) | Ikke skrevet endnu |
| `frokort-fotos.md` | Fritlagte frø/frøposer til frøbanken | Ikke skrevet endnu |
| `maaneds-hero-fotos.md` | Hero pr. måned i kalenderen | Ikke skrevet endnu |
| `teknik-hero-fotos.md` | Hero til teknikguider (handlings-fokus) | Ikke skrevet endnu |

---

## Skriv en ny prompt

Når du skriver en ny prompt-doc, så følg samme struktur som
`makro-fotos.md`:

1. Hvad billedtypen er + hvor den lever (path)
2. Masterprompt (brug direkte til AI)
3. Formål
4. Output-specifikation (format, opløsning, farverum)
5. Motivprioritet
6. Komposition
7. Kamera-stil
8. Lys + farve + baggrund
9. "Potalot-testen" (5 spørgsmål til validering)
10. Det endelige mål
11. Forskel fra andre billedtyper i systemet

🌱
